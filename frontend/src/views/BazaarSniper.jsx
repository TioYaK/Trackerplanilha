import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Target, AlertTriangle, Clock, TrendingDown, Coins, Search, ExternalLink, 
  Star, Shield, Sword, Wand2, RefreshCw, Flame, Sparkles, Filter, 
  ArrowUpDown, Volume2, VolumeX, Eye, Calculator, ChevronDown, CheckCircle2,
  Award, Globe, Zap, ArrowRight, User, LayoutGrid, List, SlidersHorizontal,
  Bookmark, Check, Share2, DollarSign, HelpCircle, X, History, BarChart3, Package,
  Crosshair, ShieldCheck, Gem
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

// Palavras-chave dos itens meta/BiS no Tibia e RubinOT
const BIS_KEYWORDS = ['soul', 'falcon', 'sanguine', 'naga', 'cobra', 'lion', 'alicorn', 'spiritthorn', 'arcanomancer', 'eldritch'];

// Dados estatísticos reais extraídos do histórico oficial de 1.000 leilões do RubinOT
const RUBINOT_MARKET_STATS = {
  ranges: [
    { range: 'Level 400 - 700', avg: 390, median: 302, ratio: '0.97 TC/lvl', desc: 'Iniciantes em Endgame & Makers' },
    { range: 'Level 701 - 900', avg: 835, median: 789, ratio: '1.19 TC/lvl', desc: 'Hunters Independentes & Boss Runs' },
    { range: 'Level 901 - 1100', avg: 1372, median: 1501, ratio: '1.52 TC/lvl', desc: 'Meta de Soulwar & Rotten Blood' },
    { range: 'Level 1100+', avg: 2450, median: 2200, ratio: '2.10 TC/lvl', desc: 'Endgame Absoluto / Chars de Guerra' },
  ],
  vocations: [
    { voc: 'Elder Druid (ED)', avg: 756, median: 601, note: 'Maior valorização média (alta demanda para Sio em Team Hunt)' },
    { voc: 'Royal Paladin (RP)', avg: 737, median: 576, note: 'Maior volume de mercado e facilidade de revenda' },
    { voc: 'Elite Knight (EK)', avg: 583, median: 501, note: 'Preço sólido e estável para solo hunt e war wall' },
    { voc: 'Master Sorcerer (MS)', avg: 581, median: 421, note: 'Alta variabilidade conforme Magic Level' },
    { voc: 'Exalted Monk (Monk)', avg: 505, median: 371, note: 'Boa opção de entrada para quem quer gastar menos' },
  ],
  itemMultipliers: {
    tier1: '+150 a +350 TC no valor final',
    tier2: '+450 a +850 TC no valor final',
    tier3: '+1.200 a +2.500 TC no valor final (Soulstalkers, Lion Bow, etc.)',
    charms1000: '+250 a +400 TC a cada 1.000 charm points'
  }
};

