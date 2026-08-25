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
import AdminPanel from './views/AdminPanel';
import { useAuth } from './components/AuthContext';
import { LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
  const { user, profile, logout } = useAuth();
  const [currentView, setCurrentView] = useState('live');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [visibleTabs, setVisibleTabs] = useState(null); 
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('app_settings').select('visible_tabs').eq('id', 1).single();
        if (data?.visible_tabs) {
          setVisibleTabs(data.visible_tabs);
        } else {
          setVisibleTabs(['live', 'radar', 'roster', 'planilha', 'contribute', 'bank', 'market', 'loot', 'tracker', 'extreme', 'analytics']);
        }
      } catch (err) {
        setVisibleTabs(['live', 'radar', 'roster', 'planilha', 'contribute', 'bank', 'market', 'loot', 'tracker', 'extreme', 'analytics']);
      }
    };
    if (user && profile?.status === 'active') {
      fetchSettings();
    }
  }, [user, profile]);

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
      case 'roster': return <GuildRoster onPlayerClick={handlePlayerClick} isAdmin={isAdmin} />;
      case 'radar': return <RadarHunters onPlayerClick={handlePlayerClick} />;
      case 'tracker': return <GlobalTracker onPlayerClick={handlePlayerClick} />;
      case 'extreme': return <ExtremeAnalytics />;
      case 'planilha': return <PlanilhaManager isAdmin={isAdmin} />;
      case 'bank': return <GuildBank isAdmin={isAdmin} />;
      case 'market': return <GuildMarket isAdmin={isAdmin} />;
      case 'loot': return <LootTracker isAdmin={isAdmin} />;
      case 'party': return <PartyDashboard party={selectedParty} onPlayerClick={handlePlayerClick} />;
      case 'contribute': return <Contribute />;
      case 'admin': return isAdmin ? <AdminPanel /> : null;
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

  if (visibleTabs === null && isAdmin === false) return null; // loading

  return (
    <div className="min-h-screen bg-tibia-bg bg-tibia-pattern">
      <TopNav 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isAdmin={isAdmin}
        visibleTabs={visibleTabs || []}
      />
      <main className="w-full">
        {renderView()}
      </main>
    </div>
  );
}
