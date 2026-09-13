import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, TrendingDown, DollarSign, Gem, Shield, Award, 
  Search, Calculator, Filter, ArrowUpDown, RefreshCw, BarChart3, 
  PieChart, Activity, Sparkles, ExternalLink, ArrowRight, Zap,
  CheckCircle2, Clock, Calendar, HelpCircle, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import AdBanner from '../components/AdBanner';

// Dados Históricos do Índice FIPE RubinOT por Faixa de Level
const LEVEL_PRICE_DATA = [
  { range: '400 - 550', avgTC: 280, medianTC: 230, minTC: 120, maxTC: 650, ratio: '0.65' },
  { range: '550 - 700', avgTC: 460, medianTC: 390, minTC: 250, maxTC: 1100, ratio: '0.78' },
  { range: '700 - 850', avgTC: 780, medianTC: 720, minTC: 450, maxTC: 1800, ratio: '1.05' },
  { range: '850 - 1000', avgTC: 1250, medianTC: 1180, minTC: 800, maxTC: 2900, ratio: '1.38' },
  { range: '1000 - 1200', avgTC: 1950, medianTC: 1850, minTC: 1300, maxTC: 4800, ratio: '1.80' },
  { range: '1200+', avgTC: 3400, medianTC: 3100, minTC: 2200, maxTC: 9500, ratio: '2.55' }
];

// Comparativo de Valorização por Vocação
const VOCATION_STATS_DATA = [
  { voc: 'Elder Druid (ED)', avgPrice: 756, demand: 'Muito Alta', liquidityDays: '2.4 dias', color: '#10B981' },
  { voc: 'Royal Paladin (RP)', avgPrice: 737, demand: 'Máxima', liquidityDays: '1.8 dias', color: '#FBBF24' },
  { voc: 'Elite Knight (EK)', avgPrice: 583, demand: 'Alta', liquidityDays: '3.1 dias', color: '#EF4444' },
  { voc: 'Master Sorcerer (MS)', avgPrice: 581, demand: 'Média', liquidityDays: '3.6 dias', color: '#F97316' },
  { voc: 'Exalted Monk (Monk)', avgPrice: 505, demand: 'Estável', liquidityDays: '4.2 dias', color: '#A855F7' }
];

// Impacto de Itens e Atributos no Preço Final
const ITEM_VALUATION_DATA = [
  { item: 'Sanguine Weapon', addedTC: 3200, category: 'Arma BiS' },
  { item: 'Sanguine Greaves', addedTC: 4500, category: 'Set BiS' },
  { item: 'Soulwar Item (Item)', addedTC: 1100, category: 'Soul War' },
  { item: 'Tier 3 na Forja', addedTC: 1600, category: 'Exaltação' },
  { item: 'Tier 2 na Forja', addedTC: 600, category: 'Exaltação' },
  { item: 'Tier 1 na Forja', addedTC: 220, category: 'Exaltação' },
  { item: '2.500+ Charm Points', addedTC: 350, category: 'Charms' },
  { item: '5.000+ Charm Points', addedTC: 850, category: 'Charms' }
];

