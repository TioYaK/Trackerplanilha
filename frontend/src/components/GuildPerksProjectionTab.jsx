import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Coins, Users, RefreshCw, Plus, Trash2, Copy, Check, 
  ArrowRight, Globe, Sparkles, TrendingUp, TrendingDown, DollarSign, 
  Package, Share2, Layers, AlertCircle, Zap, Shield, FileText, Sliders
} from 'lucide-react';
import { 
  WORLDS_CONFIG, 
  DEFAULT_ASCENSION_ITEMS, 
  DEFAULT_WORLD_TRANSFERS, 
  calculateDetailedPerkProjection 
} from '../lib/guildPerksConfig';

export default function GuildPerksProjectionTab({ 
  selectedWorld = 'Auroria', 
  activeMembersCount = 0,
  bankRecipient = '',
  isAdmin = false,
  onApplyOfficialFee = null
}) {
  // 1. Estado dos Itens da Guild Ascension
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('guild_perks_proj_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ASCENSION_ITEMS;
  });

  // 2. Estado das Rotas de World Transfer
  const [worldTransfers, setWorldTransfers] = useState(() => {
    try {
      const saved = localStorage.getItem('guild_perks_proj_wts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WORLD_TRANSFERS;
  });

  // 3. Estado de Parâmetros Globais
  const [members, setMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('guild_perks_proj_members');
      if (saved) return Math.max(1, Number(saved));
    } catch {}
    return activeMembersCount > 0 ? activeMembersCount : 500;
  });

  const [rateRc, setRateRc] = useState(25);
  const [rateKk, setRateKk] = useState(2.0);
  const [activationKk, setActivationKk] = useState(0.8);
  const [safetyMargin, setSafetyMargin] = useState(10);
  const [usePerMemberQty, setUsePerMemberQty] = useState(false);
  const [customFeeRc, setCustomFeeRc] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Estados dos Modais
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [wtModalOpen, setWtModalOpen] = useState(false);

  // Formulário Novo Item
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Geral',
    quantityTotal: 2500,
    quantityPerMember: 5,
    priceKk: 0.05,
    serverOrigin: 'Belaria',
    notes: ''
  });

  // Formulário Novo World Transfer
  const [newWt, setNewWt] = useState({
    fromWorld: 'Belaria',
    toWorld: selectedWorld !== 'ALL' ? selectedWorld : 'Auroria',
    charactersCount: 1,
    costRcPerChar: 1490,
    extraGoldKk: 0,
    notes: ''
  });

  // Persistência local automática
  useEffect(() => {
    try {
      localStorage.setItem('guild_perks_proj_items', JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('guild_perks_proj_wts', JSON.stringify(worldTransfers));
    } catch {}
  }, [worldTransfers]);

  useEffect(() => {
    try {
      localStorage.setItem('guild_perks_proj_members', String(members));
    } catch {}
  }, [members]);

  // Cálculo Geral Dinâmico Reativo
  const result = useMemo(() => {
    return calculateDetailedPerkProjection({
      items,
      members,
      rateRc,
      rateKk,
      activationCostPerMemberKk: activationKk,
      worldTransfers,
      safetyMarginPct: safetyMargin,
      usePerMemberQty,
      customFeeRc: customFeeRc ? Number(customFeeRc) : null
    });
  }, [
    items,
    members,
    rateRc,
    rateKk,
    activationKk,
    worldTransfers,
    safetyMargin,
    usePerMemberQty,
    customFeeRc
  ]);

  // Ações de Itens
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    const item = {
      id: 'item-' + Date.now(),
      name: newItem.name.trim(),
      category: newItem.category.trim() || 'Geral',
      quantityTotal: Math.max(1, Number(newItem.quantityTotal) || 1000),
      quantityPerMember: Math.max(1, Number(newItem.quantityPerMember) || 2),
      priceKk: Math.max(0, Number(newItem.priceKk) || 0),
      serverOrigin: newItem.serverOrigin || 'Local',
      notes: newItem.notes.trim()
    };
    setItems(prev => [item, ...prev]);
    setItemModalOpen(false);
    setNewItem({
      name: '',
      category: 'Geral',
      quantityTotal: 2500,
      quantityPerMember: 5,
      priceKk: 0.05,
      serverOrigin: 'Belaria',
      notes: ''
    });
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleResetItems = () => {
    if (window.confirm('Deseja restaurar a lista para os itens canônicos da Guild Ascension?')) {
      setItems(DEFAULT_ASCENSION_ITEMS);
    }
  };

  // Ações de World Transfer
  const handleAddWt = (e) => {
    e.preventDefault();
    const wt = {
      id: 'wt-' + Date.now(),
      fromWorld: newWt.fromWorld,
      toWorld: newWt.toWorld || (selectedWorld !== 'ALL' ? selectedWorld : 'Auroria'),
      charactersCount: Math.max(1, Number(newWt.charactersCount) || 1),
      costRcPerChar: Math.max(0, Number(newWt.costRcPerChar) || 1490),
      extraGoldKk: Math.max(0, Number(newWt.extraGoldKk) || 0),
      notes: newWt.notes.trim()
    };
    setWorldTransfers(prev => [...prev, wt]);
    setWtModalOpen(false);
    setNewWt({
      fromWorld: 'Belaria',
      toWorld: selectedWorld !== 'ALL' ? selectedWorld : 'Auroria',
      charactersCount: 1,
      costRcPerChar: 1490,
      extraGoldKk: 0,
      notes: ''
    });
  };

  const handleRemoveWt = (id) => {
    setWorldTransfers(prev => prev.filter(w => w.id !== id));
  };

  const handleUpdateWt = (id, field, value) => {
    setWorldTransfers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const handleResetWt = () => {
    if (window.confirm('Deseja restaurar as rotas padrão de World Transfer?')) {
      setWorldTransfers(DEFAULT_WORLD_TRANSFERS);
    }
  };

  // Copiar resumo formatado para Discord / WhatsApp
  const handleCopyDiscord = () => {
    const targetW = selectedWorld !== 'ALL' ? selectedWorld : 'Auroria';
    const bank = bankRecipient || `Bank Rubin ${targetW}`;

    let text = `📜 **PROJEÇÃO & COTA GUILD PERKS - ${targetW.toUpperCase()}**\n`;
    text += `👥 **Membros Contribuintes:** ${result.members.toLocaleString('pt-BR')} jogadores\n`;
    text += `💎 **Cota Recomendada por Membro:** **${result.recommendedFeeRc} RC** *(ou ${result.recommendedFeeKk.toLocaleString('pt-BR')} KK Gold)*\n`;
    text += `⚖️ **Custo Mínimo (Break-Even):** ${result.breakEvenFeeRc} RC / membro | 🛡️ **Margem de Reserva:** ${result.safetyMarginPct}%\n\n`;

    text += `📦 **ITENS NECESSÁRIOS (${result.totalItemsCount.toLocaleString('pt-BR')} un no total):**\n`;
    result.items.forEach(it => {
      text += `• **${it.name}**: ${it.effectiveQty.toLocaleString('pt-BR')} un (${it.serverOrigin}) ➔ ${it.subtotalKk.toLocaleString('pt-BR')} KK (${it.subtotalRc.toLocaleString('pt-BR')} RC)\n`;
    });
    text += `💰 *Subtotal em Itens:* **${result.totalItemsCostKk.toLocaleString('pt-BR')} KK** (${result.totalItemsCostRc.toLocaleString('pt-BR')} RC)\n\n`;

    if (result.worldTransfers.length > 0) {
      text += `🚀 **LOGÍSTICA DE WORLD TRANSFER (${result.totalWtTransfersCount} transfers planejados):**\n`;
      result.worldTransfers.forEach(wt => {
        text += `• ${wt.fromWorld} ➔ ${wt.toWorld}: ${wt.charactersCount} char(s) = ${wt.subtotalRc.toLocaleString('pt-BR')} RC${wt.notes ? ` *(${wt.notes})*` : ''}\n`;
      });
      text += `💸 *Subtotal World Transfers:* **${result.totalWtCostRc.toLocaleString('pt-BR')} RC** (${result.totalWtCostKk.toLocaleString('pt-BR')} KK)\n\n`;
    }

    text += `⚙️ **Ativação dos Perks no Sistema:** ${result.activationCostKk.toLocaleString('pt-BR')} KK (${result.activationCostRc.toLocaleString('pt-BR')} RC)\n`;
    text += `══════════════════════════════════════\n`;
    text += `🏛️ **CUSTO TOTAL GLOBAL:** **${result.grandTotalCostRc.toLocaleString('pt-BR')} RC** (${result.grandTotalCostKk.toLocaleString('pt-BR')} KK)\n`;
    text += `💰 **Arrecadação Prevista:** ${result.grossRevenueRc.toLocaleString('pt-BR')} RC | 🛡️ **Fundo de Reserva Líquido:** +${result.surplusRc.toLocaleString('pt-BR')} RC\n`;
    text += `🏦 **Destinatário p/ Pagamento:** \`${bank}\`\n`;
    text += `⏱️ *Cotação considerada: 1 RC = ${result.rateKkPerRc.toFixed(3)} KK (${Math.round(result.rateKkPerRc * 1000)}k)*`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Ação de Aplicar no Servidor
  const handleApplyFee = async () => {
    if (onApplyOfficialFee) {
      const ok = await onApplyOfficialFee(result.recommendedFeeRc);
      if (ok) {
        setApplySuccess(true);
        setTimeout(() => setApplySuccess(false), 3000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="bg-black/50 border border-tibia-border/60 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-tibia-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl font-medieval text-emerald-400 flex items-center gap-2.5">
                <Calculator className="text-emerald-400" size={24} />
                Projeção Financeira de Guild Perks & World Transfer
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Logística & Rateio
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-3xl">
              Projete o custo exato de cada creature product, planeje as transferências de outros servidores (World Transfers) a 1.490 RC, converta tudo para Rubini Coins e calcule a cota por jogador com margem de segurança.
            </p>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyDiscord}
              className="px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
              title="Copiar extrato estruturado para colar no Discord ou WhatsApp da guilda"
            >
              {copiedSummary ? <Check size={14} className="text-green-300" /> : <Copy size={14} />}
              <span>{copiedSummary ? 'Extrato Copiado!' : 'Copiar p/ Discord'}</span>
            </button>

            {isAdmin && onApplyOfficialFee && (
              <button
                type="button"
                onClick={handleApplyFee}
                className="px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black shadow-md cursor-pointer"
                title="Definir cota recomendada como a cota oficial do ciclo no servidor"
              >
                {applySuccess ? <Check size={14} /> : <Zap size={14} />}
                <span>{applySuccess ? 'Cota Aplicada!' : `Aplicar ${result.recommendedFeeRc} RC no Servidor`}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Grandes KPI Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Cota Recomendada por Jogador */}
          <div className="bg-gradient-to-br from-emerald-950/60 via-black/80 to-black/80 border-2 border-emerald-500/60 p-4 rounded-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Coins size={14} className="text-amber-400" />
                Cota Recomendada / Jogador
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                +{result.safetyMarginPct}% Margem
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {result.recommendedFeeRc}
              </span>
              <span className="text-base font-bold text-white">RC / ciclo</span>
            </div>
            <div className="mt-1.5 text-xs text-amber-300 font-mono">
              ≈ {result.recommendedFeeKk.toLocaleString('pt-BR')} KK Gold
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Break-Even mínimo: <strong className="text-gray-200">{result.breakEvenFeeRc} RC</strong> (sem margem)
            </p>
          </div>

          {/* Card 2: Itens da Guild Ascension */}
          <div className="bg-black/60 border border-tibia-border/60 p-4 rounded-xl shadow-lg">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={14} className="text-blue-400" />
              Itens da Ascension ({items.length} tipos)
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-400 font-mono">
                {result.totalItemsCount.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs font-bold text-gray-400">unidades</span>
            </div>
            <div className="mt-1.5 text-xs text-gray-200">
              Custo: <strong className="text-yellow-400 font-mono">{result.totalItemsCostKk.toLocaleString('pt-BR')} KK</strong>
              <span className="text-gray-400 ml-1">({result.totalItemsCostRc.toLocaleString('pt-BR')} RC)</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Representa <strong>{result.shares.itemsSharePct}%</strong> do custo global
            </p>
          </div>

          {/* Card 3: Logística de World Transfers */}
          <div className="bg-black/60 border border-tibia-border/60 p-4 rounded-xl shadow-lg">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={14} className="text-purple-400" />
              World Transfers ({result.totalWtTransfersCount} Chars)
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-400 font-mono">
                {result.totalWtCostRc.toLocaleString('pt-BR')}
              </span>
              <span className="text-base font-bold text-gray-300">RC</span>
            </div>
            <div className="mt-1.5 text-xs text-gray-200">
              Equivalente: <strong className="text-yellow-400 font-mono">{result.totalWtCostKk.toLocaleString('pt-BR')} KK</strong>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Frete cross-server: <strong>{result.shares.wtSharePct}%</strong> do orçamento
            </p>
          </div>

          {/* Card 4: Custo Global & Balanço */}
          <div className="bg-black/60 border border-tibia-border/60 p-4 rounded-xl shadow-lg">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} className="text-amber-400" />
              Custo Global & Balanço
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-400 font-mono">
                {result.grandTotalCostRc.toLocaleString('pt-BR')}
              </span>
              <span className="text-base font-bold text-gray-300">RC</span>
            </div>
            <div className="mt-1.5 text-xs text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp size={12} />
              <span>Reserva / Sobra: +{result.surplusRc.toLocaleString('pt-BR')} RC</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Arrecadação total: <strong className="text-gray-200">{result.grossRevenueRc.toLocaleString('pt-BR')} RC</strong>
            </p>
          </div>
        </div>

        {/* Barra de Distribuição de Custos */}
        <div className="mt-5 bg-black/60 border border-tibia-border/40 rounded-lg p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs font-bold gap-2">
            <span className="text-blue-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Itens da Ascension: {result.shares.itemsSharePct}% ({result.totalItemsCostRc.toLocaleString('pt-BR')} RC)
            </span>
            <span className="text-purple-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              World Transfers (1.490 RC/char): {result.shares.wtSharePct}% ({result.totalWtCostRc.toLocaleString('pt-BR')} RC)
            </span>
            <span className="text-yellow-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
              Ativação no NPC: {result.shares.activationSharePct}% ({result.activationCostRc.toLocaleString('pt-BR')} RC)
            </span>
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Fundo de Reserva: {result.surplusMarginPct}% (+{result.surplusRc.toLocaleString('pt-BR')} RC)
            </span>
          </div>
          <div className="w-full h-3 bg-black/80 rounded-full overflow-hidden border border-tibia-border/60 flex">
            <div style={{ width: `${result.shares.itemsSharePct}%` }} className="bg-blue-500 transition-all duration-500" title="Itens" />
            <div style={{ width: `${result.shares.wtSharePct}%` }} className="bg-purple-500 transition-all duration-500" title="World Transfers" />
            <div style={{ width: `${result.shares.activationSharePct}%` }} className="bg-yellow-500 transition-all duration-500" title="Ativação" />
            <div style={{ width: `${result.surplusMarginPct}%` }} className="bg-emerald-500 transition-all duration-500" title="Reserva" />
          </div>
        </div>
      </div>

      {/* PAINEL DE CONTROLE DINÂMICO DOS PARÂMETROS */}
      <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between border-b border-tibia-border/40 pb-3">
          <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-amber-400" />
            Configurações & Parâmetros de Simulação
          </h4>
          <span className="text-xs text-gray-400">
            Ajuste os valores para recalcular automaticamente todas as projeções
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Parâmetro: Membros Contribuintes */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1">
                <Users size={13} className="text-blue-400" />
                Membros Pagantes
              </label>
              <span className="text-xs font-mono font-black text-blue-400">{members} jogadores</span>
            </div>
            <input
              type="range"
              min="10"
              max="1500"
              step="10"
              value={members}
              onChange={(e) => setMembers(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-black/80 rounded-lg cursor-pointer"
            />
            <div className="flex items-center gap-1.5 mt-2">
              <input
                type="number"
                min="1"
                max="5000"
                value={members}
                onChange={(e) => setMembers(Math.max(1, Number(e.target.value)))}
                className="w-full bg-black/80 border border-tibia-border/60 rounded px-2 py-1 text-xs text-white font-mono focus:border-blue-400 focus:outline-none"
              />
              {activeMembersCount > 0 && (
                <button
                  type="button"
                  onClick={() => setMembers(activeMembersCount)}
                  className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 whitespace-nowrap cursor-pointer"
                  title="Usar contagem real de membros ativos"
                >
                  Roster ({activeMembersCount})
                </button>
              )}
            </div>
          </div>

          {/* Parâmetro: Cotação de Mercado */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1">
              <RefreshCw size={13} className="text-yellow-400" />
              Cotação RubinOT (Market)
            </label>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1">
                <input
                  type="number"
                  min="1"
                  value={rateRc}
                  onChange={(e) => setRateRc(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 block mt-0.5">RC</span>
              </div>
              <span className="text-xs font-bold text-gray-400">=</span>
              <div className="flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={rateKk}
                  onChange={(e) => setRateKk(Math.max(0.1, Number(e.target.value)))}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 block mt-0.5">KK Gold</span>
              </div>
            </div>
            <span className="text-[10px] text-amber-300 font-mono block mt-1">
              1 RC = {result.rateKkPerRc.toFixed(3)} KK ({Math.round(result.rateKkPerRc * 1000)}k)
            </span>
          </div>

          {/* Parâmetro: Margem de Segurança / Reserva */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1">
                <Shield size={13} className="text-emerald-400" />
                Margem de Reserva
              </label>
              <span className="text-xs font-mono font-black text-emerald-400">+{safetyMargin}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={safetyMargin}
              onChange={(e) => setSafetyMargin(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-black/80 rounded-lg cursor-pointer"
            />
            <div className="flex items-center gap-1 mt-2">
              {[0, 10, 15, 20].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSafetyMargin(m)}
                  className={`flex-1 py-0.5 text-[10px] font-bold rounded border cursor-pointer ${
                    safetyMargin === m 
                      ? 'bg-emerald-500 text-black border-emerald-400' 
                      : 'bg-black/60 text-gray-400 border-tibia-border/40 hover:text-white'
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>

          {/* Parâmetro: Taxa de Ativação do Sistema */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1">
              <DollarSign size={13} className="text-yellow-400" />
              Taxa de Ativação (NPC)
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                step="0.1"
                min="0"
                value={activationKk}
                onChange={(e) => setActivationKk(Math.max(0, Number(e.target.value)))}
                className="w-full bg-black/80 border border-tibia-border/60 rounded px-2.5 py-1 text-xs text-white font-mono focus:border-yellow-400 focus:outline-none"
              />
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">KK / membro</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              Total: <strong>{result.activationCostKk.toLocaleString('pt-BR')} KK</strong> ({result.activationCostRc} RC)
            </span>
          </div>
        </div>

        {/* Alternância de Modo de Quantidade */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-tibia-border/30 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-medium">Modo de Quantidade:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
              <input
                type="radio"
                name="qtyMode"
                checked={!usePerMemberQty}
                onChange={() => setUsePerMemberQty(false)}
                className="accent-amber-500"
              />
              <span>Qtd. Total Fixa</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
              <input
                type="radio"
                name="qtyMode"
                checked={usePerMemberQty}
                onChange={() => setUsePerMemberQty(true)}
                className="accent-amber-500"
              />
              <span>Por Membro (Multiplicar por {members})</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Fixar Cota Manual (RC):</span>
            <input
              type="number"
              placeholder={`Ex: ${result.recommendedFeeRc}`}
              value={customFeeRc}
              onChange={(e) => setCustomFeeRc(e.target.value)}
              className="w-20 bg-black/80 border border-tibia-border/60 rounded px-2 py-0.5 text-xs text-amber-300 font-mono focus:border-amber-400 focus:outline-none"
            />
            {customFeeRc && (
              <button
                type="button"
                onClick={() => setCustomFeeRc('')}
                className="text-[10px] text-red-400 hover:underline cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: MATRIZ DE ITENS (Quanto gastei por item & quantos itens foram necessários) */}
      <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tibia-border/40 pb-3">
          <div>
            <h4 className="text-base font-medieval text-blue-400 flex items-center gap-2">
              <Package size={18} className="text-blue-400" />
              Detalhamento por Item (Creature Products da Guild Ascension)
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Total de <strong>{result.totalItemsCount.toLocaleString('pt-BR')} itens</strong> necessários para a Season, orçados em <strong>{result.totalItemsCostKk.toLocaleString('pt-BR')} KK</strong> ({result.totalItemsCostRc.toLocaleString('pt-BR')} RC).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetItems}
              className="px-3 py-1.5 rounded text-xs font-bold bg-black/60 text-gray-300 hover:text-white border border-tibia-border/60 hover:border-gray-400 transition-all cursor-pointer"
              title="Carregar catálogo canônico do RubinOT"
            >
              Restaurar Padrão
            </button>
            <button
              type="button"
              onClick={() => setItemModalOpen(true)}
              className="px-3 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Adicionar Item</span>
            </button>
          </div>
        </div>

        {/* Resumo Rápido dos Servidores de Origem */}
        <div className="flex flex-wrap items-center gap-2 bg-black/60 p-3 rounded-lg border border-tibia-border/40 text-xs">
          <span className="text-gray-400 font-bold uppercase text-[10px]">Origem das Compras:</span>
          {result.serverBreakdown.map(sb => (
            <span 
              key={sb.server}
              className="px-2.5 py-1 rounded bg-black/80 border border-tibia-border/60 text-gray-200 flex items-center gap-1.5"
            >
              <span className="font-bold text-amber-400">{sb.server}:</span>
              <span>{sb.totalQty.toLocaleString('pt-BR')} un</span>
              <span className="text-gray-400 text-[11px]">({sb.totalCostKk.toLocaleString('pt-BR')} KK / {sb.totalCostRc} RC)</span>
            </span>
          ))}
        </div>

        {/* Tabela de Itens */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-tibia-border/60 text-gray-400 uppercase tracking-wider font-bold bg-black/60">
                <th className="py-2.5 px-3">Item / Recurso</th>
                <th className="py-2.5 px-3">Bônus / Perk Associado</th>
                <th className="py-2.5 px-3">Servidor de Compra</th>
                <th className="py-2.5 px-3 text-right">Qtd. Necessária</th>
                <th className="py-2.5 px-3 text-right">Preço Unit. (KK)</th>
                <th className="py-2.5 px-3 text-right">Subtotal (KK)</th>
                <th className="py-2.5 px-3 text-right text-amber-400">Subtotal (RC)</th>
                <th className="py-2.5 px-3 text-right">Por Jogador</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tibia-border/30">
              {result.items.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                    <Sparkles size={13} className="text-amber-400 shrink-0" />
                    <span>{item.name}</span>
                  </td>
                  <td className="py-2 px-3 text-gray-400">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-black/60 border border-tibia-border/40 text-gray-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.serverOrigin}
                      onChange={(e) => handleUpdateItem(item.id, 'serverOrigin', e.target.value)}
                      className="bg-black/80 border border-tibia-border/50 rounded px-2 py-0.5 text-xs text-yellow-300 focus:outline-none"
                    >
                      {WORLDS_CONFIG.map(w => (
                        <option key={w.world} value={w.world}>{w.world}</option>
                      ))}
                      <option value="Local">Local ({selectedWorld})</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <input
                      type="number"
                      min="1"
                      value={usePerMemberQty ? (item.quantityPerMember || 1) : (item.quantityTotal || 100)}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        handleUpdateItem(item.id, usePerMemberQty ? 'quantityPerMember' : 'quantityTotal', val);
                      }}
                      className="w-24 bg-black/80 border border-tibia-border/50 rounded px-2 py-0.5 text-right text-xs font-mono text-white focus:border-blue-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400 block font-sans">
                      {item.effectiveQty.toLocaleString('pt-BR')} un
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <input
                      type="number"
                      step="0.005"
                      min="0"
                      value={item.priceKk}
                      onChange={(e) => handleUpdateItem(item.id, 'priceKk', Math.max(0, Number(e.target.value)))}
                      className="w-20 bg-black/80 border border-tibia-border/50 rounded px-2 py-0.5 text-right text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400 block font-sans">
                      {Math.round(item.priceKk * 1000)}k gp
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-gray-200">
                    {item.subtotalKk.toLocaleString('pt-BR')} KK
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-black text-amber-400">
                    {item.subtotalRc.toLocaleString('pt-BR')} RC
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-gray-400">
                    {item.costPerMemberRc} RC
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Remover este item da projeção"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO 2: LOGÍSTICA DE WORLD TRANSFERS (Transferência de Mundos) */}
      <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tibia-border/40 pb-3">
          <div>
            <h4 className="text-base font-medieval text-purple-400 flex items-center gap-2">
              <Globe size={18} className="text-purple-400" />
              Logística de Transferência de Mundos (World Transfer)
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Custo oficial do RubinOT: <strong>1.490 RC</strong> por personagem transferido. Projete o frete cross-server para trazer os itens dos outros servidores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetWt}
              className="px-3 py-1.5 rounded text-xs font-bold bg-black/60 text-gray-300 hover:text-white border border-tibia-border/60 hover:border-gray-400 transition-all cursor-pointer"
            >
              Restaurar Rotas
            </button>
            <button
              type="button"
              onClick={() => setWtModalOpen(true)}
              className="px-3 py-1.5 rounded text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Adicionar Rota</span>
            </button>
          </div>
        </div>

        {/* Tabela de Rotas de WT */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-tibia-border/60 text-gray-400 uppercase tracking-wider font-bold bg-black/60">
                <th className="py-2.5 px-3">Origem</th>
                <th className="py-2.5 px-3">Destino</th>
                <th className="py-2.5 px-3 text-center">Personagens</th>
                <th className="py-2.5 px-3 text-right">Custo Unitário (RC)</th>
                <th className="py-2.5 px-3 text-right">Taxa Gold Extra</th>
                <th className="py-2.5 px-3 text-right text-purple-400">Total (RC)</th>
                <th className="py-2.5 px-3 text-right">Total (KK)</th>
                <th className="py-2.5 px-3">Finalidade / Carga</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tibia-border/30">
              {result.worldTransfers.map(wt => (
                <tr key={wt.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-3 font-bold text-amber-400">
                    {wt.fromWorld}
                  </td>
                  <td className="py-2 px-3 font-bold text-emerald-400">
                    {wt.toWorld}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={wt.charactersCount}
                      onChange={(e) => handleUpdateWt(wt.id, 'charactersCount', Math.max(1, Number(e.target.value)))}
                      className="w-14 bg-black/80 border border-tibia-border/50 rounded px-2 py-0.5 text-center text-xs font-mono text-white focus:border-purple-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={wt.costRcPerChar}
                      onChange={(e) => handleUpdateWt(wt.id, 'costRcPerChar', Math.max(0, Number(e.target.value)))}
                      className="w-20 bg-black/80 border border-tibia-border/50 rounded px-2 py-0.5 text-right text-xs font-mono text-white focus:border-purple-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-gray-400">
                    {wt.extraGoldKk > 0 ? `${wt.extraGoldKk} KK` : '-'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-black text-purple-400">
                    {wt.subtotalRc.toLocaleString('pt-BR')} RC
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-gray-300">
                    {wt.subtotalKk.toLocaleString('pt-BR')} KK
                  </td>
                  <td className="py-2 px-3 text-gray-400 truncate max-w-[200px]" title={wt.notes}>
                    {wt.notes || 'Transporte de suprimentos'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveWt(wt.id)}
                      className="text-gray-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Remover rota de transfer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO 3: ESTRATÉGIA DE COBRANÇA DOS PLAYERS & EXTRATO */}
      <div className="bg-black/50 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="border-b border-tibia-border/40 pb-3">
          <h4 className="text-base font-medieval text-yellow-400 flex items-center gap-2">
            <Coins size={18} className="text-amber-400" />
            Estratégia de Cobrança dos Membros (Extrato para Discord / WhatsApp)
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Composição completa da cota de <strong>{result.recommendedFeeRc} RC</strong> por membro dividida de forma justa e transparente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Coluna 1: Decomposição por Jogador */}
          <div className="bg-black/60 border border-tibia-border/50 rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              Composição da Cota por Jogador ({result.members} membros)
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Parte dos Itens da Ascension:</span>
                <span className="font-mono text-blue-400 font-bold">
                  {(result.totalItemsCostRc / result.members).toFixed(1)} RC
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Parte dos World Transfers:</span>
                <span className="font-mono text-purple-400 font-bold">
                  {(result.totalWtCostRc / result.members).toFixed(1)} RC
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Parte das Taxas de Ativação:</span>
                <span className="font-mono text-yellow-400 font-bold">
                  {(result.activationCostRc / result.members).toFixed(1)} RC
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10 font-bold">
                <span className="text-gray-300">Custo Mínimo Líquido (Break-Even):</span>
                <span className="font-mono text-white">
                  {result.breakEvenFeeRc} RC
                </span>
              </div>
              <div className="flex justify-between py-1 text-emerald-400 font-bold">
                <span>Fundo de Reserva (+{result.safetyMarginPct}%):</span>
                <span className="font-mono">
                  +{result.recommendedFeeRc - result.breakEvenFeeRc} RC
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-emerald-500/30 text-sm font-black text-emerald-300">
                <span>Cota Final Sugerida:</span>
                <span className="font-mono">{result.recommendedFeeRc} RC</span>
              </div>
            </div>
          </div>

          {/* Coluna 2 & 3: Mensagem Pronta do Discord */}
          <div className="lg:col-span-2 bg-black/60 border border-tibia-border/50 rounded-lg p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 size={13} className="text-indigo-400" />
                Mensagem Formatada para o Canal de Avisos da Guilda
              </span>
              <button
                type="button"
                onClick={handleCopyDiscord}
                className="px-2.5 py-1 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSummary ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedSummary ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>

            <div className="bg-black/90 border border-tibia-border/70 rounded-lg p-3 text-[11px] font-mono text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto hide-scroll-bar">
{`📜 PROJEÇÃO & COTA GUILD PERKS - ${selectedWorld.toUpperCase()}
👥 Membros Contribuintes: ${result.members} jogadores
💎 Cota Recomendada: ${result.recommendedFeeRc} RC (ou ${result.recommendedFeeKk.toLocaleString('pt-BR')} KK Gold)
📦 Itens Necessários: ${result.totalItemsCount.toLocaleString('pt-BR')} un (${result.totalItemsCostRc.toLocaleString('pt-BR')} RC)
🚀 World Transfers: ${result.totalWtTransfersCount} transfers (${result.totalWtCostRc.toLocaleString('pt-BR')} RC)
🏛️ CUSTO TOTAL GLOBAL: ${result.grandTotalCostRc.toLocaleString('pt-BR')} RC (${result.grandTotalCostKk.toLocaleString('pt-BR')} KK)
🏦 Depósito p/: ${bankRecipient || `Bank Rubin ${selectedWorld}`}`}
            </div>
            <p className="text-[10px] text-gray-400 italic">
              Clique em copiar para levar este relatório ao Discord/WhatsApp e alinhar com a liderança e membros.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: ADICIONAR ITEM */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-tibia-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-medieval text-yellow-500 flex items-center gap-2">
              <Plus size={18} />
              Adicionar Recurso à Projeção
            </h4>
            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Nome do Item / Creature Product:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Demon Horn, Vampire Teeth, Wyrm Scale..."
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Bônus / Perk:</label>
                  <input
                    type="text"
                    placeholder="Ex: Life Leech, Demon..."
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Servidor de Compra:</label>
                  <select
                    value={newItem.serverOrigin}
                    onChange={(e) => setNewItem({ ...newItem, serverOrigin: e.target.value })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                  >
                    {WORLDS_CONFIG.map(w => (
                      <option key={w.world} value={w.world}>{w.world}</option>
                    ))}
                    <option value="Local">Local ({selectedWorld})</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Quantidade Total:</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantityTotal}
                    onChange={(e) => setNewItem({ ...newItem, quantityTotal: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Preço Unitário (KK):</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    value={newItem.priceKk}
                    onChange={(e) => setNewItem({ ...newItem, priceKk: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Observações (opcional):</label>
                <input
                  type="text"
                  placeholder="Ex: Oferta barata no market de Belaria"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-tibia-border/40">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2 bg-black/60 text-gray-300 hover:text-white rounded border border-tibia-border cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded cursor-pointer"
                >
                  Adicionar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR WORLD TRANSFER */}
      {wtModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-tibia-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-medieval text-purple-400 flex items-center gap-2">
              <Globe size={18} />
              Nova Rota de World Transfer
            </h4>
            <form onSubmit={handleAddWt} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Servidor Origem:</label>
                  <select
                    value={newWt.fromWorld}
                    onChange={(e) => setNewWt({ ...newWt, fromWorld: e.target.value })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white focus:border-purple-400 focus:outline-none"
                  >
                    {WORLDS_CONFIG.map(w => (
                      <option key={w.world} value={w.world}>{w.world}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Servidor Destino:</label>
                  <select
                    value={newWt.toWorld}
                    onChange={(e) => setNewWt({ ...newWt, toWorld: e.target.value })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white focus:border-purple-400 focus:outline-none"
                  >
                    {WORLDS_CONFIG.map(w => (
                      <option key={w.world} value={w.world}>{w.world}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Qtd. de Personagens:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newWt.charactersCount}
                    onChange={(e) => setNewWt({ ...newWt, charactersCount: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Custo Oficial (RC / char):</label>
                  <input
                    type="number"
                    min="0"
                    value={newWt.costRcPerChar}
                    onChange={(e) => setNewWt({ ...newWt, costRcPerChar: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Observações da Carga:</label>
                <input
                  type="text"
                  placeholder="Ex: Traz 5.000 Wyrm Scales e 4.000 Vampire Teeth"
                  value={newWt.notes}
                  onChange={(e) => setNewWt({ ...newWt, notes: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded p-2 text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-tibia-border/40">
                <button
                  type="button"
                  onClick={() => setWtModalOpen(false)}
                  className="px-4 py-2 bg-black/60 text-gray-300 hover:text-white rounded border border-tibia-border cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded cursor-pointer"
                >
                  Adicionar Rota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
