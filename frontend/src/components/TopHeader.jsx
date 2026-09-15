import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, Search, Globe, LogIn, User, Bell, 
  ChevronDown, Sparkles, Crosshair, Shield, Compass, Swords, Gem, 
  Skull, Calculator, Coins, BookOpen, Gift, CalendarDays, TrendingDown, Users,
  Check, LogOut, Settings, Crown, ExternalLink
} from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import { useAuth } from './AuthContext';
import InstallPWA from './InstallPWA';
import PushNotificationBell from './PushNotificationBell';

// Mapeamento de Títulos e Ícones para a Barra Superior
const VIEW_TITLES = {
  home: { title: 'Portal Central Rubinot', icon: Globe, color: 'text-amber-400' },
  live: { title: 'Portal Central Rubinot', icon: Globe, color: 'text-amber-400' },
  companion: { title: 'Mini HUD Gamer (Segundo Monitor)', icon: Crosshair, color: 'text-cyan-400' },
  hunt_finder: { title: 'Hunt Finder 2.0 & Rotas Meta', icon: Compass, color: 'text-yellow-400' },
  bazaar: { title: 'Bazaar Sniper (Leilões)', icon: Gem, color: 'text-yellow-400' },
  bazaar_flip: { title: 'Calculadora de Revenda (Flip)', icon: Calculator, color: 'text-emerald-400' },
  bazaar_fipe: { title: 'Tabela FIPE & Cotação de Chars', icon: Sparkles, color: 'text-emerald-400' },
  war_feed: { title: 'Mural de Frags & Live War', icon: Swords, color: 'text-red-400' },
  investigation: { title: 'Investigação Pro (Makers & Alts)', icon: Search, color: 'text-red-400' },
  rotten_blood: { title: 'Rotten Blood & Soul War Strategy Hub', icon: Skull, color: 'text-red-400' },
  quest_checklists: { title: 'Quests & Acessos (Checklists & Spoilers)', icon: BookOpen, color: 'text-indigo-400' },
  hunter_toolbelt: { title: "Hunter's Toolbelt (Stamina & Party Share)", icon: Calculator, color: 'text-emerald-400' },
  bis_market: { title: 'Market Board de Itens BiS & Preços Médios', icon: Gem, color: 'text-amber-400' },
  attendance: { title: 'Killboard de Guerra & Presença', icon: CalendarDays, color: 'text-gray-300' },
  guild_war: { title: 'Comparador de Guildas & War', icon: Swords, color: 'text-red-400' },
  versus: { title: 'Comparador Versus 1v1', icon: Swords, color: 'text-red-400' },
  loot_splitter: { title: 'Divisão de Loot da Party', icon: Coins, color: 'text-yellow-400' },
  exercise_calc: { title: 'Calculadora de Treino', icon: Calculator, color: 'text-yellow-400' },
  forge_calc: { title: 'Forja de Exaltação 2.0', icon: Sparkles, color: 'text-amber-400' },
  boss_tracker: { title: 'Rastreador de Bosses 20h', icon: Skull, color: 'text-purple-400' },
  wheel_planner: { title: 'Roda do Destino (Builds)', icon: Compass, color: 'text-sky-400' },
  discord_webhooks: { title: 'Central de Webhooks Discord', icon: Bell, color: 'text-indigo-400' },
  party_finder: { title: 'Party Finder (Buscar Time)', icon: Compass, color: 'text-yellow-400' },
  daily_spin: { title: 'Roleta da Fortuna', icon: Gift, color: 'text-yellow-400' },
  sorteio: { title: 'Sorteios da Comunidade', icon: Gift, color: 'text-yellow-400' },
  guides: { title: 'Guias & Estratégias', icon: BookOpen, color: 'text-yellow-400' },
  radar: { title: 'Radar de Inimigos 👑', icon: Shield, color: 'text-yellow-400' },
  extreme: { title: 'Radar de Transfers & Mortes 👑', icon: Crosshair, color: 'text-yellow-400' },
  roster: { title: 'Membros da Guilda (Roster)', icon: Users, color: 'text-yellow-400' },
  tracker: { title: 'Rastreador de Players', icon: Search, color: 'text-gray-300' },
  analytics: { title: 'Rankings Globais', icon: TrendingDown, color: 'text-gray-300' }
};

