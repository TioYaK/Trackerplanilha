import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Swords, Shield, Heart, Zap, Sparkles, Trophy, 
  ArrowRight, ArrowLeftRight, Share2, Search, Check, 
  AlertCircle, ExternalLink, Activity, Clock, Skull, User, Star, Crown 
} from 'lucide-react';
import AdBanner from '../components/AdBanner';
import { getPinnedPlayers, subscribeWatchlist } from '../lib/watchlistService';
import { toTibiaTitleCase } from '../lib/tibiaUtils';
import VersusCardShareModal from '../components/VersusCardShareModal';

// Cache em memória para troca rápida de rivais
const versusPlayerCache = new Map();

// Cálculo clássico de experiência de Tibia
const calculateTotalXp = (level) => {
  const lvl = Number(level) || 1;
  return Math.floor((50 / 3) * (Math.pow(lvl, 3) - 6 * Math.pow(lvl, 2) + 17 * lvl - 12));
};

// Estimativa de HP e Mana por Vocação e Level
const estimateVitals = (level, vocation) => {
  const lvl = Math.max(1, Number(level) || 1);
  const voc = (vocation || '').toLowerCase();

  let hp = 150;
  let mana = 50;
  let cap = 400;

  if (voc.includes('knight')) {
    hp += (lvl - 8) * 15;
    mana += (lvl - 8) * 5;
    cap += (lvl - 8) * 25;
  } else if (voc.includes('paladin')) {
    hp += (lvl - 8) * 10;
    mana += (lvl - 8) * 15;
    cap += (lvl - 8) * 20;
  } else if (voc.includes('sorcerer') || voc.includes('druid')) {
    hp += (lvl - 8) * 5;
    mana += (lvl - 8) * 30;
    cap += (lvl - 8) * 10;
  } else if (voc.includes('monk')) {
    hp += (lvl - 8) * 12;
    mana += (lvl - 8) * 12;
    cap += (lvl - 8) * 18;
  } else {
    hp += (lvl - 8) * 10;
    mana += (lvl - 8) * 10;
    cap += (lvl - 8) * 15;
  }

  const speed = 109 + lvl;
  return { 
    hp: Math.max(150, hp), 
    mana: Math.max(50, mana), 
    cap: Math.max(400, cap), 
    speed 
  };
};

const HOT_RIVALRIES = [
  { p1: 'Llendarius', p2: 'Leozera Ousado', label: 'Rivalidade de Warmode' },
  { p1: 'Creptomoedas', p2: 'Warrior Matthsz', label: 'Duelo de Titãs' },
  { p1: 'Gangandixavaa', p2: 'Cura Daboa', label: 'Conflito de Servidor' },
  { p1: 'Outro Patamar', p2: 'Gangandixavaa', label: 'Batalha de Vingança' }
];

