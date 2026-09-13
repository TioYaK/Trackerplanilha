import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { parseUtcDate } from '../lib/tibiaUtils';
import { Shield, UserPlus, Info, CheckCircle2, AlertCircle, RefreshCw, Server, Send } from 'lucide-react';

export default function InviteRequest({ isPublic = false, defaultCharacter = '' }) {
  const [clientId] = useState(() => {
    let id = localStorage.getItem('invite_client_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('invite_client_id', id);
    }
    return id;
  });

  const [characterName, setCharacterName] = useState(defaultCharacter || '');
  const [world, setWorld] = useState('Auroria');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [recentInvites, setRecentInvites] = useState([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (defaultCharacter && !characterName) {
      setCharacterName(defaultCharacter);
    }
  }, [defaultCharacter]);

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
      setMessage(`Convite para <strong>${characterName}</strong> solicitado com sucesso!<br/>O robô oficial enviará o convite in-game no site em instantes.`);
      setCharacterName('');
      fetchRecentInvites();
    } catch (err) {
      setStatus('error');
      setMessage('Erro ao solicitar convite: ' + err.message);
    }
  };

  const getStatusBadge = (status, msg) => {
    if (status === 'SUCCESS') return <span className="px-2 py-1 bg-green-900/40 text-green-400 border border-green-500/50 rounded text-xs font-semibold">Sucesso</span>;
    if (status === 'FAILED') return <span className="px-2 py-1 bg-red-900/40 text-red-400 border border-red-500/50 rounded text-xs font-semibold" title={msg}>Falha</span>;
    if (status === 'IN_PROGRESS') return <span className="px-2 py-1 bg-cyan-900/40 text-cyan-400 border border-cyan-500/50 rounded text-xs animate-pulse font-semibold">Processando</span>;
    return <span className="px-2 py-1 bg-yellow-900/40 text-yellow-400 border border-yellow-500/50 rounded text-xs font-semibold">Na Fila</span>;
  };

  const getDetailsText = (inv) => {
    if (inv.status === 'SUCCESS') return 'Convite enviado in-game';
    if (inv.status === 'IN_PROGRESS') return 'Enviando convite...';
    if (inv.status === 'PENDING') {
      if (inv.world === 'Malveria') return 'Em breve...';
      return inv.error_message || 'Aguardando robô...';
    }
    return inv.error_message || 'Falha ao convidar';
  };

  const filteredInvites = recentInvites.filter(inv => {
    const matchName = (inv.character_name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchName && matchStatus;
  });

  return (
    <div className="p-4 sm:p-8 w-full max-w-[1600px] mx-auto text-tibia-highlight flex flex-col gap-6 animate-fade-in">
      
      {/* BANNER INSTITUCIONAL: EXCLUSIVIDADE SHELL PATROCINA */}
      <div className="w-full bg-gradient-to-r from-yellow-950/40 via-black/90 to-yellow-950/40 border-2 border-yellow-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center text-yellow-400 shrink-0 shadow-lg">
              <Shield size={34} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                <Shield size={13} /> Sistema de Membros Recrutados
              </div>
              <h1 className="text-2xl sm:text-4xl font-medieval text-gradient-gold drop-shadow-md">
                Convites In-Game • Shell Patrocina
              </h1>
              <p className="text-gray-300 font-sans text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Este sistema automatizado de convite in-game é <strong>exclusivo para membros já recrutados</strong> da guilda <strong>Shell Patrocina</strong> (Auroria / Rubinot) e de suas guildas parceiras nos demais servidores da rede.
              </p>
            </div>
          </div>

          {/* BADGES DOS MUNDOS COBERTOS */}
          <div className="flex flex-wrap gap-2 text-xs shrink-0 max-w-md">
            <div className="px-3 py-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 font-sans flex items-center gap-1.5 shadow-sm">
              <span>🛡️</span>
              <span>Auroria: <strong>Shellpatrocina</strong></span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-gray-300 font-sans flex items-center gap-1.5">
              <span>⚔️</span>
              <span>Belaria: <strong>Battlestorm</strong></span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-gray-300 font-sans flex items-center gap-1.5">
              <span>⚔️</span>
              <span>Bellum: <strong>Battlestorm</strong></span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-gray-300 font-sans flex items-center gap-1.5">
              <span>⚔️</span>
              <span>Retro: <strong>Tenebrium</strong></span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-gray-300 font-sans flex items-center gap-1.5">
              <span>⚔️</span>
              <span>Vesperia: <strong>Battlestorm</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: FORMULÁRIO + TABELA */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* FORMULÁRIO DE CONVITE */}
        <div className="lg:w-1/3 w-full shrink-0">
          <div className="bg-tibia-card border-2 border-tibia-border rounded-xl p-6 shadow-xl relative">
            <h2 className="text-xl font-medieval font-bold mb-2 text-tibia-highlight flex items-center gap-2">
              <UserPlus size={20} className="text-yellow-400" />
              Convidar Personagem / Alt
            </h2>
            <p className="text-xs text-gray-400 mb-6 font-sans">
              Envie o convite in-game automático para o seu personagem principal ou maker. O robô executará o convite no painel da guilda no site oficial em instantes.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Nome do Personagem (Nick Exato)
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Ex: Kingg Archeer"
                  className="w-full bg-[#101010] border border-tibia-border rounded-lg py-2.5 px-3.5 focus:outline-none focus:border-tibia-highlight text-white font-sans text-sm transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Mundo / Guilda Destino
                </label>
                <select
                  value={world}
                  onChange={(e) => setWorld(e.target.value)}
                  className="w-full bg-[#101010] border border-tibia-border rounded-lg py-2.5 px-3.5 focus:outline-none focus:border-tibia-highlight text-white font-sans text-sm transition-colors cursor-pointer"
                >
                  <option value="Auroria">Auroria — Shellpatrocina (Rubinot)</option>
                  <option value="Belaria">Belaria — Battlestorm Belaria</option>
                  <option value="Bellum">Bellum — Battlestorm Bellum</option>
                  <option value="Tenebrium">Tenebrium — Battlestorm Retro</option>
                  <option value="Vesperia">Vesperia — Battlestorm Vesperia</option>
                  <option value="Malveria">Malveria — Battlestorm Malveria</option>
                </select>
              </div>

              {/* AVISO IMPORTANTE */}
              <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-lg p-3 text-[11px] text-gray-300 flex items-start gap-2">
                <Info size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> Uso exclusivo para membros já recrutados pela liderança da Shell Patrocina. O personagem não pode pertencer a outra guilda.
                </span>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-black font-bold font-medieval text-base py-3 px-4 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {status === 'loading' ? (
                  <span className="animate-pulse flex items-center gap-2">
                    <RefreshCw size={18} className="animate-spin" /> Processando envio...
                  </span>
                ) : (
                  <>
                    <Send size={18} /> Enviar Pedido de Convite
                  </>
                )}
              </button>
            </form>

            {status === 'success' && (
              <div 
                className="mt-4 p-3.5 bg-green-950/40 border border-green-500/50 text-green-300 rounded-lg text-xs leading-relaxed text-center animate-fade-in" 
                dangerouslySetInnerHTML={{ __html: message }} 
              />
            )}

            {status === 'error' && (
              <div className="mt-4 p-3.5 bg-red-950/40 border border-red-500/50 text-red-300 rounded-lg text-xs leading-relaxed text-center animate-fade-in">
                {message}
              </div>
            )}
          </div>
        </div>

        {/* TABELA DE CONVITES RECENTES */}
        <div className="lg:w-2/3 w-full bg-tibia-card border-2 border-tibia-border rounded-xl shadow-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-tibia-border bg-black/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-medieval font-bold text-tibia-highlight">
                Fila de Processamento de Convites
              </h2>
              <span className="text-xs text-gray-400 font-sans">
                {isPublic ? 'Seus convites solicitados nesta sessão' : 'Últimos 100 convites solicitados (Tempo Real)'}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Filtrar por nick..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#101010] border border-tibia-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-tibia-highlight text-white"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#101010] border border-tibia-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-tibia-highlight text-white"
              >
                <option value="ALL">Todos os Status</option>
                <option value="PENDING">Pendentes</option>
                <option value="SUCCESS">Sucesso</option>
                <option value="FAILED">Falhas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead className="bg-black/60 border-b border-tibia-border">
                <tr>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-400 uppercase">Data/Hora</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-400 uppercase">Personagem</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-400 uppercase">Mundo / Guilda</th>
                  {!isPublic && <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-400 uppercase">Origem</th>}
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-gray-400 uppercase">Detalhes</th>
                  {!isPublic && <th className="py-2.5 px-4 text-center text-xs font-medium text-gray-400 uppercase">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-tibia-border/60">
                {filteredInvites.length === 0 ? (
                  <tr>
                    <td colSpan={isPublic ? 5 : 7} className="py-12 text-center text-gray-500 font-sans text-sm">
                      Nenhum convite encontrado na fila.
                    </td>
                  </tr>
                ) : (
                  filteredInvites.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-4 text-xs font-sans text-gray-400">
                        {(() => {
                          const d = parseUtcDate(inv.created_at) || new Date();
                          return (
                            <>
                              <span>{d.toLocaleDateString('pt-BR')}</span> <br/>
                              <span className="text-gray-500 text-[11px]">{d.toLocaleTimeString('pt-BR')}</span>
                            </>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-4 text-sm font-bold text-white">
                        {inv.character_name}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-sans">
                        <span className="text-yellow-400 font-medium">{inv.world}</span>
                        <div className="text-[11px] text-gray-500">{inv.guild_name || worldGuildMap[inv.world]}</div>
                      </td>
                      {!isPublic && (
                        <td className="py-2.5 px-4 text-xs text-gray-400">
                          {inv.requested_by && inv.requested_by.startsWith('WebSite') ? 'Site Público' : inv.requested_by || 'Planilha'}
                        </td>
                      )}
                      <td className="py-2.5 px-4">
                        {getStatusBadge(inv.status, inv.error_message)}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-300 max-w-[200px] truncate" title={inv.error_message || getDetailsText(inv)}>
                        {getDetailsText(inv)}
                      </td>
                      {!isPublic && (
                        <td className="py-2.5 px-4 text-center">
                          {inv.status !== 'SUCCESS' && (
                            <button
                              onClick={() => handleRetry(inv.id)}
                              className="bg-black/60 hover:bg-yellow-600 hover:text-black border border-yellow-500/40 rounded px-2 py-1 text-xs transition-colors"
                              title="Reprocessar convite"
                            >
                              🔄 Reprocessar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
