import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Target, AlertTriangle, Clock, TrendingDown, Coins, Search, ExternalLink, 
  Star, Shield, Sword, Wand2, RefreshCw, Flame, Sparkles, Filter, 
  ArrowUpDown, Volume2, VolumeX, Eye, Calculator, ChevronDown, CheckCircle2,
  Award, Globe, Zap, ArrowRight, User, LayoutGrid, List, SlidersHorizontal,
  Bookmark, Check, Share2, DollarSign, HelpCircle, X, History, BarChart3, Package,
  Crosshair, ShieldCheck, Gem, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Heart, Droplets, Gauge, Compass, BookOpen, Scroll, CheckCircle, Lock, Trophy, Sparkle
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

// Runas de Charm do Tibia e seus custos
const CHARM_RUNES = [
  { id: 'wound', name: 'Wound', cost: 600, type: 'Dano Físico', icon: '🩸', desc: '5% de chance de causar 5% da vida do monstro como dano físico.' },
  { id: 'freeze', name: 'Freeze', cost: 800, type: 'Dano de Gelo', icon: '❄️', desc: '5% de chance de causar 5% da vida máxima como dano de gelo.' },
  { id: 'zap', name: 'Zap', cost: 800, type: 'Dano de Energia', icon: '⚡', desc: '5% de chance de causar 5% da vida máxima como dano de energia.' },
  { id: 'poison', name: 'Poison', cost: 600, type: 'Dano de Terra', icon: '🌿', desc: '5% de chance de causar 5% da vida máxima como dano de terra.' },
  { id: 'enflame', name: 'Enflame', cost: 800, type: 'Dano de Fogo', icon: '🔥', desc: '5% de chance de causar 5% da vida máxima como dano de fogo.' },
  { id: 'curse', name: 'Curse', cost: 800, type: 'Dano de Morte', icon: '💀', desc: '5% de chance de causar 5% da vida máxima como dano de morte.' },
  { id: 'divine', name: 'Divine Wrath', cost: 1500, type: 'Dano Sagrado', icon: '✨', desc: '5% de chance de causar 5% da vida como dano sagrado (Holy).' },
  { id: 'lowblow', name: 'Low Blow', cost: 2000, type: 'Crítico Extra', icon: '🎯', desc: 'Aumenta a chance de acerto crítico em +8% no monstro associado.' },
  { id: 'dodge', name: 'Dodge', cost: 600, type: 'Esquiva', icon: '🛡️', desc: '10% de chance de esquivar completamente do ataque do monstro.' },
  { id: 'parry', name: 'Parry', cost: 1000, type: 'Reflexo de Dano', icon: '⚔️', desc: '10% de chance de refletir 100% do dano de volta para o atacante.' },
];

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
    sanguine: '+2.000 a +4.500 TC por item (Rotten Blood BiS Supremo)',
    soulwar: '+600 a +1.800 TC por item (Soulstalkers, Soulshell, etc.)',
    tier1: '+150 a +350 TC no valor final',
    tier2: '+450 a +850 TC no valor final',
    tier3: '+1.200 a +2.500 TC no valor final',
    charms1000: '+250 a +400 TC a cada 1.000 charm points'
  }
};

// Avatar ultra-leve em SVG/CSS
function CharAvatar({ name, vocation, size = 'md' }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const voc = (vocation || '').toLowerCase();

  let bgClasses = 'from-stone-900 to-stone-950 text-amber-400 border-stone-700';
  if (voc.includes('knight')) bgClasses = 'from-red-950/80 to-stone-950 text-red-400 border-red-500/40';
  else if (voc.includes('paladin')) bgClasses = 'from-yellow-950/80 to-stone-950 text-yellow-300 border-yellow-500/40';
  else if (voc.includes('sorcerer')) bgClasses = 'from-orange-950/80 to-stone-950 text-orange-400 border-orange-500/40';
  else if (voc.includes('druid')) bgClasses = 'from-emerald-950/80 to-stone-950 text-emerald-400 border-emerald-500/40';
  else if (voc.includes('monk')) bgClasses = 'from-purple-950/80 to-stone-950 text-purple-300 border-purple-500/40';

  const dim = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-lg';

  return (
    <div className={`${dim} rounded-2xl bg-gradient-to-br ${bgClasses} border flex items-center justify-center font-bold font-medieval shadow-md shrink-0 select-none`}>
      {initial}
    </div>
  );
}

// Telemetria exata de HP, Mana, Cap e Speed por fórmula Tibia
function calculateCharTelemetry(level, vocation) {
  const lvl = Math.max(1, Number(level) || 1);
  const voc = (vocation || '').toLowerCase();
  const lvlAbove8 = Math.max(0, lvl - 8);

  let hp = 185;
  let mp = 70;
  let cap = 470;

  if (voc.includes('knight')) {
    hp += lvlAbove8 * 15;
    mp += lvlAbove8 * 5;
    cap += lvlAbove8 * 25;
  } else if (voc.includes('paladin')) {
    hp += lvlAbove8 * 10;
    mp += lvlAbove8 * 15;
    cap += lvlAbove8 * 20;
  } else if (voc.includes('druid') || voc.includes('sorcerer')) {
    hp += lvlAbove8 * 5;
    mp += lvlAbove8 * 30;
    cap += lvlAbove8 * 10;
  } else if (voc.includes('monk')) {
    hp += lvlAbove8 * 12;
    mp += lvlAbove8 * 12;
    cap += lvlAbove8 * 22;
  } else {
    hp += lvlAbove8 * 5;
    mp += lvlAbove8 * 5;
    cap += lvlAbove8 * 10;
  }

  const speed = 109 + (lvl - 1);
  return { hp, mp, cap, speed };
}

// Checklist de Acessos Meta do RubinOT
function getCharacterQuestAccess(level) {
  const lvl = Number(level) || 1;
  return [
    {
      name: 'Rotten Blood (Endgame BiS Sanguine)',
      reqLevel: 1000,
      status: lvl >= 1000 ? 'Habilitado para Bakragore' : 'Requer Level 1000+',
      unlocked: lvl >= 1000,
      reward: 'Equipamentos Sanguine BiS & Taints',
      tier: 'Tier 5 Supremo'
    },
    {
      name: 'Soul War & Goshnar Taints',
      reqLevel: 800,
      status: lvl >= 800 ? 'Liberado para Hunt & Bosses' : 'Requer Level 800+',
      unlocked: lvl >= 800,
      reward: 'Equipamentos Soulwar (Soulshell, Stalkers)',
      tier: 'Tier 4 Endgame'
    },
    {
      name: 'Primal Ordeal (Hazard Marapur)',
      reqLevel: 700,
      status: lvl >= 700 ? 'Liberado para Hazard Hunts' : 'Requer Level 700+',
      unlocked: lvl >= 700,
      reward: 'Primal Pods & Magma Bubble Runs',
      tier: 'Tier 4'
    },
    {
      name: 'The Secret Library & Grand Master Oberon',
      reqLevel: 500,
      status: lvl >= 500 ? 'Liberado para Oberon Diário' : 'Requer Level 500+',
      unlocked: lvl >= 500,
      reward: 'Falcon Items & Livros Elementais',
      tier: 'Tier 3'
    },
    {
      name: 'Grave Danger (King Zelos)',
      reqLevel: 400,
      status: lvl >= 400 ? 'Liberado para 5 Mini-Bosses' : 'Requer Level 400+',
      unlocked: lvl >= 400,
      reward: 'Acesso a Zelos Hunt & Lich Bosses',
      tier: 'Tier 3'
    },
    {
      name: 'Feaster of Souls (The Pale Worm)',
      reqLevel: 400,
      status: lvl >= 400 ? 'Liberado para Bounac & Worm' : 'Requer Level 400+',
      unlocked: lvl >= 400,
      reward: 'Brain in a Jar & Acesso a Bounac',
      tier: 'Tier 3'
    },
    {
      name: 'Forgotten Knowledge & Heart of Destruction',
      reqLevel: 300,
      status: lvl >= 300 ? 'Acesso a Imbuements Tier 3' : 'Requer Level 300+',
      unlocked: lvl >= 300,
      reward: 'Imbuements Poderosos Tier 3 (Crítico/Mana)',
      tier: 'Tier 2'
    },
    {
      name: 'The Inquisition & Pits of Inferno (PoI)',
      reqLevel: 200,
      status: lvl >= 200 ? 'Acesso Geral Concluído' : 'Requer Level 200+',
      unlocked: lvl >= 200,
      reward: 'Blessing da Inquisição & Demon Forges',
      tier: 'Tier 1 Clássico'
    },
    {
      name: 'In Service of Yalahar & The Postman Missions',
      reqLevel: 100,
      status: 'Concluído',
      unlocked: true,
      reward: 'Portões de Yalahar & Viagens com Desconto',
      tier: 'Utilidade'
    }
  ];
}

