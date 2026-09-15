import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Crosshair, Shield, Volume2, VolumeX, Maximize2, Minimize2, 
  Copy, Check, Clock, Skull, Swords, Timer, Zap, AlertTriangle, 
  RefreshCw, LayoutGrid, Columns, Coins, Play, Pause, RotateCcw, 
  ChevronRight, ExternalLink, Sparkles, User, Bell, Star, Mic, MicOff,
  Plus, Trash2, Search
} from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import { soundFX } from '../lib/soundEffects';
import { supabase } from '../lib/supabase';
import { getPinnedPlayers, subscribeWatchlist } from '../lib/watchlistService';
import AdBanner from '../components/AdBanner';

// Extração de assassino inteligente (PvP vs PvE)
const extractKillers = (killedBy) => {
  if (!killedBy) return { primary: 'Criatura / Ambiente', isPvp: false };
  const kb = killedBy.toLowerCase();
  const pveKeywords = ['field item', 'fire field', 'energy field', 'poison field', 'lava', 'drowning', 'suicide'];
  if (pveKeywords.some(k => kb.includes(k))) {
    return { primary: killedBy, isPvp: false };
  }
  const hasCapital = /[A-Z]/.test(killedBy);
  const commonMonsters = /^(demon|werelion|dragon|grim reaper|sphinx|lamassu|skeleton|ghoul|orc|valkyrie|witch|behemoth|hydra|warlock|vampire|jaded|dark|gazer)/i.test(killedBy);
  const isPvp = (hasCapital && !commonMonsters) || kb.includes('maior dano por');

  if (!isPvp) {
    return { primary: killedBy, isPvp: false };
  }

  const parts = killedBy.split('(maior dano por');
  const primary = parts[0].replace(/killed by/i, '').replace(/morto por/i, '').trim();
  return { primary: primary || 'Jogador Anônimo', isPvp: true };
};