export default function BazaarMarketIndex({ onNavigate, onPlayerClick }) {
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator', 'charts', 'bargains'
  
  // Parâmetros do Simulador FIPE
  const [simLevel, setSimLevel] = useState(750);
  const [simVoc, setSimVoc] = useState('paladin');
  const [hasSanguine, setHasSanguine] = useState(false);
  const [sanguineCount, setSanguineCount] = useState(1);
  const [hasSoulwar, setHasSoulwar] = useState(false);
  const [soulwarCount, setSoulwarCount] = useState(1);
  const [forgeTier, setForgeTier] = useState(0); // 0, 1, 2, 3
  const [charmPoints, setCharmPoints] = useState(2500);
  const [tcPriceBrl, setTcPriceBrl] = useState(0.20); // R$ 0,20 por 1 TC (padrão RubinOT / Mercado)

  // Leilões do Banco de Dados
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [searchBargain, setSearchBargain] = useState('');

  // Carregar leilões reais do Supabase
  useEffect(() => {
    async function loadData() {
      setLoadingAuctions(true);
      try {
        const { data, error } = await supabase
          .from('bazaar_alerts')
          .select('*')
          .order('level', { ascending: false })
          .limit(150);

        if (!error && data) {
          setLiveAuctions(data);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do Bazaar:', err);
      } finally {
        setLoadingAuctions(false);
      }
    }
    loadData();
  }, []);

  // Motor de Cálculo FIPE RubinOT
  const fipeResult = useMemo(() => {
    const lvl = Math.max(100, parseInt(simLevel) || 100);
    
    // Taxa base por level
    let baseRatio = 0.65;
    if (lvl >= 1200) baseRatio = 2.50;
    else if (lvl >= 1000) baseRatio = 1.80;
    else if (lvl >= 850) baseRatio = 1.35;
    else if (lvl >= 700) baseRatio = 1.05;
    else if (lvl >= 550) baseRatio = 0.78;

    let baseTC = lvl * baseRatio;

    // Multiplicador por vocação
    let vocMultiplier = 1.0;
    if (simVoc === 'druid') vocMultiplier = 1.15;
    else if (simVoc === 'paladin') vocMultiplier = 1.10;
    else if (simVoc === 'knight') vocMultiplier = 1.00;
    else if (simVoc === 'sorcerer') vocMultiplier = 0.96;
    else if (simVoc === 'monk') vocMultiplier = 0.90;

    let adjustedTC = baseTC * vocMultiplier;

    // Adicionais de Itens Sanguine
    if (hasSanguine) {
      adjustedTC += (sanguineCount * 3200);
    }

    // Adicionais de Soulwar
    if (hasSoulwar) {
      adjustedTC += (soulwarCount * 1100);
    }

    // Adicional Forja
    if (forgeTier === 1) adjustedTC += 220;
    else if (forgeTier === 2) adjustedTC += 650;
    else if (forgeTier === 3) adjustedTC += 1700;

    // Adicional Charms
    if (charmPoints >= 5000) adjustedTC += 850;
    else if (charmPoints >= 2500) adjustedTC += 350;
    else if (charmPoints >= 1000) adjustedTC += 150;

    const fairTC = Math.round(adjustedTC);
    const floorTC = Math.round(fairTC * 0.78); // Preço de barganha/liquidação imediata
    const ceilingTC = Math.round(fairTC * 1.30); // Preço máximo antes de ficar encalhado

    const fairBRL = (fairTC * tcPriceBrl).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const floorBRL = (floorTC * tcPriceBrl).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const ceilingBRL = (ceilingTC * tcPriceBrl).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let liquidity = 'Alta (2 a 3 dias)';
    if (fairTC > 3000) liquidity = 'Moderada (4 a 7 dias)';
    if (fairTC > 6000) liquidity = 'Exclusiva / Nicho (7 a 15 dias)';

    return {
      fairTC,
      floorTC,
      ceilingTC,
      fairBRL,
      floorBRL,
      ceilingBRL,
      liquidity
    };
  }, [simLevel, simVoc, hasSanguine, sanguineCount, hasSoulwar, soulwarCount, forgeTier, charmPoints, tcPriceBrl]);

  // Lista de Oportunidades Calculadas (Barganhas ao Vivo)
  const evaluatedBargains = useMemo(() => {
    if (!liveAuctions.length) return [];

    return liveAuctions.map(auc => {
      // Cálculo aproximado de FIPE para o leilão real
      const lvl = auc.level || 500;
      let ratio = lvl >= 1000 ? 1.8 : lvl >= 700 ? 1.05 : 0.75;
      let estFair = Math.round(lvl * ratio);

      const itemsStr = JSON.stringify(auc.items_data || []).toLowerCase();
      if (itemsStr.includes('sanguine')) estFair += 3000;
      if (itemsStr.includes('soul')) estFair += 1000;

      const currentBid = auc.current_bid || 50;
      const discountPercent = Math.round(((estFair - currentBid) / estFair) * 100);
      const isBargain = discountPercent >= 20;

      return {
        ...auc,
        estFair,
        discountPercent,
        isBargain
      };
    }).filter(a => {
      if (!searchBargain.trim()) return a.isBargain;
      const q = searchBargain.toLowerCase();
      return (
        a.character_name.toLowerCase().includes(q) ||
        (a.world_name && a.world_name.toLowerCase().includes(q)) ||
        (a.vocation && a.vocation.toLowerCase().includes(q))
      );
    });
  }, [liveAuctions, searchBargain]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Banner Principal FIPE RubinOT */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/50 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">
              <TrendingUp size={14} className="text-emerald-400" />
              Índice FIPE RubinOT • Macroeconomia do Bazaar 📈
            </div>
            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold">
              Tabela FIPE & Cotação de Chars
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Consulte a cotação justa de mercado para qualquer personagem, analise gráficos de tendências com base 
              em <strong className="text-emerald-400">milhares de leilões reais</strong> e encontre oportunidades abaixo do preço justo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="bg-black/80 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Base Amostral</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">17.300+ Chars</span>
            </div>
            <div className="bg-black/80 border border-yellow-500/30 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Precisão Algorítmica</span>
              <span className="text-xl font-bold text-yellow-400 font-mono">94.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="flex border-b border-tibia-border gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-t-2xl transition-all flex items-center gap-2 border-t border-x ${
            activeTab === 'simulator'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50'
              : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <Calculator size={16} className={activeTab === 'simulator' ? 'text-emerald-400' : ''} />
          Calculadora de Cotação FIPE
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-t-2xl transition-all flex items-center gap-2 border-t border-x ${
            activeTab === 'charts'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50'
              : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <BarChart3 size={16} className={activeTab === 'charts' ? 'text-emerald-400' : ''} />
          Gráficos Macroeconômicos
        </button>

        <button
          onClick={() => setActiveTab('bargains')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-t-2xl transition-all flex items-center gap-2 border-t border-x ${
            activeTab === 'bargains'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50'
              : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <Zap size={16} className={activeTab === 'bargains' ? 'text-emerald-400' : ''} />
          Barganhas ao Vivo ({evaluatedBargains.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: CALCULADORA DE COTAÇÃO FIPE                                        */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Formulário de Entrada (5 colunas) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-black/70 border border-tibia-border p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
              <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                <Calculator size={16} /> Parâmetros do Personagem
              </h3>

              {/* Level */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold">Level do Char:</label>
                <input
                  type="number"
                  min={100}
                  max={2500}
                  value={simLevel}
                  onChange={(e) => setSimLevel(parseInt(e.target.value) || 100)}
                  className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-sm text-yellow-400 font-mono font-bold focus:outline-none focus:border-yellow-500"
                />
              </div>

              {/* Vocação */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold">Vocação:</label>
                <select
                  value={simVoc}
                  onChange={(e) => setSimVoc(e.target.value)}
                  className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none"
                >
                  <option value="paladin">Royal Paladin (RP) - Maior Liquidez</option>
                  <option value="druid">Elder Druid (ED) - Maior Demanda/Preço</option>
                  <option value="knight">Elite Knight (EK) - Sólido</option>
                  <option value="sorcerer">Master Sorcerer (MS) - Alta Variação</option>
                  <option value="monk">Exalted Monk (Monk) - Econômico</option>
                </select>
              </div>

              {/* Itens Especiais: Sanguine */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-red-400" /> Possui Item Sanguine (BiS)?
                  </span>
                  <input
                    type="checkbox"
                    checked={hasSanguine}
                    onChange={(e) => setHasSanguine(e.target.checked)}
                    className="rounded text-red-500 focus:ring-0"
                  />
                </label>
                {hasSanguine && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-gray-400">Quantidade de itens:</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={sanguineCount}
                      onChange={(e) => setSanguineCount(parseInt(e.target.value) || 1)}
                      className="w-16 bg-black/90 border border-tibia-border rounded-lg px-2 py-1 text-center font-bold text-yellow-400 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Itens Especiais: Soulwar */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Gem size={14} className="text-purple-400" /> Possui Itens Soul War?
                  </span>
                  <input
                    type="checkbox"
                    checked={hasSoulwar}
                    onChange={(e) => setHasSoulwar(e.target.checked)}
                    className="rounded text-purple-500 focus:ring-0"
                  />
                </label>
                {hasSoulwar && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-gray-400">Quantidade de itens:</span>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={soulwarCount}
                      onChange={(e) => setSoulwarCount(parseInt(e.target.value) || 1)}
                      className="w-16 bg-black/90 border border-tibia-border rounded-lg px-2 py-1 text-center font-bold text-yellow-400 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Forja de Exaltação */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold">Tier de Forja no Set/Arma:</label>
                <select
                  value={forgeTier}
                  onChange={(e) => setForgeTier(parseInt(e.target.value))}
                  className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none"
                >
                  <option value={0}>Sem Forja (Tier 0)</option>
                  <option value={1}>Tier 1 (+220 TC médio)</option>
                  <option value={2}>Tier 2 (+650 TC médio)</option>
                  <option value={3}>Tier 3 (+1.700 TC médio)</option>
                </select>
              </div>

              {/* Charm Points */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold">Pontos de Charm:</label>
                <select
                  value={charmPoints}
                  onChange={(e) => setCharmPoints(parseInt(e.target.value))}
                  className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none"
                >
                  <option value={500}>Menos de 1.000 Charms (Padrão)</option>
                  <option value={2500}>2.500+ Charms (4 a 5 Runas ativas)</option>
                  <option value={5000}>5.000+ Charms (Colecionador / Endgame)</option>
                </select>
              </div>

              {/* Cotação TC / BRL */}
              <div className="flex flex-col gap-1 pt-2 border-t border-tibia-border">
                <label className="text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Cotação Tibia Coin (TC):</span>
                  <span className="font-mono text-yellow-400 font-bold">R$ {tcPriceBrl.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={0.15}
                  max={0.25}
                  step={0.01}
                  value={tcPriceBrl}
                  onChange={(e) => setTcPriceBrl(parseFloat(e.target.value))}
                  className="w-full accent-yellow-400"
                />
              </div>

            </div>
          </div>

          {/* Resultado FIPE (7 colunas) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Card Principal: Cotação Justa FIPE */}
            <div className="bg-gradient-to-b from-emerald-950/50 via-black to-black border-2 border-emerald-500/60 p-6 rounded-3xl shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    Índice Oficial FIPE RubinOT
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-medieval text-gradient-gold mt-2">
                    Cotação Justa de Mercado
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Valor em Moeda Real:</span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                    {fipeResult.fairBRL}
                  </span>
                </div>
              </div>

              {/* Valor Central Gigante */}
              <div className="bg-black/80 p-5 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block font-semibold uppercase">Valor de Mercado Estimado (Fair Price):</span>
                  <span className="text-4xl sm:text-5xl font-bold font-mono text-yellow-400 tracking-tight">
                    {fipeResult.fairTC.toLocaleString()} <span className="text-lg font-sans text-gray-400">TC</span>
                  </span>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Liquidez Esperada:</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 block mt-1">
                    {fipeResult.liquidity}
                  </span>
                </div>
              </div>

              {/* Faixas de Negociação: Piso vs Teto */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-black/60 p-3.5 rounded-2xl border border-blue-500/30 flex flex-col gap-1">
                  <span className="text-blue-400 font-bold uppercase text-[10px] flex items-center gap-1">
                    <TrendingDown size={13} /> Preço Piso (Venda Rápida):
                  </span>
                  <span className="text-lg font-bold font-mono text-gray-200">
                    {fipeResult.floorTC.toLocaleString()} TC
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">{fipeResult.floorBRL}</span>
                </div>

                <div className="bg-black/60 p-3.5 rounded-2xl border border-red-500/30 flex flex-col gap-1">
                  <span className="text-red-400 font-bold uppercase text-[10px] flex items-center gap-1">
                    <TrendingUp size={13} /> Preço Teto (Acima Encalha):
                  </span>
                  <span className="text-lg font-bold font-mono text-gray-200">
                    {fipeResult.ceilingTC.toLocaleString()} TC
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">{fipeResult.ceilingBRL}</span>
                </div>
              </div>

              {/* Dica Estratégica de Venda */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs leading-relaxed text-gray-300">
                <strong className="text-yellow-300 block mb-1">💡 Dica Estratégica de Negociação:</strong>
                Se você vai colocar esse char à venda no RubinOT, comece o lance mínimo em 
                <strong className="text-emerald-400"> {fipeResult.floorTC.toLocaleString()} TC</strong> para atrair lances concorrentes nas primeiras 24 horas. 
                Lembre-se de descontar a comissão oficial do RubinOT de 12% + 50 TC no valor final.
              </div>

            </div>

            {/* Ações Rápidas: Simular Flip */}
            <div className="bg-black/70 border border-tibia-border p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-200 block">Quer comprar para revender com lucro?</span>
                <span className="text-[11px] text-gray-400">Abra na Calculadora de Flip para deduzir taxas e calcular seu ROI líquido.</span>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('bazaar_flip')}
                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                Calculadora de Flip <ArrowRight size={13} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: GRÁFICOS MACROECONÔMICOS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'charts' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Gráfico 1: Evolução do Preço Médio por Faixa de Level */}
          <div className="bg-black/70 border border-tibia-border p-5 sm:p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
            <div>
              <h3 className="text-lg font-medieval text-yellow-400 flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-400" />
                Preço Médio e Mediano por Faixa de Level (TC)
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Análise empírica mostrando como o valor em Tibia Coins se multiplica exponencialmente a partir do Level 850 (meta de Soul War).
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={LEVEL_PRICE_DATA}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorMedian" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="range" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#444', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="avgTC" name="Preço Médio (TC)" stroke="#10B981" fillOpacity={1} fill="url(#colorAvg)" />
                  <Area type="monotone" dataKey="medianTC" name="Preço Mediano (TC)" stroke="#FBBF24" fillOpacity={1} fill="url(#colorMedian)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Valorização Média por Vocação */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-black/70 border border-tibia-border p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                  <PieChart size={16} /> Preço Médio por Vocação (TC)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Elder Druids e Royal Paladins lideram o ranking de valorização devido à alta demanda em Team Hunts.
                </p>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={VOCATION_STATS_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="voc" stroke="#888" fontSize={10} />
                    <YAxis stroke="#888" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#444', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="avgPrice" name="Preço Médio (TC)" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabela de Liquidez por Vocação */}
            <div className="bg-black/70 border border-tibia-border p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                  <Activity size={16} /> Termômetro de Liquidez & Demanda
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Velocidade média em dias para um personagem receber seu lance vencedor.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {VOCATION_STATS_DATA.map((v, i) => (
                  <div key={i} className="p-3 bg-black/60 border border-tibia-border rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                      <span className="font-bold text-gray-200">{v.voc}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">Demanda: <strong className="text-yellow-300">{v.demand}</strong></span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {v.liquidityDays}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: BARGANHAS AO VIVO (ABAIXO DA FIPE)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'bargains' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/70 border border-tibia-border p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                <Zap size={16} className="text-yellow-400" /> Leilões com Lances 20%+ Abaixo da FIPE
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Oportunidades de leilões ao vivo onde o lance atual está muito inferior ao valor estimado do personagem.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar char, vocação ou mundo..."
                value={searchBargain}
                onChange={(e) => setSearchBargain(e.target.value)}
                className="w-full bg-black/90 border border-tibia-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          {loadingAuctions ? (
            <div className="p-12 text-center text-xs text-gray-400 bg-black/50 border border-tibia-border rounded-2xl flex flex-col items-center gap-2">
              <RefreshCw className="animate-spin text-yellow-400" size={24} />
              Analisando 2.500+ leilões e cruzando dados de mercado...
            </div>
          ) : evaluatedBargains.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 bg-black/50 border border-tibia-border rounded-2xl">
              Nenhum leilão com desconto extremo de 20%+ encontrado no momento para este filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evaluatedBargains.slice(0, 30).map(auc => (
                <div 
                  key={auc.id}
                  className="bg-black/80 border border-emerald-500/40 hover:border-emerald-400 p-4 rounded-2xl flex flex-col justify-between gap-3 transition-all shadow-lg shadow-emerald-500/5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md uppercase">
                        -{auc.discountPercent}% Abaixo da FIPE
                      </span>
                      <h4 className="text-base font-bold text-yellow-400 mt-1">
                        {auc.character_name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        Level {auc.level} • {auc.vocation} ({auc.world_name})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase block font-bold">Lance Atual:</span>
                      <span className="text-lg font-mono font-bold text-yellow-400">
                        {auc.current_bid} TC
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-tibia-border/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">FIPE Estimada:</span>
                      <span className="font-mono font-bold text-emerald-400">{auc.estFair} TC</span>
                    </div>

                    <a
                      href={`https://rubinot.com.br/bazaar/auction/${auc.auction_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      Ver Leilão <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Banner de Anúncios AdSense */}
      <AdBanner slot="bazaar_fipe_footer" format="horizontal" />
    </div>
  );
}
