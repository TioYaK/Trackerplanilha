import React, { useState } from 'react';
import { X, Save, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export default function ProfileModal({ onClose }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [makers, setMakers] = useState(profile?.makers || {
    Auroria: '',
    Malveria: '',
    Belaria: '',
    Vesperia: '',
    Bellum: '',
    Tenebrium: ''
  });

  const handleChange = (server, value) => {
    setMakers(prev => ({ ...prev, [server]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const auroriaMakersList = (makers.Auroria || '').split(',').map(m => m.trim()).filter(m => m);
  
      if (auroriaMakersList.length === 0) {
        throw new Error('Você precisa registrar pelo menos 1 maker no servidor Auroria (obrigatório).');
      }

      const { data: allProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, main_character, makers');
        
      if (profErr) throw profErr;

      for (const makerName of auroriaMakersList) {
        for (const p of allProfiles) {
          if (p.main_character.toLowerCase() === makerName.toLowerCase() && p.id !== user.id) {
            throw new Error(`O personagem "${makerName}" já é o Main Character do jogador ${p.main_character}.`);
          }
          
          if (p.id !== user.id) {
            const pMakers = p.makers || {};
            for (const srv of Object.keys(pMakers)) {
              const list = typeof pMakers[srv] === 'string' ? pMakers[srv].split(',') : [];
              if (list.some(m => m.trim().toLowerCase() === makerName.toLowerCase())) {
                throw new Error(`O personagem "${makerName}" já está registrado como Maker do jogador ${p.main_character}.`);
              }
            }
          }
        }
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ makers: makers })
        .eq('id', user.id);

      if (updateErr) throw updateErr;
      
      setSuccess('Makers atualizados com sucesso!');
      
      setTimeout(() => {
        onClose();
        window.location.reload(); 
      }, 1500);

    } catch (err) {
      setError(err.message || 'Erro ao salvar makers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-tibia-bg border-2 border-tibia-border rounded-lg shadow-tibia-glow max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b border-tibia-border pb-2">
          <h2 className="text-2xl font-medieval text-tibia-highlight flex items-center">
            <User className="mr-2 text-tibia-primary" /> Meu Perfil
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 bg-black/40 p-4 border border-tibia-border rounded flex flex-col sm:flex-row gap-4 items-center">
           <img 
            src={`https://github.com/TioYaK/Trackerplanilha/raw/main/scrapper/images/vocations/${(profile?.vocation || 'None').toLowerCase()}.png`} 
            alt={profile?.vocation} 
            className="w-12 h-12 rounded bg-black/60 border border-gray-600"
            onError={(e) => { e.target.src = 'https://github.com/TioYaK/Trackerplanilha/raw/main/scrapper/images/vocations/none.png' }}
          />
          <div>
            <h3 className="text-xl font-bold text-white">{profile?.main_character}</h3>
            <p className="text-gray-400 text-sm">Vocation: {profile?.vocation} • Level: {profile?.level || 'N/A'}</p>
            <p className="text-tibia-primary text-xs mt-1">Status: {profile?.status === 'active' ? 'Ativo na Guilda' : profile?.status}</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="bg-black/60 border border-tibia-border p-4 rounded-lg mb-4">
            <h3 className="text-lg font-bold text-tibia-highlight mb-2">Makers em Auroria *</h3>
            <p className="text-xs text-gray-400 mb-3">Você precisa ter pelo menos um maker principal registrado em Auroria.</p>
            <input
              type="text"
              required
              value={makers.Auroria || ''}
              onChange={(e) => handleChange('Auroria', e.target.value)}
              placeholder="Ex: Makerzinha, Druid Maker (separe por vírgulas)"
              className="w-full bg-black/60 border border-tibia-border rounded p-2 text-white focus:border-tibia-primary focus:outline-none"
            />
          </div>

          <div className="bg-black/60 border border-tibia-border p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold text-gray-300 mb-2 border-b border-tibia-border pb-2">Outros Servidores</h3>
            <p className="text-xs text-gray-500 mb-4">Makers farmando em outros servidores (separe por vírgula).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Malveria', 'Belaria', 'Vesperia', 'Bellum', 'Tenebrium'].map((server) => (
                <div key={server}>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{server}</label>
                  <input
                    type="text"
                    value={makers[server] || ''}
                    onChange={(e) => handleChange(server, e.target.value)}
                    placeholder="Nome do(s) char(s)..."
                    className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white text-sm focus:border-gray-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 p-3 rounded">{error}</div>}
          {success && <div className="mb-4 bg-green-900/50 border border-green-500 text-green-200 p-3 rounded">{success}</div>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-tibia-primary text-black font-bold rounded hover:bg-tibia-highlight transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? 'Salvando...' : <><Save size={18} className="mr-2" /> Salvar Alterações</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
