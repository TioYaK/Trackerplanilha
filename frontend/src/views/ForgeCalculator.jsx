import React, { useState, useMemo } from 'react';
import { Hammer, Sparkles, AlertTriangle, ShieldCheck, Flame, Zap, Award, RefreshCw, TrendingUp } from 'lucide-react';

const FORGE_DATA = {
  4: {
    name: 'Classe 4 (Endgame / BiS)',
    description: 'Armas e equipamentos Soul, Falcon, Cobra, Naga e Sanguine.',
    basePrices: { 1: 8000000, 2: 20000000, 3: 40000000, 4: 65000000, 5: 100000000 },
    dustCosts: { 1: 100, 2: 250, 3: 500, 4: 1000, 5: 2000 },
    sliverCosts: { 1: 5, 2: 12, 3: 25, 4: 50, 5: 100 },
    coreCosts: { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 },
  },
  3: {
    name: 'Classe 3 (Equipamentos Altos)',
    description: 'Itens de destruição, Lion, itens Umbral e similares.',
    basePrices: { 1: 4000000, 2: 10000000, 3: 20000000, 4: 35000000, 5: 55000000 },
    dustCosts: { 1: 75, 2: 180, 3: 360, 4: 750, 5: 1500 },
    sliverCosts: { 1: 4, 2: 9, 3: 18, 4: 36, 5: 75 },
    coreCosts: { 1: 1, 2: 2, 3: 3, 4: 6, 5: 12 },
  },
  2: {
    name: 'Classe 2 (Equipamentos Médios)',
    description: 'Master Archer\'s Armor, Blade of Corruption, Prismatic Armor, etc.',
    basePrices: { 1: 1000000, 2: 3000000, 3: 7500000, 4: 15000000, 5: 30000000 },
    dustCosts: { 1: 40, 2: 100, 3: 200, 4: 450, 5: 900 },
    sliverCosts: { 1: 2, 2: 4, 3: 8, 4: 18, 5: 35 },
    coreCosts: { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 },
  },
  1: {
    name: 'Classe 1 (Equipamentos Básicos)',
    description: 'Knight Armor, Crown Helmet, Fire Sword, Demon Shield, etc.',
    basePrices: { 1: 250000, 2: 750000, 3: 2000000, 4: 4000000, 5: 8000000 },
    dustCosts: { 1: 20, 2: 50, 3: 100, 4: 200, 5: 400 },
    sliverCosts: { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 },
    coreCosts: { 1: 1, 2: 1, 3: 2, 4: 3, 5: 5 },
  }
};

const TIER_BONUSES = [
  {
    type: 'Onslaught (Armas)',
    icon: '⚔️',
    color: 'text-red-400 border-red-500/30 bg-red-950/20',
    desc: 'Chance de desferir um Golpe Fatal causando 60% a mais de dano crítico.',
    tiers: {
      1: '0.50% chance (+60% crit)',
      2: '1.05% chance (+60% crit)',
      3: '1.70% chance (+60% crit)',
      4: '2.45% chance (+60% crit)',
      5: '3.30% chance (+60% crit)',
    }
  },
  {
    type: 'Ruse (Armaduras)',
    icon: '🛡️',
    color: 'text-blue-400 border-blue-500/30 bg-blue-950/20',
    desc: 'Chance de esquivar completamente de qualquer golpe físico ou mágico letal.',
    tiers: {
      1: '1.00% esquiva total',
      2: '2.10% esquiva total',
      3: '3.30% esquiva total',
      4: '4.60% esquiva total',
      5: '6.00% esquiva total',
    }
  },
  {
    type: 'Momentum (Capacetes)',
    icon: '⚡',
    color: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20',
    desc: 'Chance de acelerar e resetar o cooldown de magias ativas em 2 segundos.',
    tiers: {
      1: '2.00% chance de reset',
      2: '4.10% chance de reset',
      3: '6.30% chance de reset',
      4: '8.60% chance de reset',
      5: '11.00% chance de reset',
    }
  },
  {
    type: 'Transcendence (Pernas)',
    icon: '✨',
    color: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
    desc: 'Chance de carregar a transformação do Avatar e reduzir dano recebido.',
    tiers: {
      1: '0.10% proc de Avatar',
      2: '0.22% proc de Avatar',
      3: '0.36% proc de Avatar',
      4: '0.52% proc de Avatar',
      5: '0.70% proc de Avatar',
    }
  }
];

