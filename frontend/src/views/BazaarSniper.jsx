import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Target, AlertTriangle, Clock, TrendingDown, Coins, Search, ExternalLink, 
  Star, Shield, Sword, Wand2, RefreshCw, Flame, Sparkles, Filter, 
  ArrowUpDown, Volume2, VolumeX, Eye, Calculator, ChevronDown, CheckCircle2,
  Award, Globe, Zap, ArrowRight, User, LayoutGrid, List, SlidersHorizontal,
  Bookmark, Check, Share2, DollarSign, HelpCircle, X
} from 'lucide-react';
import { formatVocation } from '../lib/tibiaUtils';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import { soundFX } from '../lib/soundEffects';
import AdBanner from '../components/AdBanner';

const VOCATION_TABS = [
  { id: 'ALL', label: 'Todas as Classes', short: 'Todas', icon: '🌟' },
  { id: 'knight', label: 'Elite Knight', short: 'EK', icon: '⚔️', color: 'text-red-400' },
  { id: 'paladin', label: 'Royal Paladin', short: 'RP', icon: '🏹', color: 'text-yellow-400' },
  { id: 'sorcerer', label: 'Master Sorcerer', short: 'MS', icon: '🔥', color: 'text-orange-400' },
  { id: 'druid', label: 'Elder Druid', short: 'ED', icon: '🌿', color: 'text-emerald-400' },
  { id: 'monk', label: 'Exalted Monk', short: 'Monk', icon: '🥋', color: 'text-purple-400' },
  { id: 'none', label: 'Rook / Sem Voc', short: 'None', icon: '🛡️', color: 'text-gray-400' }
];

