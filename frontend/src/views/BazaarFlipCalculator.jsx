import React, { useState, useMemo } from 'react';
import { 
  Calculator, Coins, TrendingUp, TrendingDown, DollarSign, 
  HelpCircle, ArrowRight, ShieldCheck, Flame, Gem, Sparkles, 
  AlertCircle, RefreshCw, CheckCircle2, ChevronRight, Scale
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

export default function BazaarFlipCalculator({ onNavigate }) {
  // Entradas Principais
  const [buyPriceTc, setBuyPriceTc] = useState('1200');
  const [sellPriceTc, setSellPriceTc] = useState('2500');
  const [tcRealRate, setTcRealRate] = useState('39.00'); // R$ por 250 TC

  // Upgrades Investidos
  const [exerciseWeaponsCount, setExerciseWeaponsCount] = useState('2'); // Lasting (262k gp ou 250 TC)
  const [exerciseType, setExerciseType] = useState('lasting'); // 'lasting' (250 TC) ou 'regular' (25 TC)
  const [forgedTiersAdded, setForgedTiersAdded] = useState('0'); // 0, 1, 2, 3
  const [sanguineItemsAdded, setSanguineItemsAdded] = useState('0');
  const [soulwarItemsAdded, setSoulwarItemsAdded] = useState('0');
  const [worldTransferTc, setWorldTransferTc] = useState(false); // 750 TC

  // Cálculos Financeiros
  const results = useMemo(() => {
    const buy = Math.max(0, Number(buyPriceTc) || 0);
    const sell = Math.max(0, Number(sellPriceTc) || 0);
    const ratePerTc = (Number(tcRealRate) || 39) / 250;

    // Custos adicionais
    const weaponUnitTc = exerciseType === 'lasting' ? 250 : 25;
    const weaponsCostTc = (Number(exerciseWeaponsCount) || 0) * weaponUnitTc;
    
    let forgeCostTc = 0;
    if (forgedTiersAdded === '1') forgeCostTc = 350;
    if (forgedTiersAdded === '2') forgeCostTc = 950;
    if (forgedTiersAdded === '3') forgeCostTc = 2400;

    const sanguineCostTc = (Number(sanguineItemsAdded) || 0) * 3200;
    const soulwarCostTc = (Number(soulwarItemsAdded) || 0) * 1100;
    const transferCostTc = worldTransferTc ? 750 : 0;

    const totalUpgradesCostTc = weaponsCostTc + forgeCostTc + sanguineCostTc + soulwarCostTc + transferCostTc;
    const totalInvestedTc = buy + totalUpgradesCostTc;

    // Taxa Oficial do RubinOT: 12% + 50 TC
    const rubinotFeeTc = sell > 0 ? Math.round(sell * 0.12 + 50) : 0;
    const netReceivedTc = Math.max(0, sell - rubinotFeeTc);

    // Lucro Líquido
    const netProfitTc = sell > 0 ? (netReceivedTc - totalInvestedTc) : 0;
    const roiPct = totalInvestedTc > 0 && sell > 0 ? Math.round((netProfitTc / totalInvestedTc) * 100) : 0;

    // Em Reais (R$)
    const netProfitBrl = netProfitTc * ratePerTc;
    const totalInvestedBrl = totalInvestedTc * ratePerTc;
    const netReceivedBrl = netReceivedTc * ratePerTc;

    // Preço Mínimo de Empate (Break-Even Price)
    // netReceived = sell * 0.88 - 50 = totalInvested
    // sell = (totalInvested + 50) / 0.88
    const breakEvenTc = Math.round((totalInvestedTc + 50) / 0.88);
    const breakEvenBrl = breakEvenTc * ratePerTc;

    return {
      buy,
      sell,
      ratePerTc,
      weaponsCostTc,
      forgeCostTc,
      sanguineCostTc,
      soulwarCostTc,
      transferCostTc,
      totalUpgradesCostTc,
      totalInvestedTc,
      totalInvestedBrl,
      rubinotFeeTc,
      netReceivedTc,
      netReceivedBrl,
      netProfitTc,
      netProfitBrl,
      roiPct,
      breakEvenTc,
      breakEvenBrl
    };
  }, [buyPriceTc, sellPriceTc, tcRealRate, exerciseWeaponsCount, exerciseType, forgedTiersAdded, sanguineItemsAdded, soulwarItemsAdded, worldTransferTc]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* HERO BANNER FLIP CALCULATOR */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 via-stone-950 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3 shadow-inner">
              <Coins size={14} className="text-emerald-400 animate-pulse" />
              Calculadora de Rentabilidade & Revenda de Char (Bazaar Flip)
            </div>

            <h1 className="text-3xl sm:text-5xl font-medieval text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-500 drop-shadow-lg leading-tight">
              Bazaar Flip ROI Calculator <span className="text-white">💰</span>
            </h1>
            
            <p className="text-gray-300 font-sans text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Calcule matematicamente se vale a pena comprar um personagem no Char Bazaar para upar, equipar e revender. Desconta com precisão a comissão do RubinOT (<strong className="text-white">12% + 50 TC</strong>) e projeta seu lucro líquido em TC e R$!
            </p>
          </div>

          <div className="bg-stone-900/90 border border-emerald-500/30 p-4 rounded-2xl flex flex-col gap-2 min-w-[240px] shadow-xl">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale size={14} /> Taxa Oficial RubinOT
            </span>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• <strong>12%</strong> do valor final arrematado</div>
              <div>• <strong>50 TC</strong> taxa fixa de leilão</div>
              <div>• Transferência opcional: <strong>750 TC</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD PRINCIPAL DE PROJEÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Lucro Líquido */}
        <div className={`border p-5 rounded-2xl shadow-xl transition-all relative overflow-hidden ${
          results.netProfitTc >= 0 
            ? 'bg-gradient-to-br from-emerald-950/40 via-stone-900 to-black border-emerald-500/40' 
            : 'bg-gradient-to-br from-red-950/40 via-stone-900 to-black border-red-500/40'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Lucro Líquido Estimado</span>
            {results.netProfitTc >= 0 ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
          </span>

          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl sm:text-4xl font-medieval font-black ${results.netProfitTc >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {results.netProfitTc > 0 ? '+' : ''}{results.netProfitTc.toLocaleString('pt-BR')} TC
            </span>
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${results.roiPct >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
              {results.roiPct > 0 ? '+' : ''}{results.roiPct}% ROI
            </span>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            Equivalente a: <strong className="text-white font-mono">R$ {results.netProfitBrl.toFixed(2)}</strong>
          </div>
        </div>

        {/* Card 2: Total Investido */}
        <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Custo Total Investido</span>
            <DollarSign size={16} className="text-amber-400" />
          </span>

          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-medieval font-black text-amber-300">
              {results.totalInvestedTc.toLocaleString('pt-BR')} TC
            </span>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            Preço de Compra ({results.buy} TC) + Upgrades ({results.totalUpgradesCostTc} TC)
          </div>
        </div>

        {/* Card 3: Ponto de Equilíbrio (Break-Even) */}
        <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Preço de Empate (Break-Even)</span>
            <Scale size={16} className="text-cyan-400" />
          </span>

          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-medieval font-black text-cyan-300 font-mono">
              {results.breakEvenTc.toLocaleString('pt-BR')} TC
            </span>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            Lance mínimo para cobrir compra, upgrades e comissão do RubinOT.
          </div>
        </div>

      </div>

      {/* FORMULÁRIO DE SIMULAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna Esquerda: Parâmetros de Compra, Venda e Cotação */}
        <div className="lg:col-span-6 bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator size={18} className="text-emerald-400" /> Valores do Leilão & Cotação
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                Preço de Compra do Personagem (TC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={buyPriceTc}
                  onChange={(e) => setBuyPriceTc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-yellow-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-4 top-2.5 text-xs text-gray-500 font-bold">TC</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                Preço Alvo de Venda / Arremate (TC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={sellPriceTc}
                  onChange={(e) => setSellPriceTc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-4 top-2.5 text-xs text-gray-500 font-bold">TC</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                Cotação da Tibia Coin (R$ a cada 250 TC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.50"
                  value={tcRealRate}
                  onChange={(e) => setTcRealRate(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-4 top-2.5 text-xs text-gray-500 font-bold">R$</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Upgrades & Investimentos Adicionados */}
        <div className="lg:col-span-6 bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <Sparkles size={18} /> Upgrades e Itens Investidos no Char
          </h2>

          <div className="space-y-3.5">
            {/* Exercise Weapons */}
            <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Exercise Weapons Usadas</span>
                <span className="text-[11px] text-gray-400">Treino no dummy para subir ML/Skill</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                  className="bg-stone-900 border border-stone-700 text-xs text-gray-300 rounded px-2 py-1"
                >
                  <option value="lasting">Lasting (250 TC)</option>
                  <option value="regular">Regular (25 TC)</option>
                </select>
                <input
                  type="number"
                  value={exerciseWeaponsCount}
                  onChange={(e) => setExerciseWeaponsCount(e.target.value)}
                  className="w-16 bg-stone-900 border border-stone-700 text-xs text-yellow-400 font-mono font-bold rounded px-2 py-1 text-center"
                />
              </div>
            </div>

            {/* Itens Forjados */}
            <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Forja de Exaltação Adicionada</span>
                <span className="text-[11px] text-gray-400">Arma ou armadura com Tier</span>
              </div>
              <select
                value={forgedTiersAdded}
                onChange={(e) => setForgedTiersAdded(e.target.value)}
                className="bg-stone-900 border border-stone-700 text-xs text-cyan-300 font-bold rounded px-3 py-1"
              >
                <option value="0">Sem Forja (0 TC)</option>
                <option value="1">Tier 1 (+350 TC)</option>
                <option value="2">Tier 2 (+950 TC)</option>
                <option value="3">Tier 3 (+2.400 TC)</option>
              </select>
            </div>

            {/* Itens Sanguine */}
            <div className="bg-stone-950/80 border border-red-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-red-400 block">Equipamentos Sanguine (Rotten Blood)</span>
                <span className="text-[11px] text-gray-400">Custo de compra estimado ~3.200 TC/item</span>
              </div>
              <input
                type="number"
                value={sanguineItemsAdded}
                onChange={(e) => setSanguineItemsAdded(e.target.value)}
                className="w-16 bg-stone-900 border border-stone-700 text-xs text-red-400 font-mono font-bold rounded px-2 py-1 text-center"
              />
            </div>

            {/* Itens Soulwar */}
            <div className="bg-stone-950/80 border border-purple-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-purple-400 block">Equipamentos Soulwar</span>
                <span className="text-[11px] text-gray-400">Custo de compra estimado ~1.100 TC/item</span>
              </div>
              <input
                type="number"
                value={soulwarItemsAdded}
                onChange={(e) => setSoulwarItemsAdded(e.target.value)}
                className="w-16 bg-stone-900 border border-stone-700 text-xs text-purple-300 font-mono font-bold rounded px-2 py-1 text-center"
              />
            </div>

            {/* World Transfer */}
            <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Taxa de Mudança de Mundo (World Transfer)</span>
                <span className="text-[11px] text-gray-400">Mover char para mundo mais valorizado</span>
              </div>
              <input
                type="checkbox"
                checked={worldTransferTc}
                onChange={(e) => setWorldTransferTc(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>

      {/* DISCRIMINAÇÃO CONTÁBIL COMPLETA */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
          <Coins size={16} /> Dossiê Contábil de Fechamento do Leilão
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-1">
            <span className="text-gray-400 block">Valor Bruto Arrematado</span>
            <span className="text-base font-bold font-mono text-white">{results.sell} TC</span>
          </div>

          <div className="bg-stone-950/80 border border-red-500/20 rounded-xl p-3.5 space-y-1">
            <span className="text-red-400 block">Comissão Oficial RubinOT (12% + 50 TC)</span>
            <span className="text-base font-bold font-mono text-red-400">-{results.rubinotFeeTc} TC</span>
          </div>

          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-1">
            <span className="text-gray-400 block">Crédito Líquido na Conta</span>
            <span className="text-base font-bold font-mono text-emerald-400">{results.netReceivedTc} TC</span>
          </div>

          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-1">
            <span className="text-gray-400 block">Total Investido (Compra + Upgrades)</span>
            <span className="text-base font-bold font-mono text-amber-300">{results.totalInvestedTc} TC</span>
          </div>
        </div>
      </div>

      {/* ADSENSE */}
      <div className="mt-4">
        <AdBanner />
      </div>

    </div>
  );
}
