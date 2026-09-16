import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Swords, Skull, Search, Globe, ShieldAlert, Crosshair, 
  Flame, Clock, Filter, Volume2, VolumeX, Trophy, AlertTriangle, 
  ChevronRight, ArrowUpRight, User, RefreshCw, Sparkles, CheckCircle 
} from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import AdBanner from '../components/AdBanner';

// Função para detectar se a morte foi PvP ou PvE
const isPvpFrag = (killedBy) => {
  if (!killedBy) return false;
  const kb = killedBy.toLowerCase();
  
  // Monstros conhecidos ou genéricos que indicam PvE puro
  const pveKeywords = [
    'field item', 'fire field', 'energy field', 'poison field', 
    'lava', 'drowning', 'suicide', 'curse'
  ];
  if (pveKeywords.some(k => kb.includes(k))) return false;

  // Se contiver maiúsculas no meio de palavras ou indicação de "por [Player]"
  // Em servidores de Tibia/Rubinot, jogadores têm nomes com iniciais maiúsculas
  const hasCapitalLetter = /[A-Z]/.test(killedBy);
  const hasCommonMonsterWords = /^(demon|werelion|dragon|grim reaper|sphinx|lamassu|adult goanna|young goanna|mean lost soul|flimsy lost soul|freakish lost soul|juggernaut|skeleton|ghoul|orc|valkyrie|witch|behemoth|hydra|warlock|vampire|gargoyle|rotworm|cyclops|minotaur|troll|wolf|bear|spider|wasp|snake|centipede|rat|cave rat)/i.test(killedBy);

  if (hasCapitalLetter && !hasCommonMonsterWords) return true;
  if (kb.includes('maior dano por') && hasCapitalLetter) return true;
  return false;
};

// Limpa e extrai nomes de assassinos de strings como "Player A (maior dano por Player B)"
const extractKillers = (killedBy) => {
  if (!killedBy) return { primary: 'Desconhecido', assist: null, isPvp: false };
  const pvp = isPvpFrag(killedBy);
  
  if (!pvp) {
    return { primary: killedBy, assist: null, isPvp: false };
  }

  const parts = killedBy.split('(maior dano por');
  const primary = parts[0].replace(/killed by/i, '').replace(/morto por/i, '').trim();
  const assist = parts[1] ? parts[1].replace(')', '').trim() : null;

  return { primary, assist, isPvp: true };
};

