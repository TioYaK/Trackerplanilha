import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Flame, Crown, Globe, Search, RefreshCw, Users, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatVocation } from '../lib/tibiaUtils';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';

export default function Rankings({ isAdmin, onPlayerClick }) {
  const { activeWorld, setActiveWorld, worlds } = useWorld();
  const [selectedWorld, setSelectedWorld] = useState(activeWorld || 'ALL');

  const [topRushers, setTopRushers] = useState([]);
  const [topLevels, setTopLevels] = useState([]);
  const [topParty, setTopParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rushers'); // rushers, highscores, party
  const [vocationFilter, setVocationFilter] = useState('ALL'); // ALL, EK, RP, MS, ED
  const [searchTerm, setSearchTerm] = useState('');

  // Sincroniza se o activeWorld mudar externamente
  useEffect(() => {
    if (activeWorld) {
      setSelectedWorld(activeWorld);
    }
  }, [activeWorld]);

  const fetchData = async () => {
    setLoading(true);

    try {
      // 1. Top Rushers 24h
      const { data: rushersData } = await supabase
        .from('view_top_rushers_24h')
        .select('*')
        .gt('exp_gained', 0)
        .order('exp_gained', { ascending: false })
        .limit(60);

      // 2. Top Nível (Highscores)
      const { data: levelData } = await supabase
        .from('current_character_state')
        .select('character_name, level, vocation, xp_total')
        .gt('level', 0)
        .order('level', { ascending: false })
        .limit(100);

      // 3. PT de Elite (Maior XP Registrada no Dia)
      const { data: partiesDataXP } = await supabase
        .from('parties_planilhadas')
        .select('*');

      let bestParty = null;
      if (partiesDataXP && partiesDataXP.length > 0) {
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

      // 4. Cruzamento de Mundos e Dados de Personagens
      const allNames = new Set();
      (rushersData || []).forEach(r => r.name && allNames.add(r.name));
      (levelData || []).forEach(l => l.character_name && allNames.add(l.character_name));

      const namesArr = Array.from(allNames);
      const [{ data: statesData }, { data: perksData }] = await Promise.all([
        namesArr.length > 0
          ? supabase.from('current_character_state').select('character_name, level, vocation, xp_total').in('character_name', namesArr)
          : { data: [] },
        namesArr.length > 0
          ? supabase.from('guild_perk_members').select('character_name, world').in('character_name', namesArr)
          : { data: [] }
      ]);

      const stateMap = new Map((statesData || []).map(s => [s.character_name.toLowerCase(), s]));
      const perkMap = new Map((perksData || []).map(p => [p.character_name.toLowerCase(), p.world]));

      // Enriquecer Rushers
      const enrichedRushers = (rushersData || []).map(r => {
        const state = stateMap.get(r.name.toLowerCase());
        const world = perkMap.get(r.name.toLowerCase()) || 'Auroria';
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

      // Enriquecer Top Levels
      const enrichedLevels = (levelData || []).map(l => {
        const world = perkMap.get(l.character_name.toLowerCase()) || 'Auroria';
        return {
          name: l.character_name,
          level: Number(l.level) || 0,
          vocation: l.vocation || 'Desconhecido',
          xp_total: Number(l.xp_total) || 0,
          world
        };
      });
      setTopLevels(enrichedLevels);

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
          onClick={fetchData}
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
            <span className="text-xs text-gray-400">
              Servidor: <strong className="text-white">{selectedWorld === 'ALL' ? 'Todos os Mundos' : selectedWorld}</strong>
            </span>
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
                  filteredRushers.map((r, i) => (
                    <tr 
                      key={r.name}
                      onClick={() => onPlayerClick && onPlayerClick(r.name, r.world)}
                      className="hover:bg-amber-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-center">
                        {getRankBadge(i)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                  filteredLevels.map((p, i) => (
                    <tr 
                      key={p.name}
                      onClick={() => onPlayerClick && onPlayerClick(p.name, p.world)}
                      className="hover:bg-yellow-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-center">
                        {getRankBadge(i)}
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
                  ))
                )}
              </tbody>
            </table>
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
