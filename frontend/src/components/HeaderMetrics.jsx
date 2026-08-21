import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Activity, Crosshair } from 'lucide-react';

export default function HeaderMetrics() {
  const [metrics, setMetrics] = useState({ total_members: 0, active_members: 0 });

  useEffect(() => {
    // Busca dados consolidados da View (Macro Censo)
    const fetchMetrics = async () => {
      const { data, error } = await supabase.from('view_macro_census').select('*').single();
      if (!error && data) {
        setMetrics(data);
      }
    };
    fetchMetrics();
    // Poderia configurar Realtime channel aqui se necessário
  }, []);

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
          {/* Placeholder para contador em tempo real */}
          <p className="text-3xl font-bold text-red-500 mt-2">2 <span className="text-sm font-normal text-gray-500">/ 5 slots</span></p>
        </div>
        <div className="bg-tibia-bg p-3 rounded-full">
          <Crosshair className="text-red-500" size={24} />
        </div>
      </div>
    </div>
  );
}
