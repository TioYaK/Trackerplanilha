import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Trophy, Clock, Gem, AlertTriangle, ShieldCheck, Award } from 'lucide-react';

const PRIZES = [
  { id: 1, label: '1 Dia VIP Mega Premium 💎', type: 'vip', days: 1, color: '#f59e0b', text: '#000000' },
  { id: 2, label: '+10 Tickets de Sorteio 🎟️', type: 'tickets', count: 10, color: '#3b82f6', text: '#ffffff' },
  { id: 3, label: '50.000 Gold Virtual 💰', type: 'gold', count: 50000, color: '#10b981', text: '#ffffff' },
  { id: 4, label: 'Destaque Ouro no Party Finder 🌟', type: 'highlight', color: '#8b5cf6', text: '#ffffff' },
  { id: 5, label: '+5 Tickets de Sorteio 🎟️', type: 'tickets', count: 5, color: '#ec4899', text: '#ffffff' },
  { id: 6, label: 'JACKPOT: 3 Dias VIP 💎💎💎', type: 'vip', days: 3, color: '#eab308', text: '#000000' },
  { id: 7, label: 'Badge: "Sortudo de Thais" 🎖️', type: 'badge', color: '#06b6d4', text: '#ffffff' },
  { id: 8, label: 'Poção da Sorte Rubinot 🍀', type: 'luck', color: '#14b8a6', text: '#ffffff' }
];

const RECENT_WINNERS = [
  { player: 'Guerrento Br', prize: '1 Dia VIP Mega Premium 💎', time: 'há 12 min' },
  { player: 'Shadow Knight', prize: '+10 Tickets de Sorteio 🎟️', time: 'há 28 min' },
  { player: 'Xantera Healer', prize: 'Destaque Ouro no Party Finder 🌟', time: 'há 1h' },
  { player: 'Vitor Sorc', prize: 'JACKPOT: 3 Dias VIP 💎💎💎', time: 'há 2h' },
  { player: 'Lord Rubinot', prize: 'Badge: "Sortudo de Thais" 🎖️', time: 'há 3h' }
];

