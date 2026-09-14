import React, { useState, useEffect, useMemo } from 'react';
import { 
  GEAR_DATABASE, IMBUEMENT_OPTIONS, calculateEffectiveMitigation 
} from '../data/gearDatabase';
import { 
  Shield, Sparkles, Zap, Flame, Skull, Check, Copy, 
  Share2, RotateCcw, Info, ArrowRight, ExternalLink, Sliders 
} from 'lucide-react';

const ELEMENTS = [
  { id: 'physical', name: 'Físico', icon: '🛡️', color: 'text-gray-300', bg: 'bg-gray-900/60', border: 'border-gray-500/40' },
  { id: 'fire', name: 'Fogo', icon: '🔥', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/40' },
  { id: 'ice', name: 'Gelo', icon: '❄️', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/40' },
  { id: 'energy', name: 'Energia', icon: '⚡', color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500/40' },
  { id: 'earth', name: 'Terra', icon: '🌿', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/40' },
  { id: 'death', name: 'Morte (Death)', icon: '💀', color: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-500/40' },
  { id: 'holy', name: 'Sagrado (Holy)', icon: '✨', color: 'text-yellow-300', bg: 'bg-yellow-950/40', border: 'border-yellow-500/40' }
];

export default function GearSetCalculator() {
  const [vocation, setVocation] = useState('Knight');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [rawTestDamage, setRawTestDamage] = useState(3000);

  // Slots de Equipamentos
  const [selectedGear, setSelectedGear] = useState({
    helmet: 'falcon-coif',
    armor: 'falcon-plate',
    legs: 'falcon-greaves',
    boots: 'soulwalkers',
    shield: 'falcon-escutcheon',
    amulet: 'foxtail-amulet',
    ring: 'might-ring'
  });

  // Imbuements nos slots elegíveis
  const [imbuements, setImbuements] = useState({
    helmet: 'none',
    armor: 'death',
    shield: 'fire'
  });

  // Carregar do URL ao montar
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const voc = urlParams.get('voc');
      if (voc) setVocation(voc);

      const h = urlParams.get('h');
      const a = urlParams.get('a');
      const l = urlParams.get('l');
      const b = urlParams.get('b');
      const s = urlParams.get('s');
      const am = urlParams.get('am');
      const r = urlParams.get('r');

      if (h || a || l || b || s || am || r) {
        setSelectedGear(prev => ({
          helmet: h || prev.helmet,
          armor: a || prev.armor,
          legs: l || prev.legs,
          boots: b || prev.boots,
          shield: s || prev.shield,
          amulet: am || prev.amulet,
          ring: r || prev.ring
        }));
      }

      const ih = urlParams.get('ih');
      const ia = urlParams.get('ia');
      const is_ = urlParams.get('is');
      if (ih || ia || is_) {
        setImbuements({
          helmet: ih || 'none',
          armor: ia || 'none',
          shield: is_ || 'none'
        });
      }
    } catch (e) {
      console.warn('Error reading URL gear params', e);
    }
  }, []);

  // Atualizar URL com o set atual sem recarregar a página
  const updateUrl = (newGear, newImbues, newVoc) => {
    try {
      const url = new URL(window.location);
      url.searchParams.set('tab', 'gear');
      url.searchParams.set('voc', newVoc || vocation);
      url.searchParams.set('h', newGear.helmet);
      url.searchParams.set('a', newGear.armor);
      url.searchParams.set('l', newGear.legs);
      url.searchParams.set('b', newGear.boots);
      url.searchParams.set('s', newGear.shield);
      url.searchParams.set('am', newGear.amulet);
      url.searchParams.set('r', newGear.ring);
      url.searchParams.set('ih', newImbues.helmet);
      url.searchParams.set('ia', newImbues.armor);
      url.searchParams.set('is', newImbues.shield);
      window.history.replaceState({}, '', url);
    } catch (e) {}
  };

  const handleGearChange = (slot, id) => {
    const updated = { ...selectedGear, [slot]: id };
    setSelectedGear(updated);
    updateUrl(updated, imbuements, vocation);
  };

  const handleImbueChange = (slot, id) => {
    const updated = { ...imbuements, [slot]: id };
    setImbuements(updated);
    updateUrl(selectedGear, updated, vocation);
  };

  const handleVocationChange = (voc) => {
    setVocation(voc);
    updateUrl(selectedGear, imbuements, voc);
  };

  // Resgatar itens selecionados
  const currentItems = useMemo(() => {
    const get = (cat, id) => (GEAR_DATABASE[cat] || []).find(item => item.id === id);
    return {
      helmet: get('helmets', selectedGear.helmet),
      armor: get('armors', selectedGear.armor),
      legs: get('legs', selectedGear.legs),
      boots: get('boots', selectedGear.boots),
      shield: get('shields', selectedGear.shield),
      amulet: get('amulets', selectedGear.amulet),
      ring: get('rings', selectedGear.ring)
    };
  }, [selectedGear]);

  // Cálculos de Resistência
  const protectionStats = useMemo(() => {
    const totalArm = (currentItems.helmet?.arm || 0) +
      (currentItems.armor?.arm || 0) +
      (currentItems.legs?.arm || 0) +
      (currentItems.boots?.arm || 0) +
      (currentItems.amulet?.arm || 0) +
      (currentItems.ring?.arm || 0);

    const totalDef = currentItems.shield?.def || 0;

    const stats = {};

    ELEMENTS.forEach(elem => {
      const resistances = [];

      // Coleta resistências de cada item equipado
      Object.values(currentItems).forEach(item => {
        if (item?.res && item.res[elem.id]) {
          resistances.push(item.res[elem.id]);
        }
      });

      // Coleta imbuements
      ['helmet', 'armor', 'shield'].forEach(slot => {
        const imb = IMBUEMENT_OPTIONS.find(i => i.id === imbuements[slot]);
        if (imb && imb.element === elem.id) {
          resistances.push(imb.value);
        }
      });

      const effectivePercent = calculateEffectiveMitigation(resistances);
      const additiveSum = resistances.reduce((acc, curr) => acc + curr, 0);

      const raw = Math.max(1, parseInt(rawTestDamage) || 3000);
      const mitigatedDmg = Math.round(raw * (1 - (effectivePercent / 100)));
      const damageAbsorbed = raw - mitigatedDmg;

      stats[elem.id] = {
        effectivePercent,
        additiveSum,
        resistances,
        mitigatedDmg,
        damageAbsorbed
      };
    });

    return { totalArm, totalDef, stats };
  }, [currentItems, imbuements, rawTestDamage]);

  // Gerar Link Compartilhável
  const handleCopyShareLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Gerar Resumo Formatado para Discord
  const handleCopyDiscordSummary = () => {
    const text = [
      `🛡️ SET TANKER RUBINOT (${vocation.toUpperCase()}) 🛡️`,
      `🪖 Helmet: ${currentItems.helmet?.name || 'Nenhum'}`,
      `🛡️ Armor: ${currentItems.armor?.name || 'Nenhum'}`,
      `👖 Legs: ${currentItems.legs?.name || 'Nenhum'}`,
      `👢 Boots: ${currentItems.boots?.name || 'Nenhum'}`,
      `🛡️ Shield: ${currentItems.shield?.name || 'Nenhum'}`,
      `📿 Amulet: ${currentItems.amulet?.name || 'Nenhum'}`,
      `💍 Ring: ${currentItems.ring?.name || 'Nenhum'}`,
      `--- RESISTÊNCIAS COMPOSTAS REAIS ---`,
      `🛡️ Físico: ${protectionStats.stats.physical.effectivePercent}% (Arm: ${protectionStats.totalArm})`,
      `🔥 Fogo: ${protectionStats.stats.fire.effectivePercent}%`,
      `❄️ Gelo: ${protectionStats.stats.ice.effectivePercent}%`,
      `⚡ Energia: ${protectionStats.stats.energy.effectivePercent}%`,
      `🌿 Terra: ${protectionStats.stats.earth.effectivePercent}%`,
      `💀 Morte: ${protectionStats.stats.death.effectivePercent}%`,
      `✨ Sagrado: ${protectionStats.stats.holy.effectivePercent}%`,
      `Link do Set: ${window.location.href}`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Templates Rápidos
  const applyPreset = (presetName) => {
    if (presetName === 'rotten-blood-tank') {
      const g = {
        helmet: 'falcon-coif',
        armor: 'falcon-plate',
        legs: 'falcon-greaves',
        boots: 'soulwalkers',
        shield: 'falcon-escutcheon',
        amulet: 'stone-skin-amulet',
        ring: 'might-ring'
      };
      const imb = { helmet: 'none', armor: 'death', shield: 'earth' };
      setSelectedGear(g);
      setImbuements(imb);
      setVocation('Knight');
      updateUrl(g, imb, 'Knight');
    } else if (presetName === 'fire-tank') {
      const g = {
        helmet: 'falcon-coif',
        armor: 'falcon-plate',
        legs: 'falcon-greaves',
        boots: 'soulwalkers',
        shield: 'falcon-escutcheon',
        amulet: 'magma-amulet',
        ring: 'might-ring'
      };
      const imb = { helmet: 'fire', armor: 'fire', shield: 'fire' };
      setSelectedGear(g);
      setImbuements(imb);
      setVocation('Knight');
      updateUrl(g, imb, 'Knight');
    } else if (presetName === 'mage-sanguine') {
      const g = {
        helmet: 'sanguine-hat',
        armor: 'sanguine-cloak',
        legs: 'sanguine-legs',
        boots: 'sanguine-boots',
        shield: 'sanguine-core',
        amulet: 'foxtail-amulet',
        ring: 'might-ring'
      };
      const imb = { helmet: 'none', armor: 'death', shield: 'energy' };
      setSelectedGear(g);
      setImbuements(imb);
      setVocation('Sorcerer');
      updateUrl(g, imb, 'Sorcerer');
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-gray-100">
      
      {/* CABEÇALHO DA CALCULADORA */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">
              <Shield size={14} className="text-emerald-400" />
              Gear Builder & Resistências Compostas
            </div>
            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold">
              Calculadora de Proteção de Set
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 font-sans mt-2 max-w-2xl leading-relaxed">
              Monte seu equipamento, configure imbuements e descubra a <strong className="text-emerald-400">mitigação multiplicativa real</strong> do seu personagem. Compartilhe o link do seu set com a guild em 1 clique!
            </p>
          </div>

          {/* BOTÕES DE COMPARTILHAMENTO */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copiedLink ? 'Link do Set Copiado!' : 'Copiar Link Compartilhável'}</span>
            </button>

            <button
              onClick={handleCopyDiscordSummary}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95"
            >
              {copiedSummary ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copiedSummary ? 'Texto Copiado!' : 'Copiar para Discord'}</span>
            </button>
          </div>
        </div>

        {/* TEMPLATES RÁPIDOS */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
            ⚡ Sets Prontos:
          </span>
          <button
            onClick={() => applyPreset('rotten-blood-tank')}
            className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/10 border border-white/10 text-xs font-semibold text-emerald-300 transition"
          >
            🛡️ EK Tanker Rotten Blood (Endgame)
          </button>
          <button
            onClick={() => applyPreset('fire-tank')}
            className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/10 border border-white/10 text-xs font-semibold text-amber-300 transition"
          >
            🔥 Full Fire Tanker (Ferumbras / Soul War)
          </button>
          <button
            onClick={() => applyPreset('mage-sanguine')}
            className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/10 border border-white/10 text-xs font-semibold text-purple-300 transition"
          >
            🔮 Full Sanguine Mage
          </button>
        </div>
      </div>

      {/* GRID PRINCIPAL: EQUIPAMENTOS (ESQUERDA) & RESISTÊNCIAS REAIS (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: SLOTS DE GEAR & IMBUEMENTS (7 colunas) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Seletor de Vocação */}
          <div className="bg-black/70 border border-tibia-border p-4 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400">Filtrar por Vocação:</span>
            <div className="flex gap-1.5">
              {['Knight', 'Paladin', 'Druid', 'Sorcerer'].map(v => (
                <button
                  key={v}
                  onClick={() => handleVocationChange(v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    vocation === v 
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                      : 'bg-black/50 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* SLOTS DE EQUIPAMENTOS */}
          <div className="bg-black/70 border border-tibia-border p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
              <Sliders size={16} /> Equipamentos & Imbuements
            </h3>

            {/* 1. HELMET */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/50 p-3 rounded-2xl border border-white/5">
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xl">🪖</span>
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Capacete</span>
                  <span className="text-[10px] text-gray-400">Arm: {currentItems.helmet?.arm || 0}</span>
                </div>
              </div>
              <div className="sm:col-span-5">
                <select
                  value={selectedGear.helmet}
                  onChange={(e) => handleGearChange('helmet', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  {GEAR_DATABASE.helmets.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Arm {item.arm})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <select
                  value={imbuements.helmet}
                  onChange={(e) => handleImbueChange('helmet', e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-900/40 rounded-xl px-2.5 py-2 text-[11px] font-semibold text-emerald-400 focus:outline-none"
                >
                  {IMBUEMENT_OPTIONS.map(i => (
                    <option key={i.id} value={i.id}>{i.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. ARMOR */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/50 p-3 rounded-2xl border border-white/5">
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Armadura</span>
                  <span className="text-[10px] text-gray-400">Arm: {currentItems.armor?.arm || 0}</span>
                </div>
              </div>
              <div className="sm:col-span-5">
                <select
                  value={selectedGear.armor}
                  onChange={(e) => handleGearChange('armor', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  {GEAR_DATABASE.armors.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Arm {item.arm})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <select
                  value={imbuements.armor}
                  onChange={(e) => handleImbueChange('armor', e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-900/40 rounded-xl px-2.5 py-2 text-[11px] font-semibold text-emerald-400 focus:outline-none"
                >
                  {IMBUEMENT_OPTIONS.map(i => (
                    <option key={i.id} value={i.id}>{i.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. LEGS */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/50 p-3 rounded-2xl border border-white/5">
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xl">👖</span>
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Calça (Legs)</span>
                  <span className="text-[10px] text-gray-400">Arm: {currentItems.legs?.arm || 0}</span>
                </div>
              </div>
              <div className="sm:col-span-9">
                <select
                  value={selectedGear.legs}
                  onChange={(e) => handleGearChange('legs', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  {GEAR_DATABASE.legs.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Arm {item.arm})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. BOOTS */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/50 p-3 rounded-2xl border border-white/5">
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xl">👢</span>
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Botas</span>
                  <span className="text-[10px] text-gray-400">Arm: {currentItems.boots?.arm || 0}</span>
                </div>
              </div>
              <div className="sm:col-span-9">
                <select
                  value={selectedGear.boots}
                  onChange={(e) => handleGearChange('boots', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  {GEAR_DATABASE.boots.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Arm {item.arm})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. SHIELD / OFF-HAND */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/50 p-3 rounded-2xl border border-white/5">
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Escudo / Livro</span>
                  <span className="text-[10px] text-gray-400">Def: {currentItems.shield?.def || 0}</span>
                </div>
              </div>
              <div className="sm:col-span-5">
                <select
                  value={selectedGear.shield}
                  onChange={(e) => handleGearChange('shield', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  {GEAR_DATABASE.shields.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Def {item.def})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <select
                  value={imbuements.shield}
                  onChange={(e) => handleImbueChange('shield', e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-900/40 rounded-xl px-2.5 py-2 text-[11px] font-semibold text-emerald-400 focus:outline-none"
                >
                  {IMBUEMENT_OPTIONS.map(i => (
                    <option key={i.id} value={i.id}>{i.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 6. AMULET */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/50 p-3 rounded-2xl border border-white/5">
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xl">📿</span>
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Amuleto</span>
                  <span className="text-[10px] text-gray-400">Arm: {currentItems.amulet?.arm || 0}</span>
                </div>
              </div>
              <div className="sm:col-span-9">
                <select
                  value={selectedGear.amulet}
                  onChange={(e) => handleGearChange('amulet', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  {GEAR_DATABASE.amulets.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 7. RING */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/50 p-3 rounded-2xl border border-white/5">
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xl">💍</span>
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Anel</span>
                  <span className="text-[10px] text-gray-400">{currentItems.ring?.tier}</span>
                </div>
              </div>
              <div className="sm:col-span-9">
                <select
                  value={selectedGear.ring}
                  onChange={(e) => handleGearChange('ring', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  {GEAR_DATABASE.rings.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

        </div>

        {/* COLUNA DIREITA: MATRIZ DE RESISTÊNCIAS COMPOSTAS & SIMULADOR (5 colunas) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card Principal: Total de Armadura & Defesa */}
          <div className="bg-black/80 border border-emerald-500/40 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-gray-400 block">Total de Armadura</span>
                <span className="text-4xl font-black font-mono text-emerald-400">
                  {protectionStats.totalArm} Arm
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase font-bold text-gray-400 block">Defesa de Escudo</span>
                <span className="text-4xl font-black font-mono text-cyan-400">
                  {protectionStats.totalDef} Def
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              💡 Reduz o dano físico base de criaturas de forma fixa antes da porcentagem de absorção.
            </p>
          </div>

          {/* MATRIZ DE ELEMENTOS */}
          <div className="bg-black/70 border border-tibia-border p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                <Shield size={16} /> Resistências Finais (% Real)
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">Fórmula Multiplicativa</span>
            </div>

            <div className="space-y-3">
              {ELEMENTS.map(elem => {
                const stat = protectionStats.stats[elem.id];
                return (
                  <div 
                    key={elem.id} 
                    className={`p-3.5 rounded-2xl border ${elem.bg} ${elem.border} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{elem.icon}</span>
                      <div>
                        <span className={`text-xs font-bold ${elem.color}`}>{elem.name}</span>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <span>Soma aditiva: {stat.additiveSum}%</span>
                          {stat.additiveSum !== stat.effectivePercent && (
                            <span className="text-yellow-400/80 font-mono">(Real: {stat.effectivePercent}%)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-2xl font-black font-mono ${elem.color}`}>
                        {stat.effectivePercent}%
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        Mitigado
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dica Didática Tibiana */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-xs text-gray-300 flex items-start gap-2.5">
              <Info size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                No Tibia, proteções <strong>não se somam diretamente</strong>. Cada item reduz o dano que sobrou do anterior. Esta calculadora aplica a fórmula matemática exata do client oficial.
              </p>
            </div>
          </div>

          {/* SIMULADOR DE DANO RECEBIDO */}
          <div className="bg-black/70 border border-tibia-border p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
              <Zap size={16} /> Testador de Dano Recebido
            </h3>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Dano Bruto do Ataque / Boss (Ex: 3000):</label>
              <input
                type="number"
                min="100"
                max="50000"
                value={rawTestDamage}
                onChange={(e) => setRawTestDamage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xl font-mono text-yellow-400 font-bold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {ELEMENTS.slice(0, 4).map(elem => {
                const stat = protectionStats.stats[elem.id];
                return (
                  <div key={elem.id} className="p-2.5 rounded-xl bg-black/60 border border-white/5">
                    <span className="text-[10px] text-gray-400 block">{elem.icon} {elem.name}</span>
                    <span className="text-base font-bold font-mono text-white">
                      {stat.mitigatedDmg.toLocaleString()} <span className="text-xs text-red-400 font-normal">Dmg</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 block">
                      (-{stat.damageAbsorbed} absorvido)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
