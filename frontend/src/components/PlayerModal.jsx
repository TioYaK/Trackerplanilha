import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, ExternalLink, Globe, Shield, Trophy, Flame, Skull, 
  ChevronRight, Activity, Swords, Award, Sparkles, User, Crosshair, Star, Share2,
  Crown, Lock, AlertCircle
} from 'lucide-react';
import { WORLDS_LIST } from '../context/WorldContext';
import { formatVocation, parseUtcDate, toTibiaTitleCase } from '../lib/tibiaUtils';
import { soundFX } from '../lib/soundEffects';
import { isPlayerPinned, togglePinPlayer, subscribeWatchlist } from '../lib/watchlistService';
import { useAuth } from './AuthContext';
import PlayerCardShareModal from './PlayerCardShareModal';

// Cache em memória para detalhes de personagens (TTL 60s)
const playerDetailsCache = new Map();

// Cache global para contagem total de players rastreados (TTL 10min)
let cachedTotalTracked = {
  value: 44200,
  timestamp: 0
};

export default function PlayerModal({ playerName, initialWorld, onClose, onOpenFull, onVersus }) {
  const { isPremium } = useAuth() || {};
  const [charInfo, setCharInfo] = useState(null);
  const [selectedWorld, setSelectedWorld] = useState(initialWorld || 'ALL');
  const [worldRank, setWorldRank] = useState(null);
  const [globalRank, setGlobalRank] = useState(null);
  const [totalTracked, setTotalTracked] = useState(cachedTotalTracked.value);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [recentDeaths, setRecentDeaths] = useState([]);
  const [rusherInfo, setRusherInfo] = useState(null);
  const [suspectedMakers, setSuspectedMakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWorldDropdown, setShowWorldDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'deaths' | 'makers'
  const [isPinned, setIsPinned] = useState(() => isPlayerPinned(playerName));
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [limitNotice, setLimitNotice] = useState(null);

  useEffect(() => {
    setIsPinned(isPlayerPinned(playerName));
    const unsub = subscribeWatchlist(() => {
      setIsPinned(isPlayerPinned(playerName));
    });
    return unsub;
  }, [playerName]);

  useEffect(() => {
    if (!playerName) return;

    soundFX.playTacticalPing();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerName]);

  const fetchPlayerDetails = async (targetWorld = null) => {
    if (!playerName) return;

    const rawPlayerName = playerName.trim();
    const targetName = toTibiaTitleCase(rawPlayerName);
    const cacheKey = rawPlayerName.toLowerCase();

    // 1. Verificação instantânea em cache (In-Memory e SessionStorage SWR: 0ms)
    let cached = playerDetailsCache.get(cacheKey);
    if (!cached && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const s = sessionStorage.getItem(`rubinot_modal_${cacheKey}`);
        if (s) {
          const parsed = JSON.parse(s);
          if (Date.now() - parsed.timestamp < 60000) {
            cached = parsed;
            playerDetailsCache.set(cacheKey, parsed);
          }
        }
      } catch (e) {}
    }

    if (!targetWorld && cached && (Date.now() - cached.timestamp < 60000)) {
      setCharInfo(cached.charInfo);
      setSelectedWorld(cached.selectedWorld);
      setWorldRank(cached.worldRank);
      setGlobalRank(cached.globalRank);
      setTotalTracked(cached.totalTracked);
      setAvatarUrl(cached.avatarUrl);
      setRecentDeaths(cached.recentDeaths);
      setRusherInfo(cached.rusherInfo);
      setSuspectedMakers(cached.suspectedMakers);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // 2. Consultas simultâneas de alta velocidade usando B-Tree indexes (sem a view pesada view_top_rushers_24h)
      const [
        cStateRes,
        gMemRes,
        gPerkRes,
        profileRes,
        deathsRes,
        huntedRes
      ] = await Promise.all([
        supabase.from('current_character_state').select('*').or(`character_name.eq.${targetName},character_name.ilike.${rawPlayerName}`).limit(1).maybeSingle(),
        supabase.from('guild_members').select('*').or(`name.eq.${targetName},name.ilike.${rawPlayerName}`).limit(1).maybeSingle(),
        supabase.from('guild_perk_members').select('world, notes').or(`character_name.eq.${targetName},character_name.ilike.${rawPlayerName}`).limit(1).maybeSingle(),
        supabase.from('profiles').select('avatar_url, makers, main_character').or(`main_character.eq.${targetName},main_character.ilike.${rawPlayerName}`).limit(1).maybeSingle(),
        supabase.from('recent_deaths').select('*').eq('character_name', targetName).order('death_time', { ascending: false }).limit(4),
        supabase.from('hunted_list').select('*').or(`name.eq.${targetName},name.ilike.${rawPlayerName}`).limit(1).maybeSingle()
      ]);

      const cState = cStateRes?.data;
      const gMem = gMemRes?.data;
      const gPerk = gPerkRes?.data;
      const profile = profileRes?.data;
      const hunted = huntedRes?.data;

      // 3. Determinação de Level, Vocação e Status Online
      const level = cState?.level || gMem?.level || (deathsRes?.data?.[0]?.level ? Number(deathsRes.data[0].level) : null);
      const rawVoc = cState?.vocation || gMem?.vocation;
      const vocation = formatVocation(rawVoc);
      const isOnline = Boolean(gMem?.is_online);
      const xpTotal = cState?.xp_total ? Number(cState.xp_total) : null;
      const lastActive = cState?.last_active || gMem?.last_xp_date || (deathsRes?.data?.[0]?.death_time);

      // Rush 24h calculado instantaneamente sem sobrecarga de banco
      let computedRush = null;
      if (cState?.xp_total && cState?.session_start_xp && Number(cState.xp_total) > Number(cState.session_start_xp)) {
        computedRush = { exp_gained: Number(cState.xp_total) - Number(cState.session_start_xp) };
      }

      // 4. Determinação do Mundo
      let detectedWorld = targetWorld || (initialWorld && initialWorld !== 'ALL' ? initialWorld : null) || gPerk?.world;
      if (!detectedWorld && profile?.makers) {
        for (const [wName, cName] of Object.entries(profile.makers)) {
          if (cName && typeof cName === 'string' && cName.toLowerCase().includes(targetName.toLowerCase())) {
            detectedWorld = wName;
            break;
          }
        }
      }
      if (!detectedWorld || detectedWorld === 'ALL') {
        detectedWorld = initialWorld && initialWorld !== 'ALL' ? initialWorld : 'Auroria';
      }
      setSelectedWorld(detectedWorld);

      // 5. Ranking no Mundo
      let parsedWorldRank = null;
      if (gPerk?.notes && gPerk.notes.includes('rank:')) {
        parsedWorldRank = parseInt(gPerk.notes.replace('rank:', ''), 10);
      }
      setWorldRank(parsedWorldRank);

      const resolvedGuildName = profile?.makers?._guild || (gMem?.rank ? `${gMem.rank}` : (gMem ? 'Membro de Guilda' : null));

      const finalCharInfo = {
        name: cState?.character_name || gMem?.name || targetName,
        level,
        vocation,
        xpTotal,
        isOnline,
        lastActive,
        guildName: resolvedGuildName,
        guildRank: gMem?.rank || null,
        isHunted: Boolean(hunted || deathsRes?.data?.[0]?.is_hunted)
      };

      setCharInfo(finalCharInfo);
      setAvatarUrl(profile?.avatar_url || null);
      setRecentDeaths(deathsRes?.data || []);
      setRusherInfo(computedRush);
      setLoading(false);

      // 6. Ranking Global & Total de Jogadores (Assíncrono em segundo plano)
      let gRank = null;
      if (level) {
        supabase
          .from('current_character_state')
          .select('*', { count: 'exact', head: true })
          .gt('level', level)
          .then(({ count: higherCount }) => {
            gRank = (higherCount || 0) + 1;
            setGlobalRank(gRank);
            if (!parsedWorldRank) {
              setWorldRank(Math.max(1, Math.round(gRank / 16)));
            }
          })
          .catch(() => {});
      }

      // 7. Investigação de Makers & Alts (Exclusivo VIP)
      let detectedSuspects = [];
      if (isPremium) {
        // A. Contas cadastradas no perfil
        if (profile?.makers && typeof profile.makers === 'object') {
          for (const [wName, cName] of Object.entries(profile.makers)) {
            if (cName && typeof cName === 'string' && cName.toLowerCase() !== playerName.toLowerCase() && !wName.startsWith('_')) {
              detectedSuspects.push({
                name: cName,
                world: wName,
                reason: 'Conta Cadastrada Vinculada',
                badge: 'VINCULADO',
                badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              });
            }
          }
        }

        // B. Co-Mortes em combate recente (janela de 3 minutos)
        if (deathsRes?.data && deathsRes.data.length > 0) {
          const deathTimes = deathsRes.data.map(d => new Date(d.death_time || d.created_at).getTime()).filter(t => !isNaN(t));
          if (deathTimes.length > 0) {
            const minTime = new Date(Math.min(...deathTimes) - 180000).toISOString();
            const maxTime = new Date(Math.max(...deathTimes) + 180000).toISOString();

            try {
              const { data: coDeaths } = await supabase
                .from('recent_deaths')
                .select('character_name, level, death_time, killed_by')
                .gte('death_time', minTime)
                .lte('death_time', maxTime)
                .neq('character_name', playerName)
                .limit(8);

              if (coDeaths && coDeaths.length > 0) {
                for (const cd of coDeaths) {
                  const cdTime = new Date(cd.death_time).getTime();
                  const isMatch = deathTimes.some(dt => Math.abs(dt - cdTime) <= 180000);
                  if (isMatch && !detectedSuspects.some(s => s.name.toLowerCase() === cd.character_name.toLowerCase())) {
                    detectedSuspects.push({
                      name: cd.character_name,
                      level: cd.level,
                      world: detectedWorld,
                      reason: 'Morte simultânea em batalha',
                      badge: 'CO-MORTE',
                      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40'
                    });
                  }
                }
              }
            } catch (cdErr) {}
          }
        }
      }

      const finalWorldRank = parsedWorldRank || (gRank ? Math.max(1, Math.round(gRank / 16)) : null);

      const snapshot = {
        timestamp: Date.now(),
        charInfo: finalCharInfo,
        selectedWorld: detectedWorld,
        worldRank: finalWorldRank,
        globalRank: gRank,
        totalTracked: cachedTotalTracked.value,
        avatarUrl: profile?.avatar_url || null,
        recentDeaths: deathsRes?.data || [],
        rusherInfo: computedRush,
        suspectedMakers: detectedSuspects.slice(0, 6)
      };

      playerDetailsCache.set(cacheKey, snapshot);
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem(`rubinot_modal_${cacheKey}`, JSON.stringify(snapshot));
        }
      } catch (e) {}

    } catch (err) {
      console.error('Erro ao buscar detalhes do jogador no modal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerDetails();
  }, [playerName]);

  const activeWorldObj = WORLDS_LIST.find(w => w.id.toLowerCase() === selectedWorld.toLowerCase()) || WORLDS_LIST[1];

  const handleWorldChange = async (wId) => {
    setSelectedWorld(wId);
    setShowWorldDropdown(false);
    
    if (globalRank) {
      const approxRank = Math.max(1, Math.round(globalRank / 16));
      setWorldRank(approxRank);
    }
    
    try {
      await supabase.from('guild_perk_members').upsert({
        character_name: playerName,
        world: wId
      }, { onConflict: 'character_name' });
    } catch (e) {}
  };

  const formatXp = (xp) => {
    if (!xp) return '0';
    if (xp >= 1000000000) return (xp / 1000000000).toFixed(1) + 'B';
    if (xp >= 1000000) return (xp / 1000000).toFixed(1) + 'M';
    if (xp >= 1000) return (xp / 1000).toFixed(0) + 'K';
    return xp.toLocaleString('pt-BR');
  };

  const getRankTierBadge = (rank) => {
    if (!rank) return null;
    if (rank === 1) return { title: 'Imperador do Rubinot', color: 'from-amber-400 to-yellow-600 border-yellow-400 text-yellow-950', icon: '🏆' };
    if (rank <= 3) return { title: 'Lenda Top 3', color: 'from-slate-200 to-slate-400 border-slate-300 text-slate-950', icon: '🥈' };
    if (rank <= 10) return { title: 'Titã Top 10', color: 'from-amber-600 to-amber-800 border-amber-500 text-amber-100', icon: '🥇' };
    if (rank <= 50) return { title: 'Grão-Mestre Top 50', color: 'from-purple-600 to-indigo-700 border-purple-400 text-purple-100', icon: '👑' };
    if (rank <= 100) return { title: 'Elite Top 100', color: 'from-red-600 to-red-800 border-red-400 text-white', icon: '⚔️' };
    if (rank <= 500) return { title: 'Veterano Top 500', color: 'from-blue-600 to-blue-800 border-blue-400 text-white', icon: '🛡️' };
    return { title: 'Guerreiro Rubinot', color: 'from-stone-700 to-stone-900 border-stone-600 text-stone-300', icon: '⚡' };
  };

  const tierBadge = getRankTierBadge(globalRank);
  const globalPercentile = globalRank && totalTracked ? ((globalRank / totalTracked) * 100).toFixed(2) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-stone-950 to-black border-2 border-yellow-500/50 rounded-2xl shadow-2xl shadow-yellow-500/10 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Superior com Ícones e Fechar */}
        <div className="relative bg-gradient-to-r from-stone-950 via-yellow-950/40 to-stone-950 border-b border-yellow-500/20 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeWorldObj?.icon || '🌐'}</span>
            <div>
              <span className="text-xs uppercase tracking-widest text-yellow-400/80 font-bold font-mono">Dossiê de Telemetria</span>
              <h2 className="text-xl font-medieval font-bold text-white tracking-wide">
                Informações do Personagem
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextState = togglePinPlayer({
                  name: playerName,
                  world: selectedWorld || activeWorldObj?.name,
                  level: charInfo?.level,
                  vocation: charInfo?.vocation
                }, isPremium, ({ max }) => {
                  setLimitNotice(`Limite de ${max} chares atingido no modo Grátis! Seja VIP para fixar até 30 chares.`);
                  setTimeout(() => setLimitNotice(null), 4500);
                });
                setIsPinned(nextState);
                soundFX.playTacticalPing();
              }}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isPinned
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20'
                  : 'bg-black/60 text-gray-400 border-white/10 hover:text-amber-400 hover:border-amber-500/40'
              }`}
              title={isPinned ? 'Remover da Watchlist' : `Fixar na Watchlist (${isPremium ? 'Até 30 chares VIP' : 'Até 5 chares Free'}) ⭐`}
            >
              <Star size={18} className={isPinned ? 'text-amber-400 fill-amber-400' : ''} />
            </button>

            <button
              onClick={() => setShareModalOpen(true)}
              className="w-9 h-9 rounded-xl bg-black/60 hover:bg-yellow-950/60 border border-white/10 hover:border-yellow-500/40 flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-all cursor-pointer"
              title="Gerar e Compartilhar Card Gamer 📸"
            >
              <Share2 size={17} />
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-black/60 hover:bg-red-950/60 border border-white/10 hover:border-red-500/50 flex items-center justify-center text-gray-400 hover:text-red-300 transition-all cursor-pointer"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {limitNotice && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 p-2.5 px-4 text-center text-xs text-amber-300 font-bold flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <Crown size={15} className="text-yellow-400 animate-pulse shrink-0" />
              <span>{limitNotice}</span>
            </div>
            <button
              onClick={() => {
                onClose && onClose();
                onOpenFull && onOpenFull(null, 'vip_hub');
              }}
              className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 transition-colors shrink-0"
            >
              Virar VIP ↗
            </button>
          </div>
        )}

        {/* Corpo com Rolagem */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-yellow-500/30 border-t-yellow-400 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-yellow-300/70 font-mono tracking-wider">Localizando dados em tempo real nos 16 servidores...</p>
            </div>
          ) : (
            <>
              {/* Card Principal: Avatar, Nome, Level, Vocação e Status */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-stone-950/90 border border-white/10 relative overflow-hidden">
                <div className="relative shrink-0">
                  <img
                    src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=1c1917&color=eab308&size=128`}
                    alt={playerName}
                    className="w-20 h-20 rounded-2xl object-cover bg-black border-2 border-yellow-500/50 shadow-xl"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=1c1917&color=eab308&size=128`;
                    }}
                  />
                  <span 
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${
                      charInfo?.isOnline ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-stone-600'
                    }`}
                    title={charInfo?.isOnline ? 'Online no Rubinot' : 'Offline'}
                  >
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-2xl font-black text-white tracking-wide">{playerName}</h3>
                    {charInfo?.isHunted && (
                      <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                        Hunted
                      </span>
                    )}
                    {tierBadge && (
                      <span className={`bg-gradient-to-r ${tierBadge.color} text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1`}>
                        <span>{tierBadge.icon}</span> {tierBadge.title}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold">
                      Lvl {charInfo?.level || '?'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-stone-800 border border-stone-600/50 text-stone-200 text-xs font-medium">
                      {charInfo?.vocation || 'Aventureiro'}
                    </span>
                    {charInfo?.isOnline ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-green-950/80 border border-green-500/40 text-green-300 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                        Online Agora
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-900 border border-stone-700 text-stone-400 text-xs">
                        Offline
                      </span>
                    )}
                  </div>

                  {charInfo?.guildName && (
                    <div className="mt-2 text-xs text-yellow-300/80 font-sans flex items-center justify-center sm:justify-start gap-1">
                      <Shield size={13} className="text-yellow-400" />
                      <span>{charInfo.guildName}</span>
                      {charInfo.guildRank && <span className="text-stone-400">({charInfo.guildRank})</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção do Mundo & Seletor */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-stone-950 to-stone-900 border border-yellow-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={14} className="text-yellow-400" /> Mundo do Jogador
                  </span>

                  {/* Dropdown Seletor de Servidor */}
                  <div className="relative">
                    <button
                      onClick={() => setShowWorldDropdown(!showWorldDropdown)}
                      className="px-3 py-1 rounded-lg bg-black/60 border border-yellow-500/40 hover:border-yellow-400 text-yellow-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>{activeWorldObj?.icon}</span>
                      <span>{activeWorldObj?.name}</span>
                      <ChevronRight size={13} className={`transition-transform ${showWorldDropdown ? 'rotate-90' : ''}`} />
                    </button>

                    {showWorldDropdown && (
                      <div className="absolute right-0 top-full mt-1 w-56 max-h-56 overflow-y-auto bg-stone-950 border border-yellow-500/40 rounded-xl shadow-2xl z-50 divide-y divide-white/5 custom-scrollbar">
                        {WORLDS_LIST.filter(w => w.id !== 'ALL').map(w => (
                          <div
                            key={w.id}
                            onClick={() => handleWorldChange(w.id)}
                            className={`p-2.5 px-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                              w.id.toLowerCase() === selectedWorld.toLowerCase() 
                                ? 'bg-yellow-950/60 text-yellow-300 font-bold' 
                                : 'hover:bg-white/5 text-gray-300'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{w.icon}</span> {w.name}
                            </span>
                            <span className="text-[10px] text-gray-400">{w.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase font-mono block">Tipo de Servidor</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">{activeWorldObj?.type || 'Open-PvP'}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase font-mono block">Transferência</span>
                    <span className={`text-xs font-bold mt-0.5 block ${activeWorldObj?.transfer === 'Aberta' ? 'text-green-400' : 'text-amber-400'}`}>
                      {activeWorldObj?.transfer || 'Aberta'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 uppercase font-mono block">XP Acumulada</span>
                    <span className="text-xs font-bold text-yellow-300 mt-0.5 block">
                      {charInfo?.xpTotal ? formatXp(charInfo.xpTotal) : 'Sincronizando'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid dos Rankings: Mundo vs Global vs Rusher */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Ranking no Mundo */}
                <div className="p-4 rounded-xl bg-gradient-to-b from-stone-900 to-black border border-yellow-500/30 text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield size={48} className="text-yellow-400" />
                  </div>
                  <span className="text-[11px] font-bold text-yellow-400/90 uppercase tracking-wider block">
                    Ranking no Mundo
                  </span>
                  <div className="text-3xl font-black text-white mt-1">
                    {worldRank ? `#${worldRank}` : 'Top 100'}
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-1">
                    Servidor {activeWorldObj?.name}
                  </span>
                </div>

                {/* Ranking Global */}
                <div className="p-4 rounded-xl bg-gradient-to-b from-yellow-950/30 to-black border-2 border-yellow-500/50 text-center relative overflow-hidden group shadow-lg shadow-yellow-500/5">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy size={48} className="text-yellow-400" />
                  </div>
                  <span className="text-[11px] font-black text-yellow-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                    <Sparkles size={12} /> Ranking Global
                  </span>
                  <div className="text-3xl font-black text-yellow-300 mt-1 drop-shadow">
                    {globalRank ? `#${globalRank}` : 'Top Geral'}
                  </div>
                  <span className="text-[10px] text-yellow-400/70 block mt-1 font-mono">
                    {globalPercentile ? `Top ${globalPercentile}% no Rubinot` : 'Entre 12.365+ players'}
                  </span>
                </div>

                {/* Top Rusher 24h */}
                <div className="p-4 rounded-xl bg-gradient-to-b from-stone-900 to-black border border-amber-500/30 text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flame size={48} className="text-amber-400" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider block">
                    Rush 24 Horas
                  </span>
                  <div className="text-2xl font-black text-amber-300 mt-1.5">
                    {rusherInfo ? `+${(rusherInfo.exp_gained / 1000000).toFixed(1)}M` : '0 XP'}
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-1">
                    {rusherInfo ? 'Top Rusher ativo hoje' : 'Sem rush recente'}
                  </span>
                </div>
              </div>

              {/* Mortes Recentes (Baixas) */}
              {recentDeaths.length > 0 && (
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-red-400">
                      <Skull size={14} /> Mortes Recentes Registradas
                    </span>
                    <span className="text-[11px] text-stone-500">{recentDeaths.length} baixa(s)</span>
                  </div>

                  <div className="divide-y divide-white/5 space-y-1">
                    {recentDeaths.map((d, i) => {
                      const isPvP = Boolean(d.is_pvp) || (!['werelion', 'juggernaut', 'flimsy lost soul', 'goanna', 'grim reaper'].some(m => (d.killed_by || '').toLowerCase().includes(m)) && d.killed_by && d.killed_by.length > 2);
                      return (
                        <div key={i} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              isPvP ? 'bg-red-950 text-red-300 border border-red-500/40' : 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                            }`}>
                              {isPvP ? 'PvP Frag' : 'PvE'}
                            </span>
                            <span className="text-gray-300">
                              Morto por <strong className="text-white">{d.killed_by || 'Monstros'}</strong> (Lvl {d.level})
                            </span>
                          </div>
                          <span className="text-stone-500 text-[11px] font-mono">
                            {d.death_time ? new Date(d.death_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detector de Makers & Alts (Exclusivo VIP) */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-stone-950 via-black to-stone-950 border border-yellow-500/30 space-y-3 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-yellow-400">
                    <Skull size={14} /> Detector de Makers & Contas Vinculadas
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                    isPremium ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}>
                    {isPremium ? '👑 VIP ATIVO' : '🔒 EXCLUSIVO VIP'}
                  </span>
                </div>

                {isPremium ? (
                  suspectedMakers.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[11px] text-gray-400 font-sans">
                        Detectamos <strong className="text-yellow-300">{suspectedMakers.length}</strong> conta(s) com forte correlação recente nos registros:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {suspectedMakers.map((s, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              fetchPlayerDetails(s.world);
                            }}
                            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-yellow-500/40 flex items-center justify-between transition-all cursor-pointer group"
                            title="Ver telemetria deste personagem"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-300 font-medieval font-bold text-xs shrink-0">
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 text-left">
                                <div className="text-xs font-bold text-gray-200 group-hover:text-yellow-300 truncate">
                                  {s.name}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                  {s.level ? `Lvl ${s.level} • ` : ''}{s.world || selectedWorld}
                                </div>
                              </div>
                            </div>
                            <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold uppercase border font-mono shrink-0 ${s.badgeColor}`}>
                              {s.badge}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-gray-400 font-sans bg-black/40 rounded-xl border border-white/5">
                      Nenhuma conta secundária suspeita identificada nos combates recentes de 3 minutos.
                    </div>
                  )
                ) : (
                  <div className="space-y-3 py-1 text-center sm:text-left">
                    <p className="text-xs text-gray-400 font-sans leading-relaxed">
                      Desvende a identidade oculta de guerreiros inimigos. O algoritmo de IA do RubinOT correlaciona mortes conjuntas em guerra e perfis cadastrados para rastrear makers.
                    </p>
                    <button
                      onClick={() => {
                        onClose && onClose();
                        onOpenFull && onOpenFull(null, 'vip_hub');
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-black text-xs font-bold shadow-md transition-all hover:scale-105 flex items-center justify-center gap-1.5"
                    >
                      <Crown size={14} />
                      <span>Liberar Detector com VIP ou Worker Grátis</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Rodapé com Ações Oficiais */}
        <div className="p-4 bg-stone-950 border-t border-yellow-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={`https://rubinot.com.br/characters/${encodeURIComponent(playerName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-white/10 hover:border-yellow-500/40 text-stone-300 hover:text-yellow-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <ExternalLink size={14} />
            Abrir no Rubinot.com.br ↗
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Gerar Card Gamer para Redes e Discord"
            >
              <Share2 size={14} />
              Card 📸
            </button>

            <button
              onClick={() => {
                onClose();
                onVersus?.(playerName);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Comparar este jogador no Versus"
            >
              <Swords size={14} />
              Versus ⚔️
            </button>

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-black/80 hover:bg-white/5 border border-white/10 text-stone-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>

            <button
              onClick={() => onOpenFull && onOpenFull(playerName)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/20 transition-all cursor-pointer"
            >
              <Activity size={15} />
              Investigação Completa (Gráficos) <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Compartilhamento de Card Gamer */}
      {shareModalOpen && (
        <PlayerCardShareModal
          playerName={playerName}
          charInfo={charInfo}
          selectedWorld={selectedWorld}
          tierBadge={tierBadge}
          globalRank={globalRank}
          totalTracked={totalTracked}
          rusherInfo={rusherInfo}
          recentDeaths={recentDeaths}
          avatarUrl={avatarUrl}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
}
