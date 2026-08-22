import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PartyDashboard({ party, onPlayerClick }) {
  const [membersData, setMembersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualHuntTime, setActualHuntTime] = useState(null);

  useEffect(() => {
    const fetchPartyData = async () => {
      if (!party || !party.members || party.members.length === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: logs } = await supabase
        .from('telemetry_logs')
        .select('character_name, delta_xp, recorded_at, level')
        .in('character_name', party.members)
        .gte('recorded_at', twentyFourHoursAgo)
        .order('recorded_at', { ascending: true });

      if (logs) {
        const memberStats = {};
        party.members.forEach(m => {
          memberStats[m] = { name: m, totalXpGained: 0, level: '?', lastSeen: null };
        });

        logs.forEach(log => {
          if (memberStats[log.character_name]) {
            memberStats[log.character_name].totalXpGained += parseInt(log.delta_xp || 0, 10);
            memberStats[log.character_name].level = log.level;
            memberStats[log.character_name].lastSeen = new Date(log.recorded_at);
          }
        });

        const processedMembers = Object.values(memberStats).map(m => {
          const raw = m.totalXpGained;
          let formattedXp = '0';
          if (raw >= 1000000) formattedXp = (raw / 1000000).toFixed(1) + 'M';
          else if (raw >= 1000) formattedXp = (raw / 1000).toFixed(1) + 'k';
          else formattedXp = raw.toString();

          return { ...m, formattedXp, isOnline: m.lastSeen && (new Date() - m.lastSeen) < 15 * 60 * 1000 };
        });

        processedMembers.sort((a, b) => b.totalXpGained - a.totalXpGained);
        setMembersData(processedMembers);

        // Calculate Actual Hunt Time based on XP telemetry
        let huntStart = null;
        let huntEnd = null;
        
        const [sh, sm] = (party.slot_start || '00:00').split(':').map(Number);
        const [eh, em] = (party.slot_end || '23:59').split(':').map(Number);
        const startMins = sh * 60 + sm;
        let endMins = eh * 60 + em;
        if (endMins < startMins) endMins += 1440; // Cross midnight

        logs.forEach(log => {
          const dxp = parseInt(log.delta_xp || 0, 10);
          if (dxp > 0) {
            const date = new Date(log.recorded_at);
            let logMins = date.getHours() * 60 + date.getMinutes();
            if (endMins > 1440 && logMins < 600) logMins += 1440;

            if (logMins >= startMins - 60 && logMins <= endMins + 60) {
                if (!huntStart || date < huntStart) huntStart = date;
                if (!huntEnd || date > huntEnd) huntEnd = date;
            }
          }
        });

        if (huntStart && huntEnd) {
            setActualHuntTime({ 
               start: huntStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
               end: huntEnd.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
            });
        } else {
            setActualHuntTime(null);
        }

      }
      setLoading(false);
    };
    fetchPartyData();
  }, [party]);

  if (!party) return <div>Nenhuma party selecionada.</div>;

  const statusColors = {
    EFFICIENT: 'border-green-500 bg-green-500/10 text-green-400',
    SUBOPTIMAL: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    GHOST_SLOT: 'border-red-500 bg-red-500/10 text-red-400',
    DEFAULT: 'border-tibia-border bg-tibia-card text-gray-400'
  };
  const currentStatus = party.status || 'DEFAULT';

  const chartData = membersData.map(m => ({ name: m.name.split(' ')[0], xp: m.totalXpGained }));
  const formatXpAxis = (tick) => {
    if (tick >= 1000000) return (tick / 1000000).toFixed(1) + 'M';
    if (tick >= 1000) return (tick / 1000).toFixed(0) + 'k';
    return tick;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-8">
      <div className="mb-6">
        <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Dossiê da Party</h2>
        <p className="text-gray-400 font-sans">Verifique o rendimento coletivo e individual da hunt.</p>
      </div>
      
      <div className={`p-6 rounded-lg border-2 ${statusColors[currentStatus].split(' text-')[0]} mb-8 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={120} /></div>
        <h2 className="text-4xl font-black text-white mb-2">{party.party_name}</h2>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <span className="text-tibia-highlight">📍 {party.respawn_category} / {party.hunt_name || 'Desconhecido'}</span>
          <span className="text-gray-300">👑 Líder: {party.leader_name}</span>
          <span className="text-blue-400"><Clock size={14} className="inline mr-1" /> {party.slot_start} - {party.slot_end}</span>
        </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Status do Slot</p>
              <p className={`text-lg font-bold flex items-center ${statusColors[currentStatus].split(' ')[2]}`}>
                {currentStatus === 'EFFICIENT' && <TrendingUp size={20} className="mr-2" />}
                {currentStatus === 'SUBOPTIMAL' && <Clock size={20} className="mr-2" />}
                {currentStatus === 'GHOST_SLOT' && <AlertTriangle size={20} className="mr-2" />}
                {currentStatus === 'EFFICIENT' ? 'Caçando Ativamente' :
                 currentStatus === 'SUBOPTIMAL' ? 'Ociosidade Parcial' :
                 currentStatus === 'GHOST_SLOT' ? 'Slot Abandonado (Ghost)' : 'Aguardando Slot'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Horário Real (Telemetria)</p>
              <p className="text-lg font-bold text-white flex items-center">
                 {actualHuntTime ? (
                     <><Clock size={16} className="text-blue-400 mr-2" /> {actualHuntTime.start} - {actualHuntTime.end}</>
                 ) : (
                     <span className="text-gray-500 text-sm italic">Não detectado</span>
                 )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">ΔXP/h Registrado</p>
              <p className="text-lg font-bold text-white">{party.delta_xp || '0'}</p>
            </div>
          </div>
        </div>

      {loading ? (
        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 bg-black/40 border-b border-tibia-border"><h3 className="font-bold text-white">Rendimento Individual (24h)</h3></div>
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-black/20 text-gray-400 uppercase font-semibold">
                <tr><th className="px-6 py-3">Membro</th><th className="px-6 py-3">Level</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">XP Contribuída</th></tr>
              </thead>
              <tbody className="divide-y divide-tibia-border/50">
                {membersData.map(m => (
                  <tr key={m.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white cursor-pointer hover:text-tibia-primary hover:underline" onClick={() => onPlayerClick && onPlayerClick(m.name)}>
                      {m.name} {m.name === party.leader_name && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-500 px-1 py-0.5 rounded">Líder</span>}
                    </td>
                    <td className="px-6 py-4">{m.level !== '?' ? <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded">Lvl {m.level}</span> : <span className="text-gray-600">?</span>}</td>
                    <td className="px-6 py-4">{m.isOnline ? <span className="text-green-400 flex items-center font-medium"><span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>Caçando</span> : <span className="text-gray-500 flex items-center"><span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span>Inativo</span>}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-400">+{m.formattedXp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-6">
            <h3 className="font-bold text-white mb-6">Balanço da Party</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#666" tickFormatter={formatXpAxis} />
                  <YAxis dataKey="name" type="category" stroke="#999" width={80} tick={{fill: '#ccc', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} formatter={(value) => [`${formatXpAxis(value)} XP`, 'Ganho']} />
                  <Bar dataKey="xp" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic text-center">Membros inativos com XP zerada podem estar offline, em outro servidor ou mochilando.</p>
          </div>
        </div>
      )}
    </div>
  );
}
