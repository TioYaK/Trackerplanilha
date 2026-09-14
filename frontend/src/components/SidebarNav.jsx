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
      { id: 'rotten_blood', label: 'Rotten Blood & Timer Bakragore', icon: Skull, badge: 'ENDGAME', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
      { id: 'hunt_finder', label: 'Hunt Finder 2.0 & Rotas (105)', icon: Compass, badge: '105 HUNTS', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
      { id: 'quest_checklists', label: 'Quests & Acessos (Checklists)', icon: BookOpen, badge: 'SPOILERS', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
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
      { id: 'hunter_toolbelt', label: 'Hunter Toolbelt (Stamina/Share)', icon: Calculator, badge: 'ÚTIL', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
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
      { id: 'roster', label: 'Membros da Guilda (Roster)', icon: Users },
      { id: 'daily_spin', label: 'Roleta da Fortuna', icon: Gift },
      { id: 'sorteio', label: 'Sorteios da Comunidade', icon: Gift },
      { id: 'guides', label: 'Guias & Estratégias', icon: BookOpen },
      { id: 'tracker', label: 'Rastreador de Players', icon: Search },
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

  const totalFilteredCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.items.length, 0);
  }, [filteredGroups]);

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
        bg-gradient-to-b from-[#0c0d16]/98 via-[#07080d]/98 to-[#040508]/98 text-gray-200
        border-r border-amber-500/20
        flex flex-col justify-between 
        transition-all duration-300 ease-in-out
        shadow-[10px_0_40px_rgba(0,0,0,0.85),inset_-1px_0_0_rgba(245,158,11,0.08)]
        backdrop-blur-2xl
        ${isCollapsed ? 'w-[72px]' : 'w-64 sm:w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* ===================================================================== */}
        {/* TOPO: LOGO & STATUS DO SERVIDOR                                        */}
        {/* ===================================================================== */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-transparent">
          
          {/* Logo & Marca */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/30 via-yellow-600/20 to-black border border-amber-400/60 flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(245,158,11,0.25)] group-hover:scale-105 group-hover:border-amber-300 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all duration-300">
              <span className="text-xl filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.8)]">👑</span>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col leading-tight animate-fade-in truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-medieval text-base sm:text-lg text-gradient-gold tracking-wide truncate group-hover:brightness-110 transition-all">
                    RubinOT Tracker
                  </span>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                    v2.5
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse shrink-0" /> 
                  <span className="truncate">16 Mundos Online</span>
                  <span className="text-gray-500 text-[9px]">• 18ms</span>
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
              className="hidden lg:flex p-1.5 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 border border-white/10 text-gray-400 hover:text-amber-300 hover:border-amber-500/40 transition-all shadow-sm"
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
            <div className="relative group">
              <Search className="absolute left-2.5 top-2.5 text-amber-400/60 group-focus-within:text-amber-400 transition-colors" size={13} />
              <input
                type="text"
                placeholder="Filtrar ferramentas..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#0c0d16]/90 border border-white/10 hover:border-amber-500/40 rounded-xl pl-8 pr-7 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-500/30 transition-all shadow-inner"
              />
              {searchFilter ? (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1.5 text-gray-500 hover:text-white text-xs p-0.5"
                  title="Limpar filtro"
                >
                  <X size={12} />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-2 text-[9px] font-mono px-1 py-0.2 rounded bg-white/5 text-gray-500 border border-white/10 pointer-events-none">
                  /
                </kbd>
              )}
            </div>

            {searchFilter && (
              <div className="text-[10px] text-amber-400/90 font-mono mt-1 px-1 flex items-center justify-between animate-fade-in">
                <span>{totalFilteredCount} ferramenta{totalFilteredCount !== 1 ? 's' : ''} encontrada{totalFilteredCount !== 1 ? 's' : ''}</span>
                <span className="text-gray-500">ESC limpa</span>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* NAVEGAÇÃO PRINCIPAL COM ACORDEÕES E SUBMENUS                           */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 custom-scrollbar">
          
          {/* ATALHOS PRINCIPAIS EM DESTAQUE (Topo fixo) */}
          <div className="space-y-1.5 pb-2.5 border-b border-white/[0.08]">
            {[
              { id: 'live', label: 'Portal Central Rubinot', icon: Globe, color: 'text-amber-400', iconBg: 'bg-amber-500/15 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]', activeStyle: 'from-amber-500/25 via-amber-500/10 to-transparent border-amber-400 text-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.12)]' },
              { id: 'hunt_finder', label: 'Hunt Finder 2.0 & Rotas', icon: Compass, color: 'text-yellow-400', iconBg: 'bg-yellow-500/15 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.15)]', badge: 'NOVO', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]', activeStyle: 'from-yellow-500/25 via-yellow-500/10 to-transparent border-yellow-400 text-yellow-300 font-bold shadow-[0_0_15px_rgba(234,179,8,0.12)]' },
              { id: 'bazaar', label: 'Bazaar Sniper (Leilões)', icon: Gem, color: 'text-emerald-400', iconBg: 'bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]', badge: 'VIP', badgeColor: 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]', activeStyle: 'from-emerald-500/25 via-emerald-500/10 to-transparent border-emerald-400 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.12)]' }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-2.5 py-2.5 rounded-2xl text-xs font-semibold
                      transition-all duration-200 relative select-none
                      ${isActive 
                        ? `bg-gradient-to-r ${item.activeStyle} border-l-2` 
                        : 'text-gray-300 hover:text-white hover:bg-white/[0.06] hover:translate-x-1.5'
                      }
                      ${isCollapsed ? 'justify-center px-0' : ''}
                    `}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}>
                      <Icon size={16} className={item.color} />
                    </div>

                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left font-medium">
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
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 pointer-events-none absolute left-[70px] top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-xl bg-[#0a0b12]/98 border border-amber-500/50 text-xs font-bold text-amber-300 whitespace-nowrap shadow-2xl backdrop-blur-md transition-all flex items-center gap-2">
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
          <div className="space-y-2">
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
                        ${hasActiveChild ? 'text-amber-300' : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.04]'}
                        ${isCollapsed ? 'justify-center px-0' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                          hasActiveChild 
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]' 
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
                          <span className="text-[10px] text-gray-500 font-mono px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                            {group.items.length}
                          </span>
                          <ChevronDown 
                            size={13} 
                            className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} 
                          />
                        </div>
                      )}
                    </button>

                    {/* Popover flutuante no modo Dock (72px) ao passar o mouse */}
                    {isCollapsed && (
                      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 pointer-events-auto absolute left-[70px] top-0 z-50 py-3 px-3 rounded-2xl bg-[#090a12]/98 backdrop-blur-2xl border border-amber-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.95)] transition-all duration-150 flex flex-col gap-1 min-w-[240px]">
                        <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/10">
                          <span className="text-[11px] font-bold uppercase text-amber-300 tracking-wider flex items-center gap-2">
                            <GroupIcon size={13} className={group.accentColor} />
                            {group.title}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono bg-white/10 px-1.5 py-0.5 rounded">
                            {group.items.length}
                          </span>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                          {group.items.map(child => (
                            <button
                              key={child.id}
                              onClick={() => handleNavClick(child.id)}
                              className={`w-full flex items-center justify-between text-left text-xs py-2 px-2.5 rounded-xl transition-all ${
                                currentView === child.id 
                                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/35 shadow-sm' 
                                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className="truncate">{child.label}</span>
                              {child.badge && (
                                <span className={`text-[9px] px-1 rounded border shrink-0 ${child.badgeColor || 'border-amber-500/30'}`}>
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
                    <div className="ml-5 pl-3.5 border-l border-white/10 space-y-1 py-1.5 animate-fade-in relative">
                      {group.items.map(item => {
                        const ItemIcon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`
                              w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium
                              transition-all duration-150 select-none group/item relative
                              ${isActive 
                                ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent text-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.12)] border border-amber-500/35' 
                                : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.05] hover:translate-x-1'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 shrink-0 ${
                                isActive 
                                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] scale-125' 
                                  : 'bg-gray-600 group-hover/item:bg-amber-400/80'
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
        <div className="p-3.5 border-t border-white/10 bg-gradient-to-t from-black via-black/80 to-transparent shrink-0">
          
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div 
                onClick={onOpenProfile}
                className={`flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 group ${isCollapsed ? 'justify-center' : ''}`}
                title="Abrir Meu Perfil"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/30 via-yellow-600/20 to-black border border-amber-400/50 flex items-center justify-center text-amber-300 font-bold shrink-0 text-xs shadow-inner group-hover:border-amber-300 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all">
                  {profile?.main_character ? profile.main_character.charAt(0).toUpperCase() : 'U'}
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-200 truncate group-hover:text-amber-300 transition-colors">
                      {profile?.main_character || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      {isPremium ? '👑 VIP RubinOT' : 'Membro RubinOT'}
                    </span>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={onOpenProfile}
                  className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-gray-400 hover:text-amber-300 transition-all shadow-sm"
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
                w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 hover:from-amber-400 hover:to-yellow-500 text-black font-bold font-medieval text-xs shadow-[0_4px_15px_rgba(245,158,11,0.25)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2
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
