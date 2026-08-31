import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Skull, Plane, ShieldAlert, Activity, RefreshCw } from 'lucide-react';

export default function ExtremeAnalytics() {
  const [deaths, setDeaths] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch deaths
      const { data: deathsData } = await supabase
        .from('recent_deaths')
        .select('*')
        .order('death_time', { ascending: false })
        .limit(50);
      
      if (deathsData) setDeaths(deathsData);

      // Fetch transfers
      const { data: transfersData } = await supabase
        .from('server_transfers')
        .select('*')
        .order('transfer_date', { ascending: false })
        .limit(50);

      if (transfersData) setTransfers(transfersData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto bg-black text-gray-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center tracking-tight">
            <Activity className="mr-3 text-purple-500" size={32} />
            Radar de Eventos Global
          </h1>
          <p className="text-gray-400 mt-1">
            Monitoramento de Mortes e Transferências em Tempo Real (Raspado pela Frota).
          </p>
        </div>
        <button 
          onClick={fetchData}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors font-bold"
        >
          <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={18} />
          Atualizar Dados
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL: RECENT DEATHS */}
        <div className="bg-black/40 border border-red-900/50 rounded-lg p-6 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center">
            <Skull className="mr-2" size={24} />
            Mortes Registradas (Guilda & Hunteds)
          </h3>
          
          <div className="overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {deaths.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-10">
                Nenhuma morte registrada recentemente.
              </div>
            )}
            
            <div className="space-y-3">
              {deaths.map(d => (
                <div key={d.id} className="bg-red-950/20 p-4 rounded-lg border border-red-900/30">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-white font-bold text-lg flex items-center">
                      {d.character_name}
                      {d.is_guild_member && <span className="ml-2 bg-blue-600/80 text-white text-[10px] uppercase px-2 py-0.5 rounded">Aliado</span>}
                      {d.is_hunted && <span className="ml-2 bg-red-600/80 text-white text-[10px] uppercase px-2 py-0.5 rounded">Hunted</span>}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(d.death_time).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="text-red-400 font-semibold">Level {d.level}</span> — Morto por: <span className="text-white">{d.killed_by}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL: SERVER TRANSFERS */}
        <div className="bg-black/40 border border-teal-900/50 rounded-lg p-6 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
          <h3 className="text-xl font-bold text-teal-500 mb-4 flex items-center">
            <Plane className="mr-2" size={24} />
            Imigração (Transfers IN/OUT)
          </h3>
          
          <div className="overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {transfers.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-10">
                Nenhuma transferência registrada recentemente.
              </div>
            )}
            
            <div className="space-y-3">
              {transfers.map(t => {
                const isIncoming = t.transfer_type === 'IN';
                const borderColor = isIncoming ? 'border-teal-900/40' : 'border-orange-900/40';
                const bgColor = isIncoming ? 'bg-teal-950/20' : 'bg-orange-950/20';
                const iconColor = isIncoming ? 'text-teal-400' : 'text-orange-400';
                
                return (
                  <div key={t.id} className={`${bgColor} p-4 rounded-lg border ${borderColor} flex items-center justify-between`}>
                    <div>
                      <div className="text-white font-bold flex items-center gap-2">
                        {t.character_name}
                        {t.level > 0 && <span className="text-gray-400 text-sm font-normal">Level {t.level}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                        {new Date(t.transfer_date).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-bold flex items-center ${iconColor}`}>
                        {isIncoming ? `Veio de ${t.other_world || 'Unknown'}` : `Fugiu para ${t.other_world || 'Unknown'}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
