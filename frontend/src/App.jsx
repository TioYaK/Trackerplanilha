import React, { useState } from 'react';
import TopNav from './components/TopNav';
import LiveDashboard from './views/LiveDashboard';
import GlobalTracker from './components/GlobalTracker';
import PlanilhaManager from './views/PlanilhaManager';
import GuildRoster from './views/GuildRoster';
import RadarHunters from './views/RadarHunters';
import PlayerDashboard from './components/PlayerDashboard';
import PartyDashboard from './components/PartyDashboard';
import ReportExport from './components/ReportExport';
import Rankings from './components/Rankings';

export default function App() {
  const [currentView, setCurrentView] = useState('live');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('auroria_admin') === 'true';
  });

  const toggleAdmin = () => {
    if (isAdmin) {
      localStorage.removeItem('auroria_admin');
      setIsAdmin(false);
    } else {
      const pwd = prompt('Digite a senha de Administrador:');
      if (pwd === 'admin123') { // Senha super secreta para MVP
        localStorage.setItem('auroria_admin', 'true');
        setIsAdmin(true);
        alert('Modo Administrador ativado com sucesso!');
      } else if (pwd !== null) {
        alert('Senha incorreta.');
      }
    }
  };

  const handlePlayerClick = (playerName) => {
    setSelectedPlayer(playerName);
    setCurrentView('players');
  };

  const handlePartyClick = (partyObj) => {
    setSelectedParty(partyObj);
    setCurrentView('party');
  };

  const renderView = () => {
    switch(currentView) {
      case 'live': return <LiveDashboard onPlayerClick={handlePlayerClick} onPartyClick={handlePartyClick} />;
      case 'roster': return <GuildRoster onPlayerClick={handlePlayerClick} />;
      case 'radar': return <RadarHunters onPlayerClick={handlePlayerClick} />;
      case 'tracker': return <GlobalTracker onPlayerClick={handlePlayerClick} />;
      case 'planilha': return <PlanilhaManager isAdmin={isAdmin} />;
      case 'party': return <PartyDashboard party={selectedParty} onPlayerClick={handlePlayerClick} />;
      case 'players': 
        return (
          <div className="p-8 max-w-7xl mx-auto w-full">
            <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Investigação de Membro</h2>
            <p className="text-gray-400 mb-8 font-sans">Verifique a eficiência, histórico criminal e aplique punições ao jogador.</p>
            <PlayerDashboard playerName={selectedPlayer} isAdmin={isAdmin} />
          </div>
        );
      case 'analytics':
        return <Rankings isAdmin={isAdmin} />;
      default: return <LiveDashboard onPlayerClick={handlePlayerClick} onPartyClick={handlePartyClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-tibia-bg text-gray-200 font-sans" style={{ backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)' }}>
      <TopNav 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isAdmin={isAdmin}
        toggleAdmin={toggleAdmin}
      />
      <main className="w-full">
        {renderView()}
      </main>
    </div>
  );
}
