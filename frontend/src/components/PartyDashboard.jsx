import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, TrendingUp, AlertTriangle, Users, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PartyDashboard({ party, onPlayerClick }) {
  const [membersData, setMembersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualHuntTime, setActualHuntTime] = useState(null);
  const [historyRange, setHistoryRange] = useState('week'); // 'week' ou 'month'
  const [historyChartData, setHistoryChartData] = useState([]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formatXp = (raw) => {
        if (raw >= 1000000) return (raw / 1000000).toFixed(1) + 'M';
        if (raw >= 1000) return (raw / 1000).toFixed(1) + 'k';
        return raw;
      };
      return (
        <div className="bg-gray-900 border border-tibia-border p-3 rounded shadow-lg text-sm">
          <p className="font-bold text-tibia-primary mb-2">{label}</p>
          <p className="text-gray-300">XP Gained: <span className="text-white font-bold">{formatXp(data.totalXp)}</span></p>
          {data.singlePing ? (
             <p className="text-blue-400 mt-1"><Clock size={12} className="inline mr-1" /> Ping Isolado: {data.start}</p>
          ) : (
             <p className="text-blue-400 mt-1"><Clock size={12} className="inline mr-1" /> Entrada: {data.start} | Saída: {data.end}</p>
          )}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    const fetchPartyData = async () => {
      if (!party || !party.members || party.members.length === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const daysToFetch = historyRange === 'week' ? 7 : 30;
      const historyStartDate = new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000).toISOString();
      
      // Server Save Logic (10:00 AM BRT = 13:00 UTC)
      const getLastSS = () => {
        const now = new Date();
        const ss = new Date(now);
        if (now.getUTCHours() < 13) {
          ss.setUTCDate(ss.getUTCDate() - 1);
        }
        ss.setUTCHours(13, 0, 0, 0);
        return ss.getTime();
      };
      
      const getTibiaDay = (d) => {
        // Subtrai 13h do UTC para que meia-noite virtual seja 10h da manhã do Brasil.
        const ssDate = new Date(d.getTime() - 13 * 60 * 60 * 1000);
        return ssDate.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' });
      };

      const lastSSTime = getLastSS();

      let logs = [];
      const { data, error } = await supabase
        .from('historical_sessions')
        .select('character_name, xp_gained, session_end, end_level')
        .gte('session_end', historyStartDate)
        .order('session_end', { ascending: true });
        
      if (!error && data) {
        const partyMemberSet = new Set(party.members.map(m => m.toLowerCase()));
        logs = data.filter(d => partyMemberSet.has(d.character_name.toLowerCase()));
      }
      
      // Busca estado atual (Edge Computing) para mesclar com as sessões finalizadas
      let currentStates = [];
      const { data: states } = await supabase
        .from('current_character_state')
        .select('*');
        
      if (states) {
        const partyMemberSet = new Set(party.members.map(m => m.toLowerCase()));
        currentStates = states.filter(s => partyMemberSet.has(s.character_name.toLowerCase()));
      }
      
      let guildData = [];
      const { data: gData } = await supabase
        .from('guild_members')
        .select('name, level');
        
      if (gData) {
        const partyMemberSet = new Set(party.members.map(m => m.toLowerCase()));
        guildData = gData.filter(g => partyMemberSet.has(g.name.toLowerCase()));
      }

      if (logs) {
        const memberStats = {};
        party.members.forEach(m => {
          memberStats[m.toLowerCase()] = { name: m, totalXpGained: 0, level: '?', lastSeen: null };
        });
        
        guildData.forEach(g => {
          const m = memberStats[g.name.toLowerCase()];
          if (m && g.level) {
            m.level = g.level;
          }
        });

        currentStates.forEach(state => {
          const m = memberStats[state.character_name.toLowerCase()];
          if (m) {
            m.level = state.level || m.level;
            const lastActive = new Date(state.last_active);
            if (!m.lastSeen || lastActive > m.lastSeen) {
               m.lastSeen = lastActive;
            }
            
            // Soma a XP da sessão atual se estiver ativo e for de hoje (SS)
            if (lastActive.getTime() >= lastSSTime) {
                const deltaXp = Number(state.xp_total || 0) - Number(state.session_start_xp || state.xp_total || 0);
                if (deltaXp > 0) {
                   m.totalXpGained += deltaXp;
                }
            }
          }
        });

        // Agrupamento para o Gráfico de Histórico
        const historyMap = {};
        const [sh, sm] = (party.slot_start || '00:00').split(':').map(Number);
        const [eh, em] = (party.slot_end || '23:59').split(':').map(Number);
        const startMins = sh * 60 + sm;
        let endMins = eh * 60 + em;
        if (endMins < startMins) endMins += 1440; // Cross midnight

        logs.forEach(log => {
          const date = new Date(log.session_end);
          const dxp = parseInt(log.xp_gained || 0, 10);
          const m = memberStats[log.character_name.toLowerCase()];
          
          // Current Server Save Table Logic
          if (date.getTime() >= lastSSTime && m) {
            m.totalXpGained += dxp;
            m.level = log.end_level || m.level;
            m.lastSeen = date;
          }

          // Historical Chart Logic
          let logMins = date.getHours() * 60 + date.getMinutes();
          if (endMins > 1440 && logMins < 600) logMins += 1440;
          
          // Add a 2-hour buffer instead of 60 mins just in case
          if (logMins >= startMins - 120 && logMins <= endMins + 120 && dxp > 0) {
              const dayStr = getTibiaDay(date);
              
              if (!historyMap[dayStr]) {
                  historyMap[dayStr] = { day: dayStr, totalXp: 0, start: date, end: date, rawDate: date };
              }
              historyMap[dayStr].totalXp += dxp;
              if (date < historyMap[dayStr].start) historyMap[dayStr].start = date;
              if (date > historyMap[dayStr].end) historyMap[dayStr].end = date;
          }
        });

        // Converte historyMap para array
        const chartDataArr = Object.values(historyMap)
          .sort((a, b) => a.rawDate - b.rawDate)
          .map(h => {
             const diffMins = (h.end - h.start) / (1000 * 60);
             const formatTime = (d) => d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
             return {
                 day: h.day,
                 totalXp: h.totalXp,
                 start: formatTime(h.start),
                 end: formatTime(h.end),
                 singlePing: diffMins < 5
             };
          });
        setHistoryChartData(chartDataArr);

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

        // Atualiza a Horário Real 
        if (chartDataArr.length > 0) {
            const lastHunt = chartDataArr[chartDataArr.length - 1];
            if (Date.now() - historyMap[lastHunt.day].rawDate.getTime() < 24 * 60 * 60 * 1000) {
               if (lastHunt.singlePing) {
                   setActualHuntTime({ single: lastHunt.start });
               } else {
                   setActualHuntTime({ start: lastHunt.start, end: lastHunt.end });
               }
            } else {
               setActualHuntTime(null);
            }
        } else {
            setActualHuntTime(null);
        }

      }
      setLoading(false);
    };

    fetchPartyData();
    
    const interval = setInterval(fetchPartyData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [party, historyRange]);

  if (!party) return <div>Nenhuma party selecionada.</div>;

  const statusColors = {
    EFFICIENT: 'border-green-500 bg-green-500/10 text-green-400',
    SUBOPTIMAL: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    FALTA_1: 'border-orange-500 bg-orange-500/10 text-orange-400',
    FALTA_2: 'border-orange-600 bg-orange-600/10 text-orange-500',
    GHOST_SLOT: 'border-red-500 bg-red-500/10 text-red-400',
    DEFAULT: 'border-tibia-border bg-tibia-card text-gray-400'
  };
  const currentStatus = party.status || 'DEFAULT';
  const colorClass = statusColors[currentStatus] || statusColors.DEFAULT;

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
              <p className={`text-lg font-bold flex items-center ${statusColors[currentStatus]?.split(' ')[2] || ''}`}>
                {currentStatus === 'EFFICIENT' && <TrendingUp size={20} className="mr-2" />}
                {currentStatus === 'SUBOPTIMAL' && <Clock size={20} className="mr-2" />}
                {(currentStatus === 'FALTA_1' || currentStatus === 'FALTA_2') && <AlertTriangle size={20} className="mr-2 text-orange-400" />}
                {currentStatus === 'GHOST_SLOT' && <AlertTriangle size={20} className="mr-2 text-red-400" />}
                {currentStatus === 'EFFICIENT' ? 'Caçando Ativamente' :
                 currentStatus === 'SUBOPTIMAL' ? 'Ociosidade Parcial' :
                 currentStatus === 'FALTA_1' ? 'Falta (1/3)' :
                 currentStatus === 'FALTA_2' ? 'Falta (2/3)' :
                 currentStatus === 'GHOST_SLOT' ? 'Slot Abandonado (Ghost)' : 'Aguardando Slot'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold flex items-center">
                  Horário Real (Telemetria)
              </p>
              <p className="text-lg font-bold text-white flex items-center">
                 {actualHuntTime ? (
                     actualHuntTime.single ? (
                         <><Clock size={16} className="text-blue-400 mr-2" /> {actualHuntTime.single} (Pico Isolado)</>
                     ) : (
                         <><Clock size={16} className="text-blue-400 mr-2" /> {actualHuntTime.start} - {actualHuntTime.end}</>
                     )
                 ) : (
                     <span className="text-gray-500 text-sm italic">Não detectado</span>
                 )}
              </p>
              <p className="text-[10px] text-gray-500 mt-1 leading-tight flex items-start">
                 <Info size={10} className="mr-1 mt-[2px] flex-shrink-0" />
                 <span>Aviso: Margem de erro de ~5 minutos devido ao intervalo do robô. 
                 {actualHuntTime && actualHuntTime.single && " 'Pico Isolado' indica que a hunt durou menos de 5 minutos (registrada em apenas um ciclo)."}</span>
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
            <div className="p-4 bg-black/40 border-b border-tibia-border"><h3 className="font-bold text-white">Rendimento Individual (Hoje/SS)</h3></div>
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
          
          {/* Gráfico Histórico Semanal/Mensal */}
          <div className="lg:col-span-3 bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden mt-8">
            <div className="p-4 bg-black/40 border-b border-tibia-border flex justify-between items-center">
               <h3 className="font-bold text-white">Histórico de Sessões</h3>
               <select 
                  value={historyRange} 
                  onChange={(e) => setHistoryRange(e.target.value)}
                  className="bg-black/50 border border-tibia-border text-gray-300 px-3 py-1 rounded outline-none text-sm cursor-pointer"
               >
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Últimos 30 dias</option>
               </select>
            </div>
            <div className="p-4" style={{ height: 300 }}>
              {historyChartData.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-gray-500 italic">Nenhum registro de caça neste período.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="day" stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                    <YAxis stroke="#888" tickFormatter={formatXpAxis} tick={{fill: '#888', fontSize: 12}} width={60} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Bar dataKey="totalXp" fill="#b9935a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
