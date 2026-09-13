import React, { useState, useEffect, Suspense, lazy } from 'react';
import TopNav from './components/TopNav';
import ErrorBoundary from './components/ErrorBoundary';
import AdBanner from './components/AdBanner';
import PremiumGate from './components/PremiumGate';
import GuildGate from './components/GuildGate';
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
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/invite' || path === '/invites') return 'invite';
    return 'live';
  });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [visibleTabs, setVisibleTabs] = useState(null);
  const [hasActiveWorker, setHasActiveWorker] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.email?.toLowerCase() === 'pifot16@gmail.com';
  const isGuildMember = profile?.status === 'active';

  // Concede Premium automático para quem tem um worker ativo rodando na rede
  useEffect(() => {
    if (!profile?.main_character && !profile?.name) return;
    const checkWorker = async () => {
      try {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('worker_heartbeats')
          .select('metadata')
          .gte('last_ping', fifteenMinsAgo);
        if (data) {
          const charName = (profile.main_character || '').toLowerCase();
          const pName = (profile.name || '').toLowerCase();
          const match = data.some(w => {
            const owner = (w.metadata?.owner || '').toLowerCase();
            return (owner && (owner === charName || owner === pName));
          });
          setHasActiveWorker(match);
        }
      } catch (e) {}
    };
    checkWorker();
    const interval = setInterval(checkWorker, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  const isPremium = isAdmin || profile?.role === 'premium' || profile?.is_premium === true || hasActiveWorker;

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
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-tibia-bg bg-tibia-pattern flex items-center justify-center p-4">
        <div className="text-yellow-500 font-medieval text-2xl animate-pulse">Carregando Rubinot Hub...</div>
      </div>
    );
  }

  if (user && profile?.status === 'rejected') {
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

  if (user && profile && !profile.onboarding_completed && profile.status === 'active') {
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
    // 1. Tela de Login / Cadastro
    if (currentView === 'auth') {
      return <AuthScreen onBack={() => setCurrentView('live')} />;
    }

    // 2. Abas Públicas (Acesso Aberto para todo o Rubinot)
    if (currentView === 'live') return <LiveDashboard onPlayerClick={handlePlayerClick} onPartyClick={handlePartyClick} isAdmin={isAdmin} />;
    if (currentView === 'attendance') return <WarAttendance onPlayerClick={handlePlayerClick} />;
    if (currentView === 'tracker') return <GlobalTracker onPlayerClick={handlePlayerClick} />;
    if (currentView === 'analytics') return <Rankings isAdmin={isAdmin} />;
    if (currentView === 'contribute') return <Contribute />;
    if (currentView === 'players') {
      return (
        <div className="p-8 max-w-7xl mx-auto w-full">
          <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Investigação de Membro</h2>
          <p className="text-gray-400 mb-8 font-sans">Verifique a eficiência, histórico criminal e telemetria do jogador.</p>
          <PlayerDashboard playerName={selectedPlayer} isAdmin={isAdmin} />
        </div>
      );
    }

    // 3. Abas Mega Premium 💎 (Gated para não-premium)
    if (currentView === 'bazaar') {
      if (isPremium) return <BazaarSniper />;
      return (
        <PremiumGate 
          featureName="Bazaar Sniper Mega Premium 💎"
          featureDescription="O sistema definitivo de arbitragem e monitoramento de leilões do Rubinot. Detecte chares raros e oportunidades lucrativas até 60% abaixo do preço de mercado antes de todo mundo."
          onNavigate={setCurrentView}
          onLogin={() => setCurrentView('auth')}
        />
      );
    }

    if (currentView === 'radar') {
      if (isPremium) return <RadarHunters isAdmin={isAdmin} />;
      return (
        <PremiumGate 
          featureName="Radar de Inimigos (Warmode Spy) 👑"
          featureDescription="Monitore movimentações de guildas rivais em tempo real, detecção de logins de makers, alertas de invasão de respawn e relatórios de frag táticos."
          onNavigate={setCurrentView}
          onLogin={() => setCurrentView('auth')}
        />
      );
    }

    if (currentView === 'extreme') {
      if (isPremium) return <ExtremeAnalytics />;
      return (
        <PremiumGate 
          featureName="Extreme BI & Inteligência Avançada 👑"
          featureDescription="Business Intelligence profundo do servidor com gráficos de telemetria, curva de XP acumulada e dossiê investigativo."
          onNavigate={setCurrentView}
          onLogin={() => setCurrentView('auth')}
        />
      );
    }

    // 4. Abas de Gestão da Guilda 🛡️ (Gated estritamente para membros Shell Patrocina)
    const guildViews = ['planilha', 'respawns', 'roster', 'bank', 'market', 'party', 'guild_perks', 'pearks', 'invite'];
    if (guildViews.includes(currentView)) {
      const featureTitles = {
        planilha: 'Controle de Hunts & Caves',
        invite: 'Convites In-Game da Guilda',
        respawns: 'Respawns & Regras',
        roster: 'Exército da Guilda',
        bank: 'Tesouraria da Guilda',
        market: 'Mercado Interno',
        guild_perks: 'Perks da Guilda'
      };

      if (!user) {
        return (
          <GuildGate 
            featureName={featureTitles[currentView] || 'Área Restrita da Guilda Shell Patrocina'}
            onLogin={() => setCurrentView('auth')}
            onNavigate={setCurrentView}
          />
        );
      }

      if (profile?.status === 'pending') {
        return (
          <div className="min-h-[50vh] flex items-center justify-center p-4">
            <div className="bg-black/80 border-2 border-yellow-500/40 rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
              <h2 className="text-3xl font-medieval text-yellow-500 mb-3">Conta em Análise</h2>
              <p className="text-gray-300 font-sans text-sm mb-6">
                Sua conta (Main: <strong>{profile.main_character}</strong>) foi registrada com sucesso, mas o acesso aos respawns da guilda precisa de ativação de um Administrador.
              </p>
              <button
                onClick={() => setCurrentView('live')}
                className="bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500 text-yellow-300 px-4 py-2 rounded text-xs font-bold transition-colors"
              >
                Navegar no Portal Público
              </button>
            </div>
          </div>
        );
      }

      if (profile?.status !== 'active' && !isAdmin) {
        return (
          <GuildGate 
            featureName={featureTitles[currentView] || 'Área Restrita da Guilda Shell Patrocina'}
            onLogin={() => setCurrentView('auth')}
            onNavigate={setCurrentView}
          />
        );
      }

      switch (currentView) {
        case 'planilha': return <PlanilhaManager isAdmin={isAdmin} />;
        case 'respawns': return <RespawnTracker isAdmin={isAdmin} />;
        case 'roster': return <GuildRoster onPlayerClick={handlePlayerClick} isAdmin={isAdmin} />;
        case 'bank': return <GuildBank isAdmin={isAdmin} />;
        case 'market': return <GuildMarket isAdmin={isAdmin} />;
        case 'party': return <PartyDashboard party={selectedParty} onPlayerClick={handlePlayerClick} />;
        case 'guild_perks':
        case 'pearks': return <GuildPerks isAdmin={isAdmin} />;
        case 'invite': return <InviteRequest defaultCharacter={profile?.main_character || ''} isPublic={false} />;
      }
    }

    // 5. Abas Administrativas ⚙️
    if (['admin', 'workers', 'admin_dashboard'].includes(currentView)) {
      if (!isAdmin) {
        return <GuildGate featureName="Painel Administrativo" onLogin={() => setCurrentView('auth')} onNavigate={setCurrentView} />;
      }
      if (currentView === 'admin') return <AdminPanel />;
      if (currentView === 'workers') return <WorkerDashboard />;
      if (currentView === 'admin_dashboard') return <AdminDashboard />;
    }

    return <LiveDashboard onPlayerClick={handlePlayerClick} onPartyClick={handlePartyClick} isAdmin={isAdmin} />;
  };

  return (
    <div className="min-h-screen bg-tibia-bg bg-tibia-pattern flex flex-col">
      <TopNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdmin={isAdmin}
        isPremium={isPremium}
        isGuildMember={isGuildMember}
        user={user}
        profile={profile}
        visibleTabs={visibleTabs ?? DEFAULT_VISIBLE_TABS}
      />
      
      {/* Banner de Publicidade (Oculto para assinantes Premium!) */}
      {!isPremium && currentView !== 'auth' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-2">
          <AdBanner />
        </div>
      )}

      <main className="w-full flex-1">
        <ErrorBoundary>
          <Suspense fallback={<ModuleFallback />}>
            {renderView()}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
