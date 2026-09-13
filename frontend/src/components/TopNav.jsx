import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { 
  Crosshair, Users, Landmark, BrainCircuit, Shield, 
  Settings, LogOut, ChevronDown, Menu, X, Monitor, Database, Lock, Unlock, Server,
  Swords, LayoutDashboard, Calculator, ShoppingBag, TrendingDown, User, Activity, CalendarDays, Target,
  ShieldAlert, Search, FileSpreadsheet, Store, UserPlus, Award, Globe, Gem, LogIn, Cpu
} from 'lucide-react';
import ProfileModal from './ProfileModal';
import InstallPWA from './InstallPWA';
import PushNotificationBell from './PushNotificationBell';

export default function TopNav({ 
  currentView, 
  setCurrentView, 
  isAdmin, 
  isPremium, 
  isGuildMember, 
  user, 
  profile, 
  visibleTabs 
}) {
  const { logout } = useAuth();
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
    live: { label: 'Visão Geral & Onlines', icon: <Activity size={16} /> },
    attendance: { label: 'Mural de Mortes & Frags', icon: <CalendarDays size={16} /> },
    tracker: { label: 'Monitor Global de Players', icon: <Search size={16} /> },
    analytics: { label: 'Rankings Globais', icon: <TrendingDown size={16} /> },
    contribute: { label: 'Baixar Worker (VIP Grátis)', icon: <Cpu size={16} className="text-green-400" /> },

    // 🛡️ Guilda Shell Patrocina
    planilha: { label: 'Controle de Hunts & Caves', icon: <FileSpreadsheet size={16} /> },
    respawns: { label: 'Respawns & Regras', icon: <ShieldAlert size={16} /> },
    roster: { label: 'Exército da Guilda', icon: <Users size={16} /> },
    bank: { label: 'Tesouraria da Guilda', icon: <Landmark size={16} /> },
    market: { label: 'Mercado Interno (Trocas)', icon: <Store size={16} /> },
    guild_perks: { label: 'Perks da Guilda', icon: <Award size={16} /> },
    invite: { label: 'Recrutamento Shell Patrocina', icon: <UserPlus size={16} className="text-yellow-400" /> },

    // 💎 Mega Premium
    bazaar: { label: 'Bazaar Sniper 💎', icon: <Gem size={16} className="text-yellow-400" /> },
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
      items: ['live', 'attendance', 'tracker', 'analytics', 'contribute']
    },
    {
      title: 'Guilda Shell Patrocina',
      icon: <Shield size={18} />,
      badge: !isGuildMember ? '🔒' : null,
      items: ['planilha', 'respawns', 'roster', 'bank', 'market', 'guild_perks', 'invite']
    },
    {
      title: 'Mega Premium 💎',
      icon: <Gem size={18} className="text-yellow-400" />,
      badge: isPremium ? 'VIP' : 'PRO',
      items: ['bazaar', 'radar', 'extreme']
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
        <div className="flex items-center space-x-3">
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
              {isPremium && !isAdmin && (
                <div className="hidden sm:flex items-center px-2 py-1 rounded border border-yellow-500/50 bg-yellow-500/20 text-yellow-400 text-xs font-bold gap-1 shadow-sm">
                  <Gem size={13} className="text-yellow-400" />
                  <span>VIP</span>
                </div>
              )}

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