export default function DailyRoulette() {
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [lastSpinTime, setLastSpinTime] = useState(() => {
    try {
      return parseInt(localStorage.getItem('rubinot_roulette_last_spin') || '0', 10);
    } catch (e) {
      return 0;
    }
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const cooldownHours = 24;
  const cooldownMs = cooldownHours * 3600 * 1000;
  const elapsed = now - lastSpinTime;
  const canSpin = elapsed >= cooldownMs;

  const remainingCountdown = () => {
    const diff = cooldownMs - elapsed;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  };

  const handleSpin = () => {
    if (spinning || !canSpin) return;
    setSpinning(true);
    setWonPrize(null);

    // Escolhe índice aleatório
    const targetIndex = Math.floor(Math.random() * PRIZES.length);
    const sliceAngle = 360 / PRIZES.length;
    // Gira de 5 a 8 voltas inteiras mais o deslocamento até o centro da fatia
    const totalExtraRotations = (5 + Math.floor(Math.random() * 4)) * 360;
    // O ponteiro fica no topo (270 graus ou 0 com offset)
    const targetAngle = totalExtraRotations + (360 - (targetIndex * sliceAngle) - (sliceAngle / 2));

    setRotationDegrees(prev => prev + targetAngle);

    setTimeout(() => {
      setSpinning(false);
      const prize = PRIZES[targetIndex];
      setWonPrize(prize);
      const currentNow = Date.now();
      setLastSpinTime(currentNow);
      try {
        localStorage.setItem('rubinot_roulette_last_spin', currentNow.toString());
        // Se for VIP, garante ativação no navegador
        if (prize.type === 'vip') {
          const vipDurationMs = prize.days * 24 * 3600 * 1000;
          localStorage.setItem('rubinot_vip_granted_until', (currentNow + vipDurationMs).toString());
        }
      } catch (e) {}
    }, 4500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn text-gray-200">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border border-yellow-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Gift size={16} /> Gamificação & Recompensas Diárias
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval font-bold text-white tracking-wide drop-shadow-md">
              Roleta da Fortuna <span className="text-yellow-400">Rubinot</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-2xl">
              Gire a roleta 1 vez ao dia gratuitamente e concorra a dias de VIP Mega Premium, bilhetes de sorteio para Tibia Coins, destaques de time e cosméticos exclusivos!
            </p>
          </div>

          <div className="bg-stone-900/90 border border-yellow-500/40 rounded-xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
              <Sparkles size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="text-xs text-gray-400">Status do Giro</div>
              <div className="text-base sm:text-lg font-bold text-white">
                {canSpin ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Giro Liberado!
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono text-sm">
                    {remainingCountdown()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Roleta Visual Interativa */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          
          {/* Ponteiro da Roleta */}
          <div className="relative z-30 -mb-5 flex flex-col items-center drop-shadow-lg">
            <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-yellow-400" />
          </div>

          {/* Roda da Roleta */}
          <div className="relative p-4 rounded-full bg-gradient-to-b from-stone-800 via-stone-900 to-black border-4 border-yellow-500/50 shadow-2xl shadow-yellow-500/10">
            <div
              className="w-72 h-72 sm:w-96 sm:h-96 rounded-full relative overflow-hidden transition-transform duration-[4500ms] ease-out"
              style={{
                transform: `rotate(${rotationDegrees}deg)`,
                background: 'conic-gradient(#f59e0b 0deg 45deg, #3b82f6 45deg 90deg, #10b981 90deg 135deg, #8b5cf6 135deg 180deg, #ec4899 180deg 225deg, #eab308 225deg 270deg, #06b6d4 270deg 315deg, #14b8a6 315deg 360deg)'
              }}
            >
              {PRIZES.map((p, idx) => {
                const angle = idx * 45 + 22.5;
                return (
                  <div
                    key={p.id}
                    className="absolute inset-0 flex items-start justify-center pt-4 text-center font-bold text-[11px] sm:text-xs select-none pointer-events-none drop-shadow-md"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      color: p.text
                    }}
                  >
                    <span className="transform -rotate-90 origin-bottom mt-6 sm:mt-8 block max-w-[90px] leading-tight">
                      {p.label}
                    </span>
                  </div>
                );
              })}

              {/* Miolo Central Dourado */}
              <div className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-stone-950 border-4 border-yellow-400 flex items-center justify-center shadow-inner z-20">
                <Trophy size={26} className="text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Botão de Giro */}
          <div className="mt-8 flex flex-col items-center">
            <button
              type="button"
              disabled={spinning || !canSpin}
              onClick={handleSpin}
              className={`px-10 py-4 rounded-2xl font-medieval text-lg font-bold tracking-wider transition-all shadow-xl active:scale-95 flex items-center gap-3 ${
                canSpin && !spinning
                  ? 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-stone-950 hover:brightness-110 shadow-yellow-500/30'
                  : 'bg-stone-800 border border-stone-700 text-gray-500 cursor-not-allowed opacity-70'
              }`}
            >
              <Sparkles size={22} />
              {spinning ? 'Girando a Fortuna...' : canSpin ? 'GIRAR ROLETA GRÁTIS!' : `Volte em ${remainingCountdown()}`}
            </button>

            {wonPrize && (
              <div className="mt-6 p-4 rounded-2xl bg-stone-900 border-2 border-yellow-400 text-center animate-bounce shadow-2xl max-w-sm">
                <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider">🎉 PARABÉNS! VOCÊ GANHOU:</div>
                <div className="text-lg font-black text-white mt-1">{wonPrize.label}</div>
                <div className="text-xs text-gray-400 mt-1">Recompensa ativada automaticamente no seu navegador!</div>
              </div>
            )}
          </div>

        </div>

        {/* Painel Lateral: Prêmios & Vencedores Recentes */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* O que você pode ganhar */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-yellow-400 flex items-center gap-2 border-b border-stone-800 pb-3">
              <Trophy size={18} /> Premiações Possíveis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRIZES.map(p => (
                <div key={p.id} className="bg-stone-800/60 border border-stone-700/50 rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-gray-300 font-medium">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prova Social: Vencedores Recentes */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-stone-800 pb-3">
              <Clock size={18} className="text-yellow-400" /> Últimos Vencedores
            </h3>
            <div className="space-y-3">
              {RECENT_WINNERS.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                  <div>
                    <strong className="text-amber-300">{w.player}</strong>
                    <div className="text-gray-400 text-[11px]">{w.prize}</div>
                  </div>
                  <span className="text-gray-500 text-[10px]">{w.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
