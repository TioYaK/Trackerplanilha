import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Activity, Users, Clock, AlertCircle } from 'lucide-react';

export default function GuildRadar() {
  const [hunters, setHunters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRadar = async () => {
      setLoading(true);
      try {
        // 1. Pega todos os membros da guilda
        const { data: guildMembers } = await supabase.from('guild_members').select('name, vocation, level');
        if (!guildMembers || guildMembers.length === 0) return;

        // 2. Pega telemetria das últimas 2 horas
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
          memberStats[m.name] = { 
              ...m, 
              xpLastHour: 0, 
              isHunting: false, 
              lastSeen: null,
              huntStart: null 
          };
        });

        logs.forEach(log => {
          const dxp = parseInt(log.delta_xp || 0, 10);
          if (dxp > 0 && memberStats[log.character_name]) {
             const m = memberStats[log.character_name];
             const logDate = new Date(log.recorded_at).getTime();
             
             if (logDate >= oneHourAgo) {
                 m.xpLastHour += dxp;
             }
             if (logDate >= thirtyMinsAgo) {
                 m.isHunting = true;
             }
             
             m.lastSeen = logDate;
             if (!m.huntStart || logDate < m.huntStart) m.huntStart = logDate;
          }
        });

        const activeHunters = Object.values(memberStats)
           .filter(m => m.isHunting)
           .sort((a, b) => b.xpLastHour - a.xpLastHour);

        setHunters(activeHunters);
      } catch (err) {
        console.error('Erro ao buscar radar:', err);
      }
      setLoading(false);
    };

    fetchRadar();
    const interval = setInterval(fetchRadar, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatXp = (raw) => {
    if (raw >= 1000000) return (raw / 1000000).toFixed(1) + 'M';
    if (raw >= 1000) return (raw / 1000).toFixed(1) + 'k';
    return raw;
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
    <div className="w-full max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md flex items-center">
          <Target className="mr-3" size={32} />
          Radar da Guilda
        </h2>
        <p className="text-gray-400 font-sans">
          Monitoramento em tempo real de membros que estão ganhando XP (ativos nos últimos 30 minutos).
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div>
        </div>
      ) : hunters.length === 0 ? (
        <div className="bg-tibia-card border border-tibia-border rounded-lg p-10 flex flex-col items-center justify-center text-gray-500">
           <AlertCircle size={48} className="mb-4 opacity-50" />
           <p className="text-xl font-bold">Nenhum membro caçando no momento.</p>
           <p className="text-sm mt-2">O radar detecta ganhos de XP automaticamente a cada 5 minutos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hunters.map((h, i) => {
             const durationMins = h.huntStart ? Math.floor((Date.now() - h.huntStart) / 60000) : 0;
             return (
               <div key={i} className="bg-tibia-card border border-tibia-border rounded-lg p-5 shadow-lg relative overflow-hidden group hover:border-tibia-primary transition-colors">
                 <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={80} />
                 </div>
                 
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <h3 className="text-xl font-bold text-white truncate max-w-[200px]" title={h.name}>{h.name}</h3>
                       <p className={	ext-sm font-semibold }>{h.vocation || 'Unknown'} - Lvl {h.level}</p>
                    </div>
                    <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-500/30 flex items-center animate-pulse">
                       Ativo
                    </span>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                       <p className="text-xs text-gray-500 uppercase font-bold">XP/h Atual</p>
                       <p className="text-lg font-bold text-tibia-highlight">+{formatXp(h.xpLastHour)}</p>
                    </div>
                    <div>
                       <p className="text-xs text-gray-500 uppercase font-bold">Duração</p>
                       <p className="text-lg font-bold text-gray-300 flex items-center">
                          <Clock size={16} className="mr-1" />
                          {durationMins > 0 ? ${durationMins}m : 'Agora'}
                       </p>
                    </div>
                 </div>
               </div>
             )
          })}
        </div>
      )}
    </div>
  );
}
