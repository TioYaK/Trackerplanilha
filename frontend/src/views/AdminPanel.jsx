import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, ShieldAlert, Users, LayoutDashboard, Eye, EyeOff, Key } from 'lucide-react';

export default function AdminPanel({ currentVisibleTabs }) {
  const [users, setUsers] = useState([]);
  const [tabs, setTabs] = useState(currentVisibleTabs || []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(null);

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
  }, []);

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

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-12">
      
      {/* 1. Controle de Usuários */}
      <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2 border-b border-tibia-border pb-4">
          <Users className="text-tibia-primary" />
          Aprovação de Membros
        </h2>
        
        {loading ? (
          <p className="text-gray-400 font-sans">Carregando usuários...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm text-gray-300">
              <thead className="bg-black/50 text-tibia-primary">
                <tr>
                  <th className="p-3 text-left">Membro</th>
                  <th className="p-3 text-left">Main Character</th>
                  <th className="p-3 text-left">Makers</th>
                  <th className="p-3 text-left">Contatos</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Permissão</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-tibia-border hover:bg-white/5 transition-colors">
                    <td className="p-3">{u.name}</td>
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
                      >
                        <option value="user">Membro</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button 
                        onClick={() => handleResetPassword(u.id)} 
                        className="bg-blue-800 hover:bg-blue-700 text-white p-1.5 rounded" 
                        title="Resetar Senha"
                        disabled={resetting === u.id}
                      >
                        {resetting === u.id ? <span className="animate-pulse">...</span> : <Key size={16} />}
                      </button>

                      {u.status !== 'active' && (
                        <button onClick={() => updateUserStatus(u.id, 'active')} className="bg-green-800 hover:bg-green-700 text-white p-1.5 rounded" title="Aprovar">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {u.status !== 'rejected' && (
                        <button onClick={() => updateUserStatus(u.id, 'rejected')} className="bg-red-800 hover:bg-red-700 text-white p-1.5 rounded" title="Rejeitar">
                          <XCircle size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">Nenhum usuário registrado ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
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

    </div>
  );
}
