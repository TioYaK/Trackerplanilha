import React, { useState, useEffect } from 'react';
import HeaderMetrics from '../components/HeaderMetrics';
import RespawnCard from '../components/RespawnCard';
import { supabase } from '../lib/supabase';
import { RefreshCw } from 'lucide-react';

export default function LiveDashboard() {
  const [activeTab, setActiveTab] = useState('Sanguine');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['Darashia', 'Sanguine', 'Darklight', 'Piranhas', 'Totem', 'Outros'];

  const fetchParties = async () => {
    setLoading(true);
    // Busca dados reais da planilha
    const { data, error } = await supabase
      .from('parties_planilhadas')
      .select('*')
      .order('slot_start', { ascending: true });
      
    if (!error && data) {
      const processedParties = data.map(p => ({
        ...p,
        category: p.respawn_category
      }));
      setParties(processedParties);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchParties();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(fetchParties, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white">Monitor ao Vivo</h2>
          <p className="text-gray-400 mt-1">Acompanhamento em tempo real dos respawns planilhados.</p>
        </div>
        <button 
          onClick={fetchParties}
          className="flex items-center text-tibia-primary hover:text-blue-400 bg-blue-500/10 px-4 py-2 rounded-lg transition"
        >
          <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Agora
        </button>
      </div>

      <HeaderMetrics />

      <div className="mb-6 flex space-x-2 overflow-x-auto pb-2 border-b border-tibia-border">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-6 py-3 font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === cat 
                ? 'border-tibia-primary text-tibia-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {parties.filter(p => p.category === activeTab).length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white/5 rounded-lg border border-tibia-border border-dashed">
              <p className="text-gray-400 font-medium">Nenhuma party agendada para {activeTab} hoje.</p>
            </div>
          )}
          {parties
            .filter(p => p.category === activeTab)
            .map(party => (
              <RespawnCard key={party.id} party={party} />
            ))}
        </div>
      )}
    </div>
  );
}
