import React, { useState, useMemo } from 'react';
import { 
  Gem, Search, ArrowRightLeft, TrendingUp, Filter, 
  Coins, Sparkles, Shield, Swords, Copy, Check, Info, 
  ArrowDownUp, Calculator, ExternalLink, Award, DollarSign
} from 'lucide-react';
import AdBanner from '../components/AdBanner';
import { BIS_ITEMS_DATABASE, BIS_TIERS } from '../data/bisItemsDatabase';

export default function BiSMarketBoard({ onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedVoc, setSelectedVoc] = useState('ALL');
  const [selectedSlot, setSelectedSlot] = useState('ALL');
  const [tcRate, setTcRate] = useState(40000);
  const [copiedId, setCopiedId] = useState(null);

  const [convertGP, setConvertGP] = useState(85000000);
  const [convertTC, setConvertTC] = useState(2125);

  const [arbItemName, setArbItemName] = useState('Falcon Plate');
  const [arbPriceGP, setArbPriceGP] = useState(65000000);
  const [arbPriceTC, setArbPriceTC] = useState(1550);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGPChange = (val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setConvertGP(num);
    const tc = tcRate > 0 ? Math.round(num / tcRate) : 0;
    setConvertTC(tc);
  };

  const handleTCChange = (val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setConvertTC(num);
    const gp = num * tcRate;
    setConvertGP(gp);
  };

  const arbitrageAnalysis = useMemo(() => {
    const gpInTc = arbPriceTC * tcRate;
    const diff = arbPriceGP - gpInTc;
    const cheaperOption = diff > 0 ? 'TC' : diff < 0 ? 'GP' : 'EQUAL';
    const percentDiff = arbPriceGP > 0 ? Math.abs((diff / arbPriceGP) * 100).toFixed(1) : '0';
    return {
      gpInTc,
      diff: Math.abs(diff),
      cheaperOption,
      percentDiff
    };
  }, [arbPriceGP, arbPriceTC, tcRate]);

  const filteredItems = useMemo(() => {
    return BIS_ITEMS_DATABASE.filter(item => {
      if (selectedTier !== 'ALL' && item.tier !== selectedTier) return false;
      if (selectedVoc !== 'ALL') {
        if (selectedVoc === 'Knight' && !item.vocation.includes('Knight') && item.vocation !== 'All') return false;
        if (selectedVoc === 'Paladin' && !item.vocation.includes('Paladin') && item.vocation !== 'All') return false;
        if (selectedVoc === 'Sorcerer' && !item.vocation.includes('Sorcerer') && !item.vocation.includes('Mages') && item.vocation !== 'All') return false;
        if (selectedVoc === 'Druid' && !item.vocation.includes('Druid') && !item.vocation.includes('Mages') && item.vocation !== 'All') return false;
      }
      if (selectedSlot !== 'ALL' && !item.slot.toLowerCase().includes(selectedSlot.toLowerCase())) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return item.name.toLowerCase().includes(q) || 
               item.tier.toLowerCase().includes(q) || 
               item.stats.toLowerCase().includes(q) ||
               item.source.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedTier, selectedVoc, selectedSlot, searchTerm]);

  const availableSlots = ['ALL', 'Weapon', 'Helmet', 'Armor', 'Legs', 'Boots', 'Shield', 'Amulet'];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full text-gray-100 flex flex-col gap-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-950/40 via-black to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              <Gem size={14} className="text-yellow-400 animate-pulse" />
              Market Board BiS & Economia de Elite 💎
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold">
              Equipamentos de Alto Valor (BiS)
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Consulte preços médios praticados nos servidores para equipamentos lendários (Sanguine, Soulwar, Falcon, Cobra, Primal e Ferumbras Hat). Converta instantaneamente valores entre Gold Coins e Tibia Coins com base na cotação do seu mundo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="bg-black/80 border border-yellow-500/30 rounded-2xl px-4 py-2.5 text-center shadow-lg">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Itens BiS Listados</span>
              <span className="text-xl font-bold text-yellow-400 font-mono">{BIS_ITEMS_DATABASE.length} Itens</span>
            </div>
            <div className="bg-black/80 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-center shadow-lg">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Câmbio Base</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{(tcRate / 1000).toFixed(0)}k GP / TC</span>
            </div>
          </div>
        </div>
      </div>

      {/* AdBanner */}
      <AdBanner slot="bis_market_top" />

      {/* CONVERSOR GP TC E ARBITRAGEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel 1: Conversor */}
        <div className="bg-gradient-to-b from-gray-900/90 to-black border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between gap-4">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" /> Conversor Rápido GP ⇄ Tibia Coins
              </h2>
              <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-xl border border-white/10">
                <span className="text-[10px] text-gray-400 font-bold">1 TC =</span>
                <input
                  type="number"
                  step="1000"
                  value={tcRate}
                  onChange={(e) => setTcRate(Math.max(1000, parseInt(e.target.value) || 1000))}
                  className="w-16 bg-transparent text-xs font-mono font-bold text-emerald-400 text-right focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 font-bold">GP</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Altere a cotação do seu servidor acima para recalcular todos os preços automaticamente.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Coins size={12} className="text-yellow-400" /> Valor em Gold Coins (GP):
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={convertGP}
                  onChange={(e) => handleGPChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-yellow-300 focus:outline-none focus:border-yellow-500"
                />
                <div className="text-[10px] text-gray-400 font-mono text-right">
                  ~{(convertGP / 1000000).toFixed(2)} KKs
                </div>
              </div>
              <div className="bg-black/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Gem size={12} className="text-emerald-400" /> Valor em Tibia Coins (TC):
                </label>
                <input
                  type="number"
                  step="25"
                  value={convertTC}
                  onChange={(e) => handleTCChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                <div className="text-[10px] text-gray-400 font-mono text-right">
                  Total de {convertTC.toLocaleString()} Coins
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <span>Resultado: <strong>{(convertGP / 1000000).toFixed(1)}kk</strong> equivalem a exatamente <strong>{convertTC.toLocaleString()} TC</strong> na cotação de <strong>{(tcRate / 1000).toFixed(0)}k</strong>.</span>
          </div>
        </div>

        {/* Painel 2: Arbitragem */}
        <div className="bg-gradient-to-b from-gray-900/90 to-black border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" /> Simulador de Compra: Gold vs Coins
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 uppercase">
                Arbitragem
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              O vendedor ofereceu pagamento em Gold ou TC? Descubra na hora qual opção é mais barata!
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[10px] text-gray-400 uppercase font-bold block">Nome do Item:</label>
                <input
                  type="text"
                  value={arbItemName}
                  onChange={(e) => setArbItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-bold block">Preço em GP:</label>
                <input
                  type="number"
                  step="1000000"
                  value={arbPriceGP}
                  onChange={(e) => setArbPriceGP(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-yellow-300 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-bold block">Preço em TC:</label>
                <input
                  type="number"
                  step="25"
                  value={arbPriceTC}
                  onChange={(e) => setArbPriceTC(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Equivalente de {arbPriceTC} TC em Gold:</span>
                <span className="font-mono font-bold text-white">{(arbitrageAnalysis.gpInTc / 1000000).toFixed(2)} KKs</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Preço em Gold direto pedido:</span>
                <span className="font-mono font-bold text-yellow-300">{(arbPriceGP / 1000000).toFixed(2)} KKs</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300">Melhor Decisão:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  arbitrageAnalysis.cheaperOption === 'TC' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : arbitrageAnalysis.cheaperOption === 'GP'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}>
                  {arbitrageAnalysis.cheaperOption === 'TC' && `Pague em TC (Economiza ${(arbitrageAnalysis.diff / 1000000).toFixed(1)}kk / ${arbitrageAnalysis.percentDiff}%)`}
                  {arbitrageAnalysis.cheaperOption === 'GP' && `Pague em Gold (Economiza ${(arbitrageAnalysis.diff / 1000000).toFixed(1)}kk / ${arbitrageAnalysis.percentDiff}%)`}
                  {arbitrageAnalysis.cheaperOption === 'EQUAL' && 'Valores Idênticos'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-black/80 border border-yellow-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'Knight', 'Paladin', 'Sorcerer', 'Druid'].map(voc => (
              <button
                key={voc}
                onClick={() => setSelectedVoc(voc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  selectedVoc === voc
                    ? 'bg-yellow-500 text-black border-yellow-400 shadow-md'
                    : 'bg-slate-900 text-gray-400 hover:text-white border-slate-800'
                }`}
              >
                {voc === 'ALL' ? 'Todas Vocações' : voc}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-yellow-500 w-full sm:w-auto"
            >
              {availableSlots.map(s => (
                <option key={s} value={s}>{s === 'ALL' ? 'Todos os Slots' : s}</option>
              ))}
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar item, stat ou boss..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800">
          {BIS_TIERS.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTier(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedTier === t.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-950 text-gray-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE ITENS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const dynamicTC = tcRate > 0 ? Math.round(item.avgPriceGP / tcRate) : item.avgPriceTC;
          return (
            <div
              key={item.id}
              className="bg-gradient-to-b from-gray-900/90 to-black border border-slate-800 hover:border-yellow-500/50 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl transition-all duration-200 group"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        item.tier === 'Sanguine' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        item.tier === 'Soulwar' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                        item.tier === 'Falcon' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        item.tier === 'Cobra' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        item.tier === 'Primal' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                        'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      }`}>{item.tier}</span>
                      <span className="text-[10px] text-gray-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.slot} • Lvl {item.level}+
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-yellow-300 transition-colors">
                      {item.name}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.liquidity.includes('Muito') || item.liquidity.includes('Extrema') || item.liquidity.includes('Instantânea')
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : item.liquidity === 'Alta'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>{item.liquidity}</span>
                </div>
                <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-gray-300 leading-relaxed font-sans">
                  {item.stats}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-300">Drop / Origem:</span>
                  <span className="text-yellow-400/90">{item.source}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Coins size={14} className="text-yellow-400" />
                    <span className="text-sm sm:text-base font-bold font-mono text-yellow-300">
                      {(item.avgPriceGP / 1000000).toLocaleString()} KKs
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <Gem size={11} /> ~{dynamicTC.toLocaleString()} TC
                  </div>
                </div>
                <button
                  onClick={() => {
                    const tradeText = `[Compro] ${item.name} - Oferto ${(item.avgPriceGP / 1000000)}kk ou ${dynamicTC} TC`;
                    handleCopy(tradeText, item.id);
                  }}
                  title="Copiar mensagem para o Trade Chat"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  {copiedId === item.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copiedId === item.id ? 'Copiado!' : 'Trade'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="p-12 text-center bg-black/60 border border-slate-800 rounded-3xl text-gray-400 space-y-2">
          <Gem className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-gray-200">Nenhum equipamento BiS encontrado</h3>
          <p className="text-xs">Tente ajustar seus filtros de vocação, tier ou termo de pesquisa.</p>
        </div>
      )}

      {/* Footer Banner */}
      <AdBanner slot="bis_market_bottom" format="horizontal" />
    </div>
  );
}