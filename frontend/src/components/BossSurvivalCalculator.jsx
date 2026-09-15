import React, { useState, useMemo } from 'react';
import { 
  Skull, Shield, Zap, AlertTriangle, CheckCircle2, Heart, 
  Flame, Crosshair, Sparkles, Copy, Check, Info, ShieldAlert,
  ChevronRight, RefreshCw, Award, ArrowRight
} from 'lucide-react';
import { soundFX } from '../lib/soundEffects';

// Banco de dados de Bosses Endgame e seus combos máximos em 1 turno (Turn Burst)
export const ENDGAME_BOSSES = [
  {
    id: 'bakragore',
    name: 'Bakragore (Rotten Blood Final)',
    location: 'Rotten Blood',
    tier: 'Extremo (Lethal)',
    tierColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    maxRawCombo: 9400,
    element: 'Death',
    elementShare: 0.65, // 65% Death
    physicalShare: 0.35, // 35% Physical
    description: 'Golpes brutais de Death Beam + Melee Crítico + Rotten Waves. Morte instantânea para quem não usar SSA nas taints.',
    specialMechanic: 'Rotten Taints: Cada taint aumenta todo o dano recebido em +15%!',
    hasTaints: true
  },
  {
    id: 'megalomania',
    name: "Goshnar's Megalomania (Soul War Final)",
    location: 'Soul War',
    tier: 'Extremo (Lethal)',
    tierColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    maxRawCombo: 8600,
    element: 'Death',
    elementShare: 0.60,
    physicalShare: 0.40,
    description: 'Agony Beam + Soul Wave + Melee pesado. Troca constante de SSA e Might Ring obrigatória.',
    specialMechanic: 'Pode combar com summons Soul Slayers adicionando até +2.000 de dano.',
    hasTaints: false
  },
  {
    id: 'primal_wrath',
    name: 'Primal Wrath (Primal Ordeal Final)',
    location: 'Primal Ordeal',
    tier: 'Muito Alto (Tier 4)',
    tierColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    maxRawCombo: 7400,
    element: 'Fire',
    elementShare: 0.60,
    physicalShare: 0.40,
    description: 'Lava Burst + Magma Wave + Melee sísmico. Exige proteção altíssima de Fire e Physical.',
    specialMechanic: 'Hazard levels elevam o dano em +10% por rank de perigo.',
    hasTaints: false
  },
  {
    id: 'murcion',
    name: 'Murcion (Rotten Blood Roots)',
    location: 'Rotten Blood - Jaded Roots',
    tier: 'Muito Alto (Tier 4)',
    tierColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    maxRawCombo: 6900,
    element: 'Earth',
    elementShare: 0.65,
    physicalShare: 0.35,
    description: 'Combo tóxico massivo de Earth + Poison Fields + Melee.',
    specialMechanic: 'Taints aumentam o dano da raiz.',
    hasTaints: true
  },
  {
    id: 'chagorz',
    name: 'Chagorz (Rotten Blood Drowned Library)',
    location: 'Rotten Blood - Putrefactory',
    tier: 'Muito Alto (Tier 4)',
    tierColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    maxRawCombo: 6800,
    element: 'Ice',
    elementShare: 0.60,
    physicalShare: 0.40,
    description: 'Geleiras e ondas de Ice Damage perfurantes combinadas com Melee.',
    specialMechanic: 'Dano de afogamento adicional se perder ar.',
    hasTaints: true
  },
  {
    id: 'soul_malice',
    name: 'Goshnar’s Malice / Hatred (Soul War)',
    location: 'Soul War - Claustrophobic Inferno',
    tier: 'Muito Alto (Tier 4)',
    tierColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    maxRawCombo: 6400,
    element: 'Death',
    elementShare: 0.55,
    physicalShare: 0.45,
    description: 'Soul Blast + Corrupção de Death em área.',
    specialMechanic: 'Malice debuffa resistências antes de combar.',
    hasTaints: false
  },
  {
    id: 'ferumbras',
    name: 'Ferumbras Mortal Shell',
    location: 'Ascending Ferumbras',
    tier: 'Alto (Tier 3)',
    tierColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    maxRawCombo: 5900,
    element: 'Energy',
    elementShare: 0.60,
    physicalShare: 0.40,
    description: 'Ultimate Explosion + Energy Beam + Melee crítico.',
    specialMechanic: 'Pode combar com Rifts e Daemons.',
    hasTaints: false
  },
  {
    id: 'king_zelos',
    name: 'King Zelos',
    location: 'Grave Danger',
    tier: 'Alto (Tier 3)',
    tierColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    maxRawCombo: 5300,
    element: 'Death',
    elementShare: 0.70,
    physicalShare: 0.30,
    description: 'Combos pesados de Death em linha reta e área ao redor.',
    specialMechanic: 'Spawna fantasmas que curam o boss e atacam.',
    hasTaints: false
  },
  {
    id: 'brainstealer',
    name: 'The Brainstealer',
    location: 'Feaster of Souls',
    tier: 'Médio-Alto (Tier 2)',
    tierColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    maxRawCombo: 4400,
    element: 'Energy',
    elementShare: 0.50,
    physicalShare: 0.50,
    description: 'Mana drain pesado + Energy beams + Melee.',
    specialMechanic: 'Drena mana com altíssima frequência.',
    hasTaints: false
  }
];

