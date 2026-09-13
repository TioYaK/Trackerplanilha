import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { Shield, Swords, Save, AlertTriangle } from 'lucide-react';
import { WORLDS_LIST } from '../context/WorldContext';

const ACTIVE_WORLDS = WORLDS_LIST.filter(w => w.id !== 'ALL');

export default function OnboardingScreen() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [primaryWorld, setPrimaryWorld] = useState(() => profile?.makers?._world || profile?.world || 'Auroria');

  // State para os makers (texto separado por vírgula) de todos os 16 mundos
  const [makers, setMakers] = useState(() => {
    const init = {};
    ACTIVE_WORLDS.forEach(w => {
      init[w.id] = profile?.makers?.[w.id] || '';
    });
    return init;
  });

  const handleChange = (server, value) => {
    setMakers(prev => ({ ...prev, [server]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Clean up makers to avoid trailing commas and empty spaces
    const cleanMakers = { _world: primaryWorld };
    let totalMakersCount = 0;
    const allEnteredNames = [];

    Object.keys(makers).forEach(server => {
      if (server.startsWith('_')) return;
      const list = (makers[server] || '').split(',').map(m => m.trim()).filter(m => m);
      if (list.length > 0) {
        cleanMakers[server] = list.join(', ');
        totalMakersCount += list.length;
        allEnteredNames.push(...list);
      }
    });

    if (totalMakersCount === 0) {
      setError(`Você precisa registrar pelo menos 1 maker secundário.`);
      return;
    }
    
    const isMainInMakers = allEnteredNames.some(m => m.toLowerCase() === profile?.main_character?.toLowerCase());
    if (isMainInMakers) {
      setError(`Você não pode colocar seu Main (${profile?.main_character}) na lista de Makers.`);
      return;
    }

    setLoading(true);
    try {
      // 1. Busca todos os perfis para garantir que ninguém mais tem esses chars
      const { data: allProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, main_character, makers');
      if (profErr) throw profErr;

      // Validação de cada char informado
      for (const makerName of allEnteredNames) {
        
        // A. Verificar Duplicidade (Global)
        for (const p of allProfiles) {
          if (p.id === user.id) continue;
          
          // Checa se já é o Main de alguém
          if (p.main_character?.toLowerCase() === makerName.toLowerCase()) {
            throw new Error(`O personagem "${makerName}" já está registrado como Main de outro jogador.`);
          }
          
          // Checa se já é o Maker de alguém
          const pMakers = p.makers || {};
          for (const srv of Object.keys(pMakers)) {
            const list = typeof pMakers[srv] === 'string' ? pMakers[srv].split(',') : [];
            const isClaimed = list.some(m => m.trim().toLowerCase() === makerName.toLowerCase());
            if (isClaimed) {
              throw new Error(`O personagem "${makerName}" já está registrado como Maker do jogador ${p.main_character}.`);
            }
          }
        }

        // B. Validação via Worker (Rede Neural)
        const { data: jobInfo, error: jobErr } = await supabase.from('maker_validation_queue').insert({
          character_name: makerName,
          user_id: user.id
        }).select().maybeSingle();

        if (jobErr) throw jobErr;

        // Aguardar o worker processar (timeout 45s)
        let isDone = false;
        let workerResult = null;
        let attempts = 0;
        
        while (!isDone && attempts < 45) {
          await new Promise(r => setTimeout(r, 1000));
          attempts++;
          
          const { data: check } = await supabase
            .from('maker_validation_queue')
            .select('status, error_msg')
            .eq('id', jobInfo.id)
            .maybeSingle();
            
          if (check && (check.status === 'completed' || check.status === 'error')) {
            isDone = true;
            workerResult = check;
          }
        }

        if (!isDone) {
          throw new Error(`Timeout: O Worker demorou muito para validar "${makerName}". Verifique se o Worker está rodando.`);
        }

        if (workerResult.status === 'error') {
          throw new Error(workerResult.error_msg || `Erro ao validar "${makerName}".`);
        }
      }

      // Tudo Validado! Salvar no banco...
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          makers: cleanMakers,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (updateErr) throw updateErr;
      
      // Forçar o reload da página para o App.jsx puxar o perfil atualizado
      window.location.reload();
    } catch (err) {
      setError('Erro: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tibia-bg bg-tibia-pattern py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-tibia-card border border-tibia-border rounded-lg shadow-tibia-glow overflow-hidden">
        
        {/* Header */}
        <div className="bg-black/80 border-b border-tibia-border p-6 text-center">
          <Shield className="mx-auto h-12 w-12 text-tibia-primary mb-2" />
          <h2 className="text-3xl font-medieval text-tibia-highlight">Alistamento Aprovado!</h2>
          <p className="text-gray-400 mt-2">
            Bem-vindo à guilda, <strong className="text-white">{profile?.main_character}</strong>. <br/>
            Antes de acessar o quartel general, precisamos registrar as suas "metas" (Makers).
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 bg-black/40">
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded flex items-center text-sm">
              <AlertTriangle className="mr-2" size={18} />
              {error}
            </div>
          )}

          <div className="bg-tibia-primary/10 border border-tibia-primary/30 p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h3 className="text-lg font-bold text-tibia-primary flex items-center">
                <Swords className="mr-2" size={18} /> Servidor Principal & Makers
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 font-sans">Seu Mundo:</label>
                <select
                  value={primaryWorld}
                  onChange={(e) => setPrimaryWorld(e.target.value)}
                  className="bg-black/80 border border-yellow-500/40 text-xs text-yellow-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-yellow-500 font-bold cursor-pointer"
                >
                  {ACTIVE_WORLDS.map(w => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">Cadastre seus makers secundários utilizados para farmar ou dar suporte.</p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Makers em {primaryWorld}
              </label>
              <input
                type="text"
                value={makers[primaryWorld] || ''}
                onChange={(e) => handleChange(primaryWorld, e.target.value)}
                placeholder="Ex: Makerzinha, Druid Maker (separe por vírgulas se for mais de um)"
                className="w-full bg-black/60 border border-tibia-border rounded p-2 text-white focus:border-tibia-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="bg-black/60 border border-tibia-border p-4 rounded-lg">
            <h3 className="text-lg font-bold text-gray-300 mb-2 border-b border-tibia-border pb-2">
              Outros Servidores do Rubinot (Opcional)
            </h3>
            <p className="text-xs text-gray-500 mb-4">Caso possua makers farmando em outros servidores do Rubinot, registre-os abaixo (separe por vírgula).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-72 overflow-y-auto pr-1">
              {ACTIVE_WORLDS.filter(w => w.id !== primaryWorld).map((w) => (
                <div key={w.id} className="bg-black/30 p-2 rounded border border-white/5">
                  <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1.5">
                    <span>{w.icon}</span> <span>{w.name}</span>
                    <span className="text-[10px] text-gray-500">({w.type})</span>
                  </label>
                  <input
                    type="text"
                    value={makers[w.id] || ''}
                    onChange={(e) => handleChange(w.id, e.target.value)}
                    placeholder="Nome do(s) char(s)..."
                    className="w-full bg-black/40 border border-tibia-border rounded p-1.5 text-white text-xs focus:border-gray-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-tibia-border">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-tibia-primary hover:bg-tibia-primary/80 border border-tibia-highlight text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="mr-2" size={20} />
                  Salvar Makers e Acessar o Painel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
