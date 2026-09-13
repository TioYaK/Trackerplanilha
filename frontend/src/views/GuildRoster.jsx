import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, UserCheck, UserMinus, Crosshair, Crown, Globe } from 'lucide-react';
import { formatVocation } from '../lib/tibiaUtils';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';

export default function GuildRoster({ onPlayerClick, isAdmin }) {
  const { activeWorld, setActiveWorld } = useWorld();
  const [selectedWorld, setSelectedWorld] = useState(activeWorld || 'ALL');

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, online, offline

  // Matchmaker
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [mmLevel, setMmLevel] = useState(1000);

  // Cadeira do Rei
  const [showHR, setShowHR] = useState(false);
  const [hrData, setHrData] = useState(null);
  const [avatarsMap, setAvatarsMap] = useState({});

  useEffect(() => {
    if (activeWorld) {
      setSelectedWorld(activeWorld);
    }
  }, [activeWorld]);

  const fetchMembers = async () => {
    setLoading(true);

    try {
      const fetchProfilesP = supabase
        .from('profiles')
        .select('main_character, avatar_url')
        .not('avatar_url', 'is', null);

      const fetchStatesP = async () => {
        let allStates = [];
        let page = 0;
        while (true) {
          const { data } = await supabase
            .from('current_character_state')
            .select('character_name, level, vocation, xp_total, session_start_xp')
            .range(page * 1000, (page + 1) * 1000 - 1);
          if (!data || data.length === 0) break;
          allStates.push(...data);
          if (data.length < 1000) break;
          page++;
        }
        return allStates;
      };

      let rosterMembers = [];

      if (selectedWorld === 'ALL' || selectedWorld.toLowerCase() === 'auroria') {
        let allData = [];
        let page = 0;
        const pageSize = 1000;
        while (true) {
          const { data, error } = await supabase
            .from('view_guild_roster')
            .select('*')
            .order('level', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
          if (error || !data || data.length === 0) break;
          allData.push(...data);
          if (data.length < pageSize) break;
          page++;
        }
        rosterMembers = allData.map(m => ({ ...m, world: 'Auroria' }));
      } else {
        const { data: perkMembers } = await supabase
          .from('guild_perk_members')
          .select('character_name, world')
          .ilike('world', selectedWorld)
          .limit(1000);

        rosterMembers = (perkMembers || []).map(p => ({
          name: p.character_name,
          world: p.world,
          rank: 'Membro',
          level: null,
          vocation: null,
          xp_gained_24h: 0,
          is_online: false
        }));
      }

      const [{ data: profs }, states] = await Promise.all([
        fetchProfilesP,
        fetchStatesP()
      ]);

      if (profs) {
        const map = {};
        profs.forEach(p => {
          if (p.main_character && p.avatar_url) {
            map[p.main_character.toLowerCase()] = p.avatar_url;
          }
        });
        setAvatarsMap(map);
      }

      const stateMap = new Map();
      if (states) {
        states.forEach(s => {
          if (!s || !s.character_name) return;
          stateMap.set(s.character_name.toLowerCase(), s);
        });
      }

      const mergedData = rosterMembers.map(m => {
        const s = m && m.name ? stateMap.get(m.name.toLowerCase()) : null;
        const activeXp = s ? Math.max(0, (s.xp_total || 0) - (s.session_start_xp || s.xp_total || 0)) : 0;
        const totalXp = (m.xp_gained_24h || 0) + activeXp;
        return {
          ...m,
          level: m.level || s?.level || 0,
          vocation: m.vocation || s?.vocation || 'Desconhecido',
          xp_gained_24h: totalXp
        };
      });

      // Ordena por Level decrescente
      mergedData.sort((a, b) => (b.level || 0) - (a.level || 0));

      setMembers(mergedData);
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedWorld]);

  const generateHR = async () => {
    setLoading(true);
    const scoredMembers = members.map(m => {
       const xpScore = Math.min(50, (m.xp_gained_24h || 0) / 10000000); // 1 pt por 10M, cap 50
       const onlineBonus = m.is_online ? 20 : 0;
       let score = 30 + xpScore + onlineBonus;
       if (score > 100) score = 100;
       if (score < 0) score = 0;
       return { ...m, score };
    });

    const toPromote = [...scoredMembers].filter(m => m.score >= 70).sort((a,b) => b.score - a.score).slice(0, 10);
    const toKick = [...scoredMembers].filter(m => m.score <= 30).sort((a,b) => a.score - b.score).slice(0, 10);
    
    setHrData({ toPromote, toKick });
    setShowHR(true);
    setLoading(false);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = (m.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      if (filter === 'online') return matchesSearch && m.is_online;
      if (filter === 'offline') return matchesSearch && !m.is_online;
      return matchesSearch;
    });
  }, [members, searchTerm, filter]);

  // Reset page when searching or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, selectedWorld]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const onlineCount = members.filter(m => m.is_online).length;

  const handleWorldChange = (wId) => {
    setSelectedWorld(wId);
    if (setActiveWorld) setActiveWorld(wId);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-tibia-border pb-6">
        <div>
          <h2 className="text-4xl font-medieval text-gradient-gold mb-1">
            Exército & Roster de Guerreiros
          </h2>
          <p className="text-gray-400 font-sans text-sm">
            {members.length} soldados catalogados • {onlineCount} online agora no servidor {selectedWorld === 'ALL' ? 'Global' : selectedWorld}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button 
              onClick={generateHR}
              className="glass-button text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10 px-4 py-2 rounded flex items-center gap-2 font-bold text-sm"
            >
              <Crown size={16} /> A Cadeira do Rei (RH)
            </button>
          )}

          <button 
            onClick={() => setShowMatchmaker(!showMatchmaker)}
            className="glass-button text-tibia-highlight px-4 py-2 rounded flex items-center gap-2 font-bold text-sm"
          >
            <Crosshair size={16} /> Matchmaker de Hunt
          </button>
        </div>
      </div>

      {/* Seletor de Servidor */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-gray-800 bg-black/40 p-3 rounded-xl border border-tibia-border">
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

      {/* Cadeira do Rei UI */}
      {showHR && hrData && (
        <div className="bg-yellow-950/10 border border-yellow-900/50 p-6 rounded-lg mb-8 shadow-xl animate-fade-in">
          <h3 className="text-xl font-bold text-yellow-500 mb-2 flex items-center">
            <Crown size={24} className="mr-2" />
            A Cadeira do Rei (RH Automático)
          </h3>
          <p className="text-sm text-gray-400 mb-6">Avaliação de performance dos membros. O robô calcula notas de 0 a 100 com base em ganho de XP e atividade online no servidor.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black/40 border border-green-900/50 p-4 rounded">
              <h4 className="text-green-500 font-bold mb-4 uppercase tracking-wider text-sm flex items-center justify-between">
                <span>📈 Merecem Promoção</span>
                <span className="text-xs text-gray-500 normal-case">Score {'>'} 70</span>
              </h4>
              <div className="space-y-2">
                {hrData.toPromote.map((m, i) => (
                  <div key={m.name} className="flex justify-between items-center bg-white/5 p-2 rounded">
                    <div>
                      <span className="font-bold text-white text-sm">{m.name}</span>
                      <p className="text-[10px] text-gray-400">Lvl {m.level} • {formatVocation(m.vocation)}</p>
                    </div>
                    <span className="text-green-400 font-mono font-bold">{Math.round(m.score)} pts</span>
                  </div>
                ))}
                {hrData.toPromote.length === 0 && <div className="text-gray-500 text-sm">Nenhum membro elegível ainda.</div>}
              </div>
            </div>
            
            <div className="bg-black/40 border border-red-900/50 p-4 rounded">
              <h4 className="text-red-500 font-bold mb-4 uppercase tracking-wider text-sm flex items-center justify-between">
                <span>📉 Baixa Atividade (Atenção)</span>
                <span className="text-xs text-gray-500 normal-case">Score {'<'} 30</span>
              </h4>
              <div className="space-y-2">
                {hrData.toKick.map((m, i) => (
                  <div key={m.name} className="flex justify-between items-center bg-white/5 p-2 rounded border-l-2 border-red-500">
                    <div>
                      <span className="font-bold text-white text-sm">{m.name}</span>
                      <p className="text-[10px] text-gray-400">Lvl {m.level} • {formatVocation(m.vocation)}</p>
                    </div>
                    <span className="text-red-500 font-mono font-bold">{Math.round(m.score)} pts</span>
                  </div>
                ))}
                {hrData.toKick.length === 0 && <div className="text-gray-500 text-sm">Nenhum membro inativo detectado!</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles de Filtro */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-tibia-card p-4 rounded-lg border border-tibia-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar jogador..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-tibia-bg border border-tibia-border rounded py-2 pl-10 pr-4 text-white focus:outline-none focus:border-tibia-primary text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded transition-colors text-sm ${filter === 'all' ? 'bg-tibia-primary text-black font-bold' : 'bg-tibia-bg text-gray-400 hover:text-white'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('online')}
            className={`px-4 py-2 rounded transition-colors text-sm ${filter === 'online' ? 'bg-green-600 text-white font-bold' : 'bg-tibia-bg text-gray-400 hover:text-white'}`}
          >
            Online
          </button>
          <button 
            onClick={() => setFilter('offline')}
            className={`px-4 py-2 rounded transition-colors text-sm ${filter === 'offline' ? 'bg-red-600 text-white font-bold' : 'bg-tibia-bg text-gray-400 hover:text-white'}`}
          >
            Offline
          </button>
        </div>
      </div>

      {/* Tabela de Membros */}
      <div className="bg-tibia-card border border-tibia-border rounded-lg overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-black/40 text-gray-400 uppercase font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Mundo</th>
                <th className="px-6 py-4">Vocação</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">XP Total Diária</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tibia-border/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tibia-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">Nenhum jogador encontrado com estes filtros.</td>
                </tr>
              ) : (
                currentItems.map(m => (
                  <tr key={m.name} className="hover:bg-white/5 transition-colors">
                    <td 
                      className="px-6 py-3 font-medium text-white cursor-pointer hover:text-tibia-primary hover:underline flex items-center gap-3"
                      onClick={() => onPlayerClick && onPlayerClick(m.name, m.world)}
                    >
                      {m.name && avatarsMap[m.name.toLowerCase()] ? (
                        <img 
                          src={avatarsMap[m.name.toLowerCase()]} 
                          alt={m.name}
                          className="w-7 h-7 rounded-full object-cover border border-tibia-highlight bg-black/60 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-yellow-900 border border-yellow-600 flex items-center justify-center text-[10px] font-bold text-yellow-500 shrink-0 shadow-inner">
                          {m.name ? m.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <span>{m.name}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="bg-stone-900 border border-stone-700 text-gray-300 px-2.5 py-1 rounded text-xs font-semibold">
                        {m.world || 'Auroria'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{formatVocation(m.vocation)}</td>
                    <td className="px-6 py-3">
                      <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">Lvl {m.level}</span>
                    </td>
                    <td className="px-6 py-3">
                      {m.is_online ? (
                        <span className="flex items-center text-green-400 font-medium text-xs">
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Online
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-500 text-xs">
                          <span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span> Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-400 font-mono">
                      {m.xp_gained_24h ? `+${m.xp_gained_24h.toLocaleString()}` : '0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 bg-black/40 border-t border-tibia-border">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-tibia-border hover:bg-tibia-border/80 text-white rounded disabled:opacity-50 text-xs font-bold"
              >
                Anterior
              </button>
              <span className="text-gray-400 text-xs">
                Página <strong className="text-white">{currentPage}</strong> de {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-tibia-border hover:bg-tibia-border/80 text-white rounded disabled:opacity-50 text-xs font-bold"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
