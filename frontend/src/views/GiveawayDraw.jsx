import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { soundFX } from '../lib/soundEffects';
import confetti from 'canvas-confetti';
import { 
  Gift, Trophy, Sparkles, Users, Crown, Shield, 
  CheckCircle2, AlertCircle, Clock, Shuffle, 
  Plus, Trash2, ArrowRight, RotateCcw, Volume2, 
  VolumeX, Calendar, Star, HelpCircle, UserPlus, Flame, Lock
} from 'lucide-react';

const RUBINOT_WORLDS = [
  'Todos os Mundos',
  'Auroria',
  'Belaria',
  'Bellum',
  'Tenebrium',
  'Vesperia',
  'Malveria'
];

const DEFAULT_GIVEAWAY = {
  id: 'round-1',
  title: 'Sorteio Oficial da Comunidade Rubinot & Battle Storm',
  prize: '250 Tibia Coins',
  prize_image: '',
  description: 'Participe do sorteio oficial da semana! Aberto a todos os jogadores dos servidores do Rubinot.',
  world: 'Todos os Mundos',
  eligibility: 'ALL', // 'ALL' | 'GUILD' | 'VIP'
  min_level: 0,
  winners_count: 1,
  status: 'OPEN', // 'OPEN' | 'DRAWING' | 'FINISHED'
  created_at: new Date().toISOString(),
  created_by: 'Administração Battle Storm',
  participants: [
    { id: 'p1', name: 'Chikungunha Mlk Conquista', world: 'Auroria', level: 2747, vocation: 'Elder Druid', entered_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'p2', name: 'Iury The King', world: 'Auroria', level: 2666, vocation: 'Elite Knight', entered_at: new Date(Date.now() - 3000000).toISOString() },
    { id: 'p3', name: 'Don Ems', world: 'Auroria', level: 2658, vocation: 'Master Sorcerer', entered_at: new Date(Date.now() - 2500000).toISOString() },
    { id: 'p4', name: 'Deco Mlk Conquista', world: 'Auroria', level: 2382, vocation: 'Royal Paladin', entered_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 'p5', name: 'Renato Surreal', world: 'Auroria', level: 2463, vocation: 'Elder Druid', entered_at: new Date(Date.now() - 1200000).toISOString() }
  ],
  winners: []
};

