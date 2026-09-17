import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { parseUtcDate } from '../lib/tibiaUtils';
import { Shield, UserPlus, Info, CheckCircle2, AlertCircle, RefreshCw, Server, Send } from 'lucide-react';
import { WORLDS_LIST, useWorld } from '../context/WorldContext';

export default function InviteRequest({ isPublic = false, defaultCharacter = '' }) {
  const { activeWorld } = useWorld();
  const [clientId] = useState(() => {
    let id = localStorage.getItem('invite_client_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('invite_client_id', id);
    }
    return id;
  });

  const [characterName, setCharacterName] = useState(defaultCharacter || '');
  const [world, setWorld] = useState(() => (activeWorld && activeWorld !== 'ALL' ? activeWorld : 'Auroria'));
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [recentInvites, setRecentInvites] = useState([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [worldFilter, setWorldFilter] = useState('ALL');

  useEffect(() => {
    if (defaultCharacter && !characterName) {
      setCharacterName(defaultCharacter);
    }
  }, [defaultCharacter]);

  const [customGuild, setCustomGuild] = useState('');

  const AUTO_INVITE_WORLDS = [
    'Auroria',
    'Belaria',
    'Bellum',
    'Drakaria',
    'Malveria',
    'Tenebrium',
    'Vesperia'
  ];

  const worldGuildMap = {
    'Auroria': 'Shellpatrocina',
    'Belaria': 'Battlestorm Belaria',
    'Bellum': 'Battlestorm Bellum',
    'Drakaria': 'Battlestorm Drakaria',
    'Eldrian': 'Battlestorm Eldrian',
    'Elysian': 'Battlestorm Elysian',
    'Infernum I': 'Battlestorm Infernum I',
    'Infernum II': 'Battlestorm Infernum II',
    'Infernum III': 'Battlestorm Infernum III',
    'Lunarian': 'Battlestorm Lunarian',
    'Malveria': 'Battlestorm Malveria',
    'Mystian': 'Battlestorm Mystian',
    'Obsidian': 'Battlestorm Obsidian',
    'Solarian': 'Battlestorm Solarian',
    'Tenebrium': 'Battlestorm Retro',
    'Vesperia': 'Battlestorm Vesperia'
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

    const guildName = customGuild.trim() || worldGuildMap[world] || 'Shellpatrocina';
    const isAutoWorld = AUTO_INVITE_WORLDS.includes(world);
    const initialErrorMsg = isAutoWorld ? null : 'Em breve...';

    try {
      const { error } = await supabase
        .from('guild_invites_queue')
        .insert([
          {
            character_name: characterName.trim(),
            world: world,
            guild_name: guildName,
            status: 'PENDING',
            error_message: initialErrorMsg,
            requested_by: isPublic ? `WebSite_${clientId}` : 'WebSite'
          }
        ]);

      if (error) throw error;

      setStatus('success');
      if (isAutoWorld) {
        setMessage(`Convite para <strong>${characterName}</strong> (Guilda: <em>${guildName}</em>) solicitado com sucesso!<br/>O robô enviará o convite in-game no site em instantes.`);
      } else {
        setMessage(`Convite para <strong>${characterName}</strong> (${world} - <em>${guildName}</em>) registrado na fila com sucesso!<br/>Este servidor está com o status <em>"Em breve"</em> e será processado assim que a automação for ativada.`);
      }
      setCharacterName('');
      fetchRecentInvites();
    } catch (err) {
      setStatus('error');
      setMessage('Erro ao solicitar convite: ' + err.message);
    }
  };

  const getStatusBadge = (status, msg, invWorld) => {
    if (status === 'SUCCESS') return <span className="px-2 py-1 bg-green-900/40 text-green-400 border border-green-500/50 rounded text-xs font-semibold">Sucesso</span>;
    if (status === 'FAILED') {
      if (msg === 'Em breve...' || (invWorld && !AUTO_INVITE_WORLDS.includes(invWorld)) || (msg && msg.includes('Nenhuma conta de líder'))) {
        return <span className="px-2 py-1 bg-amber-900/40 text-amber-300 border border-amber-500/50 rounded text-xs font-semibold">Em breve</span>;
      }
      return <span className="px-2 py-1 bg-red-900/40 text-red-400 border border-red-500/50 rounded text-xs font-semibold" title={msg}>Falha</span>;
    }
    if (status === 'IN_PROGRESS' || status === 'PROCESSING') return <span className="px-2 py-1 bg-cyan-900/40 text-cyan-400 border border-cyan-500/50 rounded text-xs animate-pulse font-semibold">Processando</span>;
    if (msg === 'Em breve...' || (invWorld && !AUTO_INVITE_WORLDS.includes(invWorld))) {
      return <span className="px-2 py-1 bg-amber-900/40 text-amber-300 border border-amber-500/50 rounded text-xs font-semibold">Em breve</span>;
    }
    return <span className="px-2 py-1 bg-yellow-900/40 text-yellow-400 border border-yellow-500/50 rounded text-xs font-semibold">Na Fila</span>;
  };

  const getDetailsText = (inv) => {
    if (inv.status === 'SUCCESS') return inv.error_message || 'Convite enviado in-game';
    if (inv.status === 'IN_PROGRESS' || inv.status === 'PROCESSING') return 'Enviando convite...';
    if (inv.error_message === 'Em breve...' || (inv.world && !AUTO_INVITE_WORLDS.includes(inv.world)) || (inv.error_message && inv.error_message.includes('Nenhuma conta de líder'))) {
      return 'Em breve...';
    }
    if (inv.status === 'PENDING') {
      return inv.error_message || 'Aguardando robô...';
    }
    return inv.error_message || 'Falha ao convidar';
  };

  const pendingCount = recentInvites.filter(i => i.status === 'PENDING').length;
  const processingCount = recentInvites.filter(i => i.status === 'IN_PROGRESS' || i.status === 'PROCESSING').length;
  const successCount = recentInvites.filter(i => i.status === 'SUCCESS').length;
  const failedCount = recentInvites.filter(i => i.status === 'FAILED').length;

  const filteredInvites = recentInvites.filter(inv => {
    const matchName = (inv.character_name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    
    // Filtro de status (inclui suporte para 'PROCESSING' / 'IN_PROGRESS')
    let matchStatus = true;
    if (statusFilter === 'PROCESSING') {
      matchStatus = inv.status === 'IN_PROGRESS' || inv.status === 'PROCESSING';
    } else if (statusFilter === 'PENDING') {
      matchStatus = inv.status === 'PENDING';
    } else if (statusFilter !== 'ALL') {
      matchStatus = inv.status === statusFilter;
    }

    // Filtro de mundo
    let matchWorld = true;
    if (worldFilter !== 'ALL') {
      matchWorld = (inv.world || '').toLowerCase() === worldFilter.toLowerCase();
    }

    return matchName && matchStatus && matchWorld;
  });

  return (
    <div className="p-4 sm:p-8 w-full max-w-[1600px] mx-auto text-tibia-highlight flex flex-col gap-6 animate-fade-in">
      
      {/* BANNER INSTITUCIONAL: GUILDAS DO RUBINOT */}
      <div className="w-full bg-gradient-to-r from-yellow-950/40 via-black/90 to-yellow-950/40 border-2 border-yellow-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center text-yellow-400 shrink-0 shadow-lg">
              <Shield size={34} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                <Shield size={13} /> Sistema de Recrutamento & Convites
              </div>
              <h1 className="text-2xl sm:text-4xl font-medieval text-gradient-gold drop-shadow-md">
                Convites In-Game • Guildas do Rubinot
              </h1>
              <p className="text-gray-300 font-sans text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Emissão automatizada de convites in-game para qualquer guilda nos 16 servidores da rede Rubinot.
              </p>
            </div>
          </div>

          {/* BADGES DOS MUNDOS COBERTOS (FILTROS RÁPIDOS) */}
          <div className="flex flex-wrap gap-2 text-xs shrink-0 max-w-md">
            <button
              type="button"
              onClick={() => setWorldFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-sans flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                worldFilter === 'ALL'
                  ? 'bg-yellow-500 text-black font-bold shadow-md ring-1 ring-yellow-400'
                  : 'bg-black/60 border border-white/15 text-gray-300 hover:border-yellow-500/50 hover:text-white'
              }`}
              title="Mostrar convites de todos os mundos"
            >
              <span>🌐</span> <span>Todos</span>
            </button>
            {WORLDS_LIST.filter(w => w.id !== 'ALL').map(w => {
              const isSelected = worldFilter.toLowerCase() === w.id.toLowerCase();
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWorldFilter(isSelected ? 'ALL' : w.id)}
                  className={`px-2.5 py-1 rounded-lg font-sans flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-yellow-500/20 border-2 border-yellow-400 text-yellow-300 font-bold shadow-md scale-105'
                      : 'bg-black/60 border border-white/15 text-gray-300 hover:border-yellow-500/50 hover:text-white'
                  }`}
                  title={`Filtrar convites do servidor ${w.name}`}
                >
                  <span>{w.icon}</span> <span>{w.name}</span>
                </button>
              );
            })}
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
                  {WORLDS_LIST.filter(w => w.id !== 'ALL').map(w => {
                    const isAuto = AUTO_INVITE_WORLDS.includes(w.name);
                    return (
                      <option key={w.id} value={w.id}>
                        {w.icon} {w.name} ({w.type}) {isAuto ? '• ⚡ Automático' : '• ⏳ Em breve'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {!AUTO_INVITE_WORLDS.includes(world) ? (
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-3 text-[11px] text-amber-200 flex items-start gap-2 animate-fade-in">
                  <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Robô em Ativação para {world}:</strong> Sua solicitação será registrada com segurança na fila com status <em>"Em breve"</em> e processada assim que a liderança conectar este servidor!
                  </span>
                </div>
              ) : (
                /* AVISO IMPORTANTE */
                <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-lg p-3 text-[11px] text-gray-300 flex items-start gap-2">
                  <Info size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atenção:</strong> Solicitação destinada aos membros recrutados pela liderança de sua guilda. O personagem não pode pertencer a outra guilda no servidor.
                  </span>
                </div>
              )}

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
          <div className="p-4 border-b border-tibia-border bg-black/40 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2">
                  <Server size={18} className="text-yellow-400" />
                  Fila de Processamento de Convites
                </h2>
                <div className="text-xs text-gray-400 font-sans flex flex-wrap items-center gap-2 mt-0.5">
                  <span>{isPublic ? 'Seus convites solicitados nesta sessão' : 'Últimos 100 convites solicitados (Tempo Real)'}</span>
                  {worldFilter !== 'ALL' && (
                    <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[11px] font-semibold">
                      Mundo: {worldFilter}
                    </span>
                  )}
                  {statusFilter !== 'ALL' && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold">
                      Status: {statusFilter === 'PROCESSING' ? 'Processando' : statusFilter}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder="Buscar por nick..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#101010] border border-tibia-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-tibia-highlight text-white min-w-[130px]"
                />

                {/* Filtro por Mundo */}
                <select 
                  value={worldFilter}
                  onChange={(e) => setWorldFilter(e.target.value)}
                  className="bg-[#101010] border border-tibia-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-tibia-highlight text-white font-sans cursor-pointer"
                  title="Filtrar por mundo"
                >
                  <option value="ALL">🌍 Todos os Mundos</option>
                  {WORLDS_LIST.filter(w => w.id !== 'ALL').map(w => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name} ({w.type})</option>
                  ))}
                </select>

                {/* Filtro por Status */}
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#101010] border border-tibia-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-tibia-highlight text-white font-sans cursor-pointer"
                  title="Filtrar por status"
                >
                  <option value="ALL">📋 Todos ({recentInvites.length})</option>
                  <option value="PROCESSING">⚡ Processando ({processingCount})</option>
                  <option value="PENDING">⏳ Na Fila ({pendingCount})</option>
                  <option value="SUCCESS">✅ Sucesso ({successCount})</option>
                  <option value="FAILED">❌ Falhas ({failedCount})</option>
                </select>
              </div>
            </div>

            {/* Quick Status Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">
              <span className="text-[11px] text-gray-400 font-sans mr-1">Filtro rápido:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-yellow-500 text-black shadow'
                    : 'bg-black/50 text-gray-400 hover:text-white border border-tibia-border'
                }`}
              >
                Todos ({recentInvites.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'PROCESSING' ? 'ALL' : 'PROCESSING')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'PROCESSING'
                    ? 'bg-cyan-500 text-black shadow animate-pulse'
                    : 'bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/60 border border-cyan-500/40'
                }`}
              >
                <RefreshCw size={10} className={statusFilter === 'PROCESSING' ? 'animate-spin' : ''} />
                Processando ({processingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === 'PENDING'
                    ? 'bg-yellow-600 text-black shadow'
                    : 'bg-yellow-950/40 text-yellow-400 hover:bg-yellow-900/60 border border-yellow-500/40'
                }`}
              >
                Na Fila ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'SUCCESS' ? 'ALL' : 'SUCCESS')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === 'SUCCESS'
                    ? 'bg-green-600 text-black shadow'
                    : 'bg-green-950/40 text-green-400 hover:bg-green-900/60 border border-green-500/40'
                }`}
              >
                Sucesso ({successCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === 'FAILED'
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-500/40'
                }`}
              >
                Falhas ({failedCount})
              </button>

              {(worldFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setWorldFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="ml-auto text-[11px] text-yellow-400 hover:underline cursor-pointer"
                >
                  ✕ Limpar filtros
                </button>
              )}
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
                        {getStatusBadge(inv.status, inv.error_message, inv.world)}
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
