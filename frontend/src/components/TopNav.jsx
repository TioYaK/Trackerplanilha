import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useWorld } from '../context/WorldContext';
import { 
  Crosshair, Users, Landmark, BrainCircuit, Shield, 
  Settings, LogOut, ChevronDown, Menu, X, Monitor, Database, Lock, Unlock, Server,
  Swords, LayoutDashboard, Calculator, ShoppingBag, TrendingDown, TrendingUp, User, Activity, CalendarDays, Target,
  ShieldAlert, Search, Bell, FileSpreadsheet, Store, UserPlus, Award, Globe, Gem, LogIn, Cpu, Gift, Code2, BookOpen,
  Compass, Coins, Hammer, Skull
} from 'lucide-react';
import ProfileModal from './ProfileModal';
import InstallPWA from './InstallPWA';
import PushNotificationBell from './PushNotificationBell';

export default function TopNav({ 
  currentView, 
  setCurrentView, 
  isAdmin, 
  isPremium, 
  hasActiveWorker,
  isGuildMember, 
  user, 
  profile, 
  visibleTabs,
  onOpenSearch 
}) {
  const { logout } = useAuth();
  const { activeWorld, setActiveWorld, worlds, activeWorldObj } = useWorld();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workerCount, setWorkerCount] = useState(0);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchWorkers = async () => {
      try {
        const cutoffLimit = new Date(Date.now() - 12 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('worker_heartbeats')
          .select('*', { count: 'exact', head: true })
          .gte('last_ping', cutoffLimit);
        setWorkerCount(count || 0);
      } catch (e) {}
    };
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 10 * 60 * 1000); // 10 minutos
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Mapeamento de views e ícones nos 4 níveis
  const viewsData = {
    // 🌐 Rubinot Público
    live: { label: 'Portal Central Rubinot', icon: <Globe size={16} /> },
    home: { label: 'Portal Central Rubinot', icon: <Globe size={16} /> },
    daily_spin: { label: 'Roleta da Fortuna 🎰', icon: <Gift size={16} className="text-yellow-400" /> },
    forge_calc: { label: 'Forja de Exaltação 2.0 🔨', icon: <Hammer size={16} className="text-amber-400" /> },
    boss_tracker: { label: 'Rastreador de Bosses 20h 🗺️', icon: <Skull size={16} className="text-purple-400" /> },
    wheel_planner: { label: 'Roda do Destino (Builds) ☸️', icon: <Compass size={16} className="text-sky-400" /> },
    hunt_finder: { label: 'Hunt Finder 2.0 & Rotas 🗺️', icon: <Compass size={16} className="text-yellow-400" /> },
    quest_checklists: { label: 'Quests & Acessos (Checklists) 📜', icon: <BookOpen size={16} className="text-indigo-400" /> },
    hunter_toolbelt: { label: 'Hunter Toolbelt (Stamina & Share) 🧰', icon: <Calculator size={16} className="text-emerald-400" /> },
    rotten_blood: { label: 'Rotten Blood & Soul War Hub 🩸', icon: <Skull size={16} className="text-red-400" /> },
    bazaar_fipe: { label: 'FIPE Histórica Gráfica 📈', icon: <TrendingUp size={16} className="text-emerald-400" /> },
    exercise_calc: { label: 'Calculadora de Treino 🧮', icon: <Calculator size={16} className="text-yellow-400" /> },
    loot_splitter: { label: 'Divisão de Loot da Party 💰', icon: <Coins size={16} className="text-yellow-400" /> },
    bazaar: { label: 'Bazaar Sniper (Leilões)', icon: <Gem size={16} className="text-yellow-400" /> },
    bazaar_flip: { label: 'Calculadora de Revenda 💰', icon: <Calculator size={16} className="text-emerald-400" /> },
    discord_webhooks: { label: 'Alertas Discord 📢', icon: <Bell size={16} className="text-indigo-400" /> },
    investigation: { label: 'Investigação Pro (Makers) 🕵️‍♂️', icon: <Search size={16} className="text-red-400" /> },
    war_feed: { label: 'Mural de Frags & Live War ⚔️', icon: <Swords size={16} className="text-red-400" /> },
    companion: { label: 'Mini HUD Gamer (Monitor 2) 🖥️', icon: <Monitor size={16} className="text-cyan-400" /> },
    versus: { label: 'Comparador Versus ⚔️', icon: <Swords size={16} className="text-red-400" /> },
    guides: { label: 'Guias & Estratégias 📜', icon: <BookOpen size={16} className="text-yellow-400" /> },
    sorteio: { label: 'Sorteios da Comunidade 🎁', icon: <Gift size={16} className="text-yellow-400" /> },
    attendance: { label: 'Killboard de Guerra & Frags', icon: <CalendarDays size={16} /> },
    tracker: { label: 'Monitor Global de Players', icon: <Search size={16} /> },
    analytics: { label: 'Rankings Globais', icon: <TrendingDown size={16} /> },
    developers: { label: 'API para Devs ⚡', icon: <Code2 size={16} className="text-yellow-400" /> },
    contribute: { label: 'Baixar Worker (VIP Grátis)', icon: <Cpu size={16} className="text-green-400" /> },

    // 🛡️ Comunidade & Guildas
    guild_war: { label: 'Comparador de Guildas & War 🎯', icon: <Swords size={16} className="text-red-400" /> },
    party_finder: { label: 'Party Finder (Buscador de Time) 🏆', icon: <Users size={16} className="text-yellow-400" /> },
    roster: { label: 'Censo & Exército de Jogadores', icon: <Users size={16} /> },
    invite: { label: 'Solicitar Convite In-Game', icon: <UserPlus size={16} /> },

    // 💎 Mega Premium
    radar: { label: 'Radar de Inimigos 👑', icon: <ShieldAlert size={16} className="text-yellow-400" /> },
    extreme: { label: 'Extreme BI 👑', icon: <Crosshair size={16} className="text-yellow-400" /> },

    // ⚙️ Administração
    admin: { label: 'Painel Admin', icon: <Lock size={16} /> },
    workers: { label: 'Comando & Controle (C2)', icon: <Server size={16} /> },
  };

  // Agrupamento para os Dropdowns em 4 Níveis Estratégicos
  let menuGroups = [
    {
      title: 'Rubinot Público',
      icon: <Globe size={18} />,
      items: ['live', 'war_feed', 'companion', 'investigation', 'daily_spin', 'forge_calc', 'boss_tracker', 'wheel_planner', 'hunt_finder', 'quest_checklists', 'hunter_toolbelt', 'rotten_blood', 'exercise_calc', 'loot_splitter', 'versus', 'attendance', 'guides', 'sorteio', 'tracker', 'analytics', 'developers', 'contribute']
    },
    {
      title: 'Comunidade & Guildas',
      icon: <Users size={18} />,
      items: ['guild_war', 'party_finder', 'roster', 'invite']
    },
    {
      title: 'Mega Premium 💎',
      icon: <Gem size={18} className="text-yellow-400" />,
      badge: isPremium ? 'VIP' : 'PRO',
      items: ['bazaar', 'bazaar_flip', 'bazaar_fipe', 'discord_webhooks', 'radar', 'extreme', 'companion']
    }
  ];

  // Se for admin, adicionamos o Painel Admin ao final
  if (isAdmin) {
    menuGroups.push({
      title: 'Administração',
      icon: <Lock size={18} />,
      items: ['admin', 'workers']
    });
  }

  // Identifica a qual grupo a aba atual pertence para manter ele "Aceso"
  const getActiveGroupIndex = () => {
    return menuGroups.findIndex(g => g.items.includes(currentView));
  };
  const activeGroup = getActiveGroupIndex();

  return (
    <div className="bg-tibia-wood border-b-4 border-tibia-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 flex justify-between items-center h-16">
        
        {/* Logo Section */}
        <div 
          onClick={() => setCurrentView('live')}
          className="flex items-center space-x-3 shrink-0 cursor-pointer select-none"
        >
          <img src="/logo.jpg" alt="Rubinot Logo" className="w-10 h-10 rounded-full border-2 border-tibia-highlight shadow-tibia-glow" />
          <div className="hidden sm:block">
            <h1 className="text-xl lg:text-2xl font-medieval text-tibia-highlight tracking-wider shadow-black drop-shadow-md">
              Rubinot <span className="text-white">Tracker</span>
            </h1>
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex items-center space-x-2 xl:space-x-4">
          {menuGroups.map((group, index) => (
            <div key={index} className="relative group">
              {/* Categoria Pai */}
              <button className={`flex items-center space-x-2 px-3 py-2 rounded font-medieval transition-all duration-300 ${
                activeGroup === index 
                  ? 'text-white border-b-2 border-tibia-highlight' 
                  : 'text-tibia-primary hover:text-white'
              }`}>
                {group.icon}
                <span className="text-md tracking-wide">{group.title}</span>
                {group.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    group.badge === 'VIP' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40' : 'bg-black/50 text-gray-400'
                  }`}>
                    {group.badge}
                  </span>
                )}
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>

              {/* Menu Dropdown Escondido */}
              <div className="absolute left-0 mt-2 w-56 bg-black/95 border border-tibia-border rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0">
                <div className="py-2">
                  {group.items.map(itemId => (
                    <button
                      key={itemId}
                      onClick={() => setCurrentView(itemId)}
                      className={`w-full text-left flex items-center space-x-3 px-4 py-3 font-sans text-sm transition-colors ${
                        currentView === itemId 
                          ? 'bg-tibia-primary/20 text-tibia-highlight border-l-2 border-tibia-highlight' 
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`${currentView === itemId ? 'text-tibia-highlight' : 'text-gray-400'}`}>
                        {viewsData[itemId]?.icon}
                      </span>
                      <span>{viewsData[itemId]?.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Right Icons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Botão de Busca Rápida / Spotlight (Ctrl + K) */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/60 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-all shadow-md group cursor-pointer"
            title="Busca Rápida Global (Ctrl + K)"
          >
            <Search size={14} className="text-yellow-400 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline font-sans">Buscar...</span>
            <kbd className="hidden lg:inline-block text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400 font-mono">
              Ctrl K
            </kbd>
          </button>

          {/* Seletor Global de Servidor / Mundo */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-yellow-500/40 bg-black/60 hover:bg-black/80 text-yellow-300 font-medieval text-xs shadow-md transition-all hover:scale-105 active:scale-95" title={`Servidor Ativo: ${activeWorldObj.name}`}>
              <span className="text-sm">{activeWorldObj.icon}</span>
              <span className="font-bold tracking-wide hidden md:inline">{activeWorldObj.shortName}</span>
              <ChevronDown size={13} className="text-yellow-500/80 group-hover:rotate-180 transition-transform duration-200" />
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-black/95 border border-yellow-500/40 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1.5 space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-white/10">
                Selecione o Servidor
              </div>
              {worlds.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setActiveWorld(w.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-sans transition-all ${
                    activeWorld.toLowerCase() === w.id.toLowerCase()
                      ? 'bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/40'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{w.icon}</span>
                    <span>{w.name}</span>
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">{w.type}</span>
                </button>
              ))}
            </div>
          </div>

          <PushNotificationBell />
          <InstallPWA />
          
          {isAdmin && (
            <button onClick={() => setCurrentView('admin_dashboard')} className="flex items-center px-3 py-1.5 rounded border bg-green-900/20 hover:bg-green-900/40 text-green-400 border-green-900/50 cursor-pointer transition-colors" title="Ver Central de Inteligência">
              <Server size={16} className="mr-0 sm:mr-2" />
              <span className="text-xs font-bold uppercase hidden sm:inline">{workerCount} WORKERS</span>
            </button>
          )}

          {isAdmin && (
            <div className="flex items-center px-3 py-1.5 rounded border bg-red-900/40 text-red-400 border-red-900/50 cursor-default" title="Modo Administrador Ativo">
              <Unlock size={16} className="mr-0 sm:mr-2" />
              <span className="text-xs font-bold uppercase hidden sm:inline">Admin</span>
            </div>
          )}

          {user ? (
            <>
              {hasActiveWorker ? (
                <div 
                  className="flex items-center px-2.5 py-1 rounded border border-green-500/50 bg-green-950/60 text-green-400 text-xs font-bold gap-1.5 shadow-md cursor-help"
                  title="Acesso VIP Ativo: Worker conectado e enviando telemetria em tempo real!"
                >
                  <Cpu size={13} className="text-green-400 animate-pulse" />
                  <span className="hidden sm:inline">VIP Worker</span>
                  <span className="sm:hidden">VIP</span>
                </div>
              ) : (isPremium && !isAdmin && (
                <div className="hidden sm:flex items-center px-2 py-1 rounded border border-yellow-500/50 bg-yellow-500/20 text-yellow-400 text-xs font-bold gap-1 shadow-sm">
                  <Gem size={13} className="text-yellow-400" />
                  <span>VIP</span>
                </div>
              ))}

              <button 
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center px-3 py-1.5 rounded transition-colors border bg-blue-900/30 text-blue-400 border-blue-800 hover:text-white hover:bg-blue-900/50"
                title="Meu Perfil"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-5 h-5 rounded-full object-cover border border-tibia-highlight mr-0 sm:mr-2 shrink-0 bg-black/60" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <User size={16} className="mr-0 sm:mr-2" />
                )}
                <span className="text-xs font-bold uppercase hidden sm:inline">
                  {profile?.main_character ? profile.main_character.split(' ')[0] : 'Perfil'}
                </span>
              </button>

              <button 
                onClick={logout}
                className="flex items-center px-3 py-1.5 rounded transition-colors border bg-black/30 text-gray-500 border-gray-800 hover:text-white hover:bg-black/50"
                title="Sair do Sistema"
              >
                <LogOut size={16} className="mr-0 sm:mr-2" />
                <span className="text-xs font-bold uppercase hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setCurrentView('auth')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-black font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <LogIn size={15} />
              <span className="hidden sm:inline">Entrar / Cadastrar</span>
              <span className="sm:hidden">Entrar</span>
            </button>
          )}

          {/* Botão Menu Mobile */}
          <button 
            className="lg:hidden p-2 text-tibia-primary hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {profileModalOpen && <ProfileModal onClose={() => setProfileModalOpen(false)} />}

      {/* Backdrop: fecha o menu mobile ao clicar fora */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-16 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-black/95 border-b-2 border-tibia-border max-h-[80vh] overflow-y-auto z-50">
          <div className="p-4 space-y-6">
            
            {/* Busca Rápida Mobile */}
            <div className="pb-3 border-b border-tibia-border/50">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSearch?.();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black/60 border border-yellow-500/40 text-yellow-300 font-bold text-xs"
              >
                <Search size={16} /> Buscar Jogador, Mundo ou Guia...
              </button>
            </div>

            {/* Seletor de Mundo Mobile */}
            <div className="pb-3 border-b border-tibia-border/50">
              <label className="block text-[11px] font-bold text-yellow-400 uppercase tracking-wider mb-2 font-medieval">
                Servidor Rubinot Ativo
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {worlds.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setActiveWorld(w.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-sans text-left transition-all ${
                      activeWorld.toLowerCase() === w.id.toLowerCase()
                        ? 'bg-yellow-500/30 text-yellow-300 font-bold border border-yellow-500/50'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{w.icon}</span>
                    <span className="truncate">{w.shortName}</span>
                  </button>
                ))}
              </div>
            </div>

            {!user && (
              <div className="pb-3 border-b border-tibia-border/50">
                <button
                  onClick={() => {
                    setCurrentView('auth');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-600 to-amber-700 text-black font-bold font-medieval text-base shadow-lg"
                >
                  <LogIn size={18} /> Entrar / Criar Conta
                </button>
              </div>
            )}
            {menuGroups.map((group, index) => (
              <div key={index}>
                <h3 className="flex items-center space-x-2 font-medieval text-tibia-highlight text-lg mb-2 pb-2 border-b border-tibia-border/50">
                  {group.icon}
                  <span>{group.title}</span>
                </h3>
                <div className="space-y-1">
                  {group.items.map(itemId => (
                    <button
                      key={itemId}
                      onClick={() => {
                        setCurrentView(itemId);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded font-sans text-sm transition-colors ${
                        currentView === itemId
                          ? 'bg-tibia-primary/30 text-white font-bold'
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {viewsData[itemId]?.icon}
                      <span>{viewsData[itemId]?.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
