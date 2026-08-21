import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

export default function GlobalTracker() {
  const [census, setCensus] = useState({ total_members: 0, active_members: 0 });
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCensus = async () => {
      setLoading(true);
      // Fetch current census
      const { data, error } = await supabase.from('view_macro_census').select('*').single();
      if (data && !error) {
        setCensus(data);
      }
      
      // Fetch historical daily data
      const { data: dailyData, error: dailyError } = await supabase
        .from('view_macro_daily')
        .select('*')
        .order('day_date', { ascending: true });
        
      if (dailyData && !dailyError) {
        const formattedData = dailyData.map(d => {
          const date = new Date(d.day_date);
          const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          return {
            day: days[date.getDay()],
            logadas: d.logadas,
            cacando: d.cacando
          };
        });
        setBarData(formattedData);
      } else {
        // Fallback or empty state if view not created yet
        setBarData([]);
      }
      
      setLoading(false);
    };
    fetchCensus();
  }, []);

  const pieData = [
    { name: 'Ativos (7 dias)', value: parseInt(census.active_members) || 0, color: '#10B981' }, // emerald-500
    { name: 'Inativos', value: (parseInt(census.total_members) || 0) - (parseInt(census.active_members) || 0), color: '#374151' } // gray-700
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-5xl font-medieval text-gradient-gold mb-2">Censo Macro da Guilda</h2>
          <p className="text-gray-400 font-sans">Acompanhamento global de atividade e progresso de todos os membros.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico 1: Ativos vs Inativos */}
          <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">Engajamento da Guilda (Últimos 7 dias)</h3>
            <p className="text-sm text-gray-400 mb-6">Proporção de membros da guilda que obtiveram experiência na última semana vs ociosos totais.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between text-center px-8 border-t border-tibia-border pt-4">
              <div>
                <p className="text-2xl font-bold text-green-400">{pieData[0].value}</p>
                <p className="text-xs text-gray-400">Ativos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400">{pieData[1].value}</p>
                <p className="text-xs text-gray-400">Inativos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-tibia-primary">{census.total_members}</p>
                <p className="text-xs text-gray-400">Total Membros</p>
              </div>
            </div>
          </div>

          {/* Gráfico 2: Tempo Online vs Caçando */}
          <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">Eficiência de Servidor: Logado vs Efetivo</h3>
            <p className="text-sm text-gray-400 mb-6">
              Demonstrativo de "Horas totais logadas" vs "Horas gerando XP". <br/>
              <span className="italic text-yellow-500 text-xs">Nota: Dados simulados até que a ferramenta acumule 7 dias de telemetria contínua.</span>
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    cursor={{fill: '#374151', opacity: 0.4}} 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="logadas" name="Horas Logadas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cacando" name="Horas Caçando" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
