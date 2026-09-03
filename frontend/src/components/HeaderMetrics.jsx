import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Activity, Crosshair } from 'lucide-react';

export default function HeaderMetrics({ parties = [] }) {
  const [metrics, setMetrics] = useState({ total_members: 0, active_members: 0 });

  useEffect(() => {
    const fetchMetrics = async () => {
      const { count: total_members } = await supabase.from('guild_members').select('*', { count: 'exact', head: true });
      const { count: active_members } = await supabase.from('guild_members').select('*', { count: 'exact', head: true }).eq('is_active_7d', true);
      setMetrics({ total_members: total_members || 0, active_members: active_members || 0 });
    };
    fetchMetrics();
  }, []);

  // Calcular slots atuais (baseado na hora atual)
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  const currentParties = parties.filter(p => p.slot_start <= currentHour && p.slot_end >= currentHour);
  const totalCurrentSlots = currentParties.length;
  // Para MVP sem a view complexa no frontend, consideramos Ghost Slot se status for explicitamente 'GHOST_SLOT'
  // ou apenas exibimos o total se não tiver telemetria embutida
  const idleSlots = currentParties.filter(p => p.status === 'GHOST_SLOT').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-tibia-card p-6 rounded-lg border border-tibia-border shadow-sm flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-semibold uppercase">Total da Guilda</p>
          <p className="text-3xl font-bold text-white mt-2">{metrics.total_members}</p>
        </div>
        <div className="bg-tibia-bg p-3 rounded-full">
          <Users className="text-tibia-primary" size={24} />
        </div>
      </div>
      
      <div className="bg-tibia-card p-6 rounded-lg border border-tibia-border shadow-sm flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-semibold uppercase">Membros Ativos (7d)</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{metrics.active_members}</p>
        </div>
        <div className="bg-tibia-bg p-3 rounded-full">
          <Activity className="text-green-400" size={24} />
        </div>
      </div>

      <div className="bg-tibia-card p-6 rounded-lg border border-tibia-border shadow-sm flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-semibold uppercase">Respawns Ociosos Agora</p>
          <p className="text-3xl font-bold text-red-500 mt-2">{idleSlots} <span className="text-sm font-normal text-gray-500">/ {totalCurrentSlots} slots ativos</span></p>
        </div>
        <div className="bg-tibia-bg p-3 rounded-full">
          <Crosshair className={idleSlots > 0 ? "text-red-500" : "text-gray-600"} size={24} />
        </div>
      </div>
    </div>
  );
}
