import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Crosshair, UserPlus, Clock, Trash2, Skull } from 'lucide-react';

export default function RadarHunters({ isAdmin }) {
  const [huntedList, setHuntedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newReason, setNewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHunted();
    const interval = setInterval(fetchHunted, 30000); // Poll a cada 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHunted = async () => {
    try {
      const { data, error } = await supabase
        .from('hunted_list')
        .select('*')
        .order('is_online', { ascending: false })
        .order('name');
      
      if (error) throw error;
      setHuntedList(data || []);
    } catch (e) {
      console.error('Erro ao buscar hunteds:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const addHunted = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !isAdmin) return;
    
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('hunted_list').insert({
        name: newName.trim(),
        reason: newReason.trim() || 'Inimigo da Guilda',
        added_by: userData?.user?.email || 'Admin',
      });

      if (error) {
        if (error.code === '23505') alert('Esse personagem jǭ estǭ na lista!');
        else alert('Erro ao adicionar: ' + error.message);
      } else {
        setNewName('');
        setNewReason('');
        fetchHunted();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const removeHunted = async (id) => {
    if (!isAdmin || !window.confirm('Tem certeza que deseja perdoar esse inimigo?')) return;
    
    try {
      await supabase.from('hunted_list').delete().eq('id', id);
      fetchHunted();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-tibia-primary font-medieval">Carregando Radar...</div>;
  }

  const onlineCount = huntedList.filter(h => h.is_online).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex items-center gap-4 mb-8 border-b border-red-900/30 pb-4">
        <Crosshair className="text-red-500 w-10 h-10" />
        <div>
          <h2 className="text-4xl font-medieval text-red-500 tracking-wider">Radar de Hunteds</h2>
          <p className="text-gray-400 font-sans mt-1">
            Monitoramento em tempo real de inimigos e membros de guildas rivais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel Esquerdo: Resumo & Add (Admin) */}
        <div className="space-y-6">
          <div className="bg-black/60 border border-red-900/50 rounded-lg p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Skull size={100} />
            </div>
            <h3 className="text-2xl font-medieval text-white mb-2 relative z-10">Status do Radar</h3>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-5xl font-bold text-red-500">{onlineCount}</span>
              <span className="text-gray-400 font-sans">inimigos online agora</span>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Total rastreados: {huntedList.length}
            </div>
          </div>

          {isAdmin && (
            <form onSubmit={addHunted} className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-medieval text-tibia-highlight mb-4 flex items-center gap-2">
                <UserPlus size={20} className="text-yellow-500" />
                Adicionar Alvo
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Nome do Personagem</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-black/50 border border-tibia-primary/30 rounded p-2 text-white focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="Ex: Kenshin"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Motivo (Opcional)</label>
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full bg-black/50 border border-tibia-primary/30 rounded p-2 text-white focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="Ex: Deu KS no evento"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-900/40 hover:bg-red-800 border border-red-700 text-white font-medieval py-2 rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Adicionando...' : 'Marcar como Hunted'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Painel Direito: Lista de Hunteds */}
        <div className="lg:col-span-2">
          <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 bg-black/40 border-b border-tibia-border flex items-center gap-3">
              <ShieldAlert className="text-red-500" />
              <h3 className="text-xl font-medieval text-white">Lista Negra</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/60 text-tibia-primary text-xs uppercase tracking-wider font-sans">
                    <th className="p-4 border-b border-tibia-border/50">Status</th>
                    <th className="p-4 border-b border-tibia-border/50">Nome</th>
                    <th className="p-4 border-b border-tibia-border/50">Motivo</th>
                    <th className="p-4 border-b border-tibia-border/50">Visto por Ǫltimo</th>
                    {isAdmin && <th className="p-4 border-b border-tibia-border/50 text-right">Aes</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-tibia-border/30">
                  {huntedList.map((hunted) => (
                    <tr key={hunted.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        {hunted.is_online ? (
                          <span className="flex items-center gap-2 text-red-400 font-bold text-sm bg-red-900/20 px-2 py-1 rounded border border-red-900/50 w-max">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            ONLINE
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-gray-500 text-sm font-semibold">
                            <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-gray-200">
                        {hunted.name}
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {hunted.reason}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {hunted.last_seen ? (
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(hunted.last_seen).toLocaleString('pt-BR')}
                          </div>
                        ) : (
                          'Nunca visto'
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => removeHunted(hunted.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                            title="Remover do Radar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  
                  {huntedList.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-gray-500 font-sans">
                        Nenhum inimigo cadastrado no radar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
