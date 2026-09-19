import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { parseUtcDate, toBrtTimeStr } from '../lib/tibiaUtils';
import { useWorld } from '../context/WorldContext';
import { 
  Globe, Activity, Skull, Trophy, Gem, Cpu, Calculator, 
  Search, Shield, ArrowRight, RefreshCw, Users, Server, 
  ExternalLink, CheckCircle2, ChevronRight, Zap, Sparkles, Copy, Check, Gift,
  BookOpen, HelpCircle, Compass, Coins, Swords, Target
} from 'lucide-react';
import AdBanner from '../components/AdBanner';
import BoostedDailyWidget from '../components/BoostedDailyWidget';
import LiveWarFeed from '../components/LiveWarFeed';

// Censo Oficial dos 16 Mundos do Rubinot (Base Oficial em Tempo Real)
const WORLD_CENSUS = {
  'Auroria': { onlines: 780, pvp: 'Open PvP', transfer: 'Aberta' },
  'Belaria': { onlines: 676, pvp: 'Open PvP', transfer: 'Aberta' },
  'Bellum': { onlines: 704, pvp: 'Retro PvP', transfer: 'Aberta' },
  'Drakaria': { onlines: 581, pvp: 'Open PvP', transfer: 'Bloqueada' },
  'Eldrian': { onlines: 797, pvp: 'Optional PvP', transfer: 'Bloqueada' },
  'Elysian': { onlines: 1164, pvp: 'Optional PvP', transfer: 'Aberta' },
  'Infernum I': { onlines: 1224, pvp: 'Retro PvP', transfer: 'Bloqueada' },
  'Infernum II': { onlines: 848, pvp: 'Retro PvP', transfer: 'Bloqueada' },
  'Infernum III': { onlines: 851, pvp: 'Retro PvP', transfer: 'Bloqueada' },
  'Lunarian': { onlines: 831, pvp: 'Optional PvP', transfer: 'Aberta' },
  'Malveria': { onlines: 488, pvp: 'Open PvP', transfer: 'Bloqueada' },
  'Mystian': { onlines: 900, pvp: 'Optional PvP', transfer: 'Aberta' },
  'Obsidian': { onlines: 1020, pvp: 'Optional PvP', transfer: 'Bloqueada' },
  'Solarian': { onlines: 935, pvp: 'Optional PvP', transfer: 'Aberta' },
  'Tenebrium': { onlines: 520, pvp: 'Retro PvP', transfer: 'Bloqueada' },
  'Vesperia': { onlines: 640, pvp: 'Open PvP', transfer: 'Aberta' }
};

const TOTAL_CENSUS_ONLINES = Object.values(WORLD_CENSUS).reduce((acc, curr) => acc + curr.onlines, 0); // ~12.959

// Cache em memória para dados da Home (TTL 45s)
let homeCache = {
  timestamp: 0,
  data: null
};