export default function CharacterVersus({ initialP1, initialP2, onPlayerClick, onNavigate }) {
  // Inicialização com query params caso existam
  const getInitialNames = () => {
    if (typeof window === 'undefined') return { p1: initialP1 || 'Llendarius', p2: initialP2 || 'Leozera Ousado' };
    const params = new URLSearchParams(window.location.search);
    const q1 = params.get('p1') || initialP1 || 'Llendarius';
    const q2 = params.get('p2') || initialP2 || 'Leozera Ousado';
    return { p1: q1, p2: q2 };
  };

  const [player1Name, setPlayer1Name] = useState(() => getInitialNames().p1);
  const [player2Name, setPlayer2Name] = useState(() => getInitialNames().p2);

  const [p1Data, setP1Data] = useState(null);
  const [p2Data, setP2Data] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinnedPlayers, setPinnedPlayers] = useState(getPinnedPlayers);
  const [versusShareModalOpen, setVersusShareModalOpen] = useState(false);

  // Sugestões de autocomplete
  const [p1Query, setP1Query] = useState('');
  const [p2Query, setP2Query] = useState('');
  const [p1Suggestions, setP1Suggestions] = useState([]);
  const [p2Suggestions, setP2Suggestions] = useState([]);

  const [copied, setCopied] = useState(false);

  // Sincronização reativa da Watchlist
  useEffect(() => {
    setPinnedPlayers(getPinnedPlayers());
    const unsub = subscribeWatchlist((updatedList) => {
      setPinnedPlayers(updatedList);
    });
    return unsub;
  }, []);

  // Busca dados de um jogador com cache e consultas indexadas por B-Tree
  const fetchPlayerData = async (name) => {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const targetName = toTibiaTitleCase(cleanName);
    const cacheKey = targetName.toLowerCase();

    // Cache local de 60 segundos
    if (versusPlayerCache.has(cacheKey)) {
      const cached = versusPlayerCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
    }

    try {
      const [cStateRes, gMemRes, deathsRes, perkRes] = await Promise.all([
        supabase
          .from('current_character_state')
          .select('character_name, level, vocation, updated_at')
          .or(`character_name.eq.${targetName},character_name.ilike.${cleanName}`)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('guild_members')
          .select('name, level, vocation, is_online, guild_name')
          .or(`name.eq.${targetName},name.ilike.${cleanName}`)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('recent_deaths')
          .select('level, killed_by, death_time, is_hunted')
          .or(`character_name.eq.${targetName},character_name.ilike.${cleanName}`)
          .order('death_time', { ascending: false })
          .limit(30),
        supabase
          .from('guild_perk_members')
          .select('world')
          .or(`character_name.eq.${targetName},character_name.ilike.${cleanName}`)
          .limit(1)
          .maybeSingle()
      ]);

      const level = cStateRes.data?.level || gMemRes.data?.level || (deathsRes.data?.[0]?.level ? Number(deathsRes.data[0].level) : 500);
      const vocation = cStateRes.data?.vocation || gMemRes.data?.vocation || 'Desconhecida';
      const world = perkRes.data?.world || 'Auroria';
      const isOnline = Boolean(gMemRes.data?.is_online);
      const vitals = estimateVitals(level, vocation);
      const totalXp = calculateTotalXp(level);
      const deaths = deathsRes.data || [];

      const playerResult = {
        name: cStateRes.data?.character_name || gMemRes.data?.name || targetName,
        level,
        vocation,
        world,
        isOnline,
        vitals,
        totalXp,
        deaths,
        totalDeaths: deaths.length
      };

      versusPlayerCache.set(cacheKey, { timestamp: Date.now(), data: playerResult });
      return playerResult;
    } catch (e) {
      console.error('Erro ao buscar dados do jogador:', e);
      return null;
    }
  };

  // Carrega ambos os guerreiros
  const loadComparison = async (n1, n2) => {
    setLoading(true);
    const [d1, d2] = await Promise.all([fetchPlayerData(n1), fetchPlayerData(n2)]);
    setP1Data(d1);
    setP2Data(d2);
    setLoading(false);

    // Atualiza a URL sem recarregar
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('p1', n1);
      url.searchParams.set('p2', n2);
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    loadComparison(player1Name, player2Name);
  }, []);

  // Autocomplete P1 (Busca ampla em todos os 42.000+ personagens rastreados)
  useEffect(() => {
    if (!p1Query || p1Query.length < 2) {
      setP1Suggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data: charData } = await supabase
          .from('current_character_state')
          .select('character_name, level, vocation')
          .ilike('character_name', `%${p1Query}%`)
          .order('level', { ascending: false })
          .limit(6);

        if (charData && charData.length > 0) {
          setP1Suggestions(charData.map(c => ({
            name: c.character_name,
            level: c.level,
            vocation: c.vocation
          })));
        } else {
          const { data } = await supabase.from('guild_members').select('name, level, vocation').ilike('name', `%${p1Query}%`).limit(5);
          setP1Suggestions(data || []);
        }
      } catch (e) {
        setP1Suggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [p1Query]);

  // Autocomplete P2 (Busca ampla em todos os 42.000+ personagens rastreados)
  useEffect(() => {
    if (!p2Query || p2Query.length < 2) {
      setP2Suggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data: charData } = await supabase
          .from('current_character_state')
          .select('character_name, level, vocation')
          .ilike('character_name', `%${p2Query}%`)
          .order('level', { ascending: false })
          .limit(6);

        if (charData && charData.length > 0) {
          setP2Suggestions(charData.map(c => ({
            name: c.character_name,
            level: c.level,
            vocation: c.vocation
          })));
        } else {
          const { data } = await supabase.from('guild_members').select('name, level, vocation').ilike('name', `%${p2Query}%`).limit(5);
          setP2Suggestions(data || []);
        }
      } catch (e) {
        setP2Suggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [p2Query]);

  // Inverter posições
  const handleSwap = () => {
    const tempName = player1Name;
    const tempData = p1Data;
    setPlayer1Name(player2Name);
    setP1Data(p2Data);
    setPlayer2Name(tempName);
    setP2Data(tempData);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('p1', player2Name);
      url.searchParams.set('p2', tempName);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Confronto Direto (Head-to-Head)
  const headToHead = useMemo(() => {
    if (!p1Data || !p2Data) return { p1Kills: 0, p2Kills: 0, encounters: [] };

    const p1Deaths = p1Data.deaths || [];
    const p2Deaths = p2Data.deaths || [];

    // Mortes de P1 onde P2 foi o assassino (P2 pontuou)
    const p2KillsOnP1 = p1Deaths.filter(d => (d.killed_by || '').toLowerCase().includes(p2Data.name.toLowerCase()));

    // Mortes de P2 onde P1 foi o assassino (P1 pontuou)
    const p1KillsOnP2 = p2Deaths.filter(d => (d.killed_by || '').toLowerCase().includes(p1Data.name.toLowerCase()));

    const encounters = [
      ...p1KillsOnP2.map(e => ({ killer: p1Data.name, victim: p2Data.name, time: e.death_time, details: e.killed_by })),
      ...p2KillsOnP1.map(e => ({ killer: p2Data.name, victim: p1Data.name, time: e.death_time, details: e.killed_by }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    return {
      p1Kills: p1KillsOnP2.length,
      p2Kills: p2KillsOnP1.length,
      encounters
    };
  }, [p1Data, p2Data]);

  // Veredito de Combate
  const verdict = useMemo(() => {
    if (!p1Data || !p2Data) return null;

    let scoreP1 = (p1Data.level || 0) * 2 + (headToHead.p1Kills * 50) - (p1Data.totalDeaths * 5);
    let scoreP2 = (p2Data.level || 0) * 2 + (headToHead.p2Kills * 50) - (p2Data.totalDeaths * 5);

    let winner = 'Empate';
    let advPercent = 50;

    if (scoreP1 > scoreP2) {
      winner = p1Data.name;
      advPercent = Math.min(95, Math.round((scoreP1 / (scoreP1 + scoreP2)) * 100));
    } else if (scoreP2 > scoreP1) {
      winner = p2Data.name;
      advPercent = Math.min(95, Math.round((scoreP2 / (scoreP1 + scoreP2)) * 100));
    }

    const xpDiff = Math.abs(p1Data.totalXp - p2Data.totalXp);
    const levelDiff = Math.abs(p1Data.level - p2Data.level);

    return {
      winner,
      advPercent,
      xpDiff,
      levelDiff,
      leader: p1Data.level >= p2Data.level ? p1Data.name : p2Data.name
    };
  }, [p1Data, p2Data, headToHead]);

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-6xl mx-auto text-gray-200 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-tibia-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Swords size={14} className="animate-pulse" /> Simulador de Duelo & Comparativo
          </div>
          <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold drop-shadow-md">
            Comparador <span className="text-red-500 font-sans font-black">Versus ⚔️</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Compare atributos, diferença de experiência, histórico de combate e o confronto direto entre dois guerreiros.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          {/* Botão de Card Visual de Duelo */}
          <button
            onClick={() => setVersusShareModalOpen(true)}
            disabled={!p1Data || !p2Data}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-amber-600 to-yellow-600 hover:from-red-500 hover:to-yellow-500 text-white transition-all shadow-md shadow-red-500/20 hover:scale-105 cursor-pointer disabled:opacity-50"
            title="Gerar Card Visual para Discord / Redes Sociais"
          >
            <Swords size={14} />
            <span>Gerar Card de Duelo 📸</span>
          </button>

          {/* Botão de Compartilhar Link */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-black/60 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all shadow-md cursor-pointer"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
            <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>
        </div>
      </div>

      {/* Jogadores Fixados da Watchlist para Seleção Rápida */}
      {pinnedPlayers.length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1 font-mono">
            <Star size={12} className="fill-amber-400 text-amber-400" /> Seus Fixados:
          </span>
          {pinnedPlayers.map(p => (
            <div key={p.name} className="inline-flex items-center rounded-lg bg-black/60 border border-amber-500/30 overflow-hidden shrink-0 text-xs shadow-sm">
              <span className="px-2.5 py-1 text-gray-200 font-bold font-medieval">{p.name}</span>
              <button
                onClick={() => {
                  setPlayer1Name(p.name);
                  loadComparison(p.name, player2Name);
                }}
                className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-mono text-[10px] font-bold border-l border-white/10 transition-colors cursor-pointer"
                title="Colocar no Guerreiro 1 (Lado Azul)"
              >
                P1
              </button>
              <button
                onClick={() => {
                  setPlayer2Name(p.name);
                  loadComparison(player1Name, p.name);
                }}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 font-mono text-[10px] font-bold border-l border-white/10 transition-colors cursor-pointer"
                title="Colocar no Guerreiro 2 (Lado Vermelho)"
              >
                P2
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sugestões de Rivalidades */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1 font-mono">
          <Sparkles size={12} className="text-yellow-400" /> Rivalidades Quentes:
        </span>
        {HOT_RIVALRIES.map((r, i) => (
          <button
            key={i}
            onClick={() => {
              setPlayer1Name(r.p1);
              setPlayer2Name(r.p2);
              loadComparison(r.p1, r.p2);
            }}
            className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500/40 text-xs text-gray-300 hover:text-yellow-300 transition-all shrink-0 cursor-pointer"
          >
            ⚔️ {r.p1} vs {r.p2}
          </button>
        ))}
      </div>

      {/* Seletores dos Jogadores (Slots de Duelo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative mb-8">
        
        {/* Slot Guerreiro 1 (Azul/Dourado) */}
        <div className={`p-4 sm:p-5 rounded-2xl bg-tibia-card border-2 transition-all relative ${
          verdict?.winner === p1Data?.name ? 'border-yellow-500 shadow-yellow-500/10 shadow-xl' : 'border-yellow-500/40 shadow-xl'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-yellow-400 font-mono flex items-center gap-1.5">
              <span>Guerreiro 1 (Lado Dourado)</span>
              {p1Data?.isOnline && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online" />
              )}
            </div>
            {verdict?.winner === p1Data?.name && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                <Crown size={12} className="text-yellow-400" /> Favorito ({verdict.advPercent}%)
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={p1Query !== '' ? p1Query : player1Name}
              onChange={(e) => setP1Query(e.target.value)}
              placeholder="Digite o nome do jogador 1..."
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-20 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 font-medieval font-bold"
            />
            {p1Query && (
              <button
                onClick={() => {
                  setPlayer1Name(p1Query);
                  setP1Query('');
                  loadComparison(p1Query, player2Name);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-yellow-500 text-black font-bold text-xs cursor-pointer hover:bg-yellow-400 transition-colors"
              >
                Buscar
              </button>
            )}

            {/* Dropdown de sugestões P1 */}
            {p1Suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-black/95 border border-yellow-500/40 rounded-xl shadow-2xl z-30 p-1 space-y-1">
                {p1Suggestions.map(s => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setPlayer1Name(s.name);
                      setP1Query('');
                      setP1Suggestions([]);
                      loadComparison(s.name, player2Name);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-yellow-500/20 text-left text-xs cursor-pointer"
                  >
                    <span className="font-medieval font-bold text-white">{s.name}</span>
                    <span className="text-gray-400 font-mono">{s.vocation} • Lvl {s.level}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botão Central de Inversão (⇄) */}
        <button
          onClick={handleSwap}
          className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black border-2 border-yellow-500 items-center justify-center text-yellow-400 hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer"
          title="Inverter Jogadores"
        >
          <ArrowLeftRight size={18} />
        </button>

        {/* Slot Guerreiro 2 (Vermelho) */}
        <div className={`p-4 sm:p-5 rounded-2xl bg-tibia-card border-2 transition-all relative ${
          verdict?.winner === p2Data?.name ? 'border-red-500 shadow-red-500/10 shadow-xl' : 'border-red-500/40 shadow-xl'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-red-400 font-mono flex items-center gap-1.5">
              <span>Guerreiro 2 (Lado Vermelho)</span>
              {p2Data?.isOnline && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online" />
              )}
            </div>
            {verdict?.winner === p2Data?.name && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                <Crown size={12} className="text-red-400" /> Favorito ({verdict.advPercent}%)
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={p2Query !== '' ? p2Query : player2Name}
              onChange={(e) => setP2Query(e.target.value)}
              placeholder="Digite o nome do jogador 2..."
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-20 py-2.5 text-sm text-white focus:outline-none focus:border-red-400 font-medieval font-bold"
            />
            {p2Query && (
              <button
                onClick={() => {
                  setPlayer2Name(p2Query);
                  setP2Query('');
                  loadComparison(player1Name, p2Query);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-xs cursor-pointer hover:bg-red-500 transition-colors"
              >
                Buscar
              </button>
            )}

            {/* Dropdown de sugestões P2 */}
            {p2Suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-black/95 border border-red-500/40 rounded-xl shadow-2xl z-30 p-1 space-y-1">
                {p2Suggestions.map(s => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setPlayer2Name(s.name);
                      setP2Query('');
                      setP2Suggestions([]);
                      loadComparison(player1Name, s.name);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-red-950/40 text-left text-xs cursor-pointer"
                  >
                    <span className="font-medieval font-bold text-white">{s.name}</span>
                    <span className="text-gray-400 font-mono">{s.vocation} • Lvl {s.level}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* PLACAR DE CONFRONTO DIRETO (HEAD-TO-HEAD) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-red-950/40 via-black to-black border-2 border-red-500/40 shadow-2xl mb-8 text-center relative overflow-hidden">
        <div className="text-[11px] uppercase font-bold tracking-widest text-yellow-500/80 font-mono mb-2">
          ⚔️ Placar de Confronto Direto (Histórico Head-to-Head)
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-12 my-4">
          <div className="text-center">
            <div className="text-4xl sm:text-6xl font-medieval font-black text-yellow-400">
              {headToHead.p1Kills}
            </div>
            <div className="font-medieval text-sm sm:text-base font-bold text-white mt-1">
              {p1Data?.name || player1Name}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-red-900/60 border border-red-500/50 flex items-center justify-center text-white font-medieval font-black text-lg shadow-lg">
              VS
            </div>
            <span className="text-[10px] text-gray-400 font-mono mt-1">FRAGS</span>
          </div>

          <div className="text-center">
            <div className="text-4xl sm:text-6xl font-medieval font-black text-red-400">
              {headToHead.p2Kills}
            </div>
            <div className="font-medieval text-sm sm:text-base font-bold text-white mt-1">
              {p2Data?.name || player2Name}
            </div>
          </div>
        </div>

        {/* Registro dos Abates Diretos */}
        {headToHead.encounters.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-white/10 max-w-xl mx-auto space-y-2">
            <div className="text-xs text-gray-400 font-medieval font-bold mb-2">
              Detalhes das Batalhas Diretas:
            </div>
            {headToHead.encounters.map((enc, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-black/60 border border-white/5 flex items-center justify-between text-xs">
                <span className="font-medieval font-bold text-yellow-400">
                  ⚔️ {enc.killer} <span className="text-gray-400 font-sans font-normal">abateu</span> {enc.victim}
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  {new Date(enc.time).toLocaleDateString('pt-BR')} às {new Date(enc.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mt-2 font-sans">
            Nenhum frag direto registrado entre esses dois guerreiros nos últimos ciclos.
          </div>
        )}
      </div>

      {/* MATRIZ COMPARATIVA DE ATRIBUTOS */}
      {p1Data && p2Data && (
        <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 mb-8">
          <h3 className="text-xl font-medieval font-bold text-yellow-400 border-b border-white/10 pb-3 flex items-center gap-2">
            <Trophy size={20} /> Comparativo de Poder & Sobrevivência
          </h3>

          {/* Linha 1: Nível & Barra de Vantagem */}
          <div>
            <div className="flex justify-between items-center text-sm font-medieval font-bold mb-1">
              <span className="text-yellow-400">{p1Data.name} • Lvl {p1Data.level}</span>
              <span className="text-gray-400 font-sans text-xs">
                Diferença: {verdict.levelDiff} Níveis ({verdict.leader} na frente)
              </span>
              <span className="text-red-400">{p2Data.name} • Lvl {p2Data.level}</span>
            </div>
            <div className="w-full h-3 bg-black/80 rounded-full overflow-hidden flex border border-white/10">
              <div 
                className="bg-yellow-500 h-full transition-all duration-500" 
                style={{ width: `${Math.round((p1Data.level / (p1Data.level + p2Data.level)) * 100)}%` }}
              />
              <div 
                className="bg-red-500 h-full transition-all duration-500" 
                style={{ width: `${Math.round((p2Data.level / (p1Data.level + p2Data.level)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Grid de Atributos Específicos com Barras Comparativas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            
            {/* HP Estimado */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center flex flex-col justify-between">
              <div>
                <Heart className="mx-auto text-red-400 mb-1" size={20} />
                <div className="text-xs text-gray-400">Vida Máxima (HP)</div>
                <div className="flex items-center justify-center gap-3 mt-1 font-mono font-bold">
                  <span className="text-yellow-400">{p1Data.vitals.hp.toLocaleString('pt-BR')}</span>
                  <span className="text-gray-600">vs</span>
                  <span className="text-red-400">{p2Data.vitals.hp.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden flex border border-white/5 mt-3">
                <div 
                  className="bg-yellow-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round((p1Data.vitals.hp / ((p1Data.vitals.hp + p2Data.vitals.hp) || 1)) * 100)}%` }}
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round((p2Data.vitals.hp / ((p1Data.vitals.hp + p2Data.vitals.hp) || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Mana Estimada */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center flex flex-col justify-between">
              <div>
                <Zap className="mx-auto text-blue-400 mb-1" size={20} />
                <div className="text-xs text-gray-400">Mana Máxima (MP)</div>
                <div className="flex items-center justify-center gap-3 mt-1 font-mono font-bold">
                  <span className="text-yellow-400">{p1Data.vitals.mana.toLocaleString('pt-BR')}</span>
                  <span className="text-gray-600">vs</span>
                  <span className="text-red-400">{p2Data.vitals.mana.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden flex border border-white/5 mt-3">
                <div 
                  className="bg-yellow-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round((p1Data.vitals.mana / ((p1Data.vitals.mana + p2Data.vitals.mana) || 1)) * 100)}%` }}
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round((p2Data.vitals.mana / ((p1Data.vitals.mana + p2Data.vitals.mana) || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Velocidade Base */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center flex flex-col justify-between">
              <div>
                <Activity className="mx-auto text-green-400 mb-1" size={20} />
                <div className="text-xs text-gray-400">Velocidade (Speed)</div>
                <div className="flex items-center justify-center gap-3 mt-1 font-mono font-bold">
                  <span className="text-yellow-400">{p1Data.vitals.speed}</span>
                  <span className="text-gray-600">vs</span>
                  <span className="text-red-400">{p2Data.vitals.speed}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden flex border border-white/5 mt-3">
                <div 
                  className="bg-yellow-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round((p1Data.vitals.speed / ((p1Data.vitals.speed + p2Data.vitals.speed) || 1)) * 100)}%` }}
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round((p2Data.vitals.speed / ((p1Data.vitals.speed + p2Data.vitals.speed) || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Total de Mortes Registradas */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center flex flex-col justify-between">
              <div>
                <Skull className="mx-auto text-purple-400 mb-1" size={20} />
                <div className="text-xs text-gray-400">Mortes Registradas</div>
                <div className="flex items-center justify-center gap-3 mt-1 font-mono font-bold">
                  <span className="text-yellow-400">{p1Data.totalDeaths}</span>
                  <span className="text-gray-600">vs</span>
                  <span className="text-red-400">{p2Data.totalDeaths}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden flex border border-white/5 mt-3">
                <div 
                  className="bg-yellow-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round((p1Data.totalDeaths / ((p1Data.totalDeaths + p2Data.totalDeaths) || 1)) * 100)}%` }}
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round((p2Data.totalDeaths / ((p1Data.totalDeaths + p2Data.totalDeaths) || 1)) * 100)}%` }}
                />
              </div>
            </div>

          </div>

          {/* Vocação e Mundo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-yellow-950/20 border border-yellow-500/30 flex justify-between items-center">
              <div>
                <strong className="text-yellow-400 font-medieval block text-sm">{p1Data.name}</strong>
                <span className="text-gray-300">{p1Data.vocation} • Servidor: {p1Data.world}</span>
              </div>
              <button
                onClick={() => onPlayerClick && onPlayerClick(p1Data.name)}
                className="px-3 py-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-yellow-300 cursor-pointer"
              >
                Ver Dossiê ↗
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 flex justify-between items-center">
              <div>
                <strong className="text-red-400 font-medieval block text-sm">{p2Data.name}</strong>
                <span className="text-gray-300">{p2Data.vocation} • Servidor: {p2Data.world}</span>
              </div>
              <button
                onClick={() => onPlayerClick && onPlayerClick(p2Data.name)}
                className="px-3 py-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-red-300 cursor-pointer"
              >
                Ver Dossiê ↗
              </button>
            </div>
          </div>

          {/* Veredito da Arena */}
          <div className="p-4 rounded-xl bg-black/60 border border-yellow-500/30 text-center">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-mono mb-1">
              🏆 Veredito dos Analistas de Combate
            </div>
            <div className="text-lg font-medieval font-bold text-white">
              Favorito na Arena: <span className="text-yellow-400">{verdict.winner}</span> ({verdict.advPercent}% de Vantagem)
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-lg mx-auto">
              Veredito computado com base na disparidade de nível ({verdict.levelDiff} leveis), histórico de confrontos diretos e índice de sobrevivência no banco de dados.
            </p>
          </div>

        </div>
      )}

      {/* Banner de Anúncio AdSense */}
      <div className="my-8">
        <AdBanner slot="versus-bottom" format="auto" />
      </div>

      {/* Modal de Compartilhamento de Card 1v1 */}
      {versusShareModalOpen && (
        <VersusCardShareModal
          p1Data={p1Data}
          p2Data={p2Data}
          headToHead={headToHead}
          diff={verdict}
          onClose={() => setVersusShareModalOpen(false)}
        />
      )}

    </div>
  );
}
