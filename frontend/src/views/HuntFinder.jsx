import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Compass, Search, MapPin, Coins, Zap, Shield, Flame, Skull, 
  ExternalLink, Filter, Star, Sparkles, CheckCircle2, Play, Video, 
  X, Copy, Check, Users, User, ArrowUpDown, ChevronRight, Award,
  AlertTriangle, Heart, ShieldAlert, BookOpen, Layers, Target, Info
} from 'lucide-react';
import AdBanner from '../components/AdBanner';
import { HUNTS_DATABASE, HUNT_CATEGORIES } from '../data/huntsDatabase';

// Re-exporta para retrocompatibilidade
export { HUNTS_DATABASE, HUNT_CATEGORIES };

export default function HuntFinder({ onPlayerClick, onNavigate }) {
  const [selectedVoc, setSelectedVoc] = useState('ALL');
  const [levelRange, setLevelRange] = useState('all');
  const [huntMode, setHuntMode] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [elementFilter, setElementFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommendedLevel'); // 'recommendedLevel', 'levelAsc', 'rawXp', 'profit', 'danger'
  
  // Modal de Detalhes da Hunt
  const [selectedHunt, setSelectedHunt] = useState(null);
  const [modalTab, setModalTab] = useState('video'); // 'video', 'protection', 'charms', 'roles'
  const [copiedLink, setCopiedLink] = useState(false);

  // Deep linking: verifica se há ?hunt=id na URL ao carregar
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const huntParam = urlParams.get('hunt');
      if (huntParam) {
        const found = HUNTS_DATABASE.find(h => h.id === huntParam);
        if (found) setSelectedHunt(found);
      }
    } catch (e) {
      console.warn('Deep link parse error:', e);
    }
  }, []);

  // Bloqueia scroll do fundo e adiciona atalho ESC ao abrir modal
  useEffect(() => {
    if (!selectedHunt) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedHunt]);

  // Ao abrir o modal, atualiza a query string de forma elegante
  const handleOpenHunt = (hunt) => {
    setSelectedHunt(hunt);
    setModalTab('video');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('hunt', hunt.id);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  const handleCloseModal = () => {
    setSelectedHunt(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('hunt');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  const handleCopyShareLink = () => {
    if (!selectedHunt) return;
    const shareUrl = `${window.location.origin}/hunt-finder?hunt=${selectedHunt.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtragem e Ordenação
  const filteredHunts = useMemo(() => {
    let result = HUNTS_DATABASE.filter(h => {
      if (selectedVoc !== 'ALL' && !h.vocations.includes(selectedVoc)) return false;
      if (huntMode !== 'ALL' && !h.modes.some(m => m.toLowerCase().includes(huntMode.toLowerCase()))) return false;
      if (categoryFilter !== 'ALL' && h.category !== categoryFilter) return false;
      if (elementFilter !== 'ALL' && !h.elements.some(e => e.toLowerCase() === elementFilter.toLowerCase())) return false;
      
      if (levelRange === '50-100' && (h.recommendedLevel < 40 || h.minLevel > 110)) return false;
      if (levelRange === '100-250' && (h.recommendedLevel < 90 || h.minLevel > 260)) return false;
      if (levelRange === '250-450' && (h.recommendedLevel < 240 || h.minLevel > 460)) return false;
      if (levelRange === '450-700' && (h.recommendedLevel < 440 || h.minLevel > 720)) return false;
      if (levelRange === '700-1000' && (h.recommendedLevel < 690 || h.minLevel > 1020)) return false;
      if (levelRange === '1000+' && h.recommendedLevel < 950) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = h.name.toLowerCase().includes(q);
        const matchCity = h.city.toLowerCase().includes(q);
        const matchTag = h.tags.some(t => t.toLowerCase().includes(q));
        const matchCharms = h.charms?.some(c => c.monster.toLowerCase().includes(q) || c.charm.toLowerCase().includes(q));
        const matchElements = h.elements?.some(e => e.toLowerCase().includes(q));
        const matchTier = h.tier?.toLowerCase().includes(q);
        const matchDesc = h.description?.toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchTag && !matchCharms && !matchElements && !matchTier && !matchDesc) return false;
      }

      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'recommendedLevel') return b.recommendedLevel - a.recommendedLevel;
      if (sortBy === 'levelAsc') return a.recommendedLevel - b.recommendedLevel;
      if (sortBy === 'danger') return b.danger - a.danger;
      if (sortBy === 'profit') {
        const getP = (str) => parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
        return getP(b.profit) - getP(a.profit);
      }
      if (sortBy === 'rawXp') {
        const getX = (str) => parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
        return getX(b.rawXp) - getX(a.rawXp);
      }
      return 0;
    });

    return result;
  }, [selectedVoc, levelRange, huntMode, categoryFilter, elementFilter, searchQuery, sortBy]);

  // Contadores por categoria
  const categoryCounts = useMemo(() => {
    const map = { ALL: HUNTS_DATABASE.length };
    HUNTS_DATABASE.forEach(h => {
      map[h.category] = (map[h.category] || 0) + 1;
    });
    return map;
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Banner Principal com Apelo Visual Épico */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/50 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              <Compass size={14} className="text-yellow-400 animate-spin-slow" />
              Hunt Finder 2.0 & Rotas Meta 🗺️
            </div>
            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold">
              Guia Definitivo de Respawns & Vídeos
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Descubra onde fazer a maior XP/h e lucro líquido no RubinOT e Tibia. Clique em qualquer respawn para abrir o 
              <strong className="text-yellow-400"> Modal Tático com Vídeo no YouTube</strong>, mecânicas de puxadas (pulls), fraquezas de charms, proteções elementais e posicionamento para cada vocação.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="bg-black/80 border border-yellow-500/30 rounded-2xl px-4 py-2.5 text-center shadow-lg">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Respawns Mapeados</span>
              <span className="text-xl font-bold text-yellow-400 font-mono">{HUNTS_DATABASE.length} Hunts</span>
            </div>
            <div className="bg-black/80 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-center shadow-lg">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Guias em Vídeo</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">100% Curados</span>
            </div>
            <div className="bg-black/80 border border-purple-500/30 rounded-2xl px-4 py-2.5 text-center shadow-lg">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Faixa de Level</span>
              <span className="text-xl font-bold text-purple-400 font-mono">50 - 1500+</span>
            </div>
          </div>
        </div>

        {/* Chips de Categorias Rápidas */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-2 relative z-10">
          {HUNT_CATEGORIES.map(cat => {
            const isActive = categoryFilter === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                    : 'bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                <span>{cat.label.split('(')[0].trim()}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isActive ? 'bg-black/30 text-black font-extrabold' : 'bg-white/10 text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Painel de Filtros e Busca */}
      <div className="bg-black/70 border border-tibia-border p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Layers size={12} className="text-yellow-400" /> Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              {HUNT_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label} ({categoryCounts[c.id] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Vocação */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Target size={12} className="text-yellow-400" /> Vocação
            </label>
            <select
              value={selectedVoc}
              onChange={(e) => setSelectedVoc(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="ALL">Todas as Vocações</option>
              <option value="Knight">Knight (EK)</option>
              <option value="Paladin">Paladin (RP)</option>
              <option value="Mage">Mage (MS/ED)</option>
              <option value="Monk">Monk</option>
            </select>
          </div>

          {/* Faixa de Nível */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Sparkles size={12} className="text-yellow-400" /> Nível Recomendado
            </label>
            <select
              value={levelRange}
              onChange={(e) => setLevelRange(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="all">Todos os Níveis (50 - 1500+)</option>
              <option value="50-100">Level 50 - 100 (Starter PG)</option>
              <option value="100-250">Level 100 - 250 (Iniciante)</option>
              <option value="250-450">Level 250 - 450 (Médio Avançado)</option>
              <option value="450-700">Level 450 - 700 (High Level Meta)</option>
              <option value="700-1000">Level 700 - 1000 (Endgame)</option>
              <option value="1000+">Level 1000+ (Rotten Blood)</option>
            </select>
          </div>

          {/* Formação / Modo */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Users size={12} className="text-yellow-400" /> Formação / Modo
            </label>
            <select
              value={huntMode}
              onChange={(e) => setHuntMode(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="ALL">Solo, Duo & 4x</option>
              <option value="Solo">Apenas Solo</option>
              <option value="Duo">Duo (EK+ED)</option>
              <option value="Team 4x">Team Hunt 4x</option>
            </select>
          </div>

          {/* Elemento de Defesa */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Shield size={12} className="text-yellow-400" /> Elemento
            </label>
            <select
              value={elementFilter}
              onChange={(e) => setElementFilter(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="ALL">Todos os Elementos</option>
              <option value="Fire">🔥 Fogo (Fire)</option>
              <option value="Ice">❄️ Gelo (Ice)</option>
              <option value="Earth">🌿 Terra (Earth)</option>
              <option value="Energy">⚡ Energia (Energy)</option>
              <option value="Death">💀 Morte (Death)</option>
              <option value="Holy">✨ Sagrado (Holy)</option>
              <option value="Physical">🛡️ Físico (Physical)</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <ArrowUpDown size={12} className="text-yellow-400" /> Ordenar Por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="recommendedLevel">Maior Nível (Endgame primeiro)</option>
              <option value="levelAsc">Menor Nível (Iniciante primeiro)</option>
              <option value="rawXp">Maior XP/h Estimada</option>
              <option value="profit">Maior Lucro / Farme</option>
              <option value="danger">Maior Perigo (5 Caveiras)</option>
            </select>
          </div>

        </div>

        {/* Busca Textual */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por respawn, cidade, monstro, charms, elemento (ex: Rotten, Ice, Cobra, Earth, Sphinx, Hero, Pirats)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/90 border border-tibia-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white bg-white/10 rounded-full p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status de resultados */}
        <div className="flex items-center justify-between text-xs text-gray-400 px-1 pt-1">
          <span>
            Exibindo <strong className="text-yellow-400">{filteredHunts.length}</strong> de <strong className="text-gray-200">{HUNTS_DATABASE.length}</strong> hunts mapeadas
          </span>
          {(categoryFilter !== 'ALL' || selectedVoc !== 'ALL' || levelRange !== 'all' || huntMode !== 'ALL' || elementFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('ALL');
                setSelectedVoc('ALL');
                setLevelRange('all');
                setHuntMode('ALL');
                setElementFilter('ALL');
                setSearchQuery('');
              }}
              className="text-yellow-400/90 hover:text-yellow-300 underline font-semibold cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

      </div>

      {/* Grid de Cards de Hunts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHunts.map(hunt => {
          const isEndgame = hunt.recommendedLevel >= 800;
          return (
            <div 
              key={hunt.id}
              onClick={() => handleOpenHunt(hunt)}
              className="group bg-gradient-to-b from-black/90 via-black/80 to-black/95 border border-tibia-border hover:border-yellow-500/80 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 shadow-lg hover:shadow-2xl hover:shadow-yellow-500/10 cursor-pointer relative overflow-hidden"
            >
              {/* Badge de Destaque no Topo */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      isEndgame ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      Rec. Level {hunt.recommendedLevel}+
                    </span>
                    {hunt.tier && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {hunt.tier}
                      </span>
                    )}
                    {hunt.youtubeId && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                        <Video size={11} /> Vídeo
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-medieval text-yellow-400 group-hover:text-yellow-300 transition-colors flex items-center gap-1.5">
                    {hunt.name}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-red-400" /> {hunt.city}
                  </p>
                </div>

                {/* Caveiras de Perigo */}
                <div className="flex gap-0.5" title={`Perigo: ${hunt.danger} de 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skull 
                      key={i} 
                      size={13} 
                      className={i < hunt.danger ? 'text-red-500' : 'text-gray-700'} 
                    />
                  ))}
                </div>
              </div>

              {/* Descrição Curta */}
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                {hunt.description}
              </p>

              {/* Tags & Modos */}
              <div className="flex flex-wrap gap-1.5">
                {hunt.modes.slice(0, 3).map(m => (
                  <span key={m} className="px-2 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/25 text-[10px] font-bold rounded-md">
                    {m}
                  </span>
                ))}
                {hunt.tags.slice(0, 2).map(t => (
                  <span key={t} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 text-[10px] font-bold rounded-md">
                    {t}
                  </span>
                ))}
              </div>

              {/* Elementos Predominantes */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Shield size={12} className="text-blue-400" />
                <span className="text-[10px] uppercase font-bold text-gray-500">Defesa:</span>
                <span className="text-gray-300 font-semibold">{hunt.elements.join(', ')}</span>
              </div>

              {/* Estatísticas de XP e Lucro */}
              <div className="pt-3 border-t border-tibia-border/60 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/60 p-2 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">XP Estimada:</span>
                  <span className="font-bold text-green-400 font-mono mt-0.5 text-xs sm:text-sm">{hunt.rawXp}</span>
                </div>

                <div className="bg-black/60 p-2 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Lucro Estimado:</span>
                  <span className="font-bold text-yellow-400 font-mono mt-0.5 text-xs sm:text-sm">{hunt.profit}</span>
                </div>
              </div>

              {/* Call to action no rodapé do card */}
              <div className="flex items-center justify-between text-[11px] font-bold text-yellow-400/80 group-hover:text-yellow-400 pt-1">
                <span className="flex items-center gap-1">
                  <Play size={12} /> Ver Guia Tático & Vídeo
                </span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>

            </div>
          );
        })}
      </div>

      {filteredHunts.length === 0 && (
        <div className="bg-black/60 border border-tibia-border rounded-2xl p-12 text-center flex flex-col items-center gap-3">
          <AlertTriangle size={36} className="text-yellow-400" />
          <h3 className="text-lg font-bold text-gray-200">Nenhum respawn encontrado com esses filtros</h3>
          <p className="text-xs text-gray-400 max-w-md">
            Tente remover alguns filtros de vocação, nível ou busca para ver mais opções da base de dados.
          </p>
          <button
            onClick={() => {
              setSelectedVoc('ALL');
              setLevelRange('all');
              setHuntMode('ALL');
              setCategoryFilter('ALL');
              setElementFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded-xl text-xs font-bold transition-all"
          >
            Limpar Todos os Filtros
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TÁTICO COMPLETO DA HUNT COM YOUTUBE E DETALHES META                   */}
      {/* ========================================================================= */}
      {selectedHunt && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div 
            className="bg-gradient-to-b from-gray-950 via-black to-black border-2 border-yellow-500/60 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fade-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header do Modal */}
            <div className="relative p-5 sm:p-6 border-b border-tibia-border bg-gradient-to-r from-yellow-950/40 via-black to-black flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-bold rounded-lg uppercase">
                    Level {selectedHunt.recommendedLevel}+
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-lg uppercase">
                    {selectedHunt.modes.join(' / ')}
                  </span>
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10" title={`Perigo ${selectedHunt.danger}/5`}>
                    <span className="text-[10px] text-gray-400 font-bold mr-1">Risco:</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skull 
                        key={i} 
                        size={12} 
                        className={i < selectedHunt.danger ? 'text-red-500' : 'text-gray-700'} 
                      />
                    ))}
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-medieval text-gradient-gold">
                  {selectedHunt.name}
                </h2>
                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                  <MapPin size={13} className="text-red-400" /> 
                  <strong className="text-gray-200">{selectedHunt.city}</strong>
                  <span>•</span>
                  <span>Vocações recomendadas: {selectedHunt.vocations.join(', ')}</span>
                </p>
              </div>

              {/* Botões do topo: Copiar Link e Fechar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShareLink}
                  title="Copiar Link da Hunt"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-yellow-400 transition-all flex items-center gap-1 text-xs cursor-pointer"
                >
                  {copiedLink ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  <span className="hidden sm:inline">{copiedLink ? 'Copiado!' : 'Compartilhar'}</span>
                </button>

                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Faixa de Resumo Rápido de Números */}
            <div className="bg-black/90 border-b border-tibia-border/60 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">XP Média / Hora:</span>
                <span className="font-bold text-green-400 font-mono text-sm">{selectedHunt.rawXp}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Lucro Médio / Hora:</span>
                <span className="font-bold text-yellow-400 font-mono text-sm">{selectedHunt.profit}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Level Mínimo:</span>
                <span className="font-bold text-gray-200 font-mono text-sm">{selectedHunt.minLevel}+</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Meta Tier:</span>
                <span className="font-bold text-purple-400 font-mono text-sm">{selectedHunt.tier || 'Meta'}</span>
              </div>
            </div>

            {/* Navegação de Abas do Modal */}
            <div className="bg-black/80 px-6 pt-3 flex border-b border-tibia-border gap-2 overflow-x-auto">
              <button
                onClick={() => setModalTab('video')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x cursor-pointer ${
                  modalTab === 'video'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Video size={14} className={modalTab === 'video' ? 'text-yellow-400' : ''} />
                Vídeo & Puxada
              </button>

              <button
                onClick={() => setModalTab('protection')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x cursor-pointer ${
                  modalTab === 'protection'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Shield size={14} className={modalTab === 'protection' ? 'text-yellow-400' : ''} />
                Proteções & Imbuements
              </button>

              <button
                onClick={() => setModalTab('charms')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x cursor-pointer ${
                  modalTab === 'charms'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Sparkles size={14} className={modalTab === 'charms' ? 'text-yellow-400' : ''} />
                Best Charms & Monstros
              </button>

              <button
                onClick={() => setModalTab('roles')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x cursor-pointer ${
                  modalTab === 'roles'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Users size={14} className={modalTab === 'roles' ? 'text-yellow-400' : ''} />
                Funções da Party (EK/ED/MS/RP)
              </button>
            </div>

            {/* Conteúdo Dinâmico das Abas */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              
              {/* ABA 1: VÍDEO & PUXADA */}
              {modalTab === 'video' && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  
                  {/* Player do YouTube */}
                  {selectedHunt.youtubeId ? (
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full overflow-hidden rounded-2xl border border-yellow-500/30 bg-black aspect-video shadow-2xl">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${selectedHunt.youtubeId}?rel=0`}
                          title={selectedHunt.youtubeTitle || selectedHunt.name}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                        <span className="font-semibold text-gray-300">{selectedHunt.youtubeTitle}</span>
                        <a
                          href={`https://www.youtube.com/watch?v=${selectedHunt.youtubeId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink size={12} /> Abrir no YouTube
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/60 border border-yellow-500/30 rounded-2xl p-6 text-center flex flex-col items-center gap-3">
                      <Video size={32} className="text-yellow-400" />
                      <p className="text-sm font-bold text-gray-200">Vídeo específico em renderização</p>
                      <a
                        href={`https://www.youtube.com/results?search_query=tibia+hunt+${encodeURIComponent(selectedHunt.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <ExternalLink size={13} /> Pesquisar Vídeos desta Hunt no YouTube
                      </a>
                    </div>
                  )}

                  {/* Dica de Puxada & Rotação */}
                  <div className="bg-black/70 border border-tibia-border rounded-2xl p-4 flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                      <Compass size={14} /> Estratégia de Puxada & Rotação (Pull Mechanics)
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {selectedHunt.pullStrategy}
                    </p>
                  </div>

                  {/* Fallback Search Button */}
                  <div className="flex justify-end">
                    <a
                      href={`https://www.youtube.com/results?search_query=tibia+hunt+${encodeURIComponent(selectedHunt.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-yellow-400/80 hover:text-yellow-300 flex items-center gap-1.5 underline decoration-yellow-500/50"
                    >
                      <Search size={12} /> Ver mais vídeos e POVs (Knight, Paladin, Mage) no YouTube
                    </a>
                  </div>

                </div>
              )}

              {/* ABA 2: PROTEÇÕES & IMBUEMENTS */}
              {modalTab === 'protection' && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  
                  {/* Prioridades Elementais */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                      <Shield size={14} /> Resistências Elementais Recomendadas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedHunt.protectionPriorities?.map((p, idx) => (
                        <div key={idx} className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-200">{p.element}</span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">{p.percent}</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: p.percent }} />
                          </div>
                          <span className="text-[11px] text-gray-400 mt-1">{p.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Imbuements por Equipamento */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                      <Sparkles size={14} /> Imbuements Recomendados (Tier 3 Powerful)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">⚔️ Arma / Weapon:</span>
                        <span className="text-yellow-300 font-semibold">{selectedHunt.imbuements.weapon}</span>
                      </div>
                      <div className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">🛡️ Armadura / Armor:</span>
                        <span className="text-yellow-300 font-semibold">{selectedHunt.imbuements.armor}</span>
                      </div>
                      <div className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">👑 Elmo / Helmet:</span>
                        <span className="text-yellow-300 font-semibold">{selectedHunt.imbuements.helmet}</span>
                      </div>
                      <div className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">🛡️ Escudo / Shield / Quiver:</span>
                        <span className="text-yellow-300 font-semibold">{selectedHunt.imbuements.shield}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ABA 3: BEST CHARMS & MONSTROS */}
              {modalTab === 'charms' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                    <Sparkles size={14} /> Charms Ideais por Monstro & Fraquezas
                  </h4>
                  <div className="flex flex-col gap-3">
                    {selectedHunt.charms?.map((c, idx) => (
                      <div key={idx} className="bg-black/70 border border-tibia-border p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <h5 className="text-sm font-bold text-yellow-400">{c.monster}</h5>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Fraqueza Elemental: <strong className="text-emerald-400">{c.weakness}</strong>
                          </p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-xl text-right">
                          <span className="text-[10px] text-gray-400 uppercase block font-bold">Best Charm:</span>
                          <span className="text-xs font-bold text-yellow-300">{c.charm}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 4: FUNÇÕES DA PARTY */}
              {modalTab === 'roles' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                    <Users size={14} /> Posicionamento e Rotações de Cada Vocação
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    
                    <div className="bg-black/70 border border-red-500/30 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="font-bold text-red-400 flex items-center gap-1 text-sm">
                        🛡️ Elite Knight (EK)
                      </span>
                      <p className="text-gray-300 leading-relaxed">
                        {selectedHunt.roles?.ek || 'Foco em trapar o box e manter Exeta Res sincronizado no cooldown.'}
                      </p>
                    </div>

                    <div className="bg-black/70 border border-blue-500/30 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="font-bold text-blue-400 flex items-center gap-1 text-sm">
                        🌿 Elder Druid (ED)
                      </span>
                      <p className="text-gray-300 leading-relaxed">
                        {selectedHunt.roles?.ed || 'Sio no EK, Mass Healing com a party alinhada e suporte de gelo/terra.'}
                      </p>
                    </div>

                    <div className="bg-black/70 border border-purple-500/30 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="font-bold text-purple-400 flex items-center gap-1 text-sm">
                        ⚡ Master Sorcerer (MS)
                      </span>
                      <p className="text-gray-300 leading-relaxed">
                        {selectedHunt.roles?.ms || 'Debuff de Sap Strength, exposição de dano e rotação de waves elementais.'}
                      </p>
                    </div>

                    <div className="bg-black/70 border border-emerald-500/30 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="font-bold text-emerald-400 flex items-center gap-1 text-sm">
                        🏹 Royal Paladin (RP)
                      </span>
                      <p className="text-gray-300 leading-relaxed">
                        {selectedHunt.roles?.rp || 'Diamond Arrows contínuas, Mas San sincronizado e off-tanking de criaturas soltas.'}
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-tibia-border bg-black/95 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <span className="text-gray-400 text-center sm:text-left">
                💡 Dica RubinOT: Lembre-se de verificar se o respawn possui leilão ou claim ativo no servidor.
              </span>
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>

          </div>

        </div>,
        document.body
      )}

      {/* Banner de Anúncios AdSense */}
      <AdBanner slot="hunt_finder_footer" format="horizontal" />
    </div>
  );
}
