import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Target, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RadarHunters({ onPlayerClick }) {
  const [hunters, setHunters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHunters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('view_recent_hunters')
      .select('*')
      .limit(100);
      
    if (data && !error) {
      setHunters(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHunters();
  }, []);

  const formatXP = (xp) => {
    if (xp >= 1000000) return (xp / 1000000).toFixed(1) + 'M';
    if (xp >= 1000) return (xp / 1000).toFixed(1) + 'k';
    return xp;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white flex items-center">
          <Target className="mr-3 text-tibia-primary" size={32} />
          Radar de Caçadores
        </h2>
        <p className="text-gray-400 mt-1">Jogadores da guilda que registraram ganho de XP nas últimas 24 horas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-tibia-card border border-tibia-border p-4 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Caçadores Ativos (24h)</p>
            <p className="text-2xl font-bold text-white">{hunters.length}</p>
          </div>
          <TrendingUp className="text-green-500" size={32} />
        </div>
      </div>

      <div className="bg-tibia-card border border-tibia-border rounded-lg overflow-hidden shadow-xl">
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
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tibia-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : hunters.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-500">
                    <AlertTriangle className="mx-auto mb-2 opacity-50" size={32} />
                    Nenhum ganho de XP registrado na guilda nas últimas 24 horas.
                  </td>
                </tr>
              ) : (
                hunters.map(h => (
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
    </div>
  );
}
