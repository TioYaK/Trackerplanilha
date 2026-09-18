import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Coins, Users, RefreshCw, Plus, Minus, Trash2, Copy, Check, 
  ArrowRight, Globe, Sparkles, TrendingUp, TrendingDown, DollarSign, 
  Package, Share2, Layers, AlertCircle, Zap, Shield, FileText, Sliders,
  Search, HelpCircle, CheckCircle2, ChevronDown, ChevronUp, ShoppingCart,
  Truck, ArrowUpRight, Filter, Info, BookmarkCheck, Eye, UserCheck, CheckSquare
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
  const [usePerMemberQty, setUsePerMemberQty] = useState(true);
  const [customFeeRc, setCustomFeeRc] = useState('');
  
  // UI & Modos de Visualização
  const [activeViewMode, setActiveViewMode] = useState('leadership'); // 'leadership' | 'member_receipt'
  const [searchFilter, setSearchFilter] = useState('');
  const [serverFilter, setServerFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showMathExplainer, setShowMathExplainer] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedShoppingList, setCopiedShoppingList] = useState(false);
  const [copiedMemberReceipt, setCopiedMemberReceipt] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Tooltip Interativo Flutuante Universal (Não corta nas bordas nem em scroll)
  const [hoveredTip, setHoveredTip] = useState(null);

  const withTip = (title, text, tip = '') => ({
    onMouseEnter: (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredTip({
        title,
        text,
        tip,
        x: Math.min(window.innerWidth - 180, Math.max(160, rect.left + rect.width / 2)),
        y: rect.top
      });
    },
    onMouseLeave: () => setHoveredTip(null)
  });

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

      const matchesCategory = categoryFilter === 'ALL' || 
        (categoryFilter === 'leech' && (item.category.toLowerCase().includes('leech') || item.name.toLowerCase().includes('vampire') || item.name.toLowerCase().includes('silencer') || item.name.toLowerCase().includes('pincers'))) ||
        (categoryFilter === 'damage' && (item.category.toLowerCase().includes('damage') || item.category.toLowerCase().includes('crit') || item.name.toLowerCase().includes('wyrm') || item.name.toLowerCase().includes('demon'))) ||
        (categoryFilter === 'defense' && (item.category.toLowerCase().includes('defense') || item.category.toLowerCase().includes('protect') || item.category.toLowerCase().includes('construct') || item.name.toLowerCase().includes('glooth') || item.name.toLowerCase().includes('hide')));

      return matchesSearch && matchesServer && matchesCategory;
    });
  }, [result.items, searchFilter, serverFilter, categoryFilter]);

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
    text += `• 🏛️ Taxa de ativação da perk: **${result.breakdownPerMember.activationCostRc} RC**\n`;
    text += `• 🛡️ Reserva emergencial (+${result.safetyMarginPct}%): **+${result.breakdownPerMember.marginRc} RC** *(cobre a inflação no preço dos itens que vai acontecer no mercado e imprevistos)*\n\n`;

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
    text += `💰 **Arrecadação Prevista:** ${result.grossRevenueRc.toLocaleString('pt-BR')} RC | 🛡️ **Reserva Emergencial:** +${result.surplusRc.toLocaleString('pt-BR')} RC\n`;
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
    text += `- Taxa de ativação da perk: ${result.breakdownPerMember.activationCostRc} RC\n`;
    text += `- Reserva emergencial (+${result.safetyMarginPct}%): +${result.breakdownPerMember.marginRc} RC (cobre a inflação dos itens e imprevistos)\n\n`;
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

  // Copiar Recibo Simplificado do Membro
  const handleCopyMemberReceipt = () => {
    const targetW = selectedWorld !== 'ALL' ? selectedWorld : 'Auroria';
    const bank = bankRecipient || `Bank Rubin ${targetW}`;

    let text = `🧾 **MEU EXTRATO GUILD PERKS - ${targetW.toUpperCase()}**\n`;
    text += `💎 **Minha Cota:** ${result.recommendedFeeRc} RC (ou ${result.recommendedFeeKk.toLocaleString('pt-BR')} KK Gold)\n\n`;
    text += `🔍 **Para onde vai o meu pagamento:**\n`;
    text += `• Creature Products: ${result.breakdownPerMember.itemsCostRc} RC\n`;
    text += `• Frete World Transfers: ${result.breakdownPerMember.wtCostRc} RC\n`;
    text += `• Taxa de ativação da perk: ${result.breakdownPerMember.activationCostRc} RC\n`;
    text += `• Reserva emergencial (+${result.safetyMarginPct}%): +${result.breakdownPerMember.marginRc} RC (cobre a inflação dos itens no mercado e imprevistos)\n\n`;
    text += `🏦 **Destinatário RubinBank:** \`${bank}\`\n`;
    text += `📦 **Se preferir entregar em itens:** Depositar os creature products no depot da guilda + taxa de frete de ${result.hybridContribution.logisticsFeeRc} RC.`;

    navigator.clipboard.writeText(text);
    setCopiedMemberReceipt(true);
    setTimeout(() => setCopiedMemberReceipt(false), 3000);
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
      {/* 1. TOP HEADER COM SELETOR DE VISÃO (MEMBRO vs LIDERANÇA) */}
      <div className="bg-black/50 border border-tibia-border/60 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-tibia-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl font-medieval text-emerald-400 flex items-center gap-2.5">
                <Calculator className="text-emerald-400" size={24} />
                Projeção & Gestão de Cota: Guild Perks
              </h3>
              <span 
                {...withTip('Padrão RubinOT', 'Sistema oficial de cálculo proporcional à quantidade de membros ativos, itens de ascensão e transferências de mundo.', 'Taxa oficial de WT: 1.490 RC')}
                className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-help"
              >
                RubinOT Oficial ℹ️
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-3xl">
              Passe o mouse sobre qualquer elemento para entender a conta. Alterne entre a <strong>Visão do Membro</strong> (extrato pessoal simplificado) e o <strong>Painel da Liderança</strong> (edição de custos e logística).
            </p>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyDiscord}
              {...withTip('Copiar para Discord', 'Copia um extrato completo com emojis e divisão de custos para colar no canal de avisos da guilda.')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
            >
              {copiedSummary ? <Check size={14} className="text-green-300" /> : <Copy size={14} />}
              <span>{copiedSummary ? 'Discord Copiado!' : 'Copiar Discord'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              {...withTip('Copiar para WhatsApp', 'Copia um resumo compacto formatado com negrito e marcadores para grupos de WhatsApp.')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white shadow-md cursor-pointer"
            >
              {copiedWhatsApp ? <Check size={14} className="text-green-300" /> : <Share2 size={14} />}
              <span>{copiedWhatsApp ? 'WhatsApp Copiado!' : 'WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShoppingList}
              {...withTip('Lista de Compras', 'Gera a lista de compras discriminada por servidor para entregar às mulas que irão viajar no World Transfer.')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white shadow-md cursor-pointer"
            >
              {copiedShoppingList ? <Check size={14} className="text-green-300" /> : <ShoppingCart size={14} />}
              <span>{copiedShoppingList ? 'Lista Copiada!' : 'Lista de Compras'}</span>
            </button>

            {isAdmin && onApplyOfficialFee && (
              <button
                type="button"
                onClick={handleApplyFee}
                {...withTip('Definir como Oficial', 'Salva este valor calculado no banco de dados do Supabase como a cota oficial exigida de todos os membros do servidor.', 'Apenas Administradores')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black shadow-md cursor-pointer"
              >
                {applySuccess ? <Check size={14} /> : <Zap size={14} />}
                <span>{applySuccess ? 'Cota Salva!' : `Aplicar ${result.recommendedFeeRc} RC`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Alternador de Modo de Visualização: Membro vs Liderança */}
        <div className="mt-4 pt-3 border-t border-tibia-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-black/70 p-1 rounded-xl border border-tibia-border/60">
            <button
              type="button"
              onClick={() => setActiveViewMode('leadership')}
              {...withTip('Painel de Gestão Completo', 'Visualização avançada com tabela de edição de preços, rotas de World Transfer e simulação de cota.')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeViewMode === 'leadership'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sliders size={14} />
              <span>Painel de Gestão (Liderança)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('member_receipt')}
              {...withTip('Recibo Pessoal do Membro', 'Visualização simplificada e transparente feita especificamente para o jogador ver sua cota e para onde vai o dinheiro.')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeViewMode === 'member_receipt'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye size={14} />
              <span>Extrato Simples (Visão do Membro)</span>
              <span className="px-1 py-0.2 rounded text-[9px] bg-black/40 text-emerald-300 font-bold border border-emerald-400/30">
                Fácil
              </span>
            </button>
          </div>

          {/* Dica de usabilidade */}
          <div className="flex items-center gap-1.5 text-xs text-amber-300/80 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
            <Info size={14} className="shrink-0 text-amber-400" />
            <span>Passe o cursor sobre qualquer campo ou cabeçalho para ver a explicação em detalhes.</span>
          </div>
        </div>

        {/* 4 GRANDES KPI CARDS DE IMPACTO VISUAL COM TOOLTIPS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Cota Recomendada por Jogador */}
          <div 
            {...withTip(
              'Cota Recomendada por Membro', 
              `Valor final sugerido para ratear 100% das despesas da season entre os ${result.members} jogadores pagantes, já incluindo +${result.safetyMarginPct}% de reserva para cobrir inadimplências ou alta no mercado.`,
              `Break-even puro: ${result.breakEvenFeeRc} RC (sem reserva)`
            )}
            className="bg-gradient-to-br from-emerald-950/70 via-black/80 to-black/80 border-2 border-emerald-500/70 p-4 rounded-xl shadow-lg relative overflow-hidden cursor-help hover:border-emerald-400 transition-colors"
          >
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
              Custo real mínimo: <strong className="text-gray-200 font-mono">{result.breakEvenFeeRc} RC</strong> (break-even)
            </p>
          </div>

          {/* Card 2: Creature Products (Itens) */}
          <div 
            {...withTip(
              'Creature Products da Guild Ascension',
              `Soma de todos os itens de caça necessários para ativar as etapas de buffs da guilda.`,
              `Custo por membro: ${result.breakdownPerMember.itemsCostRc} RC (${result.shares.itemsSharePct}% do orçamento)`
            )}
            className="bg-black/60 border border-tibia-border/60 p-4 rounded-xl shadow-lg cursor-help hover:border-blue-400 transition-colors"
          >
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
          <div 
            {...withTip(
              'Logística de World Transfers',
              `Custo para transferir personagens mulas de servidores secundários (1.490 RC cada) carregando suprimentos mais baratos.`,
              `Total: ${result.totalWtCostRc} RC (${result.totalWtTransfersCount} transfers planejados)`
            )}
            className="bg-black/60 border border-tibia-border/60 p-4 rounded-xl shadow-lg cursor-help hover:border-purple-400 transition-colors"
          >
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
          <div 
            {...withTip(
              'Balanço Global do Ciclo',
              `Total de recursos que a guilda arrecada cobrando a cota recomendada de todos os membros, menos todas as despesas de compra e frete.`,
              `Sobra líquida para o RubinBank: +${result.surplusRc} RC`
            )}
            className="bg-black/60 border border-tibia-border/60 p-4 rounded-xl shadow-lg cursor-help hover:border-amber-400 transition-colors"
          >
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
            <span 
              {...withTip('Creature Products', `Representa ${result.shares.itemsSharePct}% de todo o dinheiro gasto para os perks.`)}
              className="text-blue-400 flex items-center gap-1.5 cursor-help"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Creature Products: {result.shares.itemsSharePct}% ({result.totalItemsCostRc.toLocaleString('pt-BR')} RC)
            </span>
            <span 
              {...withTip('World Transfers', `Representa ${result.shares.wtSharePct}% do dinheiro gasto para trazer itens via frete de 1.490 RC.`)}
              className="text-purple-400 flex items-center gap-1.5 cursor-help"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              World Transfers (1.490 RC/char): {result.shares.wtSharePct}% ({result.totalWtCostRc.toLocaleString('pt-BR')} RC)
            </span>
            <span 
              {...withTip('Taxa de ativação da perk', `Representa ${result.shares.activationSharePct}% do dinheiro para ativar os perks da guilda no sistema.`)}
              className="text-yellow-400 flex items-center gap-1.5 cursor-help"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
              Taxa de ativação da perk: {result.shares.activationSharePct}% ({result.activationCostRc.toLocaleString('pt-BR')} RC)
            </span>
            <span 
              {...withTip('Reserva emergencial', `Representa ${result.surplusMarginPct}% guardado no banco para cobrir a inflação dos itens (que inevitavelmente acontece com a alta procura no mercado) e imprevistos.`)}
              className="text-emerald-400 flex items-center gap-1.5 cursor-help"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Reserva emergencial: {result.surplusMarginPct}% (+{result.surplusRc.toLocaleString('pt-BR')} RC)
            </span>
          </div>
          <div className="w-full h-3 bg-black/80 rounded-full overflow-hidden border border-tibia-border/60 flex">
            <div style={{ width: `${result.shares.itemsSharePct}%` }} className="bg-blue-500 transition-all duration-500" />
            <div style={{ width: `${result.shares.wtSharePct}%` }} className="bg-purple-500 transition-all duration-500" />
            <div style={{ width: `${result.shares.activationSharePct}%` }} className="bg-yellow-500 transition-all duration-500" />
            <div style={{ width: `${result.surplusMarginPct}%` }} className="bg-emerald-500 transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* 2. MODO 1: EXTRATO DO MEMBRO (VISÃO SIMPLIFICADA PARA O JOGADOR) */}
      {activeViewMode === 'member_receipt' && (
        <div className="bg-zinc-950 border border-emerald-500/50 rounded-xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tibia-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-medieval text-emerald-400 flex items-center gap-2">
                  <Eye className="text-emerald-400" size={22} />
                  Extrato do Jogador: O Que Você Está Pagando?
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Transparência 100%
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Aqui você confere o valor exato da sua contribuição e para onde vai cada moeda da sua cota.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyMemberReceipt}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-all cursor-pointer shadow"
            >
              {copiedMemberReceipt ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedMemberReceipt ? 'Comprovante Copiado!' : 'Copiar Meu Comprovante'}</span>
            </button>
          </div>

          {/* Destaque da Cota */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/70 border-2 border-emerald-500/60 rounded-xl p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Sua Cota por Ciclo</span>
              <div className="text-4xl font-black font-mono text-white mt-2">
                {result.recommendedFeeRc} <span className="text-lg font-bold text-emerald-400">RC</span>
              </div>
              <div className="text-xs text-amber-300 font-mono mt-1">
                ou {result.recommendedFeeKk.toLocaleString('pt-BR')} KK Gold
              </div>
              <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-white/10">
                Garante o cargo de Membro Ativo e todos os buffs da guilda.
              </p>
            </div>

            <div className="bg-black/70 border border-tibia-border/60 rounded-xl p-5 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <CheckSquare size={14} className="text-blue-400" />
                Como Pagar em Coins (Opção A)
              </span>
              <p className="text-xs text-gray-300 leading-relaxed">
                Envie o valor exato de <strong>{result.recommendedFeeRc} RC</strong> via RubinBank para:
              </p>
              <div className="bg-black/90 p-2.5 rounded-lg border border-amber-500/40 text-center font-mono font-bold text-amber-400 text-sm">
                {bankRecipient || `Bank Rubin ${selectedWorld}`}
              </div>
              <span className="text-[10px] text-gray-400 block text-center">
                A liderança cuidará de comprar todos os creature products e pagar o frete.
              </span>
            </div>

            <div className="bg-black/70 border border-tibia-border/60 rounded-xl p-5 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Package size={14} className="text-purple-400" />
                Entregar Itens em Hunt (Opção B)
              </span>
              <p className="text-xs text-gray-300 leading-relaxed">
                Prefere caçar os monstros e economizar coins? Deposite seus itens no guild depot e pague apenas o frete:
              </p>
              <div className="bg-black/90 p-2 rounded-lg border border-purple-500/40 text-xs flex justify-between items-center font-mono">
                <span className="text-gray-300">Frete WT residual:</span>
                <strong className="text-purple-400">{result.hybridContribution.logisticsFeeRc} RC</strong>
              </div>
              <span className="text-[10px] text-gray-400 block text-center">
                (Veja a lista exata dos seus itens na tabela abaixo)
              </span>
            </div>
          </div>

          {/* Recibo Discriminado */}
          <div className="bg-black/60 border border-tibia-border/60 rounded-xl p-4">
            <h5 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText size={14} className="text-amber-400" />
              Detalhamento Centavo por Centavo da sua Cota de {result.recommendedFeeRc} RC
            </h5>
            <div className="divide-y divide-white/5 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <strong className="text-white">1. Creature Products da Ascension:</strong>
                  <p className="text-[11px] text-gray-400">Sua parte na compra dos {result.items.length} tipos de itens de monstros.</p>
                </div>
                <div className="text-right font-mono font-bold text-blue-400">
                  {result.breakdownPerMember.itemsCostRc} RC
                  <span className="text-[10px] text-gray-500 block">({((result.breakdownPerMember.itemsCostRc * result.rateKkPerRc) * 1000).toFixed(0)}k gp)</span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <strong className="text-white">2. Frete de World Transfers:</strong>
                  <p className="text-[11px] text-gray-400">Sua parte no transporte de mulas entre servidores a 1.490 RC cada.</p>
                </div>
                <div className="text-right font-mono font-bold text-purple-400">
                  {result.breakdownPerMember.wtCostRc} RC
                  <span className="text-[10px] text-gray-500 block">({((result.breakdownPerMember.wtCostRc * result.rateKkPerRc) * 1000).toFixed(0)}k gp)</span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <strong className="text-white">3. Taxa de ativação da perk:</strong>
                  <p className="text-[11px] text-gray-400">Taxa em Gold cobrada diretamente para habilitar as perks.</p>
                </div>
                <div className="text-right font-mono font-bold text-yellow-400">
                  {result.breakdownPerMember.activationCostRc} RC
                  <span className="text-[10px] text-gray-500 block">({((result.breakdownPerMember.activationCostRc * result.rateKkPerRc) * 1000).toFixed(0)}k gp)</span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <strong className="text-white">4. Reserva emergencial (+{result.safetyMarginPct}%):</strong>
                  <p className="text-[11px] text-gray-400">Fundo retido no caixa para cobrir a inflação e alta no preço dos itens no mercado (que inevitavelmente vai acontecer pela alta procura), além de flutuação cambial e eventuais inadimplências.</p>
                </div>
                <div className="text-right font-mono font-bold text-emerald-400">
                  +{result.breakdownPerMember.marginRc} RC
                  <span className="text-[10px] text-gray-500 block">Reserva Emergencial</span>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between text-sm font-black border-t-2 border-emerald-500/50 bg-emerald-950/20 px-3 rounded-lg mt-2">
                <span className="text-emerald-300 uppercase">Total Final por Jogador:</span>
                <span className="font-mono text-emerald-400 text-lg">{result.recommendedFeeRc} RC</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DEMONSTRAÇÃO DIDÁTICA DA MATEMÁTICA (EXPANSÍVEL) */}
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
            {/* 5 Passos Visuais com Tooltips */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Passo 1 */}
              <div 
                {...withTip('Passo 1: Custo dos Itens', 'Soma do valor de mercado de todos os creature products necessários para os buffs.')}
                className="bg-black/60 border border-blue-500/30 rounded-lg p-3 cursor-help hover:border-blue-400 transition-colors"
              >
                <span className="text-[10px] font-black uppercase text-blue-400 block mb-1">Passo 1: Itens</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Soma de todos os creature products:
                </p>
                <div className="mt-2 font-mono font-bold text-blue-300">
                  {result.totalItemsCostKk.toLocaleString('pt-BR')} KK Gold
                </div>
                <div className="text-[10px] text-gray-400">
                  ≈ {result.totalItemsCostRc.toLocaleString('pt-BR')} RC
                </div>
              </div>

              {/* Passo 2 */}
              <div 
                {...withTip('Passo 2: Frete World Transfer', 'Custo total em coins para transferir os personagens de outros mundos com os itens comprados.')}
                className="bg-black/60 border border-purple-500/30 rounded-lg p-3 cursor-help hover:border-purple-400 transition-colors"
              >
                <span className="text-[10px] font-black uppercase text-purple-400 block mb-1">Passo 2: Frete WT</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {result.totalWtTransfersCount} viagens a 1.490 RC:
                </p>
                <div className="mt-2 font-mono font-bold text-purple-300">
                  {result.totalWtCostRc.toLocaleString('pt-BR')} RC
                </div>
                <div className="text-[10px] text-gray-400">
                  ≈ {result.totalWtCostKk.toLocaleString('pt-BR')} KK
                </div>
              </div>

              {/* Passo 3 */}
              <div 
                {...withTip('Passo 3: Taxa de ativação da perk', 'Taxa em Gold necessária para habilitar as etapas da Ascension.')}
                className="bg-black/60 border border-yellow-500/30 rounded-lg p-3 cursor-help hover:border-yellow-400 transition-colors"
              >
                <span className="text-[10px] font-black uppercase text-yellow-400 block mb-1">Passo 3: Taxa de ativação da perk</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Taxa de ativação da perk:
                </p>
                <div className="mt-2 font-mono font-bold text-yellow-300">
                  {result.activationCostRc.toLocaleString('pt-BR')} RC
                </div>
                <div className="text-[10px] text-gray-400">
                  ≈ {result.activationCostKk.toLocaleString('pt-BR')} KK
                </div>
              </div>

              {/* Passo 4 */}
              <div 
                {...withTip('Passo 4: Rateio Líquido', 'Custo total combinado dividido pela quantidade de membros elegíveis.')}
                className="bg-black/60 border border-amber-500/30 rounded-lg p-3 cursor-help hover:border-amber-400 transition-colors"
              >
                <span className="text-[10px] font-black uppercase text-amber-400 block mb-1">Passo 4: Rateio</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Dividido por {result.members} membros:
                </p>
                <div className="mt-2 font-mono font-bold text-amber-300">
                  {result.breakdownPerMember.breakEvenExactRc} RC / player
                </div>
                <div className="text-[10px] text-gray-400">
                  (Mínimo = {result.breakEvenFeeRc} RC)
                </div>
              </div>

              {/* Passo 5 */}
              <div 
                {...withTip('Passo 5: Cota Final com Reserva Emergencial', 'Adiciona a reserva emergencial (+X%) para cobrir a inflação nos preços dos itens no mercado (que inevitavelmente acontece pela alta procura), variações cambiais e inadimplências.')}
                className="bg-black/60 border border-emerald-500/30 rounded-lg p-3 cursor-help hover:border-emerald-400 transition-colors"
              >
                <span className="text-[10px] font-black uppercase text-emerald-400 block mb-1">Passo 5: Cota Final</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  +{result.safetyMarginPct}% Reserva Emergencial:
                </p>
                <div className="mt-2 font-mono font-black text-emerald-300 text-sm">
                  {result.recommendedFeeRc} RC / player
                </div>
                <div className="text-[10px] text-emerald-400">
                  ≈ {result.recommendedFeeKk.toLocaleString('pt-BR')} KK Gold
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. PAINEL DE CONTROLE DINÂMICO DOS PARÂMETROS COM STEPPERS E PRESETS */}
      <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between border-b border-tibia-border/40 pb-3">
          <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-amber-400" />
            Parâmetros Globais da Simulação
          </h4>
          <span className="text-xs text-gray-400">
            Ajuste os valores e veja o recálculo em tempo real
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Parâmetro 1: Membros Contribuintes */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <label 
                {...withTip('Membros Pagantes', 'Quantidade de membros elegíveis que pagarão a cota para ter o cargo e os benefícios das perks.', 'Quanto mais membros, menor o valor da cota individual')}
                className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1 cursor-help"
              >
                <Users size={13} className="text-blue-400" />
                Membros Pagantes ℹ️
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
            {/* Stepper e Roster */}
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setMembers(Math.max(1, members - 10))}
                className="w-7 h-6 rounded bg-black/80 hover:bg-white/10 text-gray-300 border border-tibia-border/60 flex items-center justify-center text-xs font-bold cursor-pointer"
                title="Menos 10 membros"
              >
                -10
              </button>
              <input
                type="number"
                min="1"
                max="5000"
                value={members}
                onChange={(e) => setMembers(Math.max(1, Number(e.target.value)))}
                className="w-full bg-black/80 border border-tibia-border/60 rounded px-2 py-0.5 text-xs text-white font-mono text-center focus:border-blue-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMembers(members + 10)}
                className="w-7 h-6 rounded bg-black/80 hover:bg-white/10 text-gray-300 border border-tibia-border/60 flex items-center justify-center text-xs font-bold cursor-pointer"
                title="Mais 10 membros"
              >
                +10
              </button>
              {activeMembersCount > 0 && (
                <button
                  type="button"
                  onClick={() => setMembers(activeMembersCount)}
                  {...withTip('Puxar do Roster', `Sincroniza imediatamente com os ${activeMembersCount} membros ativos cadastrados no sistema deste mundo.`)}
                  className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 whitespace-nowrap cursor-pointer"
                >
                  Roster ({activeMembersCount})
                </button>
              )}
            </div>
            {/* Quick Pills */}
            <div className="flex items-center gap-1 mt-2">
              {[50, 100, 250, 500, 1000].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setMembers(cnt)}
                  className={`flex-1 py-0.5 text-[9px] font-bold rounded border cursor-pointer ${
                    members === cnt 
                      ? 'bg-blue-600 text-white border-blue-400' 
                      : 'bg-black/60 text-gray-400 border-tibia-border/40 hover:text-white'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Parâmetro 2: Cotação de Mercado */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <label 
              {...withTip('Cotação RubinOT (Market)', 'Relação de troca entre Rubin Coins e Gold no mercado do jogo.', 'Padrão Oficial: 25 RC = 2.0 KK Gold (0.08 KK / 80k gold por 1 RC)')}
              className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1 cursor-help"
            >
              <RefreshCw size={13} className="text-yellow-400" />
              Cotação RubinOT ℹ️
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

          {/* Parâmetro 3: Reserva Emergencial */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <label 
                {...withTip('Reserva Emergencial', 'Fundo retido no caixa para cobrir a inflação e aumento no preço dos itens no market (que inevitavelmente vai acontecer pela alta procura da guilda), além de variações cambiais e eventuais inadimplências.', 'Recomendado: 10% a 30%')}
                className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1 cursor-help"
              >
                <Shield size={13} className="text-emerald-400" />
                Reserva Emergencial ℹ️
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
                      ? 'bg-emerald-500 text-black border-emerald-400 font-black' 
                      : 'bg-black/60 text-gray-400 border-tibia-border/40 hover:text-white'
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>

          {/* Parâmetro 4: Taxa de Ativação da Perk */}
          <div className="bg-black/50 border border-tibia-border/50 rounded-lg p-3">
            <label 
              {...withTip('Taxa de ativação da perk', 'Taxa em Gold exigida para habilitar as etapas da Ascension no servidor. Multiplicado pelo número de membros.', 'Gold para o NPC')}
              className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1 cursor-help"
            >
              <DollarSign size={13} className="text-yellow-400" />
              Taxa de Ativação da Perk ℹ️
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
            <span className="text-gray-400 font-bold">Modo Padrão:</span>
            <label 
              {...withTip('Por Jogador (Multiplicativo)', 'Ao alterar a quantidade de membros pagantes, o total de itens necessários aumenta ou diminui automaticamente.')}
              className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white"
            >
              <input
                type="radio"
                name="globalQtyMode"
                checked={usePerMemberQty}
                onChange={() => setUsePerMemberQty(true)}
                className="accent-emerald-500"
              />
              <span className="font-bold text-emerald-400">Por Jogador (Multiplica por {members})</span>
            </label>
            <label 
              {...withTip('Qtd. Total Fechada', 'A quantidade de itens permanece fixa mesmo que você altere o número de membros pagantes.')}
              className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white"
            >
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
            <span 
              {...withTip('Fixar Cota Manual', 'Permite que você defina manualmente um valor arbitrário de cota (ex: 50 RC) para ver a sobra/déficit resultante.')}
              className="text-gray-400 cursor-help"
            >
              Fixar Cota Manual (RC) ℹ️:
            </span>
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

      {/* 5. BARRA DE ADIÇÃO RÁPIDA DE ITENS DO CATÁLOGO RUBINOT */}
      <div className="bg-black/50 border border-tibia-border/50 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            Adição Rápida com 1 Clique (Catálogo RubinOT)
          </span>
          <span className="text-[10px] text-gray-400">Clique para adicionar o item com preço e quantidade sugeridos</span>
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
                {...withTip(`Adicionar ${s.name}`, `Bônus: ${s.category} | Origem padrão: ${s.defaultOrigin} | Qtd sugerida: ${s.defaultPerMember} un/player`)}
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

      {/* 6. MATRIZ DE ITENS: DEFINIÇÃO DE QTD POR JOGADOR, PREÇOS E CONVERSÃO EM RC */}
      <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tibia-border/40 pb-3">
          <div>
            <h4 className="text-base font-medieval text-blue-400 flex items-center gap-2">
              <Package size={18} className="text-blue-400" />
              Matriz de Creature Products (Preços, Quantidades por Jogador e Subtotais)
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Utilize os botões <strong>[-]</strong> e <strong>[+]</strong> ou digite diretamente nos campos. Passe o mouse sobre qualquer cabeçalho para ver sua função.
            </p>
          </div>

          {/* Filtros e Ações */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro Categoria */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-tibia-border/50 text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-2 py-0.5 rounded cursor-pointer ${categoryFilter === 'ALL' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('leech')}
                className={`px-2 py-0.5 rounded cursor-pointer ${categoryFilter === 'leech' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Leech
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('damage')}
                className={`px-2 py-0.5 rounded cursor-pointer ${categoryFilter === 'damage' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Dano/Crit
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('defense')}
                className={`px-2 py-0.5 rounded cursor-pointer ${categoryFilter === 'defense' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Defesa
              </button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar item..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-black/80 border border-tibia-border/50 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 w-32 sm:w-40"
              />
            </div>

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

        {/* Tabela Principal de Itens */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-tibia-border/60 text-gray-400 uppercase tracking-wider font-bold bg-black/60">
                <th 
                  {...withTip('Item / Bônus', 'Nome do creature product e os efeitos de buff ou elemento que ele adiciona à Guild Ascension.')}
                  className="py-2.5 px-3 cursor-help"
                >
                  Item / Bônus ℹ️
                </th>
                <th 
                  {...withTip('Modo de Cálculo', 'Alterne entre cálculo multiplicado pelos membros pagantes ou quantidade total fixa de compra.')}
                  className="py-2.5 px-3 text-center cursor-help"
                >
                  Modo ℹ️
                </th>
                <th 
                  {...withTip('Quantidade por Jogador', 'Quantos itens deste tipo 1 jogador deve entregar ou bancar na sua cota individual.', 'Ex: 8 Vampire Teeth')}
                  className="py-2.5 px-3 text-right cursor-help"
                >
                  Qtd / Jogador ℹ️
                </th>
                <th 
                  {...withTip('Quantidade Total', 'Volume total de itens que a liderança precisa ter em estoque para a season.', 'Fórmula: Qtd/Jogador × Total de Membros')}
                  className="py-2.5 px-3 text-right cursor-help"
                >
                  Qtd. Total ℹ️
                </th>
                <th 
                  {...withTip('Preço Unitário (Gold)', 'Valor médio de compra de 1 unidade deste item no Market do servidor de origem em KK e GP.', '0.04 KK = 40.000 gp')}
                  className="py-2.5 px-3 text-right cursor-help"
                >
                  Preço (Gold) ℹ️
                </th>
                <th 
                  {...withTip('Preço Unitário em RC', 'Conversão direta do preço unitário de 1 item em Rubin Coins.')}
                  className="py-2.5 px-3 text-right text-gray-300 cursor-help"
                >
                  Unit. (RC) ℹ️
                </th>
                <th 
                  {...withTip('Subtotal em Gold', 'Custo total deste item para toda a guilda em KK de Gold.')}
                  className="py-2.5 px-3 text-right cursor-help"
                >
                  Subtotal (KK) ℹ️
                </th>
                <th 
                  {...withTip('Subtotal em RC', 'Custo total deste item convertido em Rubin Coins na cotação oficial.')}
                  className="py-2.5 px-3 text-right text-amber-400 cursor-help"
                >
                  Subtotal (RC) ℹ️
                </th>
                <th 
                  {...withTip('Impacto na Cota Individual', 'Exatamente quanto este item individual pesa no bolso de cada membro da guilda.', 'Ex: 4.0 RC por player')}
                  className="py-2.5 px-3 text-right text-emerald-300 cursor-help"
                >
                  Cota / Player ℹ️
                </th>
                <th 
                  {...withTip('Servidor de Origem', 'Mundo onde o lote do item será adquirido com melhor preço antes de ser transferido via World Transfer.')}
                  className="py-2.5 px-3 cursor-help"
                >
                  Servidor ℹ️
                </th>
                <th 
                  {...withTip('Status da Compra', 'Etapa logística atual do item: Planejado, Comprando, Em Trânsito WT ou Em Estoque.')}
                  className="py-2.5 px-3 text-center cursor-help"
                >
                  Status ℹ️
                </th>
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

                    {/* Modo de Cálculo */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(item.id, 'calcMode', item.calcMode === 'per_member' ? 'total_fixed' : 'per_member')}
                        {...withTip('Alternar Modo de Cálculo', item.calcMode === 'per_member' ? 'Atualmente: Multiplica por jogador. Clique para travar a quantidade total.' : 'Atualmente: Quantidade total fixa. Clique para calcular por jogador.')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border cursor-pointer ${
                          item.calcMode === 'per_member'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {item.calcMode === 'per_member' ? 'Por Player' : 'Fixo Total'}
                      </button>
                    </td>

                    {/* Qtd por Jogador com Steppers */}
                    <td className="py-2 px-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(item.id, 'quantityPerMember', Math.max(0.1, Number((item.quantityPerMember - 1).toFixed(1))))}
                          className="w-5 h-5 rounded bg-black/80 hover:bg-white/10 text-gray-300 border border-tibia-border/60 flex items-center justify-center text-xs font-bold cursor-pointer"
                          title="Diminuir 1 unidade por jogador"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.1"
                          step="1"
                          value={item.quantityPerMember || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'quantityPerMember', Math.max(0.1, Number(e.target.value)))}
                          className="w-14 bg-black/80 border border-tibia-border/50 rounded px-1 py-0.5 text-right text-xs font-mono text-white focus:border-blue-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(item.id, 'quantityPerMember', Number((item.quantityPerMember + 1).toFixed(1)))}
                          className="w-5 h-5 rounded bg-black/80 hover:bg-white/10 text-gray-300 border border-tibia-border/60 flex items-center justify-center text-xs font-bold cursor-pointer"
                          title="Aumentar 1 unidade por jogador"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-500 block text-right mt-0.5">un / player</span>
                    </td>

                    {/* Qtd Total Necessária */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-200">
                      {item.calcMode === 'total_fixed' ? (
                        <input
                          type="number"
                          min="1"
                          value={item.quantityTotal || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'quantityTotal', Math.max(1, Number(e.target.value)))}
                          className="w-20 bg-black/80 border border-tibia-border/50 rounded px-1.5 py-0.5 text-right text-xs font-mono text-amber-300 focus:border-amber-400 focus:outline-none"
                        />
                      ) : (
                        <span>{item.effectiveQty.toLocaleString('pt-BR')} un</span>
                      )}
                    </td>

                    {/* Preço Unitário (KK) com Steppers */}
                    <td className="py-2 px-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(item.id, 'priceKk', Math.max(0, Number((item.priceKk - 0.005).toFixed(3))))}
                          className="w-5 h-5 rounded bg-black/80 hover:bg-white/10 text-gray-300 border border-tibia-border/60 flex items-center justify-center text-xs font-bold cursor-pointer"
                          title="Diminuir 5k gp"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.005"
                          min="0"
                          value={item.priceKk}
                          onChange={(e) => handleUpdateItem(item.id, 'priceKk', Math.max(0, Number(e.target.value)))}
                          className="w-16 bg-black/80 border border-tibia-border/50 rounded px-1 py-0.5 text-right text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(item.id, 'priceKk', Number((item.priceKk + 0.005).toFixed(3)))}
                          className="w-5 h-5 rounded bg-black/80 hover:bg-white/10 text-gray-300 border border-tibia-border/60 flex items-center justify-center text-xs font-bold cursor-pointer"
                          title="Aumentar 5k gp"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400 block font-sans text-right mt-0.5">
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

      {/* 7. SEÇÃO DE WORLD TRANSFERS (TRANSFERÊNCIAS ENTRE MUNDOS) */}
      <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tibia-border/40 pb-3">
          <div>
            <h4 className="text-base font-medieval text-purple-400 flex items-center gap-2">
              <Globe size={18} className="text-purple-400" />
              Logística de World Transfers (Custo Oficial RubinOT: 1.490 RC por Char)
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
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateWt(wt.id, 'charactersCount', Math.max(1, wt.charactersCount - 1))}
                          className="w-5 h-5 rounded bg-black/80 hover:bg-white/10 text-gray-300 border border-tibia-border/60 flex items-center justify-center text-xs font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-white w-6 text-center">{wt.charactersCount}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateWt(wt.id, 'charactersCount', wt.charactersCount + 1)}
                          className="w-5 h-5 rounded bg-black/80 hover:bg-white/10 text-gray-300 border border-tibia-border/60 flex items-center justify-center text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
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

      {/* 8. MODAIS */}
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

      {/* 9. TOOLTIP FLUTUANTE UNIVERSAL FIXO (NÃO CORTA EM OVERFLOW) */}
      {hoveredTip && (
        <div 
          className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 pointer-events-none p-3 bg-zinc-950/95 border border-amber-500/70 rounded-xl shadow-2xl backdrop-blur-md max-w-xs text-xs animate-fadeIn"
          style={{ left: `${hoveredTip.x}px`, top: `${hoveredTip.y - 8}px` }}
        >
          {hoveredTip.title && (
            <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
              <Info size={13} className="text-amber-400 shrink-0" />
              <span>{hoveredTip.title}</span>
            </div>
          )}
          <div className="text-gray-200 leading-relaxed text-[11px]">{hoveredTip.text}</div>
          {hoveredTip.tip && (
            <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-amber-300/90 font-mono">
              💡 {hoveredTip.tip}
            </div>
          )}
          {/* Seta indicadora */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-950" />
        </div>
      )}
    </div>
  );
}
