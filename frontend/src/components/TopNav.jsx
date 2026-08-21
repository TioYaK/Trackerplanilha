import React from 'react';
import { Activity, LayoutDashboard, CalendarDays, Users, TrendingDown, Settings, Swords, Crosshair } from 'lucide-react';

export default function TopNav({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'live', label: 'Monitor ao Vivo', icon: <Activity size={18} /> },
    { id: 'roster', label: 'Roster da Guilda', icon: <Users size={18} /> },
    { id: 'radar', label: 'Radar de Caçadores', icon: <Crosshair size={18} /> },
    { id: 'planilha', label: 'Respawns', icon: <CalendarDays size={18} /> },
    { id: 'tracker', label: 'Censo Macro', icon: <LayoutDashboard size={18} /> },
    { id: 'analytics', label: 'Dossiê & Rankings', icon: <TrendingDown size={18} /> },
  ];

  return (
    <div className="bg-tibia-wood border-b-4 border-tibia-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <Swords size={28} className="text-tibia-highlight" />
          <div>
            <h1 className="text-2xl font-medieval text-tibia-highlight tracking-wider shadow-black drop-shadow-md">
              Auroria <span className="text-white">Tracker</span>
            </h1>
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded font-medieval transition-all duration-300 ${
                currentView === item.id 
                  ? 'bg-tibia-primary text-black font-bold shadow-tibia-glow' 
                  : 'text-tibia-primary hover:text-tibia-highlight hover:bg-black/30'
              }`}
            >
              {item.icon}
              <span className="text-lg tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Icons */}
        <div className="flex items-center">
          <button 
            onClick={() => setCurrentView('settings')}
            className={`p-2 rounded transition-colors ${
              currentView === 'settings' 
                ? 'text-tibia-highlight bg-black/50' 
                : 'text-tibia-primary hover:text-tibia-highlight hover:bg-black/30'
            }`}
          >
            <Settings size={22} />
          </button>
        </div>

      </div>
    </div>
  );
}