export default function BazaarSniper({ onPlayerClick, onNavigate, isPremium }) {
  const { selectedWorld, setSelectedWorld } = useWorld();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoc, setSelectedVoc] = useState('ALL');
  const [activeChip, setActiveChip] = useState('all'); // 'all' | 'opportunity' | 'ending_soon' | 'favorites' | 'hunted' | 'high_level' | 'cheap' | 'charms'
  const [sortOption, setSortOption] = useState('ending');
  const [audioEnabled, setAudioEnabled] = useState(soundFX.isEnabled());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showFipeCalc, setShowFipeCalc] = useState(false);
  const [selectedAuctionModal, setSelectedAuctionModal] = useState(null);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [copiedLink, setCopiedLink] = useState(false);

  // Filtros Avançados
  const [minLevel, setMinLevel] = useState('');
  const [maxLevel, setMaxLevel] = useState('');
  const [minBid, setMinBid] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [minCharms, setMinCharms] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'all' | 'ended'

  // Favoritos / Watchlist (salvos no localStorage)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('rubinot_bazaar_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Salvar favoritos
  useEffect(() => {
    try {
      localStorage.setItem('rubinot_bazaar_favorites', JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites]);

  const toggleFavorite = (auctionId, e) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      if (prev.includes(auctionId)) {
        return prev.filter(id => id !== auctionId);
      } else {
        return [...prev, auctionId];
      }
    });
  };

  // Estados da Calculadora FIPE Geral
  const [calcLevel, setCalcLevel] = useState(700);
  const [calcVoc, setCalcVoc] = useState('Knight');
  const [calcCharms, setCalcCharms] = useState(400);

  // Ticker de 1 segundo para atualizar as contagens regressivas
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // Busca leilões ordenados pelos mais recentes
      const { data, error } = await supabase
        .from('bazaar_alerts')
        .select('*')
        .order('auction_end', { ascending: false })
        .limit(500);

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Erro ao buscar leilões do Bazaar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = soundFX.toggle();
    setAudioEnabled(next);
  };

  // Avaliação FIPE individual do personagem
  const calculateCharFipe = (char) => {
    const lvl = Number(char.level) || 100;
    const ch = Number(char.charm_points) || 0;
    const voc = (char.vocation || '').toLowerCase();
    let baseRate = 1.2;
    if (voc.includes('sorcerer') || voc.includes('druid')) baseRate = 1.4;
    if (voc.includes('paladin')) baseRate = 1.35;
    if (voc.includes('monk')) baseRate = 1.5;

    let baseTc = Math.round(lvl * baseRate);
    if (lvl > 800) baseTc += Math.round((lvl - 800) * 2.5);
    if (lvl > 1000) baseTc += Math.round((lvl - 1000) * 4.0);

    const charmsBonus = Math.round(ch * 0.8);
    const avgFipe = Math.round(baseTc + charmsBonus);
    const minFipe = Math.round(avgFipe * 0.8);
    const maxFipe = Math.round(avgFipe * 1.2);

    const currentBid = Number(char.current_bid) || 0;
    const discountPct = avgFipe > 0 ? Math.round(((avgFipe - currentBid) / avgFipe) * 100) : 0;
    // Lucro estimado na revenda: Preço FIPE - 12% taxa de leilão - 50 TC taxa fixa - Lance
    const estimatedProfitTc = Math.max(0, Math.round(avgFipe * 0.88 - 50 - currentBid));

    return { avgFipe, minFipe, maxFipe, discountPct, estimatedProfitTc };
  };

  // Estimativa da Calculadora FIPE do Drawer
  const estimatedFipeDrawer = useMemo(() => {
    const lvl = Number(calcLevel) || 100;
    const ch = Number(calcCharms) || 0;
    let baseRate = 1.2;
    if (calcVoc.includes('Sorcerer') || calcVoc.includes('Druid')) baseRate = 1.4;
    if (calcVoc.includes('Paladin')) baseRate = 1.35;
    if (calcVoc.includes('Monk')) baseRate = 1.5;

    let baseTc = Math.round(lvl * baseRate);
    if (lvl > 800) baseTc += Math.round((lvl - 800) * 2.5);
    if (lvl > 1000) baseTc += Math.round((lvl - 1000) * 4.0);

    const charmsBonus = Math.round(ch * 0.8);
    const minVal = Math.max(100, Math.round((baseTc + charmsBonus) * 0.75));
    const maxVal = Math.round((baseTc + charmsBonus) * 1.25);
    return { min: minVal, max: maxVal, avg: Math.round((minVal + maxVal) / 2) };
  }, [calcLevel, calcVoc, calcCharms]);

  // Contagem por vocação para as abas
  const vocationCounts = useMemo(() => {
    const counts = { ALL: alerts.length, knight: 0, paladin: 0, sorcerer: 0, druid: 0, monk: 0, none: 0 };
    alerts.forEach(a => {
      const v = (a.vocation || '').toLowerCase();
      if (v.includes('knight')) counts.knight++;
      else if (v.includes('paladin')) counts.paladin++;
      else if (v.includes('sorcerer')) counts.sorcerer++;
      else if (v.includes('druid')) counts.druid++;
      else if (v.includes('monk')) counts.monk++;
      else counts.none++;
    });
    return counts;
  }, [alerts]);

  // Função auxiliar para tempo restante formatado
  const getTimeRemaining = (auctionEnd) => {
    if (!auctionEnd) return { text: 'Expirado', isUrgent: false, isImminent: false, isEnded: true, totalSeconds: 0 };
    const diff = new Date(auctionEnd).getTime() - nowTimestamp;
    if (diff <= 0) return { text: 'Encerrado', isUrgent: false, isImminent: false, isEnded: true, totalSeconds: 0 };

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const isImminent = totalSeconds < 30 * 60; // < 30 minutos
    const isUrgent = totalSeconds < 2 * 3600;   // < 2 horas

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h restantes`, isUrgent: false, isImminent: false, isEnded: false, totalSeconds };
    }

    const pad = (n) => String(n).padStart(2, '0');
    return {
      text: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
      isUrgent,
      isImminent,
      isEnded: false,
      totalSeconds
    };
  };

  // Filtragem e Ordenação Completa
  const filteredAndSortedAuctions = useMemo(() => {
    let result = alerts.filter(a => {
      const timeInfo = getTimeRemaining(a.auction_end);

      // 0. Filtro de Status (Ativos vs Encerrados)
      if (statusFilter === 'active' && timeInfo.isEnded) return false;
      if (statusFilter === 'ended' && !timeInfo.isEnded) return false;

      // 1. Filtro de Mundo
      if (selectedWorld !== 'ALL' && a.world_name && a.world_name.toLowerCase() !== selectedWorld.toLowerCase()) {
        return false;
      }

      // 2. Busca por Texto (Personagem ou Itens)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (a.character_name || '').toLowerCase().includes(q);
        const matchItem = Array.isArray(a.items_data) && a.items_data.some(it => (it?.name || '').toLowerCase().includes(q));
        if (!matchName && !matchItem) return false;
      }

      // 3. Filtro de Vocação (Abas de Classes)
      if (selectedVoc !== 'ALL') {
        const voc = (a.vocation || '').toLowerCase();
        if (selectedVoc === 'knight' && !voc.includes('knight')) return false;
        if (selectedVoc === 'paladin' && !voc.includes('paladin')) return false;
        if (selectedVoc === 'sorcerer' && !voc.includes('sorcerer')) return false;
        if (selectedVoc === 'druid' && !voc.includes('druid')) return false;
        if (selectedVoc === 'monk' && !voc.includes('monk')) return false;
        if (selectedVoc === 'none' && (voc.includes('knight') || voc.includes('paladin') || voc.includes('sorcerer') || voc.includes('druid') || voc.includes('monk'))) return false;
      }

      // 4. Filtro por Faixa de Level
      if (minLevel && (a.level || 0) < Number(minLevel)) return false;
      if (maxLevel && (a.level || 0) > Number(maxLevel)) return false;

      // 5. Filtro por Faixa de Lance
      if (minBid && (a.current_bid || 0) < Number(minBid)) return false;
      if (maxBid && (a.current_bid || 0) > Number(maxBid)) return false;

      // 6. Filtro por Charms
      if (minCharms && (a.charm_points || 0) < Number(minCharms)) return false;

      // 7. Filtro por Chips Rápidos
      if (activeChip === 'opportunity') {
        const fipe = calculateCharFipe(a);
        return fipe.discountPct >= 20 || a.is_sniping_opportunity;
      }
      if (activeChip === 'ending_soon') {
        return !timeInfo.isEnded && timeInfo.totalSeconds < 3 * 3600;
      }
      if (activeChip === 'favorites') {
        const aId = a.id || a.auction_id;
        return favorites.includes(aId);
      }
      if (activeChip === 'hunted') return a.is_hunted;
      if (activeChip === 'high_level') return (a.level || 0) >= 800;
      if (activeChip === 'cheap') return (a.current_bid || 0) <= 500;
      if (activeChip === 'charms') return (a.charm_points || 0) >= 1000;

      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      const timeA = new Date(a.auction_end).getTime();
      const timeB = new Date(b.auction_end).getTime();
      const isEndedA = timeA - nowTimestamp <= 0;
      const isEndedB = timeB - nowTimestamp <= 0;

      // Ativos sempre primeiro
      if (isEndedA !== isEndedB) {
        return isEndedA ? 1 : -1;
      }

      if (sortOption === 'ending') {
        return timeA - timeB;
      }
      if (sortOption === 'price_asc') {
        return (a.current_bid || 0) - (b.current_bid || 0);
      }
      if (sortOption === 'price_desc') {
        return (b.current_bid || 0) - (a.current_bid || 0);
      }
      if (sortOption === 'level_desc') {
        return (b.level || 0) - (a.level || 0);
      }
      if (sortOption === 'profit_desc') {
        const profitA = calculateCharFipe(a).estimatedProfitTc;
        const profitB = calculateCharFipe(b).estimatedProfitTc;
        return profitB - profitA;
      }
      if (sortOption === 'charms') {
        return (b.charm_points || 0) - (a.charm_points || 0);
      }
      return 0;
    });

    return result;
  }, [alerts, selectedWorld, searchQuery, selectedVoc, activeChip, sortOption, minLevel, maxLevel, minBid, maxBid, minCharms, statusFilter, favorites, nowTimestamp]);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    const total = alerts.length;
    let opportunities = 0;
    let endingSoon = 0;
    let hunteds = 0;
    let activeCount = 0;

    alerts.forEach(a => {
      const timeInfo = getTimeRemaining(a.auction_end);
      if (!timeInfo.isEnded) {
        activeCount++;
        if (timeInfo.totalSeconds < 3 * 3600) endingSoon++;
      }
      const fipe = calculateCharFipe(a);
      if (fipe.discountPct >= 20 || a.is_sniping_opportunity) opportunities++;
      if (a.is_hunted) hunteds++;
    });

    return { total, activeCount, opportunities, endingSoon, hunteds, favoritesCount: favorites.length };
  }, [alerts, favorites, nowTimestamp]);

  const handleShareAuction = (auction) => {
    const text = `[Rubinot Bazaar] ${auction.character_name} (Lvl ${auction.level} - ${formatVocation(auction.vocation)}) | Lance: ${auction.current_bid} TC | Mundo: ${auction.world_name}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* 1. HERO BANNER BAZAAR COM CONTROLES */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3.5 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3 shadow-inner">
              <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              Arbitragem & Scanner de Chars
            </div>

            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold drop-shadow-lg leading-tight">
              Bazaar Sniper <span className="text-white">Pro 💎</span>
            </h1>
            
            <p className="text-gray-300 font-sans text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Monitore pechinchas com lances abaixo do valor FIPE de mercado, alvos de guerra em leilão e filtre por todas as classes com dossiê completo.
            </p>
          </div>

          {/* PAINEL DE AÇÕES DO TOPO */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowFipeCalc(!showFipeCalc)}
              className="flex items-center gap-2 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 px-3.5 py-2 text-xs font-bold text-yellow-300 transition-all shadow-md active:scale-95"
            >
              <Calculator size={15} />
              <span>Simulador FIPE</span>
            </button>

            <button
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                showFiltersDrawer || minLevel || minBid || minCharms
                  ? 'bg-yellow-500 text-stone-950 border-yellow-400 font-black'
                  : 'bg-black/60 border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <SlidersHorizontal size={15} />
              <span>Filtros Pro</span>
              {(minLevel || minBid || minCharms) && <span className="w-2 h-2 rounded-full bg-red-500" />}
            </button>

            {/* Alternar Visualização: Grid vs Tabela */}
            <div className="flex bg-stone-900 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-yellow-500 text-stone-950 shadow' : 'text-gray-400 hover:text-white'}`}
                title="Visualização em Cards"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-yellow-500 text-stone-950 shadow' : 'text-gray-400 hover:text-white'}`}
                title="Visualização em Tabela Sniper"
              >
                <List size={16} />
              </button>
            </div>

            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all ${
                audioEnabled
                  ? 'bg-yellow-500 text-black border-yellow-400 shadow-tibia-glow'
                  : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={audioEnabled ? "Alertas sonoros ativados" : "Ativar alertas sonoros de sniper"}
            >
              {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button 
              onClick={fetchAlerts}
              className="p-2 rounded-xl bg-black/70 hover:bg-yellow-950/40 border border-yellow-500/40 text-yellow-400 transition-all active:scale-95"
              title="Sincronizar Leilões"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* DRAWER DA CALCULADORA FIPE */}
        {showFipeCalc && (
          <div className="mt-6 pt-6 border-t border-yellow-500/20 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in bg-black/60 p-5 rounded-2xl border border-yellow-500/30">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Level do Personagem</label>
              <input
                type="number"
                value={calcLevel}
                onChange={(e) => setCalcLevel(e.target.value)}
                className="w-full bg-stone-900 border border-yellow-500/30 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-yellow-400"
                placeholder="Ex: 750"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Vocação</label>
              <select
                value={calcVoc}
                onChange={(e) => setCalcVoc(e.target.value)}
                className="w-full bg-stone-900 border border-yellow-500/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400 cursor-pointer"
              >
                <option value="Knight">Elite Knight</option>
                <option value="Paladin">Royal Paladin</option>
                <option value="Sorcerer">Master Sorcerer</option>
                <option value="Druid">Elder Druid</option>
                <option value="Monk">Exalted Monk</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Charm Points</label>
              <input
                type="number"
                value={calcCharms}
                onChange={(e) => setCalcCharms(e.target.value)}
                className="w-full bg-stone-900 border border-yellow-500/30 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-yellow-400"
                placeholder="Ex: 450"
              />
            </div>

            <div className="bg-yellow-950/40 border border-yellow-500/40 rounded-xl p-3 flex flex-col justify-center text-center">
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Valor Estimado de Mercado</span>
              <div className="text-xl font-black text-white font-medieval mt-0.5">
                {estimatedFipeDrawer.min.toLocaleString()} - {estimatedFipeDrawer.max.toLocaleString()} <span className="text-xs text-yellow-400">TC</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5">Média FIPE: ~{estimatedFipeDrawer.avg.toLocaleString()} TC</span>
            </div>
          </div>
        )}

        {/* DRAWER DE FILTROS PRO AVANÇADOS */}
        {showFiltersDrawer && (
          <div className="mt-6 pt-6 border-t border-yellow-500/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in bg-stone-950/80 p-5 rounded-2xl border border-stone-800">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Faixa de Level</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minLevel}
                  onChange={(e) => setMinLevel(e.target.value)}
                  className="w-1/2 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxLevel}
                  onChange={(e) => setMaxLevel(e.target.value)}
                  className="w-1/2 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Faixa de Lance (TC)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min TC"
                  value={minBid}
                  onChange={(e) => setMinBid(e.target.value)}
                  className="w-1/2 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Max TC"
                  value={maxBid}
                  onChange={(e) => setMaxBid(e.target.value)}
                  className="w-1/2 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Charm Points Mínimos</label>
              <select
                value={minCharms}
                onChange={(e) => setMinCharms(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="">Qualquer quantidade</option>
                <option value="500">500+ Charms</option>
                <option value="1500">1.500+ Charms</option>
                <option value="3000">3.000+ Charms</option>
                <option value="5000">5.000+ Charms</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status do Leilão</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'active' ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-900 text-gray-400'}`}
                >
                  Ativos
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-900 text-gray-400'}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ended')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'ended' ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-900 text-gray-400'}`}
                >
                  Encerrados
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. NOVO: SELETOR VISUAL DE TODAS AS CLASSES / VOCAÇÕES */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sword size={14} className="text-amber-400" /> Filtrar por Classe de Personagem
          </span>
          <span className="text-xs text-gray-500">
            {filteredAndSortedAuctions.length} leilões exibidos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {VOCATION_TABS.map(tab => {
            const count = vocationCounts[tab.id] || 0;
            const isSelected = selectedVoc === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedVoc(tab.id)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200 relative group ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-500/25 to-stone-900 border-amber-400 text-white shadow-lg shadow-amber-500/10 scale-105 z-10'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-xl mb-1">{tab.icon}</span>
                <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-gray-200'}`}>
                  {tab.short}
                </span>
                <span className={`text-[10px] mt-0.5 font-mono ${isSelected ? 'text-amber-400 font-bold' : 'text-gray-500'}`}>
                  {count} chars
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. STRIP DE MÉTRICAS / CHIPS RÁPIDOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div 
          onClick={() => setActiveChip('all')}
          className={`bg-black/80 border p-3.5 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'all' 
              ? 'border-yellow-500 bg-yellow-950/20 shadow-yellow-500/10' 
              : 'border-yellow-500/20 hover:border-yellow-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 uppercase font-semibold">Total Rastreado</span>
            <Search className="text-blue-400" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-medieval font-bold text-white mt-1">{stats.total}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{stats.activeCount} ativos agora</p>
        </div>

        <div 
          onClick={() => setActiveChip('opportunity')}
          className={`bg-black/80 border p-3.5 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'opportunity' 
              ? 'border-green-500 bg-green-950/20 shadow-green-500/10' 
              : 'border-yellow-500/20 hover:border-green-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-green-400 uppercase font-semibold">Pechinchas FIPE</span>
            <Flame className="text-green-400" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-medieval font-bold text-green-400 mt-1">{stats.opportunities}</p>
          <p className="text-[11px] text-green-500/70 mt-0.5">&gt;20% abaixo do mercado</p>
        </div>

        <div 
          onClick={() => setActiveChip('ending_soon')}
          className={`bg-black/80 border p-3.5 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'ending_soon' 
              ? 'border-red-500 bg-red-950/20 shadow-red-500/10' 
              : 'border-yellow-500/20 hover:border-red-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-400 uppercase font-semibold">Sniper Mode (&lt;3h)</span>
            <Clock className="text-red-400" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-medieval font-bold text-red-400 mt-1">{stats.endingSoon}</p>
          <p className="text-[11px] text-red-500/70 mt-0.5">Reta final de encerramento</p>
        </div>

        <div 
          onClick={() => setActiveChip('favorites')}
          className={`bg-black/80 border p-3.5 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'favorites' 
              ? 'border-amber-400 bg-amber-950/20 shadow-amber-500/10' 
              : 'border-yellow-500/20 hover:border-amber-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-300 uppercase font-semibold">Meus Favoritos</span>
            <Star className="text-amber-400" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-medieval font-bold text-amber-300 mt-1">{stats.favoritesCount}</p>
          <p className="text-[11px] text-amber-400/70 mt-0.5">Watchlist pessoal</p>
        </div>
      </div>

      {/* 4. BARRA DE BUSCA, MUNDO & ORDENAÇÃO */}
      <div className="bg-black/80 border border-yellow-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Buscar personagem ou item em destaque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedWorld}
              onChange={(e) => setSelectedWorld(e.target.value)}
              className="w-full bg-stone-900 border border-white/10 text-xs text-yellow-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500 font-bold cursor-pointer"
            >
              {WORLDS_LIST.map(w => (
                <option key={w.id} value={w.id} className="bg-stone-950 text-white">
                  {w.icon} {w.name} {w.id !== 'ALL' ? `(${w.type})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full bg-stone-900 border border-white/10 text-xs text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500 font-bold cursor-pointer"
            >
              <option value="ending">⏳ Termina Primeiro</option>
              <option value="profit_desc">🔥 Maior Lucro FIPE (Revenda)</option>
              <option value="price_asc">💰 Menor Preço (TC)</option>
              <option value="price_desc">💎 Maior Preço (TC)</option>
              <option value="level_desc">📈 Maior Nível (Level)</option>
              <option value="charms">⭐ Mais Charms</option>
            </select>
          </div>

        </div>

        {/* Chips Secundários */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: '🌟 Todos' },
              { id: 'opportunity', label: '🔥 Pechinchas FIPE' },
              { id: 'ending_soon', label: '⏳ Últimas Horas' },
              { id: 'favorites', label: `⭐ Favoritos (${favorites.length})` },
              { id: 'high_level', label: '👑 Lvl 800+' },
              { id: 'cheap', label: '💰 Até 500 TC' },
              { id: 'charms', label: '⭐ 1.000+ Charms' },
              { id: 'hunted', label: '💀 Alvos Inimigos' }
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setActiveChip(chip.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeChip === chip.id
                    ? 'bg-yellow-500 text-black shadow-md font-black'
                    : 'bg-stone-900/80 hover:bg-stone-800 text-gray-300 border border-white/5'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {(minLevel || minBid || minCharms || selectedVoc !== 'ALL' || selectedWorld !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setMinLevel('');
                setMaxLevel('');
                setMinBid('');
                setMaxBid('');
                setMinCharms('');
                setSelectedVoc('ALL');
                setSelectedWorld('ALL');
                setSearchQuery('');
                setActiveChip('all');
              }}
              className="text-xs text-yellow-400 hover:text-white underline"
            >
              Resetar Filtros
            </button>
          )}
        </div>
      </div>

      {/* 5. LISTAGEM DE LEILÕES (MODO CARDS OU MODO TABELA) */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
          <p className="font-medieval text-xl text-yellow-400">Rastreando leilões ativos nos 16 servidores...</p>
        </div>
      ) : filteredAndSortedAuctions.length === 0 ? (
        <div className="bg-black/60 border border-yellow-500/20 p-12 rounded-2xl text-center space-y-3">
          <Target className="mx-auto text-yellow-500/40" size={48} />
          <h3 className="text-xl font-medieval text-white">Nenhum leilão encontrado para os filtros atuais</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Tente selecionar "Todas as Classes", "Todos os Mundos" ou marcar "Status: Todos" para visualizar também os leilões finalizados recentemente.
          </p>
          <button
            onClick={() => {
              setSelectedVoc('ALL');
              setSelectedWorld('ALL');
              setActiveChip('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-xs font-bold text-yellow-300 transition-all"
          >
            Ver Todos os Leilões
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* MODO TABELA SNIPER PRO */
        <div className="bg-stone-950/90 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/90 text-gray-400 uppercase tracking-wider font-semibold border-b border-stone-800">
                <tr>
                  <th className="p-3.5 text-center w-10">⭐</th>
                  <th className="p-3.5">Personagem</th>
                  <th className="p-3.5">Mundo</th>
                  <th className="p-3.5">Classe</th>
                  <th className="p-3.5">Level</th>
                  <th className="p-3.5">Skills / ML</th>
                  <th className="p-3.5">Charms</th>
                  <th className="p-3.5">Lance Atual</th>
                  <th className="p-3.5">Média FIPE</th>
                  <th className="p-3.5">Oportunidade</th>
                  <th className="p-3.5">Tempo Restante</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {filteredAndSortedAuctions.map(auction => {
                  const aId = auction.id || auction.auction_id;
                  const isFav = favorites.includes(aId);
                  const timeInfo = getTimeRemaining(auction.auction_end);
                  const fipe = calculateCharFipe(auction);
                  const bidVal = Number(auction.current_bid) || 0;
                  const vocStr = formatVocation(auction.vocation);

                  return (
                    <tr 
                      key={aId}
                      className={`hover:bg-stone-900/60 transition-colors ${timeInfo.isEnded ? 'opacity-60 bg-stone-950/40' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(aId, e)}
                          className={`text-sm ${isFav ? 'text-amber-400' : 'text-gray-600 hover:text-gray-300'}`}
                        >
                          ★
                        </button>
                      </td>
                      <td className="p-3">
                        <div 
                          onClick={() => onPlayerClick && onPlayerClick(auction.character_name, auction.world_name)}
                          className="font-bold text-white hover:text-yellow-400 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{auction.character_name}</span>
                          {auction.is_hunted && <span className="text-[10px] px-1 bg-red-600 text-white rounded font-bold">Hunted</span>}
                        </div>
                      </td>
                      <td className="p-3 text-yellow-300 font-mono">{auction.world_name || 'Rubinot'}</td>
                      <td className="p-3 text-gray-300">{vocStr}</td>
                      <td className="p-3 font-bold text-white font-mono">{auction.level}</td>
                      <td className="p-3 text-gray-300 font-mono">
                        {auction.mag_level ? `ML ${auction.mag_level}` : `Dist ${auction.skills_data?.dist || auction.skills_data?.sword || '?'}`}
                      </td>
                      <td className="p-3 text-purple-300 font-mono">{auction.charm_points || 0}</td>
                      <td className="p-3 font-bold text-yellow-400 font-mono">{bidVal.toLocaleString()} TC</td>
                      <td className="p-3 text-gray-400 font-mono">~{fipe.avgFipe.toLocaleString()} TC</td>
                      <td className="p-3">
                        {fipe.discountPct >= 20 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            +{fipe.discountPct}% ({fipe.estimatedProfitTc} TC)
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Justo</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`font-mono text-xs ${timeInfo.isImminent ? 'text-red-400 font-bold' : timeInfo.isEnded ? 'text-gray-500' : 'text-gray-300'}`}>
                          {timeInfo.text}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedAuctionModal(auction)}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-yellow-400 border border-stone-700 font-bold text-xs transition-colors"
                        >
                          Dossiê
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* MODO CARDS DETALHADOS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedAuctions.map(auction => {
            const aId = auction.id || auction.auction_id;
            const isFav = favorites.includes(aId);
            const timeInfo = getTimeRemaining(auction.auction_end);
            const fipe = calculateCharFipe(auction);
            const bidVal = Number(auction.current_bid) || 0;
            const lvl = Number(auction.level) || 1;
            const tcPerLvl = (bidVal / lvl).toFixed(2);

            const vocStr = formatVocation(auction.vocation);
            const isMage = vocStr.includes('Sorcerer') || vocStr.includes('Druid');
            const isRP = vocStr.includes('Paladin');
            const isEK = vocStr.includes('Knight');

            const mainSkill = isMage
              ? { name: 'Magic Level', val: auction.mag_level || '?', icon: <Wand2 size={13} className="text-blue-400" /> }
              : isRP
              ? { name: 'Distance', val: auction.skills_data?.dist || '?', icon: <Target size={13} className="text-green-400" /> }
              : isEK
              ? { name: 'Melee Skill', val: Math.max(auction.skills_data?.sword || 0, auction.skills_data?.axe || 0, auction.skills_data?.club || 0) || '?', icon: <Sword size={13} className="text-red-400" /> }
              : { name: 'Skill', val: '?', icon: <Zap size={13} className="text-yellow-400" /> };

            return (
              <div 
                key={aId}
                className={`bg-gradient-to-b from-stone-950 via-black to-stone-950 border rounded-2xl p-5 relative overflow-hidden transition-all flex flex-col justify-between group shadow-xl ${
                  timeInfo.isEnded
                    ? 'opacity-60 border-stone-800'
                    : auction.is_hunted
                    ? 'border-red-500/60 shadow-red-500/10'
                    : timeInfo.isImminent
                    ? 'border-amber-500 shadow-amber-500/20 animate-pulse'
                    : fipe.discountPct >= 25
                    ? 'border-yellow-500/70 shadow-yellow-500/15'
                    : 'border-white/10 hover:border-yellow-500/40'
                }`}
              >
                {/* BADGE DE TOPO COM FAVORITO */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(aId, e)}
                      className={`p-1 rounded-md transition-colors ${isFav ? 'text-amber-400 bg-amber-950/40' : 'text-gray-500 hover:text-white'}`}
                      title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                    >
                      <Star size={16} fill={isFav ? "currentColor" : "none"} />
                    </button>

                    {auction.is_hunted && (
                      <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                        💀 Alvo Inimigo
                      </span>
                    )}

                    {fipe.discountPct >= 20 && !timeInfo.isEnded && (
                      <span className="bg-emerald-500 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <Flame size={12} /> {fipe.discountPct}% Pechincha
                      </span>
                    )}

                    {lvl >= 800 && (
                      <span className="bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                        👑 Lvl 800+
                      </span>
                    )}
                  </div>

                  {/* Timer regressivo */}
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 ${
                    timeInfo.isEnded
                      ? 'bg-stone-900 text-gray-500'
                      : timeInfo.isImminent
                      ? 'bg-red-950 text-red-300 border border-red-500/50'
                      : timeInfo.isUrgent
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                      : 'bg-black/60 text-gray-400 border border-white/10'
                  }`}>
                    <Clock size={12} className={timeInfo.isImminent ? 'animate-spin' : ''} />
                    <span>{timeInfo.text}</span>
                  </div>
                </div>

                {/* CABEÇALHO DO PERSONAGEM */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-stone-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:border-yellow-500/50 transition-colors">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(auction.character_name)}&background=1c1917&color=eab308&bold=true`}
                      alt={auction.character_name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 
                      onClick={() => onPlayerClick && onPlayerClick(auction.character_name, auction.world_name)}
                      className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors truncate cursor-pointer flex items-center gap-1.5"
                      title="Clique para abrir o Dossiê Tático"
                    >
                      <span>{auction.character_name}</span>
                      <Eye size={13} className="text-gray-500 group-hover:text-yellow-400 shrink-0" />
                    </h3>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                      <span className="font-bold text-yellow-400">Lvl {auction.level}</span>
                      <span>•</span>
                      <span className="text-gray-300">{vocStr}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950/40 text-yellow-300 border border-yellow-500/20 font-mono">
                        {auction.world_name || 'Rubinot'}
                      </span>
                      {auction.charm_points > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-950/50 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Star size={10} /> {auction.charm_points} Charms
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* TELEMETRIA & SKILLS */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/50 border border-white/5 mb-3 text-center text-xs">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mb-0.5">
                      {mainSkill.icon} Skill
                    </span>
                    <span className="font-bold text-white">{mainSkill.val}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center border-x border-white/5">
                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mb-0.5">
                      <Shield size={11} className="text-stone-400" /> Shield
                    </span>
                    <span className="font-bold text-white">{auction.skills_data?.shielding || '?'}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mb-0.5">
                      <Coins size={11} className="text-yellow-400" /> FIPE Média
                    </span>
                    <span className="font-bold text-amber-300">
                      {fipe.avgFipe} TC
                    </span>
                  </div>
                </div>

                {/* ITENS INCLUSOS */}
                {Array.isArray(auction.items_data) && auction.items_data.length > 0 && (
                  <div className="flex gap-1.5 mb-3 p-2 rounded-xl bg-black/40 border border-white/5 overflow-x-auto custom-scrollbar">
                    {auction.items_data.slice(0, 6).map((item, idx) => (
                      <img 
                        key={idx}
                        src={`https://tibia.fandom.com/wiki/Special:FilePath/${item?.name ? String(item.name).trim().replace(/ /g, '_') : ''}.gif`}
                        alt={item?.name || 'Item'}
                        title={item?.name || ''}
                        className="w-7 h-7 object-contain drop-shadow"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ))}
                  </div>
                )}

                {/* LANCE ATUAL & PREVISÃO DE ARBITRAGEM */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex justify-between items-center bg-black/60 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[11px] text-gray-400 block">Lance Atual:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Coins size={15} className="text-yellow-400" />
                        <span className="text-lg font-black text-white font-mono">
                          {bidVal.toLocaleString()} <span className="text-xs text-yellow-400 font-bold">TC</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">Lucro na Revenda:</span>
                      <span className={`text-xs font-mono font-bold ${fipe.estimatedProfitTc > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {fipe.estimatedProfitTc > 0 ? `+${fipe.estimatedProfitTc} TC` : '0 TC'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAuctionModal(auction)}
                      className="py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-white/10 hover:border-yellow-500/40 text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <User size={13} />
                      <span>Dossiê & FIPE</span>
                    </button>

                    <a
                      href={`https://rubinot.com.br/bazaar/${auction.auction_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-xs font-black text-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <span>Dar Lance ↗</span>
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 6. MODAL COMPLETO DE DOSSIÊ DO LEILÃO */}
      {selectedAuctionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-950 border-2 border-yellow-500/50 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            
            <button
              type="button"
              onClick={() => setSelectedAuctionModal(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-stone-900 hover:bg-stone-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-yellow-500/40 flex items-center justify-center shrink-0">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAuctionModal.character_name)}&background=1c1917&color=eab308&bold=true`}
                  alt={selectedAuctionModal.character_name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              </div>

              <div>
                <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider">
                  Leilão #{selectedAuctionModal.auction_id} • {selectedAuctionModal.world_name}
                </div>
                <h2 className="text-2xl font-bold text-white mt-0.5">
                  {selectedAuctionModal.character_name}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                  <span className="text-yellow-400 font-bold">Level {selectedAuctionModal.level}</span>
                  <span>•</span>
                  <span>{formatVocation(selectedAuctionModal.vocation)}</span>
                  <span>•</span>
                  <span className="text-purple-400 font-mono">{selectedAuctionModal.charm_points || 0} Charms</span>
                </div>
              </div>
            </div>

            {/* Tabela de Skills Completas */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Habilidades & Competências (Skills)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                  <span className="text-gray-500 text-[10px] block">Magic Level</span>
                  <strong className="text-white text-base">{selectedAuctionModal.mag_level || '-'}</strong>
                </div>
                <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                  <span className="text-gray-500 text-[10px] block">Distance</span>
                  <strong className="text-white text-base">{selectedAuctionModal.skills_data?.dist || '-'}</strong>
                </div>
                <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                  <span className="text-gray-500 text-[10px] block">Sword / Axe / Club</span>
                  <strong className="text-white text-base">
                    {Math.max(selectedAuctionModal.skills_data?.sword || 0, selectedAuctionModal.skills_data?.axe || 0, selectedAuctionModal.skills_data?.club || 0) || '-'}
                  </strong>
                </div>
                <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                  <span className="text-gray-500 text-[10px] block">Shielding</span>
                  <strong className="text-white text-base">{selectedAuctionModal.skills_data?.shielding || '-'}</strong>
                </div>
              </div>
            </div>

            {/* Dossiê Financeiro & Análise FIPE */}
            {(() => {
              const modalFipe = calculateCharFipe(selectedAuctionModal);
              const bid = Number(selectedAuctionModal.current_bid) || 0;

              return (
                <div className="bg-gradient-to-r from-stone-900 to-yellow-950/30 border border-yellow-500/30 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={14} /> Análise de Rentabilidade de Revenda
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-black/60 p-2.5 rounded-xl">
                      <span className="text-[10px] text-gray-400 block">Lance Atual</span>
                      <strong className="text-white text-base">{bid} TC</strong>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-xl">
                      <span className="text-[10px] text-gray-400 block">Valor FIPE Justo</span>
                      <strong className="text-yellow-400 text-base">~{modalFipe.avgFipe} TC</strong>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-xl">
                      <span className="text-[10px] text-gray-400 block">Lucro Líquido Est.</span>
                      <strong className="text-emerald-400 text-base">+{modalFipe.estimatedProfitTc} TC</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 mt-1">
                    *Lucro projetado já deduzindo a comissão de 12% da CipSoft e a taxa fixa de 50 TC do leilão.
                  </p>
                </div>
              );
            })()}

            {/* Botões de Ação do Modal */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleShareAuction(selectedAuctionModal)}
                className="flex-1 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 font-bold text-xs text-gray-300 flex items-center justify-center gap-2 transition-colors"
              >
                {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                {copiedLink ? 'Copiado para o Clipboard!' : 'Compartilhar Leilão'}
              </button>

              <a
                href={`https://rubinot.com.br/bazaar/${selectedAuctionModal.auction_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 font-black text-stone-950 text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <ExternalLink size={16} />
                <span>Dar Lance no Rubinot ↗</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* BANNER DE PUBLICIDADE ADSENSE */}
      <div className="mt-4">
        <AdBanner />
      </div>

    </div>
  );
}
