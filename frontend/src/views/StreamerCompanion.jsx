import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Crosshair, Shield, Volume2, VolumeX, Maximize2, Minimize2, 
  Copy, Check, Clock, Skull, Swords, Timer, Zap, AlertTriangle, 
  RefreshCw, LayoutGrid, Columns, Coins, Play, Pause, RotateCcw, 
  ChevronRight, ExternalLink, Sparkles, User, Bell
} from 'lucide-react';
import { useWorld, WORLDS_LIST } from '../context/WorldContext';
import { soundFX } from '../lib/soundEffects';
import { supabase } from '../lib/supabase';
import AdBanner from '../components/AdBanner';

export default function StreamerCompanion({ onNavigate, onPlayerClick }) {
  const { activeWorld, setActiveWorld } = useWorld();
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' ou 'slim'
  const [audioEnabled, setAudioEnabled] = useState(soundFX.enabled);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedExiva, setCopiedExiva] = useState(null);

  // Relógio e Server Save
  const [currentTime, setCurrentTime] = useState(new Date());

  // Radar de Inimigos / Hunteds
  const [huntedList, setHuntedList] = useState([]);
  const [onlineEnemies, setOnlineEnemies] = useState([]);
  const [loadingRadar, setLoadingRadar] = useState(true);

  // Live War Ticker
  const [recentFrags, setRecentFrags] = useState([]);
  const [loadingFrags, setLoadingFrags] = useState(true);

  // Cronômetros de Respawns Ativos
  const [respawnTimers, setRespawnTimers] = useState([
    { id: 'rotten', name: 'Rotten Blood (Jaded Roots)', holder: 'Seu Time', totalSeconds: 7200, remainingSeconds: 4320, isRunning: true },
    { id: 'soulwar', name: 'Soul War (Rotten Wasteland)', holder: 'Time Rival', totalSeconds: 7200, remainingSeconds: 1280, isRunning: true },
    { id: 'cobras', name: 'Cobra Bastion', holder: 'Livre em breve', totalSeconds: 7200, remainingSeconds: 240, isRunning: true }
  ]);

  // Mini Calculadora de TC
  const [calcTc, setCalcTc] = useState(250);
  const [goldPerTc, setGoldPerTc] = useState(45); // 45k por TC no RubinOT
  const [brlPerTc, setBrlPerTc] = useState(0.20);

  // Atualização do Relógio a cada 1 segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      // Decrementar cronômetros de respawns ativos
      setRespawnTimers(prev => prev.map(t => {
        if (!t.isRunning || t.remainingSeconds <= 0) return t;
        const newRemaining = t.remainingSeconds - 1;
        // Alerta sonoro quando faltam exatamente 5 minutos (300 segundos)
        if (newRemaining === 300 && audioEnabled) {
          soundFX.playTacticalPing();
        }
        return { ...t, remainingSeconds: newRemaining };
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [audioEnabled]);

  // Contagem regressiva para o Server Save (05:00 BRT / 10:00 CEST)
  const serverSaveCountdown = useMemo(() => {
    const now = currentTime;
    const nextSs = new Date(now);
    nextSs.setHours(5, 0, 0, 0);
    if (now >= nextSs) {
      nextSs.setDate(nextSs.getDate() + 1);
    }
    const diff = Math.max(0, Math.floor((nextSs - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [currentTime]);

  // Carregar Inimigos e Frags
  const loadCompanionData = async () => {
    setLoadingRadar(true);
    setLoadingFrags(true);
    try {
      // 1. Inimigos / Hunteds
      const { data: hunteds } = await supabase
        .from('character_radar')
        .select('*')
        .eq('world_name', activeWorld)
        .order('last_seen', { ascending: false })
        .limit(10);

      if (hunteds && hunteds.length > 0) {
        setOnlineEnemies(hunteds);
      } else {
        // Mock seguro para demonstração se a tabela estiver vazia
        setOnlineEnemies([
          { id: 1, character_name: 'Lord Valmor', level: 984, vocation: 'Elite Knight', guild_name: 'Predators', is_online: true, last_seen: 'Agora' },
          { id: 2, character_name: 'Dark Shaman', level: 840, vocation: 'Elder Druid', guild_name: 'Predators', is_online: true, last_seen: 'Há 2m' },
          { id: 3, character_name: 'Shadow Arrow', level: 760, vocation: 'Royal Paladin', guild_name: 'Inimigos', is_online: false, last_seen: 'Há 14m' }
        ]);
      }

      // 2. Frags Recentes da Guerra
      const { data: frags } = await supabase
        .from('war_kills')
        .select('*')
        .eq('world_name', activeWorld)
        .order('killed_at', { ascending: false })
        .limit(8);

      if (frags && frags.length > 0) {
        setRecentFrags(frags);
      } else {
        setRecentFrags([
          { id: 101, victim_name: 'Xande Slayer', victim_level: 810, killer_name: 'Blood Knight', killer_guild: 'Invictus', time_ago: 'Há 3 min', world_name: activeWorld },
          { id: 102, victim_name: 'Druid da Massa', victim_level: 690, killer_name: 'Sniper Pro', killer_guild: 'Invictus', time_ago: 'Há 8 min', world_name: activeWorld },
          { id: 103, victim_name: 'Gargoyle Tank', victim_level: 920, killer_name: 'Mage Supremo', killer_guild: 'Rivalidade', time_ago: 'Há 15 min', world_name: activeWorld }
        ]);
      }
    } catch (err) {
      console.warn('Erro ao carregar companion data:', err);
    } finally {
      setLoadingRadar(false);
      setLoadingFrags(false);
    }
  };

  useEffect(() => {
    loadCompanionData();
    const interval = setInterval(loadCompanionData, 30000); // Polling a cada 30 segundos
    return () => clearInterval(interval);
  }, [activeWorld]);

  // Alternar Áudio
  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    soundFX.enabled = nextState;
    setAudioEnabled(nextState);
    if (nextState) {
      soundFX.playTacticalPing();
    }
  };

  // Alternar Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Copiar Exiva
  const handleCopyExiva = (charName) => {
    const cmd = `exiva "${charName}"`;
    navigator.clipboard.writeText(cmd);
    setCopiedExiva(charName);
    if (audioEnabled) soundFX.playTacticalPing();
    setTimeout(() => setCopiedExiva(null), 2000);
  };

  // Adicionar Timer Rápido de Respawn
  const handleAddTimer = (name, hours = 2) => {
    const newTimer = {
      id: String(Date.now()),
      name,
      holder: 'Seu Time',
      totalSeconds: hours * 3600,
      remainingSeconds: hours * 3600,
      isRunning: true
    };
    setRespawnTimers(prev => [newTimer, ...prev]);
  };

  const handleToggleTimer = (id) => {
    setRespawnTimers(prev => prev.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t));
  };

  const handleResetTimer = (id) => {
    setRespawnTimers(prev => prev.map(t => t.id === id ? { ...t, remainingSeconds: t.totalSeconds, isRunning: true } : t));
  };

  const formatSeconds = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#060608] text-gray-100 p-3 sm:p-5 flex flex-col gap-4 font-sans select-none">
      
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR ULTRA-COMPACTA (HUD HEADER)                                 */}
      {/* ========================================================================= */}
      <header className="bg-black/90 border border-yellow-500/40 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
        
        {/* Identificação e Relógio */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-sm sm:text-base font-medieval text-yellow-400 font-bold tracking-wider flex items-center gap-1.5">
              <Crosshair size={16} className="text-red-400" />
              Gamer Companion • HUD
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-xs">
            <span className="text-gray-400 font-mono">
              {currentTime.toLocaleTimeString('pt-BR')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 font-mono">
              SS em: {serverSaveCountdown}
            </span>
          </div>
        </div>

        {/* Seletor de Mundo & Controles do HUD */}
        <div className="flex items-center gap-2">
          
          {/* Seletor de Mundo */}
          <select
            value={activeWorld}
            onChange={(e) => setActiveWorld(e.target.value)}
            className="bg-black/90 border border-tibia-border rounded-xl px-2.5 py-1 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
          >
            {WORLDS_LIST.map(w => (
              <option key={w.id} value={w.id}>Mundo: {w.name}</option>
            ))}
          </select>

          {/* Alternador de Layout (Grid vs Slim) */}
          <button
            onClick={() => setLayoutMode(prev => prev === 'grid' ? 'slim' : 'grid')}
            title={layoutMode === 'grid' ? 'Mudar para Barra Lateral Slim' : 'Mudar para Grid de Monitor'}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all text-xs flex items-center gap-1"
          >
            {layoutMode === 'grid' ? <Columns size={14} /> : <LayoutGrid size={14} />}
            <span className="hidden md:inline">{layoutMode === 'grid' ? 'Slim' : 'Grid'}</span>
          </button>

          {/* Áudio Toggle */}
          <button
            onClick={handleToggleAudio}
            title={audioEnabled ? 'Desativar Alarme Sonoro' : 'Ativar Alarme Sonoro de PKs'}
            className={`p-1.5 rounded-xl border transition-all ${
              audioEnabled 
                ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                : 'bg-white/5 border-white/10 text-gray-500'
            }`}
          >
            {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            title="Tela Cheia"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

        </div>

      </header>

      {/* ========================================================================= */}
      {/* CORPO DO HUD: MODO GRID OU MODO BARRA SLIM                                */}
      {/* ========================================================================= */}
      <div className={`grid gap-4 flex-1 ${
        layoutMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1 max-w-md mx-auto w-full'
      }`}>
        
        {/* ======================================================================= */}
        {/* WIDGET 1: RADAR DE INIMIGOS & HUNTEDS COM 1-CLIQUE EXIVA               */}
        {/* ======================================================================= */}
        <div className="bg-black/85 border border-red-500/40 rounded-2xl p-4 flex flex-col gap-3 shadow-xl relative overflow-hidden">
          
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <Crosshair size={13} /> Radar Inimigo ({onlineEnemies.filter(e => e.is_online).length} Online)
              </h2>
            </div>

            <button
              onClick={() => soundFX.playEnemyAlert()}
              className="text-[10px] text-gray-400 hover:text-red-400 flex items-center gap-1"
              title="Testar som de alerta"
            >
              <Bell size={11} /> Testar Alarme
            </button>
          </div>

          {/* Lista de Inimigos Detectados */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-1">
            {loadingRadar ? (
              <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                <RefreshCw size={18} className="animate-spin text-red-400" />
                Varrendo mundo {activeWorld}...
              </div>
            ) : onlineEnemies.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Nenhum inimigo detectado online no momento.
              </div>
            ) : (
              onlineEnemies.map(enemy => (
                <div 
                  key={enemy.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    enemy.is_online 
                      ? 'bg-red-950/30 border-red-500/50 shadow-sm' 
                      : 'bg-black/50 border-white/5 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${enemy.is_online ? 'bg-green-400' : 'bg-gray-600'}`} />
                      <span className="text-xs font-bold text-gray-200">
                        {enemy.character_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Lvl {enemy.level} • {enemy.vocation} • <strong className="text-red-300">{enemy.guild_name}</strong>
                    </p>
                  </div>

                  {/* Botão de 1-Clique Exiva */}
                  <button
                    onClick={() => handleCopyExiva(enemy.character_name)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 shrink-0 ${
                      copiedExiva === enemy.character_name
                        ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                        : 'bg-white/10 hover:bg-yellow-500 hover:text-black text-gray-200'
                    }`}
                    title="Copiar exiva para o clipboard"
                  >
                    {copiedExiva === enemy.character_name ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedExiva === enemy.character_name ? 'Copiado!' : 'Exiva'}</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-white/10 text-[10px] text-gray-400 flex items-center justify-between">
            <span>💡 Clique em Exiva e use Ctrl+V in-game</span>
            <button 
              onClick={() => onNavigate && onNavigate('radar')}
              className="text-yellow-400 hover:underline flex items-center gap-0.5"
            >
              Abrir Radar Completo <ChevronRight size={10} />
            </button>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* WIDGET 2: CRONÔMETROS DE RESPAWNS & BOSSES (2H CLAIMS)                 */}
        {/* ======================================================================= */}
        <div className="bg-black/85 border border-yellow-500/40 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
          
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Timer size={14} className="text-yellow-400" />
              <h2 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                Timers de Respawns & Hunts
              </h2>
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <button 
                onClick={() => handleAddTimer('Nagas Marapur', 2)}
                className="px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25"
              >
                + Nagas
              </button>
              <button 
                onClick={() => handleAddTimer('Asuras Mirror', 2)}
                className="px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25"
              >
                + Asuras
              </button>
            </div>
          </div>

          {/* Lista de Timers Ativos */}
          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[380px] pr-1">
            {respawnTimers.map(timer => {
              const percent = Math.round((timer.remainingSeconds / timer.totalSeconds) * 100);
              const isEndingSoon = timer.remainingSeconds <= 300; // Últimos 5 min

              return (
                <div 
                  key={timer.id}
                  className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                    isEndingSoon 
                      ? 'bg-red-950/40 border-red-500/80 animate-pulse' 
                      : 'bg-black/60 border-tibia-border'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-gray-200">{timer.name}</h4>
                      <span className="text-[10px] text-gray-400">Claim: {timer.holder}</span>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-mono font-bold ${
                        isEndingSoon ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {formatSeconds(timer.remainingSeconds)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        isEndingSoon ? 'bg-red-500' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Controles do Timer */}
                  <div className="flex justify-end gap-1.5 pt-1 text-[10px]">
                    <button
                      onClick={() => handleToggleTimer(timer.id)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1"
                    >
                      {timer.isRunning ? <Pause size={10} /> : <Play size={10} />}
                      {timer.isRunning ? 'Pausar' : 'Continuar'}
                    </button>
                    <button
                      onClick={() => handleResetTimer(timer.id)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1"
                    >
                      <RotateCcw size={10} /> Reset 2h
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ======================================================================= */}
        {/* WIDGET 3: LIVE WAR FEED TICKER & CONVERSOR EXPRESS                     */}
        {/* ======================================================================= */}
        <div className="bg-black/85 border border-tibia-border rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-xl">
          
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Swords size={14} className="text-red-400" />
                <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Mural de Mortes ao Vivo
                </h2>
              </div>
              <span className="text-[10px] text-gray-400">Tempo Real</span>
            </div>

            {/* Ticker de Frags */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[190px] pr-1">
              {recentFrags.map(frag => (
                <div key={frag.id} className="p-2 bg-black/60 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Skull size={13} className="text-red-500 shrink-0" />
                    <div>
                      <span className="font-bold text-gray-200">{frag.victim_name}</span>
                      <span className="text-[10px] text-gray-400 block">Lvl {frag.victim_level}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-yellow-400 font-bold block">{frag.killer_name}</span>
                    <span className="text-[9px] text-gray-500">{frag.time_ago}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Conversor In-Game (TC <-> Gold <-> BRL) */}
          <div className="bg-black/60 border border-tibia-border p-3 rounded-xl flex flex-col gap-2">
            <span className="text-[10px] font-bold text-yellow-400 uppercase flex items-center gap-1">
              <Coins size={12} /> Conversor Rápido de Tibia Coins
            </span>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-gray-400 block">TC:</span>
                <input
                  type="number"
                  value={calcTc}
                  onChange={(e) => setCalcTc(parseInt(e.target.value) || 0)}
                  className="w-full bg-black border border-tibia-border rounded px-1.5 py-1 text-yellow-400 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <span className="text-[9px] text-gray-400 block">Gold (kk):</span>
                <div className="bg-black border border-white/5 rounded px-1.5 py-1 font-mono text-green-400 font-bold text-xs">
                  {((calcTc * goldPerTc) / 1000).toFixed(1)} kk
                </div>
              </div>

              <div>
                <span className="text-[9px] text-gray-400 block">Real (BRL):</span>
                <div className="bg-black border border-white/5 rounded px-1.5 py-1 font-mono text-emerald-400 font-bold text-xs">
                  R$ {(calcTc * brlPerTc).toFixed(1)}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Banner de Anúncios AdSense */}
      <AdBanner slot="streamer_companion_footer" format="horizontal" />
    </div>
  );
}
