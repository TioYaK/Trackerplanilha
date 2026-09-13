import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, UserPlus, Search, MapPin, Clock, MessageSquare, 
  Send, Sparkles, PlusCircle, Check, Copy, AlertCircle, Globe 
} from 'lucide-react';
import AdBanner from '../components/AdBanner';
import { WORLDS_LIST } from '../context/WorldContext';

export default function PartyFinder({ onPlayerClick, onNavigate, user, profile }) {
  const [posts, setPosts] = useState([]);
  const [selectedWorld, setSelectedWorld] = useState('ALL');
  const [selectedVoc, setSelectedVoc] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedWhisper, setCopiedWhisper] = useState(null);

  // Form de anúncio
  const [formWorld, setFormWorld] = useState('Auroria');
  const [formVoc, setFormVoc] = useState('Elder Druid');
  const [formMinLevel, setFormMinLevel] = useState(400);
  const [formRespawn, setFormRespawn] = useState('Cobra Bastion');
  const [formDescription, setFormDescription] = useState('Hunt 2h hoje à noite com discord');
  const [formLeader, setFormLeader] = useState(profile?.main_character || '');
  const [submitting, setSubmitting] = useState(false);

  // Carrega posts com fallback local
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('party_finder_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        setPosts(data);
      } else {
        // Fallback local caso tabela não tenha sido criada
        const local = localStorage.getItem('rubinot_party_posts');
        if (local) {
          setPosts(JSON.parse(local));
        } else {
          // Exemplos iniciais realistas
          const seedPosts = [
            {
              id: '1',
              leader_name: 'Llendarius',
              world: 'Honbra',
              vocation_needed: 'Elder Druid',
              min_level: 450,
              target_respawn: 'Cobra Bastion',
              schedule: 'Hoje às 21:00h',
              description: 'Party 4x fixa focada em XP e lucro alto. Temos EK 600 e MS 520.',
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              leader_name: 'Arrow Walker',
              world: 'Belaria',
              vocation_needed: 'Elite Knight',
              min_level: 300,
              target_respawn: 'Issavi Sewers',
              schedule: 'Agora (Imediato)',
              description: 'Duo ou Trio em Issavi. RP 380 com charms liberados.',
              created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: '3',
              leader_name: 'Mage Destruidor',
              world: 'Auroria',
              vocation_needed: 'Monk',
              min_level: 500,
              target_respawn: 'Naga Temple (Marapur)',
              schedule: 'Diário (Noite)',
              description: 'Procuramos Monk experiente para rota rápida em Marapur.',
              created_at: new Date(Date.now() - 7200000).toISOString()
            }
          ];
          setPosts(seedPosts);
          localStorage.setItem('rubinot_party_posts', JSON.stringify(seedPosts));
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!formLeader.trim()) {
      alert('Informe o nome do seu personagem para contato in-game.');
      return;
    }

    setSubmitting(true);
    const newPost = {
      id: Date.now().toString(),
      leader_name: formLeader.trim(),
      world: formWorld,
      vocation_needed: formVoc,
      min_level: Number(formMinLevel) || 100,
      target_respawn: formRespawn.trim(),
      schedule: 'Agora / Hoje',
      description: formDescription.trim(),
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('party_finder_posts').insert(newPost);
    } catch (err) {
      // Ignora erro e salva localmente
    }

    const updated = [newPost, ...posts];
    setPosts(updated);
    localStorage.setItem('rubinot_party_posts', JSON.stringify(updated));
    setModalOpen(false);
    setSubmitting(false);
  };

  const copyWhisper = (p) => {
    const text = `/w "${p.leader_name}" Opa mano! Vi sua vaga para ${p.target_respawn} no Rubinot Tracker. Bora hunt?`;
    navigator.clipboard.writeText(text);
    setCopiedWhisper(p.id);
    setTimeout(() => setCopiedWhisper(null), 2500);
  };

  const filteredPosts = posts.filter(p => {
    if (selectedWorld !== 'ALL' && p.world && p.world.toLowerCase() !== selectedWorld.toLowerCase()) return false;
    if (selectedVoc !== 'ALL' && p.vocation_needed && !p.vocation_needed.toLowerCase().includes(selectedVoc.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              <Users size={14} className="text-yellow-400" />
              Tinder do Tibia & Quadro de Vagas
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold">
              Party Finder Rubinot
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
              Encontre o membro que falta para completar sua Party 4x ou encontre um time precisando da sua vocação nos 16 mundos de Rubinot.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 text-black font-bold text-xs px-5 py-3 shadow-lg transition-all active:scale-95 shrink-0"
          >
            <PlusCircle size={16} />
            <span>Anunciar Vaga na Party</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-black/60 border border-tibia-border p-4 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">Servidor:</span>
          <select
            value={selectedWorld}
            onChange={(e) => setSelectedWorld(e.target.value)}
            className="bg-black/80 border border-tibia-border rounded-xl px-3 py-1.5 text-xs text-yellow-400 font-bold focus:outline-none"
          >
            <option value="ALL">Todos os Servidores</option>
            {WORLDS_LIST.map(w => (
              <option key={w.name} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">Vocação Desejada:</span>
          <select
            value={selectedVoc}
            onChange={(e) => setSelectedVoc(e.target.value)}
            className="bg-black/80 border border-tibia-border rounded-xl px-3 py-1.5 text-xs text-yellow-400 font-bold focus:outline-none"
          >
            <option value="ALL">Qualquer Vocação</option>
            <option value="Knight">Knight (EK)</option>
            <option value="Druid">Druid (ED)</option>
            <option value="Sorcerer">Sorcerer (MS)</option>
            <option value="Paladin">Paladin (RP)</option>
            <option value="Monk">Monk</option>
          </select>
        </div>
      </div>

      {/* Grid de Vagas Ativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPosts.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-gray-500 italic bg-black/40 border border-dashed border-tibia-border rounded-2xl">
            Nenhuma vaga aberta com esses filtros no momento. Seja o primeiro a anunciar!
          </div>
        ) : (
          filteredPosts.map(p => (
            <div
              key={p.id}
              className="bg-black/70 border border-tibia-border hover:border-yellow-500/50 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-lg"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-bold uppercase">
                        {p.world || 'Global'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                        Busca: {p.vocation_needed}
                      </span>
                    </div>
                    <h3 className="text-lg font-medieval text-white mt-1.5">{p.target_respawn}</h3>
                  </div>

                  <span className="text-xs font-mono font-bold text-green-400 bg-green-950/40 px-2 py-1 rounded-lg border border-green-500/30">
                    Lvl {p.min_level}+
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  {p.description}
                </p>

                <div className="text-[11px] text-gray-400 flex items-center gap-2">
                  <span>Líder: <strong className="text-yellow-400">{p.leader_name}</strong></span>
                  <span>•</span>
                  <span>{p.schedule}</span>
                </div>
              </div>

              {/* Botão de Contato Rápido */}
              <div className="pt-3 border-t border-tibia-border/50 flex justify-between items-center">
                <button
                  onClick={() => onPlayerClick && onPlayerClick(p.leader_name, p.world)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Ver Perfil do Líder ➔
                </button>

                <button
                  onClick={() => copyWhisper(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 text-xs font-bold rounded-xl transition-all active:scale-95"
                >
                  {copiedWhisper === p.id ? <Check size={14} /> : <MessageSquare size={14} />}
                  <span>{copiedWhisper === p.id ? 'Whisper Copiado!' : 'Chamar no Chat'}</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL DE ANUNCIAR VAGA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-tibia-card border-2 border-yellow-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-xl font-medieval text-yellow-400">Anunciar Vaga na Party</h3>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Seu Nick In-Game</label>
                <input
                  type="text"
                  required
                  value={formLeader}
                  onChange={(e) => setFormLeader(e.target.value)}
                  placeholder="Ex: Llendarius"
                  className="w-full bg-black/80 border border-tibia-border rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Servidor</label>
                  <select
                    value={formWorld}
                    onChange={(e) => setFormWorld(e.target.value)}
                    className="w-full bg-black/80 border border-tibia-border rounded-xl p-2 text-xs text-yellow-400"
                  >
                    {WORLDS_LIST.map(w => (
                      <option key={w.name} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Vocação Desejada</label>
                  <select
                    value={formVoc}
                    onChange={(e) => setFormVoc(e.target.value)}
                    className="w-full bg-black/80 border border-tibia-border rounded-xl p-2 text-xs text-yellow-400"
                  >
                    <option value="Elder Druid">Elder Druid</option>
                    <option value="Elite Knight">Elite Knight</option>
                    <option value="Master Sorcerer">Master Sorcerer</option>
                    <option value="Royal Paladin">Royal Paladin</option>
                    <option value="Monk">Monk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Level Mínimo</label>
                  <input
                    type="number"
                    value={formMinLevel}
                    onChange={(e) => setFormMinLevel(e.target.value)}
                    className="w-full bg-black/80 border border-tibia-border rounded-xl p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Respawn / Hunt</label>
                  <input
                    type="text"
                    required
                    value={formRespawn}
                    onChange={(e) => setFormRespawn(e.target.value)}
                    placeholder="Ex: Cobras, Issavi..."
                    className="w-full bg-black/80 border border-tibia-border rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Detalhes (Horário / Discord)</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Hunt 2h hoje à noite. Temos discord ativo."
                  className="w-full bg-black/80 border border-tibia-border rounded-xl p-2 text-xs text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold font-medieval"
                >
                  {submitting ? 'Publicando...' : 'Publicar Vaga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdBanner slot="party_finder_footer" format="horizontal" />
    </div>
  );
}
