import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, User, Globe, FileText, ArrowRight, 
  Sparkles, Gem, Swords, TrendingUp, Cpu, Gift, ExternalLink,
  BookOpen, Compass, Calculator, Skull, Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import { GUIDES_INDEX } from '../data/guidesIndex';

const APP_ROUTES = [
  { id: 'gear', label: 'Calculadora de Proteção de Set (Gear Builder) 🛡️', desc: 'Resistências compostas, simulação de dano e link compartilhável via URL', icon: Shield, category: 'Arsenal' },
  { id: 'rotten_blood', label: 'Bakragore Combat Timer & Taints (Rotten Blood) ⏳', desc: 'Cronômetro tático com bips sonoros e troca de anéis / SSA', icon: Skull, category: 'Endgame' },
  { id: 'home', label: 'Boss & Criatura Boostada do Dia 👹', desc: 'Rotação diária sincronizada com o Server Save e links para hunts', icon: Sparkles, category: 'Destaque' },
  { id: 'hunt_finder', label: 'Hunt Finder 2.0 & Rotas (105 Hunts) 🗺️', desc: 'Guia completo de respawns, vídeos do YouTube, charms e proteções', icon: Compass, category: 'Respawns' },
  { id: 'quest_checklists', label: 'Quests & Acessos (Checklists & Spoilers) 📜', desc: 'Passo a passo interativo de Soul War, Rotten Blood, Primal Ordeal e Acessos', icon: BookOpen, category: 'Endgame' },
  { id: 'hunter_toolbelt', label: 'Hunter Toolbelt & Calculadoras 🧰', desc: 'Party Share 3/2, alarme de stamina e comparador de imbuements', icon: Calculator, category: 'Utilitários' },
  { id: 'bis_market', label: 'Market Board de Itens BiS 💎', desc: 'Preços médios de mercado, conversor GP ⇄ TC e simulador de arbitragem', icon: Gem, category: 'Economia' },
  { id: 'bazaar', label: 'Bazaar Sniper (Leilões)', desc: 'Radar de arbitragem e leilões de personagens', icon: Gem, category: 'Módulo' },
  { id: 'versus', label: 'Comparador Versus ⚔️', desc: 'Simulador de duelo e histórico head-to-head entre 2 guerreiros', icon: Swords, category: 'PvP' },
  { id: 'attendance', label: 'Killboard de Guerra & Frags', desc: 'Feed de abates em tempo real e Most Wanted', icon: Swords, category: 'Módulo' },
  { id: 'tracker', label: 'Monitor Global de Players', desc: 'Censo e lista de jogadores ativos', icon: Search, category: 'Módulo' },
  { id: 'analytics', label: 'Rankings Globais de XP', desc: 'Top rushers e recordes do servidor', icon: TrendingUp, category: 'Módulo' },
  { id: 'guias', label: 'Central de Guias & Estratégias', desc: 'Artigos editoriais sobre economia e PvP', icon: FileText, category: 'Conteúdo' },
  { id: 'sorteio', label: 'Sorteios & Roleta da Comunidade', desc: 'Sorteios de prêmios e brindes in-game', icon: Gift, category: 'Comunidade' },
  { id: 'developers', label: 'Documentação da API REST', desc: 'Endpoints para bots e desenvolvedores', icon: Cpu, category: 'Dev' },
];

