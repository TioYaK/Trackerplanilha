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
    iconBg: 'bg-red-500/10 border-red-500/25',
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
    iconBg: 'bg-rose-500/10 border-rose-500/25',
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
    iconBg: 'bg-emerald-500/10 border-emerald-500/25',
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
    iconBg: 'bg-indigo-500/10 border-indigo-500/25',
    borderColor: 'border-indigo-500/30',
    bgGradient: 'from-indigo-950/30 to-transparent',
    items: [
      { id: 'discord_webhooks', label: 'Webhooks Discord', icon: Bell },
      { id: 'radar', label: 'Radar de Inimigos 👑', icon: ShieldAlert, badge: 'VIP', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
      { id: 'extreme', label: 'Radar de Transfers & Mortes 👑', icon: Crosshair, badge: 'VIP', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' }
    ]
  },
  {
    id: 'community',
    title: 'Comunidade & Social',
    icon: Users,
    accentColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10 border-yellow-500/25',
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
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 
        bg-[#07080c]/98 text-gray-200
        border-r border-yellow-500/15
        flex flex-col justify-between 
        transition-all duration-300 ease-in-out
        shadow-[4px_0_30px_rgba(0,0,0,0.85)]
        backdrop-blur-2xl
        ${isCollapsed ? 'w-[72px]' : 'w-64 sm:w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* ===================================================================== */}
        {/* TOPO: LOGO & STATUS DO SERVIDOR                                        */}
        {/* ===================================================================== */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-gradient-to-r from-yellow-950/40 via-amber-950/15 to-transparent">
          
          {/* Logo & Marca */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500/30 via-amber-600/20 to-black border border-yellow-500/60 flex items-center justify-center shrink-0 shadow-lg shadow-yellow-500/20 group-hover:scale-105 group-hover:border-yellow-400 transition-all duration-300">
              <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(234,179,8,0.5)]">👑</span>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col leading-tight animate-fade-in truncate">
                <span className="font-medieval text-base sm:text-lg text-gradient-gold tracking-wide truncate group-hover:brightness-110 transition-all">
                  RubinOT Tracker
                </span>
                <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80] animate-pulse" /> 
                  <span>16 Mundos Online</span>
                </span>
              </div>
            )}
          </div>

          {/* Botão de Fechar Mobile ou Recolher Desktop */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Fechar menu"
            >
              <X size={18} />
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expandir Menu Completo' : 'Recolher para Modo Dock'}
              className="hidden lg:flex p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/40 transition-all"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* BUSCA RÁPIDA DE FERRAMENTAS NA SIDEBAR                                 */}
        {/* ===================================================================== */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-gray-500" size={13} />
              <input
                type="text"
                placeholder="Filtrar ferramentas..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-black/60 border border-white/10 hover:border-yellow-500/40 rounded-xl pl-8 pr-7 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/80 focus:ring-1 focus:ring-yellow-500/30 transition-all"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1.5 text-gray-500 hover:text-white text-xs p-0.5"
                  title="Limpar filtro"
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
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2.5 custom-scrollbar">
          
          {/* ATALHOS PRINCIPAIS EM DESTAQUE (Topo fixo) */}
          <div className="space-y-1 pb-2 border-b border-white/5">
            {[
              { id: 'live', label: 'Portal Central Rubinot', icon: Globe, color: 'text-amber-400', activeStyle: 'from-amber-500/25 via-amber-500/10 to-transparent border-amber-400' },
              { id: 'companion', label: 'Mini HUD Gamer (Monitor 2)', icon: Monitor, color: 'text-cyan-400', badge: 'HOT', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', activeStyle: 'from-cyan-500/25 via-cyan-500/10 to-transparent border-cyan-400' },
              { id: 'hunt_finder', label: 'Hunt Finder 2.0 & Rotas', icon: Compass, color: 'text-yellow-400', badge: 'NOVO', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', activeStyle: 'from-yellow-500/25 via-yellow-500/10 to-transparent border-yellow-400' }
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
                        ? `bg-gradient-to-r ${item.activeStyle} text-yellow-300 border-l-2 font-bold shadow-md shadow-yellow-500/10` 
                        : 'text-gray-300 hover:text-white hover:bg-white/5 hover:translate-x-1'
                      }
                      ${isCollapsed ? 'justify-center px-0' : ''}
                    `}
                  >
                    <div className={`p-1 rounded-lg ${isActive ? 'bg-yellow-500/20' : 'bg-white/5'} shrink-0`}>
                      <Icon size={16} className={isActive ? 'text-yellow-400' : item.color} />
                    </div>

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
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 pointer-events-none absolute left-[68px] top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-xl bg-[#0c0d14]/95 border border-yellow-500/50 text-xs font-bold text-yellow-300 whitespace-nowrap shadow-2xl backdrop-blur-md transition-all flex items-center gap-2">
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
                      ? 'bg-white/[0.03] border-white/10 shadow-sm' 
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
                        ${hasActiveChild ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
                        ${isCollapsed ? 'justify-center px-0' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                          hasActiveChild 
                            ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                            : `${group.iconBg} ${group.accentColor}`
                        }`}>
                          <GroupIcon size={14} />
                        </div>
                        
                        {!isCollapsed && (
                          <span className="truncate uppercase text-[11px] tracking-wider font-semibold">
                            {group.title}
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-500 font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                            {group.items.length}
                          </span>
                          <ChevronDown 
                            size={13} 
                            className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-yellow-400' : ''}`} 
                          />
                        </div>
                      )}
                    </button>

                    {/* Popover flutuante no modo Dock (72px) ao passar o mouse */}
                    {isCollapsed && (
                      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 pointer-events-auto absolute left-[68px] top-0 z-50 py-2.5 px-3 rounded-2xl bg-[#0c0d14]/95 backdrop-blur-xl border border-yellow-500/40 shadow-2xl transition-all duration-150 flex flex-col gap-1 min-w-[230px]">
                        <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-white/10">
                          <span className="text-[10px] font-bold uppercase text-yellow-400 tracking-wider flex items-center gap-1.5">
                            <GroupIcon size={12} />
                            {group.title}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono bg-white/10 px-1 rounded">
                            {group.items.length}
                          </span>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
                          {group.items.map(child => (
                            <button
                              key={child.id}
                              onClick={() => handleNavClick(child.id)}
                              className={`w-full flex items-center justify-between text-left text-xs py-1.5 px-2 rounded-lg transition-all ${
                                currentView === child.id 
                                  ? 'bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30' 
                                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className="truncate">{child.label}</span>
                              {child.badge && (
                                <span className={`text-[9px] px-1 rounded border shrink-0 ${child.badgeColor || 'border-yellow-500/30'}`}>
                                  {child.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ITENS DO SUBMENU (EXPANDIDO) COM LINHA GUIA ELEGANTE */}
                  {!isCollapsed && isOpen && (
                    <div className="ml-5 pl-3 border-l border-white/10 space-y-0.5 py-1 animate-fade-in relative">
                      {group.items.map(item => {
                        const ItemIcon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`
                              w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium
                              transition-all duration-150 select-none group/item relative
                              ${isActive 
                                ? 'bg-yellow-500/20 text-yellow-300 font-bold shadow-[0_0_12px_rgba(234,179,8,0.15)] border border-yellow-500/30' 
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 hover:translate-x-1'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                                isActive 
                                  ? 'bg-yellow-400 shadow-[0_0_6px_#facc15] scale-125' 
                                  : 'bg-gray-600 group-hover/item:bg-gray-400'
                              }`} />
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
        <div className="p-3 border-t border-white/10 bg-black/70 shrink-0">
          
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div 
                onClick={onOpenProfile}
                className={`flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 group ${isCollapsed ? 'justify-center' : ''}`}
                title="Abrir Meu Perfil"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500/30 to-black border border-yellow-500/50 flex items-center justify-center text-yellow-300 font-bold shrink-0 text-xs shadow-inner group-hover:border-yellow-400 transition-colors">
                  {profile?.main_character ? profile.main_character.charAt(0).toUpperCase() : 'U'}
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-200 truncate group-hover:text-yellow-400 transition-colors">
                      {profile?.main_character || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-yellow-400/90 font-semibold flex items-center gap-1">
                      {isPremium ? '👑 VIP RubinOT' : 'Membro RubinOT'}
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
                w-full py-2 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-black font-bold font-medieval text-xs shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2
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
