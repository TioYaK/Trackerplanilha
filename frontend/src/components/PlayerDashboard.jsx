import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import { Gavel, AlertOctagon, Ghost, Activity, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PlayerDashboard({ playerName, isAdmin }) {
  const [telemetry, setTelemetry] = useState([]);
  const [strikes, setStrikes] = useState([]);
  const [stats, setStats] = useState({ ghostSlots: 0, totalHours: 0 });
  const [loading, setLoading] = useState(true);
  const [showStrikeModal, setShowStrikeModal] = useState(false);
  const [strikeForm, setStrikeForm] = useState({ reason: '', days: 3 });
  const [frequentSquad, setFrequentSquad] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [routine, setRoutine] = useState([]);

  const fetchData = async () => {
    if (!playerName) return;
    setLoading(true);

    // Fetch Player Level from guild_members
    const { data: memberData } = await supabase
      .from('guild_members')
      .select('level, vocation, is_online')
      .eq('name', playerName)
      .single();
      
    if (memberData) setPlayerInfo(memberData);

    // Fetch 14-day bounds for Prediction and Heatmap
    const { data: boundsData } = await supabase
      .from('telemetry_logs')
      .select('recorded_at, xp_total')
      .eq('character_name', playerName)
      .gte('recorded_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: true });

    if (memberData && boundsData && boundsData.length > 0) {
      // Heatmap Logic (14 days)
      const dailyMap = {};
      boundsData.forEach(log => {
         const day = log.recorded_at.split('T')[0];
         if (!dailyMap[day]) {
            dailyMap[day] = { min: log.xp_total, max: log.xp_total };
         } else {
            if (log.xp_total < dailyMap[day].min) dailyMap[day].min = log.xp_total;
            if (log.xp_total > dailyMap[day].max) dailyMap[day].max = log.xp_total;
         }
      });
      
      const hData = [];
      for (let i = 13; i >= 0; i--) {
         const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
         const dayStr = d.toISOString().split('T')[0];
         let xpMade = 0;
         if (dailyMap[dayStr]) {
            xpMade = dailyMap[dayStr].max - dailyMap[dayStr].min;
         }
         hData.push({ date: dayStr, xp: xpMade });
      }
      setHeatmap(hData);

      // Prediction Logic (using bounds, which is now 14 days)
      const oldest = boundsData[0];
      const newest = boundsData[boundsData.length - 1];
      const currentXP = newest.xp_total;
      const xpGained14d = currentXP - oldest.xp_total;
      
      const msPassed = new Date(newest.recorded_at) - new Date(oldest.recorded_at);
      const daysPassed = Math.max(1, msPassed / (1000 * 60 * 60 * 24)); // avoid div by 0
      
      const avgXpPerDay = Math.floor(xpGained14d / daysPassed);
      
      const currentLevel = memberData.level;
      let nextMilestone = Math.ceil((currentLevel + 1) / 100) * 100;
      if (nextMilestone === currentLevel) nextMilestone += 100;
      
      const getTibiaXPForLevel = (l) => Math.floor((50 / 3) * (Math.pow(l, 3) - 6 * Math.pow(l, 2) + 17 * l - 12));
      
      const xpRequiredForNext = getTibiaXPForLevel(currentLevel + 1) - currentXP;
      const xpRequiredForMilestone = getTibiaXPForLevel(nextMilestone) - currentXP;
      
      let daysToNext = avgXpPerDay > 0 ? (xpRequiredForNext / avgXpPerDay) : null;
      let daysToMilestone = avgXpPerDay > 0 ? (xpRequiredForMilestone / avgXpPerDay) : null;
      
      setPrediction({
        currentLevel,
        nextMilestone,
        avgXpPerDay,
        daysToNext,
        daysToMilestone
      });
    }

    // Fetch telemetry from last 24h
    const { data: teleData } = await supabase
      .from('telemetry_logs')
      .select('*')
      .eq('character_name', playerName)
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: true });

    if (teleData) {
      let accumulatedXP = 0;
      const chartData = teleData.map(log => {
        accumulatedXP += parseInt(log.delta_xp || 0, 10);
        return {
          time: format(new Date(log.recorded_at), 'HH:mm'),
          xp: accumulatedXP,
          rawDelta: log.delta_xp
        };
      });
      setTelemetry(chartData);
    }

    // Fetch strikes
    const { data: strikesData } = await supabase
      .from('player_strikes')
      .select('*')
      .eq('character_name', playerName)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (strikesData) setStrikes(strikesData);

    // Fetch frequent squad (Panelinhas)
    const { data: squadData } = await supabase
      .from('parties_planilhadas')
      .select('members')
      .contains('members', JSON.stringify([playerName]));

      if (squadData) {
        const mates = {};
        squadData.forEach(p => {
          if (!p.members) return;
          p.members.forEach(m => {
            if (m !== playerName) {
              mates[m] = (mates[m] || 0) + 1;
            }
          });
        });
        const rankedMates = Object.entries(mates)
          .sort((a,b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count }))
          .slice(0, 3);
        setFrequentSquad(rankedMates);
      }

      // Fetch 7-day routine data
      let allLogs = [];
      let page = 0;
      while(true) {
        const { data: logs } = await supabase
          .from('telemetry_logs')
          .select('recorded_at, delta_xp')
          .eq('character_name', playerName)
          .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .range(page * 1000, (page + 1) * 1000 - 1);
          
        if (!logs || logs.length === 0) break;
        allLogs.push(...logs);
        if (logs.length < 1000) break;
        page++;
      }

      if (allLogs.length > 0) {
        const hourMap = new Array(24).fill(0);
        allLogs.forEach(l => {
          if (!l.delta_xp || l.delta_xp === '0') return;
          // Clean string like "10.5M" or "500K" if it happens to be formatted, otherwise parse int
          let xp = 0;
          if (typeof l.delta_xp === 'string') {
            if (l.delta_xp.includes('M')) xp = parseFloat(l.delta_xp) * 1000000;
            else if (l.delta_xp.includes('K')) xp = parseFloat(l.delta_xp) * 1000;
            else xp = parseInt(l.delta_xp, 10);
          } else {
            xp = l.delta_xp;
          }
          if (isNaN(xp)) xp = 0;
          
          const d = new Date(l.recorded_at);
          hourMap[d.getHours()] += xp;
        });

        const routineData = hourMap.map((xp, index) => ({
          hour: `${index.toString().padStart(2, '0')}:00`,
          xp: xp
        }));
        setRoutine(routineData);
      }

      setLoading(false);
    };

  useEffect(() => {
    fetchData();
  }, [playerName]);

  const handleApplyStrike = async (e) => {
    e.preventDefault();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(strikeForm.days, 10));

    const { error } = await supabase.from('player_strikes').insert([{
      character_name: playerName,
      reason: strikeForm.reason,
      duration_days: parseInt(strikeForm.days, 10),
      expires_at: expiresAt.toISOString()
    }]);

    if (!error) {
      setShowStrikeModal(false);
      setStrikeForm({ reason: '', days: 3 });
      fetchData();
    } else {
      alert("Erro ao aplicar strike: " + error.message);
    }
  };

  if (!playerName) return <div className="text-gray-400">Selecione um jogador no Roster da Guilda.</div>;

  return (
    <div className="space-y-6">
      
      {/* Player Header */}
      <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl flex flex-col md:flex-row justify-between items-center animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Activity size={100} />
        </div>
        
        <div className="flex items-center mb-4 md:mb-0 z-10">
          <div className="mr-6">
            <h3 className="text-3xl font-black text-white">{playerName}</h3>
            {playerInfo && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="bg-blue-900/50 text-blue-400 px-3 py-1 rounded text-sm font-bold border border-blue-500/30">
                  Lvl {playerInfo.level}
                </span>
                <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-sm border border-gray-600 font-medium">
                  {playerInfo.vocation}
                </span>
                {playerInfo.is_online ? (
                  <span className="flex items-center text-green-400 font-bold text-sm bg-green-900/20 px-3 py-1 rounded border border-green-500/30">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Online
                  </span>
                ) : (
                  <span className="flex items-center text-gray-500 font-medium text-sm bg-gray-900/50 px-3 py-1 rounded border border-gray-700">
                    <span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span> Offline
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Button */}
        <div className="z-10 w-full md:w-auto">
          {isAdmin ? (
            <button 
              onClick={() => setShowStrikeModal(true)}
              className="w-full md:w-auto py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center justify-center transition-colors shadow-tibia-glow"
            >
              <AlertOctagon className="mr-2" size={20} />
              Aplicar Strike
            </button>
          ) : (
            <div className="bg-black/50 px-4 py-2 rounded text-gray-500 text-sm border border-white/5">
              Somente Admins punem.
            </div>
          )}
        </div>
      </div>

      {/* Cards de Topo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strikes Card */}
        <div className="bg-tibia-card p-4 rounded-lg border border-red-900/50 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Strikes Ativos</p>
            <p className="text-3xl font-bold text-red-500">{strikes.length}</p>
          </div>
          <Gavel className="text-red-500 opacity-50" size={32} />
        </div>

        {/* Panelinhas Card */}
        <div className="bg-tibia-card p-4 rounded-lg border border-blue-900/50 flex items-center justify-between col-span-1">
          <div className="w-full">
            <p className="text-sm text-gray-400 mb-2 font-bold">Squad Frequente ("Panelinha")</p>
            {frequentSquad.length > 0 ? (
              <ul className="text-xs space-y-1">
                {frequentSquad.map(s => (
                  <li key={s.name} className="flex justify-between border-b border-white/5 pb-1 last:border-0 last:pb-0">
                    <span className="text-gray-300">{s.name}</span>
                    <span className="text-blue-400 font-bold">{s.count} hunts</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">Lobo solitário (Nenhuma party frequente)</p>
            )}
          </div>
        </div>
      </div>

      {/* Máquina do Tempo (Previsão) */}
      {prediction && (
        <div className="bg-tibia-card p-4 rounded-lg border border-purple-900/50 flex flex-col md:flex-row items-center justify-between shadow-xl mt-8">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-purple-900/30 p-3 rounded-full mr-4 border border-purple-500/50">
              <Clock className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-bold mb-1">A Máquina do Tempo (Previsão de Level)</p>
              <p className="text-xs text-gray-500">
                Baseado na média de <span className="text-purple-400 font-bold">{(prediction.avgXpPerDay / 1000000).toFixed(1)}M XP/dia</span> (últimos 14 dias)
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center bg-black/40 px-4 py-2 rounded border border-white/5 min-w-[120px]">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Level {prediction.currentLevel + 1}</p>
              <p className="text-lg font-bold text-white">
                {prediction.daysToNext !== null ? (
                  prediction.daysToNext < 1 ? 'Em horas!' : `~${Math.ceil(prediction.daysToNext)} dias`
                ) : 'Hibernando'}
              </p>
            </div>
            <div className="text-center bg-purple-900/10 px-4 py-2 rounded border border-purple-900/30 min-w-[120px]">
              <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Milestone {prediction.nextMilestone}</p>
              <p className="text-lg font-bold text-purple-300">
                {prediction.daysToMilestone !== null ? `~${Math.ceil(prediction.daysToMilestone)} dias` : 'Estagnado'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendário do Vício (Heatmap) */}
      {heatmap.length > 0 && (
        <div className="bg-tibia-card p-6 rounded-lg border border-green-900/50 shadow-xl mt-8">
          <h3 className="text-xl font-bold text-green-400 mb-2 flex items-center">
            <Activity className="mr-2" size={24} />
            Calendário do Vício (Últimos 14 dias)
          </h3>
          <p className="text-xs text-gray-400 mb-6">Dias com maior intensidade de caça ganham cores mais vivas.</p>
          
          <div className="flex flex-wrap gap-2">
            {heatmap.map((day, i) => {
              const d = new Date(day.date);
              const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
              const dayName = days[d.getDay() + 1 > 6 ? 0 : d.getDay() + 1]; // timezone compensation
              
              let bgColor = 'bg-gray-800 border-gray-700';
              if (day.xp > 100000000) bgColor = 'bg-green-400 border-green-300 shadow-[0_0_10px_rgba(74,222,128,0.5)]'; // > 100M
              else if (day.xp > 50000000) bgColor = 'bg-green-600 border-green-500'; // > 50M
              else if (day.xp > 10000000) bgColor = 'bg-green-800 border-green-700'; // > 10M
              else if (day.xp > 0) bgColor = 'bg-green-900 border-green-800'; // > 0
              
              return (
                <div key={day.date} className="flex flex-col items-center group relative cursor-help">
                  <div className={`w-8 h-8 rounded border ${bgColor} transition-transform transform hover:scale-110 mb-1`}></div>
                  <span className="text-[10px] text-gray-500">{dayName}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                    {day.date}: {day.xp > 0 ? `+${(day.xp / 1000000).toFixed(1)}M XP` : '0 XP'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Radar de Rotina (Horários Ativos) */}
      {routine.length > 0 && routine.some(r => r.xp > 0) && (
        <div className="bg-tibia-card p-6 rounded-lg border border-blue-900/50 shadow-xl mt-8">
          <h3 className="text-xl font-bold text-blue-400 mb-2 flex items-center">
            <Clock className="mr-2" size={24} />
            Radar de Rotina (Horário Ativo)
          </h3>
          <p className="text-xs text-gray-400 mb-6">Distribuição da XP gerada por horário do dia (Últimos 7 dias).</p>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routine} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="hour" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px' }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value) => [`${(value / 1000000).toFixed(1)}M XP`, 'Gerado']}
                  labelStyle={{ color: '#aaa', marginBottom: '4px' }}
                />
                <Bar dataKey="xp" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela de Strikes */}
      {strikes.length > 0 && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
            <Gavel className="mr-2" /> Histórico Criminal (Strikes Ativos)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-gray-400 border-b border-red-900/50">
                <tr>
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Motivo</th>
                  <th className="pb-2">Duração</th>
                  <th className="pb-2 text-right">Expira em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/30">
                {strikes.map(s => (
                  <tr key={s.id}>
                    <td className="py-3">{format(new Date(s.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="py-3 text-white">{s.reason}</td>
                    <td className="py-3">{s.duration_days} dias</td>
                    <td className="py-3 text-right text-red-300">
                      {formatDistanceToNow(new Date(s.expires_at), { addSuffix: true, locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráfico de XP */}
      <div className="bg-tibia-card p-6 rounded-lg border border-tibia-border">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Activity className="mr-2 text-tibia-primary" /> Sessões de Caça (Últimas 24h)
        </h3>
        {loading ? (
          <div className="h-64 flex justify-center items-center text-gray-500">Carregando telemetria...</div>
        ) : telemetry.length === 0 ? (
          <div className="h-64 flex justify-center items-center text-gray-500">Sem atividade registrada nas últimas 24h.</div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => val >= 1000000 ? (val/1000000).toFixed(1)+'M' : val} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value) => [value >= 1000000 ? (value/1000000).toFixed(2)+'M' : value, 'XP Acumulada']}
                />
                <Legend />
                <Line type="monotone" dataKey="xp" name="Curva de XP" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Modal de Strike */}
      {showStrikeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-tibia-card border border-red-900 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-red-500 mb-4 flex items-center">
              <Gavel className="mr-2" /> Aplicar Strike
            </h3>
            <p className="text-gray-300 mb-6">Jogador alvo: <strong className="text-white">{playerName}</strong></p>
            
            <form onSubmit={handleApplyStrike}>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Motivo (Visível para o infrator)</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-tibia-bg border border-gray-600 rounded p-2 text-white" 
                  placeholder="Ex: Faltou no respawn e não avisou"
                  value={strikeForm.reason}
                  onChange={e => setStrikeForm({...strikeForm, reason: e.target.value})}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-1">Duração da Punição</label>
                <select 
                  className="w-full bg-tibia-bg border border-gray-600 rounded p-2 text-white"
                  value={strikeForm.days}
                  onChange={e => setStrikeForm({...strikeForm, days: e.target.value})}
                >
                  <option value={3}>3 Dias (Aviso Leve)</option>
                  <option value={7}>7 Dias (Suspensão)</option>
                  <option value={15}>15 Dias (Grave)</option>
                  <option value={30}>30 Dias (Severo)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowStrikeModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-tibia-glow transition"
                >
                  Confirmar Strike
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
