import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function PlanilhaManager({ isAdmin }) {
  const [parties, setParties] = useState([]);
  const [areas, setAreas] = useState([]);
  const [newArea, setNewArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    party_name: '', leader_name: '', respawn_category: '', hunt_name: '', slot_start: '18:00', slot_end: '22:00', members: ''
  });

  const loadData = async () => {
    setLoading(true);
    const [partiesRes, areasRes] = await Promise.all([
      supabase.from('parties_planilhadas').select('*').order('created_at', { ascending: false }),
      supabase.from('respawn_areas').select('*').order('name', { ascending: true })
    ]);
    if (partiesRes.data) setParties(partiesRes.data);
    if (areasRes.data) {
      setAreas(areasRes.data);
      if (areasRes.data.length > 0 && !formData.respawn_category) {
        setFormData(prev => ({ ...prev, respawn_category: areasRes.data[0].name }));
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddArea = async (e) => {
    e.preventDefault();
    if (!newArea.trim()) return;
    const { error } = await supabase.from('respawn_areas').insert([{ name: newArea.trim() }]);
    if (!error) {
      setNewArea('');
      loadData();
    } else {
      alert("Erro ao adicionar área: " + error.message);
    }
  };

  const handleDeleteArea = async (id, name) => {
    if(confirm(`Tem certeza que deseja remover a aba ${name}? Isso não removerá os agendamentos já criados nela, mas ela sumirá das opções.`)) {
      await supabase.from('respawn_areas').delete().eq('id', id);
      loadData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const membersArray = formData.members.split(',').map(m => m.trim()).filter(m => m);
    
    let error;
    if (editingId) {
      const res = await supabase.from('parties_planilhadas').update({
        party_name: formData.party_name,
        leader_name: formData.leader_name,
        respawn_category: formData.respawn_category,
        hunt_name: formData.hunt_name,
        slot_start: formData.slot_start,
        slot_end: formData.slot_end,
        members: membersArray
      }).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('parties_planilhadas').insert([{
        party_name: formData.party_name,
        leader_name: formData.leader_name,
        respawn_category: formData.respawn_category,
        hunt_name: formData.hunt_name,
        slot_start: formData.slot_start,
        slot_end: formData.slot_end,
        members: membersArray
      }]);
      error = res.error;
    }

    if (!error) {
      setFormData({ party_name: '', leader_name: '', respawn_category: areas.length > 0 ? areas[0].name : '', hunt_name: '', slot_start: '', slot_end: '', members: '' });
      setEditingId(null);
      loadData();
    } else {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleEdit = (p) => {
    setFormData({
      party_name: p.party_name,
      leader_name: p.leader_name,
      respawn_category: p.respawn_category,
      hunt_name: p.hunt_name || '',
      slot_start: p.slot_start.substring(0, 5),
      slot_end: p.slot_end.substring(0, 5),
      members: p.members ? p.members.join(', ') : ''
    });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setFormData({ party_name: '', leader_name: '', respawn_category: areas.length > 0 ? areas[0].name : '', hunt_name: '', slot_start: '', slot_end: '', members: '' });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if(confirm("Tem certeza que deseja remover este slot?")) {
      await supabase.from('parties_planilhadas').delete().eq('id', id);
      loadData();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="mb-8 border-b border-tibia-border pb-4">
        <h2 className="text-5xl font-medieval text-gradient-gold mb-2">Gerenciar Respawns</h2>
        <p className="text-gray-400 font-sans">Adicione ou remova os agendamentos oficiais do Discord aqui.</p>
      </div>

      {isAdmin && (
        <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-xl font-bold text-white mb-4">Gerenciar Áreas (Abas)</h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <form onSubmit={handleAddArea} className="flex-1 flex gap-2">
              <input type="text" className="flex-1 bg-tibia-bg border border-tibia-border rounded p-2 text-white" value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="Nova Área (ex: Venore)" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition">Adicionar</button>
            </form>
          </div>
          <div className="flex flex-wrap gap-2">
            {areas.map(a => (
              <span key={a.id} className="bg-black/30 border border-tibia-border px-3 py-1 rounded-full text-sm text-gray-300 flex items-center">
                {a.name}
                <button onClick={() => handleDeleteArea(a.id, a.name)} className="ml-2 text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
              </span>
            ))}
            {areas.length === 0 && <span className="text-gray-500 text-sm">Nenhuma área cadastrada.</span>}
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className={`border rounded-lg p-6 mb-8 shadow-sm ${editingId ? 'bg-tibia-card border-blue-500/50 shadow-blue-900/20' : 'bg-tibia-card border-tibia-border'}`}>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            {editingId ? <Edit size={20} className="mr-2 text-blue-400"/> : <Plus size={20} className="mr-2 text-green-400"/>}
            {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome da Party</label>
              <input required type="text" className="w-full bg-tibia-bg border border-tibia-border rounded p-2 text-white" value={formData.party_name} onChange={e => setFormData({...formData, party_name: e.target.value})} placeholder="Ex: Rushadores" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Líder (Nick exato)</label>
              <input required type="text" className="w-full bg-tibia-bg border border-tibia-border rounded p-2 text-white" value={formData.leader_name} onChange={e => setFormData({...formData, leader_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Área (Aba)</label>
              <select required className="w-full bg-tibia-bg border border-tibia-border rounded p-2 text-white" value={formData.respawn_category} onChange={e => setFormData({...formData, respawn_category: e.target.value})}>
                {areas.length === 0 && <option value="">Cadastre uma área primeiro</option>}
                {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Local Exato (Respawn)</label>
              <input required type="text" className="w-full bg-tibia-bg border border-tibia-border rounded p-2 text-white" value={formData.hunt_name} onChange={e => setFormData({...formData, hunt_name: e.target.value})} placeholder="Ex: Lions, Falcons" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Início (HH:MM)</label>
              <input required type="time" className="w-full bg-tibia-bg border border-tibia-border rounded p-2 text-white" value={formData.slot_start} onChange={e => setFormData({...formData, slot_start: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fim (HH:MM)</label>
              <input required type="time" className="w-full bg-tibia-bg border border-tibia-border rounded p-2 text-white" value={formData.slot_end} onChange={e => setFormData({...formData, slot_end: e.target.value})} />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm text-gray-400 mb-1">Integrantes (separados por vírgula)</label>
              <input type="text" className="w-full bg-tibia-bg border border-tibia-border rounded p-2 text-white" value={formData.members} onChange={e => setFormData({...formData, members: e.target.value})} placeholder="Player 1, Player 2, Player 3..." />
            </div>
            <div className="lg:col-span-3 flex justify-end mt-2 space-x-3">
              {editingId && (
                <button type="button" onClick={cancelEdit} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded transition">Cancelar</button>
              )}
              <button type="submit" disabled={areas.length === 0} className={`${editingId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'} disabled:opacity-50 text-white font-bold py-2 px-6 rounded transition`}>
                {editingId ? 'Salvar Alterações' : 'Salvar Agendamento'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 mb-8 flex justify-center items-center text-gray-500 text-sm">
          Apenas Administradores podem criar ou editar agendamentos.
        </div>
      )}

      <div className="bg-tibia-card border border-tibia-border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-black/40 text-gray-400 uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Equipe</th>
              <th className="px-6 py-4">Área</th>
              <th className="px-6 py-4">Respawn</th>
              <th className="px-6 py-4">Horário</th>
              <th className="px-6 py-4">Líder</th>
              <th className="px-6 py-4">Integrantes</th>
              {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-tibia-border/50">
            {loading ? <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-4">Carregando...</td></tr> : null}
            {!loading && parties.map(p => (
              <tr key={p.id} className={`hover:bg-white/5 ${editingId === p.id ? 'bg-blue-900/20' : ''}`}>
                <td className="px-6 py-4 font-medium text-white">{p.party_name}</td>
                <td className="px-6 py-4 font-bold text-tibia-highlight">{p.respawn_category}</td>
                <td className="px-6 py-4 text-orange-300">{p.hunt_name || 'Desconhecido'}</td>
                <td className="px-6 py-4 text-blue-400">{p.slot_start.substring(0,5)} - {p.slot_end.substring(0,5)}</td>
                <td className="px-6 py-4 text-white font-medium">{p.leader_name}</td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {p.members && p.members.length > 0 ? p.members.join(', ') : 'Solo'}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right flex justify-end space-x-2">
                    <button onClick={() => handleEdit(p)} className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded transition" title="Editar">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded transition" title="Remover">
                      <Trash2 size={18} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!loading && parties.length === 0 && <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-gray-500">Nenhuma party cadastrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
