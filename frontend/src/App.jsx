import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import LiveDashboard from './views/LiveDashboard';
import GlobalTracker from './components/GlobalTracker';
import PlanilhaManager from './views/PlanilhaManager';
import GuildRoster from './views/GuildRoster';
import PlayerDashboard from './components/PlayerDashboard';
import ReportExport from './components/ReportExport';
import Rankings from './components/Rankings';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('live');

  const renderView = () => {
    switch(currentView) {
      case 'live': return <LiveDashboard />;
      case 'roster': return <GuildRoster />;
      case 'tracker': return <GlobalTracker />;
      case 'planilha': return <PlanilhaManager />;
      case 'players': 
        return (
          <div className="p-8 max-w-7xl mx-auto w-full">
            <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Inspeção de Membro</h2>
            <p className="text-gray-400 mb-8 font-sans">Verifique a eficiência e a telemetria histórica de qualquer jogador da guilda.</p>
            <PlayerDashboard playerName="Exemplo de Jogador" />
          </div>
        );
      case 'analytics':
        return <Rankings />;
      default: return <LiveDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-tibia-bg text-gray-200 font-sans" style={{ backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)' }}>
      <TopNav currentView={currentView} setCurrentView={setCurrentView} />
      <main className="w-full">
        {renderView()}
      </main>
    </div>
  );
}
