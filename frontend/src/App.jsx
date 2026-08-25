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
import GuildBank from './views/GuildBank';
import GuildMarket from './views/GuildMarket';
import LootTracker from './views/LootTracker';
import ExtremeAnalytics from './views/ExtremeAnalytics';
import Contribute from './views/Contribute';
import AuthScreen from './views/AuthScreen';
import { useAuth } from './components/AuthContext';
import { LogOut } from 'lucide-react';

export default function App() {
  const { user, profile, logout } = useAuth();
  const [currentView, setCurrentView] = useState('live');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);

  const isAdmin = profile?.role === 'admin';

  // Toggle Admin (Apenas para exibir ou esconder painéis se ele for admin de verdade)
  // Como o RLS / Supabase backend vai ser a real proteção, isso é apenas UI
  const [adminMode, setAdminMode] = useState(false);
  const toggleAdmin = () => {
    if (!isAdmin) {
      alert('Você não tem permissão de Administrador.');
      return;
    }
    setAdminMode(!adminMode);
  };

  if (!user) {
    return <AuthScreen />;
  }

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-tibia-bg bg-tibia-pattern flex items-center justify-center p-4">
        <div className="bg-black/80 border-2 border-tibia-border rounded-lg shadow-tibia-glow max-w-md w-full p-8 text-center">
          <h2 className="text-3xl font-medieval text-yellow-500 mb-4">Conta em Análise</h2>
          <p className="text-gray-300 font-sans mb-6">
            Sua conta (Main: {profile.main_character}) foi registrada com sucesso, mas você precisa aguardar um Administrador aprovar o seu acesso.
          </p>
          <button 
            onClick={logout}
            className="bg-red-900/50 hover:bg-red-900 border border-red-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 w-full transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </div>
    );
  }

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
      case 'roster': return <GuildRoster onPlayerClick={handlePlayerClick} isAdmin={adminMode} />;
      case 'radar': return <RadarHunters onPlayerClick={handlePlayerClick} />;
      case 'tracker': return <GlobalTracker onPlayerClick={handlePlayerClick} />;
      case 'extreme': return <ExtremeAnalytics />;
      case 'planilha': return <PlanilhaManager isAdmin={adminMode} />;
      case 'bank': return <GuildBank isAdmin={adminMode} />;
      case 'market': return <GuildMarket isAdmin={adminMode} />;
      case 'loot': return <LootTracker isAdmin={adminMode} />;
      case 'party': return <PartyDashboard party={selectedParty} onPlayerClick={handlePlayerClick} />;
      case 'contribute': return <Contribute />;
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
        isAdmin={adminMode}
        toggleAdmin={toggleAdmin}
      />
      <main className="w-full">
        {renderView()}
      </main>
    </div>
  );
}
