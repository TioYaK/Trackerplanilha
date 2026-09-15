import React, { useState, useEffect, useMemo } from 'react';
import { Skull, Clock, CheckCircle2, Circle, Sparkles, Flame, ShieldAlert, Coins, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { getTodayBoosted } from '../data/boostedDailyData';
import { supabase } from '../lib/supabase';

const BOSS_DATABASE = [
  // Express Diário (Fácil & Muito Lucrativo)
  {
    id: 'ravenous-hunger',
    name: 'Ravenous Hunger',
    location: 'Rascacoon Island (Pirate Reef)',
    category: 'daily',
    cooldownHours: 20,
    estMinutes: 5,
    avgProfitK: 220,
    bisDrops: ['Rascacoon Boots', 'Wreck Louse Shell', 'Gold Token'],
    element: 'Físico / Terra / Veneno',
    weakness: 'Fogo (-10%), Energia (-10%)',
    tip: 'Evite pisar nas poças de veneno/gosma e limpe os adds vorazes rapidamente.'
  },
  {
    id: 'katex',
    name: 'Katex Blood Tongue',
    location: 'Iks Ruins / Mitmah Bastion',
    category: 'daily',
    cooldownHours: 20,
    estMinutes: 5,
    avgProfitK: 260,
    bisDrops: ['Mitmah Chestplate', 'Mitmah Boots', 'Iks Faulds', 'Katex Blood Amulet'],
    element: 'Físico / Morte / Sangue',
    weakness: 'Santo (-15%), Energia (-10%)',
    tip: 'Cuidado com as ondas de sangue e invocações de Iks. Foque dano em Holy e Energy.'
  },
  {
    id: 'oberon',
    name: 'Grand Master Oberon',
    location: 'Falcon Bastion (Edron)',
    category: 'daily',
    cooldownHours: 20,
    estMinutes: 5,
    avgProfitK: 120,
    bisDrops: ['Falcon Greaves', 'Falcon Coif', 'Falcon Plate', 'Falcon Battleaxe'],
    element: 'Físico / Santo',
    weakness: 'Gelo (-10%), Terra (-5%)',
    tip: 'Responda as 3 falas nos livros quando ele invocar invulnerabilidade.'
  },
  {
    id: 'scarlett',
    name: 'Scarlett Etzel',
    location: 'Cobra Bastion (Ankrahmun)',
    category: 'daily',
    cooldownHours: 20,
    estMinutes: 4,
    avgProfitK: 150,
    bisDrops: ['Cobra Wand', 'Cobra Rod', 'Cobra Amulet', 'Cobra Hood'],
    element: 'Físico / Terra',
    weakness: 'Fogo / Gelo',
    tip: 'Use o espelho nas 4 armaduras nos cantos quando ela estiver paralisada.'
  },
  {
    id: 'drume',
    name: 'Drume',
    location: 'Bounac (Order of the Lion)',
    category: 'daily',
    cooldownHours: 20,
    estMinutes: 3,
    avgProfitK: 100,
    bisDrops: ['Lion Spiketail', 'Lion Longsword', 'Lion Spellbook'],
    element: 'Físico / Terra',
    weakness: 'Gelo / Fogo',
    tip: 'Proteja o Lion Commander Kesar; se ele morrer, você perde a sala.'
  },
  {
    id: 'timira',
    name: 'Timira the Many-Headed',
    location: 'Nagapur (Marapur)',
    category: 'daily',
    cooldownHours: 20,
    estMinutes: 6,
    avgProfitK: 200,
    bisDrops: ['Naga Sword', 'Naga Crossbow', 'Naga Rod', 'Naga Wand'],
    element: 'Gelo / Dano Mágico',
    weakness: 'Energia / Fogo',
    tip: 'Evite pisar nas bolhas d\'água e use runas de fogo nos adds.'
  },
  {
    id: 'mitmah',
    name: 'Mitmah Vanguard',
    location: 'Iksapan (Ancient Ruins)',
    category: 'daily',
    cooldownHours: 20,
    estMinutes: 5,
    avgProfitK: 180,
    bisDrops: ['Mitmah Moon Mirror', 'Ancient Sun Shard'],
    element: 'Físico / Morte',
    weakness: 'Santo / Gelo',
    tip: 'Interrompa os obeliscos para remover a imunidade das fases.'
  },

  // Grave Danger
  {
    id: 'zelos',
    name: 'King Zelos',
    location: 'Grave Danger (Thais)',
    category: 'grave_danger',
    cooldownHours: 20,
    estMinutes: 12,
    avgProfitK: 350,
    bisDrops: ['Ghost Chestplate', 'Gilded Abacus', 'Spanghelm'],
    element: 'Morte / Gelo',
    weakness: 'Fogo / Energia',
    tip: 'Time de 5. Divida as alavancas e destrua os pilares de necro.'
  },
  {
    id: 'azaram',
    name: 'Lord Azaram',
    location: 'Grave Danger (Darashia)',
    category: 'grave_danger',
    cooldownHours: 20,
    estMinutes: 6,
    avgProfitK: 90,
    bisDrops: ['Final Judgment', 'Silver Token'],
    element: 'Morte',
    weakness: 'Santo / Fogo',
    tip: 'Mantenha ele longe dos túmulos para evitar cura rápida.'
  },
  {
    id: 'krule',
    name: 'Duke Krule',
    location: 'Grave Danger (Edron)',
    category: 'grave_danger',
    cooldownHours: 20,
    estMinutes: 7,
    avgProfitK: 110,
    bisDrops: ['Final Judgment', 'Silver Token'],
    element: 'Físico / Fogo',
    weakness: 'Gelo / Morte',
    tip: 'Matar o add elemental primeiro para quebrar o escudo dele.'
  },

  // Feaster of Souls
  {
    id: 'pale_worm',
    name: 'The Pale Worm',
    location: 'Feaster of Souls (Final)',
    category: 'feaster',
    cooldownHours: 20,
    estMinutes: 15,
    avgProfitK: 400,
    bisDrops: ['Soultainter', 'Soulhexer', 'Ghost Backpack'],
    element: 'Morte / Terra',
    weakness: 'Fogo / Energia',
    tip: 'Coordene a entrada dos orbs de luz para enfraquecer o verme.'
  },
  {
    id: 'unwelcome',
    name: 'The Unwelcome',
    location: 'Feaster of Souls (Port Hope)',
    category: 'feaster',
    cooldownHours: 20,
    estMinutes: 8,
    avgProfitK: 130,
    bisDrops: ['Brain in a Jar', 'Silver Token'],
    element: 'Terra',
    weakness: 'Fogo / Santo',
    tip: 'Limpar as poças venenosas com os antídotos nos cantos.'
  },

  // Solo & Rápidos
  {
    id: 'kroazur',
    name: 'Kroazur',
    location: 'Feyrist (Faerie Caves)',
    category: 'solo',
    cooldownHours: 2,
    estMinutes: 2,
    avgProfitK: 45,
    bisDrops: ['Faerie Backpack', 'Gems', 'Gold'],
    element: 'Físico / Terra',
    weakness: 'Fogo',
    tip: 'Boss rápido com apenas 2 horas de cooldown! Ótimo para lucrar solo.'
  },
  {
    id: 'werelions',
    name: 'Werelion Mini-Bosses',
    location: 'Lion\'s Sanctuary (Darashia)',
    category: 'solo',
    cooldownHours: 20,
    estMinutes: 5,
    avgProfitK: 80,
    bisDrops: ['Lion Backpack', 'Werelion Trophy'],
    element: 'Físico / Sagrado',
    weakness: 'Morte / Gelo',
    tip: 'Mate durante a rota de hunt nos Werelions sem perder tempo.'
  }
];

export default function BossTracker() {
  const [trackedBosses, setTrackedBosses] = useState(() => {
    try {
      const saved = localStorage.getItem('rubinot_boss_tracker_v2');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [now, setNow] = useState(Date.now());
  const [boostedData, setBoostedData] = useState(() => getTodayBoosted());

  // Carrega configuração dinâmica do RubinOT via Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadBoosted() {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 102)
          .maybeSingle();

        if (isMounted && data) {
          const cfg = data.visible_tabs || data;
          if (cfg?.boss_name || cfg?.creature_name) {
            setBoostedData(getTodayBoosted(new Date(), cfg));
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar boosted settings:', err);
      }
    }
    loadBoosted();

    const channel = supabase
      .channel('realtime_boss_tracker_boosted')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: 'id=eq.102' },
        (payload) => {
          const doc = payload.new;
          if (doc) {
            const cfg = doc.visible_tabs || doc;
            setBoostedData(getTodayBoosted(new Date(), cfg));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Atualizador de tempo regressivo em tempo real
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem('rubinot_boss_tracker_v2', JSON.stringify(trackedBosses));
    } catch (e) {}
  }, [trackedBosses]);

  // Tempo restante para o Server Save (10:00 BRT)
  const serverSaveCountdown = useMemo(() => {
    const date = new Date(now);
    // Server Save às 10:00:00 horário local do Brasil
    const ssToday = new Date(date);
    ssToday.setHours(10, 0, 0, 0);

    let diff = ssToday.getTime() - date.getTime();
    if (diff <= 0) {
      // Já passou das 10h hoje, calcula para amanhã às 10h
      const ssTomorrow = new Date(ssToday);
      ssTomorrow.setDate(ssTomorrow.getDate() + 1);
      diff = ssTomorrow.getTime() - date.getTime();
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  }, [now]);

  const toggleBoss = (bossId, cooldownHours) => {
    setTrackedBosses(prev => {
      const current = prev[bossId];
      if (current && current.completed && (now - current.timestamp) < (cooldownHours * 3600 * 1000)) {
        // Desmarcar
        const copy = { ...prev };
        delete copy[bossId];
        return copy;
      } else {
        // Marcar como feito agora
        return {
          ...prev,
          [bossId]: {
            completed: true,
            timestamp: now
          }
        };
      }
    });
  };

  const getCooldownStatus = (boss) => {
    const entry = trackedBosses[boss.id];
    if (!entry || !entry.completed) {
      return { ready: true, label: 'Liberado', remainingMs: 0 };
    }

    const elapsed = now - entry.timestamp;
    const cooldownMs = boss.cooldownHours * 3600 * 1000;
    const remainingMs = cooldownMs - elapsed;

    if (remainingMs <= 0) {
      return { ready: true, label: 'Liberado', remainingMs: 0 };
    }

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

    return {
      ready: false,
      label: `${hours}h ${mins}m ${secs}s`,
      remainingMs,
      progressPct: Math.min(100, (elapsed / cooldownMs) * 100)
    };
  };

  const filteredBosses = useMemo(() => {
    if (activeCategory === 'all') return BOSS_DATABASE;
    return BOSS_DATABASE.filter(b => b.category === activeCategory);
  }, [activeCategory]);

  // Estatísticas da Rota Selecionada
  const routeStats = useMemo(() => {
    let totalMins = 0;
    let totalProfit = 0;
    let completedCount = 0;

    filteredBosses.forEach(b => {
      const status = getCooldownStatus(b);
      if (!status.ready) {
        completedCount++;
      } else {
        totalMins += b.estMinutes;
        totalProfit += b.avgProfitK;
      }
    });

    return {
      totalMins,
      totalProfitKk: (totalProfit / 1000).toFixed(2),
      completedCount,
      totalCount: filteredBosses.length
    };
  }, [filteredBosses, trackedBosses, now]);

  const handleClearAll = () => {
    if (window.confirm('Deseja resetar o status de todos os bosses?')) {
      setTrackedBosses({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn text-gray-200">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-purple-950/40 to-stone-900 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Skull size={16} /> Otimizador Diário de Farm & Cooldowns
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval font-bold text-white tracking-wide drop-shadow-md">
              Rastreador de Bosses <span className="text-purple-400">20 Horas</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-2xl">
              Monitore seus cooldowns de bosses diários, calcule o tempo total da rota, lucro médio estimado e nunca mais perca um horário de boss.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-stone-900/90 border border-purple-500/40 rounded-xl p-4 shadow-lg text-center min-w-[170px]">
              <div className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5 mb-1">
                <Clock size={13} className="text-purple-400" /> Próximo Server Save
              </div>
              <div className="text-xl font-mono font-bold text-amber-300">
                {serverSaveCountdown}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Reset diário (10:00 BRT)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Especial: Boss & Criatura Boostada do Rubinot */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border border-yellow-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                  RubinOT Sistema Boost Diário
                </span>
                <span className="text-xs text-gray-400 font-mono">Diferente do Tibia Global</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Bônus de Farm & Cooldowns Ativos Hoje
              </h3>
            </div>
          </div>

          {/* Cards de Boosted Boss e Boosted Criatura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
            {/* Boosted Boss */}
            <div className="bg-black/60 border border-purple-500/40 rounded-xl p-3 flex items-center gap-3 min-w-[240px]">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
                {boostedData?.boss?.spriteUrl ? (
                  <img
                    src={boostedData.boss.spriteUrl}
                    alt={boostedData.boss.name}
                    className="max-h-8 max-w-8 object-contain drop-shadow"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.parentNode) e.target.parentNode.innerText = '👑';
                    }}
                  />
                ) : (
                  '👑'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-purple-300 font-bold uppercase">Boss Boostado</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">+Loot Roll</span>
                </div>
                <div className="text-sm font-bold text-white truncate">{boostedData?.boss?.name || 'Ravenous Hunger'}</div>
                <div className="text-[10px] text-gray-400 truncate">{boostedData?.boss?.bonusText || '+50% XP e chance extra de BiS drop'}</div>
              </div>
            </div>

            {/* Boosted Creature */}
            <div className="bg-black/60 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-3 min-w-[240px]">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                {boostedData?.creature?.spriteUrl ? (
                  <img
                    src={boostedData.creature.spriteUrl}
                    alt={boostedData.creature.name}
                    className="max-h-8 max-w-8 object-contain drop-shadow"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.parentNode) e.target.parentNode.innerText = '🐉';
                    }}
                  />
                ) : (
                  '🐉'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase">Criatura Boostada</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">+XP & Respawn</span>
                </div>
                <div className="text-sm font-bold text-white truncate">{boostedData?.creature?.name || 'Young Goanna'}</div>
                <div className="text-[10px] text-gray-400 truncate">{boostedData?.creature?.bonusText || '+50% XP, +100% Loot e respawn veloz'}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Resumo da Rota & Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Skull size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Progresso de Hoje</div>
            <div className="text-lg font-bold text-white">
              {routeStats.completedCount} / {routeStats.totalCount} Feitos
            </div>
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Tempo de Rota Restante</div>
            <div className="text-lg font-bold text-amber-300">
              ~{routeStats.totalMins} minutos
            </div>
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Coins size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Lucro Estimado Pendente</div>
            <div className="text-lg font-bold text-emerald-300">
              ~{routeStats.totalProfitKk} KKs
            </div>
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Ações Rápidas</div>
            <div className="text-xs text-gray-500 mt-1">Salvo no navegador</div>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors"
          >
            <RefreshCw size={13} /> Resetar Todos
          </button>
        </div>
      </div>

      {/* Filtros de Categoria */}
      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-4">
        {[
          { id: 'all', label: 'Todos os Bosses' },
          { id: 'daily', label: '⭐ Circuito Rápido Diário (Oberon, Scarlett, Drume)' },
          { id: 'grave_danger', label: '💀 Grave Danger (Zelos)' },
          { id: 'feaster', label: '👻 Feaster of Souls (Pale Worm)' },
          { id: 'solo', label: '🏃 Mini-Bosses Rápidos (Kroazur)' }
        ].map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-stone-900/60 border border-stone-800 text-gray-400 hover:text-white hover:border-stone-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lista de Cards de Bosses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBosses.map(boss => {
          const status = getCooldownStatus(boss);
          const isDone = !status.ready;

          return (
            <div
              key={boss.id}
              className={`rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between space-y-4 shadow-xl ${
                isDone
                  ? 'bg-stone-900/40 border-stone-800/80 opacity-75'
                  : 'bg-stone-900/90 border-purple-500/30 hover:border-purple-500/60 shadow-purple-950/20'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className={`font-bold text-base sm:text-lg ${isDone ? 'text-gray-400 line-through' : 'text-white'}`}>
                      {boss.name}
                    </h3>
                    <div className="text-xs text-purple-400/90 mt-0.5">{boss.location}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBoss(boss.id, boss.cooldownHours)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-stone-800 border border-stone-700 text-gray-400 hover:text-white hover:border-purple-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>
                </div>

                {/* Status Bar */}
                <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock size={13} /> Cooldown ({boss.cooldownHours}h):
                    </span>
                    <span className={`font-mono font-bold ${status.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {status.label}
                    </span>
                  </div>

                  {!status.ready && (
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-amber-400 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${status.progressPct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Drops Valiosos */}
                <div className="mt-3 bg-stone-950/60 rounded-xl p-3 border border-stone-800/60 space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Drops Raros (BiS)</span>
                    <span className="text-emerald-400 font-bold">~{boss.avgProfitK}k gp</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {boss.bisDrops.map((d, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-stone-800/80 text-amber-300 border border-stone-700/60">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dica Mecânica */}
                <div className="mt-3 text-xs text-gray-300 bg-stone-800/40 p-2.5 rounded-lg border border-stone-700/40">
                  <span className="text-amber-400 font-semibold">Mecânica:</span> {boss.tip}
                </div>
              </div>

              {/* Footer do Card */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-stone-800/60">
                <span>Tempo: ~{boss.estMinutes} min</span>
                <span>Fraqueza: <strong className="text-cyan-300">{boss.weakness}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
