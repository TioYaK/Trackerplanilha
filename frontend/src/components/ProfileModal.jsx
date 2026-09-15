import React, { useState, useRef, useEffect } from 'react';
import { X, Save, User, Camera, Trash2, Link as LinkIcon, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { formatVocation } from '../lib/tibiaUtils';
import { WORLDS_LIST } from '../context/WorldContext';

const ACTIVE_WORLDS = WORLDS_LIST.filter(w => w.id !== 'ALL');

export default function ProfileModal({ onClose }) {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const isAvatarBlocked = Boolean(profile?.avatar_blocked);

  const [makers, setMakers] = useState(() => {
    const init = {};
    ACTIVE_WORLDS.forEach(w => {
      init[w.id] = profile?.makers?.[w.id] || '';
    });
    return init;
  });
  const [mainWorld, setMainWorld] = useState(() => profile?.makers?._world || profile?.world || 'Auroria');
  const [guildName, setGuildName] = useState(() => profile?.guild_name || profile?.makers?._guild || '');
  const [characterStats, setCharacterStats] = useState({ level: 'N/A', vocation: 'Desconhecida' });

  useEffect(() => {
    if (profile?.makers) {
      setMakers(profile.makers);
      if (profile.makers._world) setMainWorld(profile.makers._world);
      if (profile.makers._guild) setGuildName(profile.makers._guild);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.main_character) {
      const fetchStats = async () => {
         const { data: currentData } = await supabase.from('current_character_state')
           .select('level, vocation')
           .ilike('character_name', profile.main_character)
           .maybeSingle();
         
         if (currentData) {
            setCharacterStats({
              level: currentData.level || 'N/A',
              vocation: formatVocation(currentData.vocation)
            });
         } else {
            const { data: gmData } = await supabase.from('guild_members')
              .select('level, vocation')
              .ilike('name', profile.main_character)
              .maybeSingle();
            if (gmData) {
              setCharacterStats({
                level: gmData.level || 'N/A',
                vocation: formatVocation(gmData.vocation)
              });
            }
         }
      };
      fetchStats();
    }
  }, [profile]);

  const handleChange = (server, value) => {
    setMakers(prev => ({ ...prev, [server]: value }));
  };

  // Processa arquivo local e comprime usando Canvas para gerar um data URL leve e rápido (<40KB)
  const handleFileChange = (e) => {
    if (isAvatarBlocked) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP ou GIF).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('A imagem original não pode ser maior que 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 350;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Gera imagem comprimida em JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(compressedDataUrl);
        setError('');
      };
      img.onerror = () => {
        setError('Não foi possível processar a imagem selecionada.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (isAvatarBlocked) return;
    if (!urlInput.trim()) return;
    setAvatarUrl(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
    setError('');
  };

  const handleRemoveAvatar = () => {
    if (isAvatarBlocked) return;
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Coleta todos os makers informados em qualquer servidor
      const allEnteredMakers = [];
      ACTIVE_WORLDS.map(w => w.id).forEach(server => {
        const list = (makers[server] || '').split(',').map(m => m.trim()).filter(Boolean);
        list.forEach(m => allEnteredMakers.push({ server, name: m }));
      });

      const { data: allProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, main_character, makers')
        .limit(500);
      if (profErr) throw profErr;

      for (const item of allEnteredMakers) {
        const makerName = item.name;
        for (const p of (allProfiles || [])) {
          if (p.main_character && p.main_character.toLowerCase() === makerName.toLowerCase() && p.id !== user.id) {
            throw new Error(`O personagem "${makerName}" (${item.server}) já é o Main Character do jogador ${p.main_character}.`);
          }
          
          if (p.id !== user.id) {
            const pMakers = p.makers || {};
            for (const srv of Object.keys(pMakers)) {
              if (srv.startsWith('_')) continue; // Ignora metadados
              const val = pMakers[srv];
              const list = typeof val === 'string' ? val.split(',') : (Array.isArray(val) ? val : []);
              if (list.some(m => m && typeof m === 'string' && m.trim().toLowerCase() === makerName.toLowerCase())) {
                throw new Error(`O personagem "${makerName}" já está registrado como Maker do jogador ${p.main_character || 'Outro Jogador'}.`);
              }
            }
          }
        }
      }

      // Prepara payload de atualização com metadados de Mundo e Guilda
      const updateData = {
        makers: {
          ...makers,
          _world: mainWorld,
          _guild: guildName.trim()
        }
      };

      // Se o usuário não estiver bloqueado, atualiza o avatar_url
      if (!isAvatarBlocked) {
        updateData.avatar_url = avatarUrl ? avatarUrl : null;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateErr) throw updateErr;
      
      if (refreshProfile) {
        await refreshProfile();
      }

      setSuccess('Perfil e foto atualizados com sucesso!');
      
      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err) {
      setError(err.message || 'Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  const defaultVocationImg = `https://github.com/TioYaK/Trackerplanilha/raw/main/scrapper/images/vocations/${(characterStats?.vocation || 'None').toLowerCase().replace(/\s+/g, '')}.png`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 font-sans backdrop-blur-sm animate-fade-in">
      <div className="bg-tibia-bg border-2 border-tibia-border rounded-lg shadow-tibia-glow max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b border-tibia-border pb-2">
          <h2 className="text-2xl font-medieval text-tibia-highlight flex items-center">
            <User className="mr-2 text-tibia-primary" /> Meu Perfil
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Card de Identificação e Foto do Jogador */}
        <div className="mb-6 bg-black/50 p-4 border border-tibia-border rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img 
                src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.main_character || 'N/A')}&background=111&color=eab308`}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover bg-black/60 border-2 border-tibia-highlight shadow-md"
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.main_character || 'N/A')}&background=111&color=eab308`; }}
              />
              {avatarUrl && (
                <span className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-black" title="Foto customizada ativa" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {profile?.main_character}
                {isAvatarBlocked && (
                  <span className="bg-red-950 text-red-400 border border-red-500/50 text-[11px] px-2 py-0.5 rounded uppercase font-bold">
                    Avatar Bloqueado
                  </span>
                )}
              </h3>
              <p className="text-gray-400 text-sm">Vocation: {characterStats.vocation || 'Desconhecida'} • Level: {characterStats.level || 'N/A'}</p>
              <p className="text-tibia-primary text-xs mt-1">Status: {profile?.status === 'active' ? 'Ativo na Guilda' : profile?.status}</p>
            </div>
          </div>

          {/* Controles de Foto */}
          {!isAvatarBlocked && (
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 border border-blue-500/50 text-white rounded text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                title="Escolher imagem do seu computador"
              >
                <Camera size={14} /> Carregar Foto
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 rounded text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Inserir link direto de imagem"
              >
                <LinkIcon size={14} /> Link URL
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 border border-red-500/50 text-red-200 rounded text-xs font-bold transition-colors flex items-center gap-1.5"
                  title="Remover foto customizada"
                >
                  <Trash2 size={14} /> Remover
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notificação de Punição: Se o membro estiver bloqueado */}
        {isAvatarBlocked && (
          <div className="mb-6 bg-red-950/40 border border-red-500/70 p-4 rounded-lg flex items-start gap-3 text-red-200 text-sm animate-pulse">
            <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={22} />
            <div>
              <strong className="text-red-300 font-bold block text-base">Permissão de Avatar Suspensa</strong>
              Seu direito de enviar ou alterar foto de perfil foi revogado pela administração da guilda devido a violação de regras de conduta. Caso acredite que foi um equívoco, procure um administrador.
            </div>
          </div>
        )}

        {/* Input de URL Opcional */}
        {!isAvatarBlocked && showUrlInput && (
          <div className="mb-6 bg-black/60 border border-blue-900/50 p-3 rounded-lg flex gap-2 items-center">
            <input 
              type="url" 
              placeholder="Cole o link da imagem (ex: https://...)" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-black/80 border border-tibia-border rounded px-3 py-1.5 text-sm text-white focus:border-blue-400 focus:outline-none"
            />
            <button 
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1"
            >
              <Check size={14} /> Aplicar
            </button>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Seção 1: Configuração do Jogador */}
          <div className="bg-black/60 border border-tibia-border p-4 rounded-lg mb-4">
            <h3 className="text-sm font-bold text-tibia-highlight mb-3 uppercase tracking-wider font-medieval">
              ⚔️ Afiliação & Servidor de Origem
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Mundo Principal *</label>
                <select
                  value={mainWorld}
                  onChange={(e) => setMainWorld(e.target.value)}
                  className="w-full bg-black/60 border border-tibia-border rounded p-2 text-white text-sm focus:border-tibia-primary focus:outline-none"
                >
                  {ACTIVE_WORLDS.map(w => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name} ({w.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Sua Guilda</label>
                <input
                  type="text"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                  placeholder="Ex: Battle Storm, Shellpatrocina, etc."
                  className="w-full bg-black/60 border border-tibia-border rounded p-2 text-white text-sm focus:border-tibia-primary focus:outline-none"
                >
                </input>
              </div>
            </div>
          </div>

          {/* Seção 2: Makers nos 16 Servidores */}
          <div className="bg-black/60 border border-tibia-border p-4 rounded-lg mb-6">
            <h3 className="text-sm font-bold text-gray-200 mb-1 border-b border-tibia-border pb-2 font-medieval">
              🎭 Rede de Makers & Farm (16 Servidores)
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-sans">
              Informe os nomes dos personagens que você usa para farmar em cada servidor (separe múltiplos por vírgula). Nenhum servidor é obrigatório.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-80 overflow-y-auto pr-1">
              {ACTIVE_WORLDS.map(w => (
                <div key={w.id} className="bg-black/30 p-2 rounded border border-white/5">
                  <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <span>{w.icon}</span> <span>{w.name}</span>
                    <span className="text-[10px] text-gray-500">({w.type})</span>
                  </label>
                  <input
                    type="text"
                    value={makers[w.id] || ''}
                    onChange={(e) => handleChange(w.id, e.target.value)}
                    placeholder="Ex: Makerzinha, Farm Knight..."
                    className="w-full bg-black/40 border border-gray-700 rounded p-1.5 text-white text-xs focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 p-3 rounded flex items-center gap-2"><AlertTriangle size={18} /> {error}</div>}
          {success && <div className="mb-4 bg-green-900/50 border border-green-500 text-green-200 p-3 rounded flex items-center gap-2"><Check size={18} /> {success}</div>}

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
              className="px-4 py-2 bg-tibia-primary text-black font-bold rounded hover:bg-tibia-highlight transition-colors flex items-center disabled:opacity-50 shadow-md"
            >
              {loading ? 'Salvando...' : <><Save size={18} className="mr-2" /> Salvar Alterações</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
