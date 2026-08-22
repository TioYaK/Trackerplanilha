import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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

  const fetchData = async () => {
    if (!playerName) return;
    setLoading(true);

    // Fetch Player Level from guild_members
    const { data: memberData } = await supabase
      .from('guild_members')
      .select('level')
      .eq('name', playerName)
      .single();

    // Fetch 7-day bounds for Prediction
    const { data: boundsData } = await supabase
      .from('telemetry_logs')
      .select('recorded_at, xp_total')
      .eq('character_name', playerName)
      .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: true });

    if (memberData && boundsData && boundsData.length > 0) {
      const oldest = boundsData[0];
      const newest = boundsData[boundsData.length - 1];
      const currentXP = newest.xp_total;
      const xpGained7d = currentXP - oldest.xp_total;
      
      const msPassed = new Date(newest.recorded_at) - new Date(oldest.recorded_at);
      const daysPassed = Math.max(1, msPassed / (1000 * 60 * 60 * 24)); // avoid div by 0
      
      const avgXpPerDay = Math.floor(xpGained7d / daysPassed);
      
      const currentLevel = memberData.level;
      let nextMilestone = Math.ceil((currentLevel + 1) / 100) * 100;
      if (nextMilestone === currentLevel) nextMilestone += 100; // prevent predicting current level if exactly on a multiple of 100
      
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
      
      {/* Cards de Topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <li key={s.name} className="flex justify-between text-gray-300">
                    <span className="truncate pr-2">{s.name}</span>
                    <span className="text-blue-400 font-bold">{s.count} pts</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">Caça solo ou não planilhou recentemente.</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isAdmin ? (
          <div className="bg-tibia-card p-4 rounded-lg border border-tibia-border flex justify-center items-center">
            <button 
              onClick={() => setShowStrikeModal(true)}
              className="w-full h-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center justify-center transition-colors shadow-tibia-glow"
            >
              <AlertOctagon className="mr-2" size={20} />
              Aplicar Strike
            </button>
          </div>
        ) : (
          <div className="bg-tibia-card p-4 rounded-lg border border-tibia-border flex justify-center items-center text-gray-600 text-sm">
            Somente Admins podem aplicar punições.
          </div>
        )}
      </div>

      {/* Máquina do Tempo (Previsão) */}
      {prediction && (
        <div className="bg-tibia-card p-4 rounded-lg border border-purple-900/50 flex flex-col md:flex-row items-center justify-between shadow-xl">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-purple-900/30 p-3 rounded-full mr-4 border border-purple-500/50">
              <Clock className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-bold mb-1">A Máquina do Tempo (Previsão de Level)</p>
              <p className="text-xs text-gray-500">
                Baseado na média de <span className="text-purple-400 font-bold">{(prediction.avgXpPerDay / 1000000).toFixed(1)}M XP/dia</span> (últimos 7 dias)
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
