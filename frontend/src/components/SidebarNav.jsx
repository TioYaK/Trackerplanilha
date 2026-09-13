import React, { useState, useEffect } from 'react';
import { 
  Globe, Swords, Search, Gem, ShieldAlert, Crosshair, Gift, 
  Hammer, Skull, Compass, Calculator, Coins, BookOpen, CalendarDays, 
  TrendingDown, Code2, Cpu, Users, UserPlus, Lock, Server, 
  ChevronLeft, ChevronRight, X, LogIn, LogOut, User, Bell, 
  TrendingUp, Monitor, Sparkles, ChevronDown, Award
} from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';

export const SIDEBAR_SECTIONS = [
  {
    id: 'featured',
    title: 'Destaques',
    items: [
      { id: 'live', label: 'Portal Central', icon: Globe, color: 'text-amber-400' },
      { id: 'companion', label: 'Mini HUD Gamer (Monitor 2)', icon: Monitor, color: 'text-cyan-400', badge: 'HOT', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
      { id: 'hunt_finder', label: 'Hunt Finder 2.0 & Rotas', icon: Compass, color: 'text-yellow-400', badge: 'NOVO', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
      { id: 'bazaar', label: 'Bazaar Sniper', icon: Gem, color: 'text-yellow-400', badge: 'VIP', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
    ]
  },
  {
    id: 'war',
    title: 'Guerra & Inteligência',
    items: [
      { id: 'war_feed', label: 'Mural de Frags & Live War', icon: Swords, color: 'text-red-400', badge: 'LIVE', badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' },
      { id: 'investigation', label: 'Investigação Pro (Makers)', icon: Search, color: 'text-red-400', badge: 'PRO', badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40' },
      { id: 'attendance', label: 'Killboard & Presença', icon: CalendarDays, color: 'text-gray-300' },
      { id: 'guild_war', label: 'Comparador de Guildas', icon: Swords, color: 'text-red-400' },
      { id: 'versus', label: 'Comparador Versus 1v1', icon: Swords, color: 'text-red-400' }
    ]
  },
  {
    id: 'endgame',
    title: 'Endgame & Respawns',
    items: [
      { id: 'rotten_blood', label: 'Rotten Blood & Soul War Hub', icon: Skull, color: 'text-red-400', badge: 'ENDGAME', badgeColor: 'bg-red-600/20 text-red-300 border-red-500/40' },
      { id: 'boss_tracker', label: 'Rastreador de Bosses 20h', icon: Skull, color: 'text-purple-400' },
      { id: 'wheel_planner', label: 'Roda do Destino (Builds)', icon: Compass, color: 'text-sky-400' },
      { id: 'forge_calc', label: 'Forja de Exaltação 2.0', icon: Hammer, color: 'text-amber-400' }
    ]
  },
  {
    id: 'market',
    title: 'Mercado & Economia',
    items: [
      { id: 'bazaar_flip', label: 'Calculadora de Revenda (Flip)', icon: Calculator, color: 'text-emerald-400' },
      { id: 'bazaar_fipe', label: 'FIPE Histórica Gráfica', icon: TrendingUp, color: 'text-emerald-400', badge: '17k', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
      { id: 'loot_splitter', label: 'Divisão de Loot da Party', icon: Coins, color: 'text-yellow-400' },
      { id: 'exercise_calc', label: 'Calculadora de Treino', icon: Calculator, color: 'text-yellow-400' }
    ]
  },
  {
    id: 'automation',
    title: 'Automação & Alertas',
    items: [
      { id: 'discord_webhooks', label: 'Webhooks Discord', icon: Bell, color: 'text-indigo-400' },
      { id: 'radar', label: 'Radar de Inimigos', icon: ShieldAlert, color: 'text-yellow-400', badge: 'VIP', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
      { id: 'extreme', label: 'Extreme BI', icon: Crosshair, color: 'text-yellow-400', badge: 'VIP', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' }
    ]
  },
  {
    id: 'community',
    title: 'Comunidade & Social',
    items: [
      { id: 'party_finder', label: 'Party Finder (Buscar Time)', icon: Users, color: 'text-yellow-400' },
      { id: 'roster', label: 'Censo & Exército de Players', icon: Users, color: 'text-gray-300' },
      { id: 'daily_spin', label: 'Roleta da Fortuna', icon: Gift, color: 'text-yellow-400' },
      { id: 'sorteio', label: 'Sorteios da Comunidade', icon: Gift, color: 'text-yellow-400' },
      { id: 'guides', label: 'Guias & Estratégias', icon: BookOpen, color: 'text-yellow-400' },
      { id: 'tracker', label: 'Monitor Global de Players', icon: Search, color: 'text-gray-300' },
      { id: 'analytics', label: 'Rankings Globais', icon: TrendingDown, color: 'text-gray-300' },
      { id: 'contribute', label: 'Baixar Worker (VIP Grátis)', icon: Cpu, color: 'text-green-400', badge: 'FREE', badgeColor: 'bg-green-500/20 text-green-300 border-green-500/40' },
      { id: 'developers', label: 'API para Desenvolvedores', icon: Code2, color: 'text-yellow-400' }
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
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (secId) => {
    setCollapsedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    if (setMobileOpen) setMobileOpen(false);
  };

  // Seção de Admin adicionada se o usuário for administrador
  const sections = [...SIDEBAR_SECTIONS];
  if (isAdmin) {
    sections.push({
      id: 'admin',
      title: 'Administração',
      items: [
        { id: 'admin', label: 'Painel Admin', icon: Lock, color: 'text-red-400' },
        { id: 'workers', label: 'Comando & Controle C2', icon: Server, color: 'text-amber-400' }
      ]
    });
  }

  return (
    <>
      {/* Backdrop para Mobile Drawer */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 
        bg-gradient-to-b from-[#090a0f] via-[#06070a] to-[#040406] 
        border-r border-tibia-border/80 
        flex flex-col justify-between 
        transition-all duration-300 ease-in-out shadow-2xl
        ${isCollapsed ? 'w-[72px]' : 'w-64 sm:w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* ===================================================================== */}
        {/* TOPO DA SIDEBAR: LOGO & BOTÃO RETRÁTIL                                  */}
        {/* ===================================================================== */}
        <div className="p-3 sm:p-4 border-b border-tibia-border/60 flex items-center justify-between gap-2 shrink-0">
          
          {/* Logo & Marca */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500/20 via-yellow-600/30 to-black border border-yellow-500/50 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-xl">👑</span>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col leading-tight animate-fade-in truncate">
                <span className="font-medieval text-base sm:text-lg text-gradient-gold tracking-wide truncate">
                  RubinOT Tracker
                </span>
                <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                  Military & Intel
                </span>
              </div>
            )}
          </div>

          {/* Botão de Recolher (Desktop) ou Fechar (Mobile) */}
          <div className="flex items-center">
            {/* Mobile close */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu (Modo Dock)'}
              className="hidden lg:flex p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-yellow-400 transition-all"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

        </div>

        {/* Seletor de Mundo Compacto na Sidebar (se expandida) */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1 border-b border-white/5">
            <div className="bg-black/60 border border-tibia-border rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                <Globe size={11} className="text-yellow-400" /> Mundo Ativo:
              </span>
              <select
                value={activeWorld}
                onChange={(e) => setActiveWorld(e.target.value)}
                className="bg-transparent text-yellow-400 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {WORLDS_LIST.map(w => (
                  <option key={w} value={w} className="bg-black text-gray-200">{w}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* NAVEGAÇÃO PRINCIPAL (SCROLL SUAVE)                                     */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 custom-scrollbar">
          
          {sections.map(sec => {
            const isSectionCollapsed = collapsedSections[sec.id];

            return (
              <div key={sec.id} className="space-y-1">
                
                {/* Título da Seção */}
                {!isCollapsed && (
                  <div 
                    onClick={() => toggleSection(sec.id)}
                    className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-gray-400 hover:text-gray-200 cursor-pointer uppercase tracking-wider select-none transition-colors"
                  >
                    <span>{sec.title}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isSectionCollapsed ? '-rotate-90' : ''}`} />
                  </div>
                )}

                {/* Itens da Seção */}
                {(!isSectionCollapsed || isCollapsed) && (
                  <div className="space-y-0.5">
                    {sec.items.map(item => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;

                      return (
                        <div key={item.id} className="relative group">
                          
                          <button
                            onClick={() => handleNavClick(item.id)}
                            className={`
                              w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold
                              transition-all duration-150 relative select-none
                              ${isActive 
                                ? 'bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent text-yellow-300 border-l-2 border-yellow-400 font-bold shadow-sm' 
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                              }
                              ${isCollapsed ? 'justify-center px-0' : ''}
                            `}
                          >
                            <Icon 
                              size={18} 
                              className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-yellow-400' : item.color || 'text-gray-400'}`} 
                            />

                            {!isCollapsed && (
                              <span className="truncate flex-1 text-left">
                                {item.label}
                              </span>
                            )}

                            {!isCollapsed && item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${item.badgeColor || 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                                {item.badge}
                              </span>
                            )}
                          </button>

                          {/* Floating Tooltip no Modo Colapsado (Dock) */}
                          {isCollapsed && (
                            <div className="opacity-0 group-hover:opacity-100 pointer-events-none fixed left-[76px] z-50 px-3 py-1.5 rounded-xl bg-black border border-yellow-500/50 text-xs font-bold text-yellow-300 whitespace-nowrap shadow-2xl transition-opacity flex items-center gap-2">
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
                )}

              </div>
            );
          })}

        </div>

        {/* ===================================================================== */}
        {/* RODAPÉ DA SIDEBAR: CARD DO USUÁRIO & STATUS                              */}
        {/* ===================================================================== */}
        <div className="p-3 border-t border-tibia-border/60 bg-black/40 shrink-0">
          
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div 
                onClick={onOpenProfile}
                className={`flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}
                title="Abrir Meu Perfil"
              >
                <div className="w-8 h-8 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-300 font-bold shrink-0 text-xs">
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
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
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
