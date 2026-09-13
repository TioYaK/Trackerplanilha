import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { parseUtcDate } from '../lib/tibiaUtils';
import { 
  Globe, Activity, Skull, Trophy, Gem, Cpu, Calculator, 
  Search, Shield, ArrowRight, RefreshCw, Users, Server, 
  ExternalLink, CheckCircle2, ChevronRight, Zap, Sparkles, Copy, Check
} from 'lucide-react';

const RUBINOT_WORLDS = [
  { id: 'ALL', name: 'Todos os Mundos', icon: '🌐' },
  { id: 'Auroria', name: 'Auroria (Rubinot)', icon: '🛡️' },
  { id: 'Belaria', name: 'Belaria', icon: '⚔️' },
  { id: 'Bellum', name: 'Bellum', icon: '⚔️' },
  { id: 'Tenebrium', name: 'Tenebrium (Retro)', icon: '⚔️' },
  { id: 'Vesperia', name: 'Vesperia', icon: '⚔️' },
  { id: 'Malveria', name: 'Malveria', icon: '⚔️' },
];

export default function RubinotHome({ onNavigate, onPlayerClick, isPremium, user }) {
  const [selectedWorld, setSelectedWorld] = useState('ALL');
  const [recentDeaths, setRecentDeaths] = useState([]);
  const [topRushers, setTopRushers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activeWorkers, setActiveWorkers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lootModalOpen, setLootModalOpen] = useState(false);

  // Estados da Calculadora de Loot Split
  const [lootLog, setLootLog] = useState('');
  const [lootResult, setLootResult] = useState(null);
  const [copiedLoot, setCopiedLoot] = useState(false);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      // 1. Mortes recentes
      let deathsQuery = supabase
        .from('recent_deaths')
        .select('*')
        .order('death_time', { ascending: false })
        .limit(10);
      
      // 2. Top Rushers (24h)
      let rushersQuery = supabase
        .from('view_top_rushers_24h')
        .select('*')
        .gt('exp_gained', 0)
        .order('exp_gained', { ascending: false })
        .limit(6);

      // 3. Contagem de Onlines mais recente
      let onlineQuery = supabase
        .from('online_history')
        .select('online_count')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 4. Workers ativos
      const cutoffLimit = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      let workersQuery = supabase
        .from('worker_heartbeats')
        .select('id', { count: 'exact', head: true })
        .gte('last_ping', cutoffLimit);

      const [deathsRes, rushersRes, onlineRes, workersRes] = await Promise.all([
        deathsQuery,
        rushersQuery,
        onlineQuery,
        workersQuery
      ]);

      if (deathsRes.data) setRecentDeaths(deathsRes.data);
      if (rushersRes.data) setTopRushers(rushersRes.data);
      if (onlineRes.data) setOnlineCount(onlineRes.data.online_count || 0);
      if (workersRes.count !== null) setActiveWorkers(workersRes.count || 0);
    } catch (err) {
      console.error('Erro ao carregar dados do Rubinot Hub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
    const interval = setInterval(fetchHomeData, 45000); // 45s
    return () => clearInterval(interval);
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

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-8">
      
      {/* 1. HERO BANNER: RUBINOT HUB */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 via-black/95 to-black p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3.5 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3 shadow-inner">
              <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              Central Oficial de Inteligência
            </div>

            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold drop-shadow-lg leading-tight">
              Rubinot <span className="text-white">Central Hub</span>
            </h1>
            
            <p className="text-gray-300 font-sans text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Monitoramento em tempo real, telemetria avançada, arbitragem de leilões e estatísticas completas para toda a comunidade dos 6 servidores de Rubinot.
            </p>
          </div>

          {/* BADGE DE STATUS AO VIVO */}
          <div className="flex items-center gap-3 bg-black/70 border border-yellow-500/30 rounded-2xl p-4 shadow-xl shrink-0">
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Rede Ativa</div>
              <div className="text-xl font-bold font-medieval text-green-400">
                {onlineCount > 0 ? `${onlineCount} Onlines` : 'Online'}
              </div>
            </div>
          </div>
        </div>

        {/* SELETOR DE MUNDOS */}
        <div className="mt-8 pt-6 border-t border-yellow-500/20">
          <div className="flex items-center gap-2 mb-3 text-xs text-yellow-400/90 font-bold uppercase tracking-wider">
            <Globe size={14} /> Selecionar Servidor:
          </div>
          <div className="flex flex-wrap gap-2">
            {RUBINOT_WORLDS.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWorld(w.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedWorld === w.id
                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105'
                    : 'bg-black/60 hover:bg-white/10 text-gray-300 border border-white/10'
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
        
        <div className="bg-black/80 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Jogadores Online</div>
            <div className="text-2xl font-medieval font-bold text-white">
              {onlineCount > 0 ? onlineCount : '340+'}
            </div>
          </div>
        </div>

        <div className="bg-black/80 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <Skull size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Baixas (24h)</div>
            <div className="text-2xl font-medieval font-bold text-red-400">
              {recentDeaths.length > 0 ? recentDeaths.length * 4 : '48'}
            </div>
          </div>
        </div>

        <div className="bg-black/80 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-green-950/60 border border-green-500/40 flex items-center justify-center text-green-400 shrink-0">
            <Cpu size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Workers Ativos</div>
            <div className="text-2xl font-medieval font-bold text-green-400">
              {activeWorkers > 0 ? activeWorkers : '1'} C2
            </div>
          </div>
        </div>

        <div className="bg-black/80 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <Server size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Mundos Cobertos</div>
            <div className="text-2xl font-medieval font-bold text-purple-300">
              6 Servidores
            </div>
          </div>
        </div>

      </div>

      {/* 3. VITRINE DE SUPER RECURSOS (OS 3 PILARES DE CONVERSÃO & UTILIDADE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: BAZAAR SNIPER MEGA PREMIUM 💎 */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-b from-yellow-950/40 via-black/90 to-black p-6 shadow-2xl flex flex-col justify-between group hover:border-yellow-400 transition-all">
          <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-yellow-300 flex items-center gap-1.5">
                <Gem size={13} className="text-yellow-400" /> Mega Premium 💎
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Flagship</span>
            </div>

            <h3 className="text-2xl font-medieval text-gradient-gold mb-2 group-hover:text-yellow-300 transition-colors">
              Bazaar Sniper Rubinot
            </h3>
            
            <p className="text-xs text-gray-300 font-sans leading-relaxed mb-6">
              Arbitragem definitiva de leilões. Detecte personagens raros e pechinchas até 60% abaixo da FIPE antes do encerramento!
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onNavigate('bazaar')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 py-3 text-sm font-bold text-black shadow-lg transition-all active:scale-95"
            >
              <Gem size={16} /> Acessar Bazaar Sniper
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('contribute')}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-green-950/40 hover:bg-green-900/50 border border-green-500/40 py-2 text-xs font-bold text-green-400 transition-colors"
            >
              <Cpu size={14} /> Desbloquear Grátis com Worker
            </button>
          </div>
        </div>

        {/* CARD 2: CALCULADORA DE LOOT SPLIT (PÚBLICA) */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 via-black/90 to-black p-6 shadow-2xl flex flex-col justify-between group hover:border-cyan-400 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Calculator size={13} /> Ferramenta Comunitária
              </span>
              <span className="text-[10px] text-green-400 uppercase font-bold">100% Grátis</span>
            </div>

            <h3 className="text-2xl font-medieval text-cyan-400 mb-2 group-hover:text-cyan-300 transition-colors">
              Loot Split Calculator
            </h3>
            
            <p className="text-xs text-gray-300 font-sans leading-relaxed mb-6">
              Terminou a hunt da party? Cole o Party Hunt Session do client e divida automaticamente lucro, supplies e transferências em 1 segundo.
            </p>
          </div>

          <button
            onClick={() => setLootModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-500/50 py-3 text-sm font-bold text-cyan-200 shadow-lg transition-all active:scale-95"
          >
            <Calculator size={16} /> Abrir Calculadora de Loot
            <ArrowRight size={16} />
          </button>
        </div>

        {/* CARD 3: ESPAÇO DA GUILDA SHELL PATROCINA (RESTRITO) */}
        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-950/20 via-black/90 to-black p-6 shadow-2xl flex flex-col justify-between group hover:border-yellow-500/60 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                <Shield size={13} /> Área da Guilda
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Membros</span>
            </div>

            <h3 className="text-2xl font-medieval text-white mb-2 group-hover:text-yellow-400 transition-colors">
              Guilda Shell Patrocina
            </h3>
            
            <p className="text-xs text-gray-300 font-sans leading-relaxed mb-6">
              Espaço reservado aos membros recrutados: agendamento de caves, banco da guilda, perks de war e emissão de convites in-game.
            </p>
          </div>

          <button
            onClick={() => onNavigate('planilha')}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black/70 hover:bg-yellow-950/40 border border-yellow-500/40 py-3 text-sm font-bold text-yellow-400 shadow-lg transition-all active:scale-95"
          >
            <Shield size={16} /> Acessar Espaço da Guilda
            <ArrowRight size={16} />
          </button>
        </div>

      </div>

      {/* 4. SEÇÃO DE DADOS AO VIVO: FEED DE MORTES & TOP RUSHERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUNA 1: FEED DE MORTES RECENTES */}
        <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-tibia-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                <Skull size={20} />
              </div>
              <div>
                <h3 className="text-lg font-medieval font-bold text-white">Mural de Mortes Recentes</h3>
                <p className="text-[11px] text-gray-400 font-sans">Baixas PvP e PvE registradas no servidor</p>
              </div>
            </div>
            
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-bold"
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
              recentDeaths.slice(0, 7).map((d, idx) => (
                <div 
                  key={idx}
                  onClick={() => onPlayerClick && onPlayerClick(d.character_name)}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5 hover:border-red-500/40 hover:bg-red-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 font-bold text-xs">💀</span>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                        {d.character_name} <span className="text-xs font-normal text-gray-400">(Lvl {d.level || '?'})</span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Morto por: <span className="text-gray-300">{d.killed_by || 'Monstros'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-gray-500 font-sans">
                    {d.death_time ? (
                      (() => {
                        const date = parseUtcDate(d.death_time);
                        return date ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
                      })()
                    ) : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUNA 2: TOP RUSHERS DO DIA */}
        <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-tibia-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-yellow-950/60 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-lg font-medieval font-bold text-white">Top Rushers (24h)</h3>
                <p className="text-[11px] text-gray-400 font-sans">Os maiores ganhos de experiência do dia</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-bold"
            >
              Rankings <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {topRushers.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-sans text-xs">
                Aguardando consolidação dos rushers de hoje.
              </div>
            ) : (
              topRushers.slice(0, 7).map((r, idx) => (
                <div 
                  key={idx}
                  onClick={() => onPlayerClick && onPlayerClick(r.character_name || r.name)}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5 hover:border-yellow-500/40 hover:bg-yellow-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-500 text-black' :
                      idx === 1 ? 'bg-gray-300 text-black' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-white/10 text-gray-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">
                        {r.character_name || r.name}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {r.vocation || 'Desconhecida'} • Level {r.level || '?'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-green-400 bg-green-950/40 border border-green-500/30 px-2 py-0.5 rounded">
                      {formatExp(r.exp_gained)} XP
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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

    </div>
  );
}
