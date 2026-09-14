import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, ShieldAlert, 
  Sparkles, Zap, AlertTriangle, Heart, Swords, Clock, 
  Activity, Check, Copy, Maximize2, Minimize2, ChevronRight
} from 'lucide-react';

// Fases do Ciclo de Combate de Bakragore (Loop de 45 segundos)
const COMBAT_PHASES = [
  {
    name: 'DPS Livre & Posicionamento',
    startSec: 0,
    endSec: 15,
    color: 'emerald',
    badge: 'DPS Livre',
    ringAction: 'Ring de Skill / Plasma Ring',
    ekAction: 'Manter boss virado para o norte e fechar box nas raízes.',
    edAction: 'Rotação padrão de Ice Wave + Mass Healing regular.',
    msAction: 'Energy Wave + Debuff (Sap Strength / Exposed).',
    rpAction: 'Sharpshooter ativo + Diamond Arrows / Mas San.',
    speechAlert: 'Fase de dano livre. Posicione o boss.'
  },
  {
    name: 'Spawn de Raízes & Adds',
    startSec: 15,
    endSec: 25,
    color: 'amber',
    badge: 'Adds & Raízes',
    ringAction: 'Prismatic Ring / Ring de Defesa',
    ekAction: 'Exeta Amp Res urgente para puxar os adds no box.',
    edAction: 'Foco total no Sio do EK (dano aumenta 30%).',
    msAction: 'Área com Great Fireball e debuff nos adds.',
    rpAction: 'Mas San concentrado para limpar raízes.',
    speechAlert: 'Atenção: Adds e raízes nascendo!'
  },
  {
    name: 'Janela de Burst (Avatar / Utito)',
    startSec: 25,
    endSec: 35,
    color: 'purple',
    badge: 'Burst Window',
    ringAction: 'Plasma Ring / Ring de Atk',
    ekAction: 'Utito Tempo se o HP estiver estabilizado.',
    edAction: 'Strong Ice Wave + Tera Hur + Cura dupla.',
    msAction: "Ultimate Explosion / Hell's Core se aplicável.",
    rpAction: 'Gran Con + Great Spirit Potion contínua.',
    speechAlert: 'Janela de Burst! Use Avatar ou Utito!'
  },
  {
    name: '🚨 COMBO LETAL: MIASMA & CORRUPÇÃO',
    startSec: 35,
    endSec: 45,
    color: 'red',
    badge: '⚠️ HEADSHOT RISK',
    ringAction: 'MIGHT RING / STONE SKIN AMULET (SSA) AGORA!',
    ekAction: 'Might Ring + Exura Med Ico a cada turno. NÃO use Utito!',
    edAction: 'Stone Skin Amulet + Mass Healing nos turnos pares + Sio!',
    msAction: 'Might Ring + Exura Vita constante. Fique na diagonal!',
    rpAction: 'Might Ring / SSA + Great Spirit Potion a cada turno!',
    speechAlert: 'PERIGO! Troque para Might Ring ou SSA agora!'
  }
];

// Dados das Curas e Potions afetadas por Taints
const HEALING_SPELLS = [
  { name: 'Exura Sio (Elder Druid)', baseMin: 1200, baseMax: 1700, icon: '🌿' },
  { name: 'Mass Healing (Exura Gran Mas Res)', baseMin: 800, baseMax: 1200, icon: '✨' },
  { name: 'Exura Gran San (Royal Paladin)', baseMin: 700, baseMax: 1050, icon: '🏹' },
  { name: 'Exura Med Ico (Elite Knight)', baseMin: 450, baseMax: 700, icon: '🛡️' },
  { name: 'Exura Vita (Mage)', baseMin: 900, baseMax: 1400, icon: '🔮' },
  { name: 'Ultimate Health Potion (UHP)', baseMin: 750, baseMax: 750, icon: '🧪' },
  { name: 'Supreme Health Potion (SHP)', baseMin: 1000, baseMax: 1000, icon: '🧪' }
];

