import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, UserCheck, UserMinus } from 'lucide-react';

export default function GuildRoster({ onPlayerClick }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, online, offline

  const fetchMembers = async () => {
    setLoading(true);
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('guild_members')
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

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'online') return matchesSearch && m.is_online;
    if (filter === 'offline') return matchesSearch && !m.is_online;
    return matchesSearch;
  });

  const onlineCount = members.filter(m => m.is_online).length;

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
                      {m.xp_total ? m.xp_total.toLocaleString() : '-'}
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
