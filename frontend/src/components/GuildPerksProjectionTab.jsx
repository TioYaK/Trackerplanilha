import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Coins, Users, RefreshCw, Plus, Trash2, Copy, Check, 
  ArrowRight, Globe, Sparkles, TrendingUp, TrendingDown, DollarSign, 
  Package, Share2, Layers, AlertCircle, Zap, Shield, FileText, Sliders,
  Search, HelpCircle, CheckCircle2, ChevronDown, ChevronUp, ShoppingCart,
  Truck, ArrowUpRight, Filter, Info, BookmarkCheck
} from 'lucide-react';
import { 
  WORLDS_CONFIG, 
  DEFAULT_ASCENSION_ITEMS, 
  DEFAULT_WORLD_TRANSFERS, 
  CATALOG_SUGGESTED_ITEMS,
  PROJECTION_PRESETS,
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
      const saved = localStorage.getItem('guild_perks_proj_items_v2');
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
      const saved = localStorage.getItem('guild_perks_proj_wts_v2');
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
      const saved = localStorage.getItem('guild_perks_proj_members_v2');
      if (saved) return Math.max(1, Number(saved));
    } catch {}
    return activeMembersCount > 0 ? activeMembersCount : 500;
  });

  const [rateRc, setRateRc] = useState(25);
  const [rateKk, setRateKk] = useState(2.0);
  const [activationKk, setActivationKk] = useState(0.8);
  const [safetyMargin, setSafetyMargin] = useState(10);
  const [usePerMemberQty, setUsePerMemberQty] = useState(true); // Padrão: por jogador para máxima clareza
  const [customFeeRc, setCustomFeeRc] = useState('');
  
  // UI & Filtros
  const [searchFilter, setSearchFilter] = useState('');
  const [serverFilter, setServerFilter] = useState('ALL');
  const [showMathExplainer, setShowMathExplainer] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedShoppingList, setCopiedShoppingList] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Modais
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [wtModalOpen, setWtModalOpen] = useState(false);

  // Formulário Novo Item
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Creature Product',
    quantityPerMember: 5,
    quantityTotal: 2500,
    calcMode: 'per_member',
    priceKk: 0.05,
    serverOrigin: 'Belaria',
    status: 'planejado',
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
      localStorage.setItem('guild_perks_proj_items_v2', JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('guild_perks_proj_wts_v2', JSON.stringify(worldTransfers));
    } catch {}
  }, [worldTransfers]);

  useEffect(() => {
    try {
      localStorage.setItem('guild_perks_proj_members_v2', String(members));
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

  // Filtro de Itens para Exibição
  const displayedItems = useMemo(() => {
    return result.items.filter(item => {
      const matchesSearch = !searchFilter.trim() || 
        item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchFilter.toLowerCase()));
      
      const matchesServer = serverFilter === 'ALL' || item.serverOrigin === serverFilter;

      return matchesSearch && matchesServer;
    });
  }, [result.items, searchFilter, serverFilter]);

  // Ações de Itens
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    const perMember = Math.max(0.1, Number(newItem.quantityPerMember) || 1);
    const item = {
      id: 'item-' + Date.now(),
      name: newItem.name.trim(),
      category: newItem.category.trim() || 'Geral',
      quantityPerMember: perMember,
      quantityTotal: Math.max(1, Number(newItem.quantityTotal) || Math.round(perMember * members)),
      calcMode: newItem.calcMode || 'per_member',
      priceKk: Math.max(0, Number(newItem.priceKk) || 0),
      serverOrigin: newItem.serverOrigin || 'Local',
      status: newItem.status || 'planejado',
      notes: newItem.notes.trim()
    };
    setItems(prev => [item, ...prev]);
    setItemModalOpen(false);
    setNewItem({
      name: '',
      category: 'Creature Product',
      quantityPerMember: 5,
      quantityTotal: 2500,
      calcMode: 'per_member',
      priceKk: 0.05,
      serverOrigin: 'Belaria',
      status: 'planejado',
      notes: ''
    });
  };

  const handleQuickAddSuggested = (suggested) => {
    if (items.some(i => i.name.toLowerCase() === suggested.name.toLowerCase())) {
      alert(`O item "${suggested.name}" já está na lista da projeção!`);
      return;
    }
    const item = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      name: suggested.name,
      category: suggested.category,
      quantityPerMember: suggested.defaultPerMember,
      quantityTotal: Math.round(suggested.defaultPerMember * members),
      calcMode: 'per_member',
      priceKk: suggested.defaultKk,
      serverOrigin: suggested.defaultOrigin || 'Local',
      status: 'planejado',
      notes: `Sugerido da Ascension RubinOT`
    };
    setItems(prev => [...prev, item]);
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, [field]: value };
      if (field === 'quantityPerMember') {
        updated.quantityTotal = Math.round((Number(value) || 0) * members);
      } else if (field === 'quantityTotal') {
        updated.quantityPerMember = Number(((Number(value) || 0) / members).toFixed(2));
      }
      return updated;
    }));
  };

  const handleApplyPreset = (presetId) => {
    if (!window.confirm('Deseja carregar este preset? Isso atualizará a lista atual de itens e transferências.')) {
      return;
    }
    if (presetId === 'full_ascension') {
      setItems(DEFAULT_ASCENSION_ITEMS);
      setWorldTransfers(DEFAULT_WORLD_TRANSFERS);
      setUsePerMemberQty(true);
    } else if (presetId === 'essential_leech') {
      setItems(DEFAULT_ASCENSION_ITEMS.slice(0, 4));
      setWorldTransfers(DEFAULT_WORLD_TRANSFERS.slice(0, 2));
      setUsePerMemberQty(true);
    } else if (presetId === 'local_zero_wt') {
      setItems(DEFAULT_ASCENSION_ITEMS.slice(0, 5).map(i => ({ ...i, serverOrigin: selectedWorld !== 'ALL' ? selectedWorld : 'Auroria' })));
      setWorldTransfers([]);
      setUsePerMemberQty(true);
    }
  };

  const handleResetItems = () => {
    if (window.confirm('Deseja restaurar a lista para os itens canônicos da Guild Ascension?')) {
      setItems(DEFAULT_ASCENSION_ITEMS);
      setWorldTransfers(DEFAULT_WORLD_TRANSFERS);
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

  // Copiar resumo formatado para Discord
  const handleCopyDiscord = () => {
    const targetW = selectedWorld !== 'ALL' ? selectedWorld : 'Auroria';
    const bank = bankRecipient || `Bank Rubin ${targetW}`;

    let text = `📜 **PROJEÇÃO & COTA GUILD PERKS - ${targetW.toUpperCase()}**\n`;
    text += `👥 **Membros Elegíveis:** ${result.members.toLocaleString('pt-BR')} jogadores\n`;
    text += `💎 **Cota Oficial Recomendada:** **${result.recommendedFeeRc} RC** *(ou ${result.recommendedFeeKk.toLocaleString('pt-BR')} KK Gold)*\n`;
    text += `⚖️ **Custo Mínimo Líquido (Break-Even):** ${result.breakEvenFeeRc} RC por membro | 🛡️ **Reserva:** ${result.safetyMarginPct}%\n\n`;

    text += `📊 **DECOMPOSIÇÃO DE CADA 1 COTA (${result.recommendedFeeRc} RC):**\n`;
    text += `• 📦 Creature Products (${result.items.length} itens): **${result.breakdownPerMember.itemsCostRc} RC**\n`;
    text += `• 🚀 Frete World Transfers (${result.totalWtTransfersCount} transfers): **${result.breakdownPerMember.wtCostRc} RC**\n`;
    text += `• 🏛️ Taxa de Ativação do Sistema: **${result.breakdownPerMember.activationCostRc} RC**\n`;
    text += `• 🛡️ Fundo de Segurança / Caixa da Guilda: **+${result.breakdownPerMember.marginRc} RC**\n\n`;

    text += `📦 **ITENS NECESSÁRIOS (Total: ${result.totalItemsCount.toLocaleString('pt-BR')} un):**\n`;
    result.items.forEach(it => {
      text += `• **${it.name}**: ${it.effectiveQtyPerMember} un/player ➔ Total: ${it.effectiveQty.toLocaleString('pt-BR')} un (${it.serverOrigin}) = ${it.subtotalKk.toLocaleString('pt-BR')} KK (${it.subtotalRc.toLocaleString('pt-BR')} RC)\n`;
    });
    text += `💰 *Subtotal em Itens:* **${result.totalItemsCostKk.toLocaleString('pt-BR')} KK** (${result.totalItemsCostRc.toLocaleString('pt-BR')} RC)\n\n`;

    if (result.worldTransfers.length > 0) {
      text += `🚀 **LOGÍSTICA DE WORLD TRANSFER (${result.totalWtTransfersCount} mulas a 1.490 RC):**\n`;
      result.worldTransfers.forEach(wt => {
        text += `• ${wt.fromWorld} ➔ ${wt.toWorld}: ${wt.charactersCount} char(s) = ${wt.subtotalRc.toLocaleString('pt-BR')} RC${wt.notes ? ` *(${wt.notes})*` : ''}\n`;
      });
      text += `💸 *Subtotal Frete WT:* **${result.totalWtCostRc.toLocaleString('pt-BR')} RC** (${result.totalWtCostKk.toLocaleString('pt-BR')} KK)\n\n`;
    }

    text += `══════════════════════════════════════\n`;
    text += `🏛️ **CUSTO TOTAL DA OPERAÇÃO:** **${result.grandTotalCostRc.toLocaleString('pt-BR')} RC** (${result.grandTotalCostKk.toLocaleString('pt-BR')} KK)\n`;
    text += `💰 **Arrecadação Prevista:** ${result.grossRevenueRc.toLocaleString('pt-BR')} RC | 🛡️ **Sobra Caixa:** +${result.surplusRc.toLocaleString('pt-BR')} RC\n`;
    text += `🏦 **Destinatário RubinBank:** \`${bank}\`\n`;
    text += `⏱️ *Cotação considerada: 1 RC = ${result.rateKkPerRc.toFixed(3)} KK (${Math.round(result.rateKkPerRc * 1000)}k)*`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Copiar formato WhatsApp
  const handleCopyWhatsApp = () => {
    const targetW = selectedWorld !== 'ALL' ? selectedWorld : 'Auroria';
    const bank = bankRecipient || `Bank Rubin ${targetW}`;

    let text = `*📜 PROJEÇÃO DE COTA - GUILD PERKS ${targetW.toUpperCase()}*\n\n`;
    text += `*Cota por Jogador:* *${result.recommendedFeeRc} RC* (ou ${result.recommendedFeeKk.toLocaleString('pt-BR')} KK)\n`;
    text += `*Jogadores:* ${result.members} membros\n`;
    text += `*Itens a Comprar:* ${result.totalItemsCount.toLocaleString('pt-BR')} unidades\n`;
    text += `*World Transfers:* ${result.totalWtTransfersCount} viagens (1.490 RC/char)\n\n`;
    text += `*Detalhamento da cota de ${result.recommendedFeeRc} RC:*\n`;
    text += `- Itens: ${result.breakdownPerMember.itemsCostRc} RC\n`;
    text += `- Frete WT: ${result.breakdownPerMember.wtCostRc} RC\n`;
    text += `- Ativação NPC: ${result.breakdownPerMember.activationCostRc} RC\n`;
    text += `- Margem de Segurança: +${result.breakdownPerMember.marginRc} RC\n\n`;
    text += `*Char para pagamento no RubinBank:* ${bank}`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  // Copiar Lista de Compras para Compradores / Mulas de WT
  const handleCopyShoppingList = () => {
    let text = `🛒 **LISTA DE COMPRAS DE CREATURE PRODUCTS POR SERVIDOR**\n\n`;
    result.serverBreakdown.forEach(sb => {
      text += `📍 **SERVIDOR: ${sb.server.toUpperCase()}** (Total Orçado: ${sb.totalCostKk.toLocaleString('pt-BR')} KK / ${sb.totalCostRc} RC)\n`;
      const serverItems = result.items.filter(i => i.serverOrigin === sb.server);
      serverItems.forEach(it => {
        text += `• ${it.name}: ${it.effectiveQty.toLocaleString('pt-BR')} un (Preço máx: ${it.unitPriceKk} KK / ${it.unitPriceGp.toLocaleString('pt-BR')} gp) = ${it.subtotalKk} KK\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedShoppingList(true);
    setTimeout(() => setCopiedShoppingList(false), 3000);
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
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP HEADER & BARRA DE PRESETS */}
      <div className="bg-black/50 border border-tibia-border/60 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-tibia-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl font-medieval text-emerald-400 flex items-center gap-2.5">
                <Calculator className="text-emerald-400" size={24} />
                Projeção & Gestão de Cota: Guild Perks
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                RubinOT Oficial
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-3xl">
              Sistema completo para definir a <strong>quantidade exata por jogador</strong>, controlar os <strong>valores dos itens em Gold e RC</strong>, planejar o <strong>frete de World Transfers</strong> e ratear de forma 100% transparente para toda a guilda.
            </p>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyDiscord}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
              title="Copiar comunicado completo formatado para colar no Discord"
            >
              {copiedSummary ? <Check size={14} className="text-green-300" /> : <Copy size={14} />}
              <span>{copiedSummary ? 'Discord Copiado!' : 'Copiar Discord'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white shadow-md cursor-pointer"
              title="Copiar resumo direto para WhatsApp"
            >
              {copiedWhatsApp ? <Check size={14} className="text-green-300" /> : <Share2 size={14} />}
              <span>{copiedWhatsApp ? 'WhatsApp Copiado!' : 'WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShoppingList}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white shadow-md cursor-pointer"
              title="Copiar lista de compras separada por servidor para as mulas"
            >
              {copiedShoppingList ? <Check size={14} className="text-green-300" /> : <ShoppingCart size={14} />}
              <span>{copiedShoppingList ? 'Lista Copiada!' : 'Lista de Compras'}</span>
            </button>

            {isAdmin && onApplyOfficialFee && (
              <button
                type="button"
                onClick={handleApplyFee}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black shadow-md cursor-pointer"
                title="Salvar cota no Supabase do servidor como a cota oficial exigida dos membros"
              >
                {applySuccess ? <Check size={14} /> : <Zap size={14} />}
                <span>{applySuccess ? 'Cota Salva!' : `Aplicar ${result.recommendedFeeRc} RC`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Presets Rápidos */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-b border-tibia-border/30 pb-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1">
              <Layers size={12} className="text-amber-400" />
              Cenários Pré-Configurados:
            </span>
            {PROJECTION_PRESETS.map(pr => (
              <button
                key={pr.id}
                type="button"
                onClick={() => handleApplyPreset(pr.id)}
                className="px-2.5 py-1 rounded bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white border border-tibia-border/50 transition-colors font-medium cursor-pointer"
                title={pr.description}
              >
                {pr.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetItems}
            className="text-[11px] text-gray-400 hover:text-amber-400 underline cursor-pointer"
          >
            Restaurar Valores Padrão do Sistema
          </button>
        </div>

        {/* 4 GRANDES KPI CARDS DE IMPACTO VISUAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Cota Recomendada por Jogador */}
          <div className="bg-gradient-to-br from-emerald-950/70 via-black/80 to-black/80 border-2 border-emerald-500/70 p-4 rounded-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Coins size={14} className="text-amber-400" />
                Cota Oficial / Membro
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
            <div className="mt-1.5 text-xs text-amber-300 font-mono font-bold">
              ≈ {result.recommendedFeeKk.toLocaleString('pt-BR')} KK Gold ({(result.recommendedFeeKk * 1000).toLocaleString('pt-BR')}k)
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Custo real mínimo: <strong className="text-gray-200 font-mono">{result.breakEvenFeeRc} RC</strong> (break-even zero lucro)
            </p>
          </div>

          {/* Card 2: Creature Products (Itens) */}
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
              Custo Total: <strong className="text-yellow-400 font-mono">{result.totalItemsCostKk.toLocaleString('pt-BR')} KK</strong>
              <span className="text-gray-400 ml-1">({result.totalItemsCostRc.toLocaleString('pt-BR')} RC)</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Equivale a <strong className="text-blue-300 font-mono">{result.breakdownPerMember.itemsCostRc} RC</strong> por membro
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
              Custo Frete: <strong className="text-yellow-400 font-mono">{result.totalWtCostKk.toLocaleString('pt-BR')} KK</strong>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Equivale a <strong className="text-purple-300 font-mono">{result.breakdownPerMember.wtCostRc} RC</strong> por membro
            </p>
          </div>

          {/* Card 4: Fundo de Reserva & Caixa */}
          <div className="bg-black/60 border border-tibia-border/60 p-4 rounded-xl shadow-lg">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} className="text-amber-400" />
              Custo Total & Caixa Guilda
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-400 font-mono">
                {result.grandTotalCostRc.toLocaleString('pt-BR')}
              </span>
              <span className="text-base font-bold text-gray-300">RC total</span>
            </div>
            <div className="mt-1.5 text-xs text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp size={12} />
              <span>Reserva / Caixa: +{result.surplusRc.toLocaleString('pt-BR')} RC</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Arrecadação: <strong className="text-gray-200 font-mono">{result.grossRevenueRc.toLocaleString('pt-BR')} RC</strong>
            </p>
          </div>
        </div>

        {/* Barra de Distribuição Visual do Orçamento */}
        <div className="mt-5 bg-black/60 border border-tibia-border/40 rounded-lg p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs font-bold gap-2">
            <span className="text-blue-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Creature Products: {result.shares.itemsSharePct}% ({result.totalItemsCostRc.toLocaleString('pt-BR')} RC)
            </span>
            <span className="text-purple-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              World Transfers (1.490 RC/char): {result.shares.wtSharePct}% ({result.totalWtCostRc.toLocaleString('pt-BR')} RC)
            </span>
            <span className="text-yellow-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
              Taxa de Ativação: {result.shares.activationSharePct}% ({result.activationCostRc.toLocaleString('pt-BR')} RC)
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

      {/* 2. DEMONSTRAÇÃO DIDÁTICA: COMO A MATEMÁTICA DA COTA É CALCULADA (CLAREZA TOTAL) */}
      <div className="bg-gradient-to-b from-black/80 to-zinc-950/80 border border-tibia-border/70 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowMathExplainer(!showMathExplainer)}>
          <div className="flex items-center gap-2.5">
            <HelpCircle size={18} className="text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                Demonstração Matemática Passo a Passo (Transparência com os Jogadores)
              </h4>
              <p className="text-[11px] text-gray-400">
                Mostre aos membros da guilda exatamente como cada centavo dos <strong>{result.recommendedFeeRc} RC</strong> foi calculado.
              </p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white p-1">
            {showMathExplainer ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {showMathExplainer && (
          <div className="space-y-4 pt-3 border-t border-tibia-border/40 text-xs">
            {/* 5 Passos Visuais */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Passo 1 */}
              <div className="bg-black/60 border border-blue-500/30 rounded-lg p-3">
                <span className="text-[10px] font-black uppercase text-blue-400 block mb-1">Passo 1: Itens</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Soma de todos os creature products necessários:
                </p>
                <div className="mt-2 font-mono font-bold text-blue-300">
                  {result.totalItemsCostKk.toLocaleString('pt-BR')} KK Gold
                </div>
                <div className="text-[10px] text-gray-400">
                  ≈ {result.totalItemsCostRc.toLocaleString('pt-BR')} RC
                </div>
              </div>

              {/* Passo 2 */}
              <div className="bg-black/60 border border-purple-500/30 rounded-lg p-3">
                <span className="text-[10px] font-black uppercase text-purple-400 block mb-1">Passo 2: Frete WT</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {result.totalWtTransfersCount} viagens de World Transfer a 1.490 RC:
                </p>
                <div className="mt-2 font-mono font-bold text-purple-300">
                  {result.totalWtCostRc.toLocaleString('pt-BR')} RC
                </div>
                <div className="text-[10px] text-gray-400">
                  ≈ {result.totalWtCostKk.toLocaleString('pt-BR')} KK
                </div>
              </div>

              {/* Passo 3 */}
              <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-3">
                <span className="text-[10px] font-black uppercase text-yellow-400 block mb-1">Passo 3: Ativação</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Taxa em Gold cobrada pelo NPC para a guilda:
                </p>
                <div className="mt-2 font-mono font-bold text-yellow-300">
                  {result.activationCostRc.toLocaleString('pt-BR')} RC
                </div>
                <div className="text-[10px] text-gray-400">
                  ≈ {result.activationCostKk.toLocaleString('pt-BR')} KK
                </div>
              </div>

              {/* Passo 4 */}
              <div className="bg-black/60 border border-amber-500/30 rounded-lg p-3">
                <span className="text-[10px] font-black uppercase text-amber-400 block mb-1">Passo 4: Rateio</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Custo total dividido por {result.members} membros:
                </p>
                <div className="mt-2 font-mono font-bold text-amber-300">
                  {result.breakdownPerMember.breakEvenExactRc} RC / player
                </div>
                <div className="text-[10px] text-gray-400">
                  (Mínimo = {result.breakEvenFeeRc} RC)
                </div>
              </div>

              {/* Passo 5 */}
              <div className="bg-black/60 border border-emerald-500/30 rounded-lg p-3">
                <span className="text-[10px] font-black uppercase text-emerald-400 block mb-1">Passo 5: Cota Final</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Adiciona +{result.safetyMarginPct}% de reserva para imprevistos:
                </p>
                <div className="mt-2 font-mono font-black text-emerald-300 text-sm">
                  {result.recommendedFeeRc} RC / player
                </div>
                <div className="text-[10px] text-emerald-400">
                  ≈ {result.recommendedFeeKk.toLocaleString('pt-BR')} KK Gold
                </div>
              </div>
            </div>

            {/* Tabela de Decomposição de 1 Cota Individual */}
            <div className="bg-black/60 border border-tibia-border/50 rounded-lg p-3.5 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-200">
                  O que cada membro está pagando exatamente dentro dos seus {result.recommendedFeeRc} RC:
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  Base: {result.members} jogadores pagantes
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-black/70 p-2 rounded border border-blue-500/20">
                  <span className="text-gray-400 text-[10px] block">Creature Products:</span>
                  <span className="text-sm font-mono font-black text-blue-400">{result.breakdownPerMember.itemsCostRc} RC</span>
                  <span className="text-[10px] text-gray-400 block">≈ {((result.breakdownPerMember.itemsCostRc * result.rateKkPerRc) * 1000).toFixed(0)}k gp</span>
                </div>
                <div className="bg-black/70 p-2 rounded border border-purple-500/20">
                  <span className="text-gray-400 text-[10px] block">Frete World Transfers:</span>
                  <span className="text-sm font-mono font-black text-purple-400">{result.breakdownPerMember.wtCostRc} RC</span>
                  <span className="text-[10px] text-gray-400 block">≈ {((result.breakdownPerMember.wtCostRc * result.rateKkPerRc) * 1000).toFixed(0)}k gp</span>
                </div>
                <div className="bg-black/70 p-2 rounded border border-yellow-500/20">
                  <span className="text-gray-400 text-[10px] block">Taxa de Ativação NPC:</span>
                  <span className="text-sm font-mono font-black text-yellow-400">{result.breakdownPerMember.activationCostRc} RC</span>
                  <span className="text-[10px] text-gray-400 block">≈ {((result.breakdownPerMember.activationCostRc * result.rateKkPerRc) * 1000).toFixed(0)}k gp</span>
                </div>
                <div className="bg-black/70 p-2 rounded border border-emerald-500/20">
                  <span className="text-gray-400 text-[10px] block">Fundo de Reserva ({result.safetyMarginPct}%):</span>
                  <span className="text-sm font-mono font-black text-emerald-400">+{result.breakdownPerMember.marginRc} RC</span>
                  <span className="text-[10px] text-emerald-400 block">Segurança de Mercado</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. PAINEL DE CONTROLE DINÂMICO DOS PARÂMETROS */}
      <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between border-b border-tibia-border/40 pb-3">
          <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-amber-400" />
            Parâmetros Globais da Simulação
          </h4>
          <span className="text-xs text-gray-400">
            Altere os sliders e veja o recálculo instantâneo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Parâmetro 1: Membros Contribuintes */}
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
                  title="Usar contagem real de membros ativos cadastrados"
                >
                  Roster ({activeMembersCount})
                </button>
              )}
            </div>
          </div>

          {/* Parâmetro 2: Cotação de Mercado */}
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
              1 RC = {result.rateKkPerRc.toFixed(3)} KK ({Math.round(result.rateKkPerRc * 1000)}k gp)
            </span>
          </div>

          {/* Parâmetro 3: Margem de Reserva / Segurança */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1">
                <Shield size={13} className="text-emerald-400" />
                Margem de Segurança
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
              {[0, 10, 15, 20, 30].map(m => (
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

          {/* Parâmetro 4: Taxa de Ativação no NPC */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1">
              <DollarSign size={13} className="text-yellow-400" />
              Ativação NPC (Gold)
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

        {/* Linha de Configurações Extras */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-tibia-border/30 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-400 font-bold">Modo de Quantidade Padrão:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
              <input
                type="radio"
                name="globalQtyMode"
                checked={usePerMemberQty}
                onChange={() => setUsePerMemberQty(true)}
                className="accent-emerald-500"
              />
              <span className="font-bold text-emerald-400">Por Jogador (Multiplica por {members})</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
              <input
                type="radio"
                name="globalQtyMode"
                checked={!usePerMemberQty}
                onChange={() => setUsePerMemberQty(false)}
                className="accent-amber-500"
              />
              <span>Qtd. Total Fechada</span>
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

      {/* 4. BARRA DE ADIÇÃO RÁPIDA DE ITENS DO CATÁLOGO RUBINOT */}
      <div className="bg-black/50 border border-tibia-border/50 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            Adição Rápida: Creature Products Canônicos do RubinOT
          </span>
          <span className="text-[10px] text-gray-400">Clique para incluir instantaneamente na sua lista</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATALOG_SUGGESTED_ITEMS.map(s => {
            const isAdded = items.some(i => i.name.toLowerCase() === s.name.toLowerCase());
            return (
              <button
                key={s.name}
                type="button"
                disabled={isAdded}
                onClick={() => handleQuickAddSuggested(s)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAdded 
                    ? 'bg-zinc-800 text-gray-500 border border-transparent cursor-not-allowed'
                    : 'bg-black/70 hover:bg-amber-950/40 text-gray-300 hover:text-amber-300 border border-tibia-border/50 hover:border-amber-500/50'
                }`}
              >
                {isAdded ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Plus size={12} className="text-amber-400" />}
                <span>{s.name}</span>
                <span className="text-[9px] text-gray-500 font-mono">({s.defaultKk} KK)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. MATRIZ DE ITENS: DEFINIÇÃO DE QTD POR JOGADOR, VALORES EM KK/GP E CONVERSÃO EM RC */}
      <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tibia-border/40 pb-3">
          <div>
            <h4 className="text-base font-medieval text-blue-400 flex items-center gap-2">
              <Package size={18} className="text-blue-400" />
              Matriz de Creature Products (Preços, Qtd. por Jogador e Subtotais)
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Edite a <strong>quantidade por jogador</strong> ou o <strong>total necessário</strong> e o <strong>preço unitário</strong>. O subtotal e o impacto na cota são calculados em tempo real.
            </p>
          </div>

          {/* Ações e Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Busca */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar item..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-black/80 border border-tibia-border/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 w-36 sm:w-44"
              />
            </div>

            {/* Filtro Servidor */}
            <select
              value={serverFilter}
              onChange={(e) => setServerFilter(e.target.value)}
              className="bg-black/80 border border-tibia-border/50 rounded-lg px-2.5 py-1.5 text-xs text-yellow-400 focus:outline-none"
            >
              <option value="ALL">Todos Servidores</option>
              {WORLDS_CONFIG.map(w => (
                <option key={w.world} value={w.world}>{w.world}</option>
              ))}
              <option value="Local">Local ({selectedWorld})</option>
            </select>

            <button
              type="button"
              onClick={() => setItemModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Novo Item</span>
            </button>
          </div>
        </div>

        {/* Resumo Rápido dos Servidores de Origem */}
        <div className="flex flex-wrap items-center gap-2 bg-black/60 p-3 rounded-lg border border-tibia-border/40 text-xs">
          <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1">
            <Filter size={11} />
            Origem dos Recursos:
          </span>
          {result.serverBreakdown.map(sb => (
            <button 
              key={sb.server}
              type="button"
              onClick={() => setServerFilter(serverFilter === sb.server ? 'ALL' : sb.server)}
              className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                serverFilter === sb.server
                  ? 'bg-amber-500 text-black border-amber-400 font-black'
                  : 'bg-black/80 border-tibia-border/60 text-gray-200 hover:border-amber-400/50'
              }`}
            >
              <span className="font-bold">{sb.server}:</span>
              <span>{sb.totalQty.toLocaleString('pt-BR')} un</span>
              <span className="text-[10px] opacity-80 font-mono">({sb.totalCostRc} RC)</span>
            </button>
          ))}
        </div>

        {/* Tabela Principal de Itens */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-tibia-border/60 text-gray-400 uppercase tracking-wider font-bold bg-black/60">
                <th className="py-2.5 px-3">Item / Bônus</th>
                <th className="py-2.5 px-3 text-center">Modo</th>
                <th className="py-2.5 px-3 text-right">Qtd / Jogador</th>
                <th className="py-2.5 px-3 text-right">Qtd. Total</th>
                <th className="py-2.5 px-3 text-right">Preço Unit. (Gold)</th>
                <th className="py-2.5 px-3 text-right text-gray-300">Unit. (RC)</th>
                <th className="py-2.5 px-3 text-right">Subtotal (KK)</th>
                <th className="py-2.5 px-3 text-right text-amber-400">Subtotal (RC)</th>
                <th className="py-2.5 px-3 text-right text-emerald-300">Cota / Membro</th>
                <th className="py-2.5 px-3">Servidor</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tibia-border/30">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-8 text-gray-500 italic">
                    Nenhum creature product corresponde aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayedItems.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Item / Nome / Categoria */}
                    <td className="py-2 px-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-400 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        {item.category}
                      </span>
                    </td>

                    {/* Modo de Cálculo: Por Membro vs Total Fixo */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(item.id, 'calcMode', item.calcMode === 'per_member' ? 'total_fixed' : 'per_member')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border cursor-pointer ${
                          item.calcMode === 'per_member'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                        title="Clique para alternar entre quantidade por membro ou quantidade total fixa"
                      >
                        {item.calcMode === 'per_member' ? 'Por Membro' : 'Fixo Total'}
                      </button>
                    </td>

                    {/* Qtd por Jogador */}
                    <td className="py-2 px-3 text-right font-mono">
                      <input
                        type="number"
                        min="0.1"
                        step="1"
                        value={item.quantityPerMember || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'quantityPerMember', Math.max(0.1, Number(e.target.value)))}
                        className="w-20 bg-black/80 border border-tibia-border/50 rounded px-2 py-0.5 text-right text-xs font-mono text-white focus:border-blue-400 focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-500 block">un / player</span>
                    </td>

                    {/* Qtd Total Necessária */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-200">
                      {item.calcMode === 'total_fixed' ? (
                        <input
                          type="number"
                          min="1"
                          value={item.quantityTotal || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'quantityTotal', Math.max(1, Number(e.target.value)))}
                          className="w-24 bg-black/80 border border-tibia-border/50 rounded px-2 py-0.5 text-right text-xs font-mono text-amber-300 focus:border-amber-400 focus:outline-none"
                        />
                      ) : (
                        <span>{item.effectiveQty.toLocaleString('pt-BR')} un</span>
                      )}
                    </td>

                    {/* Preço Unitário (KK) */}
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
                        {item.unitPriceGp.toLocaleString('pt-BR')} gp
                      </span>
                    </td>

                    {/* Preço Unitário (RC) */}
                    <td className="py-2 px-3 text-right font-mono text-gray-300">
                      {item.unitPriceRc} RC
                    </td>

                    {/* Subtotal KK */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-200">
                      {item.subtotalKk.toLocaleString('pt-BR')} KK
                    </td>

                    {/* Subtotal RC */}
                    <td className="py-2 px-3 text-right font-mono font-black text-amber-400">
                      {item.subtotalRc.toLocaleString('pt-BR')} RC
                    </td>

                    {/* Custo na Cota do Jogador */}
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-300">
                      {item.costPerMemberRc} RC
                      <span className="text-[9px] text-gray-400 block font-sans">
                        ({(item.costPerMemberGp / 1000).toFixed(0)}k gp)
                      </span>
                    </td>

                    {/* Servidor de Origem */}
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

                    {/* Status da Compra */}
                    <td className="py-2 px-3 text-center">
                      <select
                        value={item.status || 'planejado'}
                        onChange={(e) => handleUpdateItem(item.id, 'status', e.target.value)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border focus:outline-none ${
                          item.status === 'estoque' 
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : item.status === 'comprando'
                            ? 'bg-yellow-950/60 text-yellow-300 border-yellow-500/40'
                            : item.status === 'em_transito'
                            ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                            : 'bg-zinc-800 text-gray-400 border-tibia-border/40'
                        }`}
                      >
                        <option value="planejado">Planejado</option>
                        <option value="comprando">Comprando</option>
                        <option value="em_transito">Em Trânsito WT</option>
                        <option value="estoque">Em Estoque</option>
                      </select>
                    </td>

                    {/* Ações */}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. SEÇÃO DE WORLD TRANSFERS (TRANSFERÊNCIAS ENTRE MUNDOS) */}
      <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tibia-border/40 pb-3">
          <div>
            <h4 className="text-base font-medieval text-purple-400 flex items-center gap-2">
              <Globe size={18} className="text-purple-400" />
              Logística de World Transfers (Custo Padrão RubinOT: 1.490 RC por Char)
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Defina quantos personagens "mula" serão transferidos para transportar os creature products comprados em outros servidores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWtModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Nova Rota de Transfer</span>
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
                <th className="py-2.5 px-3 text-center">Chars / Mulas</th>
                <th className="py-2.5 px-3 text-right">Custo Unit. (RC)</th>
                <th className="py-2.5 px-3 text-right">Taxa Gold Extra</th>
                <th className="py-2.5 px-3 text-right text-purple-400">Total (RC)</th>
                <th className="py-2.5 px-3 text-right">Total (KK)</th>
                <th className="py-2.5 px-3 text-right text-emerald-300">Custo / Jogador</th>
                <th className="py-2.5 px-3">Carga / Observações</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tibia-border/30">
              {result.worldTransfers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-6 text-gray-500 italic">
                    Nenhuma rota de World Transfer cadastrada. Todas as compras estão configuradas localmente.
                  </td>
                </tr>
              ) : (
                result.worldTransfers.map(wt => (
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
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-300">
                      {wt.costPerMemberRc} RC
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. OPÇÃO DE CONTRIBUIÇÃO HÍBRIDA: PAGAR EM RC vs. ENTREGAR OS ITENS EM HUNT */}
      <div className="bg-gradient-to-r from-amber-950/30 via-black/60 to-black/60 border border-amber-500/40 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <BookmarkCheck size={18} />
          <h4 className="text-sm uppercase tracking-wider font-medieval">
            Modelo de Cobrança Híbrido: Pagar a Cota em RC ou Entregar os Itens em Hunt
          </h4>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          Muitos jogadores preferem caçar seus próprios creature products para economizar coins. Se um membro optar por entregar seus itens, quanto ele deve entregar?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Opção 1: Cota Padrão em RC */}
          <div className="bg-black/60 border border-emerald-500/40 rounded-lg p-3.5 space-y-2">
            <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
              <Coins size={14} />
              Opção 1: Pagamento Direto em Rubin Coins
            </span>
            <div className="text-2xl font-black font-mono text-white">
              {result.recommendedFeeRc} RC <span className="text-xs font-normal text-gray-400">/ membro</span>
            </div>
            <p className="text-[11px] text-gray-400">
              O jogador envia o valor para o char <code className="text-amber-300">{bankRecipient || `Bank Rubin ${selectedWorld}`}</code> e a liderança adquire todos os itens e cuida do frete.
            </p>
          </div>

          {/* Opção 2: Entrega de Itens em Hunt */}
          <div className="bg-black/60 border border-blue-500/40 rounded-lg p-3.5 space-y-2">
            <span className="text-xs font-black uppercase text-blue-400 flex items-center gap-1.5">
              <Package size={14} />
              Opção 2: Entregar Cota de Itens + Taxa de Frete WT
            </span>
            <div className="text-xs text-gray-300 space-y-1 max-h-28 overflow-y-auto pr-1">
              {result.items.map(it => (
                <div key={it.id} className="flex justify-between border-b border-white/5 py-0.5">
                  <span>{it.name}:</span>
                  <strong className="font-mono text-amber-300">{it.effectiveQtyPerMember} un</strong>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-gray-400">Taxa residual de frete WT + ativação:</span>
              <span className="font-mono font-black text-purple-400">{result.hybridContribution.logisticsFeeRc} RC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. MODAL: ADICIONAR ITEM MANUAL */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-tibia-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-medieval text-yellow-500 flex items-center gap-2">
              <Plus size={18} />
              Novo Creature Product / Item da Ascension
            </h4>
            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Nome do Item:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bloody Pincers, Sabreteeth..."
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
                    placeholder="Ex: Life Leech, Crit..."
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
                  <label className="block text-gray-300 font-bold mb-1">Qtd. por Jogador:</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={newItem.quantityPerMember}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      setNewItem({ 
                        ...newItem, 
                        quantityPerMember: val,
                        quantityTotal: Math.round(val * members)
                      });
                    }}
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

      {/* 9. MODAL: ADICIONAR ROTA DE WORLD TRANSFER */}
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
