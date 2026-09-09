import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, ShieldAlert, CheckCircle, Search, Calendar } from 'lucide-react';

export default function WarAttendance({ onPlayerClick }) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tibia Server Save Day
  const getTibiaDay = () => {
    const ssDate = new Date(Date.now() - 13 * 60 * 60 * 1000);
    return ssDate.toISOString().split('T')[0];
  };

  const [dateFilter, setDateFilter] = useState(getTibiaDay());
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guild_attendance')
        .select('*')
        .eq('date', dateFilter)
        .order('minutes_online', { ascending: false });

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (err) {
      console.error('Erro ao buscar attendance:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const filtered = attendanceData.filter(d => 
    (d.character_name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const formatMinutes = (mins) => {
    const mTotal = Number(mins) || 0;
    if (mTotal < 60) return `${mTotal} min`;
    const h = Math.floor(mTotal / 60);
    const m = mTotal % 60;
    return `${h}h ${m}m`;
  };

  const confirmedCount = attendanceData.filter(d => d.minutes_online >= 120).length;
  const partialCount = attendanceData.filter(d => d.minutes_online > 0 && d.minutes_online < 120).length;
  const totalTracked = attendanceData.length;

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto bg-black text-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center tracking-tight">
            <Clock className="mr-3 text-blue-500" size={32} />
            Atividade Diária (Horas Online)
          </h1>
          <p className="text-gray-400 mt-1">
            Monitoramento de tempo ativo diário dos membros da Guilda com carimbo no Server Save.
          </p>
        </div>

        {/* Chips de Resumo */}
        <div className="flex gap-3">
          <span className="bg-green-950/40 border border-green-700/50 text-green-400 text-xs px-3 py-1.5 rounded-full font-bold">
            ✅ Presença (2h+): {confirmedCount}
          </span>
          <span className="bg-yellow-950/40 border border-yellow-700/50 text-yellow-400 text-xs px-3 py-1.5 rounded-full font-bold">
            ⏳ Parcial (&lt;2h): {partialCount}
          </span>
          <span className="bg-blue-950/40 border border-blue-700/50 text-blue-400 text-xs px-3 py-1.5 rounded-full font-bold">
            🛡️ Total: {totalTracked}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-black/40 p-4 border border-tibia-border rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar soldado..."
            className="w-full bg-black/50 border border-tibia-border text-white pl-10 pr-4 py-2 rounded focus:outline-none focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input
            type="date"
            className="bg-black/50 border border-tibia-border text-white pl-10 pr-4 py-2 rounded focus:outline-none focus:border-blue-500"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-black/40 border border-tibia-border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-tibia-wood border-b-2 border-tibia-primary text-tibia-highlight">
            <tr>
              <th className="p-4">Soldado</th>
              <th className="p-4 text-center">Tempo Online (Hoje)</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tibia-border/50">
            {loading ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-500">
                  <div className="animate-pulse flex flex-col items-center justify-center">
                    <Clock size={32} className="mb-2 text-tibia-primary" />
                    Buscando registros de ponto...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-500">
                  Nenhum soldado registrou ponto neste dia ainda.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500 font-mono w-4">{idx + 1}.</span>
                      <span
                        onClick={() => onPlayerClick && onPlayerClick(row.character_name)}
                        className="font-bold text-white text-lg cursor-pointer hover:text-tibia-primary hover:underline transition-colors"
                      >
                        {row.character_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono text-lg text-blue-400">
                    {formatMinutes(row.minutes_online)}
                  </td>
                  <td className="p-4 text-center">
                    {row.minutes_online >= 120 ? (
                      <span className="inline-flex items-center text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-900/50">
                        <CheckCircle size={14} className="mr-1" /> Presença Confirmada
                      </span>
                    ) : row.minutes_online > 0 ? (
                      <span className="inline-flex items-center text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-900/50">
                        <Clock size={14} className="mr-1" /> Online Parcial
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-400 bg-red-900/30 px-3 py-1 rounded-full border border-red-900/50">
                        <ShieldAlert size={14} className="mr-1" /> Ausente
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
