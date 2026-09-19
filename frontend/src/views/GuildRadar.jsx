import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Activity, Users, Clock, AlertCircle } from 'lucide-react';
import { parseUtcDate, formatVocation } from '../lib/tibiaUtils';

// Cache em memória para GuildRadar (TTL 45s)
let radarCache = null;
let lastRadarFetch = 0;

export default function GuildRadar() {
  const [hunters, setHunters] = useState(() => radarCache || []);
  const [loading, setLoading] = useState(() => !radarCache);

  useEffect(() => {
    const fetchRadar = async () => {
      const nowMs = Date.now();
      if (radarCache && (nowMs - lastRadarFetch < 45000)) {
        setHunters(radarCache);
        setLoading(false);
        return;
      }

      setLoading(!radarCache);
      try {
        // 1. Pega membros da guilda com colunas necessárias
        const { data: guildMembers } = await supabase.from('guild_members').select('name, vocation, level');
        if (!guildMembers || guildMembers.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Pega telemetria das últimas 2 horas
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        
        const memberStats = {};
        guildMembers.forEach(m => {
          if (!m || !m.name) return;
          memberStats[m.name.toLowerCase()] = { 
              ...m, 
              vocation: formatVocation(m.vocation),
              xpLastHour: 0, 
              isHunting: false, 
              lastSeen: null,
              huntStart: null 
          };
        });

        const membersList = guildMembers.map(m => m.name).filter(Boolean);
        
        // Em vez de puxar a tabela inteira com select('*'), divide os membros em lotes e busca com .in()
        const chunks = [];
        for (let i = 0; i < membersList.length; i += 100) {
          chunks.push(membersList.slice(i, i + 100));
        }

        const stateResults = await Promise.all(
          chunks.map(chunk =>
            supabase
              .from('current_character_state')
              .select('character_name, xp_total, session_start_xp, last_active, session_start_time, level')
              .in('character_name', chunk)
              .gte('last_active', twoHoursAgo)
          )
        );
        const states = stateResults.flatMap(r => r.data || []);
        const now = Date.now();
        const thirtyMinsAgo = now - 30 * 60 * 1000;

        if (states) {
          states.forEach(state => {
            if (!state || !state.character_name) return;
            const m = memberStats[state.character_name.toLowerCase()];
            if (m) {
              const deltaXp = Number(state.xp_total || 0) - Number(state.session_start_xp || state.xp_total || 0);
              const activeDate = parseUtcDate(state.last_active);
              const lastActiveTime = activeDate ? activeDate.getTime() : 0;
              
              if (deltaXp > 0 && lastActiveTime >= thirtyMinsAgo && lastActiveTime <= now + 60000) {
                m.isHunting = true;
                m.xpLastHour = deltaXp;
                const startDate = parseUtcDate(state.session_start_time);
                m.huntStart = startDate ? startDate.getTime() : lastActiveTime;
                m.lastSeen = lastActiveTime;
              }
              m.level = state.level || m.level;
            }
          });
        }

        const activeHunters = Object.values(memberStats)
           .filter(m => m.isHunting)
           .sort((a, b) => b.xpLastHour - a.xpLastHour);

        radarCache = activeHunters;
        lastRadarFetch = Date.now();
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
    const val = Number(raw) || 0;
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toLocaleString();
  };

  const getVocationColor = (voc) => {
    if (!voc) return 'text-gray-400';
    const v = String(voc).toLowerCase();
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
          Monitoramento em tempo real de membros que est�o ganhando XP (ativos nos �ltimos 30 minutos).
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div>
        </div>
      ) : hunters.length === 0 ? (
        <div className="bg-tibia-card border border-tibia-border rounded-lg p-10 flex flex-col items-center justify-center text-gray-500">
           <AlertCircle size={48} className="mb-4 opacity-50" />
           <p className="text-xl font-bold">Nenhum membro ca�ando no momento.</p>
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
                        <p className="text-sm font-semibold text-gray-400">{h.vocation || 'Unknown'} - Lvl {h.level}</p>
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
  );
}
