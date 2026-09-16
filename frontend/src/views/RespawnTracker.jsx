import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { soundFX } from '../lib/soundEffects';
import { 
  Swords, Map, Search, Clock, CheckCircle2, UserCheck, LogOut, 
  ArrowRight, ShieldCheck, Copy, Check, Sparkles, TrendingUp, Users, Flame, Share2, Filter,
  Bell, Crown, Volume2
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

const DEFAULT_RESPAWNS = [
  { id: 'COBRA_BASTION', name: 'Cobra Bastion (All Floors)', category: 'Cobras', recLevel: '400+', huntType: 'Solo / Duo', xpPerHour: '12-16M', profitPerHour: '800k-1.5M' },
  { id: 'ASURA_MIRROR', name: 'Asura Mirror (Espelho)', category: 'Asuras', recLevel: '350+', huntType: 'Solo', xpPerHour: '10-14M', profitPerHour: '700k-1.2M' },
  { id: 'ASURA_PALACE', name: 'Asura Palace (Palácio)', category: 'Asuras', recLevel: '250+', huntType: 'Solo / Duo', xpPerHour: '6-9M', profitPerHour: '400k-800k' },
  { id: 'ROTTEN_BLOOD_JUGG', name: 'Rotten Blood (Juggernaut Den)', category: 'Rotten Blood', recLevel: '800+', huntType: 'Full Team 4x', xpPerHour: '35-50M', profitPerHour: '3M-6M' },
  { id: 'ROTTEN_BLOOD_DARKLIGHT', name: 'Rotten Blood (Darklight Core)', category: 'Rotten Blood', recLevel: '800+', huntType: 'Full Team 4x', xpPerHour: '32-45M', profitPerHour: '3M-5M' },
  { id: 'SOULWAR_CRATER', name: 'Furious Crater (Soul War)', category: 'Soul War', recLevel: '650+', huntType: 'Full Team 4x', xpPerHour: '25-35M', profitPerHour: '2M-4M' },
  { id: 'SOULWAR_EBB_FLOW', name: 'Ebb and Flow (Soul War)', category: 'Soul War', recLevel: '600+', huntType: 'Full Team 4x', xpPerHour: '22-30M', profitPerHour: '1.8M-3.5M' },
  { id: 'SOULWAR_CLAUSTRON', name: 'Claustrophobic Inferno', category: 'Soul War', recLevel: '650+', huntType: 'Full Team 4x', xpPerHour: '26-36M', profitPerHour: '2.5M-4.5M' },
  { id: 'LIBRARY_ENERGY', name: 'Secret Library (Energy Section)', category: 'Library', recLevel: '550+', huntType: 'Full Team 4x', xpPerHour: '18-25M', profitPerHour: '1.5M-3M' },
  { id: 'LIBRARY_FIRE', name: 'Secret Library (Fire Section)', category: 'Library', recLevel: '550+', huntType: 'Full Team 4x', xpPerHour: '18-24M', profitPerHour: '1.5M-2.8M' },
  { id: 'NAGAS_MARAPUR', name: 'Marapur Nagas (Deep Below)', category: 'Marapur', recLevel: '450+', huntType: 'Solo / Duo', xpPerHour: '11-15M', profitPerHour: '900k-1.8M' },
  { id: 'SPHINX_BURIED', name: 'Sphinx & Crypt (Buried Cathedral)', category: 'Kilmaresh', recLevel: '400+', huntType: 'Solo / Duo', xpPerHour: '14-18M', profitPerHour: '600k-1.2M' },
  { id: 'ISSAVI_SURFACE', name: 'Issavi Surface (Sphinx / Lamassu)', category: 'Kilmaresh', recLevel: '200+', huntType: 'Solo', xpPerHour: '7-11M', profitPerHour: 'Waste / Neutro' },
  { id: 'FERUMBRAS_GROUNDS', name: 'Ferumbras Seals (Jugg / Plagirath)', category: 'Ferumbras', recLevel: '500+', huntType: 'Full Team 4x', xpPerHour: '16-22M', profitPerHour: '1.2M-2.5M' },
  { id: 'INGOL_GROUNDS', name: 'Ingol (Harpy & Boar Caves)', category: 'Ingol', recLevel: '450+', huntType: 'Solo / Duo', xpPerHour: '12-16M', profitPerHour: '800k-1.6M' },
  { id: 'PADMAR_CROCS', name: 'Werecrocodiles & Tigers (Padmar)', category: 'Were-creatures', recLevel: '300+', huntType: 'Solo', xpPerHour: '8-11M', profitPerHour: '500k-900k' },
  { id: 'DEATHLINGS_UNDERSEA', name: 'Deathlings (Gray Beach Undersea)', category: 'Gray Beach', recLevel: '350+', huntType: 'Solo / Duo', xpPerHour: '8-12M', profitPerHour: '600k-1.1M' },
  { id: 'FALCON_BASTION', name: 'Falcon Bastion (Underground)', category: 'Falcons', recLevel: '400+', huntType: 'Solo / Duo', xpPerHour: '9-13M', profitPerHour: '700k-1.4M' }
];

export default function RespawnTracker({ isAdmin }) {
  const { profile, user, isPremium } = useAuth() || {};
  const [respawns, setRespawns] = useState(DEFAULT_RESPAWNS);
  const [activeClaims, setActiveClaims] = useState({});
  const [queues, setQueues] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedHuntType, setSelectedHuntType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [copiedClaimId, setCopiedClaimId] = useState(null);
  const prevClaimsRef = useRef({});

  // Caves monitoradas por alerta sonoro de voz (Recurso exclusivo VIP)
  const [monitoredCaves, setMonitoredCaves] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rubinot_monitored_caves') || '[]');
    } catch (e) {
      return [];
    }
  });

  const toggleMonitorCave = (respawnId, respawnName) => {
    if (!isPremium) {
      alert('👑 O Alerta de Cave Livre por Voz é exclusivo para membros VIP ou Operadores de Telemetria.');
      return;
    }
    setMonitoredCaves(prev => {
      const isMonitored = prev.includes(respawnId);
      const next = isMonitored ? prev.filter(id => id !== respawnId) : [...prev, respawnId];
      try {
        localStorage.setItem('rubinot_monitored_caves', JSON.stringify(next));
      } catch (e) {}

      if (!isMonitored) {
        soundFX.playTacticalPing();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          try {
            const utter = new SpeechSynthesisUtterance(`Radar VIP ativado para a cave ${respawnName}. Você será alertado assim que ela desocupar.`);
            utter.lang = 'pt-BR';
            window.speechSynthesis.speak(utter);
          } catch (e) {}
        }
      }
      return next;
    });
  };

  const notifyCaveFreed = (rName) => {
    soundFX.playTacticalPing();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(`Atenção Hunter VIP! O respawn ${rName} acaba de ser liberado!`);
        utter.lang = 'pt-BR';
        utter.rate = 1.05;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }
  };

  const fetchRespawnsAndClaims = async () => {
    try {
      const [respawnsRes, claimsRes, queuesRes] = await Promise.all([
        supabase.from('respawns').select('*').order('name'),
        supabase.from('hunting_claims').select('*').eq('status', 'ACTIVE'),
        supabase.from('hunting_queues').select('*').eq('status', 'WAITING').order('joined_at', { ascending: true })
      ]);

      let curRespawns = DEFAULT_RESPAWNS;
      if (respawnsRes.data && respawnsRes.data.length > 0) {
        curRespawns = respawnsRes.data.map(r => {
          const def = DEFAULT_RESPAWNS.find(d => d.id === r.id || d.name.toLowerCase() === (r.name || '').toLowerCase());
          return {
            ...r,
            recLevel: r.rec_level || def?.recLevel || '300+',
            huntType: r.hunt_type || def?.huntType || 'Solo / Duo',
            xpPerHour: r.xp_per_hour || def?.xpPerHour || '10M-15M',
            profitPerHour: r.profit_per_hour || def?.profitPerHour || '500k-1M'
          };
        });
        setRespawns(curRespawns);
      } else {
        setRespawns(DEFAULT_RESPAWNS);
      }

      const claimsMap = {};
      (claimsRes.data || []).forEach(c => {
        claimsMap[c.respawn_id] = c;
      });

      try {
        const local = JSON.parse(localStorage.getItem('auroria_respawn_claims') || '{}');
        Object.keys(local).forEach(k => {
          if (!claimsMap[k]) claimsMap[k] = local[k];
        });
      } catch (e) {}

      // Se uma cave monitorada por VIP estava ocupada e agora foi liberada, alertar por voz!
      if (isPremium && monitoredCaves.length > 0) {
        monitoredCaves.forEach(rId => {
          const wasOccupied = prevClaimsRef.current[rId];
          const isNowFree = !claimsMap[rId];
          if (wasOccupied && isNowFree) {
            const respawnItem = curRespawns.find(r => r.id === rId);
            notifyCaveFreed(respawnItem?.name || 'monitorado');
          }
        });
      }
      prevClaimsRef.current = claimsMap;

      setActiveClaims(claimsMap);

      const queuesMap = {};
      (queuesRes.data || []).forEach(q => {
        if (!queuesMap[q.respawn_id]) queuesMap[q.respawn_id] = [];
        queuesMap[q.respawn_id].push(q);
      });
      setQueues(queuesMap);
    } catch (err) {
      console.warn('Usando catálogo padrão resiliente de respawns:', err);
      setRespawns(DEFAULT_RESPAWNS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRespawnsAndClaims();

    try {
      const claimsChannel = supabase
        .channel('respawn_claims_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hunting_claims' }, () => {
          fetchRespawnsAndClaims();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hunting_queues' }, () => {
          fetchRespawnsAndClaims();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(claimsChannel);
      };
    } catch (e) {}
  }, [monitoredCaves, isPremium]);

  const formatUptime = (startTime) => {
    if (!startTime) return '0m';
    const parsed = new Date(startTime).getTime();
    if (isNaN(parsed)) return '0m';
    const diff = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  };

  const getActiveCharacter = () => {
    if (profile?.main_character && profile.main_character.trim().length > 0) {
      return profile.main_character.trim();
    }
    const entered = window.prompt(
      'Para registrar a cave, digite o nome do seu personagem principal no Rubinot:'
    );
    if (!entered || !entered.trim()) return null;
    return entered.trim();
  };

  const handleClaim = async (respawnId) => {
    const charName = getActiveCharacter();
    if (!charName) return;

    setActionLoading(respawnId);
    const nowIso = new Date().toISOString();
    const newClaimObj = {
      id: 'claim-' + Date.now(),
      respawn_id: respawnId,
      character_name: charName,
      web_user_id: user?.id || null,
      status: 'ACTIVE',
      is_vip: Boolean(isPremium),
      duration_hours: isPremium ? 3 : 2,
      claimed_at: nowIso
    };

    setActiveClaims(prev => {
      const next = { ...prev, [respawnId]: newClaimObj };
      try {
        localStorage.setItem('auroria_respawn_claims', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      await supabase
        .from('hunting_claims')
        .update({ status: 'CLOSED' })
        .eq('character_name', charName)
        .eq('status', 'ACTIVE');

      await supabase.from('hunting_claims').insert([{
        respawn_id: respawnId,
        character_name: charName,
        web_user_id: user?.id || null,
        status: 'ACTIVE',
        is_vip: Boolean(isPremium),
        claimed_at: nowIso
      }]);
    } catch (err) {
      console.warn('Erro ao sincronizar claim no servidor:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNext = async (respawnId) => {
    const charName = getActiveCharacter();
    if (!charName) return;

    setActionLoading(respawnId);
    try {
      const currentQueue = queues[respawnId] || [];
      const alreadyInQueue = currentQueue.some(q => (q.character_name || '').toLowerCase() === charName.toLowerCase());

      if (alreadyInQueue) {
        alert('Você já está na fila de espera deste respawn!');
        return;
      }

      const queueItem = {
        respawn_id: respawnId,
        character_name: charName,
        web_user_id: user?.id || null,
        status: 'WAITING',
        joined_at: new Date().toISOString()
      };

      setQueues(prev => ({
        ...prev,
        [respawnId]: [...(prev[respawnId] || []), queueItem]
      }));

      await supabase.from('hunting_queues').insert([queueItem]);
    } catch (err) {
      alert('Erro ao entrar na fila: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRelease = async (respawnId, claimId) => {
    setActionLoading(respawnId);
    setActiveClaims(prev => {
      const next = { ...prev };
      delete next[respawnId];
      try {
        localStorage.setItem('auroria_respawn_claims', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      if (claimId && !String(claimId).startsWith('claim-')) {
        await supabase
          .from('hunting_claims')
          .update({ status: 'CLOSED' })
          .eq('id', claimId);
      }
    } catch (err) {
      console.warn('Erro ao sincronizar liberação no servidor:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyAnnouncement = (respawn, activeClaim) => {
    let text = '';
    if (activeClaim) {
      text = `🏰 [RubinOT Tracker] Cave: ${respawn.name} (${respawn.category}) | Ocupada por: ${activeClaim.character_name} há ${formatUptime(activeClaim.claimed_at)}`;
    } else {
      text = `🏰 [RubinOT Tracker] Cave: ${respawn.name} (${respawn.category}) está LIVRE! Level Rec: ${respawn.recLevel || '400+'}`;
    }
    navigator.clipboard.writeText(text);
    setCopiedClaimId(respawn.id);
    setTimeout(() => setCopiedClaimId(null), 2000);
  };

  const categories = useMemo(() => {
    const set = new Set(respawns.map(r => r.category).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [respawns]);

  const huntTypes = ['ALL', 'Solo', 'Solo / Duo', 'Full Team 4x'];

  const filteredRespawns = useMemo(() => {
    return respawns.filter(r => {
      const matchesSearch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            String(r.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
      const matchesType = selectedHuntType === 'ALL' || (r.huntType || '').includes(selectedHuntType);
      return matchesSearch && matchesCat && matchesType;
    });
  }, [respawns, searchTerm, selectedCategory, selectedHuntType]);

  const stats = useMemo(() => {
    const total = respawns.length;
    const occupied = Object.values(activeClaims).filter(Boolean).length;
    const free = Math.max(0, total - occupied);
    const waitingTotal = Object.values(queues).reduce((acc, q) => acc + (q?.length || 0), 0);
    return { total, occupied, free, waitingTotal };
  }, [respawns, activeClaims, queues]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Header Banner com Estatísticas em Tempo Real */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-950/40 via-stone-950 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3 shadow-inner">
              <Swords size={14} className="text-yellow-400 animate-pulse" />
              Live Cave & Claim Dispatcher
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold">
              Controle de Respawns & Caves
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Evite confusão e ks entre membros da guilda! Reivindique sua cave em tempo real, visualize a fila de espera prioritária e compartilhe anúncios instantâneos com a guilda.
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-3 gap-2.5 w-full lg:w-auto shrink-0">
            <div className="bg-black/70 border border-green-500/30 rounded-2xl p-3 text-center shadow-lg">
              <span className="text-[10px] uppercase font-bold text-green-400 block">Caves Livres</span>
              <span className="text-xl font-bold font-mono text-green-300">{stats.free}</span>
            </div>
            <div className="bg-black/70 border border-yellow-500/30 rounded-2xl p-3 text-center shadow-lg">
              <span className="text-[10px] uppercase font-bold text-yellow-400 block">Em Hunt</span>
              <span className="text-xl font-bold font-mono text-yellow-300">{stats.occupied}</span>
            </div>
            <div className="bg-black/70 border border-blue-500/30 rounded-2xl p-3 text-center shadow-lg">
              <span className="text-[10px] uppercase font-bold text-blue-400 block">Em Fila</span>
              <span className="text-xl font-bold font-mono text-blue-300">{stats.waitingTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-black/60 border border-tibia-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nome da cave, monstro ou região..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/80 border border-tibia-border/60 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs font-sans focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        {/* Filtro por Tipo de Hunt */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {huntTypes.map(ht => (
            <button
              key={ht}
              onClick={() => setSelectedHuntType(ht)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedHuntType === ht
                  ? 'bg-yellow-500 text-black border-yellow-400 shadow-md'
                  : 'bg-black/40 text-gray-400 border-white/10 hover:text-white'
              }`}
            >
              {ht === 'ALL' ? 'Todos os Tipos' : ht}
            </button>
          ))}
        </div>
      </div>

      {/* Categorias Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === cat
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-sm'
                : 'bg-black/40 text-gray-400 border-white/5 hover:text-white'
            }`}
          >
            {cat === 'ALL' ? 'Todas as Categorias' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRespawns.map(respawn => {
            const activeClaim = activeClaims[respawn.id];
            const queueList = queues[respawn.id] || [];
            const isClaimedByMe = activeClaim && (
              (profile?.main_character && activeClaim.character_name.toLowerCase() === profile.main_character.toLowerCase()) ||
              (activeClaim.web_user_id && activeClaim.web_user_id === user?.id)
            );
            const isOccupied = Boolean(activeClaim);
            const isLoadingThis = actionLoading === respawn.id;

            return (
              <div
                key={respawn.id}
                className={`border rounded-2xl p-4 transition-all flex flex-col justify-between backdrop-blur-sm ${
                  isOccupied
                    ? 'border-yellow-600/50 bg-gradient-to-b from-yellow-950/20 to-black/80 shadow-lg'
                    : 'border-white/10 bg-black/50 hover:border-yellow-500/40'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug hover:text-yellow-300 transition-colors">
                        {respawn.name}
                      </h3>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Map size={11} className="text-yellow-400" />
                        {respawn.category || 'Geral'} • <strong className="text-cyan-400">{respawn.huntType || 'Solo/Duo'}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyAnnouncement(respawn, activeClaim)}
                      className="p-1.5 bg-black/60 border border-white/10 hover:border-yellow-500/40 rounded-lg text-gray-400 hover:text-white transition-all shrink-0"
                      title="Copiar anúncio da cave para Discord/Chat"
                    >
                      {copiedClaimId === respawn.id ? <Check size={13} className="text-green-400" /> : <Share2 size={13} />}
                    </button>
                  </div>

                  {/* Informações de Hunt (XP & Lucro) */}
                  <div className="grid grid-cols-3 gap-1.5 my-3 p-2 bg-black/40 rounded-xl border border-white/5 text-center text-[10px]">
                    <div>
                      <span className="text-gray-500 block uppercase font-semibold">Nível Rec.</span>
                      <span className="text-yellow-400 font-bold font-mono">{respawn.recLevel || '400+'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase font-semibold">XP Estimada</span>
                      <span className="text-green-400 font-bold font-mono">{respawn.xpPerHour || '12M+'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase font-semibold">Lucro Médio</span>
                      <span className="text-cyan-400 font-bold font-mono">{respawn.profitPerHour || '800k+'}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    {isOccupied ? (
                      <div className="bg-yellow-950/40 border border-yellow-600/40 rounded-xl p-3 shadow-inner">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-yellow-300 flex items-center gap-1.5 flex-wrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping"></span>
                            <span>{activeClaim.character_name}</span>
                            {activeClaim.is_vip && (
                              <span className="px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[9px] font-bold font-mono">
                                👑 VIP Hunter
                              </span>
                            )}
                          </span>
                          <span className="text-gray-300 font-mono text-[11px] flex items-center gap-1 shrink-0">
                            <Clock size={12} className="text-yellow-400" /> {formatUptime(activeClaim.claimed_at)}
                          </span>
                        </div>
                        {queueList.length > 0 && (
                          <div className="text-[11px] text-gray-400 mt-2 border-t border-yellow-900/40 pt-1.5 flex items-center justify-between">
                            <span>Próximo da fila:</span>
                            <span className="text-white font-bold">{queueList[0].character_name} ({queueList.length} total)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-950/30 border border-green-600/40 rounded-xl p-2.5 text-xs text-green-400 flex items-center justify-between font-semibold shadow-inner">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-green-400" /> Cave Livre
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-300 uppercase font-bold">
                          Disponível
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-2 flex gap-2 pt-2 border-t border-white/5">
                  {isOccupied ? (
                    <>
                      {isClaimedByMe || isAdmin ? (
                        <button
                          onClick={() => handleRelease(respawn.id, activeClaim.id)}
                          disabled={isLoadingThis}
                          className="flex-1 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <LogOut size={14} />
                          {isLoadingThis ? 'Liberando...' : 'Liberar Cave'}
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleNext(respawn.id)}
                        disabled={isLoadingThis}
                        className="flex-1 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-600/50 text-blue-300 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ArrowRight size={14} />
                        {isLoadingThis ? 'Aguarde...' : 'Entrar na Fila'}
                      </button>

                      {!isClaimedByMe && (
                        <button
                          onClick={() => toggleMonitorCave(respawn.id, respawn.name)}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 ${
                            monitoredCaves.includes(respawn.id)
                              ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300 shadow-sm'
                              : 'bg-black/50 border-white/10 text-gray-400 hover:text-white hover:border-yellow-500/40'
                          }`}
                          title={isPremium ? (monitoredCaves.includes(respawn.id) ? 'Remover alerta sonoro' : 'Ativar alerta por voz quando esta cave for liberada 👑') : 'Exclusivo VIP: Alerta de Cave Livre 👑'}
                        >
                          <Bell size={14} className={monitoredCaves.includes(respawn.id) ? 'text-yellow-400 animate-bounce' : ''} />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleClaim(respawn.id)}
                      disabled={isLoadingThis}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-black font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      {isPremium ? <Crown size={14} className="text-black" /> : <UserCheck size={14} />}
                      {isLoadingThis ? 'Reivindicando...' : isPremium ? 'Claim VIP (Hunt 3h Estendida) 👑' : 'Claim (Caçar Agora 2h)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Banner de Anúncios */}
      <AdBanner slot="respawn_tracker_footer" format="horizontal" />
    </div>
  );
}