// Avaliação FIPE calibrada focando em Sanguine, Soulwar e Tiers
function calculateCharFipe(char) {
  const lvl = Number(char.level) || 100;
  const ch = Number(char.charm_points) || 0;
  const voc = (char.vocation || '').toLowerCase();
  
  let baseRate = 1.0;
  if (lvl > 700) baseRate = 1.2;
  if (lvl > 900) baseRate = 1.5;
  if (lvl > 1100) baseRate = 1.9;

  let vocMultiplier = 1.0;
  if (voc.includes('druid')) vocMultiplier = 1.25;
  else if (voc.includes('paladin')) vocMultiplier = 1.20;
  else if (voc.includes('knight')) vocMultiplier = 1.05;
  else if (voc.includes('sorcerer')) vocMultiplier = 1.02;
  else if (voc.includes('monk')) vocMultiplier = 0.95;

  baseRate *= vocMultiplier;
  let baseTc = Math.round(lvl * baseRate);
  const charmsBonus = Math.round((ch / 1000) * 300);

  // Bônus de Tiers e Bônus Real de Sanguine / Soulwar
  let tierBonus = 0;
  let sanguineBonus = 0;
  let soulwarBonus = 0;

  if (Array.isArray(char.items_data)) {
    char.items_data.forEach(it => {
      const name = (it?.name || '').toLowerCase();
      if (name.includes('sanguine')) sanguineBonus += 2500;
      else if (name.includes('soul')) soulwarBonus += 800;

      if (it?.tier === 1) tierBonus += 250;
      else if (it?.tier === 2) tierBonus += 600;
      else if (it?.tier >= 3) tierBonus += 1500;
    });
  }

  const gearBonus = sanguineBonus + soulwarBonus + tierBonus;
  const avgFipe = Math.round(baseTc + charmsBonus + gearBonus);
  const minFipe = Math.round(avgFipe * 0.85);
  const maxFipe = Math.round(avgFipe * 1.15);

  const currentBid = Number(char.current_bid) || 0;
  const discountPct = (avgFipe > 0 && currentBid > 0) ? Math.round(((avgFipe - currentBid) / avgFipe) * 100) : 0;
  const estimatedProfitTc = Math.max(0, Math.round(avgFipe * 0.88 - 50 - currentBid));

  // ALGORITMO DEAL SCORE (1 A 99) - AVALIAÇÃO DE BARBADAS DO BAZAAR
  let dealScore = 50; // Inicia em patamar neutro
  const dealReasons = [];

  // 1. Componente de Desconto em relação à FIPE
  if (discountPct >= 40) {
    dealScore += 35;
    dealReasons.push(`${discountPct}% abaixo da FIPE`);
  } else if (discountPct >= 25) {
    dealScore += 25;
    dealReasons.push(`${discountPct}% abaixo da FIPE`);
  } else if (discountPct >= 10) {
    dealScore += 12;
    dealReasons.push(`${discountPct}% abaixo da FIPE`);
  } else if (discountPct < -25) {
    dealScore -= 28;
    dealReasons.push(`${Math.abs(discountPct)}% acima da FIPE`);
  } else if (discountPct < -10) {
    dealScore -= 15;
  }

  // 2. Margem Líquida de Arbitragem (Lucro de revenda)
  if (estimatedProfitTc >= 700) {
    dealScore += 20;
    dealReasons.push(`+${estimatedProfitTc.toLocaleString()} TC margem líquida`);
  } else if (estimatedProfitTc >= 350) {
    dealScore += 14;
    dealReasons.push(`+${estimatedProfitTc.toLocaleString()} TC margem líquida`);
  } else if (estimatedProfitTc >= 120) {
    dealScore += 8;
  }

  // 3. Itens Valiosos Inclusos
  if (sanguineBonus > 0) {
    dealScore += 12;
    dealReasons.push('🩸 Sanguine BiS incluso');
  }
  if (soulwarBonus > 0) {
    dealScore += 6;
    dealReasons.push('💀 Soulwar incluso');
  }
  if (tierBonus > 0) {
    dealScore += 5;
    dealReasons.push('⚡ Equipamento com Tier');
  }

  // 4. Charms Avançados
  if (ch >= 3500) {
    dealScore += 6;
    dealReasons.push(`⭐ ${ch.toLocaleString()} Charm Points`);
  }

  // Limites e Classificação
  dealScore = Math.min(99, Math.max(5, dealScore));

  let dealTier = 'JUSTO';
  let dealBadgeColor = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
  let dealBadgeLabel = 'PREÇO JUSTO';

  if (dealScore >= 80) {
    dealTier = 'BARBADA';
    dealBadgeColor = 'bg-emerald-500 text-stone-950 font-black border-emerald-400 shadow-md shadow-emerald-500/20';
    dealBadgeLabel = '💎 BARBADA';
  } else if (dealScore >= 65) {
    dealTier = 'OPORTUNIDADE';
    dealBadgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold';
    dealBadgeLabel = '⚡ OPORTUNIDADE';
  } else if (dealScore < 38) {
    dealTier = 'CARO';
    dealBadgeColor = 'bg-red-500/20 text-red-400 border-red-500/40';
    dealBadgeLabel = '⚠️ SUPERFATURADO';
  }

  return { 
    avgFipe, minFipe, maxFipe, discountPct, estimatedProfitTc, 
    tierBonus, sanguineBonus, soulwarBonus, baseTc, charmsBonus,
    dealScore, dealTier, dealBadgeColor, dealBadgeLabel, dealReasons 
  };
}

export default function BazaarSniper({ onPlayerClick, onNavigate, isPremium }) {
  const { selectedWorld, setSelectedWorld } = useWorld();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoc, setSelectedVoc] = useState('ALL');
  const [activeChip, setActiveChip] = useState('all');
  const [sortOption, setSortOption] = useState('ending');
  const [audioEnabled, setAudioEnabled] = useState(soundFX.isEnabled());
  const [viewMode, setViewMode] = useState('grid');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showFipeOverview, setShowFipeOverview] = useState(false);
  const [selectedAuctionModal, setSelectedAuctionModal] = useState(null);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [copiedLink, setCopiedLink] = useState(false);

  // Estados internos do Modal com Abas
  const [modalActiveTab, setModalActiveTab] = useState('overview'); // 'overview' | 'items' | 'skills' | 'charms' | 'quests' | 'fipe'
  const [modalItemSearch, setModalItemSearch] = useState('');
  const [modalItemFilter, setModalItemFilter] = useState('all'); // 'all' | 'sanguine' | 'soulwar' | 'tiered'

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Filtros Básicos & Status
  const [minLevel, setMinLevel] = useState('');
  const [maxLevel, setMaxLevel] = useState('');
  const [minBid, setMinBid] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [minCharms, setMinCharms] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtros de Equipamentos Meta (Foco em Sanguine e Soulwar)
  const [itemSetFilter, setItemSetFilter] = useState('all'); // 'all' | 'sanguine' | 'soulwar' | 'sanguine_or_soul'
  const [itemTierFilter, setItemTierFilter] = useState('all'); // 'all' | 'tier1' | 'tier2' | 'tier3'

  // Filtros de Habilidades & Skills
  const [minMagLevel, setMinMagLevel] = useState('');
  const [minDist, setMinDist] = useState('');
  const [minMelee, setMinMelee] = useState('');
  const [meleeType, setMeleeType] = useState('any');
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

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

