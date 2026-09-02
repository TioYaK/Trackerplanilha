import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, ShieldAlert, Users, LayoutDashboard, Eye, EyeOff, Key, Trash2, Mail, Crown } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

export default function AdminPanel({ currentVisibleTabs }) {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [tabs, setTabs] = useState(currentVisibleTabs || []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(null);
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [adminLogs, setAdminLogs] = useState([]);
  const [alarmMessage, setAlarmMessage] = useState('');
  const [alarmType, setAlarmType] = useState('WAR');
  const [sendingAlarm, setSendingAlarm] = useState(false);

  const isSuperAdmin = currentProfile?.role === 'super_admin' || currentProfile?.email?.toLowerCase() === 'pifot16@gmail.com';

  const allAvailableTabs = [
    { id: 'live', label: 'Monitoramento ao Vivo' },
    { id: 'radar', label: 'Radar do Servidor' },
    { id: 'roster', label: 'Exército da Guilda' },
    { id: 'planilha', label: 'Painel de Agendamento' },
    { id: 'contribute', label: 'Ajude a Guilda' },
    { id: 'bank', label: 'Guild Bank' },
    { id: 'market', label: 'Mercado Interno' },
    { id: 'loot', label: 'Loot Split' },
    { id: 'tracker', label: 'Censo Macro' },
    { id: 'extreme', label: 'Extreme BI' },
    { id: 'analytics', label: 'Rankings & Tribunal' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchTabs();
    fetchWebhook();
    if (isSuperAdmin) fetchLogs();
  }, [isSuperAdmin]);

  const fetchWebhook = async () => {
    const { data } = await supabase.from('webhook_settings').select('discord_url').eq('id', 1).single();
    if (data) setDiscordWebhook(data.discord_url);
  };

  const saveWebhook = async () => {
    setSaving(true);
    await supabase.from('webhook_settings').upsert({ id: 1, discord_url: discordWebhook });
    setSaving(false);
    alert('Webhook salvo com sucesso!');
  };

  const sendAlarm = async () => {
    if (!alarmMessage.trim()) return alert('Digite a mensagem do alarme!');
    setSendingAlarm(true);
    try {
      await supabase.from('guild_alarms').insert({
        message: alarmMessage,
        type: alarmType,
        created_by: currentProfile?.main_character || currentUser?.email
      });
      alert('Sirene disparada com sucesso!');
      setAlarmMessage('');
    } catch (e) {
      alert('Erro ao disparar alarme: ' + e.message);
    }
    setSendingAlarm(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setAdminLogs(data);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const fetchTabs = async () => {
    const { data } = await supabase.from('app_settings').select('visible_tabs').eq('id', 1).single();
    if (data?.visible_tabs) setTabs(data.visible_tabs);
  };

  const updateUserStatus = async (id, status) => {
    await supabase.from('profiles').update({ status }).eq('id', id);
    fetchUsers();
  };

  const updateUserRole = async (id, role) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    fetchUsers();
  };

  const handleDeleteUser = async (u) => {
    if (!isSuperAdmin) return alert('Apenas o Super Admin pode deletar usuários.');
    if (u.email?.toLowerCase() === 'pifot16@gmail.com') return alert('O criador supremo não pode ser deletado.');
    if (!window.confirm(`ATENÇÃO SUPER ADMIN: Deseja realmente DELETAR o usuário ${u.main_character}? Isso apagará a conta dele permanentemente.`)) return;

    try {
      const res = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/manage-user` : '/api/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', targetUserId: u.id, requestorEmail: currentProfile.email })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Usuário deletado!');
      fetchUsers();
      fetchLogs();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleEditEmail = async (u) => {
    if (!isSuperAdmin) return alert('Apenas o Super Admin pode alterar e-mails.');
    if (u.email?.toLowerCase() === 'pifot16@gmail.com') return alert('O email do criador supremo não pode ser alterado.');
    const newEmail = window.prompt(`Novo e-mail para ${u.main_character}:`, u.email);
    if (!newEmail || newEmail === u.email) return;

    try {
      const res = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/manage-user` : '/api/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_email', targetUserId: u.id, newEmail, requestorEmail: currentProfile.email })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('E-mail atualizado!');
      fetchUsers();
      fetchLogs();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPwd = prompt("Digite a nova senha para este usuário:");
    if (!newPwd) return;

    setResetting(userId);
    try {
      // Tenta bater na API do Vercel
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPwd })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro na API');
      
      alert('Senha alterada com sucesso!');
    } catch (err) {
      alert(`Falha ao resetar senha.\n\nSe o erro persistir, certifique-se de que a variável SUPABASE_SERVICE_ROLE_KEY foi adicionada lá no painel do Vercel.\n\nErro: ${err.message}`);
    } finally {
      setResetting(null);
    }
  };

  const toggleTab = async (tabId) => {
    const newTabs = tabs.includes(tabId) ? tabs.filter(t => t !== tabId) : [...tabs, tabId];
    setTabs(newTabs);
    
    setSaving(true);
    await supabase.from('app_settings').upsert({ id: 1, visible_tabs: newTabs });
    setSaving(false);
    
    // Refresh page or we can just let state handle it, but App.jsx won't know unless we reload
    // Pra manter simples e robusto:
    window.location.reload();
  };

  const handleRemoveUserAvatar = async (userId, userName) => {
    if (!confirm(`Tem certeza que deseja remover a foto de perfil de "${userName}"?`)) return;
    try {
      const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      alert(`Erro ao remover foto: ${err.message}`);
    }
  };

  const handleToggleAvatarBlock = async (userId, currentBlocked, userName) => {
    const nextState = !currentBlocked;
    const actionDesc = nextState ? 'BLOQUEAR o upload de avatar' : 'DESBLOQUEAR o upload de avatar';
    if (!confirm(`Deseja realmente ${actionDesc} para o membro "${userName}"?`)) return;

    try {
      const { error } = await supabase.from('profiles').update({ avatar_blocked: nextState }).eq('id', userId);
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      alert(`Erro ao alterar permissão de avatar: ${err.message}`);
    }
  };

  const [searchUser, setSearchUser] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredUsers = users.filter(u => {
    const searchLower = searchUser.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(searchLower);
    const mainMatch = (u.main_character || '').toLowerCase().includes(searchLower);
    const emailMatch = (u.email || '').toLowerCase().includes(searchLower);
    return nameMatch || mainMatch || emailMatch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-12">
      
      {/* 1. Controle de Usuários */}
      <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center justify-between border-b border-tibia-border pb-4">
          <div className="flex items-center gap-2">
            <Users className="text-tibia-primary" />
            Aprovação e Gestão de Membros
          </div>
          <input
            type="text"
            placeholder="Buscar usuário (Nome, Main, Email)..."
            value={searchUser}
            onChange={(e) => {
              setSearchUser(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-black/50 border border-tibia-border rounded px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-tibia-primary w-64 font-sans"
          />
        </h2>
        
        {loading ? (
          <p className="text-gray-400 font-sans">Carregando usuários...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm text-gray-300">
              <thead className="bg-black/50 text-tibia-primary">
                <tr>
                  <th className="p-3 text-left">Foto</th>
                  <th className="p-3 text-left">Membro</th>
                  <th className="p-3 text-left">Main Character</th>
                  <th className="p-3 text-left">Makers</th>
                  <th className="p-3 text-left">Contatos</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Permissão</th>
                  <th className="p-3 text-right">Ações & Moderação</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(u => (
                  <tr key={u.id} className="border-b border-tibia-border hover:bg-white/5 transition-colors">
                    {/* Foto / Avatar */}
                    <td className="p-3">
                      <div className="relative group w-10 h-10">
                        {u.avatar_url ? (
                          <img 
                            src={u.avatar_url} 
                            alt={u.main_character} 
                            className="w-8 h-8 rounded-full border border-tibia-border object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-black/50 border border-gray-700 flex items-center justify-center text-xs text-gray-500 font-bold uppercase">
                            {(u.main_character || u.name)?.substring(0, 2) || '??'}
                          </div>
                        )}
                        {u.avatar_blocked && (
                          <span 
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow border border-black" 
                            title="Upload de avatar proibido"
                          >
                            <ShieldAlert size={12} />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-white">{u.name}</div>
                      {u.avatar_blocked && (
                        <span className="text-[10px] text-red-400 font-semibold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800/50 inline-block mt-0.5">
                          Avatar Banido
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-tibia-highlight">{u.main_character}</td>
                    <td className="p-3">
                      <div className="text-xs text-gray-300 max-w-[200px] break-words">
                        {u.makers ? (
                          Object.entries(u.makers).map(([srv, chars]) => (
                            chars && chars.trim().length > 0 && (
                              <div key={srv} className="mb-1">
                                <strong className="text-tibia-highlight">{srv}:</strong> {chars}
                              </div>
                            )
                          ))
                        ) : (
                          <span className="text-gray-500">Nenhum</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{u.ts3_nickname}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.status === 'active' ? 'bg-green-900/50 text-green-400' :
                        u.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                        <select 
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                          className="bg-black border border-tibia-border text-gray-300 rounded p-1 text-xs outline-none focus:border-tibia-primary"
                          disabled={!isSuperAdmin}
                        >
                          <option value="user">Membro</option>
                          <option value="admin">Administrador</option>
                          {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                        </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Botão Remover Foto */}
                        {u.avatar_url && (
                          <button
                            onClick={() => handleRemoveUserAvatar(u.id, u.main_character || u.name)}
                            className="bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/80 p-1.5 rounded transition-colors"
                            title="Remover Foto de Perfil"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}

                        {/* Botão Bloquear / Desbloquear Avatar */}
                        <button
                          onClick={() => handleToggleAvatarBlock(u.id, u.avatar_blocked, u.main_character || u.name)}
                          className={`p-1.5 rounded border transition-colors ${
                            u.avatar_blocked 
                              ? 'bg-amber-900/60 hover:bg-amber-800 text-amber-300 border-amber-600' 
                              : 'bg-black/60 hover:bg-red-950 text-gray-400 hover:text-red-400 border-gray-700'
                          }`}
                          title={u.avatar_blocked ? "Desbloquear Upload de Avatar" : "Proibir/Bloquear Upload de Avatar"}
                        >
                          <ShieldAlert size={15} />
                        </button>

                        <button 
                          onClick={() => handleResetPassword(u.id)} 
                          className="bg-blue-800 hover:bg-blue-700 text-white p-1.5 rounded transition-colors" 
                          title="Resetar Senha"
                          disabled={resetting === u.id}
                        >
                          {resetting === u.id ? <span className="animate-pulse">...</span> : <Key size={15} />}
                        </button>

                        {isSuperAdmin && (
                          <>
                            <button onClick={() => handleEditEmail(u)} className="bg-purple-800 hover:bg-purple-700 text-white p-1.5 rounded transition-colors" title="Alterar E-mail">
                              <Mail size={15} />
                            </button>
                            <button onClick={() => handleDeleteUser(u)} className="bg-red-950 hover:bg-red-900 border border-red-500 text-red-500 hover:text-white p-1.5 rounded transition-colors" title="Deletar Usuário Permanentemente">
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}

                        {/* Aprovar / Rejeitar */}
                        {u.status !== 'active' && (
                          <button onClick={() => updateUserStatus(u.id, 'active')} className="bg-green-800 hover:bg-green-700 text-white p-1.5 rounded transition-colors" title="Aprovar">
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        {u.status !== 'rejected' && (
                          <button onClick={() => updateUserStatus(u.id, 'rejected')} className="bg-red-800 hover:bg-red-700 text-white p-1.5 rounded transition-colors" title="Rejeitar">
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500">Nenhum usuário registrado ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-tibia-border">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-tibia-border hover:bg-tibia-border/80 text-white rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-gray-400 text-sm">
              Página <strong className="text-white">{currentPage}</strong> de {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-tibia-border hover:bg-tibia-border/80 text-white rounded disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* 2. Controle de Abas */}
      <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2 border-b border-tibia-border pb-4">
          <LayoutDashboard className="text-tibia-primary" />
          Módulos Visíveis (Para Membros)
        </h2>
        
        <p className="text-gray-400 font-sans text-sm mb-6">
          Ligue ou desligue abas do site. Módulos desligados ficam invisíveis para os membros comuns, mas você (Admin) sempre verá todos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAvailableTabs.map(tab => {
            const isVisible = tabs.includes(tab.id);
            return (
              <button
                key={tab.id}
                disabled={saving}
                onClick={() => toggleTab(tab.id)}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  isVisible 
                    ? 'bg-tibia-primary/20 border-tibia-primary text-white' 
                    : 'bg-black/50 border-tibia-border text-gray-500 hover:border-gray-600'
                }`}
              >
                <span className="font-sans font-bold">{tab.label}</span>
                {isVisible ? <Eye className="text-tibia-highlight" size={20} /> : <EyeOff size={20} />}
              </button>
            );
          })}
        </div>
        {saving && <p className="text-yellow-500 mt-4 text-sm animate-pulse">Salvando alterações...</p>}
        </div>

        {/* 3. Integração Discord Webhook */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-medieval text-[#5865F2] mb-6 flex items-center gap-2 border-b border-tibia-border pb-4">
            <Mail className="text-[#5865F2]" />
            Secretário do Discord (Webhooks)
          </h2>
          
          <p className="text-gray-400 font-sans text-sm mb-6">
            Cole a URL de um Webhook do Discord. O robô (Worker) vai enviar um Relatório Gerencial (Sala de Guerra, Mortes e Inadimplentes) <b>automaticamente todo dia às 10:00 (Server Save)</b>.
          </p>

          <div className="flex gap-4">
            <input
              type="text"
              className="flex-1 bg-black/50 border border-tibia-border p-3 rounded text-white focus:outline-none focus:border-[#5865F2]"
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
            />
            <button
              onClick={saveWebhook}
              disabled={saving}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-6 rounded transition-colors disabled:opacity-50"
            >
              Salvar Webhook
            </button>
          </div>
          </div>

          {/* 4. Botão do Pânico (Alarmes Gerais) */}
          <div className="bg-tibia-card border border-red-900/50 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-medieval text-red-500 mb-6 flex items-center gap-2 border-b border-tibia-border pb-4">
              <ShieldAlert className="text-red-500" />
              Sirene de Guerra (Web Push & Desktop)
            </h2>
            
            <p className="text-gray-400 font-sans text-sm mb-6">
              Dispare um alarme que vai tocar e pipocar na tela (Desktop Windows) de todos os membros que estão rodando o Worker da guilda neste exato momento! Use com moderação.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <select 
                  className="bg-black/50 border border-tibia-border p-3 rounded text-white focus:outline-none focus:border-red-500 w-48"
                  value={alarmType}
                  onChange={(e) => setAlarmType(e.target.value)}
                >
                  <option value="WAR">🚨 PELEGO (WAR)</option>
                  <option value="BOSS">👿 BOSS NASCEU</option>
                  <option value="RECRUIT">🛡️ DEFESA DE SPOT</option>
                  <option value="INFO">ℹ️ AVISO GERAL</option>
                </select>
                <input
                  type="text"
                  className="flex-1 bg-black/50 border border-tibia-border p-3 rounded text-white focus:outline-none focus:border-red-500"
                  placeholder="Mensagem do alarme (Ex: Invasão em Yalahar - Loguem TS AGORA!)"
                  value={alarmMessage}
                  onChange={(e) => setAlarmMessage(e.target.value)}
                  maxLength={100}
                />
              </div>
              <button
                onClick={sendAlarm}
                disabled={sendingAlarm}
                className="bg-red-900 hover:bg-red-700 text-white font-bold py-4 px-6 rounded transition-colors disabled:opacity-50 text-xl font-medieval border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
              >
                {sendingAlarm ? 'Disparando...' : '⚠️ DISPARAR SIRENE GERAL ⚠️'}
              </button>
            </div>
          </div>

        <MakerRulesPanel />

      {/* 4. Logs de Super Admin */}
      {isSuperAdmin && (
        <div className="bg-tibia-card border border-purple-900/40 rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-medieval text-purple-400 mb-6 flex items-center gap-2 border-b border-purple-900/50 pb-4">
            <Crown className="text-purple-500" />
            Audit Log Supremo (Tempo Real)
          </h2>
          <p className="text-gray-400 font-sans text-sm mb-6">
            Ações críticas realizadas por Super Admins são registradas aqui permanentemente.
          </p>

          <div className="bg-black/40 rounded overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-purple-950/40 text-purple-300 uppercase font-semibold sticky top-0">
                <tr>
                  <th className="p-3">Data/Hora</th>
                  <th className="p-3">Super Admin</th>
                  <th className="p-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30">
                {adminLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 whitespace-nowrap text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3 font-bold text-purple-400">{log.admin_name || log.admin_email}</td>
                    <td className="p-3">{log.action}</td>
                  </tr>
                ))}
                {adminLogs.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-500">Nenhum log crítico registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function MakerRulesPanel() {
  const [rules, setRules] = useState({
    is_mandatory: false,
    min_level: 1,
    allowed_vocations: [],
    required_guild: '',
    required_world: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data, error } = await supabase.from('maker_rules').select('*').limit(1).single();
    if (data) setRules(data);
    setLoading(false);
  };

  const saveRules = async () => {
    setSaving(true);
    await supabase.from('maker_rules').upsert({ id: rules.id || undefined, ...rules });
    setSaving(false);
    alert('Regras de Makers salvas com sucesso!');
  };

  if (loading) return <div>Carregando regras...</div>;

  return (
    <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2 border-b border-tibia-border pb-4">
        <ShieldAlert className="text-tibia-primary" />
        Regras de Validação de Makers (Rede Neural)
      </h2>
      <p className="text-gray-400 font-sans text-sm mb-6">
        Defina os requisitos rigorosos que o Worker verificará automaticamente quando um membro tentar registrar seus Makers no sistema.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-gray-300">Obrigatório Cadastrar?</label>
          <select 
            value={rules.is_mandatory ? 'sim' : 'nao'} 
            onChange={(e) => setRules({...rules, is_mandatory: e.target.value === 'sim'})}
            className="bg-black border border-tibia-border rounded p-2 text-white outline-none focus:border-tibia-primary"
          >
            <option value="sim">Sim (Regras estritas)</option>
            <option value="nao">Não (Qualquer char passa)</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-gray-300">Nível Mínimo do Maker</label>
          <input 
            type="number" 
            value={rules.min_level} 
            onChange={(e) => setRules({...rules, min_level: parseInt(e.target.value) || 1})}
            className="bg-black border border-tibia-border rounded p-2 text-white outline-none focus:border-tibia-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-gray-300">Mundo Obrigatório</label>
          <input 
            type="text" 
            placeholder="Ex: Auroria"
            value={rules.required_world || ''} 
            onChange={(e) => setRules({...rules, required_world: e.target.value})}
            className="bg-black border border-tibia-border rounded p-2 text-white outline-none focus:border-tibia-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-gray-300">Guilda Obrigatória (Opcional)</label>
          <input 
            type="text" 
            placeholder="Ex: Academy (Deixe em branco para ignorar)"
            value={rules.required_guild || ''} 
            onChange={(e) => setRules({...rules, required_guild: e.target.value})}
            className="bg-black border border-tibia-border rounded p-2 text-white outline-none focus:border-tibia-primary"
          />
        </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm font-bold text-gray-300">Vocações Permitidas (separadas por vírgula)</label>
          <input 
            type="text" 
            placeholder="Ex: Druid, Elder Druid, Exalted Druid, Master Sorcerer"
            value={rules.allowed_vocations?.join(', ') || ''} 
            onChange={(e) => setRules({...rules, allowed_vocations: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
            className="bg-black border border-tibia-border rounded p-2 text-white outline-none focus:border-tibia-primary"
          />
        </div>
      </div>

      <button onClick={saveRules} disabled={saving} className="mt-6 bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-2 rounded">
        {saving ? 'Salvando...' : 'Salvar Regras de Maker'}
      </button>
    </div>
  );
}
