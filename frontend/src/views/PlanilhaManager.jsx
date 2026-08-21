import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function PlanilhaManager() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    party_name: '', leader_name: '', respawn_category: 'Sanguine', slot_start: '', slot_end: '', members: ''
  });

  const categories = ['Darashia', 'Sanguine', 'Darklight', 'Piranhas', 'Totem', 'Outros'];

  const loadParties = async () => {
    setLoading(true);
    const { data } = await supabase.from('parties_planilhadas').select('*').order('created_at', { ascending: false });
    if (data) setParties(data);
    setLoading(false);
  };

  useEffect(() => { loadParties(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const membersArray = formData.members.split(',').map(m => m.trim()).filter(m => m);
    
    const { error } = await supabase.from('parties_planilhadas').insert([{
      party_name: formData.party_name,
      leader_name: formData.leader_name,
      respawn_category: formData.respawn_category,
      slot_start: formData.slot_start,
      slot_end: formData.slot_end,
      members: membersArray
    }]);

    if (!error) {
      setFormData({ party_name: '', leader_name: '', respawn_category: 'Sanguine', slot_start: '', slot_end: '', members: '' });
      loadParties();
    } else {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if(confirm("Tem certeza que deseja remover este slot?")) {
      await supabase.from('parties_planilhadas').delete().eq('id', id);
      loadParties();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <h2 className="text-3xl font-black text-white mb-2">Gerenciar Planilha</h2>
      <p className="text-gray-400 mb-8">Adicione ou remova os agendamentos oficiais do Discord aqui.</p>

      <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 mb-8 shadow-sm">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Plus size={20} className="mr-2 text-green-400"/> Novo Agendamento</h3>
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
            <label className="block text-sm text-gray-400 mb-1">Respawn</label>
            <select className="w-full bg-tibia-bg border border-tibia-border rounded p-2 text-white" value={formData.respawn_category} onChange={e => setFormData({...formData, respawn_category: e.target.value})}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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
          <div className="lg:col-span-3 flex justify-end mt-2">
            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded transition">Salvar Agendamento</button>
          </div>
        </form>
      </div>

      <div className="bg-tibia-card border border-tibia-border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-black/20 text-gray-400 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Respawn</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Líder</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="text-center py-4">Carregando...</td></tr> : null}
            {parties.map(p => (
              <tr key={p.id} className="border-t border-tibia-border hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-white">{p.party_name}</td>
                <td className="px-4 py-3"><span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">{p.respawn_category}</span></td>
                <td className="px-4 py-3">{p.slot_start} - {p.slot_end}</td>
                <td className="px-4 py-3">{p.leader_name}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {!loading && parties.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-500">Nenhuma party cadastrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
