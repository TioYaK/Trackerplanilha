import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, ShieldAlert, CheckCircle, Search, Calendar, Globe } from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';

export default function WarAttendance({ onPlayerClick }) {
  const { activeWorld, setActiveWorld } = useWorld();
  const [selectedWorld, setSelectedWorld] = useState(activeWorld || 'ALL');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tibia Server Save Day
  const getTibiaDay = () => {
    const ssDate = new Date(Date.now() - 13 * 60 * 60 * 1000);
    return ssDate.toISOString().split('T')[0];
  };

  const [dateFilter, setDateFilter] = useState(getTibiaDay());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeWorld) {
      setSelectedWorld(activeWorld);
    }
  }, [activeWorld]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guild_attendance')
        .select('*')
        .eq('date', dateFilter)
        .order('minutes_online', { ascending: false });

      if (error) throw error;
      
      const rawList = data || [];
      const names = rawList.map(r => r.character_name).filter(Boolean);

      let perkMap = new Map();
      if (names.length > 0) {
        const { data: perks } = await supabase
          .from('guild_perk_members')
          .select('character_name, world')
          .in('character_name', names);
        if (perks) {
          perkMap = new Map(perks.map(p => [p.character_name.toLowerCase(), p.world]));
        }
      }

      const enriched = rawList.map(r => ({
        ...r,
        world: perkMap.get((r.character_name || '').toLowerCase()) || 'Auroria'
      }));

      setAttendanceData(enriched);
    } catch (err) {
      console.error('Erro ao buscar attendance:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const filtered = useMemo(() => {
    return attendanceData.filter(d => {
      const matchName = (d.character_name || '').toLowerCase().includes((search || '').toLowerCase());
      const matchWorld = selectedWorld === 'ALL' || (d.world || '').toLowerCase() === selectedWorld.toLowerCase();
      return matchName && matchWorld;
    });
  }, [attendanceData, search, selectedWorld]);

  const formatMinutes = (mins) => {
    const mTotal = Number(mins) || 0;
    if (mTotal < 60) return `${mTotal} min`;
    const h = Math.floor(mTotal / 60);
    const m = mTotal % 60;
    return `${h}h ${m}m`;
  };

  const confirmedCount = filtered.filter(d => d.minutes_online >= 120).length;
  const partialCount = filtered.filter(d => d.minutes_online > 0 && d.minutes_online < 120).length;
  const totalTracked = filtered.length;

  const handleWorldChange = (wId) => {
    setSelectedWorld(wId);
    if (setActiveWorld) setActiveWorld(wId);
  };

  return (
    <div className="p-4 sm:p-6 h-[calc(100vh-64px)] overflow-y-auto bg-black text-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-tibia-border pb-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center tracking-tight font-medieval">
            <Clock className="mr-3 text-blue-500" size={32} />
            Atividade Diária (Horas Online)
          </h1>
          <p className="text-gray-400 mt-1 text-sm font-sans">
            Monitoramento de tempo ativo diário dos guerreiros nos 16 servidores com carimbo no Server Save.
          </p>
        </div>

        {/* Chips de Resumo */}
        <div className="flex gap-2 flex-wrap">
          <span className="bg-green-950/40 border border-green-700/50 text-green-400 text-xs px-3 py-1.5 rounded-full font-bold">
            ✅ Atividade (2h+): {confirmedCount}
          </span>
          <span className="bg-yellow-950/40 border border-yellow-700/50 text-yellow-400 text-xs px-3 py-1.5 rounded-full font-bold">
            ⏳ Parcial (&lt;2h): {partialCount}
          </span>
          <span className="bg-blue-950/40 border border-blue-700/50 text-blue-400 text-xs px-3 py-1.5 rounded-full font-bold">
            🌐 Total Rastreados: {totalTracked}
          </span>
        </div>
      </div>

      {/* Seletor de Servidor */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin scrollbar-thumb-gray-800">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <Globe size={14} className="text-blue-400" /> Servidor:
        </span>
        <button
          onClick={() => handleWorldChange('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            selectedWorld === 'ALL'
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-tibia-glow font-black'
              : 'bg-black/40 text-gray-300 hover:text-white hover:bg-white/5 border border-tibia-border/50'
          }`}
        >
          🌐 Todos os Mundos
        </button>
        {WORLDS_LIST.filter(w => w.id !== 'ALL').map(w => (
          <button
            key={w.id}
            onClick={() => handleWorldChange(w.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              selectedWorld.toLowerCase() === w.id.toLowerCase()
                ? 'bg-yellow-500 text-black shadow-tibia-glow font-black'
                : 'bg-black/40 text-gray-300 hover:text-white hover:bg-white/5 border border-tibia-border/50'
            }`}
          >
            {w.icon} {w.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-black/40 p-4 border border-tibia-border rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar guerreiro..."
            className="w-full bg-black/50 border border-tibia-border text-white pl-10 pr-4 py-2 rounded focus:outline-none focus:border-blue-500 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input
            type="date"
            className="bg-black/50 border border-tibia-border text-white pl-10 pr-4 py-2 rounded focus:outline-none focus:border-blue-500 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-black/40 border border-tibia-border rounded-lg overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-tibia-wood border-b-2 border-tibia-primary text-tibia-highlight">
            <tr>
              <th className="p-4">Guerreiro</th>
              <th className="p-4">Mundo</th>
              <th className="p-4 text-center">Tempo Online (Hoje)</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tibia-border/50">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  <div className="animate-pulse flex flex-col items-center justify-center">
                    <Clock size={32} className="mb-2 text-tibia-primary" />
                    Buscando registros de ponto...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  Nenhum registro encontrado para a data e servidor selecionados.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500 font-mono w-5 text-xs">{idx + 1}.</span>
                      <span
                        onClick={() => onPlayerClick && onPlayerClick(row.character_name, row.world)}
                        className="font-bold text-white text-base cursor-pointer hover:text-tibia-primary hover:underline transition-colors"
                      >
                        {row.character_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-stone-900 border border-stone-700 text-gray-300 px-2.5 py-1 rounded text-xs font-semibold">
                      {row.world}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-base text-blue-400">
                    {formatMinutes(row.minutes_online)}
                  </td>
                  <td className="p-4 text-center">
                    {row.minutes_online >= 120 ? (
                      <span className="inline-flex items-center text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-900/50 text-xs font-semibold">
                        <CheckCircle size={14} className="mr-1" /> Presença Confirmada
                      </span>
                    ) : row.minutes_online > 0 ? (
                      <span className="inline-flex items-center text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-900/50 text-xs font-semibold">
                        <Clock size={14} className="mr-1" /> Online Parcial
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-400 bg-red-900/30 px-3 py-1 rounded-full border border-red-900/50 text-xs font-semibold">
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
