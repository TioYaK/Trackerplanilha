import React, { useState, useEffect, Suspense, lazy } from 'react';
import TopNav from './components/TopNav';
import ErrorBoundary from './components/ErrorBoundary';
import AdBanner from './components/AdBanner';
import PremiumGate from './components/PremiumGate';
import GuildGate from './components/GuildGate';
import { useAuth } from './components/AuthContext';
import { LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { trackPageView } from './lib/telemetry';

import RubinotHome from './views/RubinotHome';

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
const WorkerDashboard = lazy(() => import('./views/WorkerDashboard'));
const GuildPerks = lazy(() => import('./views/GuildPerks'));
const GiveawayDraw = lazy(() => import('./views/GiveawayDraw'));
const DeveloperHub = lazy(() => import('./views/DeveloperHub'));
const PrivacyPolicy = lazy(() => import('./views/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./views/TermsOfService'));
const AboutUs = lazy(() => import('./views/AboutUs'));
const GuidesHub = lazy(() => import('./views/GuidesHub'));
import Footer from './components/Footer';
import PlayerModal from './components/PlayerModal';
import GlobalSearchModal from './components/GlobalSearchModal';

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
  'live', 'bazaar', 'guides', 'sorteio', 'attendance', 'tracker', 'analytics', 'developers', 'contribute',
  'planilha', 'planilha_live', 'roster', 'invite',
  'radar', 'extreme'
];

const ROUTE_TO_VIEW = {
  '/': 'home',
  '/home': 'home',
  '/live': 'home',
  '/guias': 'guides',
  '/guides': 'guides',
  '/artigos': 'guides',
  '/conteudo': 'guides',
  '/api': 'developers',
  '/developers': 'developers',
  '/dev': 'developers',
  '/devs': 'developers',
  '/sorteio': 'sorteio',
  '/sorteios': 'sorteio',
  '/giveaway': 'sorteio',
  '/attendance': 'attendance',
  '/mortes': 'attendance',
  '/frags': 'attendance',
  '/tracker': 'tracker',
  '/global': 'tracker',
  '/analytics': 'analytics',
  '/rankings': 'analytics',
  '/contribute': 'contribute',
  '/worker': 'contribute',
  '/workers-vip': 'contribute',
  '/bazaar': 'bazaar',
  '/sniper': 'bazaar',
  '/radar': 'radar',
  '/spy': 'radar',
  '/extreme': 'extreme',
  '/bi': 'extreme',
  '/planilha': 'planilha',
  '/caves': 'planilha',
  '/hunts': 'planilha',
  '/planilha-live': 'planilha_live',
  '/respawns': 'respawns',
  '/regras': 'respawns',
  '/roster': 'roster',
  '/membros': 'roster',
  '/bank': 'bank',
  '/banco': 'bank',
  '/market': 'market',
  '/mercado': 'market',
  '/perks': 'guild_perks',
  '/guild-perks': 'guild_perks',
  '/guild_perks': 'guild_perks',
  '/pearks': 'guild_perks',
  '/invite': 'invite',
  '/invites': 'invite',
  '/convite': 'invite',
  '/admin': 'admin',
  '/painel': 'admin',
  '/workers': 'workers',
  '/c2': 'workers',
  '/admin-dashboard': 'admin_dashboard',
  '/dashboard': 'admin_dashboard',
  '/auth': 'auth',
  '/login': 'auth',
  '/cadastro': 'auth',
  '/party': 'party',
  '/player': 'players',
  '/players': 'players',
  '/privacy': 'privacy',
  '/privacidade': 'privacy',
  '/terms': 'terms',
  '/termos': 'terms',
  '/about': 'about',
  '/sobre': 'about',
};

