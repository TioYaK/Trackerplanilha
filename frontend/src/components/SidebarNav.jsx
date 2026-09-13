import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, Swords, Search, Gem, ShieldAlert, Crosshair, Gift, 
  Hammer, Skull, Compass, Calculator, Coins, BookOpen, CalendarDays, 
  TrendingDown, Code2, Cpu, Users, UserPlus, Lock, Server, 
  ChevronLeft, ChevronRight, X, LogIn, LogOut, User, Bell, 
  TrendingUp, Monitor, Sparkles, ChevronDown, Award, Zap,
  Layers, Shield, Target, Flame, Play, HelpCircle
} from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';

// Estrutura Hierárquica em Submenus e Categorias Temáticas
export const NAVIGATION_GROUPS = [
  {
    id: 'war',
    title: 'Guerra & Inteligência',
    icon: Swords,
    accentColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    bgGradient: 'from-red-950/30 to-transparent',
    items: [
      { id: 'war_feed', label: 'Mural de Frags & Live War', icon: Swords, badge: 'LIVE', badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' },
      { id: 'investigation', label: 'Investigação Pro (Makers)', icon: Search, badge: 'PRO', badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40' },
      { id: 'attendance', label: 'Killboard de Guerra & Frags', icon: CalendarDays },
      { id: 'guild_war', label: 'Comparador de Guildas & War', icon: Target },
      { id: 'versus', label: 'Comparador Versus 1v1', icon: Swords }
    ]
  },
  {
    id: 'endgame',
    title: 'Endgame & Respawns',
    icon: Skull,
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgGradient: 'from-rose-950/30 to-transparent',
    items: [
      { id: 'rotten_blood', label: 'Rotten Blood & Soul War Hub', icon: Skull, badge: 'ENDGAME', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
      { id: 'hunt_finder', label: 'Hunt Finder 2.0 & Rotas', icon: Compass, badge: 'NOVO', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
      { id: 'boss_tracker', label: 'Rastreador de Bosses 20h', icon: Skull },
      { id: 'wheel_planner', label: 'Roda do Destino (Builds)', icon: Compass },
      { id: 'forge_calc', label: 'Forja de Exaltação 2.0', icon: Hammer }
    ]
  },
  {
    id: 'market',
    title: 'Bazaar & Economia',
    icon: Gem,
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-950/30 to-transparent',
    items: [
      { id: 'bazaar', label: 'Bazaar Sniper (Leilões)', icon: Gem, badge: 'VIP', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
      { id: 'bazaar_flip', label: 'Calculadora de Revenda (Flip)', icon: Calculator },
      { id: 'bazaar_fipe', label: 'FIPE Histórica Gráfica', icon: TrendingUp, badge: '17k', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
      { id: 'loot_splitter', label: 'Divisão de Loot da Party', icon: Coins },
      { id: 'exercise_calc', label: 'Calculadora de Treino', icon: Calculator }
    ]
  },
  {
    id: 'automation',
    title: 'Automação & Spy',
    icon: Bell,
    accentColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgGradient: 'from-indigo-950/30 to-transparent',
    items: [
      { id: 'discord_webhooks', label: 'Webhooks Discord', icon: Bell },
      { id: 'radar', label: 'Radar de Inimigos 👑', icon: ShieldAlert, badge: 'VIP', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
      { id: 'extreme', label: 'Extreme BI 👑', icon: Crosshair, badge: 'VIP', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' }
    ]
  },
  {
    id: 'community',
    title: 'Comunidade & Social',
    icon: Users,
    accentColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    bgGradient: 'from-yellow-950/30 to-transparent',
    items: [
      { id: 'party_finder', label: 'Party Finder (Buscar Time)', icon: Users },
      { id: 'roster', label: 'Censo & Exército de Players', icon: Users },
      { id: 'daily_spin', label: 'Roleta da Fortuna', icon: Gift },
      { id: 'sorteio', label: 'Sorteios da Comunidade', icon: Gift },
      { id: 'guides', label: 'Guias & Estratégias', icon: BookOpen },
      { id: 'tracker', label: 'Monitor Global de Players', icon: Search },
      { id: 'analytics', label: 'Rankings Globais', icon: TrendingDown },
      { id: 'contribute', label: 'Baixar Worker (VIP Grátis)', icon: Cpu, badge: 'FREE', badgeColor: 'bg-green-500/20 text-green-300 border-green-500/40' },
      { id: 'developers', label: 'API para Desenvolvedores', icon: Code2 }
    ]
  }
];

export default function SidebarNav({
  currentView,
  setCurrentView,
  isAdmin,
  isPremium,
  user,
  profile,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
  onOpenProfile
}) {
  const { activeWorld, setActiveWorld } = useWorld();
  const [searchFilter, setSearchFilter] = useState('');
  
  // Estado dos Submenus Abertos/Fechados (Accordions)
  // Por padrão, abre o grupo que contém a view ativa
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = { featured: true };
    NAVIGATION_GROUPS.forEach(g => {
      if (g.items.some(it => it.id === currentView)) {
        initial[g.id] = true;
      }
    });
    return initial;
  });

  // Se a view mudar externamente, garante que o submenu correspondente esteja expandido
  useEffect(() => {
    NAVIGATION_GROUPS.forEach(g => {
      if (g.items.some(it => it.id === currentView)) {
        setOpenGroups(prev => ({ ...prev, [g.id]: true }));
      }
    });
  }, [currentView]);

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    if (setMobileOpen) setMobileOpen(false);
  };

  // Grupos com Admin condicional
  const groups = useMemo(() => {
    const list = [...NAVIGATION_GROUPS];
    if (isAdmin) {
      list.push({
        id: 'admin',
        title: 'Painel Administrativo',
        icon: Lock,
        accentColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        bgGradient: 'from-amber-950/30 to-transparent',
        items: [
          { id: 'admin', label: 'Painel Geral Admin', icon: Lock },
          { id: 'workers', label: 'Comando & Controle C2', icon: Server }
        ]
      });
    }
    return list;
  }, [isAdmin]);

  // Filtragem rápida se o usuário digitar na busca da sidebar
  const filteredGroups = useMemo(() => {
    if (!searchFilter.trim()) return groups;
    const q = searchFilter.toLowerCase().trim();

    return groups.map(g => {
      const matchedItems = g.items.filter(it => 
        it.label.toLowerCase().includes(q) || 
        it.id.toLowerCase().includes(q)
      );
      return {
        ...g,
        items: matchedItems,
        matches: matchedItems.length > 0
      };
    }).filter(g => g.matches || g.title.toLowerCase().includes(q));
  }, [groups, searchFilter]);

  return (
    <>
      {/* Backdrop com Blur no Mobile */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 
        bg-[#07080c] text-gray-200
        border-r border-tibia-border/70 
        flex flex-col justify-between 
        transition-all duration-300 ease-in-out shadow-2xl
        ${isCollapsed ? 'w-[72px]' : 'w-64 sm:w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* ===================================================================== */}
        {/* TOPO: LOGO & STATUS DO SERVIDOR                                        */}
        {/* ===================================================================== */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-gradient-to-r from-yellow-950/30 via-transparent to-transparent">
          
          {/* Logo & Marca */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500/30 via-amber-600/20 to-black border border-yellow-500/60 flex items-center justify-center shrink-0 shadow-lg shadow-yellow-500/10 group-hover:scale-105 transition-transform">
              <span className="text-xl">👑</span>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col leading-tight animate-fade-in truncate">
                <span className="font-medieval text-base sm:text-lg text-gradient-gold tracking-wide truncate">
                  RubinOT Tracker
                </span>
                <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> 16 Mundos Online
                </span>
              </div>
            )}
          </div>

          {/* Botão de Fechar Mobile ou Recolher Desktop */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expandir Menu Completo' : 'Recolher para Modo Dock'}
              className="hidden lg:flex p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-yellow-400 transition-all"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* BUSCA RÁPIDA DE FERRAMENTAS NA SIDEBAR                                 */}
        {/* ===================================================================== */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-gray-500" size={13} />
              <input
                type="text"
                placeholder="Filtrar ferramentas..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-black/70 border border-white/10 hover:border-yellow-500/40 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1.5 text-gray-500 hover:text-white text-xs"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* NAVEGAÇÃO PRINCIPAL COM ACORDEÕES E SUBMENUS                           */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 custom-scrollbar">
          
          {/* ATALHOS PRINCIPAIS EM DESTAQUE (Topo fixo) */}
          <div className="space-y-1 pb-2 border-b border-white/5">
            {[
              { id: 'live', label: 'Portal Central Rubinot', icon: Globe, color: 'text-amber-400' },
              { id: 'companion', label: 'Mini HUD Gamer (Monitor 2)', icon: Monitor, color: 'text-cyan-400', badge: 'HOT', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
              { id: 'hunt_finder', label: 'Hunt Finder 2.0 & Rotas', icon: Compass, color: 'text-yellow-400', badge: 'NOVO', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold
                      transition-all duration-200 relative select-none
                      ${isActive 
                        ? 'bg-gradient-to-r from-yellow-500/25 via-yellow-500/10 to-transparent text-yellow-300 border-l-2 border-yellow-400 font-bold shadow-md shadow-yellow-500/5' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5 hover:translate-x-1'
                      }
                      ${isCollapsed ? 'justify-center px-0' : ''}
                    `}
                  >
                    <Icon size={17} className={`shrink-0 ${isActive ? 'text-yellow-400' : item.color}`} />

                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Tooltip no Modo Dock (72px) */}
                  {isCollapsed && (
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none fixed left-[76px] z-50 px-3 py-1.5 rounded-xl bg-black/95 border border-yellow-500/50 text-xs font-bold text-yellow-300 whitespace-nowrap shadow-2xl transition-opacity flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] px-1 py-0.5 rounded border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SUBMENUS / ACORDEÕES TEMÁTICOS */}
          <div className="space-y-1.5">
            {filteredGroups.map(group => {
              const GroupIcon = group.icon;
              const isOpen = openGroups[group.id] || searchFilter.trim().length > 0;
              const hasActiveChild = group.items.some(it => it.id === currentView);

              return (
                <div 
                  key={group.id} 
                  className={`rounded-2xl transition-all duration-200 border ${
                    hasActiveChild 
                      ? 'bg-white/[0.02] border-white/10' 
                      : 'border-transparent hover:border-white/5'
                  }`}
                >
                  
                  {/* Cabeçalho do Submenu (Accordion Trigger) */}
                  <div className="relative group">
                    <button
                      onClick={() => !isCollapsed && toggleGroup(group.id)}
                      className={`
                        w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold
                        transition-all select-none
                        ${hasActiveChild ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-200'}
                        ${isCollapsed ? 'justify-center px-0' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GroupIcon size={16} className={`shrink-0 ${hasActiveChild ? 'text-yellow-400' : group.accentColor}`} />
                        {!isCollapsed && (
                          <span className="truncate uppercase text-[11px] tracking-wider">
                            {group.title}
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-500 font-mono px-1 rounded bg-white/5">
                            {group.items.length}
                          </span>
                          <ChevronDown 
                            size={13} 
                            className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                          />
                        </div>
                      )}
                    </button>

                    {/* Popover flutuante no modo Dock (72px) ao passar o mouse */}
                    {isCollapsed && (
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-auto fixed left-[76px] z-50 py-2 px-3 rounded-2xl bg-black/95 border border-yellow-500/50 shadow-2xl transition-opacity flex flex-col gap-1 min-w-[200px]">
                        <span className="text-[10px] font-bold uppercase text-yellow-400 tracking-wider pb-1 border-b border-white/10">
                          {group.title}
                        </span>
                        {group.items.map(child => (
                          <button
                            key={child.id}
                            onClick={() => handleNavClick(child.id)}
                            className={`flex items-center justify-between text-left text-xs py-1.5 px-2 rounded-lg transition-colors ${
                              currentView === child.id ? 'bg-yellow-500/20 text-yellow-300 font-bold' : 'text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{child.label}</span>
                            {child.badge && (
                              <span className={`text-[9px] px-1 rounded border ${child.badgeColor || 'border-yellow-500/30'}`}>
                                {child.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ITENS DO SUBMENU (EXPANDIDO) COM LINHA GUIA ELEGANTE */}
                  {!isCollapsed && isOpen && (
                    <div className="ml-4 pl-2.5 border-l border-white/10 space-y-0.5 py-1 animate-fade-in">
                      {group.items.map(item => {
                        const ItemIcon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`
                              w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium
                              transition-all duration-150 select-none
                              ${isActive 
                                ? 'bg-yellow-500/20 text-yellow-300 font-bold shadow-sm' 
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 hover:translate-x-1'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-yellow-400' : 'bg-gray-600'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>

                            {item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${item.badgeColor || 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* ===================================================================== */}
        {/* RODAPÉ DA SIDEBAR: CARD DO USUÁRIO & LOGIN                              */}
        {/* ===================================================================== */}
        <div className="p-3 border-t border-white/10 bg-black/60 shrink-0">
          
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div 
                onClick={onOpenProfile}
                className={`flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}
                title="Abrir Meu Perfil"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500/30 to-black border border-yellow-500/50 flex items-center justify-center text-yellow-300 font-bold shrink-0 text-xs shadow-inner">
                  {profile?.main_character ? profile.main_character.charAt(0).toUpperCase() : 'U'}
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-200 truncate">
                      {profile?.main_character || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-yellow-400 font-semibold flex items-center gap-1">
                      {isPremium ? '👑 VIP RubinOT' : 'Membro Comum'}
                    </span>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={onOpenProfile}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Configurações de Conta"
                >
                  <User size={15} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('auth')}
              className={`
                w-full py-2 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 text-black font-bold font-medieval text-xs shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2
                ${isCollapsed ? 'px-0' : 'px-3'}
              `}
            >
              <LogIn size={15} />
              {!isCollapsed && <span>Entrar / Cadastrar</span>}
            </button>
          )}

        </div>

      </aside>
    </>
  );
}
