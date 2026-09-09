import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, TrendingUp, AlertTriangle, Users, Info, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { parseUtcDate, isSlotActiveNow } from '../lib/tibiaUtils';

const toMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export default function PartyDashboard({ party, onPlayerClick }) {
  const [membersData, setMembersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualHuntTime, setActualHuntTime] = useState(null);
  const [historyRange, setHistoryRange] = useState('week'); // 'week' ou 'month'
  const [historyChartData, setHistoryChartData] = useState([]);
  const [sessionLabel, setSessionLabel] = useState('Rendimento Individual (Hoje / SS)');

  const formatXp = (raw) => {
    if (!raw && raw !== 0) return '0';
    if (raw >= 1000000) return (raw / 1000000).toFixed(1) + 'M';
    if (raw >= 1000) return (raw / 1000).toFixed(1) + 'k';
    return raw.toString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-tibia-border p-3 rounded shadow-lg text-sm">
          <p className="font-bold text-tibia-primary mb-2">{label}</p>
          <p className="text-gray-300">XP Total: <span className="text-white font-bold">{formatXp(data.totalXp)}</span></p>
          {data.singlePing ? (
             <p className="text-blue-400 mt-1"><Clock size={12} className="inline mr-1" /> Ping Isolado: {data.start}</p>
          ) : (
             <p className="text-blue-400 mt-1"><Clock size={12} className="inline mr-1" /> Início: {data.start} | Término: {data.end}</p>
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
      
      const parseDate = (dStr) => {
        if (!dStr) return null;
        if (dStr instanceof Date) return dStr;
        if (typeof dStr !== 'string') return new Date(dStr);
        if (!dStr.endsWith('Z') && !dStr.includes('+') && !dStr.includes('-', 10)) {
          return new Date(dStr + 'Z');
        }
        return new Date(dStr);
      };

      const getTibiaDay = (d) => {
        // Subtrai 13h do UTC para que a virada virtual ocorra às 10h da manhã (Server Save BRT)
        const ssDate = new Date(d.getTime() - 13 * 60 * 60 * 1000);
        return ssDate.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' });
      };

      const formatTime = (d) => {
        if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '--:--';
        return d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      };

      const lastSSTime = getLastSS();

      const validMembers = (party.members || []).filter(m => m && typeof m === 'string' && m.trim().length > 0);
      if (validMembers.length === 0) {
        setLoading(false);
        return;
      }

      const orFilterName = validMembers.map(m => 'name.ilike.' + m.trim()).join(',');
      const orFilterChar = validMembers.map(m => 'character_name.ilike.' + m.trim()).join(',');

      // 1. Busca histórico de sessões
      let logs = [];
      const { data, error } = await supabase
        .from('historical_sessions')
        .select('*')
        .or(orFilterChar)
        .gte('session_end', historyStartDate)
        .order('session_end', { ascending: true });
        
      if (!error && data) {
        logs = data;
      }
      
      // 2. Busca estado atual em tempo real (Edge Computing)
      let currentStates = [];
      const { data: states } = await supabase
        .from('current_character_state')
        .select('*')
        .or(orFilterChar);
        
      if (states) {
        currentStates = states;
      }
      
      // 3. Busca levels e dados cadastrais da guilda
      let guildData = [];
      const { data: gData } = await supabase
        .from('guild_members')
        .select('name, level, is_online')
        .or(orFilterName);
        
      if (gData) {
        guildData = gData;
      }

      // 4. Monta o mapa histórico por dia do Server Save
      const historyMap = {};
      const sMin = toMinutes(party.slot_start);
      let eMin = toMinutes(party.slot_end);
      if (eMin <= sMin) eMin += 1440;
      // Janela de tolerância: 2 horas antes do início até 2.5 horas após o término do slot
      const winStart = sMin - 120;
      const winEnd = eMin + 150;

      logs.forEach(log => {
        const date = parseDate(log.session_end);
        const startDate = parseDate(log.session_start) || date;
        const dxp = parseInt(log.xp_gained || 0, 10);
        if (dxp <= 0 || !date) return;

        // Se a party tem horário planilhado, ignora caçadas solo que ocorreram totalmente fora da janela da party
        if (party.slot_start && party.slot_end) {
          const startBrt = new Date(startDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
          const endBrt = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
          const startM = startBrt.getHours() * 60 + startBrt.getMinutes();
          let endM = endBrt.getHours() * 60 + endBrt.getMinutes();
          if (endM < startM) endM += 1440;

          const inWindow = (startM >= winStart && startM <= winEnd) || (endM >= winStart && endM <= winEnd);
          if (!inWindow) return; // Não junta caçadas solo aleatórias (ex: membro jogando de manhã) na telemetria da party
        }

        const dayStr = getTibiaDay(date);

        if (!historyMap[dayStr]) {
          historyMap[dayStr] = {
            day: dayStr,
            totalXp: 0,
            start: startDate,
            end: date,
            rawDate: date,
            memberXp: {}
          };
        }

        historyMap[dayStr].totalXp += dxp;
        if (startDate < historyMap[dayStr].start) historyMap[dayStr].start = startDate;
        if (date > historyMap[dayStr].end) historyMap[dayStr].end = date;
        
        const charKey = (log.character_name || '').toLowerCase();
        historyMap[dayStr].memberXp[charKey] = (historyMap[dayStr].memberXp[charKey] || 0) + dxp;
      });

      // Converte historyMap para array do gráfico
      const chartDataArr = Object.values(historyMap)
        .sort((a, b) => a.rawDate - b.rawDate)
        .map(h => {
           const diffMins = Math.max(1, (h.end - h.start) / (1000 * 60));
           return {
               day: h.day,
               totalXp: h.totalXp,
               start: formatTime(h.start),
               end: formatTime(h.end),
               singlePing: diffMins < 10,
               memberXp: h.memberXp,
               rawDate: h.rawDate
           };
        });
      setHistoryChartData(chartDataArr);

      // 5. Calcula estatísticas individuais dos membros
      const memberStats = {};
      validMembers.forEach(m => {
        memberStats[m.toLowerCase()] = { name: m, totalXpGained: 0, level: '?', lastSeen: null, isOnlineRoster: false };
      });
      
      guildData.forEach(g => {
        const m = memberStats[g.name?.toLowerCase()];
        if (m) {
          if (g.level) m.level = g.level;
          if (g.is_online !== undefined && g.is_online !== null) {
            m.isOnlineRoster = Boolean(g.is_online);
          }
        }
      });

      // Checa se há XP no Server Save de hoje
      let todayHasXp = false;
      currentStates.forEach(state => {
        const m = memberStats[state.character_name?.toLowerCase()];
        if (m) {
          m.level = state.level || m.level;
          const lastActive = parseDate(state.last_active);
          if (lastActive && (!m.lastSeen || lastActive > m.lastSeen)) {
             m.lastSeen = lastActive;
          }
          
          if (lastActive && lastActive.getTime() >= lastSSTime) {
              const deltaXp = Number(state.xp_total || 0) - Number(state.session_start_xp || state.xp_total || 0);
              if (deltaXp > 0) {
                 m.totalXpGained += deltaXp;
                 todayHasXp = true;
              }
          }
        }
      });

      logs.forEach(log => {
        const date = parseDate(log.session_end);
        const dxp = parseInt(log.xp_gained || 0, 10);
        const m = memberStats[log.character_name?.toLowerCase()];
        if (date && date.getTime() >= lastSSTime && m && dxp > 0) {
          m.totalXpGained += dxp;
          m.level = log.end_level || m.level;
          if (!m.lastSeen || date > m.lastSeen) m.lastSeen = date;
          todayHasXp = true;
        }
      });

      // Se a party AINDA NÃO caçou no Server Save de hoje, puxa o rendimento da última hunt gravada!
      let activeLabel = 'Rendimento Individual (Hoje / SS)';
      if (!todayHasXp && chartDataArr.length > 0) {
        const lastHunt = chartDataArr[chartDataArr.length - 1];
        activeLabel = `Rendimento Individual (Última Hunt - ${lastHunt.day})`;
        validMembers.forEach(mName => {
          const mKey = mName.toLowerCase();
          const lastXp = lastHunt.memberXp[mKey] || 0;
          if (memberStats[mKey]) {
            memberStats[mKey].totalXpGained = lastXp;
          }
        });
      }
      setSessionLabel(activeLabel);

      const nowMs = Date.now();
      const processedMembers = Object.values(memberStats).map(m => {
        const raw = m.totalXpGained;
        const diff = m.lastSeen ? (nowMs - m.lastSeen.getTime()) : Infinity;
        const isRecentlyActive = diff >= 0 && diff < 20 * 60 * 1000;
        return { 
          ...m, 
          formattedXp: formatXp(raw), 
          isOnline: Boolean(m.isOnlineRoster) || isRecentlyActive
        };
      });

      processedMembers.sort((a, b) => b.totalXpGained - a.totalXpGained);
      setMembersData(processedMembers);

      // 6. Horário Real (Telemetria)
      if (chartDataArr.length > 0) {
        const lastHunt = chartDataArr[chartDataArr.length - 1];
        if (lastHunt.singlePing) {
          setActualHuntTime({ single: `${lastHunt.start} (${lastHunt.day})` });
        } else {
          setActualHuntTime({ start: lastHunt.start, end: lastHunt.end, day: lastHunt.day });
        }
      } else {
        setActualHuntTime(null);
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
  const isSlotActive = isSlotActiveNow(party.slot_start, party.slot_end);

  const nowBrt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const currentTotalMinutes = nowBrt.getHours() * 60 + nowBrt.getMinutes();
  const startMin = toMinutes(party.slot_start);
  let endMin = toMinutes(party.slot_end);
  if (endMin <= startMin) endMin += 1440;
  let currentMin = currentTotalMinutes;
  if (currentMin < startMin && endMin > 1440) currentMin += 1440;
  const isSlotPast = currentMin > endMin;

  const currentStatus = party.status || 'DEFAULT';

  let displayStatus = 'Aguardando Slot';
  let statusColorClass = 'text-gray-400';
  let StatusIcon = Clock;

  if (isSlotActive) {
    if (currentStatus === 'EFFICIENT') {
      displayStatus = 'Caçando Ativamente';
      statusColorClass = 'text-green-400';
      StatusIcon = TrendingUp;
    } else if (currentStatus === 'SUBOPTIMAL') {
      displayStatus = 'Ociosidade Parcial';
      statusColorClass = 'text-yellow-400';
      StatusIcon = Clock;
    } else if (currentStatus === 'FALTA_1') {
      displayStatus = 'Falta (1/3)';
      statusColorClass = 'text-orange-400';
      StatusIcon = AlertTriangle;
    } else if (currentStatus === 'FALTA_2') {
      displayStatus = 'Falta (2/3)';
      statusColorClass = 'text-orange-500';
      StatusIcon = AlertTriangle;
    } else if (currentStatus === 'GHOST_SLOT') {
      displayStatus = 'Slot Fantasma (Abandono)';
      statusColorClass = 'text-red-400';
      StatusIcon = AlertTriangle;
    } else {
      displayStatus = 'Slot em Andamento';
      statusColorClass = 'text-blue-400';
      StatusIcon = Clock;
    }
  } else if (isSlotPast) {
    if (currentStatus === 'GHOST_SLOT') {
      displayStatus = 'Slot Fantasma (Abandono)';
      statusColorClass = 'text-red-400';
      StatusIcon = AlertTriangle;
    } else if (currentStatus === 'FALTA_1') {
      displayStatus = 'Slot Concluído (1/3 Falta)';
      statusColorClass = 'text-orange-400';
      StatusIcon = AlertTriangle;
    } else if (currentStatus === 'FALTA_2') {
      displayStatus = 'Slot Concluído (2/3 Falta)';
      statusColorClass = 'text-orange-500';
      StatusIcon = AlertTriangle;
    } else {
      displayStatus = 'Slot Concluído';
      statusColorClass = 'text-blue-400';
      StatusIcon = CheckCircle;
    }
  } else {
    displayStatus = 'Aguardando Slot';
    statusColorClass = 'text-gray-400';
    StatusIcon = Clock;
  }

  const chartData = membersData.map(m => ({ name: m.name.split(' ')[0], xp: m.totalXpGained }));
  const formatXpAxis = (tick) => formatXp(tick);

  return (
    <div className="w-full max-w-7xl mx-auto p-8">
      <div className="mb-6">
        <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Dossiê da Party</h2>
        <p className="text-gray-400 font-sans">Verifique o rendimento coletivo e individual da hunt.</p>
      </div>
      
      <div className={`p-6 rounded-lg border-2 ${statusColors[currentStatus]?.split(' text-')[0] || 'border-tibia-border'} mb-8 relative overflow-hidden`}>
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
            <p className={`text-lg font-bold flex items-center ${statusColorClass}`}>
              <StatusIcon size={20} className="mr-2" />
              <span>{displayStatus}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold flex items-center">
                Horário Real (Telemetria)
            </p>
            <p className="text-lg font-bold text-white flex items-center">
               {actualHuntTime ? (
                   actualHuntTime.single ? (
                       <><Clock size={16} className="text-blue-400 mr-2" /> {actualHuntTime.single}</>
                   ) : (
                       <><Clock size={16} className="text-blue-400 mr-2" /> {actualHuntTime.start} - {actualHuntTime.end} <span className="text-xs text-gray-400 ml-2 font-normal">({actualHuntTime.day})</span></>
                   )
               ) : (
                   <span className="text-gray-500 text-sm italic">Não detectado</span>
               )}
            </p>
            <p className="text-[10px] text-gray-500 mt-1 leading-tight flex items-start">
               <Info size={10} className="mr-1 mt-[2px] flex-shrink-0" />
               <span>Aviso: Margem de erro de ~5 minutos devido ao intervalo do robô. 
               {actualHuntTime && actualHuntTime.single && " 'Pico Isolado' indica que a hunt durou menos de 10 minutos."}</span>
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
            <div className="p-4 bg-black/40 border-b border-tibia-border"><h3 className="font-bold text-white">{sessionLabel}</h3></div>
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
                    <td className="px-6 py-4">{m.isOnline ? <span className="text-green-400 flex items-center font-medium"><span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>Ativo</span> : <span className="text-gray-500 flex items-center"><span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span>Inativo</span>}</td>
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
            <p className="text-xs text-gray-500 mt-4 italic text-center">Membros inativos com XP zerada podem estar offline, em outro servidor ou ausentes na hunt.</p>
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
