import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Skull, Plane, ShieldAlert, Activity, RefreshCw, Radar } from 'lucide-react';

export default function ExtremeAnalytics() {
  const [deaths, setDeaths] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: deathsData } = await supabase
        .from('recent_deaths')
        .select('*')
        .order('death_time', { ascending: false })
        .limit(50);
      if (deathsData) setDeaths(deathsData);

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
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h1 className="text-4xl font-medieval text-gradient-gold mb-2 flex items-center">
            <Radar className="mr-3 text-tibia-primary" size={36} />
            Radar Global do Servidor
          </h1>
          <p className="text-gray-400 font-sans">
            Monitoramento de mortes, baixas inimigas e movimentações imigratórias.
          </p>
        </div>
        <button 
          onClick={fetchData}
          className="glass-button text-tibia-highlight px-4 py-2 rounded flex items-center font-bold transition-all hover:scale-105"
        >
          <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={18} />
          {loading ? 'Rastreando...' : 'Atualizar Radar'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* PANEL: RECENT DEATHS */}
        <div className="bg-tibia-card border border-red-900/40 rounded-lg p-0 shadow-[0_0_20px_rgba(239,68,68,0.05)] overflow-hidden flex flex-col">
          <div className="bg-red-950/40 border-b border-red-900/50 p-4">
            <h3 className="text-2xl font-medieval text-red-500 flex items-center">
              <Skull className="mr-3" size={24} />
              Registro de Óbitos
            </h3>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Interceptação de Servidor</p>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[600px] custom-scrollbar bg-black/20">
            {deaths.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-16 flex flex-col items-center">
                <ShieldAlert size={48} className="mb-4 opacity-20" />
                <p>Nenhuma morte detectada no radar.</p>
              </div>
            )}
            
            <div className="space-y-4">
              {deaths.map(d => (
                <div key={d.id} className="bg-black/60 p-4 rounded border border-red-900/30 flex flex-col gap-2 hover:bg-black/80 transition-colors relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-900/50 group-hover:bg-red-600 transition-colors"></div>
                  
                  <div className="flex justify-between items-start pl-2">
                    <span className="text-white font-bold text-lg flex items-center gap-2">
                      {d.character_name}
                      <span className="bg-red-900/30 text-red-400 text-[10px] uppercase px-2 py-0.5 rounded border border-red-900/50">Lvl {d.level}</span>
                      {d.is_guild_member && <span className="bg-blue-900/30 text-blue-400 text-[10px] uppercase px-2 py-0.5 rounded border border-blue-900/50">Aliado</span>}
                      {d.is_hunted && <span className="bg-orange-900/30 text-orange-400 text-[10px] uppercase px-2 py-0.5 rounded border border-orange-900/50">Inimigo</span>}
                    </span>
                    <span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-1 rounded">
                      {new Date(d.death_time).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-400 pl-2">
                    Foi obliterado por <span className="text-red-400 font-semibold">{d.killed_by}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL: SERVER TRANSFERS */}
        <div className="bg-tibia-card border border-teal-900/40 rounded-lg p-0 shadow-[0_0_20px_rgba(20,184,166,0.05)] overflow-hidden flex flex-col">
          <div className="bg-teal-950/40 border-b border-teal-900/50 p-4">
            <h3 className="text-2xl font-medieval text-teal-500 flex items-center">
              <Plane className="mr-3" size={24} />
              Controle de Fronteiras
            </h3>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Transfers Mundiais</p>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[600px] custom-scrollbar bg-black/20">
            {transfers.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-16 flex flex-col items-center">
                <Plane size={48} className="mb-4 opacity-20" />
                <p>Nenhum movimento migratório detectado.</p>
              </div>
            )}
            
            <div className="space-y-4">
              {transfers.map(t => {
                const isIncoming = t.transfer_type === 'IN';
                const borderColor = isIncoming ? 'border-teal-900/30' : 'border-orange-900/30';
                const highlightColor = isIncoming ? 'bg-teal-600' : 'bg-orange-600';
                
                return (
                  <div key={t.id} className={`bg-black/60 p-4 rounded border ${borderColor} flex flex-col gap-2 hover:bg-black/80 transition-colors relative overflow-hidden group`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${highlightColor} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                    
                    <div className="flex justify-between items-start pl-2">
                      <span className="text-white font-bold text-lg flex items-center gap-2">
                        {t.character_name}
                        {t.level > 0 && <span className="bg-gray-800 text-gray-300 text-[10px] uppercase px-2 py-0.5 rounded border border-gray-700">Lvl {t.level}</span>}
                      </span>
                      <span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-1 rounded">
                        {new Date(t.transfer_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="text-sm pl-2">
                      {isIncoming ? (
                        <span className="text-teal-400">
                          Desembarcou vindo de <strong className="text-white">{t.other_world || 'Desconhecido'}</strong>
                        </span>
                      ) : (
                        <span className="text-orange-400">
                          Fugiu em direção a <strong className="text-white">{t.other_world || 'Desconhecido'}</strong>
                        </span>
                      )}
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
