import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Flame, Crown, Globe, Search, RefreshCw, Users, Sparkles, Shield, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatVocation } from '../lib/tibiaUtils';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';

// Cache em memória compartilhado (TTL 60s)
let rankingsCache = {
  timestamp: 0,
  data: null
};

// Termos de criaturas para filtrar em logs de PvP
const MONSTER_TERMS = [
  'golem', 'skeleton', 'dragon', 'demon', 'werelion', 'behemoth', 'hydra', 
  'cultist', 'spider', 'rat', 'orc', 'rotworm', 'bonelord', 'stalker',
  'ghost', 'vampire', 'witch', 'mummy', 'ghoul', 'slime', 'beholder',
  'cyclops', 'dwarf', 'elf', 'minotaur', 'wolf', 'bear', 'snake', 'crawler',
  'warrior', 'mage', 'sorcerer', 'priest', 'assassin', 'hunter', 'knight',
  'elemental', 'monstros', 'monster'
];

function isValidPlayerName(name) {
  if (!name || name.length < 2 || name.length > 29) return false;
  if (/^(a |an |the |field |fire |poison |energy |hazard )/i.test(name)) return false;
  const firstChar = name[0];
  if (firstChar !== firstChar.toUpperCase() || firstChar === firstChar.toLowerCase()) return false;
  const lower = name.toLowerCase();
  for (const term of MONSTER_TERMS) {
    if (lower === term || lower.includes(' ' + term) || lower.includes(term + ' ')) {
      return false;
    }
  }
  return true;
}

function extractPvPKiller(killedBy) {
  if (!killedBy || typeof killedBy !== 'string') return null;
  const str = killedBy.trim();
  const mostDamageMatch = str.match(/\(maior dano por\s+([^)]+)\)/i);
  if (mostDamageMatch) {
    const candidate = mostDamageMatch[1].trim();
    if (isValidPlayerName(candidate)) return candidate;
  }
  const clean = str.replace(/\s*\([^)]*\)/g, '').trim();
  const parts = clean.split(/\s*,\s*|\s+and\s+|\s+e\s+/i);
  for (const part of parts) {
    const trimmed = part.trim();
    if (isValidPlayerName(trimmed)) return trimmed;
  }
  return null;
}

