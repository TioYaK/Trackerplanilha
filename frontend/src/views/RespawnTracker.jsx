import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { Swords, Map, Search, Clock, CheckCircle2, UserCheck, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RespawnTracker({ isAdmin }) {
  const { profile, user } = useAuth();
  const [respawns, setRespawns] = useState([]);
  const [activeClaims, setActiveClaims] = useState({});
  const [queues, setQueues] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRespawnsAndClaims = async () => {
    try {
      const [respawnsRes, claimsRes, queuesRes] = await Promise.all([
        supabase.from('respawns').select('*').order('name'),
        supabase.from('hunting_claims').select('*').eq('status', 'ACTIVE'),
        supabase.from('hunting_queues').select('*').eq('status', 'WAITING').order('joined_at', { ascending: true })
      ]);

      if (respawnsRes.data) setRespawns(respawnsRes.data);

      const claimsMap = {};
      (claimsRes.data || []).forEach(c => {
        claimsMap[c.respawn_id] = c;
      });
      setActiveClaims(claimsMap);

      const queuesMap = {};
      (queuesRes.data || []).forEach(q => {
        if (!queuesMap[q.respawn_id]) queuesMap[q.respawn_id] = [];
        queuesMap[q.respawn_id].push(q);
      });
      setQueues(queuesMap);
    } catch (err) {
      console.error('Erro ao buscar dados de respawns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRespawnsAndClaims();

    // Sincronização em tempo real para Claims e Queues
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
  }, []);

  const formatUptime = (startTime) => {
    if (!startTime) return '0m';
    const parsed = new Date(startTime).getTime();
    if (isNaN(parsed)) return '0m';
    const diff = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
    if (diff < 60) return `${diff}m`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h${m}m`;
  };

  const handleClaim = async (respawnId) => {
    const charName = profile?.main_character;
    if (!charName) {
      alert('Configure seu Main Character no Perfil para poder dar Claim.');
      return;
    }

    setActionLoading(respawnId);
    try {
      // 1. Fecha qualquer claim anterior ativo desse personagem
      await supabase
        .from('hunting_claims')
        .update({ status: 'CLOSED' })
        .eq('character_name', charName)
        .eq('status', 'ACTIVE');

      // 2. Insere novo claim
      const { error } = await supabase.from('hunting_claims').insert([{
        respawn_id: respawnId,
        character_name: charName,
        web_user_id: user?.id || null,
        status: 'ACTIVE',
        claimed_at: new Date().toISOString()
      }]);

      if (error) throw error;
      await fetchRespawnsAndClaims();
    } catch (err) {
      alert('Erro ao reivindicar respawn: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNext = async (respawnId) => {
    const charName = profile?.main_character;
    if (!charName) {
      alert('Configure seu Main Character no Perfil para entrar na fila.');
      return;
    }

    setActionLoading(respawnId);
    try {
      // Verifica se já está na fila
      const currentQueue = queues[respawnId] || [];
      const alreadyInQueue = currentQueue.some(q => (q.character_name || '').toLowerCase() === charName.toLowerCase());

      if (alreadyInQueue) {
        alert('Você já está na fila de espera deste respawn!');
        return;
      }

      const { error } = await supabase.from('hunting_queues').insert([{
        respawn_id: respawnId,
        character_name: charName,
        web_user_id: user?.id || null,
        status: 'WAITING',
        joined_at: new Date().toISOString()
      }]);

      if (error) throw error;
      await fetchRespawnsAndClaims();
    } catch (err) {
      alert('Erro ao entrar na fila: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRelease = async (claimId) => {
    setActionLoading(claimId);
    try {
      const { error } = await supabase
        .from('hunting_claims')
        .update({ status: 'CLOSED' })
        .eq('id', claimId);

      if (error) throw error;
      await fetchRespawnsAndClaims();
    } catch (err) {
      alert('Erro ao liberar respawn: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const categories = useMemo(() => {
    const set = new Set(respawns.map(r => r.category).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [respawns]);

  const filteredRespawns = useMemo(() => {
    return respawns.filter(r => {
      const matchesSearch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            String(r.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [respawns, searchTerm, selectedCategory]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-tibia-inset">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-tibia-border pb-4">
          <div>
            <h1 className="text-3xl font-medieval text-tibia-primary flex items-center gap-2">
              <Swords size={28} /> Respawns & Caves Ativas
            </h1>
            <p className="text-sm text-gray-400 font-sans mt-1">
              Reivindique o spawn em tempo real ou entre na fila de espera prioritária da Guilda.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por ID, Nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-tibia-border text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-tibia-primary text-sm font-sans"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-tibia-primary text-black border-tibia-highlight shadow-tibia-glow'
                  : 'bg-black/40 text-gray-400 border-tibia-border hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'Todos os Respawns' : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tibia-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRespawns.map(respawn => {
              const activeClaim = activeClaims[respawn.id];
              const queueList = queues[respawn.id] || [];
              const isClaimedByMe = activeClaim && profile?.main_character &&
                activeClaim.character_name.toLowerCase() === profile.main_character.toLowerCase();
              const isOccupied = Boolean(activeClaim);
              const isLoadingThis = actionLoading === respawn.id || (activeClaim && actionLoading === activeClaim.id);

              return (
                <div
                  key={respawn.id}
                  className={`bg-black/40 border rounded-lg p-4 transition-all flex flex-col justify-between ${
                    isOccupied
                      ? 'border-yellow-700/40 bg-gradient-to-b from-yellow-950/10 to-black/60 shadow-md'
                      : 'border-tibia-border/50 hover:border-tibia-primary/40'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="font-bold text-white text-base leading-snug">{respawn.name}</div>
                      <div className="bg-tibia-primary/10 text-tibia-primary text-xs px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                        {respawn.id}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                      <Map size={12} />
                      {respawn.category || 'Geral'}
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      {isOccupied ? (
                        <div className="bg-yellow-950/30 border border-yellow-700/50 rounded p-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-yellow-400 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                              {activeClaim.character_name}
                            </span>
                            <span className="text-gray-400 font-mono flex items-center gap-1">
                              <Clock size={11} /> {formatUptime(activeClaim.claimed_at)}
                            </span>
                          </div>
                          {queueList.length > 0 && (
                            <div className="text-[11px] text-gray-400 mt-1.5 border-t border-yellow-900/40 pt-1">
                              Fila: <span className="text-white font-semibold">{queueList.length} na espera</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-green-950/20 border border-green-700/30 rounded p-2 text-xs text-green-400 flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-green-400" /> Livre
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase">Disponível</span>
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
                            onClick={() => handleRelease(activeClaim.id)}
                            disabled={isLoadingThis}
                            className="flex-1 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-300 py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                          >
                            <LogOut size={13} />
                            {isLoadingThis ? 'Liberando...' : 'Liberar Cave'}
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleNext(respawn.id)}
                          disabled={isLoadingThis}
                          className="flex-1 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/50 text-blue-300 py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <ArrowRight size={13} />
                          {isLoadingThis ? 'Aguarde...' : 'Next (Fila)'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleClaim(respawn.id)}
                        disabled={isLoadingThis}
                        className="w-full bg-green-700/30 hover:bg-green-700/50 border border-green-600/60 text-green-300 py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <UserCheck size={14} />
                        {isLoadingThis ? 'Reivindicando...' : 'Claim (Caçar Aqui)'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}