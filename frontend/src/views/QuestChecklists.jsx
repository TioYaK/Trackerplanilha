import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, CheckSquare, Square, CheckCircle2, 
  MapPin, Shield, Skull, Award, Copy, Check, ExternalLink, 
  Sparkles, Filter, ChevronDown, ChevronUp, AlertTriangle, 
  Clock, Package, Compass, RotateCcw, Share2
} from 'lucide-react';
import AdBanner from '../components/AdBanner';
import { QUESTS_DATABASE, QUEST_CATEGORIES } from '../data/questsDatabase';

const STORAGE_KEY = 'rubinot_quest_progress_v1';

export default function QuestChecklists({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuests, setExpandedQuests] = useState({});
  const [copiedText, setCopiedText] = useState(null);

  // Progresso salvo no localStorage: { [stepId]: boolean }
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedSteps));
    } catch (e) {
      console.warn('Erro ao salvar progresso de quests:', e);
    }
  }, [completedSteps]);

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const toggleExpandQuest = (questId) => {
    setExpandedQuests(prev => ({
      ...prev,
      [questId]: !prev[questId]
    }));
  };

  const handleMarkAllQuestSteps = (quest, markCompleted = true) => {
    setCompletedSteps(prev => {
      const next = { ...prev };
      quest.steps.forEach(s => {
        next[s.id] = markCompleted;
      });
      return next;
    });
  };

  const handleResetAllProgress = () => {
    if (window.confirm('Deseja realmente zerar todo o seu progresso em todas as quests?')) {
      setCompletedSteps({});
    }
  };

  const handleCopyDialogue = (dialogueText, id) => {
    navigator.clipboard.writeText(dialogueText);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtragem
  const filteredQuests = useMemo(() => {
    return QUESTS_DATABASE.filter(q => {
      if (selectedCategory !== 'ALL' && q.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = q.name.toLowerCase().includes(query);
        const matchDesc = q.shortDescription.toLowerCase().includes(query);
        const matchItem = q.requiredItems.some(it => it.toLowerCase().includes(query));
        const matchHunt = q.huntsUnlocked.some(h => h.toLowerCase().includes(query));
        const matchBoss = q.bossesUnlocked.some(b => b.toLowerCase().includes(query));
        const matchStep = q.steps.some(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
        if (!matchName && !matchDesc && !matchItem && !matchHunt && !matchBoss && !matchStep) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Estatísticas Globais de Progresso
  const stats = useMemo(() => {
    let totalSteps = 0;
    let finishedSteps = 0;
    QUESTS_DATABASE.forEach(q => {
      q.steps.forEach(s => {
        totalSteps++;
        if (completedSteps[s.id]) finishedSteps++;
      });
    });
    const percent = totalSteps > 0 ? Math.round((finishedSteps / totalSteps) * 100) : 0;
    return { totalSteps, finishedSteps, percent };
  }, [completedSteps]);

  // Compartilhar resumo
  const handleShareProgress = () => {
    const summary = `🛡️ Rubinot Tracker - Progresso de Acessos & Quests:\n` +
      `Progresso Geral: ${stats.finishedSteps}/${stats.totalSteps} etapas (${stats.percent}%)\n` +
      `Acesse: https://trackerplanilha.vercel.app/quests`;
    navigator.clipboard.writeText(summary);
    setCopiedText('share');
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner de Topo / Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                    Quest & Access Checklists <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">SPOILERS RESUMIDOS</span>
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Chega de tutoriais de 20 páginas: passo a passo direto ao ponto, diálogos de NPCs, itens necessários e salvamento de progresso no seu navegador.
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de Progresso Global */}
            <div className="w-full md:w-80 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-inner">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Progresso Geral
                </span>
                <span className="text-emerald-400 font-bold">{stats.percent}% ({stats.finishedSteps}/{stats.totalSteps})</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/80 text-xs">
                <button 
                  onClick={handleShareProgress}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                >
                  <Share2 className="w-3.5 h-3.5" /> {copiedText === 'share' ? 'Copiado!' : 'Compartilhar'}
                </button>
                <button 
                  onClick={handleResetAllProgress}
                  className="text-rose-400/80 hover:text-rose-300 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Zerar Progresso
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AdBanner */}
        <AdBanner slot="hunt-finder-top" />

        {/* Barra de Busca e Filtros por Categoria */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar quest, item, npc ou hunt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {QUEST_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  selectedCategory === cat.id 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Quests */}
        <div className="space-y-4">
          {filteredQuests.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Nenhuma quest encontrada com os filtros atuais.</p>
              <button 
                onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
                className="mt-3 text-sm text-indigo-400 hover:underline"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            filteredQuests.map(quest => {
              const questSteps = quest.steps;
              const completedCount = questSteps.filter(s => completedSteps[s.id]).length;
              const isQuestCompleted = completedCount === questSteps.length && questSteps.length > 0;
              const isExpanded = expandedQuests[quest.id] !== false; // Aberto por padrão

              return (
                <div 
                  key={quest.id}
                  className={`bg-slate-900/90 border rounded-xl overflow-hidden transition-all duration-200 ${
                    isQuestCompleted 
                      ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/10' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Cabeçalho da Quest */}
                  <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 cursor-pointer" onClick={() => toggleExpandQuest(quest.id)}>
                      <div className={`mt-0.5 p-2 rounded-lg border ${
                        isQuestCompleted 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400'
                      }`}>
                        {isQuestCompleted ? <CheckCircle2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">
                            {quest.name}
                          </h2>
                          {isQuestCompleted && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> ACESSO LIBERADO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 max-w-3xl">
                          {quest.shortDescription}
                        </p>
                      </div>
                    </div>

                    {/* Metadata & Ações Rápidas */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-400 flex items-center justify-end gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {quest.estimatedTime}
                        </div>
                        <div className="text-xs font-bold text-indigo-400">
                          {completedCount}/{questSteps.length} passos
                        </div>
                      </div>

                      <button
                        onClick={() => handleMarkAllQuestSteps(quest, !isQuestCompleted)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                          isQuestCompleted
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                        }`}
                      >
                        {isQuestCompleted ? 'Desmarcar' : 'Concluir Tudo'}
                      </button>

                      <button 
                        onClick={() => toggleExpandQuest(quest.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo Expandido */}
                  {isExpanded && (
                    <div className="p-5 space-y-5 bg-slate-950/40">
                      
                      {/* Grid de Requisitos e Recompensas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
                          <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
                            <Package className="w-4 h-4" /> Suprimentos & Itens Obrigatórios:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {quest.requiredItems.map((it, idx) => (
                              <span key={idx} className="bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                {it}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
                          <div className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-2">
                            <Award className="w-4 h-4" /> Recompensas & Benefícios:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {quest.rewards.map((rew, idx) => (
                              <span key={idx} className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/50">
                                {rew}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Hunts e Bosses Desbloqueados */}
                      {(quest.huntsUnlocked.length > 0 || quest.bossesUnlocked.length > 0) && (
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          {quest.huntsUnlocked.length > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Compass className="w-3.5 h-3.5 text-yellow-400" />
                              <span>Hunts Liberadas:</span>
                              <div className="flex flex-wrap gap-1">
                                {quest.huntsUnlocked.map((h, i) => (
                                  <button 
                                    key={i} 
                                    onClick={() => onNavigate && onNavigate('hunt_finder')}
                                    className="text-yellow-300 bg-yellow-950/30 px-2 py-0.5 rounded border border-yellow-800/40 hover:underline flex items-center gap-1"
                                  >
                                    {h} <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {quest.bossesUnlocked.length > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Skull className="w-3.5 h-3.5 text-rose-400" />
                              <span>Bosses:</span>
                              <div className="flex flex-wrap gap-1">
                                {quest.bossesUnlocked.map((b, i) => (
                                  <button 
                                    key={i} 
                                    onClick={() => onNavigate && onNavigate('boss_tracker')}
                                    className="text-rose-300 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-800/40 hover:underline flex items-center gap-1"
                                  >
                                    {b} <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Lista de Passos Interativa (Checklist) */}
                      <div className="space-y-2.5 pt-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Passo a Passo Rápido (Checklist):
                        </div>

                        {questSteps.map((step, sIdx) => {
                          const isDone = !!completedSteps[step.id];

                          return (
                            <div 
                              key={step.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isDone 
                                  ? 'bg-slate-900/30 border-emerald-900/30 opacity-70' 
                                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button 
                                  onClick={() => toggleStep(step.id)}
                                  className="mt-0.5 text-slate-400 hover:text-white transition"
                                >
                                  {isDone ? (
                                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                                  )}
                                </button>

                                <div className="flex-1 space-y-1.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                                      <span className="text-slate-500 font-mono text-xs">{sIdx + 1}.</span>
                                      <span className={isDone ? 'line-through text-slate-400' : 'text-white'}>
                                        {step.title}
                                      </span>
                                    </div>

                                    {step.danger >= 4 && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> PERIGO ALTO
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    {step.description}
                                  </p>

                                  {/* Diálogo do NPC com botão de cópia */}
                                  {step.dialogue && (
                                    <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-300">
                                      <span className="text-slate-500 font-sans">NPC / Ação:</span>
                                      <span className="flex-1 truncate">{step.dialogue}</span>
                                      <button 
                                        onClick={() => handleCopyDialogue(step.dialogue, step.id)}
                                        className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition"
                                        title="Copiar texto do diálogo"
                                      >
                                        {copiedText === step.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  )}

                                  {/* Dica Ninja */}
                                  {step.tip && (
                                    <div className="text-[11px] text-amber-300/90 bg-amber-950/20 border border-amber-900/30 rounded px-2.5 py-1">
                                      💡 <span className="font-semibold">Dica:</span> {step.tip}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