export default function ForgeCalculator() {
  const [selectedClass, setSelectedClass] = useState(4);
  const [forgeMode, setForgeMode] = useState('standard'); // 'standard' ou 'convergence'
  const [targetTier, setTargetTier] = useState(1);
  const [useCore, setUseCore] = useState(true);
  const [itemBaseCostKk, setItemBaseCostKk] = useState(15);
  const [corePriceKk, setCorePriceKk] = useState(1.8);
  const [sliverPriceK, setSliverPriceK] = useState(250);

  const [simAttempts, setSimAttempts] = useState(0);
  const [simSuccesses, setSimSuccesses] = useState(0);
  const [simFailures, setSimFailures] = useState(0);
  const [simItemsLost, setSimItemsLost] = useState(0);
  const [simTotalSpentKk, setSimTotalSpentKk] = useState(0);
  const [simAnimating, setSimAnimating] = useState(false);
  const [simLastResult, setSimLastResult] = useState(null);

  const isConvergence = forgeMode === 'convergence';
  const successRate = isConvergence ? 100 : (useCore ? 80 : 65);
  const classData = FORGE_DATA[selectedClass] || FORGE_DATA[4];
  const feeGold = isConvergence 
    ? (classData.basePrices[targetTier] || 8000000) * 2 
    : (classData.basePrices[targetTier] || 8000000);
  const sliversNeeded = isConvergence 
    ? Math.max(65, (classData.sliverCosts[targetTier] || 5) * 8) 
    : (classData.sliverCosts[targetTier] || 5);
  const coresNeeded = isConvergence 
    ? Math.max(3, (classData.coreCosts[targetTier] || 1) * 2) 
    : (useCore ? (classData.coreCosts[targetTier] || 1) : 0);

  const evCalculations = useMemo(() => {
    const p = successRate / 100;
    const expectedAttempts = isConvergence ? 1 : (1 / p);
    const expectedLostSacrifices = isConvergence ? 0 : ((1 - p) / p);

    let totalGoldFeeKk = 0;
    let totalCores = 0;
    let totalSlivers = 0;

    for (let t = 1; t <= targetTier; t++) {
      const stepAttempts = isConvergence ? Math.pow(2, targetTier - t) : (Math.pow(2, targetTier - t) * (1 / p));
      const stepBaseFee = isConvergence ? ((classData.basePrices[t] || 8000000) * 2) : (classData.basePrices[t] || 8000000);
      const stepFeeKk = (stepBaseFee / 1000000) * stepAttempts;
      const stepCores = (isConvergence ? Math.max(3, (classData.coreCosts[t] || 1) * 2) : (useCore ? classData.coreCosts[t] : 0)) * stepAttempts;
      const stepSlivers = (isConvergence ? Math.max(65, (classData.sliverCosts[t] || 5) * 8) : classData.sliverCosts[t]) * stepAttempts;
      totalGoldFeeKk += stepFeeKk;
      totalCores += stepCores;
      totalSlivers += stepSlivers;
    }

    const expectedItemsTotal = isConvergence 
      ? Math.pow(2, targetTier) 
      : (Math.pow(2, targetTier) + (expectedLostSacrifices * Math.pow(2, targetTier - 1)));
    const totalItemsCostKk = expectedItemsTotal * itemBaseCostKk;
    const totalMaterialsCostKk = (totalCores * corePriceKk) + ((totalSlivers * sliverPriceK) / 1000);
    const grandTotalExpectedKk = totalGoldFeeKk + totalMaterialsCostKk + totalItemsCostKk;

    return {
      expectedAttempts: expectedAttempts.toFixed(2),
      expectedLostSacrifices: expectedLostSacrifices.toFixed(2),
      expectedItemsTotal: Math.ceil(expectedItemsTotal),
      totalGoldFeeKk: totalGoldFeeKk.toFixed(1),
      totalCores: Math.ceil(totalCores),
      totalSlivers: Math.ceil(totalSlivers),
      grandTotalExpectedKk: grandTotalExpectedKk.toFixed(1)
    };
  }, [successRate, targetTier, classData, useCore, isConvergence, corePriceKk, sliverPriceK, itemBaseCostKk]);

  const handleSimulateFusion = () => {
    if (simAnimating) return;
    setSimAnimating(true);
    setSimLastResult(null);

    setTimeout(() => {
      const roll = Math.random() * 100;
      const success = roll < successRate;

      const feeKk = feeGold / 1000000;
      const matsKk = (coresNeeded * corePriceKk) + ((sliversNeeded * sliverPriceK) / 1000);
      const sacrificeCost = success ? 0 : itemBaseCostKk;
      const spentThisRun = feeKk + matsKk + (success ? 0 : sacrificeCost);

      setSimAttempts(prev => prev + 1);
      setSimTotalSpentKk(prev => prev + spentThisRun);

      if (success) {
        setSimSuccesses(prev => prev + 1);
        setSimLastResult('success');
      } else {
        setSimFailures(prev => prev + 1);
        setSimItemsLost(prev => prev + 1);
        setSimLastResult('fail');
      }
      setSimAnimating(false);
    }, 700);
  };

  const handleResetSimulator = () => {
    setSimAttempts(0);
    setSimSuccesses(0);
    setSimFailures(0);
    setSimItemsLost(0);
    setSimTotalSpentKk(0);
    setSimLastResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn text-gray-200">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Sparkles size={16} /> Calculadora Oficial & Simulador de Bigorna
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval font-bold text-white tracking-wide drop-shadow-md">
              Forja de Exaltação <span className="text-amber-400">2.0</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-2xl">
              Calcule a matemática real (Expected Value), chances exatas de falha, poeira necessária e simule a fusão na bigorna antes de queimar seus preciosos KKs no jogo.
            </p>
          </div>

          <div className="bg-stone-900/90 border border-amber-500/40 rounded-xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Taxa de Sucesso</div>
              <div className="text-2xl font-bold text-amber-300">
                {successRate}% {useCore && <span className="text-xs text-emerald-400 font-normal">(+15% Core)</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Painel de Controles */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-stone-800 pb-3">
              <Zap size={18} /> Parâmetros da Forja
            </h2>

            {/* Modo de Fusão: Padrão vs Convergência */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Método da Bigorna
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForgeMode('standard')}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    forgeMode === 'standard'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-stone-800/60 border-stone-700 text-gray-400 hover:border-stone-600'
                  }`}
                >
                  ⚡ Fusão Tradicional (65% / 80%)
                </button>
                <button
                  type="button"
                  onClick={() => setForgeMode('convergence')}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    forgeMode === 'convergence'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-stone-800/60 border-stone-700 text-gray-400 hover:border-stone-600'
                  }`}
                >
                  ✨ Convergência (100% Sucesso)
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {forgeMode === 'convergence'
                  ? 'Garantia de 100% de sucesso sem risco de quebrar o item de sacrifício! Exige maior custo em Cores e Slivers.'
                  : 'Método padrão com risco de falha e perda do item secundário caso não tenha sucesso.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Classe do Equipamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[4, 3, 2, 1].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      selectedClass === cls
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-stone-800/60 border-stone-700 text-gray-400 hover:border-stone-600'
                    }`}
                  >
                    Classe {cls}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{classData.name}: {classData.description}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Tier Alvo Desejado
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setTargetTier(tier)}
                    className={`py-2 rounded-xl border text-center font-bold text-sm transition-all ${
                      targetTier === tier
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                        : 'bg-stone-800/60 border-stone-700 text-gray-300 hover:border-stone-500'
                    }`}
                  >
                    Tier {tier}
                  </button>
                ))}
              </div>
              <p className="text-xs text-amber-400/80 mt-1.5">
                {forgeMode === 'convergence'
                  ? `Fusão Segura: 100% de chance para Tier ${targetTier}. Nenhum item será perdido!`
                  : `Fusão: requer 2x itens de Tier ${targetTier - 1} para tentar o Tier ${targetTier}.`}
              </p>
            </div>

            {!isConvergence && (
              <div className="flex items-center justify-between p-3.5 bg-stone-800/40 rounded-xl border border-stone-700/60">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${useCore ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-700 text-gray-500'}`}>
                    💎
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-200">Usar Exalted Core</div>
                    <div className="text-xs text-gray-400">Aumenta a chance de 65% para 80%</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseCore(!useCore)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    useCore ? 'bg-amber-500 justify-end' : 'bg-stone-700 justify-start'
                  }`}
                >
                  <div className="bg-stone-900 w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-stone-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Presets Rápidos RubinOT
                </span>
                <span className="text-[10px] text-amber-400">1-Clique</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Sanguine BiS', cls: 4, cost: 180 },
                  { label: 'Soulwar', cls: 4, cost: 35 },
                  { label: 'Falcon/Naga', cls: 4, cost: 20 },
                  { label: 'Lion/Destruction', cls: 3, cost: 8 },
                  { label: 'Prismatic', cls: 2, cost: 1.5 },
                  { label: 'Knight/Crown', cls: 1, cost: 0.3 }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedClass(preset.cls);
                      setItemBaseCostKk(preset.cost);
                    }}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-[11px] font-bold text-amber-300 transition-all active:scale-95"
                  >
                    {preset.label} ({preset.cost}kk)
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-stone-800">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Preços de Mercado do seu Servidor
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Cópia do Item</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={itemBaseCostKk}
                      onChange={(e) => setItemBaseCostKk(parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-gray-500">KKs</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Exalted Core</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={corePriceKk}
                      onChange={(e) => setCorePriceKk(parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-gray-500">KKs</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">1 Sliver</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={sliverPriceK}
                      onChange={(e) => setSliverPriceK(parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-gray-500">k</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Recursos por Tentativa (Tier {targetTier})</span>
              <span className="text-amber-400 font-bold">{successRate}% sucesso</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-stone-800/60 rounded-xl p-2.5 border border-stone-700/50">
                <div className="text-[11px] text-gray-400">Taxa em Gold</div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">{(feeGold / 1000000).toFixed(1)} KK</div>
              </div>
              <div className="bg-stone-800/60 rounded-xl p-2.5 border border-stone-700/50">
                <div className="text-[11px] text-gray-400">Dust / Slivers</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">{sliversNeeded} Slivers</div>
              </div>
              <div className="bg-stone-800/60 rounded-xl p-2.5 border border-stone-700/50">
                <div className="text-[11px] text-gray-400">Exalted Cores</div>
                <div className="text-sm font-bold text-purple-300 mt-0.5">{coresNeeded}x</div>
              </div>
              <div className="bg-stone-800/60 rounded-xl p-2.5 border border-stone-700/50">
                <div className="text-[11px] text-gray-400">Item Sacrifício</div>
                <div className="text-sm font-bold text-red-300 mt-0.5">1x (T{targetTier - 1})</div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Central: Custo Médio (EV) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-stone-900/90 border-2 border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} /> Análise Probabilística Real (EV)
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Custo Médio Projetado para Tier {targetTier}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Gasto Médio Total</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-sm">
                  ~{evCalculations.grandTotalExpectedKk} <span className="text-sm font-normal text-gray-300">KKs</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div className="bg-stone-800/80 border border-stone-700/70 rounded-xl p-3.5">
                <div className="text-xs text-gray-400">Média de Tentativas</div>
                <div className="text-xl font-bold text-white mt-1">{evCalculations.expectedAttempts}x</div>
                <div className="text-[10px] text-gray-500 mt-0.5">para a fusão final</div>
              </div>

              <div className="bg-stone-800/80 border border-stone-700/70 rounded-xl p-3.5">
                <div className="text-xs text-gray-400">Itens Destruídos em Falhas</div>
                <div className="text-xl font-bold text-red-400 mt-1">{evCalculations.expectedLostSacrifices}x</div>
                <div className="text-[10px] text-gray-500 mt-0.5">média sacrificial perdida</div>
              </div>

              <div className="bg-stone-800/80 border border-stone-700/70 rounded-xl p-3.5">
                <div className="text-xs text-gray-400">Total de Cópias Base</div>
                <div className="text-xl font-bold text-amber-300 mt-1">{evCalculations.expectedItemsTotal} unidades</div>
                <div className="text-[10px] text-gray-500 mt-0.5">compradas no mercado</div>
              </div>

              <div className="bg-stone-800/80 border border-stone-700/70 rounded-xl p-3.5">
                <div className="text-xs text-gray-400">Taxa em Gold Gasta</div>
                <div className="text-xl font-bold text-yellow-400 mt-1">{evCalculations.totalGoldFeeKk} KK</div>
                <div className="text-[10px] text-gray-500 mt-0.5">paga direto na bigorna</div>
              </div>

              <div className="bg-stone-800/80 border border-stone-700/70 rounded-xl p-3.5">
                <div className="text-xs text-gray-400">Exalted Cores Médios</div>
                <div className="text-xl font-bold text-purple-400 mt-1">{evCalculations.totalCores}x Cores</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{(evCalculations.totalCores * corePriceKk).toFixed(1)} KK investidos</div>
              </div>

              <div className="bg-stone-800/80 border border-stone-700/70 rounded-xl p-3.5">
                <div className="text-xs text-gray-400">Slivers / Poeira</div>
                <div className="text-xl font-bold text-cyan-400 mt-1">{evCalculations.totalSlivers} Slivers</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{evCalculations.totalSlivers * 20} dust</div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-amber-300">Dica de Especialista:</strong> O uso de Exalted Core aumenta a chance para 80% e reduz drasticamente o risco de perder uma cópia cara do item sacrificial (como uma Falcon Greaves ou Naga Sword). Sempre vale a pena usar Cores se o item base custa mais de 5 KKs!
              </div>
            </div>
          </div>

          {/* SIMULADOR INTERATIVO */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Hammer size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Simulador Interativo da Bigorna</h3>
                  <div className="text-xs text-gray-400">Teste sua sorte antes de gastar dinheiro real no jogo</div>
                </div>
              </div>

              {simAttempts > 0 && (
                <button
                  type="button"
                  onClick={handleResetSimulator}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-colors"
                >
                  <RefreshCw size={13} /> Resetar Simulação
                </button>
              )}
            </div>

            <div className="bg-stone-950/80 border border-stone-800/80 rounded-xl p-8 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[190px]">
              <div className={`transition-transform duration-300 ${simAnimating ? 'scale-125 rotate-12' : 'scale-100'}`}>
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-2xl bg-stone-900 border-2 border-amber-500/40 flex items-center justify-center shadow-xl shadow-amber-500/10">
                    <Hammer size={32} className={`text-amber-400 ${simAnimating ? 'animate-bounce' : ''}`} />
                  </div>
                  {simAnimating && (
                    <div className="absolute inset-0 flex items-center justify-center animate-ping">
                      <Sparkles size={40} className="text-yellow-300" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 min-h-[44px] flex items-center justify-center">
                {simAnimating ? (
                  <span className="text-amber-400 font-bold text-sm animate-pulse flex items-center gap-2">
                    <Sparkles size={16} /> Martelando a bigorna... Que os deuses ajudem!
                  </span>
                ) : simLastResult === 'success' ? (
                  <div className="text-emerald-400 font-black text-lg sm:text-xl flex items-center gap-2 animate-fadeIn">
                    <ShieldCheck size={24} /> SUCESSO! Tier {targetTier} Criado com Sucesso! ✨
                  </div>
                ) : simLastResult === 'fail' ? (
                  <div className="text-red-400 font-bold text-sm sm:text-base flex items-center gap-2 animate-fadeIn">
                    <AlertTriangle size={20} /> FALHOU! O item sacrificial quebrou e virou cinzas. 💀
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Clique abaixo para forjar com {successRate}% de chance de sucesso.
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={simAnimating}
                onClick={handleSimulateFusion}
                className="mt-4 px-8 py-3 rounded-xl font-bold text-stone-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
              >
                <Hammer size={18} /> Forjar na Bigorna (Tier {targetTier})
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
              <div className="bg-stone-800/40 rounded-xl p-2.5 border border-stone-800">
                <div className="text-[11px] text-gray-400">Tentativas</div>
                <div className="text-base font-bold text-white">{simAttempts}</div>
              </div>
              <div className="bg-emerald-950/20 rounded-xl p-2.5 border border-emerald-500/30">
                <div className="text-[11px] text-emerald-400">Sucessos</div>
                <div className="text-base font-bold text-emerald-300">{simSuccesses}</div>
              </div>
              <div className="bg-red-950/20 rounded-xl p-2.5 border border-red-500/30">
                <div className="text-[11px] text-red-400">Falhas (Quebrados)</div>
                <div className="text-base font-bold text-red-300">{simFailures}</div>
              </div>
              <div className="bg-stone-800/40 rounded-xl p-2.5 border border-stone-800">
                <div className="text-[11px] text-gray-400">Gasto Simulado</div>
                <div className="text-base font-bold text-amber-400">{simTotalSpentKk.toFixed(1)} KKs</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Guia de Benefícios */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-2">
            <Award size={16} /> Guia Completo de Benefícios
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Efeitos e Bônus dos Tiers no Jogo
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Entenda exatamente o que você ganha ao forjar armas, armaduras, capacetes e pernas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIER_BONUSES.map((b, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border ${b.color} flex flex-col justify-between space-y-4`}>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{b.icon}</span>
                  <h3 className="font-bold text-white text-base">{b.type}</h3>
                </div>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                  {b.desc}
                </p>
              </div>

              <div className="bg-stone-950/60 rounded-xl p-3 space-y-1.5 border border-stone-800/60">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Valores por Tier
                </div>
                {Object.entries(b.tiers).map(([t, val]) => (
                  <div key={t} className={`flex items-center justify-between text-xs ${targetTier === parseInt(t) ? 'font-bold text-amber-300' : 'text-gray-400'}`}>
                    <span>Tier {t}:</span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
