import React, { useState, useEffect } from 'react';
import { Trophy, AlertOctagon, Gavel, Trash2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Rankings({ isAdmin }) {
  const [topRushers, setTopRushers] = useState([]);
  const [topParty, setTopParty] = useState(null);
  const [activeStrikes, setActiveStrikes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // 1. Top Rushers (24h)
    const { data: rushersData } = await supabase
      .from('view_top_rushers_24h')
      .select('*')
      .gt('xp_gained', 0)
      .limit(5);

    if (rushersData) setTopRushers(rushersData);

    // 2. PT de Elite (Maior XP Registrada Hoje)
    const today = new Date().toISOString().split('T')[0];
    const { data: partiesData } = await supabase
      .from('parties_planilhadas')
      .select('*')
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    if (partiesData && partiesData.length > 0) {
      let bestParty = null;
      let maxXP = -1;
      partiesData.forEach(p => {
        let numericXp = 0;
        if (p.delta_xp) {
          if (p.delta_xp.endsWith('M')) numericXp = parseFloat(p.delta_xp) * 1000000;
          else if (p.delta_xp.endsWith('K') || p.delta_xp.endsWith('k')) numericXp = parseFloat(p.delta_xp) * 1000;
          else numericXp = parseInt(p.delta_xp) || 0;
        }
        if (numericXp > maxXP) {
          maxXP = numericXp;
          bestParty = { ...p, numericXp };
        }
      });
      if (maxXP > 0) setTopParty(bestParty);
    }

    // 3. Tribunal (Strikes Ativos)
    const { data: strikesData } = await supabase
      .from('player_strikes')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (strikesData) setActiveStrikes(strikesData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatXP = (xp) => {
    if (xp >= 1000000) return (xp / 1000000).toFixed(1) + 'M';
    if (xp >= 1000) return (xp / 1000).toFixed(1) + 'k';
    return xp.toString();
  };

  const handleRevokeStrike = async (id) => {
    if (!isAdmin) return;
    if (confirm('Tem certeza que deseja perdoar esta punição? Ela será removida permanentemente do histórico ativo.')) {
      await supabase.from('player_strikes').delete().eq('id', id);
      fetchData();
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="mb-8 border-b border-tibia-border pb-4">
        <h2 className="text-5xl font-medieval text-gradient-gold mb-2">Leaderboards & Tribunal</h2>
        <p className="text-gray-400 font-sans">Celebre os melhores jogadores e gerencie as punições ativas da guilda.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Hall da Fama - Top Rushers */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 bg-black/40 border-b border-tibia-border flex items-center">
            <Trophy className="text-yellow-500 mr-3" size={24} />
            <h3 className="font-bold text-white text-xl">Top 5 Rushadores (24h)</h3>
          </div>
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-black/20 text-gray-400 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Jogador</th>
                <th className="px-6 py-3 text-right">XP Ganhos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tibia-border/50">
              {topRushers.length === 0 ? (
                <tr><td colSpan="3" className="text-center py-6 text-gray-500">Nenhum ganho de XP registrado hoje.</td></tr>
              ) : (
                topRushers.map((r, i) => (
                  <tr key={r.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-yellow-500">{i + 1}º</td>
                    <td className="px-6 py-4 font-medium text-white">{r.name} <span className="text-xs text-gray-500 block">{r.vocation} - Lvl {r.level}</span></td>
                    <td className="px-6 py-4 text-right font-bold text-green-400">+{formatXP(r.xp_gained)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Hall da Fama - PT de Elite */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Trophy size={150} /></div>
          <div className="p-4 bg-black/40 border-b border-tibia-border flex items-center">
            <Trophy className="text-blue-400 mr-3" size={24} />
            <h3 className="font-bold text-white text-xl">PT de Elite (Hoje)</h3>
          </div>
          
          <div className="p-8 relative z-10">
            {!topParty ? (
              <div className="text-center text-gray-500 py-8">Nenhuma party registrou XP hoje ainda.</div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold uppercase mb-4 border border-blue-500/30">
                  Maior Eficiência do Dia
                </span>
                <h4 className="text-4xl font-black text-white mb-2">{topParty.party_name}</h4>
                <p className="text-tibia-highlight font-medium mb-6">📍 {topParty.respawn_category} / {topParty.hunt_name}</p>
                
                <div className="bg-black/40 p-4 rounded-lg border border-tibia-border w-full">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">XP Registrada pela Equipe</p>
                  <p className="text-3xl font-bold text-green-400">+{topParty.delta_xp}</p>
                </div>
                
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="text-xs text-gray-400 font-bold w-full mb-1">MEMBROS DA EQUIPE</span>
                  {topParty.members?.map(m => (
                    <span key={m} className="bg-white/5 border border-white/10 px-3 py-1 rounded text-sm text-gray-300">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tribunal */}
      <div className="bg-tibia-card border border-red-900/50 rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 bg-red-900/20 border-b border-red-900/50 flex items-center justify-between">
          <div className="flex items-center">
            <Gavel className="text-red-500 mr-3" size={24} />
            <h3 className="font-bold text-white text-xl">Tribunal (Strikes Ativos)</h3>
          </div>
          {isAdmin && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">Modo Admin Ativo</span>}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-black/20 text-gray-400 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Infrator</th>
                <th className="px-6 py-4">Motivo da Punição</th>
                <th className="px-6 py-4">Aplicado Por</th>
                <th className="px-6 py-4">Expira em</th>
                {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-red-900/30">
              {activeStrikes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-gray-500">
                    <AlertOctagon className="mx-auto mb-2 opacity-50" size={32} />
                    Nenhum jogador possui advertências ativas.
                  </td>
                </tr>
              ) : (
                activeStrikes.map(strike => (
                  <tr key={strike.id} className="hover:bg-red-900/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{strike.character_name}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {strike.reason.includes('GHOST_SLOT') || strike.reason.includes('Falta injustificada') ? (
                        <span className="text-red-400 flex items-center">
                          <AlertOctagon size={14} className="mr-2" /> {strike.reason}
                        </span>
                      ) : strike.reason}
                    </td>
                    <td className="px-6 py-4">
                      {strike.admin_name === 'Robô Xerife' ? (
                        <span className="text-purple-400 font-medium">🤖 {strike.admin_name}</span>
                      ) : (
                        strike.admin_name
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center text-yellow-500/80">
                      <Clock size={14} className="mr-2" />
                      {formatDistanceToNow(new Date(strike.expires_at), { addSuffix: true, locale: ptBR })}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleRevokeStrike(strike.id)}
                          className="bg-red-900/50 hover:bg-red-800 text-white p-2 rounded transition flex items-center ml-auto border border-red-500/30"
                          title="Perdoar Punição"
                        >
                          <Trash2 size={16} className="mr-2" /> Perdoar
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
