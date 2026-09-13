import React from 'react';
import { Gem, Cpu, Sparkles, ShieldAlert, ArrowRight, CheckCircle2, MessageSquare, Zap, Lock } from 'lucide-react';

export default function PremiumGate({ 
  featureName = 'Bazaar Sniper Mega Premium', 
  featureDescription = 'O sistema definitivo de arbitragem e monitoramento de leilões do Rubinot. Detecte chares raros e oportunidades até 60% abaixo do preço de mercado antes de todo mundo.',
  onNavigate,
  onLogin
}) {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full animate-fade-in">
      {/* CABEÇALHO DO RECURSO */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 via-black/90 to-black p-8 text-center shadow-2xl backdrop-blur-md mb-8">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/10 px-4 py-1 text-xs font-bold text-yellow-400 uppercase tracking-wider mb-4 shadow-inner">
          <Gem size={14} className="text-yellow-400 animate-pulse" />
          Recurso Exclusivo Mega Premium
        </div>

        <h2 className="text-3xl sm:text-5xl font-medieval text-gradient-gold drop-shadow-md mb-4">
          {featureName}
        </h2>
        
        <p className="max-w-2xl mx-auto text-gray-300 font-sans text-sm sm:text-base leading-relaxed mb-6">
          {featureDescription}
        </p>

        {/* VANTAGENS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left mb-2">
          <div className="bg-black/60 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-yellow-400 shrink-0 mt-0.5" />
            <span className="text-xs text-gray-300">Detecção instantânea de lances abaixo do valor de revenda</span>
          </div>
          <div className="bg-black/60 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-yellow-400 shrink-0 mt-0.5" />
            <span className="text-xs text-gray-300">Filtro avançado por skills 120+, level e itens no depot</span>
          </div>
          <div className="bg-black/60 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-yellow-400 shrink-0 mt-0.5" />
            <span className="text-xs text-gray-300">Alertas em tempo real antes do encerramento do leilão</span>
          </div>
        </div>
      </div>

      {/* DOIS CAMINHOS DE DESBLOQUEIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* OPÇÃO 1: GRÁTIS COM WORKER (A GRANDE ALAVANCA) */}
        <div className="relative flex flex-col justify-between rounded-xl border-2 border-green-500/40 bg-gradient-to-b from-green-950/30 via-black/80 to-black p-6 shadow-xl transition-all hover:border-green-500/70 hover:scale-[1.01]">
          <div className="absolute top-3 right-3">
            <span className="rounded bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400">
              Mais Popular • 100% Grátis
            </span>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-green-500/50 bg-green-950/60 text-green-400 shadow-md">
                <Cpu size={26} />
              </div>
              <div>
                <h3 className="text-xl font-medieval text-green-400">Desbloquear com Worker</h3>
                <p className="text-xs text-gray-400">Ajude a rede da guilda e ganhe VIP vitalício</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 font-sans leading-relaxed mb-4">
              Instale o nosso robô oficial de telemetria em 1 clique no seu PC ou VM. Enquanto o seu worker estiver ativo varrendo o jogo, você ganha acesso <strong>100% gratuito e ilimitado</strong> ao Bazaar Sniper e a todas as ferramentas Mega Premium!
            </p>

            <ul className="space-y-2 text-xs text-gray-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-400" /> Instalador em 1 clique (leve e silencioso)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-400" /> Não interfere nos seus jogos (consome &lt;1% de CPU)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-400" /> Liberação automática imediata do Mega Premium
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('contribute')}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-600 hover:to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
          >
            <Cpu size={16} /> Baixar Worker & Liberar Grátis
            <ArrowRight size={16} />
          </button>
        </div>

        {/* OPÇÃO 2: ASSINATURA VIP (PIX / TIBIA COINS) */}
        <div className="relative flex flex-col justify-between rounded-xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/30 via-black/80 to-black p-6 shadow-xl transition-all hover:border-yellow-500/70 hover:scale-[1.01]">
          <div className="absolute top-3 right-3">
            <span className="rounded bg-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              Acesso Direto
            </span>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-yellow-500/50 bg-yellow-950/60 text-yellow-400 shadow-md">
                <Gem size={26} />
              </div>
              <div>
                <h3 className="text-xl font-medieval text-yellow-400">Assinatura VIP Mensal</h3>
                <p className="text-xs text-gray-400">Pague com Pix ou Tibia Coins</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 font-sans leading-relaxed mb-4">
              Não quer deixar o computador ligado com o worker? Sem problemas! Você pode assinar o acesso mensal ao <strong>Bazaar Sniper VIP</strong> e ter vantagens exclusivas de arbitragem pagando em Pix ou moedas do jogo.
            </p>

            <ul className="space-y-2 text-xs text-gray-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-yellow-400" /> Acesso direto de qualquer celular ou navegador
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-yellow-400" /> Canal VIP exclusivo no Discord de alertas em tempo real
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-yellow-400" /> Experiência 100% sem anúncios (Ad-Free)
              </li>
            </ul>
          </div>

          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 px-4 py-3 text-sm font-bold text-black shadow-lg transition-all active:scale-95"
          >
            <MessageSquare size={16} /> Falar com Admin no Discord
            <ArrowRight size={16} />
          </a>
        </div>

      </div>
    </div>
  );
}