const VIEW_TO_ROUTE = {
  home: '/',
  live: '/',
  developers: '/api',
  api: '/api',
  sorteio: '/sorteio',
  giveaway: '/sorteio',
  attendance: '/attendance',
  tracker: '/tracker',
  analytics: '/analytics',
  contribute: '/contribute',
  bazaar: '/bazaar',
  radar: '/radar',
  extreme: '/extreme',
  planilha: '/planilha',
  planilha_live: '/planilha-live',
  respawns: '/respawns',
  roster: '/roster',
  bank: '/bank',
  market: '/market',
  guild_perks: '/perks',
  pearks: '/perks',
  invite: '/invite',
  admin: '/admin',
  workers: '/workers',
  admin_dashboard: '/admin-dashboard',
  auth: '/auth',
  players: '/players',
  party: '/party',
  privacy: '/privacy',
  terms: '/terms',
  about: '/about',
  guides: '/guias',
};

const VIEW_TITLES = {
  home: 'Rubinot Tracker | Portal Central',
  live: 'Rubinot Tracker | Portal Central',
  guides: 'Rubinot Tracker | Guias, Estratégias & Artigos 📜',
  developers: 'Rubinot Tracker | API para Desenvolvedores ⚡',
  sorteio: 'Rubinot Tracker | Sorteios da Comunidade 🎁',
  attendance: 'Rubinot Tracker | Mural de Mortes & Frags',
  tracker: 'Rubinot Tracker | Monitor Global de Players',
  analytics: 'Rubinot Tracker | Rankings Globais',
  contribute: 'Rubinot Tracker | Baixar Worker & Acesso VIP',
  bazaar: 'Rubinot Tracker | Bazaar Sniper Mega Premium 💎',
  privacy: 'Rubinot Tracker | Política de Privacidade',
  terms: 'Rubinot Tracker | Termos de Serviço',
  about: 'Rubinot Tracker | Sobre a Plataforma',
  radar: 'Rubinot Tracker | Radar de Inimigos (Warmode Spy) 👑',
  extreme: 'Rubinot Tracker | Extreme BI & Inteligência Avançada 👑',
  planilha: 'Rubinot Tracker | Controle de Hunts & Caves',
  planilha_live: 'Rubinot Tracker | Monitor de Caves Ao Vivo',
  respawns: 'Rubinot Tracker | Respawns & Regras',
  roster: 'Rubinot Tracker | Exército da Guilda',
  bank: 'Rubinot Tracker | Tesouraria da Guilda',
  market: 'Rubinot Tracker | Mercado Interno',
  guild_perks: 'Rubinot Tracker | Perks da Guilda',
  invite: 'Rubinot Tracker | Solicitar Convite In-Game',
  admin: 'Rubinot Tracker | Painel de Controle Admin',
  workers: 'Rubinot Tracker | Comando & Controle (C2)',
  admin_dashboard: 'Rubinot Tracker | Central de Inteligência de Workers',
  auth: 'Rubinot Tracker | Entrar ou Cadastrar',
  party: 'Rubinot Tracker | Painel de Party',
};