export default function BazaarSniper({ onPlayerClick, onNavigate, isPremium }) {
  const { selectedWorld, setSelectedWorld } = useWorld();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoc, setSelectedVoc] = useState('ALL');
  const [activeChip, setActiveChip] = useState('all');
  const [sortOption, setSortOption] = useState('ending');
  const [audioEnabled, setAudioEnabled] = useState(soundFX.isEnabled());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showFipeOverview, setShowFipeOverview] = useState(false);
  const [selectedAuctionModal, setSelectedAuctionModal] = useState(null);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Filtros Básicos & Status
  const [minLevel, setMinLevel] = useState('');
  const [maxLevel, setMaxLevel] = useState('');
  const [minBid, setMinBid] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [minCharms, setMinCharms] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'active' | 'all' | 'ended'

  // 2. Filtros de Equipamentos Valiosos & Tiers da Forja
  const [itemSetFilter, setItemSetFilter] = useState('all'); // 'all' | 'bis' | 'soulwar' | 'falcon' | 'sanguine' | 'naga_cobra' | 'lion_spirit'
  const [itemTierFilter, setItemTierFilter] = useState('all'); // 'all' | 'tier1' | 'tier2' | 'tier3'

  // 3. Filtros de Habilidades & Skills
  const [minMagLevel, setMinMagLevel] = useState('');
  const [minDist, setMinDist] = useState('');
  const [minMelee, setMinMelee] = useState('');
  const [meleeType, setMeleeType] = useState('any'); // 'any' | 'sword' | 'axe' | 'club'
  const [minShielding, setMinShielding] = useState('');

  // Favoritos
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('rubinot_bazaar_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

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

  // Ticker de tempo regressivo
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bazaar_alerts')
        .select('*')
        .order('auction_end', { ascending: false })
        .limit(600);

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

  // Avaliação FIPE individual calibrada com os dados reais de venda do RubinOT
  const calculateCharFipe = (char) => {
    const lvl = Number(char.level) || 100;
    const ch = Number(char.charm_points) || 0;
    const voc = (char.vocation || '').toLowerCase();
    
    // Taxa base calibrada por level com dados de 1.000 leilões do RubinOT
    let baseRate = 1.0;
    if (lvl > 700) baseRate = 1.2;
    if (lvl > 900) baseRate = 1.5;
    if (lvl > 1100) baseRate = 1.9;

    // Multiplicador da vocação conforme valorização real de venda
    if (voc.includes('druid')) baseRate *= 1.25;
    else if (voc.includes('paladin')) baseRate *= 1.20;
    else if (voc.includes('knight')) baseRate *= 1.05;
    else if (voc.includes('sorcerer')) baseRate *= 1.02;
    else if (voc.includes('monk')) baseRate *= 0.95;

    let baseTc = Math.round(lvl * baseRate);

    // Bônus por charms: cada 1000 charms adiciona ~300 TC
    const charmsBonus = Math.round((ch / 1000) * 300);

    // Bônus por itens tierizados no char
    let tierBonus = 0;
    if (Array.isArray(char.items_data)) {
      char.items_data.forEach(it => {
        if (it?.tier === 1) tierBonus += 250;
        else if (it?.tier === 2) tierBonus += 600;
        else if (it?.tier >= 3) tierBonus += 1500;
      });
    }

    const avgFipe = Math.round(baseTc + charmsBonus + tierBonus);
    const minFipe = Math.round(avgFipe * 0.85);
    const maxFipe = Math.round(avgFipe * 1.15);

    const currentBid = Number(char.current_bid) || 0;
    const discountPct = (avgFipe > 0 && currentBid > 0) ? Math.round(((avgFipe - currentBid) / avgFipe) * 100) : 0;
    // Lucro estimado na revenda (Preço FIPE - 12% taxa cipsoft - 50 TC fixa - Lance)
    const estimatedProfitTc = Math.max(0, Math.round(avgFipe * 0.88 - 50 - currentBid));

    return { avgFipe, minFipe, maxFipe, discountPct, estimatedProfitTc, tierBonus };
  };

  // Checagem de itens BiS / Meta
  const checkCharHasBis = (itemsData) => {
    if (!Array.isArray(itemsData)) return false;
    return itemsData.some(it => it?.name && BIS_KEYWORDS.some(k => it.name.toLowerCase().includes(k)));
  };

  // Contagem de leilões por vocação
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

  // Formatação de tempo restante
  const getTimeRemaining = (auctionEnd) => {
    if (!auctionEnd) return { text: 'Expirado', isUrgent: false, isImminent: false, isEnded: true, totalSeconds: 0 };
    const diff = new Date(auctionEnd).getTime() - nowTimestamp;
    if (diff <= 0) return { text: 'Encerrado (Vendido)', isUrgent: false, isImminent: false, isEnded: true, totalSeconds: 0 };

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const isImminent = totalSeconds < 30 * 60;
    const isUrgent = totalSeconds < 2 * 3600;

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

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (minLevel || maxLevel) count++;
    if (minBid || maxBid) count++;
    if (minCharms) count++;
    if (statusFilter !== 'all') count++;
    if (itemSetFilter !== 'all') count++;
    if (itemTierFilter !== 'all') count++;
    if (minMagLevel) count++;
    if (minDist) count++;
    if (minMelee) count++;
    if (minShielding) count++;
    return count;
  }, [minLevel, maxLevel, minBid, maxBid, minCharms, statusFilter, itemSetFilter, itemTierFilter, minMagLevel, minDist, minMelee, minShielding]);

  const resetAllFilters = () => {
    setMinLevel('');
    setMaxLevel('');
    setMinBid('');
    setMaxBid('');
    setMinCharms('');
    setSelectedVoc('ALL');
    setSelectedWorld('ALL');
    setSearchQuery('');
    setActiveChip('all');
    setStatusFilter('all');
    setItemSetFilter('all');
    setItemTierFilter('all');
    setMinMagLevel('');
    setMinDist('');
    setMinMelee('');
    setMeleeType('any');
    setMinShielding('');
  };

  // Filtragem e Ordenação
  const filteredAndSortedAuctions = useMemo(() => {
    let result = alerts.filter(a => {
      const timeInfo = getTimeRemaining(a.auction_end);

      // Status Filter
      if (statusFilter === 'active' && timeInfo.isEnded) return false;
      if (statusFilter === 'ended' && !timeInfo.isEnded) return false;

      // Mundo
      if (selectedWorld !== 'ALL' && a.world_name && a.world_name.toLowerCase() !== selectedWorld.toLowerCase()) {
        return false;
      }

      // Busca por Texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (a.character_name || '').toLowerCase().includes(q);
        const matchItem = Array.isArray(a.items_data) && a.items_data.some(it => (it?.name || '').toLowerCase().includes(q));
        if (!matchName && !matchItem) return false;
      }

      // Vocação
      if (selectedVoc !== 'ALL') {
        const voc = (a.vocation || '').toLowerCase();
        if (selectedVoc === 'knight' && !voc.includes('knight')) return false;
        if (selectedVoc === 'paladin' && !voc.includes('paladin')) return false;
        if (selectedVoc === 'sorcerer' && !voc.includes('sorcerer')) return false;
        if (selectedVoc === 'druid' && !voc.includes('druid')) return false;
        if (selectedVoc === 'monk' && !voc.includes('monk')) return false;
        if (selectedVoc === 'none' && (voc.includes('knight') || voc.includes('paladin') || voc.includes('sorcerer') || voc.includes('druid') || voc.includes('monk'))) return false;
      }

      // Faixas de Nível e Lance
      if (minLevel && (a.level || 0) < Number(minLevel)) return false;
      if (maxLevel && (a.level || 0) > Number(maxLevel)) return false;
      if (minBid && (a.current_bid || 0) < Number(minBid)) return false;
      if (maxBid && (a.current_bid || 0) > Number(maxBid)) return false;
      if (minCharms && (a.charm_points || 0) < Number(minCharms)) return false;

      // Filtro de Equipamentos Valiosos (Itens Bons / BiS)
      if (itemSetFilter !== 'all') {
        if (!Array.isArray(a.items_data) || a.items_data.length === 0) return false;
        if (itemSetFilter === 'bis') {
          const hasBis = a.items_data.some(it => it?.name && BIS_KEYWORDS.some(k => it.name.toLowerCase().includes(k)));
          if (!hasBis) return false;
        } else if (itemSetFilter === 'soulwar') {
          const hasSoul = a.items_data.some(it => it?.name && it.name.toLowerCase().includes('soul'));
          if (!hasSoul) return false;
        } else if (itemSetFilter === 'falcon') {
          const hasFalcon = a.items_data.some(it => it?.name && it.name.toLowerCase().includes('falcon'));
          if (!hasFalcon) return false;
        } else if (itemSetFilter === 'sanguine') {
          const hasSanguine = a.items_data.some(it => it?.name && it.name.toLowerCase().includes('sanguine'));
          if (!hasSanguine) return false;
        } else if (itemSetFilter === 'naga_cobra') {
          const hasNagaCobra = a.items_data.some(it => it?.name && (it.name.toLowerCase().includes('naga') || it.name.toLowerCase().includes('cobra')));
          if (!hasNagaCobra) return false;
        } else if (itemSetFilter === 'lion_spirit') {
          const hasLionSpirit = a.items_data.some(it => it?.name && (it.name.toLowerCase().includes('lion') || it.name.toLowerCase().includes('spiritthorn') || it.name.toLowerCase().includes('alicorn') || it.name.toLowerCase().includes('eldritch')));
          if (!hasLionSpirit) return false;
        }
      }

      // Filtro de Tier da Forja
      if (itemTierFilter !== 'all') {
        if (!Array.isArray(a.items_data)) return false;
        if (itemTierFilter === 'tier1' && !a.items_data.some(it => it?.tier >= 1)) return false;
        if (itemTierFilter === 'tier2' && !a.items_data.some(it => it?.tier >= 2)) return false;
        if (itemTierFilter === 'tier3' && !a.items_data.some(it => it?.tier >= 3)) return false;
      }

      // Filtro de Magic Level (ML)
      if (minMagLevel && (a.mag_level || 0) < Number(minMagLevel)) return false;

      // Filtro de Distance (RP)
      if (minDist && (a.skills_data?.dist || 0) < Number(minDist)) return false;

      // Filtro de Melee (Sword, Axe, Club ou Qualquer)
      if (minMelee) {
        const reqMelee = Number(minMelee);
        if (meleeType === 'sword') {
          if ((a.skills_data?.sword || 0) < reqMelee) return false;
        } else if (meleeType === 'axe') {
          if ((a.skills_data?.axe || 0) < reqMelee) return false;
        } else if (meleeType === 'club') {
          if ((a.skills_data?.club || 0) < reqMelee) return false;
        } else {
          const maxM = Math.max(a.skills_data?.sword || 0, a.skills_data?.axe || 0, a.skills_data?.club || 0);
          if (maxM < reqMelee) return false;
        }
      }

      // Filtro de Shielding
      if (minShielding && (a.skills_data?.shielding || 0) < Number(minShielding)) return false;

      // Chips Rápidos
      if (activeChip === 'opportunity') {
        const fipe = calculateCharFipe(a);
        return fipe.discountPct >= 20 || a.is_sniping_opportunity;
      }
      if (activeChip === 'bis_gear') {
        return checkCharHasBis(a.items_data);
      }
      if (activeChip === 'tier2_plus') {
        return Array.isArray(a.items_data) && a.items_data.some(it => it?.tier >= 2);
      }
      if (activeChip === 'high_skills') {
        const voc = (a.vocation || '').toLowerCase();
        const isMage = voc.includes('sorcerer') || voc.includes('druid');
        const dist = a.skills_data?.dist || 0;
        const melee = Math.max(a.skills_data?.sword || 0, a.skills_data?.axe || 0, a.skills_data?.club || 0);
        const ml = a.mag_level || 0;
        if (isMage) {
          if (ml < 115) return false;
        } else {
          if (dist < 120 && melee < 120 && ml < 35) return false;
        }
      }
      if (activeChip === 'ending_soon') {
        return !timeInfo.isEnded && timeInfo.totalSeconds < 3 * 3600;
      }
      if (activeChip === 'favorites') {
        const aId = a.id || a.auction_id;
        return favorites.includes(aId);
      }
      if (activeChip === 'tiered_items') {
        return Array.isArray(a.items_data) && a.items_data.some(it => it && it.tier > 0);
      }
      if (activeChip === 'hunted') return a.is_hunted;
      if (activeChip === 'high_level') return (a.level || 0) >= 800;
      if (activeChip === 'cheap') return (a.current_bid || 0) <= 500 && (a.current_bid || 0) > 0;
      if (activeChip === 'charms') return (a.charm_points || 0) >= 1000;

      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      const timeA = new Date(a.auction_end).getTime();
      const timeB = new Date(b.auction_end).getTime();
      const isEndedA = timeA - nowTimestamp <= 0;
      const isEndedB = timeB - nowTimestamp <= 0;

      // Se statusFilter for 'all', ativos vêm primeiro
      if (statusFilter === 'all' && isEndedA !== isEndedB) {
        return isEndedA ? 1 : -1;
      }

      if (sortOption === 'ending') {
        return isEndedA ? (timeB - timeA) : (timeA - timeB);
      }
      if (sortOption === 'profit_desc') {
        const profitA = calculateCharFipe(a).estimatedProfitTc;
        const profitB = calculateCharFipe(b).estimatedProfitTc;
        return profitB - profitA;
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
      if (sortOption === 'charms') {
        return (b.charm_points || 0) - (a.charm_points || 0);
      }
      return 0;
    });

    return result;
  }, [alerts, selectedWorld, searchQuery, selectedVoc, activeChip, sortOption, minLevel, maxLevel, minBid, maxBid, minCharms, statusFilter, itemSetFilter, itemTierFilter, minMagLevel, minDist, minMelee, meleeType, minShielding, favorites, nowTimestamp]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = alerts.length;
    let activeCount = 0;
    let endedCount = 0;
    let opportunities = 0;
    let endingSoon = 0;
    let tieredCount = 0;
    let bisCount = 0;

    alerts.forEach(a => {
      const timeInfo = getTimeRemaining(a.auction_end);
      if (!timeInfo.isEnded) {
        activeCount++;
        if (timeInfo.totalSeconds < 3 * 3600) endingSoon++;
      } else {
        endedCount++;
      }
      const fipe = calculateCharFipe(a);
      if (fipe.discountPct >= 20 || a.is_sniping_opportunity) opportunities++;
      if (Array.isArray(a.items_data)) {
        if (a.items_data.some(it => it?.tier > 0)) tieredCount++;
        if (a.items_data.some(it => it?.name && BIS_KEYWORDS.some(k => it.name.toLowerCase().includes(k)))) bisCount++;
      }
    });

    return { total, activeCount, endedCount, opportunities, endingSoon, tieredCount, bisCount, favoritesCount: favorites.length };
  }, [alerts, favorites, nowTimestamp]);

  const handleShareAuction = (auction) => {
    const fipe = calculateCharFipe(auction);
    const text = `[Rubinot Bazaar] ${auction.character_name} (Lvl ${auction.level} - ${formatVocation(auction.vocation)}) | Preço: ${auction.current_bid} TC (FIPE: ~${fipe.avgFipe} TC) | Mundo: ${auction.world_name}`;
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
              Char Bazaar & Histórico Oficial RubinOT
            </div>

            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold drop-shadow-lg leading-tight">
              Bazaar Sniper <span className="text-white">& Histórico 💎</span>
            </h1>
            
            <p className="text-gray-300 font-sans text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Consulte leilões ativos e o histórico dos últimos 30 dias de vendas do RubinOT. Filtre por skills avançadas, itens BiS/forja e clique em qualquer personagem para inspecionar tudo o que ele tinha!
            </p>
          </div>

          {/* PAINEL DE AÇÕES DO TOPO */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowFipeOverview(!showFipeOverview)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-md active:scale-95 ${
                showFipeOverview
                  ? 'bg-yellow-500 text-stone-950 border-yellow-400 font-black'
                  : 'bg-yellow-500/15 hover:bg-yellow-500/25 border-yellow-500/40 text-yellow-300'
              }`}
            >
              <BarChart3 size={15} />
              <span>Médias FIPE do RubinOT</span>
            </button>

            <button
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                showFiltersDrawer || activeFiltersCount > 0
                  ? 'bg-yellow-500 text-stone-950 border-yellow-400 font-black shadow-lg shadow-yellow-500/20'
                  : 'bg-black/60 border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <SlidersHorizontal size={15} />
              <span>Filtros Pro & Skills</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Alternar Visualização: Grid vs Tabela */}
            <div className="flex bg-stone-900 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-yellow-500 text-stone-950 shadow' : 'text-gray-400 hover:text-white'}`}
                title="Modo Cards"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-yellow-500 text-stone-950 shadow' : 'text-gray-400 hover:text-white'}`}
                title="Modo Tabela Sniper"
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

        {/* PAINEL DINÂMICO: MÉDIAS REAIS DE VALORES FIPE DO RUBINOT */}
        {showFipeOverview && (
          <div className="mt-6 pt-6 border-t border-yellow-500/20 space-y-4 animate-fade-in bg-stone-950/90 p-5 sm:p-6 rounded-2xl border border-yellow-500/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-yellow-400 flex items-center gap-2">
                  <BarChart3 size={18} /> Estudo Estatístico Real do Bazaar RubinOT (Últimos 30 Dias)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculado cruzando o histórico de 1.000 leilões oficiais arrematados.
                </p>
              </div>
              <span className="text-xs text-amber-300 font-mono bg-yellow-950/40 px-3 py-1 rounded-lg border border-yellow-500/30">
                1.000 Chars Analisados
              </span>
            </div>

            {/* Grid 1: Médias por Faixa de Level */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                1. Preço Médio de Venda por Faixa de Nível
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {RUBINOT_MARKET_STATS.ranges.map((r, idx) => (
                  <div key={idx} className="bg-stone-900/80 border border-stone-800 rounded-xl p-3.5 space-y-1">
                    <div className="text-xs font-bold text-white">{r.range}</div>
                    <div className="text-xl font-bold text-yellow-400 font-mono mt-1">
                      ~{r.avg} TC <span className="text-xs text-gray-400 font-normal">(Mediana: {r.median} TC)</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono">{r.ratio}</div>
                    <div className="text-[10px] text-gray-500">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid 2: Médias por Vocação */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                2. Valorização e Demanda por Vocação
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RUBINOT_MARKET_STATS.vocations.map((v, idx) => (
                  <div key={idx} className="bg-stone-900/80 border border-stone-800 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{v.voc}</span>
                      <span className="text-yellow-400 font-mono">Média: ~{v.avg} TC</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">{v.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid 3: Multiplicadores de Tiers e Charms */}
            <div className="p-3.5 bg-yellow-950/20 border border-yellow-500/20 rounded-xl flex items-start gap-3">
              <Zap size={18} className="text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-yellow-300">O que mais agrega valor ao char:</strong> Itens Tier 1 da forja adicionam em média <strong className="text-white">+250 TC</strong>, enquanto equipamentos Tier 3 (como Soulstalkers ou Lion Bow T3) chegam a adicionar mais de <strong className="text-white">+1.500 TC</strong> ao valor arrematado! Cada 1.000 charm points acrescentam em média <strong className="text-white">+300 TC</strong>.
              </div>
            </div>
          </div>
        )}

        {/* DRAWER AVANÇADO DE FILTROS PRO (SKILLS, ITENS BONS, FORJA E METAS) */}
        {showFiltersDrawer && (
          <div className="mt-6 pt-6 border-t border-yellow-500/20 space-y-5 animate-fade-in bg-stone-950/95 p-5 sm:p-6 rounded-2xl border border-yellow-500/40 shadow-2xl">
            
            {/* SEÇÃO 1: FILTROS DE EQUIPAMENTOS VALIOSOS & TIERS */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-stone-800 text-xs font-bold text-yellow-400 uppercase tracking-wider">
                <Gem size={15} /> 1. Equipamentos Bons & Forja de Exaltação
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Equipamentos / Sets Notáveis (BiS)</span>
                    <span className="text-[10px] text-yellow-400 font-mono">269 chars com BiS</span>
                  </label>
                  <select
                    value={itemSetFilter}
                    onChange={(e) => setItemSetFilter(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-yellow-300 font-bold focus:outline-none focus:border-yellow-500"
                  >
                    <option value="all">Qualquer Equipamento</option>
                    <option value="bis">💎 Qualquer Item BiS / Meta (Soul, Falcon, Sanguine...)</option>
                    <option value="soulwar">💀 Soulwar Gear (Soulshell, Soulstalkers, Soulmaimer...)</option>
                    <option value="falcon">🦅 Falcon Gear (Falcon Bow, Coif, Battleaxe, Plate...)</option>
                    <option value="sanguine">🩸 Sanguine Gear (Rotten Blood BiS Lendário)</option>
                    <option value="naga_cobra">🐍 Naga & Cobra Gear (Crossbow, Rod, Wand, Axe...)</option>
                    <option value="lion_spirit">🦁 Lion / Spiritthorn / Alicorn / Eldritch</option>
                  </select>
                </div>

                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Nível de Tier da Forja</span>
                    <span className="text-[10px] text-cyan-400 font-mono">172 chars com Tier</span>
                  </label>
                  <select
                    value={itemTierFilter}
                    onChange={(e) => setItemTierFilter(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">Qualquer Tier</option>
                    <option value="tier1">⚡ Possui Itens Tier 1 ou superior (T1+)</option>
                    <option value="tier2">⚡⚡ Possui Itens Tier 2 ou superior (T2+)</option>
                    <option value="tier3">👑 Possui Itens Tier 3 Lendário (T3+)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: FILTROS DE HABILIDADES & SKILLS */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-stone-800 text-xs font-bold text-yellow-400 uppercase tracking-wider">
                <Crosshair size={15} /> 2. Habilidades & Skills Mínimas
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Magic Level */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-2">
                  <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Wand2 size={14} /> Magic Level Mínimo
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 35 ou 120"
                    value={minMagLevel}
                    onChange={(e) => setMinMagLevel(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[35, 40, 100, 120, 130].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMinMagLevel(String(val))}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${minMagLevel === String(val) ? 'bg-blue-600 text-white font-bold' : 'bg-stone-800 text-gray-400 hover:text-white'}`}
                      >
                        {val}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance Fighting */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-2">
                  <label className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                    <Target size={14} /> Distance Mínimo (RP)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 115 ou 125"
                    value={minDist}
                    onChange={(e) => setMinDist(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[115, 120, 125, 130, 135].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMinDist(String(val))}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${minDist === String(val) ? 'bg-green-600 text-white font-bold' : 'bg-stone-800 text-gray-400 hover:text-white'}`}
                      >
                        {val}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Melee Skill (Sword/Axe/Club) */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <Sword size={14} /> Melee (EK/Monk)
                    </label>
                    <select
                      value={meleeType}
                      onChange={(e) => setMeleeType(e.target.value)}
                      className="bg-stone-950 border border-stone-700 text-[10px] text-gray-300 rounded px-1.5 py-0.5"
                    >
                      <option value="any">Qualquer Melee</option>
                      <option value="sword">Espada (Sword)</option>
                      <option value="axe">Machado (Axe)</option>
                      <option value="club">Clava (Club)</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    placeholder="Ex: 115 ou 125"
                    value={minMelee}
                    onChange={(e) => setMinMelee(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[115, 120, 125, 130, 135].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMinMelee(String(val))}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${minMelee === String(val) ? 'bg-red-600 text-white font-bold' : 'bg-stone-800 text-gray-400 hover:text-white'}`}
                      >
                        {val}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shielding */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-2">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Shielding Mínimo
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 110 ou 120"
                    value={minShielding}
                    onChange={(e) => setMinShielding(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[105, 110, 115, 120, 125].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMinShielding(String(val))}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${minShielding === String(val) ? 'bg-stone-600 text-white font-bold' : 'bg-stone-800 text-gray-400 hover:text-white'}`}
                      >
                        {val}+
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: NÍVEL, LANCE, CHARMS & STATUS */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-stone-800 text-xs font-bold text-yellow-400 uppercase tracking-wider">
                <Coins size={15} /> 3. Nível, Preço (TC) e Andamento
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
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
                      Histórico
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BARRA DE AÇÕES DO DRAWER */}
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-gray-400 font-mono">
                {filteredAndSortedAuctions.length} leilões filtrados com sucesso
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-gray-300 font-bold transition-colors"
                >
                  Limpar Todos os Filtros
                </button>
                <button
                  type="button"
                  onClick={() => setShowFiltersDrawer(false)}
                  className="px-4 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-xs text-stone-950 font-black transition-colors"
                >
                  Aplicar e Fechar
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 2. SELETOR VISUAL DE TODAS AS CLASSES COM CONTAGEM REAL */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sword size={14} className="text-amber-400" /> Filtrar por Classe de Personagem
          </span>
          <span className="text-xs text-gray-500">
            {filteredAndSortedAuctions.length} leilões encontrados
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

      {/* 3. STRIP DE MÉTRICAS & CHIPS RÁPIDOS */}
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
            <span className="text-xs text-gray-400 uppercase font-semibold">Total no Banco</span>
            <Search className="text-blue-400" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-medieval font-bold text-white mt-1">{stats.total}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{stats.activeCount} ativos • {stats.endedCount} históricos</p>
        </div>

        <div 
          onClick={() => setActiveChip('bis_gear')}
          className={`bg-black/80 border p-3.5 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'bis_gear' 
              ? 'border-purple-500 bg-purple-950/20 shadow-purple-500/10' 
              : 'border-yellow-500/20 hover:border-purple-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-purple-400 uppercase font-semibold">Com Itens BiS</span>
            <Gem className="text-purple-400" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-medieval font-bold text-purple-300 mt-1">{stats.bisCount}</p>
          <p className="text-[11px] text-purple-400/70 mt-0.5">Soulwar, Falcon, Sanguine</p>
        </div>

        <div 
          onClick={() => setActiveChip('tiered_items')}
          className={`bg-black/80 border p-3.5 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'tiered_items' 
              ? 'border-cyan-500 bg-cyan-950/20 shadow-cyan-500/10' 
              : 'border-yellow-500/20 hover:border-cyan-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-cyan-400 uppercase font-semibold">Com Itens Tier</span>
            <Zap className="text-cyan-400" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-medieval font-bold text-cyan-400 mt-1">{stats.tieredCount}</p>
          <p className="text-[11px] text-cyan-500/70 mt-0.5">Tier 1 ao 3 inclusos</p>
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
          <p className="text-[11px] text-amber-400/70 mt-0.5">Watchlist salva</p>
        </div>
      </div>

      {/* 4. BARRA DE BUSCA, MUNDO & ORDENAÇÃO */}
      <div className="bg-black/80 border border-yellow-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Buscar personagem ou item (ex: soulshell, falcon, sanguine, naga, lion)..."
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
              <option value="ending">⏳ Término / Venda Recente</option>
              <option value="profit_desc">🔥 Maior Lucro FIPE (Revenda)</option>
              <option value="price_asc">💰 Menor Preço (TC)</option>
              <option value="price_desc">💎 Maior Preço (TC)</option>
              <option value="level_desc">📈 Maior Nível (Level)</option>
              <option value="charms">⭐ Mais Charms</option>
            </select>
          </div>

        </div>

        {/* Chips Rápidos de Atalhos */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: '🌟 Todos' },
              { id: 'bis_gear', label: '💎 Com BiS (Soul/Falcon/Sanguine)' },
              { id: 'tier2_plus', label: '⚡ Tier 2+' },
              { id: 'high_skills', label: '🎯 Skills 120+ / ML Alto' },
              { id: 'opportunity', label: '🔥 Pechinchas FIPE' },
              { id: 'ending_soon', label: '⏳ Últimas Horas' },
              { id: 'favorites', label: `⭐ Favoritos (${favorites.length})` },
              { id: 'high_level', label: '👑 Lvl 800+' },
              { id: 'cheap', label: '💰 Até 500 TC' },
              { id: 'charms', label: '⭐ 1.000+ Charms' }
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

          {(minLevel || maxLevel || minBid || maxBid || minCharms || selectedVoc !== 'ALL' || selectedWorld !== 'ALL' || searchQuery || activeChip !== 'all' || statusFilter !== 'all' || itemSetFilter !== 'all' || itemTierFilter !== 'all' || minMagLevel || minDist || minMelee || minShielding) && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-yellow-400 hover:text-white underline font-bold"
            >
              Resetar Todos os Filtros
            </button>
          )}
        </div>
      </div>

      {/* 5. LISTAGEM DE LEILÕES (MODO CARDS OU MODO TABELA) */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
          <p className="font-medieval text-xl text-yellow-400">Rastreando personagens e histórico de leilões...</p>
        </div>
      ) : filteredAndSortedAuctions.length === 0 ? (
        <div className="bg-black/60 border border-yellow-500/20 p-12 rounded-2xl text-center space-y-3">
          <Target className="mx-auto text-yellow-500/40" size={48} />
          <h3 className="text-xl font-medieval text-white">Nenhum leilão encontrado para os filtros atuais</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Tente flexibilizar os filtros de skills, selecionar "Todas as Classes" ou marcar "Qualquer Equipamento" para expandir os resultados.
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-xs font-bold text-yellow-300 transition-all"
          >
            Ver Todos os Leilões (Limpar Filtros)
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
                  <th className="p-3.5">Equipamentos / Tiers</th>
                  <th className="p-3.5">Preço (TC)</th>
                  <th className="p-3.5">FIPE Real</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Inspecionar</th>
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
                  const hasTier = Array.isArray(auction.items_data) && auction.items_data.some(it => it && it.tier > 0);
                  const highestTier = Array.isArray(auction.items_data) ? auction.items_data.reduce((max, it) => Math.max(max, it?.tier || 0), 0) : 0;
                  const hasBis = checkCharHasBis(auction.items_data);

                  return (
                    <tr 
                      key={aId}
                      onClick={() => setSelectedAuctionModal(auction)}
                      className={`hover:bg-stone-900/70 transition-colors cursor-pointer ${timeInfo.isEnded ? 'opacity-75 bg-stone-950/40' : ''}`}
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
                        <div className="font-bold text-white hover:text-yellow-400 flex items-center gap-1.5 flex-wrap">
                          <span>{auction.character_name}</span>
                          {auction.is_hunted && <span className="text-[10px] px-1 bg-red-600 text-white rounded font-bold">Hunted</span>}
                          {hasBis && <span className="text-[10px] px-1 bg-purple-950 text-purple-300 border border-purple-500/40 rounded font-bold">💎 BiS</span>}
                          {highestTier > 0 && <span className="text-[10px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded font-bold">⚡ T{highestTier}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-yellow-300 font-mono">{auction.world_name || 'Rubinot'}</td>
                      <td className="p-3 text-gray-300">{vocStr}</td>
                      <td className="p-3 font-bold text-white font-mono">{auction.level}</td>
                      <td className="p-3 text-gray-300 font-mono">
                        {auction.mag_level ? `ML ${auction.mag_level}` : `Dist ${auction.skills_data?.dist || auction.skills_data?.sword || '?'}`}
                      </td>
                      <td className="p-3 text-purple-300 font-mono">{auction.charm_points || 0}</td>
                      <td className="p-3 text-gray-400">
                        {Array.isArray(auction.items_data) && auction.items_data.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-cyan-400 font-mono font-bold">{auction.items_data.length} itens</span>
                            {hasBis && <span className="text-[10px] text-purple-400">✦ BiS</span>}
                          </div>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-yellow-400 font-mono">{bidVal.toLocaleString()} TC</td>
                      <td className="p-3 text-gray-400 font-mono">~{fipe.avgFipe.toLocaleString()} TC</td>
                      <td className="p-3">
                        {timeInfo.isEnded ? (
                          <span className="text-gray-500 text-[11px]">Finalizado</span>
                        ) : (
                          <span className={`font-mono text-xs ${timeInfo.isImminent ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                            {timeInfo.text}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedAuctionModal(auction); }}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-yellow-400 border border-stone-700 font-bold text-xs transition-colors"
                        >
                          Ver Tudo 🔍
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
            const highestTier = Array.isArray(auction.items_data) ? auction.items_data.reduce((max, it) => Math.max(max, it?.tier || 0), 0) : 0;
            const hasBis = checkCharHasBis(auction.items_data);

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

            const maxMeleeVal = Math.max(auction.skills_data?.sword || 0, auction.skills_data?.axe || 0, auction.skills_data?.club || 0);
            const isTopSkill = (isMage && (auction.mag_level || 0) >= 115) ||
              (!isMage && (auction.skills_data?.dist >= 120 || maxMeleeVal >= 120 || (auction.mag_level || 0) >= 35));

            return (
              <div 
                key={aId}
                onClick={() => setSelectedAuctionModal(auction)}
                className={`bg-gradient-to-b from-stone-950 via-black to-stone-950 border rounded-2xl p-5 relative overflow-hidden transition-all flex flex-col justify-between group shadow-xl cursor-pointer ${
                  timeInfo.isEnded
                    ? 'opacity-75 border-stone-800/80 hover:border-stone-700'
                    : auction.is_hunted
                    ? 'border-red-500/60 shadow-red-500/10'
                    : timeInfo.isImminent
                    ? 'border-amber-500 shadow-amber-500/20 animate-pulse'
                    : fipe.discountPct >= 20
                    ? 'border-yellow-500/70 shadow-yellow-500/15'
                    : 'border-white/10 hover:border-yellow-500/40'
                }`}
              >
                <div>
                  {/* BADGE DE TOPO */}
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

                      {hasBis && (
                        <span className="bg-purple-950/90 border border-purple-500/50 text-purple-300 text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 shadow">
                          💎 BiS Gear
                        </span>
                      )}

                      {highestTier > 0 && (
                        <span className="bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                          ⚡ Tier {highestTier}
                        </span>
                      )}

                      {isTopSkill && (
                        <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                          🎯 Top Skill
                        </span>
                      )}

                      {fipe.discountPct >= 20 && !timeInfo.isEnded && (
                        <span className="bg-emerald-500 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                          <Flame size={12} /> {fipe.discountPct}% Abaixo FIPE
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
                      <h3 className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors truncate flex items-center gap-1.5">
                        <span>{auction.character_name}</span>
                        <Eye size={13} className="text-gray-500 group-hover:text-yellow-400 shrink-0" />
                      </h3>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                        <span className="font-bold text-yellow-400">Lvl {auction.level}</span>
                        <span>•</span>
                        <span className="text-gray-300">{vocStr}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
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
                        <Coins size={11} className="text-yellow-400" /> FIPE Real
                      </span>
                      <span className="font-bold text-amber-300">
                        {fipe.avgFipe} TC
                      </span>
                    </div>
                  </div>

                  {/* ITENS INCLUSOS COM BADGE DE TIER E DESTAQUE BIS */}
                  {Array.isArray(auction.items_data) && auction.items_data.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 p-2 rounded-xl bg-black/40 border border-white/5 overflow-x-auto custom-scrollbar">
                      {auction.items_data.slice(0, 6).map((item, idx) => {
                        const isBisItem = item?.name && BIS_KEYWORDS.some(k => item.name.toLowerCase().includes(k));

                        return (
                          <div key={idx} className="relative shrink-0 group/item">
                            <img 
                              src={`https://api.increasesoft.com/api/images/item/${encodeURIComponent(item?.name || '')}?v=4`}
                              alt={item?.name || 'Item'}
                              title={`${item?.name || ''} ${item?.tier > 0 ? `[Tier ${item.tier}]` : ''} ${isBisItem ? '(BiS / Meta)' : ''}`}
                              className={`w-7 h-7 object-contain drop-shadow rounded p-0.5 border ${
                                isBisItem 
                                  ? 'bg-purple-950/60 border-purple-500/60' 
                                  : 'bg-stone-900/60 border-stone-700/40'
                              }`}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            {item?.tier > 0 && (
                              <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[9px] font-black px-1 rounded-full shadow">
                                T{item.tier}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {auction.items_data.length > 6 && (
                        <span className="text-[10px] text-gray-400 font-bold px-1.5 py-0.5 bg-stone-800 rounded">
                          +{auction.items_data.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* PREÇO FINAL & BOTÃO DE INSPEÇÃO */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex justify-between items-center bg-black/60 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] text-gray-400 block">
                        {timeInfo.isEnded ? 'Preço Vendido:' : 'Lance Atual:'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Coins size={15} className="text-yellow-400" />
                        <span className="text-lg font-black text-white font-mono">
                          {bidVal.toLocaleString()} <span className="text-xs text-yellow-400 font-bold">TC</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">Avaliação FIPE:</span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        ~{fipe.avgFipe.toLocaleString()} TC
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedAuctionModal(auction); }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-yellow-500/40 text-xs font-bold text-yellow-300 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                  >
                    <Package size={14} />
                    <span>Inspecionar Tudo o Que Tinha 🔍</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 6. MODAL COMPLETO DE INSPEÇÃO: TUDO O QUE O PERSONAGEM TINHA! */}
      {selectedAuctionModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-950 border-2 border-yellow-500/50 rounded-3xl p-6 max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl relative">
            
            <button
              type="button"
              onClick={() => setSelectedAuctionModal(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-stone-900 hover:bg-stone-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Cabeçalho do Personagem */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-stone-900 border-2 border-yellow-500/40 flex items-center justify-center shrink-0 shadow-lg">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAuctionModal.character_name)}&background=1c1917&color=eab308&bold=true`}
                  alt={selectedAuctionModal.character_name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              </div>

              <div>
                <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>Leilão #{selectedAuctionModal.auction_id}</span>
                  <span>•</span>
                  <span className="text-yellow-300 font-mono">{selectedAuctionModal.world_name || 'Rubinot'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-0.5 flex items-center gap-2">
                  <span>{selectedAuctionModal.character_name}</span>
                  {selectedAuctionModal.is_hunted && (
                    <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded font-black uppercase">
                      Hunted
                    </span>
                  )}
                  {checkCharHasBis(selectedAuctionModal.items_data) && (
                    <span className="text-xs px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-500/50 rounded font-black uppercase">
                      💎 Com BiS
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-gray-400 flex-wrap">
                  <span className="text-yellow-400 font-bold font-mono">Level {selectedAuctionModal.level}</span>
                  <span>•</span>
                  <span className="text-gray-200">{formatVocation(selectedAuctionModal.vocation)}</span>
                  <span>•</span>
                  <span className="text-purple-400 font-mono font-bold">{selectedAuctionModal.charm_points || 0} Charm Points</span>
                </div>
              </div>
            </div>

            {/* 1. INVENTÁRIO & ITENS DO PERSONAGEM (COM TIERS, FOTOS E IDENTIFICAÇÃO DE ITENS BONS) */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={15} /> Itens e Equipamentos Inclusos
                </h3>
                <span className="text-xs text-gray-500 font-mono">
                  {Array.isArray(selectedAuctionModal.items_data) ? selectedAuctionModal.items_data.length : 0} itens detectados
                </span>
              </div>

              {Array.isArray(selectedAuctionModal.items_data) && selectedAuctionModal.items_data.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {selectedAuctionModal.items_data.map((item, idx) => {
                    const isSoul = item?.name && item.name.toLowerCase().includes('soul');
                    const isFalcon = item?.name && item.name.toLowerCase().includes('falcon');
                    const isSanguine = item?.name && item.name.toLowerCase().includes('sanguine');
                    const isOtherBis = item?.name && BIS_KEYWORDS.some(k => item.name.toLowerCase().includes(k)) && !isSoul && !isFalcon && !isSanguine;

                    return (
                      <div 
                        key={idx} 
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                          isSanguine
                            ? 'bg-red-950/40 border-red-500/50 shadow-md shadow-red-900/20'
                            : isSoul
                            ? 'bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-900/20'
                            : isFalcon
                            ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-900/20'
                            : isOtherBis
                            ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                            : item.tier > 0 
                            ? 'bg-cyan-950/30 border-cyan-500/40 shadow-sm shadow-cyan-500/10' 
                            : 'bg-stone-950/80 border-stone-800/80'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img 
                            src={`https://api.increasesoft.com/api/images/item/${encodeURIComponent(item?.name || '')}?v=4`}
                            alt={item?.name || 'Item'}
                            className="w-9 h-9 object-contain bg-stone-900 rounded-lg p-1 border border-stone-700/50"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          {item.tier > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-stone-950 text-[10px] font-black px-1 rounded-full shadow">
                              T{item.tier}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white capitalize truncate" title={item?.name}>
                            {item?.name}
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {item.count > 1 && <span>Qtd: {item.count}</span>}
                            {item.tier > 0 && <span className="text-cyan-400 font-bold">Tier {item.tier}</span>}
                            {isSanguine && <span className="text-red-400 font-black">🩸 Sanguine</span>}
                            {isSoul && <span className="text-purple-400 font-black">💀 Soulwar</span>}
                            {isFalcon && <span className="text-amber-400 font-black">🦅 Falcon</span>}
                            {isOtherBis && <span className="text-emerald-400 font-black">💎 BiS</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-stone-950/60 text-center text-xs text-gray-500">
                  Nenhum item em destaque registrado para este personagem.
                </div>
              )}
            </div>

            {/* 2. TODAS AS HABILIDADES (SKILLS) COM DETALHES COMPLETOS */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sword size={14} className="text-amber-400" /> Habilidades & Competências (Skills)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-gray-400 text-[11px] flex items-center justify-center gap-1">
                    <Wand2 size={12} className="text-blue-400" /> Magic Level
                  </span>
                  <div className="text-xl font-black text-blue-400 font-mono">{selectedAuctionModal.mag_level || '-'}</div>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-gray-400 text-[11px] flex items-center justify-center gap-1">
                    <Target size={12} className="text-green-400" /> Distance
                  </span>
                  <div className="text-xl font-black text-green-400 font-mono">{selectedAuctionModal.skills_data?.dist || '-'}</div>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-gray-400 text-[11px] flex items-center justify-center gap-1">
                    <Sword size={12} className="text-red-400" /> Espada (Sword)
                  </span>
                  <div className="text-xl font-black text-white font-mono">{selectedAuctionModal.skills_data?.sword || '-'}</div>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-gray-400 text-[11px] flex items-center justify-center gap-1">
                    <Sword size={12} className="text-orange-400" /> Machado (Axe)
                  </span>
                  <div className="text-xl font-black text-white font-mono">{selectedAuctionModal.skills_data?.axe || '-'}</div>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-gray-400 text-[11px] flex items-center justify-center gap-1">
                    <Shield size={12} className="text-stone-400" /> Shielding
                  </span>
                  <div className="text-xl font-black text-stone-300 font-mono">{selectedAuctionModal.skills_data?.shielding || '-'}</div>
                </div>
              </div>
            </div>

            {/* 3. DOSSIÊ FINANCEIRO & AVALIAÇÃO FIPE RUBINOT */}
            {(() => {
              const modalFipe = calculateCharFipe(selectedAuctionModal);
              const bid = Number(selectedAuctionModal.current_bid) || 0;

              return (
                <div className="bg-gradient-to-r from-stone-900 via-amber-950/20 to-stone-900 border border-yellow-500/40 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={15} /> Comparativo com a Média de Mercado do RubinOT
                    </h3>
                    <span className="text-xs font-bold text-amber-300">
                      {modalFipe.discountPct > 0 ? `${modalFipe.discountPct}% Abaixo da FIPE` : 'Preço de Mercado'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-black/60 p-3 rounded-xl border border-stone-800">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Preço de Venda / Lance</span>
                      <div className="text-xl font-black text-white font-mono mt-0.5">{bid.toLocaleString()} TC</div>
                    </div>

                    <div className="bg-black/60 p-3 rounded-xl border border-stone-800">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Avaliação FIPE Justa</span>
                      <div className="text-xl font-black text-yellow-400 font-mono mt-0.5">~{modalFipe.avgFipe.toLocaleString()} TC</div>
                    </div>

                    <div className="bg-black/60 p-3 rounded-xl border border-stone-800">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Lucro Líquido Revenda</span>
                      <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">+{modalFipe.estimatedProfitTc.toLocaleString()} TC</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    *Média calibrada diretamente contra o histórico dos 1.000 leilões mais recentes arrematados no RubinOT, considerando classe, level, bônus de charms (+{(selectedAuctionModal.charm_points || 0) * 0.3 | 0} TC) e itens tierizados.
                  </p>
                </div>
              );
            })()}

            {/* BOTÕES DE AÇÃO DO MODAL */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleShareAuction(selectedAuctionModal)}
                className="flex-1 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 font-bold text-xs text-gray-200 flex items-center justify-center gap-2 transition-colors"
              >
                {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                {copiedLink ? 'Copiado para o Clipboard!' : 'Compartilhar no Discord/WhatsApp'}
              </button>

              <a
                href={`https://rubinot.com.br/bazaar/${selectedAuctionModal.auction_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 font-black text-stone-950 text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <ExternalLink size={16} />
                <span>Abrir Leilão Oficial no RubinOT ↗</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* BANNER ADSENSE */}
      <div className="mt-4">
        <AdBanner />
      </div>

    </div>
  );
}