export default function BossSurvivalCalculator() {
  // Inputs do Personagem
  const [level, setLevel] = useState(650);
  const [vocation, setVocation] = useState('RP'); // 'EK' | 'RP' | 'ED' | 'MS'
  const [extraHp, setExtraHp] = useState(300); // Wheel, Food, Equipamentos
  const [physicalProt, setPhysicalProt] = useState(26); // % de armadura/legs/shield
  const [elementalProt, setElementalProt] = useState(32); // % do elemento primário do boss

  // Toggles de Defesa Rápida
  const [useSsa, setUseSsa] = useState(false); // Stone Skin Amulet (-80% Physical/Death/Elemental)
  const [useMightRing, setUseMightRing] = useState(false); // Might Ring (-20% All)
  const [useAvatar, setUseAvatar] = useState(false); // Avatar of Light/Steel (-15% All)
  const [taintCount, setTaintCount] = useState(0); // Rotten Blood Taints (0 a 5)
  const [selectedBossId, setSelectedBossId] = useState('bakragore');
  const [copied, setCopied] = useState(false);

  // Boss Ativo
  const selectedBoss = useMemo(() => {
    return ENDGAME_BOSSES.find(b => b.id === selectedBossId) || ENDGAME_BOSSES[0];
  }, [selectedBossId]);

  // Cálculo de HP Total do Personagem de acordo com a Vocação
  const characterHp = useMemo(() => {
    const lvl = Math.max(1, parseInt(level) || 1);
    let hpPerLevel = 15;
    if (vocation === 'RP') hpPerLevel = 10;
    if (vocation === 'MS' || vocation === 'ED') hpPerLevel = 5;

    const baseHp = 185 + (lvl - 8) * hpPerLevel;
    const bonus = parseInt(extraHp) || 0;
    return Math.max(150, baseHp + bonus);
  }, [level, vocation, extraHp]);

  // Simulação de dano do combo
  const survivalData = useMemo(() => {
    const rawCombo = selectedBoss.maxRawCombo;

    // Multiplicador de Taints (se o boss possuir mecânica de taint)
    const taintMult = selectedBoss.hasTaints ? 1 + (taintCount * 0.15) : 1;
    const effectiveRaw = rawCombo * taintMult;

    // Dano Elemental e Físico Brutos
    const rawElemental = effectiveRaw * selectedBoss.elementShare;
    const rawPhysical = effectiveRaw * selectedBoss.physicalShare;

    // Mitigações de Gear (1 - %)
    const gearPhysicalMitigation = 1 - Math.min(0.70, (parseFloat(physicalProt) || 0) / 100);
    const gearElementalMitigation = 1 - Math.min(0.85, (parseFloat(elementalProt) || 0) / 100);

    // Buffs defensivos adicionais (SSA, Might Ring, Avatar)
    const ssaFactor = useSsa ? 0.20 : 1.0; // -80%
    const mightRingFactor = useMightRing ? 0.80 : 1.0; // -20%
    const avatarFactor = useAvatar ? 0.85 : 1.0; // -15%

    // Dano Real Recebido após todas as camadas de mitigação
    const finalPhysical = Math.round(rawPhysical * gearPhysicalMitigation * ssaFactor * mightRingFactor * avatarFactor);
    const finalElemental = Math.round(rawElemental * gearElementalMitigation * ssaFactor * mightRingFactor * avatarFactor);
    const totalDamageTaken = finalPhysical + finalElemental;

    // Dano sem SSA (para comparação didática de utilidade do SSA)
    const unbuffedPhysical = Math.round(rawPhysical * gearPhysicalMitigation);
    const unbuffedElemental = Math.round(rawElemental * gearElementalMitigation);
    const unbuffedTotal = unbuffedPhysical + unbuffedElemental;

    // HP Restante
    const remainingHp = characterHp - totalDamageTaken;
    const remainingPercent = Math.round((remainingHp / characterHp) * 100);

    // Effective Health Pool (EHP)
    const overallDamageReduction = 1 - (totalDamageTaken / effectiveRaw);
    const ehp = Math.round(characterHp / Math.max(0.05, 1 - overallDamageReduction));

    // Determinação do Nível de Risco
    let riskLevel = 'SAFE'; // 'HEADSHOT' | 'DANGER' | 'SAFE'
    if (remainingHp <= 0) {
      riskLevel = 'HEADSHOT';
    } else if (remainingPercent <= 25) {
      riskLevel = 'DANGER';
    } else {
      riskLevel = 'SAFE';
    }

    // Cálculo do Level Mínimo para Sobreviver sem Morrer (HP > Dano)
    let hpPerLevel = 15;
    if (vocation === 'RP') hpPerLevel = 10;
    if (vocation === 'MS' || vocation === 'ED') hpPerLevel = 5;

    const minLvlUnbuffed = Math.max(1, Math.ceil((unbuffedTotal - (parseInt(extraHp) || 0) - 185) / hpPerLevel) + 8);
    const minLvlWithSsa = Math.max(1, Math.ceil((Math.round(unbuffedTotal * 0.20) - (parseInt(extraHp) || 0) - 185) / hpPerLevel) + 8);

    return {
      rawCombo,
      effectiveRaw: Math.round(effectiveRaw),
      finalPhysical,
      finalElemental,
      totalDamageTaken,
      unbuffedTotal,
      remainingHp,
      remainingPercent,
      ehp,
      riskLevel,
      overallDamageReduction: Math.round(overallDamageReduction * 100),
      minLvlUnbuffed,
      minLvlWithSsa
    };
  }, [selectedBoss, taintCount, physicalProt, elementalProt, useSsa, useMightRing, useAvatar, characterHp, extraHp, vocation]);

  // Copiar resumo tático para a área de transferência
  const handleCopySummary = () => {
    const summary = `🛡️ [SURVIVAL RADAR] ${vocation} Lvl ${level} vs ${selectedBoss.name}
• HP Máximo: ${characterHp.toLocaleString()} | Dano Combo: ${survivalData.totalDamageTaken.toLocaleString()}
• Status: ${survivalData.riskLevel === 'HEADSHOT' ? '🚨 HEADSHOT (MORTE)' : survivalData.riskLevel === 'DANGER' ? '⚠️ PERIGO (<25% HP)' : '✅ SEGURO'}
• EHP Efetivo: ${survivalData.ehp.toLocaleString()} | Redução Total: ${survivalData.overallDamageReduction}%
• Buffs: ${useSsa ? 'SSA Ativo ' : ''}${useMightRing ? 'Might Ring ' : ''}${useAvatar ? 'Avatar ' : ''}${selectedBoss.hasTaints ? `(Taints: ${taintCount})` : ''}
TrackerPlanilhado RubinOT`;

    navigator.clipboard.writeText(summary);
    soundFX.playTacticalPing();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0b0c10] border border-red-500/30 rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-2xl animate-fade-in text-gray-200">
      
      {/* HEADER DO CALCULADOR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <ShieldAlert size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Simulador de EHP, Headshot & Combos de Bosses
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  Endgame Survival
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Simule se seu personagem aguenta o combo máximo de 1 turno dos bosses mais letais do RubinOT sem morrer.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleCopySummary}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
            copied 
              ? 'bg-green-500 text-black' 
              : 'bg-white/10 hover:bg-yellow-500 hover:text-black text-gray-200'
          }`}
          title="Copiar relatório para Discord / WhatsApp"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copiado!' : 'Compartilhar Dossiê'}</span>
        </button>
      </div>

      {/* SELEÇÃO DO BOSS ALVO */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2 flex items-center gap-1.5">
          <Crosshair size={14} className="text-red-400" />
          Selecione o Boss Endgame para Simular:
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {ENDGAME_BOSSES.map(boss => {
            const isSelected = boss.id === selectedBossId;
            return (
              <button
                key={boss.id}
                onClick={() => {
                  setSelectedBossId(boss.id);
                  if (boss.id === 'primal_wrath') setElementalProt(35);
                  else if (boss.id === 'murcion') setElementalProt(30);
                  else if (boss.id === 'chagorz') setElementalProt(32);
                  else if (boss.id === 'ferumbras' || boss.id === 'brainstealer') setElementalProt(30);
                  else setElementalProt(35); // Death bosses
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-950/40 ring-1 ring-red-500/50'
                    : 'bg-black/50 border-white/10 hover:border-white/25 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-bold text-gray-100 line-clamp-1">{boss.name}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold shrink-0 ${boss.tierColor}`}>
                    {boss.element}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                  <span>Combo Bruto: <strong className="text-red-400 font-mono">{boss.maxRawCombo.toLocaleString()}</strong></span>
                  <span className="text-gray-500">{boss.location}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PAINEL DE CONTROLE: PERSONAGEM & MITIGAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* COLUNA 1: DADOS DO PERSONAGEM */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-3.5 flex flex-col gap-3">
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
            <Heart size={13} className="text-red-400" />
            1. Perfil do Personagem
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Vocação:</label>
              <div className="grid grid-cols-2 gap-1 font-bold">
                {['EK', 'RP', 'MS', 'ED'].map(v => (
                  <button
                    key={v}
                    onClick={() => setVocation(v)}
                    className={`py-1 rounded text-center transition cursor-pointer ${
                      vocation === v 
                        ? 'bg-yellow-500 text-black font-bold' 
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Level:</label>
              <input
                type="number"
                min="100"
                max="2500"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value) || 0)}
                className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs font-mono font-bold text-yellow-400 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">HP Extra (Wheel/Gear):</label>
              <input
                type="number"
                min="0"
                max="3000"
                value={extraHp}
                onChange={(e) => setExtraHp(parseInt(e.target.value) || 0)}
                className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs font-mono text-gray-200 focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">HP Total Resultante:</label>
              <div className="bg-red-950/30 border border-red-500/30 rounded px-2 py-1 font-mono font-bold text-red-400 text-xs flex items-center justify-between">
                <span>{characterHp.toLocaleString()}</span>
                <span className="text-[9px] text-gray-500">HP</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 2: RESISTÊNCIAS DE EQUIPAMENTO */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-3.5 flex flex-col gap-3">
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
            <Shield size={13} className="text-blue-400" />
            2. Proteções de Equipamento
          </span>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[10px] text-gray-400">Proteção Física (%):</span>
              <span className="font-mono text-blue-400 font-bold">{physicalProt}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="55"
              value={physicalProt}
              onChange={(e) => setPhysicalProt(parseInt(e.target.value) || 0)}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <span className="text-[9px] text-gray-500 block mt-0.5">Falcon/Lion Plate, Prismatic, Escudos</span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[10px] text-gray-400">Proteção {selectedBoss.element} (%):</span>
              <span className="font-mono text-purple-400 font-bold">{elementalProt}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="65"
              value={elementalProt}
              onChange={(e) => setElementalProt(parseInt(e.target.value) || 0)}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <span className="text-[9px] text-gray-500 block mt-0.5">Imbuements, Amuletos, Bone Fiddle, Anéis</span>
          </div>
        </div>

        {/* COLUNA 3: DEFESAS EMERGENCIAS (SSA, MIGHT RING, TAINTS) */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
            <Zap size={13} className="text-yellow-400" />
            3. Rotação Defensiva & Taints
          </span>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setUseSsa(prev => !prev)}
              className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                useSsa 
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold shadow-sm' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="text-[10px] font-bold">Stone Skin</span>
              <span className="text-[9px] font-mono opacity-80">-80% Dano</span>
            </button>

            <button
              onClick={() => setUseMightRing(prev => !prev)}
              className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                useMightRing 
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 font-bold shadow-sm' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="text-[10px] font-bold">Might Ring</span>
              <span className="text-[9px] font-mono opacity-80">-20% All</span>
            </button>

            <button
              onClick={() => setUseAvatar(prev => !prev)}
              className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                useAvatar 
                  ? 'bg-purple-500/25 border-purple-400 text-purple-300 font-bold shadow-sm' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="text-[10px] font-bold">Avatar</span>
              <span className="text-[9px] font-mono opacity-80">-15% Wheel</span>
            </button>
          </div>

          {/* Taints do Rotten Blood */}
          {selectedBoss.hasTaints && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-red-300 block">Nível de Taints:</span>
                <span className="text-[9px] text-gray-400">+{taintCount * 15}% dano recebido</span>
              </div>

              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(t => (
                  <button
                    key={t}
                    onClick={() => setTaintCount(t)}
                    className={`w-6 h-6 rounded text-[10px] font-bold font-mono transition cursor-pointer ${
                      taintCount === t 
                        ? 'bg-red-500 text-white font-black' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* RESULTADO DA SIMULAÇÃO: VEREDICTO DE SOBREVIVÊNCIA                         */}
      {/* ========================================================================= */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-4 shadow-xl relative overflow-hidden transition-all ${
        survivalData.riskLevel === 'HEADSHOT'
          ? 'bg-red-950/40 border-red-500 shadow-red-950/40 ring-1 ring-red-500/40'
          : survivalData.riskLevel === 'DANGER'
            ? 'bg-yellow-950/30 border-yellow-500/60 shadow-yellow-950/30'
            : 'bg-emerald-950/30 border-emerald-500/50 shadow-emerald-950/30'
      }`}>
        
        {/* Banner Superior do Veredicto */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              survivalData.riskLevel === 'HEADSHOT' 
                ? 'bg-red-500 text-black animate-pulse' 
                : survivalData.riskLevel === 'DANGER' 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-emerald-500 text-black'
            }`}>
              {survivalData.riskLevel === 'HEADSHOT' ? (
                <Skull size={24} />
              ) : survivalData.riskLevel === 'DANGER' ? (
                <AlertTriangle size={24} />
              ) : (
                <CheckCircle2 size={24} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-gray-400">
                  Veredicto de Sobrevivência:
                </span>
                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                  survivalData.riskLevel === 'HEADSHOT'
                    ? 'bg-red-500 text-white'
                    : survivalData.riskLevel === 'DANGER'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-emerald-400 text-black'
                }`}>
                  {survivalData.riskLevel === 'HEADSHOT'
                    ? '🚨 100% HEADSHOT (MORTE)'
                    : survivalData.riskLevel === 'DANGER'
                      ? '⚠️ ZONA CRÍTICA (< 25% HP)'
                      : '🛡️ SOBREVIVÊNCIA GARANTIDA'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                {survivalData.riskLevel === 'HEADSHOT' ? (
                  <span>Você toma <span className="text-red-400 font-mono font-black">{survivalData.totalDamageTaken.toLocaleString()}</span> de dano e <span className="underline decoration-red-500">MORRE INSTANTANEAMENTE</span>.</span>
                ) : survivalData.riskLevel === 'DANGER' ? (
                  <span>Você sobrevive com apenas <span className="text-yellow-400 font-mono font-bold">{survivalData.remainingHp.toLocaleString()} HP ({survivalData.remainingPercent}%)</span>. Risco alto de combo consecutivo!</span>
                ) : (
                  <span>Você sobrevive tranquilamente com <span className="text-emerald-400 font-mono font-bold">{survivalData.remainingHp.toLocaleString()} HP ({survivalData.remainingPercent}%)</span> restantes.</span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-gray-400 block">Dano Máximo do Combo:</span>
              <span className="text-base sm:text-lg font-mono font-bold text-red-400">
                {survivalData.totalDamageTaken.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">EHP Efetivo:</span>
              <span className="text-base sm:text-lg font-mono font-bold text-blue-400">
                {survivalData.ehp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Barra Visual de HP vs Dano do Boss */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
            <span>HP Total: {characterHp.toLocaleString()}</span>
            <span>Dano Recebido: -{survivalData.totalDamageTaken.toLocaleString()}</span>
            <span>HP Restante: {Math.max(0, survivalData.remainingHp).toLocaleString()} ({Math.max(0, survivalData.remainingPercent)}%)</span>
          </div>

          <div className="w-full bg-black/80 rounded-full h-3 overflow-hidden border border-white/10 relative">
            <div 
              className={`h-full transition-all duration-500 ${
                survivalData.riskLevel === 'HEADSHOT'
                  ? 'bg-red-600'
                  : survivalData.riskLevel === 'DANGER'
                    ? 'bg-yellow-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, survivalData.remainingPercent))}%` }}
            />
          </div>
        </div>

        {/* Grid Comparativo: Impacto do SSA e Níveis Mínimos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          
          <div className="p-3 bg-black/50 border border-white/5 rounded-xl">
            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
              Impacto do Stone Skin (SSA):
            </span>
            <p className="text-gray-300">
              Sem SSA você toma <strong className="text-red-400 font-mono">{survivalData.unbuffedTotal.toLocaleString()}</strong> de dano.
              Com SSA, o dano cai para <strong className="text-green-400 font-mono">{Math.round(survivalData.unbuffedTotal * 0.20).toLocaleString()}</strong>!
            </p>
          </div>

          <div className="p-3 bg-black/50 border border-white/5 rounded-xl">
            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
              Level Mínimo Recomendado:
            </span>
            <div className="flex justify-between items-center mt-1">
              <div>
                <span className="text-[9px] text-gray-400 block">Sem SSA:</span>
                <span className="font-mono font-bold text-yellow-400">Lvl {survivalData.minLvlUnbuffed}</span>
              </div>
              <ArrowRight size={12} className="text-gray-500" />
              <div>
                <span className="text-[9px] text-gray-400 block">Com SSA:</span>
                <span className="font-mono font-bold text-emerald-400">Lvl {survivalData.minLvlWithSsa}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-black/50 border border-white/5 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">
              Mecânica Especial do Boss:
            </span>
            <p className="text-[11px] text-gray-300 italic mt-1">
              "{selectedBoss.specialMechanic}"
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
