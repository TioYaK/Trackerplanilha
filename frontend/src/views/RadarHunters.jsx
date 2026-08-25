import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Target, TrendingUp, Clock, AlertTriangle, Activity, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RadarHunters({ onPlayerClick }) {
  const [tab, setTab] = useState('realtime'); // 'realtime' or '24h'
  
  // 24h State
  const [hunters24h, setHunters24h] = useState([]);
  const [loading24h, setLoading24h] = useState(true);

  // Realtime State
  const [realtimeHunters, setRealtimeHunters] = useState([]);
  const [loadingRealtime, setLoadingRealtime] = useState(true);

  // Fetch 24h
  const fetchHunters24h = async () => {
    setLoading24h(true);
    const { data, error } = await supabase
      .from('view_recent_hunters')
      .select('*')
      .limit(100);
    if (data && !error) setHunters24h(data);
    setLoading24h(false);
  };

  // Fetch Realtime
  const fetchRealtime = async () => {
    setLoadingRealtime(true);
    try {
      const { data: guildMembers } = await supabase.from('guild_members').select('name, vocation, level');
      if (!guildMembers || guildMembers.length === 0) return;

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      let logs = [];
      let page = 0;
      const membersList = guildMembers.map(m => m.name);
      
      while(true) {
        const { data } = await supabase
          .from('telemetry_logs')
          .select('character_name, delta_xp, recorded_at, level')
          .in('character_name', membersList)
          .gte('recorded_at', twoHoursAgo)
          .order('recorded_at', { ascending: true })
          .range(page * 1000, (page + 1) * 1000 - 1);
          
        if (!data || data.length === 0) break;
        logs.push(...data);
        if (data.length < 1000) break;
        page++;
      }

      const now = Date.now();
      const thirtyMinsAgo = now - 30 * 60 * 1000;
      const oneHourAgo = now - 60 * 60 * 1000;

      const memberStats = {};
      guildMembers.forEach(m => {
        memberStats[m.name] = { ...m, xpLastHour: 0, isHunting: false, huntStart: null };
      });

      logs.forEach(log => {
        const dxp = parseInt(log.delta_xp || 0, 10);
        if (dxp > 0 && memberStats[log.character_name]) {
           const m = memberStats[log.character_name];
           const logDate = new Date(log.recorded_at).getTime();
           
           if (logDate >= oneHourAgo) m.xpLastHour += dxp;
           if (logDate >= thirtyMinsAgo) m.isHunting = true;
           if (!m.huntStart || logDate < m.huntStart) m.huntStart = logDate;
        }
      });

      const activeHunters = Object.values(memberStats)
         .filter(m => m.isHunting)
         .sort((a, b) => b.xpLastHour - a.xpLastHour);

      setRealtimeHunters(activeHunters);
    } catch (err) {
      console.error(err);
    }
    setLoadingRealtime(false);
  };

  useEffect(() => {
    fetchHunters24h();
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatXP = (xp) => {
    if (xp >= 1000000) return (xp / 1000000).toFixed(1) + 'M';
    if (xp >= 1000) return (xp / 1000).toFixed(1) + 'k';
    return xp;
  };

  const getVocationColor = (voc) => {
    if (!voc) return 'text-gray-400';
    const v = voc.toLowerCase();
    if (v.includes('knight')) return 'text-blue-400';
    if (v.includes('paladin')) return 'text-yellow-400';
    if (v.includes('druid')) return 'text-green-400';
    if (v.includes('sorcerer')) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-5xl font-medieval text-gradient-gold mb-2 flex items-center">
             <Target className="mr-3 text-tibia-highlight" size={40} />
             Radar da Guilda
          </h2>
          <p className="text-gray-400 font-sans">Acompanhe quem está ativo e upando no servidor.</p>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <button 
          onClick={() => setTab('realtime')}
          className={`px-6 py-2 rounded font-bold transition-colors ${tab === 'realtime' ? 'bg-tibia-primary text-black' : 'bg-black/50 text-gray-400 hover:text-white border border-tibia-border'}`}
        >
          <Activity size={16} className="inline mr-2" />
          Caçando Agora
        </button>
        <button 
          onClick={() => setTab('24h')}
          className={`px-6 py-2 rounded font-bold transition-colors ${tab === '24h' ? 'bg-tibia-primary text-black' : 'bg-black/50 text-gray-400 hover:text-white border border-tibia-border'}`}
        >
          <TrendingUp size={16} className="inline mr-2" />
          Top 24 Horas
        </button>
      </div>

      {tab === 'realtime' && (
        <div className="animate-fade-in">
            {loadingRealtime ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div>
                </div>
            ) : realtimeHunters.length === 0 ? (
                <div className="bg-tibia-card border border-tibia-border rounded-lg p-10 flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle size={48} className="mb-4 opacity-50" />
                    <p className="text-xl font-bold">Nenhum membro da guilda caçando no momento.</p>
                    <p className="text-sm mt-2">O radar detecta ganhos de XP automaticamente a cada 5 minutos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {realtimeHunters.map((h, i) => {
                    const durationMins = h.huntStart ? Math.floor((Date.now() - h.huntStart) / 60000) : 0;
                    return (
                    <div key={i} onClick={() => onPlayerClick && onPlayerClick(h.name)} className="cursor-pointer bg-tibia-card border border-tibia-border rounded-lg p-5 shadow-lg relative overflow-hidden group hover:border-tibia-primary transition-colors">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity size={80} />
                        </div>
                        
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white truncate max-w-[200px]" title={h.name}>{h.name}</h3>
                                <p className={`text-sm font-semibold ${getVocationColor(h.vocation)}`}>{h.vocation || 'Unknown'} - Lvl {h.level}</p>
                            </div>
                            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-500/30 flex items-center animate-pulse">
                                Ativo
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">XP/h Atual</p>
                                <p className="text-lg font-bold text-tibia-highlight">+{formatXP(h.xpLastHour)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Duração</p>
                                <p className="text-lg font-bold text-gray-300 flex items-center">
                                    <Clock size={16} className="mr-1" />
                                    {durationMins > 0 ? `${durationMins}m` : 'Agora'}
                                </p>
                            </div>
                        </div>
                    </div>
                    )
                })}
                </div>
            )}
        </div>
      )}

      {tab === '24h' && (
        <div className="animate-fade-in bg-tibia-card border border-tibia-border rounded-lg overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-black/40 text-gray-400 uppercase font-semibold sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Jogador</th>
                    <th className="px-6 py-4">Level</th>
                    <th className="px-6 py-4 text-green-400">XP Ganhos (24h)</th>
                    <th className="px-6 py-4">Última Caçada</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-tibia-border/50">
                {loading24h ? (
                    <tr>
                    <td colSpan="4" className="text-center py-12">
                        <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tibia-primary"></div>
                        </div>
                    </td>
                    </tr>
                ) : hunters24h.length === 0 ? (
                    <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-500">
                        <AlertTriangle className="mx-auto mb-2 opacity-50" size={32} />
                        Nenhum ganho de XP registrado na guilda nas últimas 24 horas.
                    </td>
                    </tr>
                ) : (
                    hunters24h.map(h => (
                    <tr key={h.character_name} className="hover:bg-white/5 transition-colors">
                        <td 
                        className="px-6 py-4 font-medium text-white cursor-pointer hover:text-tibia-primary hover:underline"
                        onClick={() => onPlayerClick && onPlayerClick(h.character_name)}
                        >
                        {h.character_name}
                        </td>
                        <td className="px-6 py-4">
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">Lvl {h.level}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-green-400">
                        +{formatXP(h.xp_gained)}
                        </td>
                        <td className="px-6 py-4 text-gray-400 flex items-center">
                        <Clock size={14} className="mr-2 opacity-50" />
                        {formatDistanceToNow(new Date(h.last_hunt), { addSuffix: true, locale: ptBR })}
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </div>
      )}
    </div>
  );
}
