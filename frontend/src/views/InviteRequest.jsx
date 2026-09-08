import React, { useState, useEffect } from 'react';

import { supabase } from '../lib/supabase';

export default function InviteRequest({ isPublic = false }) {
  const [clientId] = useState(() => {
    let id = localStorage.getItem('invite_client_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('invite_client_id', id);
    }
    return id;
  });

  const [characterName, setCharacterName] = useState('');
  const [world, setWorld] = useState('Auroria');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [recentInvites, setRecentInvites] = useState([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const worldGuildMap = {
    'Auroria': 'Shellpatrocina',
    'Belaria': 'Battlestorm Belaria',
    'Bellum': 'Battlestorm Bellum',
    'Tenebrium': 'Battlestorm Retro',
    'Vesperia': 'Battlestorm Vesperia',
    'Malveria': 'Battlestorm Malveria'
  };

  const fetchRecentInvites = async () => {
    try {
      let query = supabase
        .from('guild_invites_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (isPublic) {
        query = query.like('requested_by', `WebSite_${clientId}`);
      }

      const { data, error } = await query;
      if (!error) setRecentInvites(data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchRecentInvites();
    const channel = supabase.channel('public:guild_invites_queue').on('postgres_changes', { event: '*', schema: 'public', table: 'guild_invites_queue' }, () => {
      fetchRecentInvites();
    }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleRetry = async (id) => {
    try {
      await supabase.from('guild_invites_queue').update({ status: 'PENDING', error_message: null }).eq('id', id);
      fetchRecentInvites();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!characterName.trim()) return;

    setStatus('loading');
    setMessage('');

    const guildName = worldGuildMap[world];

    try {
      const { error } = await supabase
        .from('guild_invites_queue')
        .insert([
          {
            character_name: characterName.trim(),
            world: world,
            guild_name: guildName,
            status: 'PENDING',
            requested_by: isPublic ? `WebSite_${clientId}` : 'WebSite'
          }
        ]);

      if (error) throw error;

      setStatus('success');
      setMessage(`Convite para ${characterName} solicitado com sucesso!<br/>O robô enviará o convite em breve.`);
      setCharacterName('');
      fetchRecentInvites();
    } catch (err) {
      setStatus('error');
      setMessage('Erro ao solicitar convite: ' + err.message);
    }
  };

  const getStatusBadge = (status, msg) => {
    if (status === 'SUCCESS') return <span className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-500/50 rounded text-xs">Sucesso</span>;
    if (status === 'FAILED') return <span className="px-2 py-1 bg-red-900/30 text-red-400 border border-red-500/50 rounded text-xs" title={msg}>Falha</span>;
    return <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-500/50 rounded text-xs">Pendente</span>;
  };

  const filteredInvites = recentInvites.filter(inv => {
    const matchName = inv.character_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchName && matchStatus;
  });

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto text-tibia-highlight flex flex-col lg:flex-row gap-8">
      <div className="lg:w-1/4 w-full">
        <div className="bg-tibia-card border border-tibia-border p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-tibia-primary">
          Solicitar Convite da Guilda
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Personagem</label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Ex: Kingg Archeer"
              className="w-full bg-[#141414] border border-tibia-border rounded py-2 px-3 focus:outline-none focus:border-tibia-primary text-tibia-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mundo</label>
            <select
              value={world}
              onChange={(e) => setWorld(e.target.value)}
              className="w-full bg-[#141414] border border-tibia-border rounded py-2 px-3 focus:outline-none focus:border-tibia-primary text-tibia-primary"
            >
              <option className="bg-[#141414] text-tibia-primary" value="Auroria">Auroria - Shellpatrocina</option>
              <option className="bg-[#141414] text-tibia-primary" value="Belaria">Belaria - Battlestorm Belaria</option>
              <option className="bg-[#141414] text-tibia-primary" value="Bellum">Bellum - Battlestorm Bellum</option>
              <option className="bg-[#141414] text-tibia-primary" value="Tenebrium">Tenebrium - Battlestorm Retro</option>
              <option className="bg-[#141414] text-tibia-primary" value="Vesperia">Vesperia - Battlestorm Vesperia</option>
              <option className="bg-[#141414] text-tibia-primary" value="Malveria">Malveria - Battlestorm Malveria</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-tibia-primary hover:bg-[d4b236] text-black font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Enviando...' : 'Solicitar Convite'}
          </button>
        </form>

        {status === 'success' && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 text-green-400 rounded text-center" dangerouslySetInnerHTML={{ __html: message }} />
        )}

        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded text-center">
            {message}
          </div>
        )}
        </div>
      </div>

      <div className="lg:w-3/4 w-full bg-tibia-card border border-tibia-border shadow-lg flex flex-col">
        <div className="p-4 border-b border-tibia-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-tibia-primary">Convites Solicitados pelo Site</h2>
            <span className="text-xs text-tibia-highlight/70">Atualização em tempo real (Últimos 100)</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Pesquisar personagem..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141414] border border-tibia-border rounded py-1 px-3 text-sm focus:outline-none focus:border-tibia-primary text-tibia-primary"
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#141414] border border-tibia-border rounded py-1 px-3 text-sm focus:outline-none focus:border-tibia-primary text-tibia-primary"
            >
              <option className="bg-[#141414]" value="ALL">Todos os Status</option>
              <option className="bg-[#141414]" value="PENDING">Pendentes</option>
              <option className="bg-[#141414]" value="SUCCESS">Sucesso</option>
              <option className="bg-[#141414]" value="FAILED">Falhas</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-tibia-bg">
              <tr>
                <th className="py-2 px-4 text-left text-xs font-medium">Data/Hora</th>
                <th className="py-2 px-4 text-left text-xs font-medium">Personagem</th>
                <th className="py-2 px-4 text-left text-xs font-medium">Mundo</th>
                {!isPublic && <th className="py-2 px-4 text-left text-xs font-medium">Origem</th>}
                <th className="py-2 px-4 text-left text-xs font-medium">Status</th>
                <th className="py-2 px-4 text-left text-xs font-medium">Detalhes</th>
                {!isPublic && <th className="py-2 px-4 text-center text-xs font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-tibia-border">
              {filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={isPublic ? "5" : "7"} className="py-8 text-center text-tibia-highlight/50">
                    Nenhum convite encontrado.
                  </td>
                </tr>
              ) : filteredInvites.map((inv) => (
                <tr key={inv.id} className="hover:bg-tibia-bg/50">
                  <td className="py-2 px-4 text-xs">
                    {new Date(inv.created_at).toLocaleDateString('pt-BR')} <br/>
                    <span className="text-gray-500">{new Date(inv.created_at).toLocaleTimeString('pt-BR')}</span>
                  </td>
                  <td className="py-2 px-4 text-sm font-medium">{inv.character_name}</td>
                  <td className="py-2 px-4 text-xs text-gray-400">{inv.world}</td>
                  {!isPublic && (
                    <td className="py-2 px-4 text-xs text-gray-400">
                      {inv.requested_by && inv.requested_by.startsWith('WebSite') ? 'Site Público' : inv.requested_by || 'Planilha/Outros'}
                    </td>
                  )}
                  <td className="py-2 px-4">{getStatusBadge(inv.status, inv.error_message)}</td>
                  <td className="py-2 px-4 text-xs text-gray-400 max-w-[200px] truncate" title={inv.error_message || ''}>
                    {inv.status === 'PENDING' ? (inv.world === 'Malveria' ? 'Em breve...' : 'Na fila...') : inv.status === 'SUCCESS' ? '—' : inv.error_message || 'OK'}
                  </td>
                  {!isPublic && (
                    <td className="py-2 px-4 text-center">
                      {inv.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetry(inv.id)}
                          className="bg-[#141414] hover:bg-tibia-primary hover:text-black border border-tibia-border rounded px-2 py-1 text-xs transition-colors"
                        >
                          🔄 Reprocessar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
