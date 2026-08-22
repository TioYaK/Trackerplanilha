import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, UserCheck, UserMinus, Crosshair, Crown } from 'lucide-react';

export default function GuildRoster({ onPlayerClick, isAdmin }) {
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

  const fetchMembers = async () => {
    setLoading(true);
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('view_guild_roster')
        .select('*')
        .order('level', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (error) {
        console.error(error);
        break;
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < pageSize) hasMore = false;
        else page++;
      } else {
        hasMore = false;
      }
    }
    
    setMembers(allData);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const generateHR = async () => {
    setLoading(true);
    let strikesData = [];
    let page = 0;
    while(true) {
      const { data } = await supabase
          .from('player_strikes')
          .select('*')
          .gte('expires_at', new Date().toISOString())
          .range(page*1000, (page+1)*1000-1);
      if (!data || data.length === 0) break;
      strikesData.push(...data);
      if (data.length < 1000) break;
      page++;
    }
    
    const scoredMembers = members.map(m => {
       const pStrikes = strikesData ? strikesData.filter(s => s.character_name === m.name).length : 0;
       const xpScore = Math.min(50, (m.xp_gained_24h || 0) / 10000000); // 1 pt per 10M, cap 50
       let score = 50 + xpScore - (pStrikes * 30);
       if (score > 100) score = 100;
       if (score < 0) score = 0;
       return { ...m, score, strikes: pStrikes };
    });

    const toPromote = [...scoredMembers].filter(m => m.score >= 80).sort((a,b) => b.score - a.score).slice(0, 10);
    const toKick = [...scoredMembers].filter(m => m.score <= 30).sort((a,b) => a.score - b.score).slice(0, 10);
    
    setHrData({ toPromote, toKick });
    setShowHR(true);
    setLoading(false);
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'online') return matchesSearch && m.is_online;
    if (filter === 'offline') return matchesSearch && !m.is_online;
    return matchesSearch;
  });

  const onlineCount = members.filter(m => m.is_online).length;

  // Matchmaker Logic
  const minShare = Math.floor(mmLevel * 0.66);
  const maxShare = Math.ceil(mmLevel / 0.66);
  const mmCandidates = members.filter(m => m.is_online && m.level >= minShare && m.level <= maxShare);
  
  const mmEKs = mmCandidates.filter(m => m.vocation === 'Elite Knight');
  const mmEDs = mmCandidates.filter(m => m.vocation === 'Elder Druid');
  const mmMSs = mmCandidates.filter(m => m.vocation === 'Master Sorcerer');
  const mmRPs = mmCandidates.filter(m => m.vocation === 'Royal Paladin');

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-5xl font-medieval text-gradient-gold mb-2">Roster da Guilda</h2>
          <p className="text-gray-400 font-sans">Busque membros, analise quem está online e verifique históricos rápidos.</p>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-tibia-card border border-tibia-border p-4 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total de Membros</p>
            <p className="text-2xl font-bold text-white">{members.length}</p>
          </div>
          <User className="text-gray-500" size={32} />
        </div>
        <div className="bg-tibia-card border border-green-900/50 p-4 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-green-500">Membros Online</p>
            <p className="text-2xl font-bold text-green-400">{onlineCount}</p>
          </div>
          <UserCheck className="text-green-500/50" size={32} />
        </div>
        <div className="bg-tibia-card border border-red-900/50 p-4 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-red-500">Membros Offline</p>
            <p className="text-2xl font-bold text-red-400">{members.length - onlineCount}</p>
          </div>
          <UserMinus className="text-red-500/50" size={32} />
        </div>
      </div>

      {/* Botões de Módulos Especiais */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => { setShowMatchmaker(!showMatchmaker); setShowHR(false); }}
          className="bg-blue-900/50 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center border border-blue-500/50 shadow-tibia-glow"
        >
          <Crosshair size={18} className="mr-2" /> Matchmaker (Tinder de Hunts)
        </button>
        {isAdmin && (
          <button 
            onClick={() => { if(!showHR) generateHR(); else setShowHR(false); setShowMatchmaker(false); }}
            className="bg-yellow-900/50 hover:bg-yellow-800 text-yellow-500 px-4 py-2 rounded-lg font-bold transition-colors flex items-center border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          >
            <Crown size={18} className="mr-2" /> A Cadeira do Rei (RH)
          </button>
        )}
      </div>

      {/* Matchmaker UI */}
      {showMatchmaker && (
        <div className="bg-blue-950/20 border border-blue-900/50 p-6 rounded-lg mb-8 shadow-xl animate-fade-in">
          <h3 className="text-xl font-bold text-blue-400 mb-2 flex items-center">
            <Crosshair size={24} className="mr-2" />
            Matchmaker (Buscador de PT)
          </h3>
          <p className="text-sm text-gray-400 mb-6">Insira o seu Level e encontre jogadores online agora mesmo compatíveis com sua faixa de share (x0.66 a /0.66).</p>
          
          <div className="flex items-center mb-6">
            <span className="text-white mr-4 font-bold">Meu Level:</span>
            <input 
              type="number" 
              value={mmLevel}
              onChange={(e) => setMmLevel(Number(e.target.value) || 1)}
              className="bg-black/50 border border-tibia-border rounded py-2 px-4 text-white font-mono w-32 focus:border-blue-500 outline-none"
            />
            <span className="ml-4 text-xs text-gray-500 bg-black/30 px-3 py-1 rounded">Range de Share: {minShare} ao {maxShare}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/40 border border-blue-900/50 p-4 rounded">
              <h4 className="text-blue-500 font-bold mb-3 border-b border-blue-900/50 pb-2">Elite Knights ({mmEKs.length})</h4>
              <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {mmEKs.map(m => <li key={m.name} className="text-xs text-gray-300 flex justify-between"><span>{m.name}</span><span className="text-gray-500">{m.level}</span></li>)}
                {mmEKs.length === 0 && <span className="text-xs text-gray-600">Nenhum compatível online.</span>}
              </ul>
            </div>
            <div className="bg-black/40 border border-green-900/50 p-4 rounded">
              <h4 className="text-green-500 font-bold mb-3 border-b border-green-900/50 pb-2">Elder Druids ({mmEDs.length})</h4>
              <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {mmEDs.map(m => <li key={m.name} className="text-xs text-gray-300 flex justify-between"><span>{m.name}</span><span className="text-gray-500">{m.level}</span></li>)}
                {mmEDs.length === 0 && <span className="text-xs text-gray-600">Nenhum compatível online.</span>}
              </ul>
            </div>
            <div className="bg-black/40 border border-red-900/50 p-4 rounded">
              <h4 className="text-red-500 font-bold mb-3 border-b border-red-900/50 pb-2">Master Sorcerers ({mmMSs.length})</h4>
              <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {mmMSs.map(m => <li key={m.name} className="text-xs text-gray-300 flex justify-between"><span>{m.name}</span><span className="text-gray-500">{m.level}</span></li>)}
                {mmMSs.length === 0 && <span className="text-xs text-gray-600">Nenhum compatível online.</span>}
              </ul>
            </div>
            <div className="bg-black/40 border border-yellow-900/50 p-4 rounded">
              <h4 className="text-yellow-500 font-bold mb-3 border-b border-yellow-900/50 pb-2">Royal Paladins ({mmRPs.length})</h4>
              <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {mmRPs.map(m => <li key={m.name} className="text-xs text-gray-300 flex justify-between"><span>{m.name}</span><span className="text-gray-500">{m.level}</span></li>)}
                {mmRPs.length === 0 && <span className="text-xs text-gray-600">Nenhum compatível online.</span>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cadeira do Rei UI */}
      {showHR && hrData && (
        <div className="bg-yellow-950/10 border border-yellow-900/50 p-6 rounded-lg mb-8 shadow-xl animate-fade-in">
          <h3 className="text-xl font-bold text-yellow-500 mb-2 flex items-center">
            <Crown size={24} className="mr-2" />
            A Cadeira do Rei (RH Automático)
          </h3>
          <p className="text-sm text-gray-400 mb-6">Avaliação de performance dos membros. O robô calcula notas de 0 a 100 com base em XP gerada e deduz por punições.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black/40 border border-green-900/50 p-4 rounded">
              <h4 className="text-green-500 font-bold mb-4 uppercase tracking-wider text-sm flex items-center justify-between">
                <span>📈 Merecem Promoção</span>
                <span className="text-xs text-gray-500 normal-case">Score {'>'} 80</span>
              </h4>
              <div className="space-y-2">
                {hrData.toPromote.map((m, i) => (
                  <div key={m.name} className="flex justify-between items-center bg-white/5 p-2 rounded">
                    <div>
                      <span className="font-bold text-white text-sm">{i+1}. {m.name}</span>
                      <p className="text-[10px] text-gray-500">+{((m.xp_gained_24h||0)/1000000).toFixed(1)}M XP</p>
                    </div>
                    <span className="text-green-400 font-mono font-bold">{Math.round(m.score)} pts</span>
                  </div>
                ))}
                {hrData.toPromote.length === 0 && <div className="text-gray-500 text-sm">Ninguém qualificado.</div>}
              </div>
            </div>
            
            <div className="bg-black/40 border border-red-900/50 p-4 rounded">
              <h4 className="text-red-500 font-bold mb-4 uppercase tracking-wider text-sm flex items-center justify-between">
                <span>📉 Peso Morto (Kick List)</span>
                <span className="text-xs text-gray-500 normal-case">Score {'<'} 30</span>
              </h4>
              <div className="space-y-2">
                {hrData.toKick.map((m, i) => (
                  <div key={m.name} className="flex justify-between items-center bg-white/5 p-2 rounded border-l-2 border-red-500">
                    <div>
                      <span className="font-bold text-white text-sm">{m.name}</span>
                      <p className="text-[10px] text-red-400">{m.strikes} Punições</p>
                    </div>
                    <span className="text-red-500 font-mono font-bold">{Math.round(m.score)} pts</span>
                  </div>
                ))}
                {hrData.toKick.length === 0 && <div className="text-gray-500 text-sm">Guilda perfeitamente limpa!</div>}
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
            className="w-full bg-tibia-bg border border-tibia-border rounded py-2 pl-10 pr-4 text-white focus:outline-none focus:border-tibia-primary"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded transition-colors ${filter === 'all' ? 'bg-tibia-primary text-black font-bold' : 'bg-tibia-bg text-gray-400 hover:text-white'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('online')}
            className={`px-4 py-2 rounded transition-colors ${filter === 'online' ? 'bg-green-600 text-white font-bold' : 'bg-tibia-bg text-gray-400 hover:text-white'}`}
          >
            Online
          </button>
          <button 
            onClick={() => setFilter('offline')}
            className={`px-4 py-2 rounded transition-colors ${filter === 'offline' ? 'bg-red-600 text-white font-bold' : 'bg-tibia-bg text-gray-400 hover:text-white'}`}
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
                <th className="px-6 py-4">Vocação</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">XP Total Diária</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tibia-border/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tibia-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">Nenhum jogador encontrado com estes filtros.</td>
                </tr>
              ) : (
                filteredMembers.map(m => (
                <tr key={m.name} className="hover:bg-white/5 transition-colors">
                  <td 
                    className="px-6 py-3 font-medium text-white cursor-pointer hover:text-tibia-primary hover:underline"
                    onClick={() => onPlayerClick && onPlayerClick(m.name)}
                  >
                    {m.name}
                  </td>
                  <td className="px-6 py-3 text-gray-400">{m.vocation}</td>
                    <td className="px-6 py-3">
                      <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">Lvl {m.level}</span>
                    </td>
                    <td className="px-6 py-3">
                      {m.is_online ? (
                        <span className="flex items-center text-green-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Online
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-500">
                          <span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span> Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-400">
                      {m.xp_gained_24h ? `+${m.xp_gained_24h.toLocaleString()}` : '0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
