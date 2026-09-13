import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Swords, Skull, Flame, ShieldAlert, Crosshair, Trophy, 
  Clock, Filter, Volume2, VolumeX, RefreshCw, Globe, 
  Coins, Sparkles, AlertTriangle, ArrowUpRight, Award, Zap
} from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import { soundFX } from '../lib/soundEffects';
import AdBanner from '../components/AdBanner';

// Função para extrair detalhes de assassino (primary + assist)
const extractKillers = (killedBy) => {
  if (!killedBy) return { primary: 'Criatura/Ambiente', assist: null, isPvp: false };
  const kb = killedBy.toLowerCase();

  const pveKeywords = ['field item', 'fire field', 'energy field', 'poison field', 'lava', 'drowning', 'suicide'];
  if (pveKeywords.some(k => kb.includes(k))) {
    return { primary: killedBy, assist: null, isPvp: false };
  }

  const hasCapital = /[A-Z]/.test(killedBy);
  const commonMonsters = /^(demon|werelion|dragon|grim reaper|sphinx|lamassu|skeleton|ghoul|orc|valkyrie|witch|behemoth|hydra|warlock|vampire)/i.test(killedBy);

  const isPvp = (hasCapital && !commonMonsters) || kb.includes('maior dano por');

  if (!isPvp) {
    return { primary: killedBy, assist: null, isPvp: false };
  }

  const parts = killedBy.split('(maior dano por');
  const primary = parts[0].replace(/killed by/i, '').replace(/morto por/i, '').trim();
  const assist = parts[1] ? parts[1].replace(')', '').trim() : null;

  return { primary: primary || 'Jogador Anônimo', assist, isPvp: true };
};

const getRelativeTime = (isoDate) => {
  if (!isoDate) return '';
  const now = Date.now();
  const past = new Date(isoDate).getTime();
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));

  if (diffSec < 60) return `há ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours}h ${diffMin % 60}m`;
  return new Date(isoDate).toLocaleDateString('pt-BR');
};