function parseCurrentLocation() {
  if (typeof window === 'undefined') return { view: 'home', player: null };
  const rawPath = window.location.pathname.toLowerCase();
  const path = (rawPath.length > 1 && rawPath.endsWith('/')) ? rawPath.slice(0, -1) : rawPath;

  if (path.startsWith('/player/')) {
    const rawName = window.location.pathname.slice(8);
    const decoded = decodeURIComponent(rawName).trim();
    if (decoded) return { view: 'players', player: decoded };
  }
  if (path.startsWith('/players/')) {
    const rawName = window.location.pathname.slice(9);
    const decoded = decodeURIComponent(rawName).trim();
    if (decoded) return { view: 'players', player: decoded };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const queryPlayer = searchParams.get('player') || searchParams.get('name') || searchParams.get('char');
  if ((path === '/player' || path === '/players') && queryPlayer) {
    return { view: 'players', player: decodeURIComponent(queryPlayer).trim() };
  }

  const mappedView = ROUTE_TO_VIEW[path] || 'home';
  return { view: mappedView, player: queryPlayer ? decodeURIComponent(queryPlayer).trim() : null };
}

export default function App() {
  const { user, profile, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState(() => parseCurrentLocation().view);
  const [selectedPlayer, setSelectedPlayer] = useState(() => parseCurrentLocation().player);
  const [selectedParty, setSelectedParty] = useState(null);
  const [visibleTabs, setVisibleTabs] = useState(null);
  const [hasActiveWorker, setHasActiveWorker] = useState(false);
  const [inspectedPlayer, setInspectedPlayer] = useState(null);
  const [inspectedPlayerWorld, setInspectedPlayerWorld] = useState(null);
  const [previousView, setPreviousView] = useState('home');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Atalho Global de Busca Rápida: Ctrl + K ou Cmd + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateView = (view, extra = {}) => {
    if (currentView !== 'players' && view !== currentView) {
      setPreviousView(currentView);
    }
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      let targetPath = VIEW_TO_ROUTE[view] || '/';
      let title = VIEW_TITLES[view] || 'Rubinot Tracker';

      if (view === 'players') {
        const pName = extra.player || selectedPlayer;
        if (pName) {
          targetPath = `/player/${encodeURIComponent(pName)}`;
          title = `Rubinot Tracker | ${pName}`;
        }
      }

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view, ...extra }, '', targetPath);
      }
      document.title = title;

      if (extra.smooth !== false) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const { view, player } = parseCurrentLocation();
      setCurrentView(view);
      if (player) {
        setSelectedPlayer(player);
      }
      const title = VIEW_TITLES[view] || (view === 'players' && player ? `Rubinot Tracker | ${player}` : 'Rubinot Tracker');
      document.title = title;
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const title = VIEW_TITLES[currentView] || (currentView === 'players' && selectedPlayer ? `Rubinot Tracker | ${selectedPlayer}` : 'Rubinot Tracker');
    document.title = title;
  }, [currentView, selectedPlayer]);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.email?.toLowerCase() === 'pifot16@gmail.com';
  const isGuildMember = profile?.status === 'active';

  // Concede Premium automático para quem tem um worker ativo (local na porta 3001 ou remoto via heartbeat)
  useEffect(() => {
    let isMounted = true;

    const checkWorker = async () => {
      try {
        // 1. Detecção Local Instantânea (para quem roda o worker no próprio PC)
        if (typeof window !== 'undefined') {
          try {
            const localRes = await fetch('http://localhost:3001/api/health', {
              signal: AbortSignal.timeout(1500)
            });
            if (localRes.ok) {
              const localData = await localRes.json();
              if (localData && localData.status === 'online') {
                if (isMounted) setHasActiveWorker(true);
                return;
              }
            }
          } catch (localErr) {
            // Worker não está rodando neste localhost, segue para verificação remota
          }
        }

        // 2. Detecção Remota via Supabase (para quem roda em outro computador / VPS)
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('worker_heartbeats')
          .select('metadata')
          .gte('last_ping', fifteenMinsAgo);

        if (data && isMounted) {
          const charName = (profile?.main_character || '').toLowerCase();
          const pName = (profile?.name || '').toLowerCase();
          const pEmail = (profile?.email || user?.email || '').toLowerCase();

          const match = data.some(w => {
            const owner = (w.metadata?.owner || '').toLowerCase();
            return (
              owner &&
              owner !== 'anônimo' &&
              owner !== 'anonimo' &&
              (owner === charName || owner === pName || owner === pEmail || (charName && owner.includes(charName)))
            );
          });
          setHasActiveWorker(match);
        }
      } catch (e) {}
    };

    checkWorker();
    const interval = setInterval(checkWorker, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [profile, user]);

  const isPremium = isAdmin || profile?.role === 'premium' || profile?.is_premium === true || hasActiveWorker;

  // Telemetria assíncrona de navegação & métricas por perfil de usuário
  useEffect(() => {
    trackPageView({
      view: currentView,
      path: typeof window !== 'undefined' ? window.location.pathname : '/',
      world: profile?.makers?._world || 'Global',
      user,
      profile,
      isPremium,
      isAdmin
    });
  }, [currentView, user?.id, isPremium, isAdmin]);

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


  const handlePlayerClick = (playerName, world = null) => {
    if (!playerName) return;
    setInspectedPlayer(playerName);
    setInspectedPlayerWorld(world);
  };

  const handleOpenFullInvestigation = (playerName) => {
    setInspectedPlayer(null);
    setSelectedPlayer(playerName);
    navigateView('players', { player: playerName });
  };

  const handlePartyClick = (partyObj) => {
    setSelectedParty(partyObj);
    navigateView('party');
  };

  const renderView = () => {
    // 1. Tela de Login / Cadastro
    if (currentView === 'auth') {
      return <AuthScreen onBack={() => navigateView('live')} />;
    }

    // 2. Abas Públicas & Abertas para todo o Rubinot
    if (currentView === 'home' || currentView === 'live') {
      return (
        <RubinotHome 
          onNavigate={navigateView} 
          onPlayerClick={handlePlayerClick} 
          isPremium={isPremium} 
          user={user} 
        />
      );
    }
    if (currentView === 'guides') {
      return <GuidesHub onNavigate={navigateView} />;
    }
    if (currentView === 'sorteio' || currentView === 'giveaway') {
      return (
        <GiveawayDraw 
          isAdmin={isAdmin} 
          user={user} 
          profile={profile} 
          onNavigate={navigateView} 
        />
      );
    }
    if (currentView === 'attendance') return <WarAttendance onPlayerClick={handlePlayerClick} />;
    if (currentView === 'tracker') return <GlobalTracker onPlayerClick={handlePlayerClick} />;
    if (currentView === 'analytics') return <Rankings isAdmin={isAdmin} onPlayerClick={handlePlayerClick} />;
    if (currentView === 'developers' || currentView === 'api') {
      return (
        <DeveloperHub 
          user={user} 
          profile={profile} 
          isAdmin={isAdmin} 
          onNavigate={navigateView} 
        />
      );
    }
    if (currentView === 'contribute') return <Contribute />;
    if (currentView === 'invite') {
      return <InviteRequest defaultCharacter={profile?.main_character || ''} isPublic={!user} />;
    }
    if (currentView === 'guild_perks' || currentView === 'pearks') {
      return <GuildPerks isAdmin={isAdmin} isPublic={!user || !isGuildMember} />;
    }
    if (currentView === 'players') {
      return (
        <div className="p-8 max-w-7xl mx-auto w-full">
          <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Dossiê Tático de Jogador</h2>
          <p className="text-gray-400 mb-8 font-sans">Verifique a eficiência, histórico de combate, rankings e telemetria do guerreiro.</p>
          <PlayerDashboard 
            playerName={selectedPlayer} 
            isAdmin={isAdmin} 
            onSelectPlayer={handlePlayerClick}
            onBack={() => navigateView(previousView || 'home')}
            initialWorld={inspectedPlayerWorld}
          />
        </div>
      );
    }

    if (currentView === 'bazaar') {
      return (
        <BazaarSniper 
          isPremium={isPremium} 
          onPlayerClick={handlePlayerClick} 
          onNavigate={navigateView} 
        />
      );
    }

    if (currentView === 'radar') {
      if (isPremium) return <RadarHunters isAdmin={isAdmin} />;
      return (
        <PremiumGate 
          featureName="Radar de Inimigos (Warmode Spy) 👑"
          featureDescription="Monitore movimentações de guildas rivais em tempo real, detecção de logins de makers, alertas de invasão de respawn e relatórios de frag táticos."
          onNavigate={navigateView}
          onLogin={() => navigateView('auth')}
        />
      );
    }

    if (currentView === 'extreme') {
      if (isPremium) return <ExtremeAnalytics />;
      return (
        <PremiumGate 
          featureName="Extreme BI & Inteligência Avançada 👑"
          featureDescription="Business Intelligence profundo do servidor com gráficos de telemetria, curva de XP acumulada e dossiê investigativo."
          onNavigate={navigateView}
          onLogin={() => navigateView('auth')}
        />
      );
    }

    // 4. Abas de Gestão da Guilda 🛡️ (Gated para membros de guilda ativa)
    const guildViews = ['planilha', 'planilha_live', 'respawns', 'roster', 'bank', 'market', 'party'];
    if (guildViews.includes(currentView)) {
      const activeGuildName = profile?.makers?._guild || profile?.guild_name || 'Guilda';
      const featureTitles = {
        planilha: 'Controle de Hunts & Caves',
        planilha_live: 'Monitor de Caves (Ao Vivo)',
        respawns: 'Respawns & Regras',
        roster: `Exército da ${activeGuildName}`,
        bank: `Tesouraria da ${activeGuildName}`,
        market: 'Mercado Interno'
      };

      if (!user) {
        return (
          <GuildGate 
            featureName={featureTitles[currentView] || `Área Restrita da ${activeGuildName}`}
            onLogin={() => navigateView('auth')}
            onNavigate={navigateView}
          />
        );
      }


      if (profile?.status === 'banned' || profile?.status === 'suspended') {
        return (
          <div className="p-8 max-w-xl mx-auto text-center my-12 bg-red-950/40 border border-red-500/50 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-medieval text-red-400 mb-2">Conta Suspensa</h3>
            <p className="text-gray-300 text-sm">Seu acesso a esta funcionalidade foi suspenso por um administrador.</p>
          </div>
        );
      }

      switch (currentView) {
        case 'planilha': return <PlanilhaManager isAdmin={isAdmin} />;
        case 'planilha_live': return <LiveDashboard onPlayerClick={handlePlayerClick} onPartyClick={handlePartyClick} isAdmin={isAdmin} />;
        case 'respawns': return <RespawnTracker isAdmin={isAdmin} />;
        case 'roster': return <GuildRoster onPlayerClick={handlePlayerClick} isAdmin={isAdmin} />;
        case 'bank': return <GuildBank isAdmin={isAdmin} />;
        case 'market': return <GuildMarket isAdmin={isAdmin} />;
        case 'party': return <PartyDashboard party={selectedParty} onPlayerClick={handlePlayerClick} />;
      }
    }

    // 5. Abas Administrativas ⚙️
    if (['admin', 'workers', 'admin_dashboard'].includes(currentView)) {
      if (!isAdmin) {
        return <GuildGate featureName="Painel Administrativo" onLogin={() => navigateView('auth')} onNavigate={navigateView} />;
      }
      if (currentView === 'admin') return <AdminPanel />;
      if (currentView === 'workers') return <WorkerDashboard />;
      if (currentView === 'admin_dashboard') return <AdminDashboard />;
    }

    if (currentView === 'privacy') return <PrivacyPolicy onNavigate={navigateView} />;
    if (currentView === 'terms') return <TermsOfService onNavigate={navigateView} />;
    if (currentView === 'about') return <AboutUs onNavigate={navigateView} />;

    return (
      <RubinotHome 
        onNavigate={navigateView} 
        onPlayerClick={handlePlayerClick} 
        isPremium={isPremium} 
        user={user} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-tibia-bg bg-tibia-pattern flex flex-col">
      <TopNav
        currentView={currentView}
        setCurrentView={navigateView}
        isAdmin={isAdmin}
        isPremium={isPremium}
        hasActiveWorker={hasActiveWorker}
        isGuildMember={isGuildMember}
        user={user}
        profile={profile}
        visibleTabs={visibleTabs ?? DEFAULT_VISIBLE_TABS}
        onOpenSearch={() => setSearchModalOpen(true)}
      />
      
      {/* Banner de Publicidade Oficial (nunca exibe em telas de login ou institucionais para cumprir regras do AdSense) */}
      {!['auth', 'privacy', 'terms', 'about'].includes(currentView) && (
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

      <Footer onNavigate={navigateView} />

      {inspectedPlayer && (
        <PlayerModal
          playerName={inspectedPlayer}
          initialWorld={inspectedPlayerWorld}
          onClose={() => setInspectedPlayer(null)}
          onOpenFull={handleOpenFullInvestigation}
        />
      )}

      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={navigateView}
        onPlayerClick={handlePlayerClick}
      />
    </div>
  );
}