const getRelativeTime = (isoDate) => {
  if (!isoDate) return '';
  const now = Date.now();
  const past = new Date(isoDate).getTime();
  if (isNaN(past)) return '';
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));
  if (diffSec < 60) return `${diffSec}s atrás`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m atrás`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  return new Date(isoDate).toLocaleDateString('pt-BR');
};

export default function StreamerCompanion({ onNavigate, onPlayerClick }) {
  const { activeWorld, setActiveWorld } = useWorld();
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' ou 'slim'
  const [audioEnabled, setAudioEnabled] = useState(() => soundFX.isEnabled());
  const [voiceEnabled, setVoiceEnabled] = useState(() => soundFX.isVoiceEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedExiva, setCopiedExiva] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);

  // Relógio e Server Save
  const [currentTime, setCurrentTime] = useState(new Date());

  // Aba do Radar (hunteds vs watchlist)
  const [radarTab, setRadarTab] = useState('hunted'); // 'hunted' | 'watchlist'
  const [radarFilter, setRadarFilter] = useState('');

  // Radar de Inimigos / Hunteds
  const [huntedList, setHuntedList] = useState([]);
  const [loadingHunteds, setLoadingHunteds] = useState(true);

  // Watchlist de Jogadores Fixados
  const [pinnedPlayers, setPinnedPlayers] = useState(getPinnedPlayers);
  const [pinnedOnlineMap, setPinnedOnlineMap] = useState({});

  // Live War Feed (recent_deaths)
  const [recentFrags, setRecentFrags] = useState([]);
  const [loadingFrags, setLoadingFrags] = useState(true);

  // Cronômetros de Respawns e Bosses Ativos
  const [respawnTimers, setRespawnTimers] = useState([
    { id: 'rotten', name: 'Rotten Blood (Jaded Roots)', holder: 'Seu Time', totalSeconds: 7200, remainingSeconds: 4320, isRunning: true },
    { id: 'soulwar', name: 'Soul War (Rotten Wasteland)', holder: 'Time Rival', totalSeconds: 7200, remainingSeconds: 1280, isRunning: true },
    { id: 'cobras', name: 'Cobra Bastion', holder: 'Livre em breve', totalSeconds: 7200, remainingSeconds: 300, isRunning: true }
  ]);
  const [customTimerName, setCustomTimerName] = useState('');
  const [customTimerHours, setCustomTimerHours] = useState('2');

  // Mini Calculadora de TC
  const [calcTc, setCalcTc] = useState(250);
  const [goldPerTc, setGoldPerTc] = useState(45); // 45k por TC no RubinOT
  const [brlPerTc, setBrlPerTc] = useState(0.20);

  // Atualização do Relógio e contagem regressiva de timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      // Decrementar cronômetros de respawns ativos
      setRespawnTimers(prev => prev.map(t => {
        if (!t.isRunning || t.remainingSeconds <= 0) return t;
        const newRemaining = t.remainingSeconds - 1;
        // Alerta sonoro e de voz quando faltam exatamente 5 minutos (300 segundos)
        if (newRemaining === 300) {
          if (audioEnabled) soundFX.playTacticalPing();
          if (voiceEnabled) soundFX.speakTactical(`Atenção: Respawn ${t.name} livre em cinco minutos!`);
        }
        return { ...t, remainingSeconds: newRemaining };
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [audioEnabled, voiceEnabled]);

  // Contagem regressiva para o Server Save (05:00 BRT / 10:00 CEST)
  const serverSaveCountdown = useMemo(() => {
    const now = currentTime;
    const nextSs = new Date(now);
    nextSs.setHours(5, 0, 0, 0);
    if (now >= nextSs) {
      nextSs.setDate(nextSs.getDate() + 1);
    }
    const diff = Math.max(0, Math.floor((nextSs - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [currentTime]);

  // Buscar Hunteds do Banco de Dados
  const fetchHunteds = async () => {
    try {
      const { data, error } = await supabase
        .from('hunted_list')
        .select('*')
        .order('is_online', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      setHuntedList(data || []);
    } catch (err) {
      console.warn('Erro ao carregar lista de hunteds:', err);
    } finally {
      setLoadingHunteds(false);
    }
  };

  // Buscar Mortes Recentes (Live War Feed)
  const fetchRecentDeaths = async () => {
    try {
      let query = supabase
        .from('recent_deaths')
        .select('*')
        .order('id', { ascending: false })
        .limit(20);

      if (activeWorld && activeWorld !== 'ALL') {
        query = query.eq('world_name', activeWorld);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        setRecentFrags(data);
      } else {
        // Fallback ilustrativo se ainda não houver mortes no mundo
        setRecentFrags([
          { id: 'mock-1', character_name: 'Xande Slayer', level: 810, killed_by: 'Blood Knight (maior dano por Sniper Pro)', world_name: activeWorld, death_time: new Date(Date.now() - 180000).toISOString() },
          { id: 'mock-2', character_name: 'Druid da Massa', level: 690, killed_by: 'Sniper Pro', world_name: activeWorld, death_time: new Date(Date.now() - 480000).toISOString() },
          { id: 'mock-3', character_name: 'Gargoyle Tank', level: 920, killed_by: 'Mage Supremo', world_name: activeWorld, death_time: new Date(Date.now() - 900000).toISOString() }
        ]);
      }
    } catch (err) {
      console.warn('Erro ao carregar mortes recentes:', err);
    } finally {
      setLoadingFrags(false);
    }
  };

  // Checar status online dos jogadores fixados na Watchlist
  const checkPinnedOnline = async (list = pinnedPlayers) => {
    if (!list || list.length === 0) {
      setPinnedOnlineMap({});
      return;
    }
    try {
      const names = list.map(p => p.name);
      const [{ data: huntedData }, { data: memberData }] = await Promise.all([
        supabase.from('hunted_list').select('name, is_online').in('name', names),
        supabase.from('guild_members').select('name, is_online').in('name', names)
      ]);

      const onlineMap = {};
      (huntedData || []).forEach(h => {
        if (h.is_online) onlineMap[h.name.toLowerCase()] = true;
      });
      (memberData || []).forEach(m => {
        if (m.is_online) onlineMap[m.name.toLowerCase()] = true;
      });
      setPinnedOnlineMap(onlineMap);
    } catch (err) {
      console.warn('Erro ao checar status da watchlist:', err);
    }
  };

  // Carregamento inicial e realtime
  useEffect(() => {
    fetchHunteds();
    fetchRecentDeaths();
    checkPinnedOnline();

    // Polling a cada 30 segundos
    const pollInterval = setInterval(() => {
      fetchHunteds();
      fetchRecentDeaths();
      checkPinnedOnline();
    }, 30000);

    // Watchlist listener
    const unsubWatchlist = subscribeWatchlist((updated) => {
      setPinnedPlayers(updated);
      checkPinnedOnline(updated);
    });

    // Supabase Realtime channel para hunteds (logins de inimigos)
    const huntedChannel = supabase
      .channel('streamer_hunted_events')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hunted_list' }, (payload) => {
        const { new: newRow, old: oldRow } = payload;
        if (newRow && oldRow && newRow.is_online && !oldRow.is_online) {
          if (audioEnabled) soundFX.playEnemyAlert();
          if (voiceEnabled) soundFX.speakTactical(`Atenção: Inimigo ${newRow.name} entrou online no servidor!`);
          
          setActiveAlert({
            name: newRow.name,
            reason: newRow.reason || 'Inimigo da Guilda',
            time: new Date().toLocaleTimeString('pt-BR')
          });
          setTimeout(() => setActiveAlert(null), 8000);
        }
        fetchHunteds();
      })
      .subscribe();

    // Supabase Realtime channel para novas mortes de guerra
    const warChannel = supabase
      .channel('streamer_war_events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'recent_deaths' }, (payload) => {
        if (payload.new) {
          const death = payload.new;
          if (!activeWorld || activeWorld === 'ALL' || death.world_name === activeWorld) {
            const info = extractKillers(death.killed_by);
            if (info.isPvp) {
              if (audioEnabled) soundFX.playTacticalPing();
            }
            setRecentFrags(prev => [death, ...prev.slice(0, 19)]);
          }
        }
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      unsubWatchlist();
      supabase.removeChannel(huntedChannel);
      supabase.removeChannel(warChannel);
    };
  }, [activeWorld, audioEnabled, voiceEnabled]);

  // Alternar Áudio Geral (Sonar)
  const handleToggleAudio = () => {
    const nextState = soundFX.toggle();
    setAudioEnabled(nextState);
  };

  // Alternar Voz Tática Sintética (Web Speech API)
  const handleToggleVoice = () => {
    const nextVoice = soundFX.toggleVoice();
    setVoiceEnabled(nextVoice);
  };

  // Testar alerta de voz e som
  const handleTestAlert = () => {
    soundFX.playEnemyAlert();
    soundFX.speakTactical('Alerta tático operacional. Sistema de radar ativo!');
    setActiveAlert({
      name: 'Lord Valmor (Teste)',
      reason: 'Inimigo detectado no perímetro',
      time: new Date().toLocaleTimeString('pt-BR')
    });
    setTimeout(() => setActiveAlert(null), 5000);
  };

  // Alternar Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Copiar comando Exiva para a área de transferência
  const handleCopyExiva = (charName) => {
    const cmd = `exiva "${charName}"`;
    navigator.clipboard.writeText(cmd);
    setCopiedExiva(charName);
    if (audioEnabled) soundFX.playTacticalPing();
    setTimeout(() => setCopiedExiva(null), 2000);
  };

  // Adicionar Timer Rápido de Respawn
  const handleAddTimer = (name, hours = 2) => {
    const newTimer = {
      id: String(Date.now()),
      name,
      holder: 'Seu Time',
      totalSeconds: hours * 3600,
      remainingSeconds: hours * 3600,
      isRunning: true
    };
    setRespawnTimers(prev => [newTimer, ...prev]);
  };

  const handleAddCustomTimer = (e) => {
    e.preventDefault();
    if (!customTimerName.trim()) return;
    const hours = parseFloat(customTimerHours) || 2;
    handleAddTimer(customTimerName.trim(), hours);
    setCustomTimerName('');
  };

  const handleToggleTimer = (id) => {
    setRespawnTimers(prev => prev.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t));
  };

  const handleResetTimer = (id) => {
    setRespawnTimers(prev => prev.map(t => t.id === id ? { ...t, remainingSeconds: t.totalSeconds, isRunning: true } : t));
  };

  const handleRemoveTimer = (id) => {
    setRespawnTimers(prev => prev.filter(t => t.id !== id));
  };

  const formatSeconds = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Filtragem de Hunteds e Watchlist
  const filteredHunteds = useMemo(() => {
    if (!radarFilter.trim()) return huntedList;
    const q = radarFilter.toLowerCase();
    return huntedList.filter(h => 
      h.name?.toLowerCase().includes(q) || 
      h.reason?.toLowerCase().includes(q)
    );
  }, [huntedList, radarFilter]);

  const filteredWatchlist = useMemo(() => {
    if (!radarFilter.trim()) return pinnedPlayers;
    const q = radarFilter.toLowerCase();
    return pinnedPlayers.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.vocation?.toLowerCase().includes(q) ||
      p.server?.toLowerCase().includes(q)
    );
  }, [pinnedPlayers, radarFilter]);

  const onlineHuntedsCount = useMemo(() => {
    return huntedList.filter(h => h.is_online).length;
  }, [huntedList]);

  const onlineWatchlistCount = useMemo(() => {
    return pinnedPlayers.filter(p => pinnedOnlineMap[p.name.toLowerCase()]).length;
  }, [pinnedPlayers, pinnedOnlineMap]);

  return (
    <div className="min-h-screen bg-[#060608] text-gray-100 p-2 sm:p-4 flex flex-col gap-3 font-sans select-none">
      
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR ULTRA-COMPACTA (HUD HEADER)                                 */}
      {/* ========================================================================= */}
      <header className="bg-black/90 border border-yellow-500/40 p-2.5 sm:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
        
        {/* Identificação e Relógio */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-sm sm:text-base font-medieval text-yellow-400 font-bold tracking-wider flex items-center gap-1.5">
              <Crosshair size={16} className="text-red-400" />
              Gamer Companion • HUD
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-xs">
            <span className="text-gray-400 font-mono">
              {currentTime.toLocaleTimeString('pt-BR')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 font-mono">
              SS em: {serverSaveCountdown}
            </span>
          </div>
        </div>

        {/* Seletor de Mundo & Controles do HUD */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          
          {/* Seletor de Mundo */}
          <select
            value={activeWorld}
            onChange={(e) => setActiveWorld(e.target.value)}
            className="bg-black/90 border border-tibia-border rounded-xl px-2.5 py-1 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500 cursor-pointer"
          >
            {WORLDS_LIST.map(w => (
              <option key={w.id} value={w.id}>Mundo: {w.name}</option>
            ))}
          </select>

          {/* Alternador de Layout (Grid vs Slim) */}
          <button
            onClick={() => setLayoutMode(prev => prev === 'grid' ? 'slim' : 'grid')}
            title={layoutMode === 'grid' ? 'Mudar para Barra Lateral Slim (Dock)' : 'Mudar para Grid de Monitor Secundário'}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all text-xs flex items-center gap-1"
          >
            {layoutMode === 'grid' ? <Columns size={14} /> : <LayoutGrid size={14} />}
            <span className="hidden md:inline">{layoutMode === 'grid' ? 'Slim' : 'Grid'}</span>
          </button>

          {/* Áudio Sonar Toggle */}
          <button
            onClick={handleToggleAudio}
            title={audioEnabled ? 'Desativar Sons Táticos' : 'Ativar Sons Táticos do HUD'}
            className={`p-1.5 rounded-xl border transition-all ${
              audioEnabled 
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' 
                : 'bg-white/5 border-white/10 text-gray-500'
            }`}
          >
            {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Voz Tática Sintética Toggle */}
          <button
            onClick={handleToggleVoice}
            title={voiceEnabled ? 'Voz Tática Ligada (Web Speech API)' : 'Ativar Narração de Voz Tática'}
            className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 text-xs ${
              voiceEnabled && audioEnabled
                ? 'bg-red-500/20 border-red-500/60 text-red-400 shadow-sm shadow-red-500/20'
                : 'bg-white/5 border-white/10 text-gray-500'
            }`}
          >
            {voiceEnabled && audioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
            <span className="hidden lg:inline text-[11px] font-bold">Voz</span>
          </button>

          {/* Testar Alerta */}
          <button
            onClick={handleTestAlert}
            title="Testar alerta sonoro e de voz"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all text-xs flex items-center gap-1"
          >
            <Bell size={13} />
            <span className="hidden xl:inline text-[10px]">Testar</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            title="Tela Cheia (F11/HUD)"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

        </div>

      </header>

      {/* BANNER DINÂMICO DE ALERTA TÁTICO QUANDO INIMIGO LOGA */}
      {activeAlert && (
        <div className="bg-red-950/90 border-2 border-red-500 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-2xl animate-bounce">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <AlertTriangle size={18} />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-300 block">
                🚨 ALERTA DE COMBATE AO VIVO
              </span>
              <p className="text-sm font-black text-white">
                Inimigo <span className="text-yellow-400 underline">{activeAlert.name}</span> detectado ONLINE!
              </p>
              <span className="text-[10px] text-gray-400">{activeAlert.reason} • {activeAlert.time}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyExiva(activeAlert.name)}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl flex items-center gap-1 shadow-lg cursor-pointer"
            >
              <Copy size={12} /> Exiva
            </button>
            <button
              onClick={() => {
                if (onPlayerClick) onPlayerClick(activeAlert.name);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <User size={12} /> Dossiê
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CORPO DO HUD: MODO GRID (MONITOR 2) OU MODO BARRA SLIM (DOCK LATERAL)     */}
      {/* ========================================================================= */}
      <div className={`grid gap-3 sm:gap-4 flex-1 ${
        layoutMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1 max-w-lg mx-auto w-full'
      }`}>
        
        {/* ======================================================================= */}
        {/* WIDGET 1: RADAR DE ALVOS (HUNTEDS & WATCHLIST UNIFICADOS)               */}
        {/* ======================================================================= */}
        <div className="bg-black/85 border border-red-500/40 rounded-2xl p-3.5 flex flex-col gap-3 shadow-xl relative overflow-hidden">
          
          {/* Header com Alternador de Abas */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setRadarTab('hunted')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  radarTab === 'hunted'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Crosshair size={12} />
                <span>Hunteds</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  onlineHuntedsCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-400'
                }`}>
                  {onlineHuntedsCount}
                </span>
              </button>

              <button
                onClick={() => setRadarTab('watchlist')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  radarTab === 'watchlist'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Star size={12} className="text-yellow-400" />
                <span>Watchlist</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  onlineWatchlistCount > 0 ? 'bg-green-500 text-black font-bold' : 'bg-white/10 text-gray-400'
                }`}>
                  {onlineWatchlistCount}/{pinnedPlayers.length}
                </span>
              </button>
            </div>

            <button 
              onClick={() => onNavigate && onNavigate(radarTab === 'hunted' ? 'radar' : 'versus')}
              className="text-[10px] text-yellow-400/80 hover:text-yellow-300 flex items-center gap-0.5 cursor-pointer"
              title="Abrir módulo completo"
            >
              Expandir <ChevronRight size={11} />
            </button>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={radarTab === 'hunted' ? 'Filtrar inimigo por nome/motivo...' : 'Filtrar personagem fixado...'}
              value={radarFilter}
              onChange={(e) => setRadarFilter(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-7 pr-2.5 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
            />
          </div>

          {/* Lista de Alvos */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
            {radarTab === 'hunted' ? (
              loadingHunteds ? (
                <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                  <RefreshCw size={18} className="animate-spin text-red-400" />
                  Carregando lista de hunteds...
                </div>
              ) : filteredHunteds.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  {radarFilter ? 'Nenhum inimigo encontrado com esse filtro.' : 'Nenhum inimigo cadastrado no radar.'}
                </div>
              ) : (
                filteredHunteds.map(enemy => (
                  <div 
                    key={enemy.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      enemy.is_online 
                        ? 'bg-red-950/40 border-red-500/60 shadow-md shadow-red-950/40' 
                        : 'bg-black/50 border-white/5 opacity-65 hover:opacity-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${enemy.is_online ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                        <button 
                          onClick={() => onPlayerClick && onPlayerClick(enemy.name)}
                          className="text-xs font-bold text-gray-200 hover:text-yellow-400 truncate text-left cursor-pointer"
                          title="Ver Dossiê Completo"
                        >
                          {enemy.name}
                        </button>
                        {enemy.is_online && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">
                            ONLINE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {enemy.reason || 'Inimigo da Guilda'}
                      </p>
                    </div>

                    {/* Ações Rápidas: Exiva e Dossiê */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyExiva(enemy.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                          copiedExiva === enemy.name
                            ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                            : 'bg-white/10 hover:bg-yellow-500 hover:text-black text-gray-200'
                        }`}
                        title="Copiar exiva para a área de transferência"
                      >
                        {copiedExiva === enemy.name ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedExiva === enemy.name ? 'Copiado!' : 'Exiva'}</span>
                      </button>

                      <button
                        onClick={() => onPlayerClick && onPlayerClick(enemy.name)}
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-yellow-400 cursor-pointer"
                        title="Abrir Dossiê"
                      >
                        <User size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* ABA WATCHLIST */
              filteredWatchlist.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                  <Star size={20} className="text-yellow-400/40" />
                  <p>Sua watchlist está vazia.</p>
                  <span className="text-[10px] text-gray-500">Fixe jogadores na busca global ou no dossiê para monitorá-los aqui!</span>
                </div>
              ) : (
                filteredWatchlist.map(char => {
                  const isOnline = !!pinnedOnlineMap[char.name.toLowerCase()];
                  return (
                    <div 
                      key={char.name}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isOnline 
                          ? 'bg-yellow-950/30 border-yellow-500/50 shadow-md shadow-yellow-950/30' 
                          : 'bg-black/50 border-white/5 opacity-65 hover:opacity-100'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                          <button 
                            onClick={() => onPlayerClick && onPlayerClick(char.name)}
                            className="text-xs font-bold text-gray-200 hover:text-yellow-400 truncate text-left cursor-pointer"
                            title="Ver Dossiê Completo"
                          >
                            {char.name}
                          </button>
                          {isOnline && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">
                              ONLINE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          Lvl {char.level || '?'} • {char.vocation || 'Desconhecido'} {char.server ? `• ${char.server}` : ''}
                        </p>
                      </div>

                      {/* Botões rápidos */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyExiva(char.name)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                            copiedExiva === char.name
                              ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                              : 'bg-white/10 hover:bg-yellow-500 hover:text-black text-gray-200'
                          }`}
                          title="Copiar exiva para a área de transferência"
                        >
                          {copiedExiva === char.name ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedExiva === char.name ? 'Copiado!' : 'Exiva'}</span>
                        </button>

                        <button
                          onClick={() => onPlayerClick && onPlayerClick(char.name)}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-yellow-400 cursor-pointer"
                          title="Abrir Dossiê"
                        >
                          <User size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>

          <div className="pt-2 border-t border-white/10 text-[10px] text-gray-400 flex items-center justify-between">
            <span>💡 Clique em Exiva e use Ctrl+V in-game</span>
            <span className="text-gray-500">Auto-atualização 30s</span>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* WIDGET 2: CRONÔMETROS DE RESPAWNS & HUNTS (2H CLAIMS / BOSSES)         */}
        {/* ======================================================================= */}
        <div className="bg-black/85 border border-yellow-500/40 rounded-2xl p-3.5 flex flex-col gap-3 shadow-xl">
          
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Timer size={14} className="text-yellow-400" />
              <h2 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                Timers de Respawns & Hunts
              </h2>
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <button 
                onClick={() => handleAddTimer('Nagas Marapur', 2)}
                className="px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25 transition-all cursor-pointer"
              >
                + Nagas
              </button>
              <button 
                onClick={() => handleAddTimer('Asuras Mirror', 2)}
                className="px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25 transition-all cursor-pointer"
              >
                + Asuras
              </button>
            </div>
          </div>

          {/* Form para adicionar timer customizado */}
          <form onSubmit={handleAddCustomTimer} className="flex gap-1.5 items-center">
            <input
              type="text"
              placeholder="Novo respawn ou boss..."
              value={customTimerName}
              onChange={(e) => setCustomTimerName(e.target.value)}
              className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
            />
            <select
              value={customTimerHours}
              onChange={(e) => setCustomTimerHours(e.target.value)}
              className="bg-black border border-white/10 rounded-lg px-1.5 py-1 text-xs text-yellow-400 font-bold cursor-pointer"
            >
              <option value="0.25">15m</option>
              <option value="0.5">30m</option>
              <option value="1">1 hora</option>
              <option value="2">2 horas</option>
              <option value="4">4 horas</option>
            </select>
            <button
              type="submit"
              className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg flex items-center gap-0.5 cursor-pointer"
            >
              <Plus size={12} /> Add
            </button>
          </form>

          {/* Lista de Timers Ativos */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px] pr-1 scrollbar-thin">
            {respawnTimers.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                Nenhum timer ativo no momento.
              </div>
            ) : (
              respawnTimers.map(timer => {
                const percent = Math.max(0, Math.min(100, Math.round((timer.remainingSeconds / timer.totalSeconds) * 100)));
                const isEndingSoon = timer.remainingSeconds <= 300 && timer.remainingSeconds > 0; // Últimos 5 min
                const isExpired = timer.remainingSeconds === 0;

                return (
                  <div 
                    key={timer.id}
                    className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                      isExpired
                        ? 'bg-red-950/60 border-red-500 text-red-300 animate-pulse'
                        : isEndingSoon 
                          ? 'bg-red-950/40 border-red-500/80 animate-pulse' 
                          : 'bg-black/60 border-tibia-border'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-gray-200 truncate">{timer.name}</h4>
                        <span className="text-[10px] text-gray-400">Claim: {timer.holder}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs sm:text-sm font-mono font-bold ${
                          isExpired ? 'text-red-400 font-black' : isEndingSoon ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {isExpired ? 'LIVRE / EXPIRADO' : formatSeconds(timer.remainingSeconds)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full bg-gray-800/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          isEndingSoon ? 'bg-red-500' : 'bg-yellow-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Controles do Timer */}
                    <div className="flex justify-end gap-1.5 pt-1 text-[10px]">
                      <button
                        onClick={() => handleToggleTimer(timer.id)}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1 cursor-pointer"
                      >
                        {timer.isRunning ? <Pause size={10} /> : <Play size={10} />}
                        {timer.isRunning ? 'Pausar' : 'Continuar'}
                      </button>
                      <button
                        onClick={() => handleResetTimer(timer.id)}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                      <button
                        onClick={() => handleRemoveTimer(timer.id)}
                        className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 cursor-pointer"
                        title="Remover timer"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* ======================================================================= */}
        {/* WIDGET 3: LIVE WAR FEED TICKER & CONVERSOR EXPRESS                     */}
        {/* ======================================================================= */}
        <div className="bg-black/85 border border-tibia-border rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow-xl">
          
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Swords size={14} className="text-red-400" />
                <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Mural de Mortes ao Vivo
                </h2>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('war_feed')}
                className="text-[10px] text-yellow-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Feed Completo <ChevronRight size={10} />
              </button>
            </div>

            {/* Ticker de Frags com Dados Reais de recent_deaths */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
              {loadingFrags ? (
                <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-yellow-400" />
                  Carregando frags de combate...
                </div>
              ) : recentFrags.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  Nenhuma morte registrada recentemente neste servidor.
                </div>
              ) : (
                recentFrags.map(frag => {
                  const killerInfo = extractKillers(frag.killed_by);
                  const timeStr = getRelativeTime(frag.death_time || frag.created_at);

                  return (
                    <div 
                      key={frag.id} 
                      className={`p-2 bg-black/60 rounded-xl flex items-center justify-between text-xs transition-all border ${
                        killerInfo.isPvp ? 'border-red-500/30' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Skull size={13} className={`${killerInfo.isPvp ? 'text-red-500' : 'text-gray-500'} shrink-0`} />
                        <div className="min-w-0">
                          <button
                            onClick={() => onPlayerClick && onPlayerClick(frag.character_name)}
                            className="font-bold text-gray-200 hover:text-yellow-400 truncate block text-left cursor-pointer"
                            title="Ver Dossiê da Vítima"
                          >
                            {frag.character_name}
                          </button>
                          <span className="text-[10px] text-gray-400 block">
                            Lvl {frag.level || frag.victim_level || '?'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 max-w-[130px]">
                        <span className={`text-[10px] font-bold truncate block ${killerInfo.isPvp ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {killerInfo.primary}
                        </span>
                        <span className="text-[9px] text-gray-500">{timeStr}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Mini Conversor In-Game (TC <-> Gold <-> BRL) */}
          <div className="bg-black/60 border border-tibia-border p-2.5 rounded-xl flex flex-col gap-2">
            <span className="text-[10px] font-bold text-yellow-400 uppercase flex items-center gap-1">
              <Coins size={12} /> Conversor Rápido de Tibia Coins
            </span>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-gray-400 block">TC:</span>
                <input
                  type="number"
                  value={calcTc}
                  onChange={(e) => setCalcTc(parseInt(e.target.value) || 0)}
                  className="w-full bg-black border border-tibia-border rounded px-1.5 py-1 text-yellow-400 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <span className="text-[9px] text-gray-400 block">Gold (kk):</span>
                <div className="bg-black border border-white/5 rounded px-1.5 py-1 font-mono text-green-400 font-bold text-xs truncate">
                  {((calcTc * goldPerTc) / 1000).toFixed(1)} kk
                </div>
              </div>

              <div>
                <span className="text-[9px] text-gray-400 block">Real (BRL):</span>
                <div className="bg-black border border-white/5 rounded px-1.5 py-1 font-mono text-emerald-400 font-bold text-xs truncate">
                  R$ {(calcTc * brlPerTc).toFixed(1)}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Banner de Anúncios AdSense */}
      <AdBanner slot="streamer_companion_footer" format="horizontal" />
    </div>
  );
}
