import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Target, AlertTriangle, Clock, TrendingDown, Coins, Search, ExternalLink, 
  Star, Shield, Sword, Wand2, RefreshCw, Flame, Sparkles, Filter, 
  ArrowUpDown, Volume2, VolumeX, Eye, Calculator, ChevronDown, CheckCircle2,
  Award, Globe, Zap, ArrowRight, User
} from 'lucide-react';
import { formatVocation } from '../lib/tibiaUtils';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import { soundFX } from '../lib/soundEffects';
import AdBanner from '../components/AdBanner';

export default function BazaarSniper({ onPlayerClick, onNavigate, isPremium }) {
  const { selectedWorld, setSelectedWorld } = useWorld();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoc, setSelectedVoc] = useState('ALL');
  const [activeChip, setActiveChip] = useState('all'); // 'all' | 'opportunity' | 'ending_soon' | 'hunted' | 'high_level' | 'cheap' | 'charms'
  const [sortOption, setSortOption] = useState('ending'); // 'ending' | 'price_asc' | 'level_desc' | 'efficiency' | 'charms'
  const [audioEnabled, setAudioEnabled] = useState(soundFX.isEnabled());
  const [showFipeCalc, setShowFipeCalc] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  // Estados da Calculadora FIPE
  const [calcLevel, setCalcLevel] = useState(700);
  const [calcVoc, setCalcVoc] = useState('Knight');
  const [calcCharms, setCalcCharms] = useState(400);

  // Ticker de 1 segundo para atualizar as contagens regressivas em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('bazaar_alerts')
        .select('*')
        .gt('auction_end', nowIso)
        .order('auction_end', { ascending: true });

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
    const interval = setInterval(fetchAlerts, 2 * 60 * 1000); // 2 minutos
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = soundFX.toggle();
    setAudioEnabled(next);
  };

  // Cálculo da Estimativa FIPE
  const estimatedFipe = useMemo(() => {
    const lvl = Number(calcLevel) || 100;
    const ch = Number(calcCharms) || 0;
    let baseRate = 1.2; // TC por level base
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

  // Função auxiliar para tempo restante formatado em HH:MM:SS
  const getTimeRemaining = (auctionEnd) => {
    if (!auctionEnd) return { text: 'Expirado', isUrgent: false, isImminent: false, totalSeconds: 0 };
    const diff = new Date(auctionEnd).getTime() - nowTimestamp;
    if (diff <= 0) return { text: 'Encerrado', isUrgent: false, isImminent: false, totalSeconds: 0 };

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const isImminent = totalSeconds < 30 * 60; // < 30 minutos
    const isUrgent = totalSeconds < 2 * 3600;   // < 2 horas

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h restantes`, isUrgent: false, isImminent: false, totalSeconds };
    }

    const pad = (n) => String(n).padStart(2, '0');
    return {
      text: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
      isUrgent,
      isImminent,
      totalSeconds
    };
  };

  // Filtragem e Ordenação
  const filteredAndSortedAuctions = useMemo(() => {
    let result = alerts.filter(a => {
      // 1. Filtro de Mundo
      if (selectedWorld !== 'ALL' && a.world_name && a.world_name.toLowerCase() !== selectedWorld.toLowerCase()) {
        return false;
      }

      // 2. Busca por Texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (a.character_name || '').toLowerCase().includes(q);
        const matchItem = Array.isArray(a.items_data) && a.items_data.some(it => (it?.name || '').toLowerCase().includes(q));
        if (!matchName && !matchItem) return false;
      }

      // 3. Filtro de Vocação
      if (selectedVoc !== 'ALL') {
        const voc = (a.vocation || '').toLowerCase();
        if (selectedVoc === 'knight' && !voc.includes('knight')) return false;
        if (selectedVoc === 'paladin' && !voc.includes('paladin')) return false;
        if (selectedVoc === 'sorcerer' && !voc.includes('sorcerer')) return false;
        if (selectedVoc === 'druid' && !voc.includes('druid')) return false;
        if (selectedVoc === 'monk' && !voc.includes('monk')) return false;
      }

      // 4. Filtro por Chip Ativo
      if (activeChip === 'opportunity') {
        const tcPerLvl = (a.current_bid || 0) / (a.level || 1);
        return a.is_sniping_opportunity || tcPerLvl < 1.5;
      }
      if (activeChip === 'ending_soon') {
        const diffMs = new Date(a.auction_end).getTime() - nowTimestamp;
        return diffMs > 0 && diffMs < 3 * 3600 * 1000; // < 3 horas
      }
      if (activeChip === 'hunted') return a.is_hunted;
      if (activeChip === 'high_level') return (a.level || 0) >= 700;
      if (activeChip === 'cheap') return (a.current_bid || 0) <= 500;
      if (activeChip === 'charms') return (a.charm_points || 0) >= 400;

      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      if (sortOption === 'ending') {
        return new Date(a.auction_end).getTime() - new Date(b.auction_end).getTime();
      }
      if (sortOption === 'price_asc') {
        return (a.current_bid || 0) - (b.current_bid || 0);
      }
      if (sortOption === 'level_desc') {
        return (b.level || 0) - (a.level || 0);
      }
      if (sortOption === 'efficiency') {
        const effA = (a.current_bid || 0) / (a.level || 1);
        const effB = (b.current_bid || 0) / (b.level || 1);
        return effA - effB;
      }
      if (sortOption === 'charms') {
        return (b.charm_points || 0) - (a.charm_points || 0);
      }
      return 0;
    });

    return result;
  }, [alerts, selectedWorld, searchQuery, selectedVoc, activeChip, sortOption, nowTimestamp]);

  const stats = useMemo(() => {
    const total = alerts.length;
    const opportunities = alerts.filter(a => a.is_sniping_opportunity || ((a.current_bid || 0) / (a.level || 1) < 1.5)).length;
    const endingSoon = alerts.filter(a => {
      const diff = new Date(a.auction_end).getTime() - nowTimestamp;
      return diff > 0 && diff < 3 * 3600 * 1000;
    }).length;
    const hunteds = alerts.filter(a => a.is_hunted).length;
    return { total, opportunities, endingSoon, hunteds };
  }, [alerts, nowTimestamp]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* 1. HERO BANNER: BAZAAR SNIPER COM RADAR AO VIVO */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3.5 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3 shadow-inner">
              <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              Arbitragem de Leilões em Tempo Real
            </div>

            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold drop-shadow-lg leading-tight">
              Bazaar Sniper <span className="text-white">Rubinot</span>
            </h1>
            
            <p className="text-gray-300 font-sans text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Monitore oportunidades de compra, lances abaixo do valor de mercado e alvos de guerra em leilão nos 16 servidores oficiais de Rubinot.
            </p>
          </div>

          {/* PAINEL DE AÇÕES DO TOPO */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFipeCalc(!showFipeCalc)}
              className="flex items-center gap-2 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 px-4 py-2.5 text-xs font-bold text-yellow-300 transition-all shadow-md active:scale-95"
            >
              <Calculator size={16} />
              <span>Simulador FIPE de Chars</span>
            </button>

            <button
              onClick={toggleSound}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                audioEnabled
                  ? 'bg-yellow-500 text-black border-yellow-400 shadow-tibia-glow'
                  : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={audioEnabled ? "Alertas sonoros ativados" : "Ativar alertas sonoros de sniper"}
            >
              {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden sm:inline">{audioEnabled ? 'Som Ativo' : 'Mudo'}</span>
            </button>

            <button 
              onClick={fetchAlerts}
              className="flex items-center gap-2 rounded-xl bg-black/70 hover:bg-yellow-950/40 border border-yellow-500/40 px-4 py-2.5 text-xs font-bold text-yellow-400 transition-all active:scale-95"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          </div>
        </div>

        {/* SIMULADOR FIPE DE CHARS (DRAWER EXPANSÍVEL) */}
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
                {estimatedFipe.min.toLocaleString()} - {estimatedFipe.max.toLocaleString()} <span className="text-xs text-yellow-400">TC</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5">Média: ~{estimatedFipe.avg.toLocaleString()} TC</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. STRIP DE MÉTRICAS / RESUMO DO BAZAAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => setActiveChip('all')}
          className={`bg-black/80 border p-4 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'all' 
              ? 'border-yellow-500 bg-yellow-950/20 shadow-yellow-500/10' 
              : 'border-yellow-500/20 hover:border-yellow-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 uppercase font-semibold">Leilões Ativos</span>
            <Search className="text-blue-400" size={18} />
          </div>
          <p className="text-3xl font-medieval font-bold text-white mt-1">{stats.total}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Nos 16 mundos</p>
        </div>

        <div 
          onClick={() => setActiveChip('opportunity')}
          className={`bg-black/80 border p-4 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'opportunity' 
              ? 'border-green-500 bg-green-950/20 shadow-green-500/10' 
              : 'border-yellow-500/20 hover:border-green-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-green-400 uppercase font-semibold">Pechinchas / Oportunidades</span>
            <Flame className="text-green-400" size={18} />
          </div>
          <p className="text-3xl font-medieval font-bold text-green-400 mt-1">{stats.opportunities}</p>
          <p className="text-[11px] text-green-500/70 mt-0.5">Abaixo da média FIPE</p>
        </div>

        <div 
          onClick={() => setActiveChip('ending_soon')}
          className={`bg-black/80 border p-4 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'ending_soon' 
              ? 'border-red-500 bg-red-950/20 shadow-red-500/10' 
              : 'border-yellow-500/20 hover:border-red-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-400 uppercase font-semibold">Sniper Mode (&lt; 2h)</span>
            <Clock className="text-red-400" size={18} />
          </div>
          <p className="text-3xl font-medieval font-bold text-red-400 mt-1">{stats.endingSoon}</p>
          <p className="text-[11px] text-red-500/70 mt-0.5">Reta final de encerramento</p>
        </div>

        <div 
          onClick={() => setActiveChip('hunted')}
          className={`bg-black/80 border p-4 rounded-2xl cursor-pointer transition-all shadow-lg ${
            activeChip === 'hunted' 
              ? 'border-purple-500 bg-purple-950/20 shadow-purple-500/10' 
              : 'border-yellow-500/20 hover:border-purple-500/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-purple-300 uppercase font-semibold">Alvos de Guerra (Hunteds)</span>
            <AlertTriangle className="text-purple-400" size={18} />
          </div>
          <p className="text-3xl font-medieval font-bold text-purple-300 mt-1">{stats.hunteds}</p>
          <p className="text-[11px] text-purple-400/70 mt-0.5">Inimigos à venda</p>
        </div>

      </div>

      {/* 3. BARRA DE FILTROS, BUSCA & ORDENAÇÃO */}
      <div className="bg-black/80 border border-yellow-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        
        {/* Linha 1: Input de Busca + Seletor de Mundo + Seletor de Vocação */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-3 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Buscar personagem ou item em destaque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div className="md:col-span-4">
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
              value={selectedVoc}
              onChange={(e) => setSelectedVoc(e.target.value)}
              className="w-full bg-stone-900 border border-white/10 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500 font-bold cursor-pointer"
            >
              <option value="ALL">Todas as Vocações</option>
              <option value="knight">Elite Knight (EK)</option>
              <option value="paladin">Royal Paladin (RP)</option>
              <option value="sorcerer">Master Sorcerer (MS)</option>
              <option value="druid">Elder Druid (ED)</option>
              <option value="monk">Exalted Monk</option>
            </select>
          </div>

        </div>

        {/* Linha 2: Chips Rápidos & Ordenação */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
          
          {/* Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: '🌟 Todos' },
              { id: 'opportunity', label: '🔥 Pechinchas' },
              { id: 'ending_soon', label: '⏳ Últimas Horas' },
              { id: 'high_level', label: '👑 Lvl 700+' },
              { id: 'cheap', label: '💰 Até 500 TC' },
              { id: 'charms', label: '⭐ Ricos em Charms' },
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

          {/* Dropdown de Ordenação */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <ArrowUpDown size={14} className="text-gray-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-stone-900 border border-white/10 text-xs text-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-yellow-500 cursor-pointer"
            >
              <option value="ending">⏳ Termina Primeiro</option>
              <option value="price_asc">💰 Menor Preço (TC)</option>
              <option value="level_desc">📈 Maior Nível (Level)</option>
              <option value="efficiency">🎯 Melhor Custo / Level</option>
              <option value="charms">⭐ Mais Charms</option>
            </select>
          </div>

        </div>

      </div>

      {/* 4. GRID DE LEILÕES */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
          <p className="font-medieval text-xl text-yellow-400">Rastreando leilões ativos nos 16 servidores...</p>
        </div>
      ) : filteredAndSortedAuctions.length === 0 ? (
        <div className="bg-black/60 border border-yellow-500/20 p-12 rounded-2xl text-center space-y-3">
          <Target className="mx-auto text-yellow-500/40" size={48} />
          <h3 className="text-xl font-medieval text-white">Nenhum leilão correspondente encontrado</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Tente remover os filtros aplicados ou selecione "Todos os Mundos" para visualizar todo o mercado ativo.
          </p>
          <button
            onClick={() => { setActiveChip('all'); setSelectedVoc('ALL'); setSearchQuery(''); }}
            className="px-4 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-xs font-bold text-yellow-300 transition-all"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedAuctions.map(auction => {
            const timeInfo = getTimeRemaining(auction.auction_end);
            const bidVal = Number(auction.current_bid) || 0;
            const lvl = Number(auction.level) || 1;
            const tcPerLvl = (bidVal / lvl).toFixed(2);
            const isSuperPechincha = auction.is_sniping_opportunity || Number(tcPerLvl) < 1.0;

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
                key={auction.id || auction.auction_id}
                className={`bg-gradient-to-b from-stone-950 via-black to-stone-950 border rounded-2xl p-5 relative overflow-hidden transition-all flex flex-col justify-between group shadow-xl ${
                  auction.is_hunted
                    ? 'border-red-500/60 shadow-red-500/10'
                    : timeInfo.isImminent
                    ? 'border-amber-500 shadow-amber-500/20 animate-pulse'
                    : isSuperPechincha
                    ? 'border-yellow-500/70 shadow-yellow-500/15'
                    : 'border-white/10 hover:border-yellow-500/40'
                }`}
              >
                {/* BADGE DE TOPO */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {auction.is_hunted && (
                      <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                        💀 Alvo Inimigo
                      </span>
                    )}
                    {isSuperPechincha && (
                      <span className="bg-yellow-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <Flame size={12} /> Pechincha
                      </span>
                    )}
                    {lvl >= 800 && (
                      <span className="bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                        👑 High Level
                      </span>
                    )}
                  </div>

                  {/* Timer regressivo */}
                  <div className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 ${
                    timeInfo.isImminent
                      ? 'bg-red-950 text-red-300 border border-red-500/50'
                      : timeInfo.isUrgent
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                      : 'bg-black/60 text-gray-400 border border-white/10'
                  }`}>
                    <Clock size={12} className={timeInfo.isImminent ? 'animate-spin' : ''} />
                    <span>{timeInfo.text}</span>
                  </div>
                </div>

                {/* CABEÇALHO DO CHAR */}
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
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-yellow-950/40 text-yellow-300 border border-yellow-500/20 font-mono">
                        {auction.world_name || 'Rubinot'}
                      </span>
                      {auction.charm_points > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-950/50 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Star size={10} /> {auction.charm_points} Charms
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SKILLS & TELEMETRIA DO CHAR */}
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
                      <Coins size={11} className="text-yellow-400" /> TC/Lvl
                    </span>
                    <span className={`font-bold ${Number(tcPerLvl) < 1.0 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {tcPerLvl}
                    </span>
                  </div>
                </div>

                {/* ITENS EM DESTAQUE (SE HOUVER) */}
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

                {/* ÁREA DE VALOR DO LANCE & AÇÕES */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex justify-between items-center bg-black/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-xs text-gray-400 font-medium">Lance Atual:</span>
                    <div className="flex items-center gap-1.5">
                      <Coins size={15} className="text-yellow-400" />
                      <span className="text-lg font-black text-white font-mono">
                        {bidVal.toLocaleString()} <span className="text-xs text-yellow-400 font-bold">TC</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPlayerClick && onPlayerClick(auction.character_name, auction.world_name)}
                      className="py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-white/10 hover:border-yellow-500/40 text-xs font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <User size={13} />
                      <span>Dossiê Tático</span>
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

      {/* BANNER DE PUBLICIDADE ADSENSE */}
      <div className="mt-4">
        <AdBanner />
      </div>

    </div>
  );
}