export default function TopHeader({
  currentView,
  setCurrentView,
  onOpenSearch,
  onToggleMobile,
  isCollapsed,
  setIsCollapsed,
  user,
  profile,
  isAdmin,
  isPremium,
  onOpenProfile
}) {
  const { activeWorld, setActiveWorld, activeWorldObj } = useWorld();
  const { logout } = useAuth();
  
  // Dropdown States
  const [worldDropdownOpen, setWorldDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [worldSearch, setWorldSearch] = useState('');

  const worldDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (worldDropdownRef.current && !worldDropdownRef.current.contains(event.target)) {
        setWorldDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const viewInfo = VIEW_TITLES[currentView] || { title: 'RubinOT Tracker', icon: Globe, color: 'text-yellow-400' };
  const CurrentIcon = viewInfo.icon;

  const filteredWorlds = WORLDS_LIST.filter(w => 
    w.name.toLowerCase().includes(worldSearch.toLowerCase()) || 
    w.type.toLowerCase().includes(worldSearch.toLowerCase())
  );

  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case 'Retro-PvP': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Open-PvP': return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'Optional-PvP': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

  return (
    <header className="h-16 bg-black/90 border-b border-tibia-border/60 px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-md">
      
      {/* Esquerda: Botão Menu Mobile & Título Dinâmico */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Botão Mobile para Abrir Sidebar */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          title="Abrir Menu"
        >
          <Menu size={20} />
        </button>

        {/* Título e Ícone da Página Ativa */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hidden sm:flex items-center justify-center shrink-0 shadow-sm">
            <CurrentIcon size={18} className={viewInfo.color} />
          </div>

          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-gray-100 truncate flex items-center gap-2">
              <span className="truncate">{viewInfo.title}</span>
            </h1>
            <span className="text-[10px] text-gray-400 font-mono hidden sm:flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              RubinOT Server • <strong className="text-yellow-400">{activeWorldObj?.name || activeWorld}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Direita: Busca Global, Seletor de Mundo, Notificações & Perfil */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Botão de Busca Global com Atalho Ctrl+K */}
        <button
          onClick={onOpenSearch}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 border border-tibia-border hover:border-yellow-500/60 text-xs text-gray-300 hover:text-white transition-all shadow-inner hover:shadow-yellow-500/10"
          title="Buscar Jogadores ou Ferramentas (Ctrl + K)"
        >
          <Search size={14} className="text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline font-sans">Buscar...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-gray-300 rounded border border-white/15">
            Ctrl K
          </kbd>
        </button>

        {/* Seletor de Mundo Customizado (Gamer Dropdown) */}
        <div className="relative" ref={worldDropdownRef}>
          <button
            onClick={() => setWorldDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 bg-black/80 hover:bg-black/95 border border-tibia-border hover:border-yellow-500/50 rounded-xl px-3 py-1.5 text-xs text-gray-200 transition-all shadow-sm"
            title="Selecionar Mundo do RubinOT"
          >
            <span className="text-sm">{activeWorldObj?.icon || '🌐'}</span>
            <div className="flex flex-col text-left">
              <span className="font-bold text-yellow-300 leading-tight">
                {activeWorldObj?.name || activeWorld}
              </span>
            </div>
            {activeWorldObj?.type && activeWorldObj?.type !== 'Todos' && (
              <span className={`hidden xl:inline text-[9px] px-1.5 py-0.2 rounded border font-mono ${getTypeBadgeStyle(activeWorldObj.type)}`}>
                {activeWorldObj.type}
              </span>
            )}
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${worldDropdownOpen ? 'rotate-180 text-yellow-400' : ''}`} />
          </button>

          {/* Menu Dropdown de Mundos */}
          {worldDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-neutral-950 border border-yellow-500/40 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in backdrop-blur-xl">
              <div className="p-2.5 border-b border-white/10 bg-black/40">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filtrar servidor..."
                    value={worldSearch}
                    onChange={(e) => setWorldSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/60 font-sans"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                {filteredWorlds.map(w => {
                  const isSelected = w.id.toLowerCase() === activeWorld.toLowerCase();
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        setActiveWorld(w.id);
                        setWorldDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                        isSelected 
                          ? 'bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30' 
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{w.icon}</span>
                        <div className="flex flex-col text-left min-w-0">
                          <span className="truncate">{w.name}</span>
                          {w.type !== 'Todos' && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {w.type} • Transfer: {w.transfer}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {w.type !== 'Todos' && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${getTypeBadgeStyle(w.type)}`}>
                            {w.type.replace('-PvP', '')}
                          </span>
                        )}
                        {isSelected && <Check size={14} className="text-yellow-400 ml-1 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Push Notification Bell */}
        <PushNotificationBell />

        {/* Install PWA Button */}
        <InstallPWA />

        {/* Perfil com Dropdown ou Botão de Login */}
        {user ? (
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-500/40 text-xs font-bold text-gray-200 transition-all shadow-sm"
              title="Opções de Usuário"
            >
              <div className="relative w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-500/30 to-amber-700/30 border border-yellow-500/40 flex items-center justify-center text-yellow-300 text-xs shadow-inner">
                {profile?.main_character ? profile.main_character.charAt(0).toUpperCase() : 'U'}
                {isPremium && (
                  <Crown size={9} className="absolute -top-1 -right-1 text-yellow-400 drop-shadow" />
                )}
              </div>
              <span className="hidden md:inline truncate max-w-[110px] font-sans">
                {profile?.main_character || 'Perfil'}
              </span>
              <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-yellow-400' : ''}`} />
            </button>

            {/* Dropdown de Opções do Usuário */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-neutral-950 border border-yellow-500/40 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in backdrop-blur-xl">
                <div className="p-3 border-b border-white/10 bg-black/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-300 font-bold text-sm">
                      {profile?.main_character ? profile.main_character.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-gray-100 truncate">
                        {profile?.main_character || 'Jogador'}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate font-mono">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  {isPremium && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded bg-yellow-500/20 border border-yellow-500/30 px-2 py-0.5 text-[9px] font-bold text-yellow-300">
                      <Crown size={10} /> MEMBRO VIP ATIVO
                    </div>
                  )}
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-200 hover:bg-white/5 hover:text-white transition-colors text-left"
                  >
                    <User size={14} className="text-yellow-400" />
                    <span>Meu Dossiê & Personagens</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setCurrentView('admin_dashboard');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-300 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <Shield size={14} className="text-red-400" />
                      <span>Painel Administrativo</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-white/10" />

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut size={14} />
                    <span>Encerrar Sessão</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setCurrentView('auth')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-black font-bold font-medieval text-xs shadow-md transition-all hover:scale-105 flex items-center gap-1.5"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">Entrar</span>
          </button>
        )}

      </div>
    </header>
  );
}