export default function GlobalSearchModal({ isOpen, onClose, onNavigate, onPlayerClick }) {
  const { setActiveWorld } = useWorld();
  const [query, setQuery] = useState('');
  const [playerResults, setPlayerResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setPlayerResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Escuta tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Busca rápida de personagens no Supabase com debounce
  useEffect(() => {
    const cleanQ = (query || '').replace(/["'“”]/g, '').trim();
    if (!cleanQ || cleanQ.length < 2) {
      setPlayerResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Busca direta em current_character_state (base com 42.000+ players rastreados)
        const { data: charData } = await supabase
          .from('current_character_state')
          .select('character_name, level, vocation')
          .ilike('character_name', `%${cleanQ}%`)
          .order('level', { ascending: false })
          .limit(8);

        if (charData && charData.length > 0) {
          const names = charData.map(c => c.character_name);

          // Verifica se pertencem à guilda ou possuem mundo cadastrado no perk
          const [{ data: gmData }, { data: perkData }] = await Promise.all([
            supabase
              .from('guild_members')
              .select('name')
              .in('name', names),
            supabase
              .from('guild_perk_members')
              .select('character_name, world')
              .in('character_name', names)
          ]);

          const guildSet = new Set((gmData || []).map(g => g.name?.toLowerCase()));
          const worldMap = new Map((perkData || []).map(p => [p.character_name?.toLowerCase(), p.world]));

          const results = charData.map(c => {
            const isGuild = guildSet.has(c.character_name.toLowerCase());
            const world = worldMap.get(c.character_name.toLowerCase()) || null;
            return {
              name: c.character_name,
              level: c.level,
              vocation: c.vocation,
              world: world,
              source: isGuild ? '🛡️ Guilda' : (world ? `🌐 ${world}` : 'RubinOT')
            };
          });

          setPlayerResults(results);
        } else {
          // Fallback para recent_deaths caso seja um personagem muito novo
          const { data: deathData } = await supabase
            .from('recent_deaths')
            .select('character_name, level')
            .ilike('character_name', `%${cleanQ}%`)
            .limit(4);

          if (deathData && deathData.length > 0) {
            setPlayerResults(deathData.map(d => ({
              name: d.character_name,
              level: d.level,
              vocation: null,
              world: null,
              source: 'Combate'
            })));
          } else {
            setPlayerResults([]);
          }
        }
      } catch (e) {
        console.error('Erro na busca global:', e);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Filtros de Mundos e Páginas
  const matchedWorlds = query.trim().length > 0 
    ? WORLDS_LIST.filter(w => w.id !== 'ALL' && (w.name.toLowerCase().includes(query.toLowerCase()) || w.type.toLowerCase().includes(query.toLowerCase())))
    : [];

  const matchedRoutes = query.trim().length > 0
    ? APP_ROUTES.filter(r => r.label.toLowerCase().includes(query.toLowerCase()) || r.desc.toLowerCase().includes(query.toLowerCase()))
    : [];

  const matchedArticles = query.trim().length > 0
    ? GUIDES_INDEX.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : [];

  // Lista agregada de resultados
  const allResults = [
    ...playerResults.map(p => ({ type: 'player', data: p })),
    ...matchedWorlds.map(w => ({ type: 'world', data: w })),
    ...matchedRoutes.map(r => ({ type: 'route', data: r })),
    ...matchedArticles.map(a => ({ type: 'article', data: a }))
  ];

  // Navegação por teclado
  const handleSelect = (item) => {
    if (!item) return;
    if (item.type === 'player') {
      onPlayerClick?.(item.data.name, item.data.world);
      onClose();
    } else if (item.type === 'world') {
      setActiveWorld(item.data.id);
      onClose();
    } else if (item.type === 'route') {
      onNavigate?.(item.data.id);
      onClose();
    } else if (item.type === 'article') {
      onNavigate?.('guides');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        handleSelect(allResults[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[#121214] border-2 border-yellow-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Pesquisa de Topo */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-black/60 gap-3">
          <Search size={20} className="text-yellow-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar jogador, mundo, leilão, guia ou atalho..."
            className="w-full bg-transparent text-white text-sm sm:text-base focus:outline-none placeholder-gray-500"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-gray-500 hover:text-white p-1 rounded-md"
            >
              <X size={16} />
            </button>
          )}
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-white/10 text-gray-400 font-mono">
            ESC
          </span>
        </div>

        {/* Resultados */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          
          {/* Se nenhuma busca foi feita, mostra atalhos rápidos */}
          {!query.trim() && (
            <div className="p-4 text-xs text-gray-400 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-yellow-500/80 font-mono">
                Acessos Rápidos
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {APP_ROUTES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        onNavigate?.(r.id);
                        onClose();
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/40 hover:bg-white/5 border border-white/5 text-left transition-all group cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:scale-110 transition-transform">
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-yellow-300">
                          {r.label}
                        </div>
                        <div className="text-[10px] text-gray-500">{r.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seções com Resultados Encontrados */}
          {query.trim().length > 0 && allResults.length === 0 && !searching && (
            <div className="p-8 text-center text-gray-500 text-xs">
              Nenhum resultado encontrado para "{query}".
            </div>
          )}

          {/* Jogadores */}
          {playerResults.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-500/80 font-mono px-2 mb-1.5 flex items-center gap-1">
                <User size={12} /> Personagens Encontrados
              </div>
              <div className="space-y-1">
                {playerResults.map((p, idx) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      onPlayerClick?.(p.name, p.world);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/40 hover:bg-yellow-500/20 border border-white/5 hover:border-yellow-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-medieval font-bold">
                        {p.name[0]}
                      </div>
                      <div>
                        <div className="font-medieval text-sm font-bold text-white hover:text-yellow-300">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5 font-sans">
                          {p.vocation && <span>{p.vocation}</span>}
                          {p.level && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-yellow-500">Lvl {p.level}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-yellow-400 flex items-center gap-1 font-sans">
                      Abrir Dossiê <ArrowRight size={13} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mundos */}
          {matchedWorlds.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono px-2 mb-1.5 flex items-center gap-1">
                <Globe size={12} /> Servidores Rubinot
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {matchedWorlds.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWorld(w.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-black/40 hover:bg-blue-950/40 border border-white/5 hover:border-blue-500/40 text-left transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span>{w.icon}</span>
                      <span className="text-xs font-bold text-white">{w.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{w.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Artigos Editoriais */}
          {matchedArticles.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono px-2 mb-1.5 flex items-center gap-1">
                <FileText size={12} /> Artigos & Guias
              </div>
              <div className="space-y-1">
                {matchedArticles.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      onNavigate?.('guides');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/40 hover:bg-purple-950/30 border border-white/5 hover:border-purple-500/40 text-left transition-all"
                  >
                    <div>
                      <div className="text-xs font-medieval font-bold text-white hover:text-purple-300">
                        {a.title}
                      </div>
                      <div className="text-[10px] text-gray-500">{a.category}</div>
                    </div>
                    <span className="text-xs text-purple-400 flex items-center gap-1 font-sans">
                      Ler <ArrowRight size={13} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="p-3 bg-black/80 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Navegue com</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">↓</kbd>
            <span>e selecione com</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">Enter</kbd>
          </div>
          <div>Rubinot Spotlight</div>
        </div>

      </div>
    </div>
  );
}
