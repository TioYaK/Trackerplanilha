import React from 'react';
import { Activity, LayoutDashboard, CalendarDays, Users, TrendingDown, Settings } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'dashboard', label: 'Monitor ao Vivo', icon: <Activity size={20} /> },
    { id: 'analytics', label: 'Analytics & Prejuízos', icon: <TrendingDown size={20} /> },
    { id: 'planilha', label: 'Gerenciar Planilha', icon: <CalendarDays size={20} /> },
    { id: 'players', label: 'Raio-X de Jogador', icon: <Users size={20} /> },
  ];

  return (
    <div className="w-64 bg-tibia-card border-r border-tibia-border h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-tibia-border">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Auroria <span className="text-tibia-primary">Tracker</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Guild Audit System</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
              currentView === item.id 
                ? 'bg-tibia-primary text-white shadow-lg shadow-blue-900/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-tibia-border">
        <button 
          onClick={() => setCurrentView('settings')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
            currentView === 'settings' 
              ? 'bg-tibia-primary text-white' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings size={20} />
          <span>Configurações</span>
        </button>
      </div>
    </div>
  );
}