// Formatação amigável de tempo relativo
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
  return new Date(isoDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export default function WarAttendance({ onPlayerClick }) {
  const { activeWorld, setActiveWorld } = useWorld();
  const [selectedWorld, setSelectedWorld] = useState(activeWorld || 'ALL');
  const [activeTab, setActiveTab] = useState('killboard'); // 'killboard', 'most_wanted', 'attendance'
  const [modeFilter, setModeFilter] = useState('ALL'); // 'ALL', 'PVP_ONLY', 'PVE_ONLY'
  const [levelFilter, setLevelFilter] = useState('ALL'); // 'ALL', '300', '600', '1000'
  const [search, setSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const [deaths, setDeaths] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Efeito Sonoro de Combate (Web Audio API sintetizado)
  const playWarSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  useEffect(() => {
    if (activeWorld) {
      setSelectedWorld(activeWorld);
    }
  }, [activeWorld]);

  const fetchDeaths = async () => {
    try {
      const { data, error } = await supabase
        .from('recent_deaths')
        .select('*')
        .order('id', { ascending: false })
        .limit(250);

      if (error) throw error;
      setDeaths(data || []);
    } catch (e) {
      console.error('Erro ao buscar mortes do killboard:', e);
    }
  };

  const fetchAttendance = async () => {
    try {
      const ssDate = new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('guild_attendance')
        .select('*')
        .eq('date', ssDate)
        .order('minutes_online', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (e) {
      console.error('Erro ao buscar attendance:', e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchDeaths(), fetchAttendance()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();

    // Auto-refresh a cada 30 segundos (apenas se a aba estiver visível)
    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      await fetchDeaths();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDeaths(), fetchAttendance()]);
    playWarSound();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Processamento e enriquecimento dos abates
  const parsedDeaths = useMemo(() => {
    return deaths.map(d => {
      const killerInfo = extractKillers(d.killed_by);
      return {
        ...d,
        killerInfo,
        isPvp: killerInfo.isPvp
      };
    });
  }, [deaths]);

  // Filtros aplicados
  const filteredDeaths = useMemo(() => {
    return parsedDeaths.filter(d => {
      // Filtro de Modo
      if (modeFilter === 'PVP_ONLY' && !d.isPvp) return false;
      if (modeFilter === 'PVE_ONLY' && d.isPvp) return false;

      // Filtro de Level
      if (levelFilter === '300' && (d.level || 0) < 300) return false;
      if (levelFilter === '600' && (d.level || 0) < 600) return false;
      if (levelFilter === '1000' && (d.level || 0) < 1000) return false;

      // Filtro de Busca
      if (search) {
        const q = search.toLowerCase();
        const vName = (d.character_name || '').toLowerCase();
        const kName = (d.killerInfo?.primary || '').toLowerCase();
        const aName = (d.killerInfo?.assist || '').toLowerCase();
        if (!vName.includes(q) && !kName.includes(q) && !aName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [parsedDeaths, modeFilter, levelFilter, search]);

  // Estatísticas macro do dia
  const stats = useMemo(() => {
    const total = parsedDeaths.length;
    const pvpKills = parsedDeaths.filter(d => d.isPvp).length;
    const pveDeaths = total - pvpKills;
    const highestLevel = parsedDeaths.reduce((max, d) => Math.max(max, d.level || 0), 0);
    const pvpRatio = total > 0 ? Math.round((pvpKills / total) * 100) : 0;

    return { total, pvpKills, pveDeaths, highestLevel, pvpRatio };
  }, [parsedDeaths]);

  // Agregação dos Maiores Matadores PvP (Most Wanted)
  const topFraggers = useMemo(() => {
    const counts = {};
    parsedDeaths.filter(d => d.isPvp).forEach(d => {
      const killer = d.killerInfo.primary;
      if (killer && killer !== 'Desconhecido') {
        counts[killer] = (counts[killer] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, frags]) => ({ name, frags }))
      .sort((a, b) => b.frags - a.frags)
      .slice(0, 10);
  }, [parsedDeaths]);

  // Agregação das Maiores Vítimas
  const topVictims = useMemo(() => {
    const counts = {};
    parsedDeaths.forEach(d => {
      const v = d.character_name;
      if (v) {
        counts[v] = { count: (counts[v]?.count || 0) + 1, level: d.level };
      }
    });

    return Object.entries(counts)
      .map(([name, info]) => ({ name, deaths: info.count, level: info.level }))
      .sort((a, b) => b.deaths - a.deaths)
      .slice(0, 10);
  }, [parsedDeaths]);

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto text-gray-200 font-sans animate-fade-in">
      
      {/* Header do Killboard */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 border-b border-tibia-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Swords size={14} className="animate-pulse" /> Telemetria de Combate ao Vivo
          </div>
          <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold drop-shadow-md">
            Killboard de Guerra <span className="text-red-500 font-sans text-2xl sm:text-3xl font-black">& Frags</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Feed de abates em tempo real, detecção de conflitos PvP, rankings dos maiores assassinos e vítimas do servidor.
          </p>
        </div>

        {/* Botões de Ação e Efeitos */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              soundEnabled
                ? 'bg-red-950/60 border-red-500/60 text-red-300 shadow-md shadow-red-900/30'
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
            }`}
            title={soundEnabled ? 'Sons de combate ativados' : 'Ativar sons de combate'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span className="hidden sm:inline">Som {soundEnabled ? 'Ativo' : 'Mudo'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Atualizar Feed</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas e Balanço de Guerra */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-tibia-card border border-tibia-border rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            <Swords size={22} />
          </div>
          <div>
            <div className="text-2xl font-medieval font-bold text-white">{stats.pvpKills}</div>
            <div className="text-xs text-gray-400">Frags PvP Registrados</div>
          </div>
        </div>

        <div className="bg-tibia-card border border-tibia-border rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
            <Skull size={22} />
          </div>
          <div>
            <div className="text-2xl font-medieval font-bold text-white">{stats.total}</div>
            <div className="text-xs text-gray-400">Baixas Totais (24h)</div>
          </div>
        </div>

        <div className="bg-tibia-card border border-tibia-border rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Trophy size={22} />
          </div>
          <div>
            <div className="text-2xl font-medieval font-bold text-white">Lvl {stats.highestLevel}</div>
            <div className="text-xs text-gray-400">Maior Level Abatido</div>
          </div>
        </div>

        <div className="bg-tibia-card border border-tibia-border rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Flame size={22} />
          </div>
          <div>
            <div className="text-2xl font-medieval font-bold text-white">{stats.pvpRatio}%</div>
            <div className="text-xs text-gray-400">Índice de Sangue (PvP)</div>
          </div>
        </div>
      </div>

      {/* Abas Principais */}
      <div className="flex items-center gap-2 border-b border-tibia-border mb-6">
        <button
          onClick={() => setActiveTab('killboard')}
          className={`flex items-center gap-2 px-5 py-3 font-medieval text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'killboard'
              ? 'border-yellow-400 text-yellow-400 bg-yellow-500/10 font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Swords size={16} /> Feed de Abates ao Vivo ({filteredDeaths.length})
        </button>

        <button
          onClick={() => setActiveTab('most_wanted')}
          className={`flex items-center gap-2 px-5 py-3 font-medieval text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'most_wanted'
              ? 'border-red-400 text-red-400 bg-red-950/20 font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Crosshair size={16} /> Most Wanted (Top Assassinos)
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-5 py-3 font-medieval text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'border-blue-400 text-blue-400 bg-blue-950/20 font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Clock size={16} /> Presença & Horas Online
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      {activeTab === 'killboard' && (
        <div className="bg-black/50 border border-tibia-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Busca por Jogador */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar vítima ou assassino..."
              className="w-full bg-black/70 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Filtro de Modo de Morte */}
          <div className="flex items-center gap-1.5 w-full md:w-auto flex-wrap">
            <span className="text-xs text-gray-500 font-mono mr-1">Modo:</span>
            <button
              onClick={() => setModeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modeFilter === 'ALL'
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'bg-black/40 text-gray-400 border border-white/10 hover:bg-white/5'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setModeFilter('PVP_ONLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                modeFilter === 'PVP_ONLY'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/50'
                  : 'bg-black/40 text-red-400 border border-red-500/30 hover:bg-red-950/40'
              }`}
            >
              <Swords size={12} /> Frags PvP ({stats.pvpKills})
            </button>
            <button
              onClick={() => setModeFilter('PVE_ONLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                modeFilter === 'PVE_ONLY'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-black/40 text-gray-400 border border-white/10 hover:bg-white/5'
              }`}
            >
              <Skull size={12} /> PvE ({stats.pveDeaths})
            </button>
          </div>

          {/* Filtro de Nível */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs text-gray-500 font-mono mr-1">Nível:</span>
            {['ALL', '300', '600', '1000'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  levelFilter === lvl
                    ? 'bg-white/20 text-yellow-300 font-bold border border-yellow-500/40'
                    : 'bg-black/30 text-gray-500 border border-transparent hover:text-white'
                }`}
              >
                {lvl === 'ALL' ? 'Todos' : `+${lvl}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ABA 1: FEED DE ABATES AO VIVO */}
      {activeTab === 'killboard' && (
        <div className="space-y-2.5">
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-medieval">
              <RefreshCw className="animate-spin mx-auto mb-2 text-yellow-400" size={24} />
              Carregando feed de combate em tempo real...
            </div>
          ) : filteredDeaths.length === 0 ? (
            <div className="p-12 text-center bg-black/40 border border-white/10 rounded-2xl text-gray-400 font-sans">
              <ShieldAlert className="mx-auto mb-2 text-gray-500" size={32} />
              Nenhum abate encontrado para os filtros selecionados.
            </div>
          ) : (
            filteredDeaths.map((d) => {
              const isPvp = d.isPvp;
              return (
                <div
                  key={d.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPvp
                      ? 'bg-gradient-to-r from-red-950/40 via-black to-red-950/20 border-red-500/40 shadow-md shadow-red-950/20 hover:border-red-400'
                      : 'bg-black/50 border-tibia-border hover:border-yellow-500/30'
                  }`}
                >
                  {/* Lado Esquerdo: Vítima */}
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <div className={`p-2.5 rounded-lg shrink-0 ${
                      isPvp ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      {isPvp ? <Swords size={18} /> : <Skull size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onPlayerClick && onPlayerClick(d.character_name)}
                          className="font-medieval text-base font-bold text-white hover:text-yellow-400 transition-colors text-left cursor-pointer drop-shadow-sm"
                        >
                          {d.character_name}
                        </button>
                        <span className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-gray-300 font-bold">
                          Lvl {d.level || '?'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span className={isPvp ? 'text-red-400 font-bold' : 'text-purple-400'}>
                          {isPvp ? '⚔️ Abate PvP' : '💀 Baixa PvE'}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-gray-500">{getRelativeTime(d.death_time)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Centro: Ícone de Agressão */}
                  <div className="hidden md:flex flex-col items-center px-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 font-mono">
                      {isPvp ? 'Abatido por' : 'Devorado por'}
                    </span>
                    <div className="w-12 h-px bg-white/15 my-1" />
                    <span className="text-xs text-yellow-500/70">⚔️</span>
                  </div>

                  {/* Lado Direito: Assassino / Causa */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 min-w-[260px] text-right">
                    <div className="text-left sm:text-right">
                      {isPvp ? (
                        <div>
                          <div className="flex items-center sm:justify-end gap-1.5">
                            <button
                              onClick={() => onPlayerClick && onPlayerClick(d.killerInfo.primary)}
                              className="font-medieval text-sm font-bold text-red-300 hover:text-yellow-400 transition-colors cursor-pointer"
                            >
                              {d.killerInfo.primary}
                            </button>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-500/40 font-bold">
                              FRAG
                            </span>
                          </div>
                          {d.killerInfo.assist && (
                            <div className="text-[11px] text-gray-400 flex items-center sm:justify-end gap-1">
                              <span className="text-gray-500">Assist:</span>
                              <button
                                onClick={() => onPlayerClick && onPlayerClick(d.killerInfo.assist)}
                                className="text-gray-300 hover:text-yellow-400 transition-colors"
                              >
                                {d.killerInfo.assist}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="font-medieval text-sm text-yellow-500/90 font-bold">
                            {d.killed_by}
                          </div>
                          <div className="text-[10px] text-gray-500">Criatura / Caçada</div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onPlayerClick && onPlayerClick(d.character_name)}
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors cursor-pointer shrink-0"
                      title="Ver Dossiê Tático"
                    >
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ABA 2: MOST WANTED & MAIORES VÍTIMAS */}
      {activeTab === 'most_wanted' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Assassinos */}
          <div className="bg-tibia-card border-2 border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-500/20">
              <Crosshair className="text-red-400" size={22} />
              <div>
                <h3 className="text-xl font-medieval font-bold text-red-400">Most Wanted • Top Fraggers</h3>
                <p className="text-xs text-gray-400">Os maiores matadores PvP registrados nas últimas 24 horas.</p>
              </div>
            </div>

            <div className="space-y-2">
              {topFraggers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhum frag PvP recente registrado.</div>
              ) : (
                topFraggers.map((k, idx) => (
                  <div
                    key={k.name}
                    onClick={() => onPlayerClick && onPlayerClick(k.name)}
                    className="p-3 rounded-xl bg-black/40 hover:bg-red-950/30 border border-white/5 hover:border-red-500/40 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        idx === 0 ? 'bg-yellow-500 text-black' :
                        idx === 1 ? 'bg-gray-300 text-black' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-black/60 text-gray-400 border border-white/10'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="font-medieval text-sm font-bold text-white hover:text-yellow-400 transition-colors">
                        {k.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-mono font-bold">
                        {k.frags} {k.frags === 1 ? 'Frag' : 'Frags'}
                      </span>
                      <ArrowUpRight size={14} className="text-gray-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Vítimas */}
          <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <Skull className="text-gray-400" size={22} />
              <div>
                <h3 className="text-xl font-medieval font-bold text-white">Top Vítimas • Mortes Frequentes</h3>
                <p className="text-xs text-gray-400">Guerreiros que mais tombaram em combate ou caçadas hoje.</p>
              </div>
            </div>

            <div className="space-y-2">
              {topVictims.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhum registro de morte recente.</div>
              ) : (
                topVictims.map((v, idx) => (
                  <div
                    key={v.name}
                    onClick={() => onPlayerClick && onPlayerClick(v.name)}
                    className="p-3 rounded-xl bg-black/40 hover:bg-white/5 border border-white/5 hover:border-yellow-500/30 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-black/60 text-gray-400 border border-white/10 flex items-center justify-center text-xs font-bold font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-medieval text-sm font-bold text-white hover:text-yellow-400 transition-colors block">
                          {v.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">Lvl {v.level || '?'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-gray-300 text-xs font-mono font-bold">
                        {v.deaths} {v.deaths === 1 ? 'Morte' : 'Mortes'}
                      </span>
                      <ArrowUpRight size={14} className="text-gray-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: PRESENÇA & HORAS ONLINE (ATTENDANCE LEGADO OTIMIZADO) */}
      {activeTab === 'attendance' && (
        <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-2xl">
          <div className="mb-4 pb-3 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-xl font-medieval font-bold text-blue-400 flex items-center gap-2">
                <Clock size={20} /> Registro de Horas Online no Servidor
              </h3>
              <p className="text-xs text-gray-400">Tempo de atividade computado durante o ciclo atual de Server Save.</p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              Total monitorados: {attendanceData.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {attendanceData.slice(0, 48).map((att) => {
              const mins = Number(att.minutes_online) || 0;
              const hours = (mins / 60).toFixed(1);
              return (
                <div
                  key={att.id || att.character_name}
                  onClick={() => onPlayerClick && onPlayerClick(att.character_name)}
                  className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-blue-500/40 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-400" />
                    <span className="font-medieval text-xs font-bold text-white hover:text-yellow-400 transition-colors">
                      {att.character_name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold">
                    {hours}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner de Anúncio AdSense */}
      <div className="mt-8">
        <AdBanner slot="killboard-footer" format="auto" />
      </div>

    </div>
  );
}