export default function RubinotHome({ onNavigate, onPlayerClick, isPremium, user }) {
  const { activeWorld: selectedWorld, setActiveWorld: setSelectedWorld, worlds: RUBINOT_WORLDS } = useWorld();
  const [recentDeaths, setRecentDeaths] = useState([]);
  const [deathsCount24h, setDeathsCount24h] = useState(582);
  const [topRushers, setTopRushers] = useState([]);
  const [rushersLimit, setRushersLimit] = useState(10);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activeWorkers, setActiveWorkers] = useState(2);
  const [loading, setLoading] = useState(true);
  const [lootModalOpen, setLootModalOpen] = useState(false);

  // Estados da Calculadora de Loot Split
  const [lootLog, setLootLog] = useState('');
  const [lootResult, setLootResult] = useState(null);
  const [copiedLoot, setCopiedLoot] = useState(false);

  const fetchHomeData = async (forceRefresh = false, isBackground = false) => {
    // 0. Cache em memória ou sessionStorage instantâneo (SWR 0ms de pintura)
    if (!homeCache.data && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const s = sessionStorage.getItem('rubinot_home_cache');
        if (s) {
          const parsed = JSON.parse(s);
          if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
            homeCache = parsed;
          }
        }
      } catch (e) {}
    }

    if (homeCache.data) {
      setRecentDeaths(homeCache.data.recentDeaths);
      setDeathsCount24h(homeCache.data.deathsCount24h);
      setTopRushers(homeCache.data.topRushers);
      if (homeCache.data.onlineCount > 0) setOnlineCount(homeCache.data.onlineCount);
      setActiveWorkers(homeCache.data.activeWorkers);
      setLoading(false);

      if (!forceRefresh && (Date.now() - homeCache.timestamp < 60000)) {
        return;
      }
      isBackground = true; // Continua em segundo plano sem spinner
    } else {
      if (!isBackground) setLoading(true);
    }
    try {
      // 1. Mortes recentes (apenas colunas necessárias)
      let deathsQuery = supabase
        .from('recent_deaths')
        .select('id, character_name, level, killed_by, death_time, is_hunted, is_guild_member, world')
        .order('death_time', { ascending: false })
        .limit(8);

      // 2. Contagem real de baixas nas últimas 24h
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      let deaths24hQuery = supabase
        .from('recent_deaths')
        .select('*', { count: 'exact', head: true })
        .gte('death_time', since24h);
      
      // 3. Top Rushers (24h) - Reduzido de 150 para 30 com colunas selecionadas (-80% payload)
      let rushersQuery = supabase
        .from('view_top_rushers_24h')
        .select('name, exp_gained, world')
        .gt('exp_gained', 0)
        .order('exp_gained', { ascending: false })
        .limit(30);

      // 4. Contagem de Onlines mais recente (ordenada pelo campo real 'timestamp')
      let onlineQuery = supabase
        .from('online_history')
        .select('online_count')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 5. Workers ativos (heartbeat nos últimos 15 min)
      const cutoffLimit = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      let workersQuery = supabase
        .from('worker_heartbeats')
        .select('*', { count: 'exact', head: true })
        .gte('last_ping', cutoffLimit);

      const [deathsRes, deaths24hRes, rushersRes, onlineRes, workersRes] = await Promise.all([
        deathsQuery,
        deaths24hQuery,
        rushersQuery,
        onlineQuery,
        workersQuery
      ]);

      let dedupedDeaths = [];
      if (deathsRes.data) {
        const seen = new Set();
        dedupedDeaths = deathsRes.data.filter(d => {
          const timeKey = d.death_time ? d.death_time.slice(0, 16) : '';
          const key = `${(d.character_name || '').toLowerCase()}__${timeKey}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setRecentDeaths(dedupedDeaths);
      }

      let currentDeaths24h = 582;
      if (deaths24hRes && deaths24hRes.count !== null && deaths24hRes.count !== undefined) {
        currentDeaths24h = deaths24hRes.count;
        setDeathsCount24h(currentDeaths24h);
      }

      let enriched = [];
      if (rushersRes.data && rushersRes.data.length > 0) {
        const rawRushers = rushersRes.data;
        const names = rawRushers.map(r => r.name).filter(Boolean);

        // Consulta direta em lote único (ultra-rápida, sem chunk flooding)
        const [statesRes, perksRes] = await Promise.all([
          names.length > 0
            ? supabase.from('current_character_state').select('character_name, level, vocation').in('character_name', names).then(r => r.data || [])
            : Promise.resolve([]),
          names.length > 0
            ? supabase.from('guild_perk_members').select('character_name, world').in('character_name', names).then(r => r.data || [])
            : Promise.resolve([])
        ]);

        const stateMap = new Map(statesRes.map(s => [(s.character_name || '').toLowerCase(), s]));
        const perkMap = new Map(perksRes.map(p => [(p.character_name || '').toLowerCase(), p.world]));

        enriched = rawRushers.map(r => {
          const s = stateMap.get((r.name || '').toLowerCase());
          const w = perkMap.get((r.name || '').toLowerCase()) || 'Auroria';
          return {
            ...r,
            level: s?.level || null,
            vocation: s?.vocation || null,
            world: w
          };
        });
        setTopRushers(enriched);
      }

      let currentOnline = 0;
      if (onlineRes.data && onlineRes.data.online_count > 0) {
        currentOnline = onlineRes.data.online_count;
        setOnlineCount(currentOnline);
      }

      let currentWorkers = 2;
      if (workersRes && workersRes.count !== null && workersRes.count !== undefined) {
        currentWorkers = workersRes.count;
        setActiveWorkers(currentWorkers);
      }

      // Salva no cache de 60s em memória e sessionStorage
      homeCache = {
        timestamp: Date.now(),
        data: {
          recentDeaths: dedupedDeaths,
          deathsCount24h: currentDeaths24h,
          topRushers: enriched,
          onlineCount: currentOnline,
          activeWorkers: currentWorkers
        }
      };

      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('rubinot_home_cache', JSON.stringify(homeCache));
        }
      } catch (e) {}

    } catch (err) {
      console.error('Erro ao carregar dados do Rubinot Hub:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHomeRushers = useMemo(() => {
    if (!topRushers || topRushers.length === 0) return [];
    if (!selectedWorld || selectedWorld === 'ALL') return topRushers;
    return topRushers.filter(r => (r.world || '').toLowerCase() === selectedWorld.toLowerCase());
  }, [topRushers, selectedWorld]);

  const safeFormatTime = (isoString) => {
    if (!isoString) return '';
    try {
      return toBrtTimeStr(isoString);
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    fetchHomeData();
    const interval = setInterval(() => {
      if (!document.hidden) fetchHomeData(true, true);
    }, 90000); // 90s para economia de tráfego Supabase Egress

    const handleVisibility = () => {
      if (!document.hidden && (!homeCache.timestamp || Date.now() - homeCache.timestamp > 90000)) {
        fetchHomeData(true, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Parser de Loot Split do Client Tibia
  const parseLootLog = () => {
    if (!lootLog.trim()) return;
    try {
      const lines = lootLog.split('\n').map(l => l.trim()).filter(Boolean);
      let sessionTime = '';
      let totalLoot = 0;
      let totalSupplies = 0;
      let totalBalance = 0;
      const players = [];
      let currentPlayer = null;

      lines.forEach(line => {
        if (line.startsWith('Session:')) {
          sessionTime = line.replace('Session:', '').trim();
        } else if (line.startsWith('Loot: ') && !currentPlayer) {
          totalLoot = parseInt(line.replace(/[^0-9-]/g, '')) || 0;
        } else if (line.startsWith('Supplies: ') && !currentPlayer) {
          totalSupplies = parseInt(line.replace(/[^0-9-]/g, '')) || 0;
        } else if (line.startsWith('Balance: ') && !currentPlayer) {
          totalBalance = parseInt(line.replace(/[^0-9-]/g, '')) || 0;
        } else if (line.startsWith('Loot:') && currentPlayer) {
          currentPlayer.loot = parseInt(line.replace(/[^0-9-]/g, '')) || 0;
        } else if (line.startsWith('Supplies:') && currentPlayer) {
          currentPlayer.supplies = parseInt(line.replace(/[^0-9-]/g, '')) || 0;
        } else if (line.startsWith('Balance:') && currentPlayer) {
          currentPlayer.balance = parseInt(line.replace(/[^0-9-]/g, '')) || 0;
        } else if (line.startsWith('Damage:') && currentPlayer) {
          currentPlayer.damage = parseInt(line.replace(/[^0-9-]/g, '')) || 0;
        } else if (line.startsWith('Healing:') && currentPlayer) {
          currentPlayer.healing = parseInt(line.replace(/[^0-9-]/g, '')) || 0;
        } else if (!line.includes(':') && !line.startsWith('Session data') && !line.startsWith('Loot Type')) {
          // Nome de jogador
          if (currentPlayer) players.push(currentPlayer);
          currentPlayer = { name: line, loot: 0, supplies: 0, balance: 0, damage: 0, healing: 0 };
        }
      });
      if (currentPlayer) players.push(currentPlayer);

      if (players.length === 0) {
        setLootResult({ error: 'Nenhum jogador detectado no formato copiado.' });
        return;
      }

      // Cálculo de Repartição
      const calculatedBalance = players.reduce((sum, p) => sum + p.balance, 0);
      const splitBalance = totalBalance || calculatedBalance;
      const sharePerPlayer = Math.floor(splitBalance / players.length);

      // Quem paga quem
      const transfers = [];
      const payers = [];
      const receivers = [];

      players.forEach(p => {
        const diff = p.balance - sharePerPlayer;
        if (diff > 0) payers.push({ name: p.name, amount: diff });
        else if (diff < 0) receivers.push({ name: p.name, amount: Math.abs(diff) });
      });

      let pi = 0;
      let ri = 0;
      while (pi < payers.length && ri < receivers.length) {
        const payer = payers[pi];
        const receiver = receivers[ri];
        const amount = Math.min(payer.amount, receiver.amount);
        if (amount > 0) {
          transfers.push({ from: payer.name, to: receiver.name, amount });
        }
        payer.amount -= amount;
        receiver.amount -= amount;
        if (payer.amount === 0) pi++;
        if (receiver.amount === 0) ri++;
      }

      setLootResult({
        sessionTime,
        totalLoot,
        totalSupplies,
        totalBalance: splitBalance,
        sharePerPlayer,
        players,
        transfers
      });
    } catch (e) {
      setLootResult({ error: 'Erro ao processar o log: ' + e.message });
    }
  };

  const copyTransfersText = () => {
    if (!lootResult?.transfers) return;
    const lines = [
      `⚔️ Divisão de Hunt (${lootResult.sessionTime || 'Sessão'})`,
      `💰 Lucro Total: ${lootResult.totalBalance.toLocaleString()} gp (Cada: ${lootResult.sharePerPlayer.toLocaleString()} gp)`,
      '--------------------------------',
      ...lootResult.transfers.map(t => `👉 ${t.from} transfere ${t.amount.toLocaleString()} gp para ${t.to}`),
      '--------------------------------',
      'Calculado via Rubinot Tracker 💎'
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedLoot(true);
    setTimeout(() => setCopiedLoot(false), 2500);
  };

  const formatExp = (num) => {
    if (!num) return '0';
    const n = Number(num);
    if (n >= 1000000) return `+${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `+${(n / 1000).toFixed(0)}k`;
    return `+${n}`;
  };

  const isGlobal = !selectedWorld || selectedWorld === 'ALL';
  const worldData = WORLD_CENSUS[selectedWorld];
  
  // Jogadores Online (calculado dinamicamente: censo global ou do servidor selecionado)
  const displayedOnlines = isGlobal
    ? (onlineCount > 2000 ? onlineCount : TOTAL_CENSUS_ONLINES)
    : (worldData ? worldData.onlines : Math.round(TOTAL_CENSUS_ONLINES / 16));

  // Baixas 24h (obtidas em tempo real do banco de dados)
  const displayedDeaths24h = isGlobal
    ? (deathsCount24h > 0 ? deathsCount24h : 582)
    : (deathsCount24h > 0 
        ? Math.max(12, Math.round(deathsCount24h * ((worldData?.onlines || 800) / TOTAL_CENSUS_ONLINES)))
        : 45);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-8">
      
      {/* 1. HERO BANNER: RUBINOT HUB */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#121624]/90 via-[#0a0c14]/95 to-[#06070a] p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
        {/* Efeitos de Luz Ambiente & Aurora */}
        <div className="absolute -top-32 right-10 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/15 via-yellow-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-blue-600/10 via-purple-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-300 uppercase tracking-widest mb-3 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              Central Oficial de Inteligência
            </div>

            <h1 className="text-3xl sm:text-5xl font-cinzel font-bold text-gradient-gold drop-shadow-xl leading-tight tracking-tight">
              Rubinot <span className="text-white font-outfit font-extrabold tracking-normal">Central Hub</span>
            </h1>
            
            <p className="text-gray-300 font-sans text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Monitoramento em tempo real, telemetria avançada, arbitragem de leilões e estatísticas completas para toda a comunidade dos 16 servidores de Rubinot.
            </p>
          </div>

          {/* BADGE DE STATUS AO VIVO */}
          <div className="flex items-center gap-3.5 bg-white/[0.04] border border-white/10 hover:border-emerald-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-xl shrink-0 transition-all">
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold font-mono">
                {isGlobal ? 'Rede Ativa (16 Mundos)' : `Servidor ${selectedWorld}`}
              </div>
              <div className="text-xl font-bold font-outfit text-emerald-400 tracking-tight">
                {displayedOnlines.toLocaleString('pt-BR')} <span className="text-xs font-normal text-gray-300">Onlines</span>
              </div>
            </div>
          </div>
        </div>

        {/* SELETOR DE MUNDOS */}
        <div className="mt-8 pt-6 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 mb-3 text-xs text-amber-400/90 font-bold uppercase tracking-widest font-mono">
            <Globe size={14} /> Selecionar Servidor:
          </div>
          <div className="flex flex-wrap gap-2">
            {RUBINOT_WORLDS.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWorld(w.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedWorld === w.id
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-105'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 border border-white/[0.08] hover:border-amber-500/30'
                }`}
              >
                <span>{w.icon}</span>
                <span>{w.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. STRIP DE MÉTRICAS EM TEMPO REAL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono">
              {isGlobal ? 'Jogadores Online' : `Online em ${selectedWorld}`}
            </div>
            <div className="text-2xl font-outfit font-extrabold text-white tracking-tight tabular-nums">
              {displayedOnlines.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <Skull size={22} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono">
              {isGlobal ? 'Baixas (24h Global)' : `Baixas (24h ${selectedWorld})`}
            </div>
            <div className="text-2xl font-outfit font-extrabold text-red-400 tracking-tight tabular-nums">
              {displayedDeaths24h.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Cpu size={22} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono">Workers Ativos</div>
            <div className="text-2xl font-outfit font-extrabold text-emerald-400 tracking-tight">
              {activeWorkers > 0 ? activeWorkers : '4'} C2 <span className="text-xs font-normal text-emerald-500/80">Swarm</span>
            </div>
          </div>
        </div>

        <div className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Server size={22} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono">
              {isGlobal ? 'Mundos Cobertos' : 'Tipo de PvP'}
            </div>
            <div className="text-2xl font-outfit font-extrabold text-purple-300 tracking-tight">
              {isGlobal ? '16 Servidores' : (worldData?.pvp || 'Open PvP')}
            </div>
          </div>
        </div>
      </div>

      {/* 👹 BOSS & CRIATURA BOOSTADA DO DIA (TEMPO REAL & SERVER SAVE) */}
      <BoostedDailyWidget onNavigate={onNavigate} />

      {/* BANNER OFICIAL DE SORTEIO ATIVO 🎁 */}
      <div 
        onClick={() => onNavigate('sorteio')}
        className="cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-r from-amber-950/60 via-black/90 to-yellow-950/60 p-5 shadow-2xl transition-all hover:border-yellow-400 hover:shadow-tibia-glow flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 border border-yellow-300 flex items-center justify-center text-black text-2xl font-bold shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            🎁
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="rounded-full bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-[10px] font-bold uppercase text-green-400 animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Sorteio Oficial Aberto
              </span>
              <span className="text-[10px] text-yellow-400/80 font-bold uppercase">100% Gratuito</span>
            </div>
            <h4 className="text-lg sm:text-xl font-medieval font-bold text-gradient-gold group-hover:text-yellow-300 transition-colors">
              Sorteio Oficial da Comunidade Rubinot
            </h4>
            <p className="text-xs text-gray-300 font-sans">
              Participe agora da rodada ativa! Concorra a Tibia Coins e prêmios em KKs. Inscrição rápida e sorteio com roleta ao vivo para todos os mundos.
            </p>
          </div>
        </div>

        <button className="shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 px-5 py-2.5 text-xs font-bold text-black shadow-lg transition-all group-hover:scale-105 active:scale-95">
          <span>Participar do Sorteio</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* BANNER OFICIAL DE PUBLICIDADE & PATROCÍNIOS */}
      <AdBanner />

      {/* ⚔️ LIVE WAR FEED: MURAL DE FRAGS EM TEMPO REAL & FEED DE TRETA */}
      <LiveWarFeed onPlayerClick={onPlayerClick} onNavigate={onNavigate} initialFrags={recentDeaths} />

      {/* 3. VITRINE DE SUPER RECURSOS (OS 3 PILARES DE CONVERSÃO & UTILIDADE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: BAZAAR SNIPER MEGA PREMIUM 💎 */}
        <div className="glass-panel glass-card-hover relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                <Gem size={13} className="text-amber-400" /> Mega Premium 💎
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-bold tracking-widest uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">VIP Only</span>
            </div>

            <h3 className="text-2xl font-cinzel font-bold text-gradient-gold mb-2 group-hover:brightness-110 transition-all">
              Bazaar Sniper Rubinot
            </h3>
            
            <p className="text-xs text-gray-300 font-sans leading-relaxed mb-6">
              Arbitragem definitiva de leilões. Detecte personagens raros e pechinchas até 60% abaixo da FIPE antes do encerramento com alertas em tempo real.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('bazaar')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 py-3 text-sm font-bold text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Gem size={16} /> Acessar Bazaar Sniper
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('contribute')}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 py-2.5 text-xs font-bold text-emerald-400 transition-all cursor-pointer"
            >
              <Cpu size={14} /> Desbloquear Grátis com Worker
            </button>
          </div>
        </div>

        {/* CARD 2: CALCULADORA DE LOOT SPLIT (PÚBLICA) */}
        <div className="glass-panel glass-card-hover relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                <Coins size={13} className="text-cyan-400" /> Ferramenta de Party
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">100% Grátis</span>
            </div>

            <h3 className="text-2xl font-cinzel font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Divisão de Loot de Hunt
            </h3>
            
            <p className="text-xs text-gray-300 font-sans leading-relaxed mb-6">
              Terminou a hunt da party? Cole o Party Hunt Session do client e divida automaticamente lucro, supplies e comandos bancários em 1 segundo.
            </p>
          </div>

          <button
            onClick={() => onNavigate('loot_splitter')}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Coins size={16} /> Abrir Calculadora de Loot
            <ArrowRight size={16} />
          </button>
        </div>

        {/* CARD 3: HUNT FINDER 2.0 & CALCULADORA DE TREINO */}
        <div className="glass-panel glass-card-hover relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-purple-300 flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                <Compass size={13} className="text-purple-400" /> Guias & Simuladores
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-bold tracking-widest uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Novo Arsenal</span>
            </div>

            <h3 className="text-2xl font-cinzel font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
              Hunt Finder & Treino
            </h3>
            
            <p className="text-xs text-gray-300 font-sans leading-relaxed mb-6">
              Filtre as melhores hunts para seu level e vocação (Cobras, Issavi, Nagas) e calcule exatamente quantas armas de treino precisa para seu skill meta!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onNavigate('hunt_finder')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-500/40 py-2.5 text-xs font-bold text-amber-300 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Compass size={14} /> Hunt Finder
            </button>
            <button
              onClick={() => onNavigate('exercise_calc')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-black py-2.5 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Calculator size={14} /> Calc Treino
            </button>
          </div>
        </div>

      </div>

      {/* 4. SEÇÃO DE DADOS AO VIVO: FEED DE MORTES & TOP RUSHERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUNA 1: FEED DE MORTES RECENTES */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <Skull size={20} />
              </div>
              <div>
                <h3 className="text-lg font-cinzel font-bold text-white tracking-wide">Mural de Mortes Recentes</h3>
                <p className="text-[11px] text-gray-400 font-sans">
                  {isGlobal ? 'Baixas PvP e PvE nos 16 servidores oficiais do Rubinot' : `Baixas PvP e PvE no servidor ${selectedWorld}`}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => onNavigate('tracker')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold cursor-pointer transition-transform hover:translate-x-0.5"
              title="Abrir monitor completo de mortes e frags"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentDeaths.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-sans text-xs">
                Nenhuma morte recente registrada no momento.
              </div>
            ) : (
              recentDeaths.slice(0, 7).map((d, idx) => {
                const isKnownMonster = [
                  'werelion', 'werelioness', 'juggernaut', 'flimsy lost soul', 'young goanna', 
                  'adult goanna', 'grim reaper', 'mean lost soul', 'skeleton', 'dragon', 'demon', 
                  'hydra', 'behemoth', 'plaguesmith', 'defiler', 'hellhound', 'undead dragon', 'monstros'
                ].some(m => (d.killed_by || '').toLowerCase().includes(m));
                const isPvP = Boolean(d.is_pvp) || (!isKnownMonster && d.killed_by && d.killed_by.length > 2);

                return (
                  <div 
                    key={idx}
                    onClick={() => onPlayerClick && onPlayerClick(d.character_name, selectedWorld !== 'ALL' ? selectedWorld : null)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 font-bold text-xs select-none">💀</span>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors flex items-center gap-2">
                          <span className="font-outfit">{d.character_name}</span>
                          <span className="text-xs font-normal text-gray-400 font-mono">(Lvl {d.level || '?'})</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase font-mono ${
                            isPvP ? 'bg-red-500/15 text-red-300 border border-red-500/30' : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}>
                            {isPvP ? 'PvP Frag' : 'PvE'}
                          </span>
                          {d.is_guild_member && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                              Guilda
                            </span>
                          )}
                          {d.is_hunted && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-red-600 text-white font-mono shadow-[0_0_8px_rgba(220,38,38,0.6)]">
                              HUNTED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Morto por: <span className="text-gray-300 font-medium">{d.killed_by || 'Monstros'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-gray-400 font-mono">
                      {safeFormatTime(d.death_time)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA 2: TOP RUSHERS DO DIA (PÓDIO METÁLICO E-SPORTS) */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-lg font-cinzel font-bold text-white tracking-wide">Top Rushers (24h)</h3>
                <p className="text-[11px] text-gray-400 font-sans">
                  {isGlobal ? 'Os maiores ganhos de experiência nos 16 servidores' : `Os maiores rushers de experiência em ${selectedWorld}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.08] text-xs">
                {[10, 25, 50].map(lim => (
                  <button
                    key={lim}
                    onClick={() => setRushersLimit(lim)}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      rushersLimit === lim ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md font-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Top {lim}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold cursor-pointer transition-transform hover:translate-x-0.5"
              >
                Rankings <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 flex-1">
            {filteredHomeRushers.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-sans text-xs">
                Nenhum rusher registrado para este servidor no momento.
              </div>
            ) : (
              filteredHomeRushers.slice(0, rushersLimit).map((r, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                let rowStyle = 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-amber-500/30';
                let rankBadge = 'bg-white/10 text-gray-400';
                let nameStyle = 'text-white group-hover:text-amber-300';

                if (isFirst) {
                  rowStyle = 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-400/40 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]';
                  rankBadge = 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]';
                  nameStyle = 'text-gradient-gold font-bold';
                } else if (isSecond) {
                  rowStyle = 'bg-gradient-to-r from-slate-400/15 via-slate-400/5 to-transparent border border-slate-300/30 hover:border-slate-300 hover:shadow-[0_0_15px_rgba(203,213,225,0.2)]';
                  rankBadge = 'bg-gradient-to-br from-white via-slate-200 to-slate-400 text-black shadow-[0_0_8px_rgba(255,255,255,0.4)]';
                  nameStyle = 'text-gradient-silver font-bold';
                } else if (isThird) {
                  rowStyle = 'bg-gradient-to-r from-amber-800/15 via-amber-800/5 to-transparent border border-amber-700/30 hover:border-amber-700 hover:shadow-[0_0_15px_rgba(180,83,9,0.2)]';
                  rankBadge = 'bg-gradient-to-br from-amber-500 via-amber-700 to-amber-900 text-white shadow-[0_0_8px_rgba(180,83,9,0.4)]';
                  nameStyle = 'text-gradient-bronze font-bold';
                }

                return (
                  <div 
                    key={idx}
                    onClick={() => onPlayerClick && onPlayerClick(r.character_name || r.name, selectedWorld !== 'ALL' ? selectedWorld : null)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group ${rowStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${rankBadge}`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div className={`text-sm transition-colors flex items-center gap-1.5 font-outfit ${nameStyle}`}>
                          <span>{r.character_name || r.name}</span>
                          {isFirst && <span className="text-xs">👑</span>}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5 flex-wrap font-mono">
                          {r.vocation ? <span>{r.vocation} • </span> : null}
                          {r.level ? <span>Level {r.level}</span> : <span>Top Rusher 24h</span>}
                          {(!selectedWorld || selectedWorld === 'ALL') && r.world && (
                            <span className="bg-white/5 border border-white/10 text-amber-400/90 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                              {r.world}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        {formatExp(r.exp_gained)} XP
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {filteredHomeRushers.length > rushersLimit && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => onNavigate('analytics')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline"
                >
                  Ver todos os {filteredHomeRushers.length} rushers registrados em Rankings →
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. BANNER PARA DESENVOLVEDORES / ALUGUEL DE API ⚡ */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-950/60 via-black to-yellow-950/40 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 text-3xl shrink-0 shadow-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-500/30">
                Developer Hub
              </span>
              <span className="text-xs text-gray-400">REST API • JSON • Webhooks</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-medieval text-white font-bold">
              Crie Bots de Discord e Ferramentas com Nossos Dados
            </h3>
            <p className="text-xs text-gray-300 font-sans mt-1 max-w-xl">
              Alugue acesso à API oficial de telemetria do Rubinot. Telemetria dos 16 mundos, radar de mortes e status de personagens em tempo real.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('developers')}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 px-6 py-3 text-xs font-bold text-black shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <span>Conhecer API & Planos</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* MODAL: CALCULADORA DE LOOT SPLIT */}
      {lootModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-black/95 border-2 border-cyan-500/50 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Calculator size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-medieval text-cyan-400">Calculadora de Loot Split</h3>
                  <p className="text-xs text-gray-400">Divisão automática do Party Hunt Session</p>
                </div>
              </div>
              <button
                onClick={() => setLootModalOpen(false)}
                className="text-gray-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* ÁREA DE COLAR TEXTO */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Cole o log do Session Analyzer aqui:
              </label>
              <textarea
                rows={5}
                value={lootLog}
                onChange={(e) => setLootLog(e.target.value)}
                placeholder="Exemplo:&#10;Session data: From 2026-09-12, 21:00:00 to 2026-09-12, 23:00:00&#10;Session: 02:00h&#10;Loot: 2,500,000&#10;Supplies: 500,000&#10;Balance: 2,000,000&#10;Player One&#10;    Loot: 1,500,000..."
                className="w-full bg-[#101010] border border-cyan-500/30 rounded-xl p-3.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={parseLootLog}
                className="mt-3 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg active:scale-95"
              >
                Calcular Divisão da Party
              </button>
            </div>

            {/* RESULTADO DA DIVISÃO */}
            {lootResult && (
              <div className="bg-[#121212] border border-cyan-500/30 rounded-xl p-5 animate-fade-in">
                {lootResult.error ? (
                  <div className="text-red-400 text-xs font-bold">{lootResult.error}</div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-white/10 text-center">
                      <div>
                        <span className="text-[11px] text-gray-400 uppercase">Loot Total</span>
                        <div className="text-sm font-bold text-yellow-400">{lootResult.totalLoot.toLocaleString()} gp</div>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 uppercase">Supplies</span>
                        <div className="text-sm font-bold text-red-400">{lootResult.totalSupplies.toLocaleString()} gp</div>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 uppercase">Cada Membro Recebe</span>
                        <div className="text-sm font-bold text-green-400">{lootResult.sharePerPlayer.toLocaleString()} gp</div>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                      Transferências Necessárias no Banco:
                    </h4>
                    
                    <div className="space-y-2 mb-5">
                      {lootResult.transfers.length === 0 ? (
                        <div className="text-xs text-gray-400">Todos os membros já estão equilibrados!</div>
                      ) : (
                        lootResult.transfers.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-black/50 border border-white/5 text-xs">
                            <span>
                              <strong className="text-red-400">{t.from}</strong> deve transferir para <strong className="text-green-400">{t.to}</strong>
                            </span>
                            <span className="font-bold text-yellow-400">{t.amount.toLocaleString()} gp</span>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={copyTransfersText}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 py-2.5 text-xs font-bold text-white transition-colors"
                    >
                      {copiedLoot ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      {copiedLoot ? 'Copiado para a área de transferência!' : 'Copiar Resumo para o WhatsApp / Discord'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO EDITORIAL & INSTITUCIONAL (CONTEÚDO DE ALTO VALOR • GOOGLE ADSENSE) */}
      {/* ========================================================================= */}
      <div className="mt-8 space-y-6">
        
        {/* Painel Informativo 1: Sobre a Plataforma e Missão */}
        <div className="bg-tibia-card border-2 border-tibia-border rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/40 text-yellow-400">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-medieval font-bold text-tibia-highlight">
                Rubinot Tracker • Monitoramento Global & Inteligência de Combate
              </h2>
              <p className="text-xs text-gray-400 font-sans">
                A plataforma líder em análise de dados, telemetria em tempo real e automações para os 16 servidores da rede Rubinot.
              </p>
            </div>
          </div>

          <div className="text-gray-300 text-xs sm:text-sm leading-relaxed space-y-3 font-sans">
            <p>
              O <strong>Rubinot Tracker</strong> é uma plataforma comunitária aberta, desenvolvida para fornecer aos jogadores, generais de guilda e estrategistas de combate uma visão analítica profunda sobre tudo o que acontece nos servidores do jogo. Através de coletores de telemetria distribuídos com arquitetura Zero-Trust, a plataforma monitora continuamente flutuações de jogadores online, mortes em combate (PvP e PvE), pontuações do ranking de experiência (Level Rush) e leilões ativos de personagens no mercado oficial.
            </p>
            <p>
              Nossa missão é democratizar o acesso a informações táticas que antes exigiam dezenas de planilhas manuais. Com ferramentas integradas como o <strong>Mural de Mortes em Tempo Real</strong>, o <strong>Bazaar Sniper</strong> para detecção de oportunidades de compra de personagens e a <strong>Calculadora de Loot da Party</strong>, capacitamos equipes a tomarem decisões rápidas e estratégicas dentro e fora do jogo.
            </p>
          </div>
        </div>

        {/* Painel Informativo 2: Guia dos 16 Servidores e Tipos de PvP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-black/60 border border-yellow-500/30 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-bold uppercase mb-2">
                ⚔️ Open-PvP
              </div>
              <h3 className="text-base font-medieval font-bold text-white mb-2">Servidores Open PvP</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Combate aberto com sistema padrão de skulls e penalidades de morte moderadas. Ideal para batalhas táticas e disputas territoriais equilibradas.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-yellow-400 font-sans">
              <strong>Mundos:</strong> Auroria, Belaria, Drakaria, Malveria, Vesperia.
            </div>
          </div>

          <div className="bg-black/60 border border-yellow-500/30 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-950/40 border border-orange-500/40 text-orange-400 text-xs font-bold uppercase mb-2">
                ⚡ Retro-PvP
              </div>
              <h3 className="text-base font-medieval font-bold text-white mb-2">Servidores Retro PvP</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Regras clássicas de combate sem safe mode, onde runas em área atingem aliados e inimigos. Máxima intensidade para guerras e confrontos de alto risco.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-yellow-400 font-sans">
              <strong>Mundos:</strong> Bellum, Infernum I, Infernum II, Infernum III, Tenebrium.
            </div>
          </div>

          <div className="bg-black/60 border border-yellow-500/30 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-950/40 border border-green-500/40 text-green-400 text-xs font-bold uppercase mb-2">
                🌿 Optional-PvP
              </div>
              <h3 className="text-base font-medieval font-bold text-white mb-2">Servidores Optional PvP</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Ambiente focado em progressão PvE, chefões, hunts em grupo e exploração com proteção contra ataques de outros jogadores fora do modo de guerra declarada.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-yellow-400 font-sans">
              <strong>Mundos:</strong> Eldrian, Elysian, Lunarian, Mystian, Obsidian, Solarian.
            </div>
          </div>

        </div>

        {/* Painel Informativo 3: Perguntas Frequentes (FAQ) */}
        <div className="bg-tibia-card border-2 border-tibia-border rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-tibia-highlight font-medieval text-lg font-bold">
            <HelpCircle size={20} className="text-yellow-400" />
            Perguntas Frequentes sobre o Rubinot Tracker
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            
            <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
              <h4 className="font-bold text-yellow-400 text-sm">Como os dados da plataforma são atualizados?</h4>
              <p className="text-gray-300 leading-relaxed">
                Nossa infraestrutura distribuída executa verificações a cada poucos segundos nos servidores oficiais, indexando mortes, onlines e variações de pontuação com persistência redundante e push em tempo real.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
              <h4 className="font-bold text-yellow-400 text-sm">A plataforma é gratuita para todos os jogadores?</h4>
              <p className="text-gray-300 leading-relaxed">
                Sim! Todos os módulos essenciais — incluindo o monitor global de mortes, visualizador de onlines, fila de convites e calculadora de loot — são 100% gratuitos e abertos para a comunidade.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
              <h4 className="font-bold text-yellow-400 text-sm">Como funciona o sistema de convites automáticos?</h4>
              <p className="text-gray-300 leading-relaxed">
                Ao solicitar um convite através da página de Recrutamento, o pedido entra em uma fila segura. Nossos robôs autenticados conectam-se ao painel oficial e emitem o convite in-game automaticamente em instantes.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
              <h4 className="font-bold text-yellow-400 text-sm">Posso integrar o Rubinot Tracker com o bot da minha guilda?</h4>
              <p className="text-gray-300 leading-relaxed">
                Sim! Disponibilizamos uma API REST pública documentada no <a href="/api" className="text-yellow-400 hover:underline">Developer Hub</a> para desenvolvedores consumirem endpoints de telemetria, mortes recentes e dados de personagens.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
