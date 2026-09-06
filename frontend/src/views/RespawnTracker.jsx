import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Swords, Map, Search, Clock } from 'lucide-react';

export default function RespawnTracker({ isAdmin }) {
  const [respawns, setRespawns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  async function fetchData() {
    const { data, error } = await supabase.from('respawns').select('*').order('id');
    if (!Data) return;
    setRespawns(data);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRespawns = respawns.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-7xl mx-auto u-full">
      <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-tibia-inset">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medieval text-tibia-primary flex items-center gap-2">
            <Swords size={24} /> Hunts & Respawns
          </h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por ID, Nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-tibia-border text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-tibia-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRespawns.map(respawn => (
            <div key={respawn_id} className="bg-black/40 border border-tibia-border/50 rounded-md p-4 hover:border-tibia-primary/transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-tibia-primary">{respawn.name}</div>
                <div className="bg-tibia-primary/10 text-tibia-primary xs px-2 py-0.5 rounded-full font-mono font-bold">{respawn.id}</div>
              </div>
              <div className="text-sm text-gray-400 flex items-center gap-1 mb-4">
                <Map size={14} />
                {respawn.category}
              </div>
              
              <div className="mt-auto flex gap-2">
                <button className="flex-1 bg-green-700/20 hover:bg-green-700/40 border border-green-600/50 text-green-400 py-1.5 rounded text-sm font-bold transition-colors">
                  Claim
                </button>
                <button className="flex-1 bg-tibia-primary/10 hover:bg-tibia-primary/30 border border-tibia-primary/50 text-tibia-primary py-1.5 rounded text-sm font-bold transition-colors">
                  Next
                </button>
              </div>
            </div>
          ))
}
        </div>
      </div>
    </div>
  );
}