export default function Rankings({ isAdmin, onPlayerClick, initialTab }) {
  const { activeWorld, setActiveWorld, worlds } = useWorld();
  const [selectedWorld, setSelectedWorld] = useState(activeWorld || 'ALL');

  const [topRushers, setTopRushers] = useState([]);
  const [topLevels, setTopLevels] = useState([]);
  const [topParty, setTopParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || 'rushers'); // rushers, highscores, party
  const [vocationFilter, setVocationFilter] = useState('ALL'); // ALL, EK, RP, MS, ED
  const [searchTerm, setSearchTerm] = useState('');
  const [padeiros, setPadeiros] = useState([]);
  const [topFraggers, setTopFraggers] = useState([]);
  const [imortais, setImortais] = useState([]);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWorld, searchTerm, vocationFilter, activeTab, pageSize]);

  // Sincroniza se o activeWorld mudar externamente
  useEffect(() => {
    if (activeWorld) {
      setSelectedWorld(activeWorld);
    }
  }, [activeWorld]);

  const fetchData = async (forceRefresh = false) => {
    // 0. Cache em memória instantâneo se dados tiverem menos de 60 segundos
    if (!forceRefresh && rankingsCache.data && (Date.now() - rankingsCache.timestamp < 60000)) {
      setTopRushers(rankingsCache.data.topRushers);
      setTopLevels(rankingsCache.data.topLevels);
      setTopParty(rankingsCache.data.topParty);
      setPadeiros(rankingsCache.data.padeiros);
      setTopFraggers(rankingsCache.data.topFraggers);
      setImortais(rankingsCache.data.imortais);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // 1. Consultas principais paralelas de alta velocidade
      const [rushersRes, levelsRes, partiesRes, deathsRes] = await Promise.all([
        supabase
          .from('view_top_rushers_24h')
          .select('*')
          .gt('exp_gained', 0)
          .order('exp_gained', { ascending: false })
          .limit(350),
        supabase
          .from('current_character_state')
          .select('character_name, level, vocation, xp_total')
          .gt('level', 0)
          .order('level', { ascending: false })
          .limit(350),
        supabase
          .from('parties_planilhadas')
          .select('*')
          .limit(25),
        supabase
          .from('recent_deaths')
          .select('character_name, killed_by, level, death_time')
          .order('death_time', { ascending: false })
          .limit(250)
      ]);

      const rushersData = rushersRes.data || [];
      const levelData = levelsRes.data || [];
      const partiesDataXP = partiesRes.data || [];
      const deathsData = deathsRes.data || [];

      // 2. PT de Elite (Maior XP Registrada no Dia)
      let bestParty = null;
      if (partiesDataXP.length > 0) {
        let maxXP = -1;
        partiesDataXP.forEach(p => {
          let numericXp = 0;
          if (p.delta_xp && typeof p.delta_xp === 'string') {
            if (p.delta_xp.toUpperCase().endsWith('M')) numericXp = parseFloat(p.delta_xp) * 1000000;
            else if (p.delta_xp.toUpperCase().endsWith('K')) numericXp = parseFloat(p.delta_xp) * 1000;
            else numericXp = parseInt(p.delta_xp, 10) || 0;
          } else {
            numericXp = parseInt(p.delta_xp, 10) || 0;
          }
          if (numericXp > maxXP) {
            maxXP = numericXp;
            bestParty = { ...p, numericXp };
          }
        });
      }
      setTopParty(bestParty);

      // 3. Salão da Fama: Padeiros, Top Fraggers PvP e Imortais
      const deathCounts = {};
      const pvpKillerCounts = {};
      const deadSet = new Set();

      deathsData.forEach(d => {
        if (d.character_name) {
          deadSet.add(d.character_name.toLowerCase());
          deathCounts[d.character_name] = (deathCounts[d.character_name] || 0) + 1;
        }
        const killer = extractPvPKiller(d.killed_by);
        if (killer) {
          pvpKillerCounts[killer] = (pvpKillerCounts[killer] || 0) + 1;
        }
      });

      const sortedPadeiros = Object.entries(deathCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setPadeiros(sortedPadeiros);

      const sortedFraggers = Object.entries(pvpKillerCounts)
        .map(([name, kills]) => ({ name, kills }))
        .sort((a, b) => b.kills - a.kills)
        .slice(0, 10);
      setTopFraggers(sortedFraggers);

      const aliveRushers = rushersData
        .filter(r => r.name && !deadSet.has(r.name.toLowerCase()) && r.exp_gained > 0)
        .slice(0, 10);
      setImortais(aliveRushers);

      // 4. Enriquecimento de Dados em Poucos Lotes Otimizados (máx 2 batches de 200)
      const rusherNames = rushersData.map(r => r.name).filter(Boolean);
      const levelNames = levelData.map(l => l.character_name).filter(Boolean);
      const allUniqueNames = Array.from(new Set([...rusherNames, ...levelNames]));

      const chunkArray = (arr, size) => {
        const res = [];
        for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
        return res;
      };

      const rusherChunks = chunkArray(rusherNames, 200);
      const perkChunks = chunkArray(allUniqueNames, 200);

      const [statesResList, perksResList] = await Promise.all([
        rusherChunks.length > 0
          ? Promise.all(
              rusherChunks.map(chunk =>
                supabase
                  .from('current_character_state')
                  .select('character_name, level, vocation')
                  .in('character_name', chunk)
                  .then(res => res.data || [])
              )
            )
          : Promise.resolve([[]]),
        perkChunks.length > 0
          ? Promise.all(
              perkChunks.map(chunk =>
                supabase
                  .from('guild_perk_members')
                  .select('character_name, world')
                  .in('character_name', chunk)
                  .then(res => res.data || [])
              )
            )
          : Promise.resolve([[]])
      ]);

      const stateMap = new Map(statesResList.flat().map(s => [(s.character_name || '').toLowerCase(), s]));
      const perkMap = new Map(perksResList.flat().map(p => [(p.character_name || '').toLowerCase(), p.world]));

      // Enriquecer Rushers
      const enrichedRushers = rushersData.map(r => {
        const state = stateMap.get((r.name || '').toLowerCase());
        const world = perkMap.get((r.name || '').toLowerCase()) || 'Auroria';
        return {
          name: r.name,
          exp_gained: Number(r.exp_gained) || 0,
          current_exp: Number(r.current_exp) || 0,
          level: state?.level || null,
          vocation: state?.vocation || null,
          world
        };
      });
      setTopRushers(enrichedRushers);

      // Enriquecer Top Levels (já possui level, vocação e xp_total da tabela current_character_state!)
      const enrichedLevels = levelData.map(l => {
        const world = perkMap.get((l.character_name || '').toLowerCase()) || 'Auroria';
        return {
          name: l.character_name,
          level: Number(l.level) || 0,
          vocation: l.vocation || 'Desconhecido',
          xp_total: Number(l.xp_total) || 0,
          world
        };
      });
      setTopLevels(enrichedLevels);

      // Grava no cache de 60 segundos
      rankingsCache = {
        timestamp: Date.now(),
        data: {
          topRushers: enrichedRushers,
          topLevels: enrichedLevels,
          topParty: bestParty,
          padeiros: sortedPadeiros,
          topFraggers: sortedFraggers,
          imortais: aliveRushers
        }
      };

    } catch (err) {
      console.error('Erro ao carregar rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatXP = (xp) => {
    const val = Number(xp) || 0;
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + 'B';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toLocaleString();
  };

  // Filtragem por Mundo e Busca
  const filteredRushers = useMemo(() => {
    return topRushers.filter(r => {
      const matchWorld = selectedWorld === 'ALL' || (r.world || '').toLowerCase() === selectedWorld.toLowerCase();
      const matchSearch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchWorld && matchSearch;
    });
  }, [topRushers, selectedWorld, searchTerm]);

  const filteredLevels = useMemo(() => {
    return topLevels.filter(l => {
      const matchWorld = selectedWorld === 'ALL' || (l.world || '').toLowerCase() === selectedWorld.toLowerCase();
      const matchSearch = (l.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchVoc = true;
      if (vocationFilter !== 'ALL') {
        const voc = (l.vocation || '').toLowerCase();
        if (vocationFilter === 'EK') matchVoc = voc.includes('knight');
        else if (vocationFilter === 'RP') matchVoc = voc.includes('paladin');
        else if (vocationFilter === 'MS') matchVoc = voc.includes('sorcerer');
        else if (vocationFilter === 'ED') matchVoc = voc.includes('druid');
      }
      return matchWorld && matchSearch && matchVoc;
    });
  }, [topLevels, selectedWorld, searchTerm, vocationFilter]);

  const paginatedRushers = useMemo(() => {
    if (pageSize === 'ALL') return filteredRushers;
    const start = (currentPage - 1) * Number(pageSize);
    return filteredRushers.slice(start, start + Number(pageSize));
  }, [filteredRushers, currentPage, pageSize]);

  const totalRushersPages = useMemo(() => {
    if (pageSize === 'ALL') return 1;
    return Math.max(1, Math.ceil(filteredRushers.length / Number(pageSize)));
  }, [filteredRushers, pageSize]);

  const paginatedLevels = useMemo(() => {
    if (pageSize === 'ALL') return filteredLevels;
    const start = (currentPage - 1) * Number(pageSize);
    return filteredLevels.slice(start, start + Number(pageSize));
  }, [filteredLevels, currentPage, pageSize]);

  const totalLevelsPages = useMemo(() => {
    if (pageSize === 'ALL') return 1;
    return Math.max(1, Math.ceil(filteredLevels.length / Number(pageSize)));
  }, [filteredLevels, pageSize]);

  const handleWorldChange = (wId) => {
    setSelectedWorld(wId);
    if (setActiveWorld) setActiveWorld(wId);
  };

  const getRankBadge = (index) => {
    if (index === 0) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 text-black font-black flex items-center justify-center text-xs shadow-lg shadow-yellow-500/20">
          1º
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-500 text-black font-black flex items-center justify-center text-xs shadow-md">
          2º
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 text-white font-black flex items-center justify-center text-xs shadow-md">
          3º
        </span>
      );
    }
    return <span className="font-mono text-gray-500 font-bold text-sm pl-2">{index + 1}º</span>;
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-200">
      
      {/* Header do Hub */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-tibia-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold drop-shadow-md">
              Rankings & Highscores
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              Rubinot Oficial
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1 font-sans">
            Hall da Fama dos maiores guerreiros, ganhadores de experiência em 24h e esquadrões de elite em todos os servidores.
          </p>
        </div>

        <button 
          onClick={() => fetchData(true)}
          disabled={loading}
          className="glass-button text-tibia-highlight px-4 py-2 rounded-lg flex items-center font-bold text-sm self-stretch md:self-auto justify-center transition-all hover:border-yellow-500/50"
        >
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin text-yellow-400' : ''}`} />
          {loading ? 'Atualizando...' : 'Sincronizar'}
        </button>
      </div>

      {/* Seletor de Mundo e Filtros */}
      <div className="bg-black/60 border border-tibia-border rounded-xl p-4 mb-8 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          
          {/* Seletor de Servidor */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin scrollbar-thumb-gray-800">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Globe size={14} className="text-blue-400" /> Servidor:
            </span>
            <button
              onClick={() => handleWorldChange('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedWorld === 'ALL'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-tibia-glow font-black'
                  : 'bg-black/40 text-gray-300 hover:text-white hover:bg-white/5 border border-tibia-border/50'
              }`}
            >
              🌐 Todos os Mundos
            </button>
            {WORLDS_LIST.filter(w => w.id !== 'ALL').map(w => (
              <button
                key={w.id}
                onClick={() => handleWorldChange(w.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedWorld.toLowerCase() === w.id.toLowerCase()
                    ? 'bg-yellow-500 text-black shadow-tibia-glow font-black'
                    : 'bg-black/40 text-gray-300 hover:text-white hover:bg-white/5 border border-tibia-border/50'
                }`}
              >
                {w.icon} {w.name}
              </button>
            ))}
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Buscar personagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/80 border border-tibia-border text-white text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Abas Principais de Rankings */}
      <div className="flex border-b border-tibia-border mb-6 gap-2 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('rushers')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'rushers'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Flame size={18} className="text-amber-400" />
          Top Rushers (24h)
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
            {filteredRushers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('highscores')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'highscores'
              ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Crown size={18} className="text-yellow-400" />
          Highscores de Nível
          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-mono">
            {filteredLevels.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fame')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'fame'
              ? 'border-yellow-400 text-yellow-300 bg-yellow-500/10'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sparkles size={18} className="text-yellow-400" />
          👑 Salão da Fama
        </button>

        <button
          onClick={() => setActiveTab('party')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'party'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Trophy size={18} className="text-blue-400" />
          PT de Elite (Hunts)
        </button>
      </div>

      {/* Conteúdo da Aba: Top Rushers 24h */}
      {activeTab === 'rushers' && (
        <div className="bg-tibia-card border border-tibia-border rounded-xl shadow-2xl overflow-hidden">
          <div className="p-4 bg-black/40 border-b border-tibia-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Flame className="text-amber-400" size={20} />
              <h3 className="font-bold text-white text-lg">Maiores Ganhos de Experiência (Últimas 24h)</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-gray-400">
                Servidor: <strong className="text-white">{selectedWorld === 'ALL' ? 'Todos os Mundos' : selectedWorld}</strong>
                {' '}(<strong className="text-amber-400 font-bold">{filteredRushers.length}</strong> encontrados)
              </span>
              <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-tibia-border/60 text-xs">
                <span className="text-gray-400 text-[11px] mr-1">Exibir:</span>
                {[25, 50, 100, 'ALL'].map(size => (
                  <button
                    key={size}
                    onClick={() => setPageSize(size)}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      pageSize === size ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {size === 'ALL' ? 'Todos' : size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-black/40 text-gray-400 uppercase text-xs font-semibold border-b border-tibia-border/50">
                <tr>
                  <th className="px-6 py-3.5 w-16 text-center">Rank</th>
                  <th className="px-6 py-3.5">Guerreiro</th>
                  <th className="px-6 py-3.5">Mundo</th>
                  <th className="px-6 py-3.5">Vocação & Nível</th>
                  <th className="px-6 py-3.5 text-right">XP Ganhos (24h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tibia-border/40 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Flame className="animate-pulse text-amber-400" size={28} />
                        Carregando líderes de rush...
                      </div>
                    </td>
                  </tr>
                ) : filteredRushers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500">
                      Nenhum ganho de experiência registrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedRushers.map((r, i) => {
                    const rankIdx = pageSize === 'ALL' ? i : (currentPage - 1) * Number(pageSize) + i;
                    return (
                    <tr 
                      key={r.name}
                      onClick={() => onPlayerClick && onPlayerClick(r.name, r.world)}
                      className="hover:bg-amber-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-center">
                        {getRankBadge(rankIdx)}
                      </td>
                      <td className="px-6 py-4 font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                        <span>{r.name}</span>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-stone-900 border border-stone-700 text-gray-300 px-2.5 py-1 rounded text-xs font-semibold">
                          {r.world}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {r.level ? (
                          <span className="text-xs">
                            <span className="text-blue-400 font-bold">Lvl {r.level}</span> • {formatVocation(r.vocation)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">Nível não registrado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-black text-green-400 bg-green-950/40 border border-green-700/40 px-3 py-1 rounded-lg">
                          +{formatXP(r.exp_gained)} XP
                        </span>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação Rushers */}
          {pageSize !== 'ALL' && totalRushersPages > 1 && (
            <div className="p-4 bg-black/40 border-t border-tibia-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
              <div>
                Exibindo <strong className="text-white">{(currentPage - 1) * Number(pageSize) + 1}</strong> a <strong className="text-white">{Math.min(currentPage * Number(pageSize), filteredRushers.length)}</strong> de <strong className="text-white">{filteredRushers.length}</strong> líderes de rush
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/80 border border-tibia-border text-gray-300 hover:text-white hover:border-amber-500/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <span className="px-3 py-1 bg-black/60 rounded border border-tibia-border font-bold text-amber-400">
                  Página {currentPage} de {totalRushersPages}
                </span>
                <button
                  disabled={currentPage >= totalRushersPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalRushersPages))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/80 border border-tibia-border text-gray-300 hover:text-white hover:border-amber-500/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  Próxima <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Highscores de Nível */}
      {activeTab === 'highscores' && (
        <div className="bg-tibia-card border border-tibia-border rounded-xl shadow-2xl overflow-hidden">
          <div className="p-4 bg-black/40 border-b border-tibia-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Crown className="text-yellow-400" size={20} />
              <h3 className="font-bold text-white text-lg">Top Níveis do Rubinot</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-tibia-border/60 text-xs">
                <span className="text-gray-400 text-[11px] mr-1">Exibir:</span>
                {[25, 50, 100, 'ALL'].map(size => (
                  <button
                    key={size}
                    onClick={() => setPageSize(size)}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      pageSize === size ? 'bg-yellow-500 text-black font-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {size === 'ALL' ? 'Todos' : size}
                  </button>
                ))}
              </div>
            {/* Filtro por Vocação */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-tibia-border/60">
              <button
                onClick={() => setVocationFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  vocationFilter === 'ALL' ? 'bg-yellow-500 text-black font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setVocationFilter('EK')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  vocationFilter === 'EK' ? 'bg-blue-600 text-white font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                EK
              </button>
              <button
                onClick={() => setVocationFilter('RP')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  vocationFilter === 'RP' ? 'bg-green-600 text-white font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                RP
              </button>
              <button
                onClick={() => setVocationFilter('MS')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  vocationFilter === 'MS' ? 'bg-purple-600 text-white font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                MS
              </button>
              <button
                onClick={() => setVocationFilter('ED')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  vocationFilter === 'ED' ? 'bg-teal-600 text-white font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                ED
              </button>
            </div>
          </div>
        </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-black/40 text-gray-400 uppercase text-xs font-semibold border-b border-tibia-border/50">
                <tr>
                  <th className="px-6 py-3.5 w-16 text-center">Rank</th>
                  <th className="px-6 py-3.5">Guerreiro</th>
                  <th className="px-6 py-3.5">Mundo</th>
                  <th className="px-6 py-3.5">Vocação</th>
                  <th className="px-6 py-3.5 text-center">Nível</th>
                  <th className="px-6 py-3.5 text-right">XP Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tibia-border/40 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Crown className="animate-pulse text-yellow-400" size={28} />
                        Carregando highscores de nível...
                      </div>
                    </td>
                  </tr>
                ) : filteredLevels.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      Nenhum personagem encontrado para esta vocação / mundo.
                    </td>
                  </tr>
                ) : (
                  paginatedLevels.map((p, i) => {
                    const rankIdx = pageSize === 'ALL' ? i : (currentPage - 1) * Number(pageSize) + i;
                    return (
                    <tr 
                      key={p.name}
                      onClick={() => onPlayerClick && onPlayerClick(p.name, p.world)}
                      className="hover:bg-yellow-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-center">
                        {getRankBadge(rankIdx)}
                      </td>
                      <td className="px-6 py-4 font-bold text-white group-hover:text-yellow-300 transition-colors flex items-center gap-2">
                        <span>{p.name}</span>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400" />
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-stone-900 border border-stone-700 text-gray-300 px-2.5 py-1 rounded text-xs font-semibold">
                          {p.world}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {formatVocation(p.vocation)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-base font-black text-yellow-400 bg-yellow-950/40 border border-yellow-700/40 px-3 py-1 rounded-lg">
                          Lvl {p.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-400">
                        {p.xp_total ? formatXP(p.xp_total) : '-'}
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação Highscores */}
          {pageSize !== 'ALL' && totalLevelsPages > 1 && (
            <div className="p-4 bg-black/40 border-t border-tibia-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
              <div>
                Exibindo <strong className="text-white">{(currentPage - 1) * Number(pageSize) + 1}</strong> a <strong className="text-white">{Math.min(currentPage * Number(pageSize), filteredLevels.length)}</strong> de <strong className="text-white">{filteredLevels.length}</strong> guerreiros
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/80 border border-tibia-border text-gray-300 hover:text-white hover:border-yellow-500/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <span className="px-3 py-1 bg-black/60 rounded border border-tibia-border font-bold text-yellow-400">
                  Página {currentPage} de {totalLevelsPages}
                </span>
                <button
                  disabled={currentPage >= totalLevelsPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalLevelsPages))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/80 border border-tibia-border text-gray-300 hover:text-white hover:border-yellow-500/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  Próxima <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Salão da Fama Rubinot 👑 */}
      {activeTab === 'fame' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. O IMORTAL */}
            <div className="bg-black/70 border-2 border-green-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-green-500/30 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="text-green-400" size={20} />
                    <h3 className="font-medieval text-green-400 text-base font-bold">🛡️ Os Imortais</h3>
                  </div>
                  <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded font-bold uppercase">Zero Mortes</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Guerreiros com maior ganho de experiência nas últimas 24h sem sofrer nenhuma baixa.
                </p>

                <div className="space-y-2">
                  {imortais.length === 0 ? (
                    <div className="text-xs text-gray-500 italic text-center py-6">
                      {loading ? 'Carregando guerreiros imortais...' : 'Nenhum guerreiro imortal recente'}
                    </div>
                  ) : (
                    imortais.slice(0, 5).map((p, idx) => (
                      <div 
                        key={idx}
                        onClick={() => onPlayerClick && onPlayerClick(p.name)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-green-500/20 hover:border-green-400 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold font-mono text-xs">#{idx + 1}</span>
                          <span className="text-xs font-bold text-white hover:text-green-300">{p.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-green-400">+{((p.exp_gained || 0) / 1000000).toFixed(1)}M XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 2. O PADEIRO DA SEMANA */}
            <div className="bg-black/70 border-2 border-red-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-red-500/30 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="text-red-400" size={20} />
                    <h3 className="font-medieval text-red-400 text-base font-bold">🥖 O Padeiro do Mês</h3>
                  </div>
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-bold uppercase">Mais Deitaram</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Os clientes fiéis do templo: quem mais distribuiu bênçãos e perdeu XP no servidor recentemente.
                </p>

                <div className="space-y-2">
                  {padeiros.length === 0 ? (
                    <div className="text-xs text-gray-500 italic text-center py-6">
                      {loading ? 'Carregando estatísticas do templo...' : 'Nenhum registro de mortes recente'}
                    </div>
                  ) : (
                    padeiros.slice(0, 5).map((p, idx) => (
                      <div 
                        key={idx}
                        onClick={() => onPlayerClick && onPlayerClick(p.name)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-red-500/20 hover:border-red-400 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 font-bold font-mono text-xs">#{idx + 1}</span>
                          <span className="text-xs font-bold text-white hover:text-red-300">{p.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-red-400">{p.count}x mortes</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 3. TOP FRAGGERS PVP */}
            <div className="bg-black/70 border-2 border-yellow-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-yellow-500/30 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Trophy className="text-yellow-400" size={20} />
                    <h3 className="font-medieval text-yellow-400 text-base font-bold">⚔️ Executores PvP</h3>
                  </div>
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded font-bold uppercase">Top Fraggers</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Os maiores assassinos e finalizadores em confrontos de Warmode e batalhas abertas.
                </p>

                <div className="space-y-2">
                  {topFraggers.length === 0 ? (
                    <div className="text-xs text-gray-500 italic text-center py-6">
                      {loading ? 'Carregando maiores matadores...' : 'Nenhum registro de frags PvP recente'}
                    </div>
                  ) : (
                    topFraggers.slice(0, 5).map((p, idx) => (
                      <div 
                        key={idx}
                        onClick={() => onPlayerClick && onPlayerClick(p.name)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-yellow-500/20 hover:border-yellow-400 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400 font-bold font-mono text-xs">#{idx + 1}</span>
                          <span className="text-xs font-bold text-white hover:text-yellow-300">{p.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-yellow-400">{p.kills} frags</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Conteúdo da Aba: PT de Elite */}
      {activeTab === 'party' && (
        <div className="bg-tibia-card border border-tibia-border rounded-xl shadow-xl overflow-hidden p-8 relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Trophy size={180} />
          </div>

          {!topParty ? (
            <div className="text-center text-gray-500 py-16">
              Nenhuma party registrou experiência de hunt hoje ainda.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
              <span className="bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 border border-blue-500/30 tracking-wider">
                🏆 Maior Eficiência de Hunt Registrada Hoje
              </span>
              <h4 className="text-4xl font-black text-white mb-2">{topParty.party_name}</h4>
              <p className="text-tibia-highlight font-medium mb-6 text-lg">
                📍 {topParty.respawn_category} — {topParty.hunt_name}
              </p>
              
              <div className="bg-black/60 p-6 rounded-xl border border-tibia-border w-full mb-6">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">XP Total Gerada pela Equipe</p>
                <p className="text-4xl font-black text-green-400">+{topParty.delta_xp}</p>
                {topParty.slot_start && topParty.slot_end && (
                  <p className="text-xs text-gray-500 mt-2">
                    Horário: {topParty.slot_start.slice(0, 5)} às {topParty.slot_end.slice(0, 5)}
                  </p>
                )}
              </div>
              
              <div className="w-full">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Integrantes do Esquadrão</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {topParty.members?.map(m => (
                    <button
                      key={m}
                      onClick={() => onPlayerClick && onPlayerClick(m)}
                      className="bg-stone-900 hover:bg-stone-800 border border-stone-700 px-4 py-2 rounded-lg text-sm text-gray-200 font-medium transition-colors hover:text-yellow-400 hover:border-yellow-500/50"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
