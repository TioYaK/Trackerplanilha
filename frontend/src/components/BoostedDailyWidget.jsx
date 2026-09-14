import React, { useState, useEffect } from 'react';
import { getTodayBoosted } from '../data/boostedDailyData';
import { 
  Sparkles, Flame, Award, Zap, Target, Copy, Check, ChevronRight, Swords 
} from 'lucide-react';

export default function BoostedDailyWidget({ onNavigate }) {
  const [boosted, setBoosted] = useState(() => getTodayBoosted());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const data = getTodayBoosted();
      setBoosted(data);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { creature, boss, formattedCountdown } = boosted;

  const handleCopy = () => {
    const text = [
      '🔥 RubinOT: Boost Diário Ativo! 🔥',
      `🐉 Criatura: ${creature.name} (${creature.bonusText})`,
      `   • XP Boostada: ${creature.boostedExp.toLocaleString()} XP (Normal: ${creature.baseExp.toLocaleString()})`,
      `   • Melhor Elemento: ${creature.bestElement} (${creature.bestElementMultiplier})`,
      `   • Charm Recomendado: ${creature.bestCharm}`,
      `👑 Boss: ${boss.name} (${boss.location})`,
      `   • Drops Raros: ${boss.keyDrops.join(', ')}`,
      `⏳ Próxima rotação em: ${formattedCountdown} (Server Save 07:00 BRT)`,
      'Acesse: https://trackerplanilha.vercel.app'
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-stone-950 via-black/95 to-stone-950 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Glow de fundo */}
      <div className="absolute -top-16 -left-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* CABEÇALHO DO WIDGET */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-amber-400" />
            Rotação Diária RubinOT
          </div>
          <h2 className="text-2xl sm:text-3xl font-medieval font-bold text-gradient-gold flex items-center gap-2.5">
            <span>👹 Boss & Criatura Boostada</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-sans mt-0.5">
            Bônus automáticos de XP dobrada, drops raros e respawns acelerados nos 16 mundos.
          </p>
        </div>

        {/* TIMER & SHARE BUTTON */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Contador Regressivo */}
          <div className="flex items-center gap-2.5 bg-black/80 border border-amber-500/40 rounded-2xl px-4 py-2 shadow-inner">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Troca em (Server Save 07:00)
              </div>
              <div className="text-sm sm:text-base font-mono font-bold text-amber-300">
                ⏳ {formattedCountdown}
              </div>
            </div>
          </div>

          {/* Botão Copiar para Discord/WhatsApp */}
          <button
            onClick={handleCopy}
            title="Copiar bônus do dia para compartilhar no Discord ou WhatsApp"
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
            <span>{copied ? 'Copiado!' : 'Compartilhar'}</span>
          </button>
        </div>
      </div>

      {/* GRID COM OS DOIS CARDS (CRIATURA & BOSS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 relative z-10">
        
        {/* CARD 1: CRIATURA BOOSTADA */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-black/80 to-black p-5 sm:p-6 shadow-xl flex flex-col justify-between group hover:border-amber-400/70 transition-all">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Flame size={13} className="text-amber-400" /> Criatura do Dia
              </span>
              <span className="text-[11px] font-bold text-green-400 bg-green-950/40 border border-green-500/30 px-2 py-0.5 rounded-md">
                XP x2 & Loot x2
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              {/* Sprite Animado */}
              <div className="w-20 h-20 rounded-2xl bg-black/90 border-2 border-amber-500/40 flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                <img
                  src={creature.spriteUrl}
                  alt={creature.name}
                  className="max-h-16 max-w-16 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.parentNode) {
                      e.target.parentNode.innerHTML = '<span class="text-3xl">🐉</span>';
                    }
                  }}
                />
              </div>

              <div>
                <h3 className="text-2xl font-medieval font-bold text-white group-hover:text-amber-300 transition-colors">
                  {creature.name}
                </h3>
                <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <Target size={13} className="text-amber-400" /> {creature.category}
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-green-400 bg-black/60 px-2 py-0.5 rounded border border-green-500/30">
                    ⚡ {creature.boostedExp.toLocaleString()} XP
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    {creature.baseExp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            </div>

            {/* DADOS TÁTICOS */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/60 border border-white/5 text-center text-xs mb-4">
              <div>
                <span className="text-[10px] uppercase text-gray-400 block font-semibold">Fraqueza</span>
                <span className="font-bold text-cyan-300">{creature.bestElement}</span>
                <span className="text-[10px] text-cyan-400 block">{creature.bestElementMultiplier}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400 block font-semibold">Proteção</span>
                <span className="font-bold text-amber-300">{creature.bestDefense}</span>
                <span className="text-[10px] text-gray-400 block">Set ideal</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400 block font-semibold">Melhor Charm</span>
                <span className="font-bold text-purple-300">{creature.bestCharm}</span>
                <span className="text-[10px] text-purple-400 block">DPS Máximo</span>
              </div>
            </div>

            <p className="text-xs text-amber-200/80 font-sans italic mb-4">
              💡 {creature.bonusText}
            </p>
          </div>

          {/* AÇÃO DO CARD */}
          <button
            onClick={() => onNavigate && onNavigate('hunts')}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 py-2.5 px-4 text-xs font-bold text-black shadow-lg transition-all active:scale-95 group-hover:shadow-amber-500/20"
          >
            <Swords size={15} />
            <span>Localizar Respawns no Hunt Finder</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* CARD 2: BOSS BOOSTADO */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-black/80 to-black p-5 sm:p-6 shadow-xl flex flex-col justify-between group hover:border-purple-400/70 transition-all">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="rounded-lg bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                <Award size={13} className="text-purple-400" /> Boss em Destaque
              </span>
              <span className="text-[11px] font-bold text-purple-300 bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 rounded-md">
                Drop BiS Rate +++
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              {/* Sprite Animado */}
              <div className="w-20 h-20 rounded-2xl bg-black/90 border-2 border-purple-500/40 flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                <img
                  src={boss.spriteUrl}
                  alt={boss.name}
                  className="max-h-16 max-w-16 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.parentNode) {
                      e.target.parentNode.innerHTML = '<span class="text-3xl">👑</span>';
                    }
                  }}
                />
              </div>

              <div>
                <h3 className="text-2xl font-medieval font-bold text-white group-hover:text-purple-300 transition-colors">
                  {boss.name}
                </h3>
                <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <Target size={13} className="text-purple-400" /> {boss.location}
                </div>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  {boss.keyDrops.slice(0, 3).map((drop, idx) => (
                    <span key={idx} className="text-[10px] font-mono font-bold text-yellow-300 bg-black/60 px-2 py-0.5 rounded border border-yellow-500/30">
                      💎 {drop}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* DICA DE MECÂNICA */}
            <div className="p-3 rounded-xl bg-black/60 border border-purple-500/20 text-xs mb-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 uppercase mb-1">
                <Zap size={13} /> Mecânica Chave:
              </div>
              <p className="text-gray-300 font-sans leading-relaxed text-xs">
                {boss.mechanicsTip}
              </p>
            </div>

            <p className="text-xs text-purple-200/80 font-sans italic mb-4">
              ✨ {boss.bonusText}
            </p>
          </div>

          {/* AÇÃO DO CARD */}
          <button
            onClick={() => onNavigate && onNavigate(boss.bossRoute === '/rotten-blood' ? 'rotten-blood' : 'bosses')}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-2.5 px-4 text-xs font-bold text-white shadow-lg transition-all active:scale-95 group-hover:shadow-purple-500/20"
          >
            <Swords size={15} />
            <span>Ver Rota & Checklist de Bosses</span>
            <ChevronRight size={15} />
          </button>
        </div>

      </div>
    </section>
  );
}