// Cache em memória para leilões do Bazaar (TTL 60s)
let bazaarCache = {
  timestamp: 0,
  data: null
};

  const fetchAlerts = async (forceRefresh = false) => {
    if (!forceRefresh && bazaarCache.data && (Date.now() - bazaarCache.timestamp < 60000)) {
      setAlerts(bazaarCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nowIso = new Date().toISOString();

      // Busca abrangente: 100% dos leilões ativos (range 0..999 e 1000..1999) + 1.000 do histórico recente
      const [active1, active2, history] = await Promise.all([
        supabase
          .from('bazaar_alerts')
          .select('*')
          .gt('auction_end', nowIso)
          .order('auction_end', { ascending: true })
          .range(0, 999),
        supabase
          .from('bazaar_alerts')
          .select('*')
          .gt('auction_end', nowIso)
          .order('auction_end', { ascending: true })
          .range(1000, 1999),
        supabase
          .from('bazaar_alerts')
          .select('*')
          .lte('auction_end', nowIso)
          .order('auction_end', { ascending: false })
          .limit(1000)
      ]);

      const allRows = [
        ...(active1.data || []),
        ...(active2.data || []),
        ...(history.data || [])
      ];

      // Deduplicação por auction_id
      const map = new Map();
      for (let i = 0; i < allRows.length; i++) {
        const item = allRows[i];
        const key = item.auction_id || item.id;
        if (key && !map.has(key)) {
          map.set(key, item);
        }
      }
      const data = Array.from(map.values());

      const preprocessed = data.map(a => {
        const fipe = calculateCharFipe(a);
        const items = Array.isArray(a.items_data) ? a.items_data : [];
        let hasSanguine = false;
        let hasSoul = false;
        let highestTier = 0;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item) continue;
          if (item.tier > highestTier) highestTier = item.tier;
          const nameLower = (item.name || '').toLowerCase();
          if (nameLower.includes('sanguine')) hasSanguine = true;
          if (nameLower.includes('soul')) hasSoul = true;
        }

        const voc = (a.vocation || '').toLowerCase();
        const isMage = voc.includes('sorcerer') || voc.includes('druid');
        const maxMelee = Math.max(a.skills_data?.sword || 0, a.skills_data?.axe || 0, a.skills_data?.club || 0);
        const dist = a.skills_data?.dist || 0;
        const ml = a.mag_level || 0;
        const isTopSkill = isMage ? ml >= 115 : (dist >= 120 || maxMelee >= 120 || ml >= 35);
        const endTimeMs = a.auction_end ? new Date(a.auction_end).getTime() : 0;

        return {
          ...a,
          _fipe: fipe,
          _hasSanguine: hasSanguine,
          _hasSoul: hasSoul,
          _hasSanguineOrSoul: hasSanguine || hasSoul,
          _highestTier: highestTier,
          _maxMelee: maxMelee,
          _isTopSkill: isTopSkill,
          _endTimeMs: endTimeMs
        };
      });

      bazaarCache = {
        timestamp: Date.now(),
        data: preprocessed
      };

      setAlerts(preprocessed);
    } catch (err) {
      console.error('Erro ao buscar leilões do Bazaar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchAlerts(true);
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = soundFX.toggle();
    setAudioEnabled(next);
  };

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

  const getTimeRemaining = (auctionEnd, endTimeMs) => {
    const endMs = endTimeMs || (auctionEnd ? new Date(auctionEnd).getTime() : 0);
    if (!endMs) return { text: 'Expirado', isUrgent: false, isImminent: false, isEnded: true, totalSeconds: 0 };
    const diff = endMs - nowTimestamp;
    if (diff <= 0) return { text: 'Encerrado (Vendido)', isUrgent: false, isImminent: false, isEnded: true, totalSeconds: 0 };

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const isImminent = totalSeconds < 30 * 60;
    const isUrgent = totalSeconds < 2 * 3600;

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h restantes`, isUrgent: false, isImminent: false, isEnded: false, totalSeconds };
    }

    const pad = (n) => String(n).padStart(2, '0');
    return {
      text: `${pad(hours)}h ${pad(minutes)}m restantes`,
      isUrgent,
      isImminent,
      isEnded: false,
      totalSeconds
    };
  };

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
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedVoc, selectedWorld, activeChip, statusFilter, itemSetFilter, itemTierFilter, minLevel, maxLevel, minBid, maxBid, minCharms, minMagLevel, minDist, minMelee, minShielding, sortOption]);

  const filteredAndSortedAuctions = useMemo(() => {
    let result = alerts.filter(a => {
      const isEnded = (a._endTimeMs || 0) <= nowTimestamp;

      if (statusFilter === 'active' && isEnded) return false;
      if (statusFilter === 'ended' && !isEnded) return false;

      if (selectedWorld !== 'ALL' && a.world_name && a.world_name.toLowerCase() !== selectedWorld.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (a.character_name || '').toLowerCase().includes(q);
        const matchItem = Array.isArray(a.items_data) && a.items_data.some(it => (it?.name || '').toLowerCase().includes(q));
        if (!matchName && !matchItem) return false;
      }

      if (selectedVoc !== 'ALL') {
        const voc = (a.vocation || '').toLowerCase();
        if (selectedVoc === 'knight' && !voc.includes('knight')) return false;
        if (selectedVoc === 'paladin' && !voc.includes('paladin')) return false;
        if (selectedVoc === 'sorcerer' && !voc.includes('sorcerer')) return false;
        if (selectedVoc === 'druid' && !voc.includes('druid')) return false;
        if (selectedVoc === 'monk' && !voc.includes('monk')) return false;
        if (selectedVoc === 'none' && (voc.includes('knight') || voc.includes('paladin') || voc.includes('sorcerer') || voc.includes('druid') || voc.includes('monk'))) return false;
      }

      if (minLevel && (a.level || 0) < Number(minLevel)) return false;
      if (maxLevel && (a.level || 0) > Number(maxLevel)) return false;
      if (minBid && (a.current_bid || 0) < Number(minBid)) return false;
      if (maxBid && (a.current_bid || 0) > Number(maxBid)) return false;
      if (minCharms && (a.charm_points || 0) < Number(minCharms)) return false;

      // Filtro Estratégico de Itens: Sanguine ou Soulwar
      if (itemSetFilter !== 'all') {
        if (itemSetFilter === 'sanguine' && !a._hasSanguine) return false;
        if (itemSetFilter === 'soulwar' && !a._hasSoul) return false;
        if (itemSetFilter === 'sanguine_or_soul' && !a._hasSanguineOrSoul) return false;
      }

      if (itemTierFilter !== 'all') {
        if (itemTierFilter === 'tier1' && (a._highestTier || 0) < 1) return false;
        if (itemTierFilter === 'tier2' && (a._highestTier || 0) < 2) return false;
        if (itemTierFilter === 'tier3' && (a._highestTier || 0) < 3) return false;
      }

      if (minMagLevel && (a.mag_level || 0) < Number(minMagLevel)) return false;
      if (minDist && (a.skills_data?.dist || 0) < Number(minDist)) return false;

      if (minMelee) {
        const reqMelee = Number(minMelee);
        if (meleeType === 'sword') {
          if ((a.skills_data?.sword || 0) < reqMelee) return false;
        } else if (meleeType === 'axe') {
          if ((a.skills_data?.axe || 0) < reqMelee) return false;
        } else if (meleeType === 'club') {
          if ((a.skills_data?.club || 0) < reqMelee) return false;
        } else {
          if ((a._maxMelee || 0) < reqMelee) return false;
        }
      }

      if (minShielding && (a.skills_data?.shielding || 0) < Number(minShielding)) return false;

      // Chips Rápidos
      if (activeChip === 'barbadas') {
        return (a._fipe?.dealScore || 0) >= 80;
      }
      if (activeChip === 'opportunity') {
        return (a._fipe?.discountPct || 0) >= 20 || a.is_sniping_opportunity;
      }
      if (activeChip === 'sanguine') return a._hasSanguine;
      if (activeChip === 'soulwar') return a._hasSoul;
      if (activeChip === 'sanguine_or_soul') return a._hasSanguineOrSoul;
      if (activeChip === 'tier2_plus') return (a._highestTier || 0) >= 2;
      if (activeChip === 'high_skills') return a._isTopSkill;
      if (activeChip === 'ending_soon') {
        const diffSec = Math.floor(((a._endTimeMs || 0) - nowTimestamp) / 1000);
        return !isEnded && diffSec < 3 * 3600 && diffSec > 0;
      }
      if (activeChip === 'favorites') {
        const aId = a.id || a.auction_id;
        return favorites.includes(aId);
      }
      if (activeChip === 'tiered_items') return (a._highestTier || 0) > 0;
      if (activeChip === 'hunted') return a.is_hunted;
      if (activeChip === 'high_level') return (a.level || 0) >= 800;
      if (activeChip === 'cheap') return (a.current_bid || 0) <= 500 && (a.current_bid || 0) > 0;
      if (activeChip === 'charms') return (a.charm_points || 0) >= 1000;

      return true;
    });

    result.sort((a, b) => {
      const isEndedA = (a._endTimeMs || 0) <= nowTimestamp;
      const isEndedB = (b._endTimeMs || 0) <= nowTimestamp;

      if (statusFilter === 'all' && isEndedA !== isEndedB) {
        return isEndedA ? 1 : -1;
      }

      if (sortOption === 'ending') {
        return isEndedA ? (b._endTimeMs - a._endTimeMs) : (a._endTimeMs - b._endTimeMs);
      }
      if (sortOption === 'deal_score') {
        return (b._fipe?.dealScore || 0) - (a._fipe?.dealScore || 0);
      }
      if (sortOption === 'profit_desc') {
        return (b._fipe?.estimatedProfitTc || 0) - (a._fipe?.estimatedProfitTc || 0);
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

  const totalPages = Math.ceil(filteredAndSortedAuctions.length / pageSize) || 1;
  const paginatedAuctions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedAuctions.slice(start, start + pageSize);
  }, [filteredAndSortedAuctions, currentPage, pageSize]);

  const stats = useMemo(() => {
    const total = alerts.length;
    let activeCount = 0;
    let endedCount = 0;
    let opportunities = 0;
    let endingSoon = 0;
    let tieredCount = 0;
    let sanguineCount = 0;
    let soulCount = 0;
    let barbadasCount = 0;

    let sanguineOrSoulCount = 0;

    for (let i = 0; i < alerts.length; i++) {
      const a = alerts[i];
      const isEnded = (a._endTimeMs || 0) <= nowTimestamp;
      if (!isEnded) {
        activeCount++;
        const diffSec = Math.floor(((a._endTimeMs || 0) - nowTimestamp) / 1000);
        if (diffSec < 3 * 3600 && diffSec > 0) endingSoon++;
      } else {
        endedCount++;
      }
      if ((a._fipe?.dealScore || 0) >= 80) barbadasCount++;
      if ((a._fipe?.discountPct || 0) >= 20 || a.is_sniping_opportunity) opportunities++;
      if ((a._highestTier || 0) > 0) tieredCount++;
      if (a._hasSanguine) sanguineCount++;
      if (a._hasSoul) soulCount++;
      if (a._hasSanguineOrSoul) sanguineOrSoulCount++;
    }

    return { 
      total, activeCount, endedCount, opportunities, endingSoon, 
      tieredCount, sanguineCount, soulCount, sanguineOrSoulCount, 
      barbadasCount, favoritesCount: favorites.length 
    };
  }, [alerts, favorites, nowTimestamp]);

  const handleShareAuction = (auction) => {
    const fipe = auction._fipe || calculateCharFipe(auction);
    const text = `[Rubinot Bazaar] ${auction.character_name} (Lvl ${auction.level} - ${formatVocation(auction.vocation)}) | Preço: ${auction.current_bid} TC (FIPE: ~${fipe.avgFipe} TC) | Mundo: ${auction.world_name}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const modalFilteredItems = useMemo(() => {
    if (!selectedAuctionModal || !Array.isArray(selectedAuctionModal.items_data)) return [];
    let items = selectedAuctionModal.items_data;

    if (modalItemFilter === 'sanguine') {
      items = items.filter(it => (it?.name || '').toLowerCase().includes('sanguine'));
    } else if (modalItemFilter === 'soulwar') {
      items = items.filter(it => (it?.name || '').toLowerCase().includes('soul'));
    } else if (modalItemFilter === 'tiered') {
      items = items.filter(it => it && it.tier > 0);
    }

    if (modalItemSearch.trim()) {
      const q = modalItemSearch.toLowerCase().trim();
      items = items.filter(it => (it?.name || '').toLowerCase().includes(q));
    }

    return items;
  }, [selectedAuctionModal, modalItemFilter, modalItemSearch]);

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
              Consulte leilões ativos e o histórico dos últimos 30 dias de vendas do RubinOT. Filtre os verdadeiros Grails do meta (<strong className="text-red-400">Sanguine</strong> e <strong className="text-purple-400">Soulwar</strong>) e inspecione tudo em abas detalhadas!
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

            <div className="p-3.5 bg-red-950/30 border border-red-500/30 rounded-xl flex items-start gap-3">
              <Flame size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-red-300">O que realmente comanda o valor do char:</strong> Equipamentos <strong className="text-white">Sanguine</strong> (Rotten Blood) acrescentam em média <strong className="text-red-400">+2.500 a +4.500 TC</strong> por item ao preço arrematado. Itens <strong className="text-white">Soulwar</strong> acrescentam <strong className="text-purple-300">+800 a +1.800 TC</strong>.
              </div>
            </div>
          </div>
        )}

        {/* DRAWER AVANÇADO DE FILTROS PRO */}
        {showFiltersDrawer && (
          <div className="mt-6 pt-6 border-t border-yellow-500/20 space-y-5 animate-fade-in bg-stone-950/95 p-5 sm:p-6 rounded-2xl border border-yellow-500/40 shadow-2xl">
            {/* SEÇÃO 1: FILTROS DE EQUIPAMENTOS SUPREMOS (SANGUINE & SOULWAR) */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-stone-800 text-xs font-bold text-yellow-400 uppercase tracking-wider">
                <Gem size={15} /> 1. Equipamentos Nobres do Meta (Sanguine & Soulwar)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Filtro de Grails BiS</span>
                    <span className="text-[10px] text-red-400 font-mono font-bold">{stats.sanguineCount} Sanguine • {stats.soulCount} Soul</span>
                  </label>
                  <select
                    value={itemSetFilter}
                    onChange={(e) => setItemSetFilter(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-yellow-300 font-bold focus:outline-none focus:border-yellow-500"
                  >
                    <option value="all">Qualquer Equipamento</option>
                    <option value="sanguine">🩸 Apenas com Sanguine (Rotten Blood BiS - {stats.sanguineCount} chars)</option>
                    <option value="soulwar">💀 Apenas com Soulwar (Soulstalkers, Shells, Maimer - {stats.soulCount} chars)</option>
                    <option value="sanguine_or_soul">👑 Possui Sanguine OU Soulwar ({stats.sanguineOrSoulCount} chars)</option>
                  </select>
                </div>

                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Nível de Tier da Forja</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">{stats.tieredCount} chars com Tier</span>
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

      {/* 3. STRIP DE MÉTRICAS & CHIPS RÁPIDOS (FOCO EM SANGUINE E SOULWAR) */}
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
          onClick={() => setActiveChip('sanguine')}
          className={`bg-black/80 border p-3.5 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'sanguine' 
              ? 'border-red-500 bg-red-950/30 shadow-red-500/20' 
              : 'border-yellow-500/20 hover:border-red-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-400 uppercase font-bold flex items-center gap-1">
              🩸 Sanguine BiS
            </span>
            <Flame className="text-red-400" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-medieval font-bold text-red-400 mt-1">{stats.sanguineCount}</p>
          <p className="text-[11px] text-red-400/70 mt-0.5">Rotten Blood Supremo</p>
        </div>

        <div 
          onClick={() => setActiveChip('soulwar')}
          className={`bg-black/80 border p-3.5 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'soulwar' 
              ? 'border-purple-500 bg-purple-950/30 shadow-purple-500/20' 
              : 'border-yellow-500/20 hover:border-purple-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-purple-400 uppercase font-bold flex items-center gap-1">
              💀 Soulwar Gear
            </span>
            <Gem className="text-purple-400" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-medieval font-bold text-purple-300 mt-1">{stats.soulCount}</p>
          <p className="text-[11px] text-purple-400/70 mt-0.5">Stalkers, Shells & Maimer</p>
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
              placeholder="Buscar personagem ou item (ex: sanguine, soulstalkers, soulshell)..."
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
              <option value="deal_score">🎯 Maior Deal Score (Barbadas Primeiro)</option>
              <option value="profit_desc">🔥 Maior Lucro FIPE (Revenda)</option>
              <option value="price_asc">💰 Menor Preço (TC)</option>
              <option value="price_desc">💎 Maior Preço (TC)</option>
              <option value="level_desc">📈 Maior Nível (Level)</option>
              <option value="charms">⭐ Mais Charms</option>
            </select>
          </div>

        </div>

        {/* Seletor Rápido de Status & Chips Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
          
          {/* Abas Rápidas de Status: Ativos Agora vs Todos vs Histórico */}
          <div className="flex items-center gap-1 bg-stone-900/90 border border-stone-800 rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-500 text-stone-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>🟢 Ativos ({stats.activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-yellow-500 text-stone-950 font-black shadow-md shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🌟 Todos ({stats.total})</span>
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter('ended'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'ended'
                  ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>📚 Histórico ({stats.endedCount})</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: '🌟 Todos' },
              { id: 'barbadas', label: `🎯 Barbadas (${stats.barbadasCount})` },
              { id: 'sanguine', label: `🩸 Com Sanguine (${stats.sanguineCount})` },
              { id: 'soulwar', label: `💀 Com Soulwar (${stats.soulCount})` },
              { id: 'sanguine_or_soul', label: `👑 Sanguine ou Soul (${stats.sanguineOrSoulCount})` },
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

      {/* 5. LISTAGEM DE LEILÕES COM PAGINAÇÃO ULTRA-RÁPIDA */}
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
            Tente selecionar "Todas as Classes" ou marcar "Qualquer Equipamento" para expandir os resultados.
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-xs font-bold text-yellow-300 transition-all"
          >
            Ver Todos os Leilões (Limpar Filtros)
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* MODO TABELA SNIPER PRO (PAGINADA) */
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
                  <th className="p-3.5">Grails (Sanguine/Soul)</th>
                  <th className="p-3.5">Preço (TC)</th>
                  <th className="p-3.5">FIPE Real</th>
                  <th className="p-3.5">Deal Score</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Inspecionar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {paginatedAuctions.map(auction => {
                  const aId = auction.id || auction.auction_id;
                  const isFav = favorites.includes(aId);
                  const timeInfo = getTimeRemaining(auction.auction_end, auction._endTimeMs);
                  const fipe = auction._fipe;
                  const bidVal = Number(auction.current_bid) || 0;
                  const vocStr = formatVocation(auction.vocation);

                  return (
                    <tr 
                      key={aId}
                      onClick={() => { setSelectedAuctionModal(auction); setModalActiveTab('overview'); }}
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
                          {auction._hasSanguine && <span className="text-[10px] px-1.5 py-0.5 bg-red-950 text-red-300 border border-red-500/50 rounded font-black">🩸 Sanguine</span>}
                          {auction._hasSoul && <span className="text-[10px] px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-500/50 rounded font-black">💀 Soulwar</span>}
                          {auction._highestTier > 0 && <span className="text-[10px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded font-bold">⚡ T{auction._highestTier}</span>}
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
                        {auction._hasSanguine && auction._hasSoul ? (
                          <span className="text-red-400 font-bold font-mono">🩸 Sanguine + 💀 Soul</span>
                        ) : auction._hasSanguine ? (
                          <span className="text-red-400 font-bold font-mono">🩸 Sanguine BiS</span>
                        ) : auction._hasSoul ? (
                          <span className="text-purple-400 font-bold font-mono">💀 Soulwar BiS</span>
                        ) : Array.isArray(auction.items_data) && auction.items_data.length > 0 ? (
                          <span className="text-gray-400 font-mono">{auction.items_data.length} itens</span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-yellow-400 font-mono">{bidVal.toLocaleString()} TC</td>
                      <td className="p-3 text-gray-400 font-mono">~{fipe?.avgFipe?.toLocaleString() || 0} TC</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-black inline-flex items-center gap-1 ${fipe?.dealBadgeColor || 'bg-stone-800 text-gray-400'}`}>
                          <span>{fipe?.dealBadgeLabel || 'JUSTO'}</span>
                          <span>({fipe?.dealScore || 50})</span>
                        </span>
                      </td>
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
                          onClick={(e) => { e.stopPropagation(); setSelectedAuctionModal(auction); setModalActiveTab('overview'); }}
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

        /* MODO CARDS DETALHADOS (PAGINADOS: 24 POR PÁGINA) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedAuctions.map(auction => {
            const aId = auction.id || auction.auction_id;
            const isFav = favorites.includes(aId);
            const timeInfo = getTimeRemaining(auction.auction_end, auction._endTimeMs);
            const fipe = auction._fipe;
            const bidVal = Number(auction.current_bid) || 0;

            const vocStr = formatVocation(auction.vocation);
            const isMage = vocStr.includes('Sorcerer') || vocStr.includes('Druid');
            const isRP = vocStr.includes('Paladin');
            const isEK = vocStr.includes('Knight');

            const mainSkill = isMage
              ? { name: 'Magic Level', val: auction.mag_level || '?', icon: <Wand2 size={13} className="text-blue-400" /> }
              : isRP
              ? { name: 'Distance', val: auction.skills_data?.dist || '?', icon: <Target size={13} className="text-green-400" /> }
              : isEK
              ? { name: 'Melee Skill', val: auction._maxMelee || '?', icon: <Sword size={13} className="text-red-400" /> }
              : { name: 'Skill', val: '?', icon: <Zap size={13} className="text-yellow-400" /> };

            return (
              <div 
                key={aId}
                onClick={() => { setSelectedAuctionModal(auction); setModalActiveTab('overview'); }}
                className={`bg-gradient-to-b from-stone-950 via-black to-stone-950 border rounded-2xl p-5 relative overflow-hidden transition-all flex flex-col justify-between group shadow-xl cursor-pointer ${
                  timeInfo.isEnded
                    ? 'opacity-75 border-stone-800/80 hover:border-stone-700'
                    : auction.is_hunted
                    ? 'border-red-500/60 shadow-red-500/10'
                    : auction._hasSanguine
                    ? 'border-red-500/80 shadow-red-900/30'
                    : auction._hasSoul
                    ? 'border-purple-500/80 shadow-purple-900/30'
                    : timeInfo.isImminent
                    ? 'border-amber-500 shadow-amber-500/20 animate-pulse'
                    : (fipe?.discountPct || 0) >= 20
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

                      {auction._hasSanguine && (
                        <span className="bg-red-950/90 border border-red-500/80 text-red-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md shadow-red-900/30 animate-pulse">
                          🩸 Sanguine
                        </span>
                      )}

                      {auction._hasSoul && (
                        <span className="bg-purple-950/90 border border-purple-500/80 text-purple-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md shadow-purple-900/30">
                          💀 Soulwar
                        </span>
                      )}

                      {auction._highestTier > 0 && (
                        <span className="bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                          ⚡ Tier {auction._highestTier}
                        </span>
                      )}

                      {auction._isTopSkill && (
                        <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                          🎯 Top Skill
                        </span>
                      )}

                      {!timeInfo.isEnded && fipe?.dealBadgeLabel && (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border shadow flex items-center gap-1 ${fipe.dealBadgeColor}`}>
                          <span>{fipe.dealBadgeLabel}</span>
                          <span className="font-mono text-[9px] opacity-90">({fipe.dealScore} pts)</span>
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
                      <Clock size={12} />
                      <span>{timeInfo.text}</span>
                    </div>
                  </div>

                  {/* CABEÇALHO DO PERSONAGEM */}
                  <div className="flex items-start gap-3 mb-4">
                    <CharAvatar name={auction.character_name} vocation={auction.vocation} />

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
                        {fipe?.avgFipe || 0} TC
                      </span>
                    </div>
                  </div>

                  {/* ITENS INCLUSOS: DESTAQUE PARA SANGUINE E SOULWAR */}
                  {Array.isArray(auction.items_data) && auction.items_data.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 p-2 rounded-xl bg-black/40 border border-white/5 overflow-x-auto custom-scrollbar">
                      {auction.items_data.slice(0, 6).map((item, idx) => {
                        const nameLower = (item?.name || '').toLowerCase();
                        const isSanguine = nameLower.includes('sanguine');
                        const isSoul = nameLower.includes('soul');

                        return (
                          <div key={idx} className="relative shrink-0 group/item">
                            <img 
                              src={`https://api.increasesoft.com/api/images/item/${encodeURIComponent(item?.name || '')}?v=4`}
                              alt={item?.name || 'Item'}
                              loading="lazy"
                              decoding="async"
                              title={`${item?.name || ''} ${item?.tier > 0 ? `[Tier ${item.tier}]` : ''} ${isSanguine ? '(SANGUINE BiS)' : isSoul ? '(SOULWAR BiS)' : ''}`}
                              className={`w-7 h-7 object-contain drop-shadow rounded p-0.5 border ${
                                isSanguine 
                                  ? 'bg-red-950/80 border-red-500 shadow-sm shadow-red-500/50' 
                                  : isSoul 
                                  ? 'bg-purple-950/80 border-purple-500 shadow-sm shadow-purple-500/50' 
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
                <div className="pt-3 border-t border-white/10 space-y-2.5">
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
                        ~{fipe?.avgFipe?.toLocaleString() || 0} TC
                      </span>
                    </div>
                  </div>

                  {/* Reasons do Deal Score */}
                  {fipe?.dealReasons?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono px-2 py-1 bg-emerald-950/30 rounded-lg border border-emerald-500/20">
                      <Sparkles size={11} className="shrink-0 text-emerald-400" />
                      <span className="truncate">{fipe.dealReasons.slice(0, 2).join(' • ')}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedAuctionModal(auction); setModalActiveTab('overview'); }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-yellow-500/40 text-xs font-bold text-yellow-300 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                  >
                    <Package size={14} />
                    <span>Inspecionar Dossiê do Char 🔍</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 6. BARRA DE PAGINAÇÃO ULTRA-RÁPIDA */}
      {filteredAndSortedAuctions.length > pageSize && (
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="text-xs text-gray-400 font-mono">
            Exibindo <span className="text-white font-bold">{((currentPage - 1) * pageSize) + 1}</span> a <span className="text-white font-bold">{Math.min(currentPage * pageSize, filteredAndSortedAuctions.length)}</span> de <span className="text-yellow-400 font-bold">{filteredAndSortedAuctions.length}</span> leilões
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Primeira Página"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Página Anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3 && currentPage < totalPages - 1) {
                  pNum = currentPage - 2 + i;
                } else if (currentPage >= totalPages - 1) {
                  pNum = totalPages - 4 + i;
                }
              }

              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all ${
                    currentPage === pNum
                      ? 'bg-yellow-500 text-stone-950 font-black shadow-md scale-105'
                      : 'bg-stone-950 border border-stone-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Próxima Página"
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Última Página"
            >
              <ChevronsRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Itens por página:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-stone-950 border border-stone-700 text-yellow-400 rounded-lg px-2 py-1 font-mono font-bold"
            >
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
            </select>
          </div>
        </div>
      )}

      {/* 7. MODAL DE INSPEÇÃO ULTRA-COMPLETO COM ABAS (FOCO REAL EM SANGUINE & SOULWAR) */}
      {selectedAuctionModal && (() => {
        const char = selectedAuctionModal;
        const fipe = char._fipe || calculateCharFipe(char);
        const bid = Number(char.current_bid) || 0;
        const telemetry = calculateCharTelemetry(char.level, char.vocation);
        const quests = getCharacterQuestAccess(char.level);
        const itemsList = Array.isArray(char.items_data) ? char.items_data : [];
        const vocStr = formatVocation(char.vocation);
        const isMage = vocStr.includes('Sorcerer') || vocStr.includes('Druid');
        const isRP = vocStr.includes('Paladin');
        const isEK = vocStr.includes('Knight');
        const charmPts = Number(char.charm_points) || 0;

        const sanguineItemsCount = itemsList.filter(it => (it?.name || '').toLowerCase().includes('sanguine')).length;
        const soulItemsCount = itemsList.filter(it => (it?.name || '').toLowerCase().includes('soul')).length;

        const MODAL_TABS = [
          { id: 'overview', label: 'Visão Geral', icon: <User size={14} /> },
          { id: 'items', label: `Equipamentos (${itemsList.length})`, icon: <Package size={14} /> },
          { id: 'skills', label: 'Skills & Combate', icon: <Sword size={14} /> },
          { id: 'charms', label: `Charms (${charmPts})`, icon: <Star size={14} /> },
          { id: 'quests', label: 'Acessos & Quests', icon: <Compass size={14} /> },
          { id: 'fipe', label: 'Dossiê FIPE', icon: <DollarSign size={14} /> }
        ];

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
            <div className="bg-stone-950 border-2 border-yellow-500/50 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
              
              {/* TOPO FIXO DO MODAL */}
              <div className="p-5 sm:p-6 border-b border-stone-800 flex items-start justify-between gap-4 bg-gradient-to-r from-yellow-950/30 via-stone-950 to-stone-950 shrink-0">
                <div className="flex items-start gap-3.5">
                  <CharAvatar name={char.character_name} vocation={char.vocation} size="lg" />

                  <div>
                    <div className="text-[11px] text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      <span>Leilão #{char.auction_id}</span>
                      <span>•</span>
                      <span className="text-yellow-300 font-mono">{char.world_name || 'Rubinot'}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mt-0.5 flex items-center gap-2">
                      <span>{char.character_name}</span>
                      {char.is_hunted && (
                        <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded font-black uppercase">
                          Hunted
                        </span>
                      )}
                      {char._hasSanguine && (
                        <span className="text-xs px-2.5 py-0.5 bg-red-950 text-red-300 border border-red-500/80 rounded-lg font-black uppercase animate-pulse">
                          🩸 Sanguine BiS
                        </span>
                      )}
                      {char._hasSoul && (
                        <span className="text-xs px-2.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-500/80 rounded-lg font-black uppercase">
                          💀 Soulwar BiS
                        </span>
                      )}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                      <span className="text-yellow-400 font-bold font-mono">Level {char.level}</span>
                      <span>•</span>
                      <span className="text-gray-200 font-medium">{vocStr}</span>
                      <span>•</span>
                      <span className="text-yellow-300 font-mono font-bold">{bid.toLocaleString()} TC</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAuctionModal(null)}
                  className="text-gray-400 hover:text-white p-2 rounded-xl bg-stone-900 hover:bg-stone-800 transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* BARRA DE NAVEGAÇÃO DE ABAS */}
              <div className="flex items-center gap-1.5 px-5 pt-3 bg-stone-950/90 border-b border-stone-800 overflow-x-auto custom-scrollbar shrink-0">
                {MODAL_TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t-2 border-x border-b-0 whitespace-nowrap ${
                      modalActiveTab === tab.id
                        ? 'bg-stone-900 text-yellow-400 border-yellow-500/60 shadow-inner font-black'
                        : 'bg-stone-950/50 text-gray-400 hover:text-gray-200 border-transparent hover:bg-stone-900/40'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* CORPO ROLÁVEL COM CONTEÚDO DA ABA ATIVA */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

                {/* ABA 1: VISÃO GERAL & TELEMETRIA */}
                {modalActiveTab === 'overview' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Gauge size={14} className="text-yellow-400" /> Atributos Vitais do Personagem (Base Tibia)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 space-y-1 text-center">
                          <span className="text-[11px] text-red-400 font-bold flex items-center justify-center gap-1">
                            <Heart size={13} /> Max Hit Points
                          </span>
                          <div className="text-xl font-black text-white font-mono">{telemetry.hp.toLocaleString()}</div>
                          <span className="text-[10px] text-gray-500">HP Total Base</span>
                        </div>

                        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 space-y-1 text-center">
                          <span className="text-[11px] text-blue-400 font-bold flex items-center justify-center gap-1">
                            <Droplets size={13} /> Max Mana
                          </span>
                          <div className="text-xl font-black text-white font-mono">{telemetry.mp.toLocaleString()}</div>
                          <span className="text-[10px] text-gray-500">Mana Pool Total</span>
                        </div>

                        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 space-y-1 text-center">
                          <span className="text-[11px] text-amber-300 font-bold flex items-center justify-center gap-1">
                            <Package size={13} /> Capacidade (Cap)
                          </span>
                          <div className="text-xl font-black text-white font-mono">{telemetry.cap.toLocaleString()}</div>
                          <span className="text-[10px] text-gray-500">Capacidade de Carga</span>
                        </div>

                        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 space-y-1 text-center">
                          <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <Zap size={13} /> Velocidade Base
                          </span>
                          <div className="text-xl font-black text-white font-mono">{telemetry.speed}</div>
                          <span className="text-[10px] text-gray-500">Tiles por segundo</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-2">
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider block">🛡️ Proteções e Status</span>
                        <div className="space-y-1.5 text-xs text-gray-300">
                          <div className="flex justify-between py-1 border-b border-stone-800">
                            <span>Blessings Totais:</span>
                            <span className="font-bold text-emerald-400">7/7 + Twist of Fate (100% Protegido)</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-800">
                            <span>Promoção de Vocação:</span>
                            <span className="font-bold text-white">Promovido ({vocStr})</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-800">
                            <span>Status de Hunted:</span>
                            <span className={char.is_hunted ? 'font-bold text-red-400' : 'font-bold text-emerald-400'}>
                              {char.is_hunted ? '⚠️ Hunted Ativo' : '🛡️ Livre de Hunted'}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Servidor / Mundo:</span>
                            <span className="font-bold text-yellow-300 font-mono">{char.world_name || 'Rubinot'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-2">
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider block">💰 Resumo do Leilão</span>
                        <div className="space-y-1.5 text-xs text-gray-300">
                          <div className="flex justify-between py-1 border-b border-stone-800">
                            <span>Lance Atual:</span>
                            <span className="font-bold text-white font-mono">{bid.toLocaleString()} TC (~R$ {(bid * 0.2).toFixed(2)})</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-800">
                            <span>Avaliação FIPE Justa:</span>
                            <span className="font-bold text-yellow-400 font-mono">~{fipe.avgFipe.toLocaleString()} TC</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-800">
                            <span>Desconto de Mercado:</span>
                            <span className={`font-bold ${fipe.discountPct > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                              {fipe.discountPct > 0 ? `${fipe.discountPct}% Abaixo da FIPE` : 'Preço de Tabela'}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Lucro de Arbitragem:</span>
                            <span className="font-bold text-emerald-400 font-mono">+{fipe.estimatedProfitTc.toLocaleString()} TC líquido</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 2: EQUIPAMENTOS & INVENTÁRIO (SANGUINE E SOULWAR EM DESTAQUE ABSOLUTO) */}
                {modalActiveTab === 'items' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <button
                          type="button"
                          onClick={() => setModalItemFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${modalItemFilter === 'all' ? 'bg-yellow-500 text-stone-950 font-black' : 'bg-stone-950 text-gray-400 hover:text-white'}`}
                        >
                          Todos ({itemsList.length})
                        </button>
                        {sanguineItemsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setModalItemFilter('sanguine')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${modalItemFilter === 'sanguine' ? 'bg-red-600 text-white font-black shadow-md shadow-red-600/30' : 'bg-red-950/60 text-red-300 border border-red-500/40 hover:bg-red-900/60'}`}
                          >
                            <span>🩸 Sanguine</span>
                            <span className="bg-red-900 text-white px-1 rounded-full text-[10px]">{sanguineItemsCount}</span>
                          </button>
                        )}
                        {soulItemsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setModalItemFilter('soulwar')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${modalItemFilter === 'soulwar' ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/30' : 'bg-purple-950/60 text-purple-300 border border-purple-500/40 hover:bg-purple-900/60'}`}
                          >
                            <span>💀 Soulwar</span>
                            <span className="bg-purple-900 text-white px-1 rounded-full text-[10px]">{soulItemsCount}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setModalItemFilter('tiered')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${modalItemFilter === 'tiered' ? 'bg-cyan-900 text-cyan-200 border border-cyan-500/50 font-black' : 'bg-stone-950 text-gray-400 hover:text-white'}`}
                        >
                          ⚡ Com Tier
                        </button>
                      </div>

                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-2.5 top-2.5 text-gray-500" size={14} />
                        <input
                          type="text"
                          placeholder="Buscar item no char..."
                          value={modalItemSearch}
                          onChange={(e) => setModalItemSearch(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    </div>

                    {modalFilteredItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto custom-scrollbar p-1">
                        {modalFilteredItems.map((item, idx) => {
                          const nameLower = (item?.name || '').toLowerCase();
                          const isSanguine = nameLower.includes('sanguine');
                          const isSoul = nameLower.includes('soul');

                          return (
                            <div 
                              key={idx} 
                              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                isSanguine
                                  ? 'bg-gradient-to-r from-red-950/60 via-stone-900 to-stone-950 border-2 border-red-500 shadow-md shadow-red-900/30 ring-1 ring-red-500/30'
                                  : isSoul
                                  ? 'bg-gradient-to-r from-purple-950/60 via-stone-900 to-stone-950 border-2 border-purple-500 shadow-md shadow-purple-900/30 ring-1 ring-purple-500/30'
                                  : item.tier > 0 
                                  ? 'bg-cyan-950/30 border border-cyan-500/40 shadow-sm' 
                                  : 'bg-stone-900/70 border border-stone-800'
                              }`}
                            >
                              <div className="relative shrink-0">
                                <img 
                                  src={`https://api.increasesoft.com/api/images/item/${encodeURIComponent(item?.name || '')}?v=4`}
                                  alt={item?.name || 'Item'}
                                  loading="lazy"
                                  decoding="async"
                                  className={`w-10 h-10 object-contain rounded-lg p-1 border ${
                                    isSanguine 
                                      ? 'bg-red-950 border-red-500' 
                                      : isSoul 
                                      ? 'bg-purple-950 border-purple-500' 
                                      : 'bg-stone-950 border-stone-700/60'
                                  }`}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                {item.tier > 0 && (
                                  <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-stone-950 text-[10px] font-black px-1.5 rounded-full shadow">
                                    T{item.tier}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className={`text-xs font-bold capitalize truncate ${isSanguine ? 'text-red-300' : isSoul ? 'text-purple-300' : 'text-white'}`} title={item?.name}>
                                  {item?.name}
                                </div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {item.count > 1 && <span>Qtd: {item.count}</span>}
                                  {item.tier > 0 && <span className="text-cyan-400 font-bold">Tier {item.tier}</span>}
                                  {isSanguine && <span className="text-red-400 font-black flex items-center gap-0.5">🩸 SANGUINE BiS</span>}
                                  {isSoul && <span className="text-purple-400 font-black flex items-center gap-0.5">💀 SOULWAR BiS</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-stone-900/40 border border-stone-800 text-center text-xs text-gray-500">
                        Nenhum item corresponde ao filtro ou busca selecionados.
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 3: SKILLS & COMBATE */}
                {modalActiveTab === 'skills' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      <div className="bg-stone-900/90 p-3.5 rounded-xl border border-stone-800 space-y-1">
                        <span className="text-gray-400 text-xs flex items-center justify-center gap-1">
                          <Wand2 size={13} className="text-blue-400" /> Magic Level
                        </span>
                        <div className="text-2xl font-black text-blue-400 font-mono">{char.mag_level || '-'}</div>
                      </div>

                      <div className="bg-stone-900/90 p-3.5 rounded-xl border border-stone-800 space-y-1">
                        <span className="text-gray-400 text-xs flex items-center justify-center gap-1">
                          <Target size={13} className="text-green-400" /> Distance
                        </span>
                        <div className="text-2xl font-black text-green-400 font-mono">{char.skills_data?.dist || '-'}</div>
                      </div>

                      <div className="bg-stone-900/90 p-3.5 rounded-xl border border-stone-800 space-y-1">
                        <span className="text-gray-400 text-xs flex items-center justify-center gap-1">
                          <Sword size={13} className="text-red-400" /> Espada (Sword)
                        </span>
                        <div className="text-2xl font-black text-white font-mono">{char.skills_data?.sword || '-'}</div>
                      </div>

                      <div className="bg-stone-900/90 p-3.5 rounded-xl border border-stone-800 space-y-1">
                        <span className="text-gray-400 text-xs flex items-center justify-center gap-1">
                          <Sword size={13} className="text-orange-400" /> Machado (Axe)
                        </span>
                        <div className="text-2xl font-black text-white font-mono">{char.skills_data?.axe || '-'}</div>
                      </div>

                      <div className="bg-stone-900/90 p-3.5 rounded-xl border border-stone-800 space-y-1">
                        <span className="text-gray-400 text-xs flex items-center justify-center gap-1">
                          <Shield size={13} className="text-stone-400" /> Shielding
                        </span>
                        <div className="text-2xl font-black text-stone-300 font-mono">{char.skills_data?.shielding || '-'}</div>
                      </div>
                    </div>

                    <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame size={15} /> Estimativa de Potencial de Combate
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {isMage && `Mago de combate com Magic Level ${char.mag_level}. Alta capacidade de dano em área com Waves e Ultimate Spells (Cataclysm / Hell's Core / Eternal Winter).`}
                        {isRP && `Paladino de ataque à distância com Distance Fighting ${char.skills_data?.dist || '?'} e Magic Level ${char.mag_level}. Spam constante de Divine Caldera e Flechas de Diamante.`}
                        {isEK && `Cavaleiro de frente com Melee Skill ${char._maxMelee || '?'} e Shielding ${char.skills_data?.shielding || '?'}. Grande sobrevivência para rotação de Exori Gran e Exori Mas.`}
                        {!isMage && !isRP && !isEK && 'Personagem equilibrado para evolução em caçadas solo e em grupo.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* ABA 4: CHARMS & BESTIÁRIO */}
                {modalActiveTab === 'charms' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-stone-900 to-stone-900 p-4 rounded-2xl border border-purple-500/30">
                      <div>
                        <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">Pontuação de Charms Acumulada</div>
                        <div className="text-3xl font-black text-white font-mono mt-0.5 flex items-center gap-2">
                          <Star size={24} className="text-purple-400 fill-purple-400" />
                          <span>{charmPts.toLocaleString()} <span className="text-xs text-purple-400 font-bold">pontos</span></span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Equivale a aproximadamente ~{(charmPts / 800).toFixed(1)} Runas Maiores desbloqueáveis para caçadas.
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">Valorização FIPE Estimada</span>
                        <span className="text-lg font-mono font-bold text-amber-300">
                          +{(charmPts * 0.3) | 0} TC
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <BookOpen size={14} className="text-purple-400" /> Runas Disponíveis no Meta
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CHARM_RUNES.map(rune => {
                          const canAfford = charmPts >= rune.cost;

                          return (
                            <div 
                              key={rune.id} 
                              className={`p-3 rounded-xl border flex items-start gap-3 ${
                                canAfford 
                                  ? 'bg-stone-900/90 border-purple-500/40' 
                                  : 'bg-stone-950/60 border-stone-800/80 opacity-60'
                              }`}
                            >
                              <span className="text-2xl shrink-0 mt-0.5">{rune.icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white">{rune.name}</span>
                                  <span className={`text-[11px] font-mono font-bold ${canAfford ? 'text-purple-400' : 'text-gray-500'}`}>
                                    {rune.cost} pts
                                  </span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{rune.desc}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 5: ACESSOS & QUESTS META */}
                {modalActiveTab === 'quests' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass size={15} className="text-yellow-400" /> Checklist de Prontidão de Quests e Acessos
                    </div>

                    <div className="space-y-2">
                      {quests.map((q, idx) => (
                        <div 
                          key={idx}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                            q.unlocked 
                              ? 'bg-stone-900/80 border-emerald-500/40 shadow-sm' 
                              : 'bg-stone-950/60 border-stone-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              q.unlocked ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-stone-900 text-gray-600 border border-stone-800'
                            }`}>
                              {q.unlocked ? <CheckCircle size={16} /> : <Lock size={16} />}
                            </div>

                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>{q.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-yellow-300 font-mono font-normal">
                                  {q.tier}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                Recompensa: <span className="text-gray-200">{q.reward}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-xs font-bold font-mono ${q.unlocked ? 'text-emerald-400' : 'text-gray-500'}`}>
                              {q.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ABA 6: DOSSIÊ FIPE & ARBITRAGEM (FOCO EM SANGUINE E SOULWAR) */}
                {modalActiveTab === 'fipe' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="bg-gradient-to-r from-stone-900 via-amber-950/20 to-stone-900 border border-yellow-500/40 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign size={15} /> Comparativo Financeiro Oficial RubinOT
                        </h3>
                        <span className="text-xs font-bold text-amber-300">
                          {(fipe.discountPct || 0) > 0 ? `${fipe.discountPct}% Abaixo da FIPE` : 'Preço de Mercado'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-black/60 p-3.5 rounded-xl border border-stone-800">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Lance / Preço Pago</span>
                          <div className="text-xl font-black text-white font-mono mt-0.5">{bid.toLocaleString()} TC</div>
                        </div>

                        <div className="bg-black/60 p-3.5 rounded-xl border border-stone-800">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Avaliação FIPE Justa</span>
                          <div className="text-xl font-black text-yellow-400 font-mono mt-0.5">~{fipe.avgFipe.toLocaleString()} TC</div>
                        </div>

                        <div className="bg-black/60 p-3.5 rounded-xl border border-stone-800">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Lucro Líquido Revenda</span>
                          <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">+{fipe.estimatedProfitTc.toLocaleString()} TC</div>
                        </div>
                      </div>

                      {/* Deal Score Gauge & Insights da IA */}
                      <div className="p-3.5 rounded-xl bg-black/70 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black font-mono border ${
                            (fipe.dealScore || 50) >= 80 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20' 
                              : (fipe.dealScore || 50) >= 65 
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                              : (fipe.dealScore || 50) < 38 
                              ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          }`}>
                            <span className="text-xl leading-none">{fipe.dealScore || 50}</span>
                            <span className="text-[8px] uppercase tracking-wider text-gray-400">Score</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider border ${fipe.dealBadgeColor}`}>
                                {fipe.dealBadgeLabel}
                              </span>
                              <span className="text-xs text-gray-300 font-bold">Classificação Sniper</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">
                              {(fipe.dealScore || 50) >= 80
                                ? 'Personagem com margem excelente de revenda ou custo-benefício brutal para jogar!'
                                : (fipe.dealScore || 50) >= 65
                                ? 'Bom negócio com preço atrativo em relação aos itens e skills inclusos.'
                                : (fipe.dealScore || 50) < 38
                                ? 'Preço acima da média de mercado. Recomenda-se cautela ou aguardar lances menores.'
                                : 'Preço alinhado com a média praticada nos leilões do RubinOT.'}
                            </p>
                          </div>
                        </div>

                        {fipe.dealReasons?.length > 0 && (
                          <div className="flex flex-col gap-1 sm:text-right shrink-0">
                            <span className="text-[9px] uppercase font-bold text-gray-500">Fatores Chave:</span>
                            {fipe.dealReasons.slice(0, 3).map((r, i) => (
                              <span key={i} className="text-[10px] font-mono text-yellow-400/90 font-bold">
                                • {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Discriminação de Composição */}
                      <div className="p-3.5 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2 text-xs text-gray-300 font-mono">
                        <div className="flex justify-between py-1 border-b border-stone-800/80">
                          <span>Base de Nível ({char.level} lvls x taxa {vocStr.split(' ')[0]}):</span>
                          <span className="text-white font-bold">~{fipe.baseTc} TC</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-stone-800/80">
                          <span>Bônus de Charms ({charmPts} pts):</span>
                          <span className="text-purple-400 font-bold">+{fipe.charmsBonus} TC</span>
                        </div>
                        {fipe.sanguineBonus > 0 && (
                          <div className="flex justify-between py-1 border-b border-stone-800/80 text-red-400">
                            <span>🩸 Bônus Equipamentos Sanguine (Rotten Blood):</span>
                            <span className="font-bold">+{fipe.sanguineBonus} TC</span>
                          </div>
                        )}
                        {fipe.soulwarBonus > 0 && (
                          <div className="flex justify-between py-1 border-b border-stone-800/80 text-purple-300">
                            <span>💀 Bônus Equipamentos Soulwar:</span>
                            <span className="font-bold">+{fipe.soulwarBonus} TC</span>
                          </div>
                        )}
                        <div className="flex justify-between py-1 border-b border-stone-800/80">
                          <span>Bônus de Forja / Tiers:</span>
                          <span className="text-cyan-400 font-bold">+{fipe.tierBonus} TC</span>
                        </div>
                        <div className="flex justify-between py-1 text-yellow-300 font-bold pt-1 text-sm">
                          <span>Valor FIPE Total Calibrado:</span>
                          <span>{fipe.avgFipe} TC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* RODAPÉ FIXO DO MODAL COM LINKS OFICIAIS E COMPARTILHAMENTO */}
              <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleShareAuction(char)}
                  className="flex-1 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 font-bold text-xs text-gray-200 flex items-center justify-center gap-2 transition-colors"
                >
                  {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                  {copiedLink ? 'Copiado para o Clipboard!' : 'Compartilhar no Discord/WhatsApp'}
                </button>

                <a
                  href={`https://rubinot.com.br/bazaar/${char.auction_id}`}
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
        );
      })()}

      {/* BANNER ADSENSE */}
      <div className="mt-4">
        <AdBanner />
      </div>

    </div>
  );
}