export default function LiveWarFeed({ onPlayerClick }) {
  const { activeWorld, setActiveWorld } = useWorld();
  const [selectedWorld, setSelectedWorld] = useState(activeWorld || 'ALL');
  const [deaths, setDeaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [pvpOnly, setPvpOnly] = useState(true);
  const [minLevel, setMinLevel] = useState('ALL'); // 'ALL', '300', '600', '900'

  // Efeito sonoro de combate
  const playFragSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const fetchDeaths = async () => {
    try {
      const { data, error } = await supabase
        .from('recent_deaths')
        .select('*')
        .order('id', { ascending: false })
        .limit(300);

      if (error) throw error;
      setDeaths(data || []);
    } catch (e) {
      console.error('Erro ao buscar mortes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeaths();

    // Auto-polling a cada 10 segundos
    const interval = setInterval(fetchDeaths, 10000);

    // Supabase Realtime channel para novas mortes instantâneas
    const channel = supabase
      .channel('live_war_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'recent_deaths' }, (payload) => {
        if (payload.new) {
          const info = extractKillers(payload.new.killed_by);
          if (info.isPvp) {
            playFragSound();
          }
          setDeaths(prev => [payload.new, ...prev.slice(0, 299)]);
        }
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  // Processamento e detecção automática de batalhas/massacres
  const parsedDeaths = useMemo(() => {
    return deaths.map(d => {
      const killerInfo = extractKillers(d.killed_by);
      const deathTimeMs = new Date(d.death_time || d.created_at).getTime();
      return {
        ...d,
        _killerInfo: killerInfo,
        _deathTimeMs: deathTimeMs
      };
    });
  }, [deaths]);

  // Detecção de Batalhas Ativas (Clusterização em janelas de 15 minutos)
  const detectedBattles = useMemo(() => {
    const now = Date.now();
    const fifteenMinAgo = now - 15 * 60 * 1000;
    const recentPvp = parsedDeaths.filter(d => d._killerInfo.isPvp && d._deathTimeMs >= fifteenMinAgo);

    const worldGroups = {};
    for (const d of recentPvp) {
      const w = d.world_name || 'Global';
      if (!worldGroups[w]) worldGroups[w] = [];
      worldGroups[w].push(d);
    }

    const battles = [];
    for (const [wName, deathsInWorld] of Object.entries(worldGroups)) {
      if (deathsInWorld.length >= 3) { // 3+ mortes PvP em 15 minutos indicam confronto quente
        // Identifica MVPs e Vitimas
        const killerCounts = {};
        const victimCounts = {};

        for (const d of deathsInWorld) {
          const k = d._killerInfo.primary;
          const v = d.character_name;
          killerCounts[k] = (killerCounts[k] || 0) + 1;
          victimCounts[v] = (victimCounts[v] || 0) + 1;
        }

        const sortedKillers = Object.entries(killerCounts).sort((a, b) => b[1] - a[1]);
        const sortedVictims = Object.entries(victimCounts).sort((a, b) => b[1] - a[1]);

        const mvp = sortedKillers[0] ? { name: sortedKillers[0][0], frags: sortedKillers[0][1] } : null;
        const target = sortedVictims[0] ? { name: sortedVictims[0][0], deaths: sortedVictims[0][1] } : null;

        // Estimativa de dano financeiro (120k gp em bless por morte + perdas)
        const totalGoldLost = deathsInWorld.length * 120000;
        const totalTcLost = Math.round(deathsInWorld.length * 4.5);

        battles.push({
          world: wName,
          totalFrags: deathsInWorld.length,
          startTime: Math.min(...deathsInWorld.map(d => d._deathTimeMs)),
          latestTime: Math.max(...deathsInWorld.map(d => d._deathTimeMs)),
          mvp,
          target,
          totalGoldLost,
          totalTcLost,
          deaths: deathsInWorld
        });
      }
    }

    return battles.sort((a, b) => b.totalFrags - a.totalFrags);
  }, [parsedDeaths]);

  // Filtragem dos Frags para o Feed
  const filteredFeed = useMemo(() => {
    return parsedDeaths.filter(d => {
      if (pvpOnly && !d._killerInfo.isPvp) return false;
      if (selectedWorld !== 'ALL' && d.world_name && d.world_name.toLowerCase() !== selectedWorld.toLowerCase()) return false;
      
      const lvl = Number(d.level || 0);
      if (minLevel === '300' && lvl < 300) return false;
      if (minLevel === '600' && lvl < 600) return false;
      if (minLevel === '900' && lvl < 900) return false;

      return true;
    });
  }, [parsedDeaths, pvpOnly, selectedWorld, minLevel]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* HERO BANNER LIVE WAR FEED */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/40 bg-gradient-to-b from-red-950/40 via-stone-950 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/15 px-3.5 py-1 text-xs font-bold text-red-300 uppercase tracking-wider mb-3 shadow-inner">
              <Flame size={14} className="text-red-400 animate-pulse" />
              Feed de Treta em Tempo Real • Telemetria PvP
            </div>

            <h1 className="text-3xl sm:text-5xl font-medieval text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-yellow-500 drop-shadow-lg leading-tight">
              Mural de Frags & Live War Feed <span className="text-white">⚔️</span>
            </h1>
            
            <p className="text-gray-300 font-sans text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Acompanhe massacres, embates de guilds e eliminações PvP ao vivo em todos os 16 mundos do RubinOT. O sistema detecta automaticamente confrontos em massa e calcula o prejuízo da treta!
            </p>
          </div>

          {/* Controles de Som e Refresh */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-md active:scale-95 ${
                soundEnabled
                  ? 'bg-red-600 text-white border-red-400 font-black shadow-lg shadow-red-600/30'
                  : 'bg-stone-900 border-stone-700 text-gray-400 hover:text-white'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundEnabled ? 'Som de Combate Ativado' : 'Ativar Alerta Sonoro'}</span>
            </button>

            <button
              onClick={fetchDeaths}
              className="p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-gray-300 hover:text-white transition-all active:scale-95"
              title="Recarregar Feed"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* DETECTOR DE BATALHAS EM ANDAMENTO (OPEN BATTLE ALERT) */}
      {detectedBattles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500 animate-bounce" />
              Confrontos em Massa Detectados Agora ({detectedBattles.length})
            </span>
            <span className="text-xs text-stone-400 font-mono">Últimos 15 minutos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detectedBattles.map((b, idx) => (
              <div 
                key={idx}
                className="bg-gradient-to-br from-red-950/60 via-stone-900 to-black border-2 border-red-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-4"
              >
                <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <div>
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">
                        Massacre em {b.world}
                      </h3>
                      <span className="text-[11px] text-red-300">
                        {b.totalFrags} mortes PvP confirmadas nesta batalha
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs font-mono animate-pulse shadow-lg">
                    TRETA ATIVA
                  </span>
                </div>

                {/* Métricas do Confronto */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-black/60 border border-stone-800 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">Total Frags</span>
                    <span className="text-lg font-black font-mono text-red-400">{b.totalFrags}</span>
                  </div>

                  <div className="bg-black/60 border border-stone-800 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">Custo Bless</span>
                    <span className="text-sm font-bold font-mono text-yellow-400">~{Math.round(b.totalGoldLost / 1000)}k gp</span>
                  </div>

                  <div className="bg-black/60 border border-stone-800 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">Equivalente</span>
                    <span className="text-sm font-bold font-mono text-amber-300">~{b.totalTcLost} TC</span>
                  </div>

                  <div className="bg-black/60 border border-stone-800 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">Duração</span>
                    <span className="text-xs font-bold font-mono text-stone-300">
                      {Math.max(1, Math.round((b.latestTime - b.startTime) / 60000))} min
                    </span>
                  </div>
                </div>

                {/* MVP & Alvo Principal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {b.mvp && (
                    <div className="bg-stone-950/80 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-amber-400" />
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">MVP da Batalha</span>
                          <span className="text-xs font-bold text-white">{b.mvp.name}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {b.mvp.frags} frags
                      </span>
                    </div>
                  )}

                  {b.target && (
                    <div className="bg-stone-950/80 border border-red-500/30 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crosshair size={16} className="text-red-400" />
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Maior Feeder</span>
                          <span className="text-xs font-bold text-white">{b.target.name}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                        {b.target.deaths} mortes
                      </span>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS DO FEED */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Seletor de Mundo */}
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-amber-400" />
            <select
              value={selectedWorld}
              onChange={(e) => setSelectedWorld(e.target.value)}
              className="bg-stone-950 border border-stone-700 text-xs text-yellow-300 rounded-xl px-3 py-2 font-bold cursor-pointer focus:outline-none focus:border-red-500"
            >
              {WORLDS_LIST.map(w => (
                <option key={w.id} value={w.id} className="bg-stone-950 text-white">
                  {w.icon} {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro PvP vs PvE */}
          <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-1">
            <button
              onClick={() => setPvpOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pvpOnly ? 'bg-red-600 text-white font-black shadow' : 'text-gray-400 hover:text-white'}`}
            >
              ⚔️ Apenas PvP
            </button>
            <button
              onClick={() => setPvpOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!pvpOnly ? 'bg-stone-800 text-white font-black shadow' : 'text-gray-400 hover:text-white'}`}
            >
              🌟 Todas as Mortes
            </button>
          </div>

          {/* Filtro de Level */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1">Level:</span>
            {['ALL', '300', '600', '900'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setMinLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                  minLevel === lvl 
                    ? 'bg-amber-500 text-stone-950 font-black' 
                    : 'bg-stone-950 border border-stone-800 text-gray-400 hover:text-white'
                }`}
              >
                {lvl === 'ALL' ? 'Todos' : `${lvl}+`}
              </button>
            ))}
          </div>

        </div>

        <span className="text-xs text-gray-400 font-mono">
          {filteredFeed.length} mortes no radar
        </span>
      </div>

      {/* FEED PRINCIPAL DE MORTES / FRAGS */}
      <div className="space-y-3">
        {filteredFeed.length === 0 ? (
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-12 text-center text-gray-400 space-y-2">
            <Skull size={36} className="mx-auto text-gray-600" />
            <p className="text-sm font-bold text-gray-300">Nenhum frag recente com os filtros selecionados.</p>
            <p className="text-xs text-gray-500">O feed atualiza automaticamente a cada 10 segundos.</p>
          </div>
        ) : (
          filteredFeed.map((d, idx) => {
            const isPvp = d._killerInfo.isPvp;

            return (
              <div 
                key={d.id || idx}
                className={`bg-stone-900/90 border rounded-2xl p-4 sm:p-5 shadow-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isPvp 
                    ? 'border-red-500/40 hover:border-red-500/80 bg-gradient-to-r from-red-950/30 via-stone-900 to-stone-900' 
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Ícone Indicador */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border text-xl shadow-inner ${
                    isPvp 
                      ? 'bg-red-950/80 border-red-500/50 text-red-400' 
                      : 'bg-stone-950 border-stone-800 text-gray-500'
                  }`}>
                    {isPvp ? '⚔️' : '💀'}
                  </div>

                  {/* Informações da Eliminação */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {d.character_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-xs font-mono font-bold text-amber-400">
                        Lvl {d.level}
                      </span>
                      {d.world_name && (
                        <span className="px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-[11px] text-gray-400">
                          {d.world_name}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-300 mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-gray-500">Eliminado por:</span>
                      <strong className={`${isPvp ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                        {d._killerInfo.primary}
                      </strong>
                      {d._killerInfo.assist && (
                        <span className="text-xs text-gray-400">
                          (assistência: <strong className="text-amber-300">{d._killerInfo.assist}</strong>)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tempo e Ações */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-stone-800/80 pt-2 sm:pt-0 shrink-0">
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <Clock size={12} className="text-gray-500" />
                    {getRelativeTime(d.death_time || d.created_at)}
                  </span>

                  <button
                    onClick={() => onPlayerClick && onPlayerClick(d.character_name)}
                    className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 mt-1 transition-colors"
                  >
                    <span>Dossiê do Alvo</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ADSENSE */}
      <div className="mt-4">
        <AdBanner />
      </div>

    </div>
  );
}
