import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function PlayerDashboard({ playerName }) {
  // Dados mockados para simular a telemetria do jogador
  const mockData = [
    { time: '18:00', xp: 0, status: 'Online' },
    { time: '18:10', xp: 200000, status: 'Hunting' },
    { time: '18:20', xp: 450000, status: 'Hunting' },
    { time: '18:30', xp: 750000, status: 'Hunting' },
    { time: '18:40', xp: 750000, status: 'Idle (Depot)' },
    { time: '18:50', xp: 750000, status: 'Idle (Depot)' },
    { time: '19:00', xp: 1200000, status: 'Hunting' },
  ];

  return (
    <div className="bg-tibia-card p-6 rounded-lg border border-tibia-border mt-8">
      <h3 className="text-xl font-bold text-white mb-4">
        Raio-X Individual: <span className="text-tibia-primary">{playerName || 'Jogador Exemplo'}</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-tibia-bg p-4 rounded border border-tibia-border">
          <p className="text-gray-400 text-sm uppercase">Tempo Efetivo de Hunt</p>
          <p className="text-2xl font-bold text-green-400">40 min</p>
        </div>
        <div className="bg-tibia-bg p-4 rounded border border-tibia-border">
          <p className="text-gray-400 text-sm uppercase">Eficiência Média</p>
          <p className="text-2xl font-bold text-yellow-400">1.8M XP/h</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <Legend />
            <Line type="monotone" dataKey="xp" name="XP Acumulada" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
