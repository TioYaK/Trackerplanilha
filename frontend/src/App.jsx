import React, { useState, useEffect, Suspense, lazy } from 'react';
import TopNav from './components/TopNav';
import ErrorBoundary from './components/ErrorBoundary';
import AdBanner from './components/AdBanner';
import { useAuth } from './components/AuthContext';
import { LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';

// Lazy-loaded Views & Components
const LiveDashboard = lazy(() => import('./views/LiveDashboard'));
const GlobalTracker = lazy(() => import('./components/GlobalTracker'));
const PlanilhaManager = lazy(() => import('./views/PlanilhaManager'));
const GuildRoster = lazy(() => import('./views/GuildRoster'));
const WarAttendance = lazy(() => import('./views/WarAttendance'));
const BazaarSniper = lazy(() => import('./views/BazaarSniper'));
const RadarHunters = lazy(() => import('./views/RadarHunters'));
const RespawnTracker = lazy(() => import('./views/RespawnTracker'));
const InviteRequest = lazy(() => import('./views/InviteRequest'));
const PlayerDashboard = lazy(() => import('./components/PlayerDashboard'));
const PartyDashboard = lazy(() => import('./components/PartyDashboard'));
const Rankings = lazy(() => import('./components/Rankings'));
const GuildBank = lazy(() => import('./views/GuildBank'));
const GuildMarket = lazy(() => import('./views/GuildMarket'));
const ExtremeAnalytics = lazy(() => import('./views/ExtremeAnalytics'));
const Contribute = lazy(() => import('./views/Contribute'));
const AuthScreen = lazy(() => import('./views/AuthScreen'));
const AdminPanel = lazy(() => import('./views/AdminPanel'));
const AdminDashboard = lazy(() => import('./views/AdminDashboard'));
const OnboardingScreen = lazy(() => import('./views/OnboardingScreen'));
const WorkerDashboard = lazy(() => import('./views/WorkerDashboard'));
const GuildPerks = lazy(() => import('./views/GuildPerks'));

function ModuleFallback() {
  return (
    <div className="min-h-[350px] flex items-center justify-center p-8 w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
        <div className="text-yellow-500 font-medieval text-lg animate-pulse">Carregando módulo...</div>
      </div>
    </div>
  );
}

// Tabs padrão visíveis quando não há configuração no banco
const DEFAULT_VISIBLE_TABS = [
  'live', 'radar', 'roster', 'planilha', 'contribute',
  'bank', 'market', 'loot', 'tracker', 'extreme', 'respawns', 'guild_perks'
];

export default function App() {
  const { user, profile, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('live');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [visibleTabs, setVisibleTabs] = useState(null);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('visible_tabs')
          .eq('id', 1)
          .maybeSingle();
        setVisibleTabs(data?.visible_tabs ?? DEFAULT_VISIBLE_TABS);
      } catch (err) {
        setVisibleTabs(DEFAULT_VISIBLE_TABS);
      }
    };

    if (user && profile?.status === 'active') {
      fetchSettings();
    }
  }, [user, profile]);

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-tibia-bg bg-tibia-pattern flex items-center justify-center p-4">
        <div className="text-yellow-500 font-medieval text-2xl animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ModuleFallback />}>
          <AuthScreen />
        </Suspense>
      </ErrorBoundary>
    );
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

  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-tibia-bg bg-tibia-pattern flex items-center justify-center p-4">
        <div className="bg-black/80 border-2 border-red-900 rounded-lg shadow-tibia-glow max-w-md w-full p-8 text-center">
          <h2 className="text-3xl font-medieval text-red-500 mb-4">Acesso Negado</h2>
          <p className="text-gray-300 font-sans mb-6">
            Sua solicitação de acesso para "{profile.main_character}" foi rejeitada por um administrador.
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

  if (profile?.status !== 'active') {
    // Fail-safe block to ensure ONLY 'active' statuses get past this point
    return (
      <div className="min-h-screen bg-tibia-bg bg-tibia-pattern flex items-center justify-center p-4">
        <div className="text-yellow-500 font-medieval text-2xl animate-pulse">Aguardando validação do perfil...</div>
      </div>
    );
  }

  if (!profile.onboarding_completed) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ModuleFallback />}>
          <OnboardingScreen />
        </Suspense>
      </ErrorBoundary>
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
    switch (currentView) {
      case 'live':    return <LiveDashboard onPlayerClick={handlePlayerClick} onPartyClick={handlePartyClick} isAdmin={isAdmin} />;
      case 'roster':  return <GuildRoster onPlayerClick={handlePlayerClick} isAdmin={isAdmin} />;
      case 'attendance': return <WarAttendance onPlayerClick={handlePlayerClick} />;
      case 'respawns': return <RespawnTracker isAdmin={isAdmin} />;
      case 'invite': return <InviteRequest />;
      case 'bazaar': return <BazaarSniper />;
      case 'radar':   return <RadarHunters isAdmin={isAdmin} />;
      case 'tracker': return <GlobalTracker onPlayerClick={handlePlayerClick} />;
      case 'extreme': return <ExtremeAnalytics />;
      case 'planilha': return <PlanilhaManager isAdmin={isAdmin} />;
      case 'bank':    return <GuildBank isAdmin={isAdmin} />;
      case 'market':  return <GuildMarket isAdmin={isAdmin} />;
      case 'party':   return <PartyDashboard party={selectedParty} onPlayerClick={handlePlayerClick} />;
      case 'contribute': return <Contribute />;
      case 'guild_perks': 
      case 'pearks':   return <GuildPerks isAdmin={isAdmin} />;
      case 'admin':   return isAdmin ? <AdminPanel /> : null;
      case 'workers': return isAdmin ? <WorkerDashboard /> : null;
      case 'admin_dashboard': return <AdminDashboard />;
      case 'analytics': return <Rankings isAdmin={isAdmin} />;
      case 'players':
        return (
          <div className="p-8 max-w-7xl mx-auto w-full">
            <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Investigação de Membro</h2>
            <p className="text-gray-400 mb-8 font-sans">Verifique a eficiência, histórico criminal e aplique punições ao jogador.</p>
            <PlayerDashboard playerName={selectedPlayer} isAdmin={isAdmin} />
          </div>
        );
      default: return <LiveDashboard onPlayerClick={handlePlayerClick} onPartyClick={handlePartyClick} isAdmin={isAdmin} />;
    }
  };

  // FIX: antes `isAdmin === false` impedia que admins vissem o loading.
  // Agora: mostra loading apenas se visibleTabs ainda não carregou e NÃO é admin.
  // Admins veem tudo de qualquer jeito, então podem renderizar sem esperar.
  if (visibleTabs === null && !isAdmin) return null;

  return (
    <div className="min-h-screen bg-tibia-bg bg-tibia-pattern">
      <TopNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdmin={isAdmin}
        visibleTabs={visibleTabs ?? DEFAULT_VISIBLE_TABS}
      />
      
      {/* Banner de Publicidade / Patrocinador Oficial */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-2">
        <AdBanner />
      </div>

      <main className="w-full">
        <ErrorBoundary>
          <Suspense fallback={<ModuleFallback />}>
            {renderView()}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