export default function BakragoreCombatTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [totalFightSec, setTotalFightSec] = useState(0);
  const [selectedVocation, setSelectedVocation] = useState('Knight');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [taintLevel, setTaintLevel] = useState(3);
  const [focusMode, setFocusMode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Audio Context Ref
  const audioCtxRef = useRef(null);
  const lastSecondRef = useRef(-1);

  // Inicializa o Audio Context sob demanda
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Tocar Bip Sintetizado
  const playTone = (freq = 880, type = 'sine', duration = 0.12, gainVal = 0.15) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone error', e);
    }
  };

  // Falar alerta em voz alta
  const speakAlert = (text) => {
    if (!speechEnabled) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'pt-BR';
        utter.rate = 1.15;
        utter.volume = 0.9;
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      console.warn('Speech synthesis error', e);
    }
  };

  // Ciclo atual (45 segundos)
  const cycleSec = elapsedSec % 45;
  const currentPhase = useMemo(() => {
    return COMBAT_PHASES.find(p => cycleSec >= p.startSec && cycleSec < p.endSec) || COMBAT_PHASES[0];
  }, [cycleSec]);

  const secUntilNextPhase = currentPhase.endSec - cycleSec;
  const isDangerPhase = currentPhase.badge.includes('HEADSHOT');

  // Efeito do Timer
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSec(prev => prev + 1);
        setTotalFightSec(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Alertas sonoros sincronizados a cada segundo
  useEffect(() => {
    if (!isRunning) return;
    if (lastSecondRef.current === cycleSec) return;
    lastSecondRef.current = cycleSec;

    // Alerta regressivo: 3, 2, 1 segundos antes da fase de perigo (segundos 32, 33, 34)
    if (cycleSec === 32) {
      playTone(520, 'sine', 0.1, 0.12);
    } else if (cycleSec === 33) {
      playTone(660, 'sine', 0.1, 0.15);
    } else if (cycleSec === 34) {
      playTone(880, 'sine', 0.15, 0.2);
    } 
    // ENTRADA NA FASE DE PERIGO (segundo 35)
    else if (cycleSec === 35) {
      // Sirene dupla
      playTone(1050, 'sawtooth', 0.25, 0.25);
      setTimeout(() => playTone(1320, 'sawtooth', 0.35, 0.3), 180);
      speakAlert('Troque o anel agora! Combo do Bakragore!');
    }
    // FASE DE BURST (segundo 25)
    else if (cycleSec === 25) {
      playTone(800, 'triangle', 0.2, 0.15);
      speakAlert('Janela de Burst liberada!');
    }
    // RETORNO A DPS LIVRE (segundo 0)
    else if (cycleSec === 0 && elapsedSec > 0) {
      playTone(440, 'sine', 0.15, 0.1);
    }
  }, [cycleSec, isRunning, elapsedSec]);

  const toggleRun = () => {
    getAudioContext();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSec(0);
    setTotalFightSec(0);
    lastSecondRef.current = -1;
  };

  // Penalidades de Taint
  const taintPenalties = useMemo(() => {
    const list = [
      { t: 0, heal: 0, dmg: 0 },
      { t: 1, heal: 8, dmg: 6 },
      { t: 2, heal: 18, dmg: 14 },
      { t: 3, heal: 28, dmg: 22 },
      { t: 4, heal: 40, dmg: 32 },
      { t: 5, heal: 55, dmg: 45 }
    ];
    return list[taintLevel] || list[3];
  }, [taintLevel]);

  // Formatação de minutos e segundos
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col gap-6 animate-fade-in ${focusMode ? 'fixed inset-0 z-50 bg-black/95 p-6 overflow-y-auto' : ''}`}>
      
      {/* CABEÇALHO DO CRONÔMETRO DE COMBATE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/80 border border-red-500/40 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-0.5 text-xs font-bold text-red-300 uppercase tracking-wider mb-2">
            <Clock size={13} className="text-red-400" />
            Combat Assistant 2.0 (Boss Fight)
          </div>
          <h2 className="text-2xl sm:text-3xl font-medieval text-gradient-gold flex items-center gap-2.5">
            <span>⏳ Cronômetro Tático do Bakragore</span>
          </h2>
          <p className="text-xs text-gray-300 font-sans mt-0.5">
            Bips sonoros sincronizados e rotação de anéis / magias a cada ciclo da arena.
          </p>
        </div>

        {/* CONTROLES DE ÁUDIO & FOCUS */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <button
            onClick={() => {
              getAudioContext();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              soundEnabled 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-black/60 border-white/10 text-gray-500'
            }`}
            title="Ativar/Desativar Bips Sonoros"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Bips ON' : 'Mudo'}</span>
          </button>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              speechEnabled 
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                : 'bg-black/60 border-white/10 text-gray-500'
            }`}
            title="Ativar/Desativar Voz em Português"
          >
            <span>🎙️ {speechEnabled ? 'Voz ON' : 'Voz OFF'}</span>
          </button>

          <button
            onClick={() => setFocusMode(!focusMode)}
            className="p-2.5 rounded-xl border border-white/10 bg-black/60 hover:bg-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition"
            title="Alternar Modo Foco Tela Cheia para Segundo Monitor"
          >
            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{focusMode ? 'Sair Foco' : 'Tela Cheia'}</span>
          </button>
        </div>
      </div>

      {/* DISH CENTRAL: CRONÔMETRO AO VIVO & CALLOUT VISUAL */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 shadow-2xl relative overflow-hidden ${
        isDangerPhase 
          ? 'bg-gradient-to-b from-red-950/80 via-black to-black border-red-500 animate-pulse shadow-red-600/30'
          : 'bg-gradient-to-b from-black/90 via-stone-950 to-black border-amber-500/40'
      }`}>
        
        {/* Glow de fundo */}
        <div className={`absolute inset-0 opacity-20 pointer-events-none transition-colors duration-500 ${
          isDangerPhase ? 'bg-red-600' : 'bg-amber-600'
        }`} />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* LADO ESQUERDO: RELÓGIOS & STATUS */}
          <div className="flex flex-col items-center lg:items-start gap-3 text-center lg:text-left">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isDangerPhase
                  ? 'bg-red-500/30 text-red-300 border-red-400 animate-bounce'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {currentPhase.badge}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Luta Total: <strong className="text-white">{formatTime(totalFightSec)}</strong>
              </span>
            </div>

            {/* Display Gigante do Ciclo */}
            <div className="flex items-baseline gap-4">
              <div className="text-6xl sm:text-8xl font-black font-mono tracking-tight text-white drop-shadow-lg">
                {String(45 - cycleSec).padStart(2, '0')}
                <span className="text-xl sm:text-2xl font-sans text-gray-400 font-normal ml-2">seg restantes</span>
              </div>
            </div>

            {/* Nome da Fase Atual */}
            <h3 className="text-xl sm:text-2xl font-medieval text-gradient-gold">
              {currentPhase.name}
            </h3>
            <p className="text-xs text-gray-300 max-w-md">
              Próxima transição em <strong className="text-amber-400 font-mono">+{secUntilNextPhase}s</strong>. 
              {isDangerPhase ? ' Mantenha os anéis equipados até o miasma passar!' : ' Mantenha rotação agressiva de dano.'}
            </p>

            {/* BOTÕES DE CONTROLE DO TIMER */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={toggleRun}
                className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-xl transition-all active:scale-95 ${
                  isRunning 
                    ? 'bg-amber-500 hover:bg-amber-400 text-black' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                }`}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                <span>{isRunning ? 'Pausar Cronômetro' : 'Iniciar Combate (Puxada)'}</span>
              </button>

              <button
                onClick={handleReset}
                className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-sm font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw size={16} />
                <span>Zerar</span>
              </button>
            </div>
          </div>

          {/* LADO DIREITO: CALLOUT DE ANEL & INSTRUÇÃO TÁTICA DA SUA VOCAÇÃO */}
          <div className="w-full lg:w-96 flex flex-col gap-4">
            
            {/* SELETOR DE VOCAÇÃO PARA INSTRUÇÃO DEDICADA */}
            <div className="flex items-center justify-between bg-black/60 p-2 rounded-2xl border border-white/10">
              <span className="text-[11px] font-bold text-gray-400 uppercase ml-2">Minha Vocação:</span>
              <div className="flex gap-1">
                {['Knight', 'Druid', 'Sorcerer', 'Paladin'].map(v => (
                  <button
                    key={v}
                    onClick={() => setSelectedVocation(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      selectedVocation === v 
                        ? 'bg-amber-500 text-black' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {v.slice(0, 2)}
                  </button>
                ))}
              </div>
            </div>

            {/* CALLOUT DE ANEL OBRIGATÓRIO NESTE MOMENTO */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
              isDangerPhase 
                ? 'bg-red-900/40 border-red-500 text-red-200 shadow-lg shadow-red-500/20' 
                : 'bg-black/60 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                  <ShieldAlert size={13} className={isDangerPhase ? 'text-red-400' : 'text-amber-400'} />
                  Anel Recomendado Agora:
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isDangerPhase ? 'bg-red-500 text-white font-mono' : 'bg-black/80 text-amber-300 font-mono'
                }`}>
                  {isDangerPhase ? 'ALERTA 100%' : 'NORMAL'}
                </span>
              </div>
              <div className="text-lg font-bold font-medieval text-white">
                {currentPhase.ringAction}
              </div>
            </div>

            {/* INSTRUÇÃO ESPECÍFICA DA VOCAÇÃO SELECIONADA */}
            <div className="p-4 rounded-2xl bg-black/80 border border-white/10 flex flex-col gap-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <Zap size={12} /> Ação Recomendada ({selectedVocation}):
              </span>
              <p className="text-gray-200 leading-relaxed font-sans">
                {selectedVocation === 'Knight' && currentPhase.ekAction}
                {selectedVocation === 'Druid' && currentPhase.edAction}
                {selectedVocation === 'Sorcerer' && currentPhase.msAction}
                {selectedVocation === 'Paladin' && currentPhase.rpAction}
              </p>
            </div>

          </div>

        </div>

        {/* LINHA DO TEMPO PROGRESSIVA DO CICLO (0s a 45s) */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-2">
          <div className="flex justify-between text-[11px] font-mono text-gray-400">
            <span>0s (DPS Livre)</span>
            <span>15s (Adds)</span>
            <span>25s (Burst)</span>
            <span className="text-red-400 font-bold">35s (Combo Miasma)</span>
            <span>45s (Reset)</span>
          </div>

          <div className="w-full bg-black/80 h-3 rounded-full border border-white/10 overflow-hidden relative">
            {/* Marcador de Perigo (35s a 45s) */}
            <div 
              className="absolute top-0 bottom-0 bg-red-600/30 border-l border-red-500" 
              style={{ left: `${(35/45)*100}%`, width: `${(10/45)*100}%` }}
            />
            {/* Barra de Progresso Atual */}
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                isDangerPhase ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${(cycleSec / 45) * 100}%` }}
            />
          </div>
        </div>

      </div>

      {/* SEÇÃO 2: SIMULADOR DE PENALIDADES DE TAINT & CURAS EM TEMPO REAL */}
      <div className="bg-black/80 border border-tibia-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tibia-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-red-400" /> 
              Simulador de Cura Real sob Efeito de Taint (Rotten Blood)
            </h3>
            <p className="text-xs text-gray-400">
              Veja exatamente quantos pontos de vida suas magias e potions curam na prática com cada nível de corrupção.
            </p>
          </div>

          {/* SELETOR DE NÍVEL DE TAINT (0 a 5) */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10">
            <span className="text-xs text-gray-400 font-bold px-2 uppercase">Taint:</span>
            {[0, 1, 2, 3, 4, 5].map(lvl => (
              <button
                key={lvl}
                onClick={() => setTaintLevel(lvl)}
                className={`w-8 h-8 rounded-xl font-bold text-xs transition ${
                  taintLevel === lvl 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-400'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* METRICS STRIP DE TAINT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-black/60 border border-white/10 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Nível de Corrupção</span>
            <span className="text-xl font-bold font-mono text-white">Taint {taintLevel}</span>
            <span className="text-xs text-gray-400 block mt-0.5">
              {taintLevel === 0 ? 'Sem penalidade ativa' : `Afetando toda a arena`}
            </span>
          </div>

          <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-red-400 block">Corte no Healing</span>
            <span className="text-xl font-bold font-mono text-red-400">-{taintPenalties.heal}%</span>
            <span className="text-xs text-gray-400 block mt-0.5">Potions e Sio curam menos</span>
          </div>

          <div className="bg-yellow-950/30 border border-yellow-500/30 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-yellow-400 block">Amplificação de Dano Sofrido</span>
            <span className="text-xl font-bold font-mono text-yellow-400">+{taintPenalties.dmg}%</span>
            <span className="text-xs text-gray-400 block mt-0.5">De todos os monstros e bosses</span>
          </div>
        </div>

        {/* TABELA DE CURA REAL COMPARATIVA */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-black/60 text-gray-400 uppercase text-[10px] font-bold border-b border-white/10">
              <tr>
                <th className="py-3 px-3">Feitiço / Potion</th>
                <th className="py-3 px-3">Cura Normal (Taint 0)</th>
                <th className="py-3 px-3 text-red-400">Cura Efetiva (Taint {taintLevel})</th>
                <th className="py-3 px-3 text-right">Perda de Cura por Turno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {HEALING_SPELLS.map((spell, idx) => {
                const normalAvg = Math.round((spell.baseMin + spell.baseMax) / 2);
                const effectiveAvg = Math.round(normalAvg * (1 - taintPenalties.heal / 100));
                const loss = normalAvg - effectiveAvg;
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                      <span>{spell.icon}</span>
                      <span>{spell.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-300">
                      ~{normalAvg} HP
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      ~{effectiveAvg} HP
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-red-400">
                      -{loss} HP (-{taintPenalties.heal}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
