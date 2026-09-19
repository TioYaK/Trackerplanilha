import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, Search, Globe, LogIn, User, Bell, 
  ChevronDown, Sparkles, Crosshair, Shield, Compass, Swords, Gem, 
  Skull, Calculator, Coins, BookOpen, Gift, CalendarDays, TrendingDown, Users,
  Check, LogOut, Settings, Crown, ExternalLink, Star, Trash2
} from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import { useAuth } from './AuthContext';
import InstallPWA from './InstallPWA';
import PushNotificationBell from './PushNotificationBell';
import { getPinnedPlayers, removePinnedPlayer, subscribeWatchlist, MAX_FREE, MAX_VIP } from '../lib/watchlistService';

// Mapeamento de Títulos e Ícones para a Barra Superior
const VIEW_TITLES = {
  home: { title: 'Portal Central Rubinot', icon: Globe, color: 'text-amber-400' },
  live: { title: 'Portal Central Rubinot', icon: Globe, color: 'text-amber-400' },
  vip_hub: { title: 'Central do Assinante VIP & Telemetria', icon: Crown, color: 'text-yellow-400' },
  vip: { title: 'Central do Assinante VIP & Telemetria', icon: Crown, color: 'text-yellow-400' },
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
  onOpenProfile,
  onPlayerClick
}) {
  const { activeWorld, setActiveWorld, activeWorldObj } = useWorld();
  const { logout } = useAuth();
  
  // Dropdown States
  const [worldDropdownOpen, setWorldDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [pinnedPlayers, setPinnedPlayers] = useState(getPinnedPlayers);
  const [worldSearch, setWorldSearch] = useState('');

  const worldDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const watchlistDropdownRef = useRef(null);

  // Sincronização reativa da Watchlist
  useEffect(() => {
    setPinnedPlayers(getPinnedPlayers());
    const unsub = subscribeWatchlist((updatedList) => {
      setPinnedPlayers(updatedList);
    });
    return unsub;
  }, []);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (worldDropdownRef.current && !worldDropdownRef.current.contains(event.target)) {
        setWorldDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (watchlistDropdownRef.current && !watchlistDropdownRef.current.contains(event.target)) {
        setWatchlistOpen(false);
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
    <header className="h-16 bg-[#08090d]/80 border-b border-white/[0.08] px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6)]">
      
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
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hidden sm:flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
            <CurrentIcon size={18} className={viewInfo.color} />
          </div>

          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-base font-bold font-outfit tracking-tight text-gray-100 truncate flex items-center gap-2">
              <span className="truncate">{viewInfo.title}</span>
            </h1>
            <span className="text-[10px] text-gray-400 font-mono hidden sm:flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              RubinOT Server • <strong className="text-amber-400">{activeWorldObj?.name || activeWorld}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Centro/Direita: Status do Enxame & Controles */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Status do Enxame de Workers (Badge Elitizado) */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-emerald-500/25 text-[11px] font-mono text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-gray-300">Swarm:</span>
          <span className="font-bold text-emerald-400">4 Workers Online</span>
        </div>

        {/* Botão de Busca Global com Atalho Ctrl+K */}
        <button
          onClick={onOpenSearch}
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/40 text-xs text-gray-300 hover:text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_15px_rgba(212,175,55,0.12)]"
          title="Buscar Jogadores ou Ferramentas (Ctrl + K)"
        >
          <Search size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline font-sans text-gray-400 group-hover:text-gray-200">Buscar...</span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-white/10 text-amber-300 rounded border border-white/15">
            Ctrl K
          </kbd>
        </button>

        {/* Watchlist / Jogadores Fixados ⭐ */}
        <div className="relative" ref={watchlistDropdownRef}>
          <button
            onClick={() => setWatchlistOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              pinnedPlayers.length > 0
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-black/70 hover:bg-white/5 border-tibia-border text-gray-400 hover:text-gray-200'
            }`}
            title="Jogadores Fixados (Watchlist Rápida)"
          >
            <Star 
              size={14} 
              className={pinnedPlayers.length > 0 ? 'text-amber-400 fill-amber-400' : 'text-gray-400'} 
            />
            <span className="hidden md:inline font-sans">Watchlist</span>
            {pinnedPlayers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/30 border border-amber-500/50 text-amber-300">
                {pinnedPlayers.length}
              </span>
            )}
          </button>

          {/* Menu Dropdown de Jogadores Fixados */}
          {watchlistOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-neutral-950 border border-amber-500/40 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in backdrop-blur-xl">
              <div className="p-3 border-b border-white/10 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-gray-100 uppercase tracking-wider font-mono">
                    Watchlist ({pinnedPlayers.length})
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {pinnedPlayers.length}/{isPremium ? MAX_VIP : MAX_FREE} slots
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                {pinnedPlayers.length === 0 ? (
                  <div className="p-5 text-center text-xs text-gray-400 space-y-2">
                    <Star size={24} className="mx-auto text-gray-600" />
                    <p className="font-sans">Nenhum jogador fixado ainda.</p>
                    <p className="text-[10px] text-gray-500">
                      Abra o dossiê de qualquer jogador e clique na estrela <span className="text-amber-400">⭐</span> para acesso rápido!
                    </p>
                  </div>
                ) : (
                  pinnedPlayers.map(p => (
                    <div
                      key={p.name}
                      className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
                      onClick={() => {
                        onPlayerClick?.(p.name, p.world);
                        setWatchlistOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 font-medieval font-bold text-xs shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="text-xs font-bold text-gray-200 group-hover:text-amber-300 truncate">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                            {p.level && <span className="text-amber-400 font-bold">Lvl {p.level}</span>}
                            {p.vocation && <span className="truncate">{p.vocation}</span>}
                            {p.world && (
                              <span className="text-gray-500">• {p.world}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePinnedPlayer(p.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Remover da Watchlist"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {!isPremium && (
                <div className="p-2.5 bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-black border-t border-amber-500/20 text-center">
                  <button
                    onClick={() => {
                      setWatchlistOpen(false);
                      setCurrentView('vip_hub');
                    }}
                    className="text-[11px] text-amber-300 hover:text-amber-200 font-bold flex items-center justify-center gap-1.5 mx-auto transition-transform hover:scale-105"
                  >
                    <Crown size={13} className="text-yellow-400 animate-pulse" />
                    <span>Desbloquear até 30 slots com VIP</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seletor de Mundo Customizado (Gamer Dropdown) */}
        <div className="relative" ref={worldDropdownRef}>
          <button
            onClick={() => setWorldDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-gray-200 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
            title="Selecionar Mundo do RubinOT"
          >
            <span className="text-sm">{activeWorldObj?.icon || '🌐'}</span>
            <div className="flex flex-col text-left">
              <span className="font-bold text-amber-300 leading-tight font-outfit">
                {activeWorldObj?.name || activeWorld}
              </span>
            </div>
            {activeWorldObj?.type && activeWorldObj?.type !== 'Todos' && (
              <span className={`hidden xl:inline text-[9px] px-1.5 py-0.2 rounded border font-mono ${getTypeBadgeStyle(activeWorldObj.type)}`}>
                {activeWorldObj.type}
              </span>
            )}
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${worldDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
          </button>

          {/* Menu Dropdown de Mundos */}
          {worldDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0c0e14]/95 border border-amber-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in backdrop-blur-2xl">
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

        {/* Central VIP Button */}
        <button
          onClick={() => setCurrentView('vip_hub')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
            isPremium
              ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border-yellow-500/40 text-yellow-300 hover:border-yellow-400 shadow-yellow-500/10'
              : 'bg-black/70 hover:bg-yellow-950/40 border-yellow-500/30 text-yellow-400 hover:text-yellow-200'
          }`}
          title={isPremium ? 'Central do Assinante VIP (Ativo) 👑' : 'Conhecer Benefícios VIP 👑'}
        >
          <Crown size={14} className={isPremium ? 'text-yellow-400 animate-pulse' : 'text-yellow-400'} />
          <span className="hidden sm:inline font-medieval">
            {isPremium ? 'VIP' : 'Seja VIP'}
          </span>
        </button>

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

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setCurrentView('vip_hub');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-yellow-300 hover:bg-yellow-500/10 transition-colors text-left font-semibold"
                  >
                    <Crown size={14} className="text-yellow-400" />
                    <span>Central do Assinante VIP</span>
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
