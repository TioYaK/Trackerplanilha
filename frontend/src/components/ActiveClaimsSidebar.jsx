import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Swords, Clock, Map, ChevronRight, ChevronLeft, X } from 'lucide-react';

export default function ActiveClaimsSidebar() {
  const [claims, setClaims] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('hunting_claims')
        .select(`
          id,
          character_name,
          claimed_at,
          respawn_id,
          respawns ( name, category )
        `)
        .eq('status', 'ACTIVE')
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (err) {
      console.error('Erro ao buscar claims:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();

    const sub = supabase
      .channel('public:hunting_claims')
      .on("postgres_changes", { event: '*', schema: 'public', table: 'hunting_claims' }, () => {
        fetchClaims();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/3 z-50 bg-tibia-gold text-tibia-dark rounded-l-md p-2 shadow-lg border border-r-0 border-yellow-700/50 hover:bg-yellow-500 transition-colors"
      >
        <div className="flex flex-col items-center gap-2">
          <ChevronLeft size={20} />
          <span className="[&writing-mode:vertical-lr] font-bold tracking-widest text-sm">RESPAWNS</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-72 bg-tibia-dark border-l border-tibia-gold/30 flex flex-col z-50 shadow-2xl transition-transform duration-300">
      <div className="bg-gradient-to-r from-tibia-gold/10 to-tibia-dark p-4 border-b border-tibia-gold/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Swords className="text-tibia-gold" size={20} />
          <h2 className="text-tibia-gold font-bold">Hunts Ativas</h2>
          <span className="bg-tibia-gold/20 text-tibia-gold px-2 py-0.5 rounded-full text-xs font-bold">
            {claims.length}
          </span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="text-center text-gray-500 mt-10">Carregando mapa...</div>
        ) : claims.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 text-sm">
            Nenhuma hunt ocupada no momento. <br/>Tudo liberado!
          </div>
        ) : (
          claims.map(claim => (
            <div key={claim.id} className="bg-black/40 border border-tibia-gold/10 rounded-md p-3 hover:border-tibia-gold/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-bold text-gray-200">
                  {claim.respawns?.name || claim.respawn_id}
                </div>
                <div className="flex items-center text-xs text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                  <Clock size={12} className="mr-1" />
                  {formatUptime(claim.claimed_at)}
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Map size={12} className="mr-1" />
                {claim.respawns?.category || 'Desconhecido'}
              </div>
              <div className="text-xs text-tibia-gold font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {claim.character_name}
              </div>
            </div>
          ))
        )
}
      </div>
      
      <div className="p-3 border-t border-tibia-gold/20 bg-black/30">
        <button className="w-full py-2 bg-tibia-gold/10 hover:bg-tibia-gold/20 border border-tibia-gold/30 text-tibia-gold rounded font-bold text-sm transition-colors">
          Gerenciar Respawns
        </button>
      </div>
    </div>
  );
}