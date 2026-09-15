import React, { useState, useEffect } from 'react';
import { 
  Crown, Gem, Cpu, Shield, Sparkles, CheckCircle2, 
  Volume2, VolumeX, ExternalLink, Zap, Crosshair, Skull, 
  Bell, Swords, ArrowRight, Copy, Check, Info, HelpCircle, 
  ChevronDown, ChevronUp, Star, Radio, ShieldCheck, HeartPulse
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { soundFX } from '../lib/soundEffects';
import { getWatchlistLimits, MAX_FREE, MAX_VIP } from '../lib/watchlistService';

export default function VipPerksHub({ onNavigate, onPlayerClick }) {
  const { user, profile, isPremium, isAdmin, hasActiveWorker } = useAuth();
  
  // Estados para o Playground de Áudio Tático
  const [testingVoice, setTestingVoice] = useState(false);
  const [selectedVoiceAlert, setSelectedVoiceAlert] = useState('hunted_login');
  const [copiedPix, setCopiedPix] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const PIX_KEY = 'rubin.tracker@gmail.com';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopiedPix(true);
    soundFX.playTacticalPing();
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const playTacticalVoiceSample = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      setTestingVoice(true);
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'pt-BR';
      utter.rate = 1.05;
      utter.pitch = 1.0;
      utter.onend = () => setTestingVoice(false);
      utter.onerror = () => setTestingVoice(false);
      window.speechSynthesis.speak(utter);
      soundFX.playTacticalPing();
    } catch (e) {
      setTestingVoice(false);
    }
  };

  const watchlistStatus = getWatchlistLimits(isPremium);

  const PERKS_LIST = [
    {
      id: 'ad_free',
      title: 'Zero Anúncios (Ad-Free Global)',
      badge: '100% LIMPO',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      description: 'Navegação ultrarrápida sem banners comerciais, anúncios do Google ou popups em todas as mais de 40 ferramentas.',
      actionLabel: null,
      active: isPremium
    },
    {
      id: 'watchlist',
      title: 'Watchlist Expandida (30 Slots)',
      badge: '30 CHAIRES',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Star,
      iconColor: 'text-amber-400',
      description: `Monitore até 30 chares simultaneamente (vs 5 na versão gratuita), com alertas visuais de login e atalho rápido no cabeçalho.`,
      actionLabel: 'Ver Watchlist',
      actionView: null,
      active: isPremium
    },
    {
      id: 'bazaar_sniper',
      title: 'Bazaar Sniper 2.0 & Barbadas',
      badge: 'DEAL SCORE',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      icon: Gem,
      iconColor: 'text-yellow-400',
      description: 'Varredura automática com Deal Score de 1 a 99, cálculo de lucro líquido na revenda, precificação de itens BiS e filtro de Barbadas.',
      actionLabel: 'Abrir Bazaar Sniper',
      actionView: 'bazaar',
      active: isPremium
    },
    {
      id: 'radar_hunters',
      title: 'Radar de Inimigos & Tactical Voice',
      badge: 'VOICE HUD',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      icon: Crosshair,
      iconColor: 'text-red-400',
      description: 'Síntese de voz em tempo real no navegador anunciando quando inimigos hunted logarem ou transferirem de servidor, com exiva de 1 clique.',
      actionLabel: 'Abrir Radar Hunters',
      actionView: 'radar',
      active: isPremium
    },
    {
      id: 'maker_detect',
      title: 'Detector de Makers & Alts',
      badge: 'INTELIGÊNCIA',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: Skull,
      iconColor: 'text-indigo-400',
      description: 'Correlação avançada de co-mortes e co-frags em janelas de 3 minutos para revelar contas secundárias e makers de jogadores inimigos.',
      actionLabel: 'Investigação Pro',
      actionView: 'investigation',
      active: isPremium
    },
    {
      id: 'ehp_calc',
      title: 'Calculadora EHP Headshot Rotten Blood',
      badge: 'BURST SURVIVAL',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: HeartPulse,
      iconColor: 'text-rose-400',
      description: 'Simulador de dano combo de 1 turno contra 9 bosses letais (Bakragore, Megalomania, Murcion) com SSA, Might Ring, Avatar e Taints.',
      actionLabel: 'Abrir Calculadora EHP',
      actionView: 'hunter_toolbelt',
      active: isPremium
    },
    {
      id: 'discord_alerts',
      title: 'Discord Webhooks Ilimitados',
      badge: 'AUTOMAÇÃO',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: Bell,
      iconColor: 'text-purple-400',
      description: 'Envie notificações em tempo real para canais do seu servidor de Discord para mortes de hunteds, guerras e leilões raros.',
      actionLabel: 'Configurar Webhooks',
      actionView: 'discord_webhooks',
      active: isPremium
    },
    {
      id: 'streamer_hud',
      title: 'Streamer Companion HUD 2.0',
      badge: 'OVERLAY',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: Swords,
      iconColor: 'text-sky-400',
      description: 'Painel flutuante tático com War Feed ao vivo, cópia exiva de 1 clique e temporizador customizável de bosses com aviso de 5 minutos.',
      actionLabel: 'Abrir Streamer HUD',
      actionView: 'streamer_companion',
      active: isPremium
    }
  ];

  const FAQ_ITEMS = [
    {
      q: 'Como funciona o VIP 100% Grátis através do Worker?',
      a: 'Basta fazer o download do nosso robô oficial de telemetria na aba "Baixar Worker" e deixá-lo rodando em segundo plano no seu computador ou VPS. Ele consome menos de 1% da CPU e, enquanto estiver sincronizando dados do jogo, sua conta tem acesso irrestrito a todos os recursos VIP sem pagar nada.'
    },
    {
      q: 'Se eu não puder deixar o PC ligado, como assino o VIP direto?',
      a: 'Você pode assinar o acesso VIP mensal por apenas R$ 15,00 via Pix ou 50 Tibia Coins no jogo. Sua liberação é feita pelo suporte oficial no Discord e seu VIP fica ativo em qualquer celular, notebook ou navegador.'
    },
    {
      q: 'Os alertas de voz funcionam se eu estiver no Tibia minimizado?',
      a: 'Sim! Deixando a aba do Rubinot Tracker aberta no Chrome, Edge ou Brave, a síntese de voz nativa Web Speech falará o nome do inimigo e do boss mesmo se você estiver com o Tibia em tela cheia.'
    },
    {
      q: 'Quantos personagens posso fixar na Watchlist?',
      a: 'Usuários gratuitos podem fixar até 5 personagens. Membros VIP ou com Worker ativo podem fixar até 30 personagens com monitoramento de mortes e status online simultâneo.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
      
      {/* BANNER HERO VIP STATUS */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-br from-yellow-950/50 via-black/90 to-stone-950 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/10 px-3.5 py-1 text-xs font-bold text-yellow-400 uppercase tracking-wider shadow-inner">
              <Crown size={14} className="text-yellow-400 animate-pulse" />
              Central do Assinante VIP & Telemetria
            </div>

            <h1 className="text-3xl sm:text-5xl font-medieval font-bold text-gradient-gold drop-shadow-md leading-tight">
              Poder Tático Sem Limites
            </h1>

            <p className="text-gray-300 font-sans text-sm sm:text-base leading-relaxed">
              Desfrute da plataforma definitiva do RubinOT com zero anúncios, alertas de voz tática, algoritmos de detecção de makers e inteligência de mercado em tempo real.
            </p>
          </div>

          {/* CARD DE STATUS DO USUÁRIO */}
          <div className="w-full lg:w-auto shrink-0">
            <div className="rounded-2xl border border-yellow-500/40 bg-black/80 p-5 shadow-xl backdrop-blur-sm min-w-[280px]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono mb-2">
                Seu Status Atual
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <Shield size={22} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-red-300 font-medieval">Super Administrador</div>
                    <div className="text-[10px] text-gray-400 font-mono">Acesso Total Irrestrito 👑</div>
                  </div>
                </div>
              ) : hasActiveWorker ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400">
                    <Cpu size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-400 font-medieval">VIP Ativo (Worker 🟢)</div>
                    <div className="text-[10px] text-gray-400 font-mono">Telemetria Contribuindo</div>
                  </div>
                </div>
              ) : isPremium ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                    <Crown size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-yellow-400 font-medieval">Membro VIP Pro</div>
                    <div className="text-[10px] text-gray-400 font-mono">Assinatura Ativa 💎</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-stone-800 border border-stone-600 flex items-center justify-center text-stone-400">
                    <Shield size={22} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-300 font-medieval">Conta Básica (Free)</div>
                    <div className="text-[10px] text-yellow-400/80 font-mono">Desbloqueio Grátis Disponível</div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Watchlist:</span>
                <span className="text-yellow-400 font-bold">{watchlistStatus.count} / {watchlistStatus.max} chares</span>
              </div>

              {!isPremium && (
                <button
                  onClick={() => {
                    const el = document.getElementById('unlock-options');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} /> Ativar VIP Agora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GRADE DE RECURSOS VIP (BENTO GRID) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-medieval font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-400" />
              Matriz de Vantagens Exclusivas VIP
            </h2>
            <p className="text-xs text-gray-400 font-sans">
              Todos os recursos operam de forma integrada com a telemetria ao vivo dos 16 servidores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 text-[11px] font-mono text-yellow-400">
              {PERKS_LIST.length} de {PERKS_LIST.length} Vantagens Liberadas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERKS_LIST.map((perk) => {
            const IconComponent = perk.icon;
            return (
              <div 
                key={perk.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 bg-gradient-to-b from-stone-900/90 via-black/80 to-stone-950 p-5 shadow-lg transition-all duration-300 hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-black/60 border border-white/10 ${perk.iconColor} group-hover:scale-110 transition-transform`}>
                      <IconComponent size={20} />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border font-mono ${perk.badgeColor}`}>
                      {perk.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-medieval font-bold text-white group-hover:text-yellow-300 transition-colors">
                    {perk.title}
                  </h3>

                  <p className="text-xs text-gray-400 font-sans leading-relaxed mt-2">
                    {perk.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {isPremium ? 'Desbloqueado' : 'Incluído no VIP'}
                  </span>

                  {perk.actionLabel && (
                    <button
                      onClick={() => perk.actionView && onNavigate?.(perk.actionView)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      {perk.actionLabel}
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PLAYGROUND DE TESTE DE VOZ TÁTICA (INTERATIVO) */}
      <div className="rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-stone-950 via-neutral-900 to-stone-950 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-red-400 uppercase tracking-wider font-bold">
              <Volume2 size={15} /> Sandbox de Alertas Sonoros
            </div>
            <h2 className="text-xl sm:text-2xl font-medieval font-bold text-white">
              Teste a Síntese de Voz Tática Militar
            </h2>
            <p className="text-xs text-gray-400 font-sans">
              Ouça exatamente como o Streamer Companion e o Radar de Inimigos alertam em tempo real durante suas hunts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => soundFX.playTacticalPing()}
              className="px-3 py-2 rounded-xl bg-black/60 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Radio size={14} className="text-amber-400" /> Testar Sonar Ping
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => playTacticalVoiceSample('Atenção: Inimigo hunted Bob Slayer logou no servidor Auroria!')}
            disabled={testingVoice}
            className="p-4 rounded-xl bg-black/50 hover:bg-yellow-950/40 border border-yellow-500/20 hover:border-yellow-500/50 text-left transition-all group"
          >
            <div className="text-xs font-bold text-yellow-300 group-hover:text-yellow-200 flex items-center justify-between mb-1">
              <span>Alerta de Hunted Logado</span>
              <Volume2 size={14} className="text-yellow-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-gray-400 font-sans">
              "Atenção: Inimigo hunted Bob Slayer logou no servidor Auroria!"
            </p>
          </button>

          <button
            onClick={() => playTacticalVoiceSample('Atenção: Target eliminado em batalha! Frag registrado com sucesso.')}
            disabled={testingVoice}
            className="p-4 rounded-xl bg-black/50 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/50 text-left transition-all group"
          >
            <div className="text-xs font-bold text-red-300 group-hover:text-red-200 flex items-center justify-between mb-1">
              <span>Alerta de Frag em Guerra</span>
              <Volume2 size={14} className="text-red-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-gray-400 font-sans">
              "Atenção: Target eliminado em batalha! Frag registrado com sucesso."
            </p>
          </button>

          <button
            onClick={() => playTacticalVoiceSample('Alerta tático: Faltam 5 minutos para o respawn do Boss Bakragore!')}
            disabled={testingVoice}
            className="p-4 rounded-xl bg-black/50 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/50 text-left transition-all group"
          >
            <div className="text-xs font-bold text-rose-300 group-hover:text-rose-200 flex items-center justify-between mb-1">
              <span>Alerta de Boss Respawn</span>
              <Volume2 size={14} className="text-rose-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-gray-400 font-sans">
              "Alerta tático: Faltam 5 minutos para o respawn do Boss Bakragore!"
            </p>
          </button>
        </div>
      </div>

      {/* CAMINHOS DE DESBLOQUEIO (WORKER GRÁTIS VS ASSINATURA) */}
      <div id="unlock-options" className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-medieval font-bold text-white flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            Escolha Como Desbloquear Seu Acesso VIP
          </h2>
          <p className="text-xs text-gray-400 font-sans">
            Você pode optar pelo caminho 100% grátis colaborativo ou apoiar diretamente a infraestrutura da guilda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* OPÇÃO 1: WORKER TELEMETRIA (100% GRÁTIS) */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-green-500/40 bg-gradient-to-b from-green-950/30 via-black/80 to-black p-6 sm:p-8 shadow-xl transition-all hover:border-green-500/70">
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-green-500/20 border border-green-500/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
                100% Gratuito • Vitalício
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl border border-green-500/40 bg-green-950/60 flex items-center justify-center text-green-400 shadow-lg">
                  <Cpu size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-medieval font-bold text-green-400">Operador de Worker</h3>
                  <p className="text-xs text-gray-400 font-sans">Contribua com dados e ganhe VIP automático</p>
                </div>
              </div>

              <p className="text-xs text-gray-300 font-sans leading-relaxed mb-4">
                Instale o robô oficial de varredura do Rubinot Tracker no seu computador ou máquina virtual. Ele roda de forma invisível em background, sincroniza rankings e cotações, e ativa o seu acesso VIP instantaneamente.
              </p>

              <ul className="space-y-2 text-xs text-gray-300 font-sans mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                  <span>Consumo imperceptível (&lt;1% CPU e 25MB de RAM)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                  <span>Instalador automático em 1 clique para Windows</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                  <span>Liberação de todos os recursos VIP sem gastar nenhum centavo</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate?.('contribute')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-600 hover:to-emerald-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-950/50 transition-all hover:scale-[1.01] active:scale-95"
            >
              <Cpu size={16} />
              <span>Baixar Worker & Ativar Grátis</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* OPÇÃO 2: ASSINATURA VIP DIRETA (PIX / TIBIA COINS) */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/30 via-black/80 to-black p-6 sm:p-8 shadow-xl transition-all hover:border-yellow-500/70">
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                Acesso Direto • Sem Worker
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl border border-yellow-500/40 bg-yellow-950/60 flex items-center justify-center text-yellow-400 shadow-lg">
                  <Crown size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-medieval font-bold text-yellow-400">Assinatura Mensal VIP</h3>
                  <p className="text-xs text-gray-400 font-sans">Acesse de qualquer smartphone ou browser</p>
                </div>
              </div>

              <p className="text-xs text-gray-300 font-sans leading-relaxed mb-4">
                Ideal para quem joga em computadores compartilhados, no trabalho ou prefere praticidade sem instalar nada. O VIP fica vinculado à sua conta por 30 dias.
              </p>

              <div className="rounded-xl bg-black/60 border border-yellow-500/20 p-3 mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono text-gray-400">Valor Mensal</div>
                  <div className="text-lg font-black text-white">R$ 15,00 <span className="text-xs text-yellow-400 font-normal">ou 50 Tibia Coins</span></div>
                </div>

                <button
                  onClick={handleCopyPix}
                  className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Copiar Chave Pix"
                >
                  {copiedPix ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  <span>{copiedPix ? 'Chave Copiada!' : 'Copiar Pix'}</span>
                </button>
              </div>

              <ul className="space-y-2 text-xs text-gray-300 font-sans mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-yellow-400 shrink-0" />
                  <span>Ativação rápida via suporte oficial no Discord</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-yellow-400 shrink-0" />
                  <span>Aceitamos Pix e Tibia Coins transferíveis in-game</span>
                </li>
              </ul>
            </div>

            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 px-4 py-3.5 text-sm font-bold text-black shadow-lg shadow-yellow-950/50 transition-all hover:scale-[1.01] active:scale-95"
            >
              <Sparkles size={16} />
              <span>Chamar Suporte no Discord</span>
              <ExternalLink size={16} />
            </a>
          </div>

        </div>
      </div>

      {/* SEÇÃO FAQ (PERGUNTAS FREQUENTES) */}
      <div className="rounded-3xl border border-white/10 bg-black/60 p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-medieval font-bold text-white flex items-center gap-2">
          <HelpCircle size={18} className="text-yellow-400" />
          Perguntas Frequentes sobre o VIP
        </h3>

        <div className="divide-y divide-white/5 space-y-2">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className="pt-2 first:pt-0">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left py-2 text-xs sm:text-sm font-bold text-gray-200 hover:text-yellow-300 transition-colors"
              >
                <span>{item.q}</span>
                {openFaq === idx ? <ChevronUp size={16} className="text-yellow-400" /> : <ChevronDown size={16} className="text-gray-500" />}
              </button>

              {openFaq === idx && (
                <p className="text-xs text-gray-400 font-sans pb-3 leading-relaxed animate-fade-in">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