export default function GiveawayDraw({ isAdmin, user, profile, onNavigate }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history' | 'admin'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundFX.isEnabled());

  // Estado do sorteio (armazenado em app_settings id 99)
  const [giveaway, setGiveaway] = useState(DEFAULT_GIVEAWAY);
  const [history, setHistory] = useState([]);

  // Estados de inscrição pública
  const [charInput, setCharInput] = useState('');
  const [worldInput, setWorldInput] = useState('Auroria');
  const [regStatus, setRegStatus] = useState({ type: '', message: '' });
  const [searchFilter, setSearchFilter] = useState('');

  // Estados da Roleta / Sorteio ao vivo
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentDisplayedCandidate, setCurrentDisplayedCandidate] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);

  // Estados do formulário de administração
  const [adminForm, setAdminForm] = useState({
    title: '',
    prize: '',
    description: '',
    world: 'Todos os Mundos',
    eligibility: 'ALL',
    min_level: 0,
    winners_count: 1
  });
  const [manualPlayerName, setManualPlayerName] = useState('');
  const [manualPlayerWorld, setManualPlayerWorld] = useState('Auroria');

  // Carrega dados da tabela app_settings
  const fetchGiveawayData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 99)
        .maybeSingle();

      if (data && data.visible_tabs) {
        const store = data.visible_tabs;
        if (store.active_giveaway) {
          setGiveaway(store.active_giveaway);
          setAdminForm({
            title: store.active_giveaway.title || '',
            prize: store.active_giveaway.prize || '',
            description: store.active_giveaway.description || '',
            world: store.active_giveaway.world || 'Todos os Mundos',
            eligibility: store.active_giveaway.eligibility || 'ALL',
            min_level: store.active_giveaway.min_level || 0,
            winners_count: store.active_giveaway.winners_count || 1
          });
        }
        if (Array.isArray(store.history)) {
          setHistory(store.history);
        }
      } else {
        // Inicializa id 99 com o padrão se não existir
        await supabase.from('app_settings').upsert({
          id: 99,
          visible_tabs: {
            active_giveaway: DEFAULT_GIVEAWAY,
            history: []
          }
        });
        setGiveaway(DEFAULT_GIVEAWAY);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do sorteio:', err);
    } finally {
      setLoading(false);
    }
  };

  // Salva no Supabase
  const persistStore = async (newActive, newHistory) => {
    setSaving(true);
    try {
      const payload = {
        active_giveaway: newActive ?? giveaway,
        history: newHistory ?? history
      };
      await supabase.from('app_settings').upsert({
        id: 99,
        visible_tabs: payload
      });
      if (newActive) setGiveaway(newActive);
      if (newHistory) setHistory(newHistory);
    } catch (err) {
      console.error('Erro ao salvar sorteio:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchGiveawayData();

    // Subscrição em tempo real para sincronização entre todos os espectadores
    const channel = supabase
      .channel('giveaway-realtime-99')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: 'id=eq.99' }, (payload) => {
        if (payload.new && payload.new.visible_tabs) {
          const store = payload.new.visible_tabs;
          if (store.active_giveaway) setGiveaway(store.active_giveaway);
          if (Array.isArray(store.history)) setHistory(store.history);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Preenche dados do formulário de admin quando giveaway mudar
  useEffect(() => {
    if (giveaway) {
      setAdminForm({
        title: giveaway.title || '',
        prize: giveaway.prize || '',
        description: giveaway.description || '',
        world: giveaway.world || 'Todos os Mundos',
        eligibility: giveaway.eligibility || 'ALL',
        min_level: giveaway.min_level || 0,
        winners_count: giveaway.winners_count || 1
      });
      if (giveaway.winners && giveaway.winners.length > 0) {
        setSelectedWinner(giveaway.winners[0]);
      } else {
        setSelectedWinner(null);
      }
    }
  }, [giveaway]);

  // Checa se o usuário atual já está inscrito
  const userCharName = profile?.main_character || profile?.name || '';
  const isUserRegistered = giveaway.participants.some(
    p => p.name.toLowerCase() === userCharName.toLowerCase()
  );

  // Inscrição pública ou logada
  const handleRegister = async (candidateName, candidateWorld) => {
    const rawName = (candidateName || charInput).trim();
    const chosenWorld = candidateWorld || worldInput;

    if (!rawName) {
      setRegStatus({ type: 'error', message: 'Por favor, informe o nome do seu personagem.' });
      return;
    }

    if (giveaway.status !== 'OPEN') {
      setRegStatus({ type: 'error', message: 'As inscrições para esta rodada estão encerradas.' });
      return;
    }

    // Verificar se já está inscrito
    const already = giveaway.participants.some(
      p => p.name.toLowerCase() === rawName.toLowerCase()
    );
    if (already) {
      setRegStatus({ type: 'warning', message: `O personagem "${rawName}" já está inscrito nesta rodada!` });
      return;
    }

    // Validação de elegibilidade (Guild / VIP)
    if (giveaway.eligibility === 'GUILD') {
      const { data: member } = await supabase
        .from('guild_members')
        .select('name')
        .ilike('name', rawName)
        .maybeSingle();

      if (!member) {
        setRegStatus({ 
          type: 'error', 
          message: 'Este sorteio é exclusivo para membros da guilda Battle Storm.' 
        });
        return;
      }
    }

    // Buscar dados do personagem no banco (nível e vocação)
    let charLevel = 1;
    let charVoc = 'Desconhecido';

    try {
      const { data: charData } = await supabase
        .from('current_character_state')
        .select('level, vocation')
        .ilike('character_name', rawName)
        .maybeSingle();

      if (charData) {
        charLevel = charData.level || 1;
        charVoc = charData.vocation || 'Aventureiro';
      }
    } catch (e) {}

    // Validação de nível mínimo
    if (giveaway.min_level > 0 && charLevel < giveaway.min_level) {
      setRegStatus({
        type: 'error',
        message: `Nível insuficiente. O requisito mínimo desta rodada é nível ${giveaway.min_level} (Seu nível: ${charLevel}).`
      });
      return;
    }

    const newParticipant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: rawName,
      world: chosenWorld,
      level: charLevel,
      vocation: charVoc,
      entered_at: new Date().toISOString()
    };

    const updatedGiveaway = {
      ...giveaway,
      participants: [newParticipant, ...giveaway.participants]
    };

    await persistStore(updatedGiveaway);
    setCharInput('');
    setRegStatus({ 
      type: 'success', 
      message: `🎉 Inscrição confirmada com sucesso para ${rawName}! Boa sorte!` 
    });

    if (soundEnabled) soundFX.playRouletteTick(800);
  };

  // Execução do Sorteio com Roleta Animada e Suspense
  const handleExecuteDraw = async () => {
    if (giveaway.participants.length === 0) {
      alert('Não há participantes inscritos para sortear!');
      return;
    }

    const confirmed = window.confirm(
      `Confirma o início do sorteio oficial entre os ${giveaway.participants.length} participantes?`
    );
    if (!confirmed) return;

    setIsSpinning(true);
    setSelectedWinner(null);

    // Atualiza status para DRAWING
    const drawingGiveaway = { ...giveaway, status: 'DRAWING' };
    await persistStore(drawingGiveaway);

    // Efeito de roleta rápida desacelerando
    const participants = [...giveaway.participants];
    // Escolhe o vencedor aleatoriamente com alta entropia
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const officialWinner = participants[winnerIndex];

    let currentInterval = 50; // ms
    let iterations = 0;
    const maxIterations = 40; // Total de ciclos

    const spinStep = () => {
      iterations++;
      const randomCandidate = participants[Math.floor(Math.random() * participants.length)];
      setCurrentDisplayedCandidate(randomCandidate);

      if (soundEnabled) {
        soundFX.playRouletteTick(500 + (iterations * 15));
      }

      if (iterations < maxIterations) {
        // Desaceleração exponencial progressiva
        currentInterval += Math.floor(iterations * 6);
        setTimeout(spinStep, currentInterval);
      } else {
        // Chegou ao vencedor final!
        setCurrentDisplayedCandidate(officialWinner);
        setSelectedWinner(officialWinner);
        setIsSpinning(false);

        // Explosão de confetes festivos
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#eab308', '#f59e0b', '#38bdf8', '#22c55e', '#ec4899']
          });
          setTimeout(() => {
            confetti({
              particleCount: 80,
              angle: 60,
              spread: 60,
              origin: { x: 0.2, y: 0.6 }
            });
            confetti({
              particleCount: 80,
              angle: 120,
              spread: 60,
              origin: { x: 0.8, y: 0.6 }
            });
          }, 300);
        } catch (e) {}

        if (soundEnabled) {
          soundFX.playVictoryFanfare();
        }

        // Salva vencedor na rodada
        const finalWinners = [{
          ...officialWinner,
          prize: giveaway.prize,
          won_at: new Date().toISOString()
        }];

        const finishedGiveaway = {
          ...giveaway,
          status: 'FINISHED',
          winners: finalWinners
        };

        persistStore(finishedGiveaway);
      }
    };

    spinStep();
  };

  // Re-sortear (Reroll)
  const handleReroll = () => {
    handleExecuteDraw();
  };

  // Finalizar e Arquivar Rodada
  const handleArchiveRound = async () => {
    if (!selectedWinner && (!giveaway.winners || giveaway.winners.length === 0)) {
      alert('Realize o sorteio antes de arquivar a rodada!');
      return;
    }

    const confirmed = window.confirm('Deseja arquivar esta rodada no histórico de vencedores?');
    if (!confirmed) return;

    const roundToArchive = {
      ...giveaway,
      archived_at: new Date().toISOString()
    };

    const newHistory = [roundToArchive, ...history];

    // Cria nova rodada limpa
    const newActive = {
      id: `round-${Date.now()}`,
      title: 'Novo Sorteio da Comunidade',
      prize: 'Tibia Coins / KKs',
      description: 'Inscrições abertas para a próxima rodada!',
      world: 'Todos os Mundos',
      eligibility: 'ALL',
      min_level: 0,
      winners_count: 1,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      created_by: profile?.name || 'Admin',
      participants: [],
      winners: []
    };

    await persistStore(newActive, newHistory);
    setSelectedWinner(null);
    setCurrentDisplayedCandidate(null);
    alert('Rodada arquivada com sucesso! Nova rodada pronta.');
  };

  // Salvar configurações editadas pelo Admin
  const handleSaveAdminSettings = async (e) => {
    e.preventDefault();
    const updated = {
      ...giveaway,
      title: adminForm.title,
      prize: adminForm.prize,
      description: adminForm.description,
      world: adminForm.world,
      eligibility: adminForm.eligibility,
      min_level: parseInt(adminForm.min_level) || 0,
      winners_count: parseInt(adminForm.winners_count) || 1
    };
    await persistStore(updated);
    alert('Configurações do sorteio atualizadas com sucesso!');
  };

  // Alternar abertura de inscrições
  const handleToggleRegistration = async () => {
    const newStatus = giveaway.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    await persistStore({ ...giveaway, status: newStatus });
  };

  // Adição manual de participante pelo Admin
  const handleAddManualPlayer = async (e) => {
    e.preventDefault();
    if (!manualPlayerName.trim()) return;

    await handleRegister(manualPlayerName.trim(), manualPlayerWorld);
    setManualPlayerName('');
  };

  // Remover participante individual
  const handleRemoveParticipant = async (pId) => {
    const updatedList = giveaway.participants.filter(p => p.id !== pId);
    await persistStore({ ...giveaway, participants: updatedList });
  };

  // Limpar todos os participantes
  const handleClearParticipants = async () => {
    if (window.confirm('ATENÇÃO: Tem certeza que deseja zerar todos os participantes desta rodada?')) {
      await persistStore({ ...giveaway, participants: [], winners: [] });
      setSelectedWinner(null);
    }
  };

  // Toggle do som
  const toggleSound = () => {
    const newState = soundFX.toggle();
    setSoundEnabled(newState);
  };

  const filteredParticipants = giveaway.participants.filter(p => 
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.vocation && p.vocation.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (p.world && p.world.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-tibia-bg bg-tibia-pattern pb-16 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* 1. CABEÇALHO DA PÁGINA COM NAVEGAÇÃO & TOGGLE DE SOM */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-yellow-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-900/40 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shadow-lg">
                <Gift size={22} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-medieval font-bold text-tibia-highlight flex items-center gap-2">
                  Sorteios da Comunidade <span className="text-white text-lg font-sans">🎁</span>
                </h1>
                <p className="text-xs text-gray-400 font-sans">
                  Premiações oficiais, disputas transparentes e sorteios ao vivo para todo o ecossistema Rubinot.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão de Áudio */}
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold transition-all ${
                soundEnabled 
                  ? 'bg-yellow-950/40 border-yellow-500/40 text-yellow-400' 
                  : 'bg-black/40 border-white/10 text-gray-400'
              }`}
              title={soundEnabled ? 'Áudio ativado' : 'Áudio mudo'}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
            </button>

            {/* Abas */}
            <div className="flex items-center bg-black/60 border border-tibia-border rounded-xl p-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'active'
                    ? 'bg-yellow-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} /> Rodada Atual
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-yellow-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Trophy size={14} /> Histórico ({history.length})
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-red-400 hover:text-red-300'
                  }`}
                >
                  <Lock size={14} /> Painel Admin
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. ABA: RODADA ATUAL (VISUALIZAÇÃO AO VIVO) */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            
            {/* HERO CARD DO PRÊMIO */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-950/40 via-black/90 to-amber-950/40 p-6 sm:p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                {/* Detalhes do Prêmio */}
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                      giveaway.status === 'OPEN'
                        ? 'bg-green-950/60 border-green-500/50 text-green-400'
                        : giveaway.status === 'DRAWING'
                        ? 'bg-yellow-950/80 border-yellow-500 text-yellow-300 animate-pulse'
                        : 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                      {giveaway.status === 'OPEN' ? 'Inscrições Abertas' : giveaway.status === 'DRAWING' ? 'Sorteio em Andamento' : 'Rodada Concluída'}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-white/10 text-[11px] font-sans text-gray-300">
                      🌐 {giveaway.world}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-[11px] font-bold text-yellow-400">
                      {giveaway.eligibility === 'GUILD' ? '🛡️ Apenas Guilda' : giveaway.eligibility === 'VIP' ? '💎 Apenas VIP / Workers' : '🌐 Todos os Jogadores'}
                    </span>

                    {giveaway.min_level > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-950/50 border border-blue-500/40 text-[11px] text-blue-300">
                        Lvl Mínimo: {giveaway.min_level}+
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-medieval font-bold text-gradient-gold leading-tight">
                    {giveaway.title}
                  </h2>

                  <p className="text-sm text-gray-300 font-sans leading-relaxed">
                    {giveaway.description}
                  </p>

                  <div className="flex items-center gap-6 pt-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-sans font-semibold">Prêmio da Rodada</div>
                      <div className="text-2xl font-medieval font-bold text-yellow-400 flex items-center gap-2">
                        <Gift size={22} className="text-yellow-400" />
                        {giveaway.prize}
                      </div>
                    </div>

                    <div className="h-10 w-px bg-white/10" />

                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-sans font-semibold">Inscritos</div>
                      <div className="text-2xl font-medieval font-bold text-white flex items-center gap-2">
                        <Users size={22} className="text-cyan-400" />
                        {giveaway.participants.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloco de Ação / Inscrição Rápida */}
                <div className="w-full md:w-80 bg-black/80 border border-yellow-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div className="text-center mb-4">
                    <h3 className="text-base font-medieval font-bold text-white">
                      Participe do Sorteio
                    </h3>
                    <p className="text-xs text-gray-400 font-sans mt-0.5">
                      100% gratuito e aberto à comunidade
                    </p>
                  </div>

                  {user ? (
                    // Usuário Logado
                    <div className="space-y-3">
                      <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-xl p-3 text-center">
                        <div className="text-[11px] text-gray-400 font-sans">Seu Personagem:</div>
                        <div className="text-base font-bold text-yellow-300 font-medieval truncate">
                          {userCharName || 'Jogador Autenticado'}
                        </div>
                      </div>

                      {isUserRegistered ? (
                        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-950/60 border border-green-500/50 py-3 text-sm font-bold text-green-400 shadow-inner">
                          <CheckCircle2 size={18} /> Inscrito nesta Rodada!
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegister(userCharName, worldInput)}
                          disabled={giveaway.status !== 'OPEN' || saving}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 py-3 text-sm font-bold text-black shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          <UserPlus size={16} /> Confirmar Inscrição
                        </button>
                      )}
                    </div>
                  ) : (
                    // Visitante Não Logado
                    <form onSubmit={(e) => { e.preventDefault(); handleRegister(charInput, worldInput); }} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-sans text-gray-400 uppercase font-semibold mb-1">
                          Nome do Personagem
                        </label>
                        <input
                          type="text"
                          value={charInput}
                          onChange={(e) => setCharInput(e.target.value)}
                          placeholder="Ex: Chikungunha Mlk"
                          className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans text-gray-400 uppercase font-semibold mb-1">
                          Servidor
                        </label>
                        <select
                          value={worldInput}
                          onChange={(e) => setWorldInput(e.target.value)}
                          className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                        >
                          {RUBINOT_WORLDS.filter(w => w !== 'Todos os Mundos').map(w => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={giveaway.status !== 'OPEN' || saving}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 py-2.5 text-sm font-bold text-black shadow-lg transition-all active:scale-95 disabled:opacity-50"
                      >
                        <UserPlus size={16} /> Entrar no Sorteio
                      </button>
                    </form>
                  )}

                  {regStatus.message && (
                    <div className={`mt-3 p-2.5 rounded-lg text-xs font-sans text-center border ${
                      regStatus.type === 'success' 
                        ? 'bg-green-950/60 border-green-500/50 text-green-300'
                        : regStatus.type === 'warning'
                        ? 'bg-yellow-950/60 border-yellow-500/50 text-yellow-300'
                        : 'bg-red-950/60 border-red-500/50 text-red-300'
                    }`}>
                      {regStatus.message}
                    </div>
                  )}

                </div>

              </div>
            </div>

            {/* 3. MÁQUINA DE ROLETA / SUSPENSE DE SORTEIO AO VIVO */}
            {(isSpinning || selectedWinner) && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500 bg-gradient-to-b from-black via-yellow-950/30 to-black p-6 sm:p-8 shadow-2xl text-center space-y-4">
                <div className="text-xs uppercase tracking-widest font-sans font-bold text-yellow-400 animate-pulse">
                  {isSpinning ? '🎰 ROLANDO OS DADOS DA SORTE...' : '🏆 VENCEDOR OFICIAL DA RODADA'}
                </div>

                {isSpinning && currentDisplayedCandidate && (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-3xl font-bold text-yellow-300 animate-bounce shadow-tibia-glow">
                      🎲
                    </div>
                    <div className="text-3xl sm:text-4xl font-medieval font-bold text-white tracking-wide">
                      {currentDisplayedCandidate.name}
                    </div>
                    <div className="text-xs text-yellow-400/80 font-sans">
                      Lvl {currentDisplayedCandidate.level} • {currentDisplayedCandidate.vocation} • {currentDisplayedCandidate.world}
                    </div>
                  </div>
                )}

                {!isSpinning && selectedWinner && (
                  <div className="py-4 space-y-4">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-4 border-yellow-300 shadow-2xl text-black">
                      <Crown size={48} className="animate-pulse" />
                    </div>

                    <div>
                      <h3 className="text-4xl sm:text-5xl font-medieval font-bold text-gradient-gold mb-1">
                        {selectedWinner.name}
                      </h3>
                      <p className="text-sm text-gray-300 font-sans">
                        Parabéns! Ganhou: <strong className="text-yellow-400 font-bold">{giveaway.prize}</strong>
                      </p>
                      <div className="text-xs text-gray-400 mt-1 font-sans">
                        Lvl {selectedWinner.level} • {selectedWinner.vocation} • {selectedWinner.world}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                        <button
                          onClick={handleReroll}
                          className="flex items-center gap-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 text-xs font-bold transition-all shadow-md"
                        >
                          <RotateCcw size={14} /> Sortear Novamente (Reroll)
                        </button>
                        <button
                          onClick={handleArchiveRound}
                          className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-md"
                        >
                          <CheckCircle2 size={14} /> Arquivar e Iniciar Nova Rodada
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. GRADE DE PARTICIPANTES DA RODADA */}
            <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tibia-border pb-4">
                <div>
                  <h3 className="text-lg font-medieval font-bold text-white flex items-center gap-2">
                    <Users size={18} className="text-yellow-400" />
                    Participantes Confirmados ({giveaway.participants.length})
                  </h3>
                  <p className="text-xs text-gray-400 font-sans">
                    Lista em tempo real dos personagens na disputa da rodada
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar participante..."
                    className="rounded-lg bg-black/60 border border-tibia-border px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-yellow-500"
                  />

                  {isAdmin && (
                    <button
                      onClick={handleExecuteDraw}
                      disabled={isSpinning || giveaway.participants.length === 0}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 px-4 py-2 text-xs font-bold text-black shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Shuffle size={14} /> Realizar Sorteio Agora
                    </button>
                  )}
                </div>
              </div>

              {filteredParticipants.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-sans text-xs">
                  {giveaway.participants.length === 0 
                    ? 'Nenhum participante inscrito nesta rodada ainda. Seja o primeiro!' 
                    : 'Nenhum participante encontrado com o filtro pesquisado.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredParticipants.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5 hover:border-yellow-500/40 hover:bg-yellow-950/20 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors truncate">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">
                            Lvl {p.level || '?'} • {p.vocation || 'Player'} ({p.world || 'Auroria'})
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveParticipant(p.id)}
                          className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover participante"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. ABA: HISTÓRICO DE RODADAS ANTERIORES */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-tibia-border pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-medieval font-bold text-white flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-400" />
                    Hall da Fama: Vencedores de Sorteios
                  </h3>
                  <p className="text-xs text-gray-400 font-sans">
                    Registro público e transparente de todos os sorteios já realizados
                  </p>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="py-16 text-center text-gray-500 font-sans text-xs">
                  Nenhuma rodada anterior arquivada ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((round, idx) => (
                    <div
                      key={round.id || idx}
                      className="p-4 rounded-xl bg-black/60 border border-yellow-500/20 hover:border-yellow-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            {round.prize}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {round.world}
                          </span>
                        </div>
                        <h4 className="text-base font-medieval font-bold text-white">
                          {round.title}
                        </h4>
                        <div className="text-xs text-gray-400 mt-1">
                          Total de Participantes: <strong className="text-gray-200">{round.participants?.length || 0}</strong>
                        </div>
                      </div>

                      {round.winners && round.winners.length > 0 && (
                        <div className="text-left sm:text-right bg-yellow-950/30 border border-yellow-500/30 rounded-lg p-3">
                          <div className="text-[10px] uppercase font-sans text-yellow-400 font-bold flex items-center sm:justify-end gap-1">
                            <Crown size={12} /> Ganhador Oficial
                          </div>
                          <div className="text-base font-bold text-white font-medieval">
                            {round.winners[0].name}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Lvl {round.winners[0].level} • {round.winners[0].vocation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. ABA: PAINEL ADMINISTRATIVO (EXCLUSIVO ADMINS) */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            
            {/* Ações Globais do Admin */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleExecuteDraw}
                disabled={isSpinning || giveaway.participants.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 p-4 text-sm font-bold text-black shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                <Shuffle size={18} />
                <span>Realizar Sorteio Agora</span>
              </button>

              <button
                onClick={handleToggleRegistration}
                className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-bold transition-all shadow-xl ${
                  giveaway.status === 'OPEN'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 hover:bg-amber-900/60'
                    : 'bg-green-950/60 border-green-500 text-green-300 hover:bg-green-900/60'
                }`}
              >
                <Clock size={18} />
                <span>{giveaway.status === 'OPEN' ? 'Pausar / Fechar Inscrições' : 'Reabrir Inscrições'}</span>
              </button>

              <button
                onClick={handleArchiveRound}
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-950/60 border border-purple-500/50 hover:bg-purple-900/60 p-4 text-sm font-bold text-purple-300 shadow-xl transition-all"
              >
                <CheckCircle2 size={18} />
                <span>Arquivar Rodada & Iniciar Nova</span>
              </button>
            </div>

            {/* Formulário de Configuração do Sorteio */}
            <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-medieval font-bold text-white border-b border-tibia-border pb-3 flex items-center gap-2">
                <Gift size={18} className="text-yellow-400" />
                Configurar Rodada Ativa
              </h3>

              <form onSubmit={handleSaveAdminSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans text-gray-400 uppercase font-semibold mb-1">
                      Título do Sorteio
                    </label>
                    <input
                      type="text"
                      value={adminForm.title}
                      onChange={(e) => setAdminForm({ ...adminForm, title: e.target.value })}
                      className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-gray-400 uppercase font-semibold mb-1">
                      Prêmio da Rodada
                    </label>
                    <input
                      type="text"
                      value={adminForm.prize}
                      onChange={(e) => setAdminForm({ ...adminForm, prize: e.target.value })}
                      placeholder="Ex: 500 Tibia Coins / 100kk"
                      className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans text-gray-400 uppercase font-semibold mb-1">
                    Descrição & Regras
                  </label>
                  <textarea
                    value={adminForm.description}
                    onChange={(e) => setAdminForm({ ...adminForm, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-sans text-gray-400 uppercase font-semibold mb-1">
                      Servidor Alvo
                    </label>
                    <select
                      value={adminForm.world}
                      onChange={(e) => setAdminForm({ ...adminForm, world: e.target.value })}
                      className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                    >
                      {RUBINOT_WORLDS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-gray-400 uppercase font-semibold mb-1">
                      Elegibilidade
                    </label>
                    <select
                      value={adminForm.eligibility}
                      onChange={(e) => setAdminForm({ ...adminForm, eligibility: e.target.value })}
                      className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                    >
                      <option value="ALL">🌐 Todos os Jogadores (Público)</option>
                      <option value="GUILD">🛡️ Apenas Membros Battle Storm</option>
                      <option value="VIP">💎 Apenas VIPs / Workers Ativos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-gray-400 uppercase font-semibold mb-1">
                      Nível Mínimo Requerido
                    </label>
                    <input
                      type="number"
                      value={adminForm.min_level}
                      onChange={(e) => setAdminForm({ ...adminForm, min_level: e.target.value })}
                      min="0"
                      className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2.5 text-sm transition-all shadow-lg"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </form>
            </div>

            {/* Inclusão Manual & Limpeza de Participantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-xl space-y-4">
                <h4 className="text-base font-medieval font-bold text-white border-b border-tibia-border pb-2">
                  Adicionar Participante Manualmente
                </h4>
                <form onSubmit={handleAddManualPlayer} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nome do Personagem</label>
                    <input
                      type="text"
                      value={manualPlayerName}
                      onChange={(e) => setManualPlayerName(e.target.value)}
                      placeholder="Ex: King Pinga"
                      className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Servidor</label>
                    <select
                      value={manualPlayerWorld}
                      onChange={(e) => setManualPlayerWorld(e.target.value)}
                      className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white outline-none"
                    >
                      {RUBINOT_WORLDS.filter(w => w !== 'Todos os Mundos').map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold py-2 text-xs transition-all"
                  >
                    <Plus size={14} /> Inserir Participante
                  </button>
                </form>
              </div>

              <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-medieval font-bold text-red-400 border-b border-tibia-border pb-2">
                    Zona de Perigo
                  </h4>
                  <p className="text-xs text-gray-400 mt-2 font-sans">
                    Você pode limpar a lista de participantes da rodada ativa para começar do zero ou após testes.
                  </p>
                </div>
                <button
                  onClick={handleClearParticipants}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500 text-red-300 font-bold py-3 text-xs transition-all shadow-md"
                >
                  <Trash2 size={16} /> Limpar Todos os Participantes da Rodada
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
