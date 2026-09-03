import React, { useState, useEffect } from 'react';
import { Trophy, AlertOctagon, Gavel, Trash2, Clock, Ghost } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Rankings({ isAdmin }) {
  const [topRushers, setTopRushers] = useState([]);
  const [topParty, setTopParty] = useState(null);
  const [activeStrikes, setActiveStrikes] = useState([]);
  const [ghosts, setGhosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // 1. Top Rushers (24h)
    const { data: rushersData } = await supabase
      .from('view_top_rushers_24h')
      .select('*')
      .gt('exp_gained', 0)
      .limit(5);

    if (rushersData) setTopRushers(rushersData);

    // 2. PT de Elite (Maior XP Registrada Hoje)
    const { data: partiesDataXP } = await supabase
      .from('parties_planilhadas')
      .select('*');

    if (partiesDataXP && partiesDataXP.length > 0) {
      let bestParty = null;
      let maxXP = -1;
      partiesDataXP.forEach(p => {
        let numericXp = 0;
        if (p.delta_xp && typeof p.delta_xp === 'string') {
          if (p.delta_xp.toUpperCase().endsWith('M')) numericXp = parseFloat(p.delta_xp) * 1000000;
          else if (p.delta_xp.toUpperCase().endsWith('K')) numericXp = parseFloat(p.delta_xp) * 1000;
          else numericXp = parseInt(p.delta_xp) || 0;
        } else {
          numericXp = parseInt(p.delta_xp) || 0;
        }
        if (numericXp > maxXP) {
          maxXP = numericXp;
          bestParty = { ...p, numericXp };
        }
      });
      if (maxXP > 0) setTopParty(bestParty);
    }

      // 3. Tribunal (Strikes Ativos)
      let strikesData = [];
      let sPage = 0;
      while(true) {
          const { data } = await supabase
            .from('player_strikes')
            .select('*')
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .range(sPage*1000, (sPage+1)*1000-1);
          if (!data || data.length === 0) break;
          strikesData.push(...data);
          if (data.length < 1000) break;
          sPage++;
      }

    if (strikesData) setActiveStrikes(strikesData);

    // 4. Tribunal Autônomo (Auditoria de Fantasmas)
    const { data: partiesData } = await supabase
      .from('parties_planilhadas')
      .select('*');

    const detectedGhosts = [];
    
    if (partiesData && strikesData) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const currentNormalized = currentMins < 600 ? currentMins + 1440 : currentMins;
      
      const membersToCheck = new Set();
      partiesData.forEach(p => {
         const [sh, sm] = p.slot_start.split(':').map(Number);
         const [eh, em] = p.slot_end.split(':').map(Number);
         const endMins = eh * 60 + em;
         const normEnd = endMins <= 600 ? endMins + 1440 : endMins;
         
         if (currentNormalized > normEnd && p.members) {
           p.members.forEach(m => membersToCheck.add(JSON.stringify({ member: m, party: p })));
         }
      });
      
      if (membersToCheck.size > 0) {
        const uniqueChecks = Array.from(membersToCheck).map(m => JSON.parse(m));
        const names = uniqueChecks.map(m => m.member);
        
        const { data: rosterData } = await supabase
          .from('view_guild_roster')
          .select('name, xp_gained_24h, level')
          .in('name', names);
          
        if (rosterData) {
          uniqueChecks.forEach(mInfo => {
             const rosterMem = rosterData.find(r => r.name === mInfo.member);
             if (rosterMem && (!rosterMem.xp_gained_24h || rosterMem.xp_gained_24h === 0)) {
               const hasStrike = strikesData.some(s => s.character_name === mInfo.member && s.reason.includes('GHOST_SLOT'));
               if (!hasStrike) {
                  detectedGhosts.push({
                    name: mInfo.member,
                    level: rosterMem.level,
                    hunt: mInfo.party.hunt_name,
                    slot: `${mInfo.party.slot_start} - ${mInfo.party.slot_end}`
                  });
               }
             }
          });
        }
      }
    }
    
    const uniqueGhosts = Array.from(new Map(detectedGhosts.map(item => [item.name, item])).values());
    setGhosts(uniqueGhosts);

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

  const handlePunishGhost = async (ghost) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);
    
    const reason = `[GHOST_SLOT] Falta injustificada na ${ghost.hunt} (${ghost.slot})`;
    
    await supabase.from('player_strikes').insert([{
      character_name: ghost.name,
      reason: reason,
      duration_days: 3,
      expires_at: expiresAt.toISOString(),
      admin_name: 'Robô Xerife'
    }]);
    
    fetchData();
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
                    <td className="px-6 py-4 font-medium text-white">
                      {r.name}
                      {(r.vocation || r.level) && (
                        <span className="text-xs text-gray-500 block">
                          {r.vocation ? r.vocation : ''} {r.level ? `- Lvl ${r.level}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-400">+{formatXP(r.exp_gained)}</td>
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
      
      {/* Auditoria Autônoma */}
      {isAdmin && ghosts.length > 0 && (
         <div className="bg-red-950/40 border border-red-500 rounded-lg p-6 mb-8 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <h3 className="text-xl font-bold text-red-500 flex items-center mb-4">
              <Ghost size={24} className="mr-2" /> 
              Fantasmas Detectados (Auditoria Automática)
            </h3>
            <p className="text-red-300 text-sm mb-4">O "Robô Xerife" detectou que os seguintes jogadores planilharam hunts hoje que já terminaram, mas geraram 0 XP no servidor. Deseja puni-los?</p>
            <div className="space-y-3">
               {ghosts.map(g => (
                 <div key={g.name} className="flex flex-col md:flex-row items-center justify-between bg-black/50 p-4 rounded border border-red-900/50">
                    <div className="mb-2 md:mb-0 w-full md:w-auto text-left">
                       <p className="text-white font-bold">{g.name} <span className="text-xs text-gray-400">Lvl {g.level}</span></p>
                       <p className="text-xs text-red-400 font-mono mt-1">Faltou na {g.hunt} ({g.slot})</p>
                    </div>
                    <button 
                       onClick={() => handlePunishGhost(g)}
                       className="bg-red-600 hover:bg-red-500 w-full md:w-auto text-white px-4 py-2 rounded text-sm font-bold transition flex items-center justify-center shadow-tibia-glow whitespace-nowrap"
                    >
                       <AlertOctagon size={16} className="mr-2" /> Aplicar Strike (3 dias)
                    </button>
                 </div>
               ))}
            </div>
         </div>
      )}

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
