import React, { useState } from 'react';
import { 
  Menu, Search, Globe, LogIn, User, Bell, 
  ChevronDown, Sparkles, Crosshair, Shield, Compass, Swords, Gem, 
  Skull, Calculator, Coins, BookOpen, Gift, CalendarDays, TrendingDown
} from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import { useAuth } from './AuthContext';
import ProfileModal from './ProfileModal';
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
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const viewInfo = VIEW_TITLES[currentView] || { title: 'RubinOT Tracker', icon: Globe, color: 'text-yellow-400' };
  const CurrentIcon = viewInfo.icon;

  return (
    <header className="h-16 bg-black/80 border-b border-tibia-border/60 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md">
      
      {/* Esquerda: Botão Menu Mobile & Título Dinâmico */}
      <div className="flex items-center gap-3 min-w-0">
        
        {/* Botão Mobile para Abrir Sidebar */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
          title="Abrir Menu"
        >
          <Menu size={20} />
        </button>

        {/* Título e Ícone da Página Ativa */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 hidden sm:flex items-center justify-center shrink-0">
            <CurrentIcon size={18} className={viewInfo.color} />
          </div>

          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-gray-100 truncate flex items-center gap-2">
              <span className="truncate">{viewInfo.title}</span>
            </h1>
            <span className="text-[10px] text-gray-400 font-mono hidden sm:block">
              RubinOT Server • Mundo: {activeWorld}
            </span>
          </div>
        </div>

      </div>

      {/* Direita: Busca Global, Seletor de Mundo, Notificações & Perfil */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Botão de Busca Global com Atalho Ctrl+K */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 border border-tibia-border hover:border-yellow-500/50 text-xs text-gray-400 hover:text-gray-200 transition-all shadow-inner"
          title="Buscar Jogadores ou Ferramentas (Ctrl + K)"
        >
          <Search size={14} className="text-yellow-400" />
          <span className="hidden md:inline">Buscar...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-gray-300 rounded border border-white/15">
            Ctrl K
          </kbd>
        </button>

        {/* Seletor de Mundo Global */}
        <div className="hidden sm:flex items-center gap-1.5 bg-black/80 border border-tibia-border rounded-xl px-2.5 py-1 text-xs">
          <Globe size={13} className="text-yellow-400" />
          <select
            value={activeWorld}
            onChange={(e) => setActiveWorld(e.target.value)}
            className="bg-transparent text-yellow-300 font-bold text-xs focus:outline-none cursor-pointer"
          >
            {WORLDS_LIST.map(w => (
              <option key={w.id} value={w.id} className="bg-black text-gray-200">{w.name}</option>
            ))}
          </select>
        </div>

        {/* Push Notification Bell */}
        <PushNotificationBell />

        {/* Install PWA Button */}
        <InstallPWA />

        {/* Perfil ou Botão de Login */}
        {user ? (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-all"
            title="Meu Perfil"
          >
            <div className="w-6 h-6 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-300 text-xs">
              {profile?.main_character ? profile.main_character.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden md:inline truncate max-w-[100px]">
              {profile?.main_character || 'Perfil'}
            </span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentView('auth')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 text-black font-bold font-medieval text-xs shadow-md transition-all hover:scale-105 flex items-center gap-1"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">Entrar</span>
          </button>
        )}

      </div>



    </header>
  );
}
