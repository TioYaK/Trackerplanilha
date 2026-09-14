import React, { useState, useMemo, useEffect } from 'react';
import { 
  Skull, Shield, Zap, Flame, Compass, AlertTriangle, Heart, 
  Sparkles, CheckCircle2, ChevronRight, Activity, Swords, Info,
  TrendingDown, ShieldAlert, Award, Copy, Check, ExternalLink, Sliders,
  Clock, Bell, BellOff, RotateCcw, Play
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

// Cenários de Combos Letais (Combos que causam Headshot instantâneo)
const COMBAT_SCENARIOS = [
  {
    id: 'bakragore-burst',
    name: 'Bakragore - Combo do Boss Final',
    area: 'Bakragore Sanctum',
    category: 'rotten_blood',
    description: 'Ataque triplo de Miasma de Bakragore + Wave de Corrupção + Melee crítico.',
    primaryElement: 'Death',
    secondaryElement: 'Earth',
    rawMinDamage: 8500,
    rawMaxDamage: 12500,
    elementalSplit: { death: 0.55, earth: 0.25, physical: 0.20 },
    riskNote: 'Exige Might Ring ou Stone Skin Amulet obrigatório para mages e paladins abaixo de level 1100.'
  },
  {
    id: 'darklight-double-beam',
    name: 'Darklight Core - Double Stalker Beam',
    area: 'Darklight Core',
    category: 'rotten_blood',
    description: 'Dois Darklight Stalkers virando beam elétrico + necrose no mesmo turno.',
    primaryElement: 'Energy',
    secondaryElement: 'Death',
    rawMinDamage: 5500,
    rawMaxDamage: 8400,
    elementalSplit: { energy: 0.50, death: 0.30, physical: 0.20 },
    riskNote: 'O beam atravessa a tela inteira. É a maior causa de morte rápida para Druids e Sorcerers.'
  },
  {
    id: 'jaded-roots-burst',
    name: 'Jaded Roots - Corrupção & Veneno',
    area: 'Jaded Roots',
    category: 'rotten_blood',
    description: 'Explosão de Tainted Souls combinada com espinhos venenosos das raízes.',
    primaryElement: 'Earth',
    secondaryElement: 'Physical',
    rawMinDamage: 4800,
    rawMaxDamage: 7500,
    elementalSplit: { earth: 0.60, physical: 0.25, life_drain: 0.15 },
    riskNote: 'Reduz o healing recebido em 20% com Taint 2+. A cura do druid pode não subir o HP a tempo.'
  },
  {
    id: 'putrefactory-explosion',
    name: 'Putrefactory - Slime Detonation',
    area: 'Putrefactory',
    category: 'rotten_blood',
    description: 'Detonação de 2 Putrefactory Slimes em conjunto com o bafo dos Gargoyles.',
    primaryElement: 'Earth',
    secondaryElement: 'Death',
    rawMinDamage: 5200,
    rawMaxDamage: 7900,
    elementalSplit: { earth: 0.50, death: 0.30, physical: 0.20 },
    riskNote: 'Dano de área cumulativo quando a party anda rápido demais e estoura mais de 10 slimes.'
  },
  {
    id: 'gloom-pillars-smash',
    name: 'Gloom Pillars - Choque Sagrado Inverso',
    area: 'Gloom Pillars',
    category: 'rotten_blood',
    description: 'Pilar sombrio descarregando feitiço divino corrompido + corte físico brutal.',
    primaryElement: 'Holy',
    secondaryElement: 'Physical',
    rawMinDamage: 5100,
    rawMaxDamage: 7800,
    elementalSplit: { holy: 0.50, physical: 0.35, death: 0.15 },
    riskNote: 'A proteção a Holy é rara na maioria dos sets convencionais, tornando o hit muito pesado.'
  },
  {
    id: 'soulwar-brachiodemon',
    name: 'Soul War - Brachiodemon Double Wave',
    area: 'Claustrophobic Inferno',
    category: 'soul_war',
    description: 'Dois Brachiodemons desferindo wave de fogo condensada + raio mortal.',
    primaryElement: 'Fire',
    secondaryElement: 'Death',
    rawMinDamage: 5400,
    rawMaxDamage: 8100,
    elementalSplit: { fire: 0.55, death: 0.30, physical: 0.15 },
    riskNote: 'Nunca fique alinhado na frente dos demônios nos corredores de 2 SQMs.'
  }
];

// Efeitos de Taint em Rotten Blood
const TAINT_LEVELS = [
  { level: 0, label: 'Sem Taint (Entrada)', healingReduction: 0, damageTakenIncrease: 0, color: 'text-emerald-400', desc: 'Dano normal e cura 100% efetiva.' },
  { level: 1, label: 'Taint 1 (Sussurro)', healingReduction: 8, damageTakenIncrease: 6, color: 'text-yellow-400', desc: '-8% de cura recebida, +6% de dano sofrido de todas as fontes.' },
  { level: 2, label: 'Taint 2 (Corrupção)', healingReduction: 18, damageTakenIncrease: 14, color: 'text-amber-400', desc: '-18% de cura recebida, +14% de dano sofrido. As raízes atacam com mais fúria.' },
  { level: 3, label: 'Taint 3 (Demência)', healingReduction: 28, damageTakenIncrease: 22, color: 'text-orange-400', desc: '-28% de cura recebida, +22% de dano sofrido. Spawn de alucinações nas salas.' },
  { level: 4, label: 'Taint 4 (Agonia)', healingReduction: 40, damageTakenIncrease: 32, color: 'text-red-400', desc: '-40% de cura recebida, +32% de dano sofrido. Risco imenso de headshot em combos.' },
  { level: 5, label: 'Taint 5 (Bakragore Unleashed)', healingReduction: 55, damageTakenIncrease: 45, color: 'text-purple-400', desc: '-55% de cura recebida, +45% de dano sofrido. Combate de elite máxima!' }
];

// Tabela de Itens BiS Sanguine & Soulwar
const BIS_WEAPONS = [
  { voc: 'Elite Knight', name: 'Sanguine Blade', type: 'Sword 1H', element: 'Físico + Death', bonus: '+4 Sword, Atk 54+7, Def 34, Crítico +10%', drop: 'Bakragore / Roots', priceTC: '3.500 - 5.500 TC' },
  { voc: 'Elite Knight', name: 'Sanguine Cudgel', type: 'Club 1H', element: 'Físico + Death', bonus: '+4 Club, Atk 55+7, Def 33, Crítico +10%', drop: 'Bakragore / Darklight', priceTC: '3.200 - 5.000 TC' },
  { voc: 'Elite Knight', name: 'Sanguine Hatchet', type: 'Axe 1H', element: 'Físico + Death', bonus: '+4 Axe, Atk 55+7, Def 32, Crítico +10%', drop: 'Bakragore / Pillars', priceTC: '3.400 - 5.200 TC' },
  { voc: 'Royal Paladin', name: 'Sanguine Bow', type: 'Bow 2H', element: 'Physical + Holy', bonus: '+5 Dist, Atk +10, Hitchance +8%, Holy +8%', drop: 'Bakragore / Putrefactory', priceTC: '4.500 - 7.000 TC' },
  { voc: 'Royal Paladin', name: 'Sanguine Crossbow', type: 'Crossbow 2H', element: 'Physical + Death', bonus: '+5 Dist, Atk +11, Hitchance +6%, Death +10%', drop: 'Bakragore / Roots', priceTC: '4.000 - 6.500 TC' },
  { voc: 'Elder Druid', name: 'Sanguine Rod', type: 'Rod 1H', element: 'Ice + Earth', bonus: '+5 ML, Ice Amp +10%, Earth Amp +8%, Mana Shield Boost', drop: 'Bakragore / Core', priceTC: '4.000 - 6.800 TC' },
  { voc: 'Master Sorcerer', name: 'Sanguine Wand', type: 'Wand 1H', element: 'Energy + Fire', bonus: '+5 ML, Energy Amp +10%, Fire Amp +8%, Critical +10%', drop: 'Bakragore / Core', priceTC: '3.800 - 6.200 TC' },
  { voc: 'Todas', name: 'Sanguine Legs / Greaves', type: 'Legs', element: 'Resistência All', bonus: '+3 Skill, +8% Proteção Física, +6% Elemental', drop: 'Bakragore Chest', priceTC: '5.000 - 9.000 TC' }
];

export default function RottenBloodHub({ onNavigate, onPlayerClick }) {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator', 'taint', 'bis', 'timer'

  // Timer do Bakragore & Taints
  const [lastKillTime, setLastKillTime] = useState(() => {
    try {
      const saved = localStorage.getItem('rubinot_bakragore_kill_time');
      return saved ? parseInt(saved, 10) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [alarmActive, setAlarmActive] = useState(false);
  const [partyTaints, setPartyTaints] = useState({
    ek: 2,
    ed: 2,
    ms: 2,
    rp1: 1,
    rp2: 1
  });

  const cooldownDurationMs = 20 * 60 * 60 * 1000; // 20 horas
  const readyAtMs = lastKillTime ? lastKillTime + cooldownDurationMs : null;
  const msRemaining = readyAtMs ? Math.max(0, readyAtMs - currentTime) : 0;
  const isBakragoreReady = !lastKillTime || msRemaining === 0;

  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minsRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secsRemaining = Math.floor((msRemaining % (1000 * 60)) / 1000);

  const handleStartBakragoreCooldown = () => {
    const now = Date.now();
    setLastKillTime(now);
    try {
      localStorage.setItem('rubinot_bakragore_kill_time', now.toString());
    } catch (e) {}
  };

  const handleResetBakragoreTimer = () => {
    setLastKillTime(null);
    try {
      localStorage.removeItem('rubinot_bakragore_kill_time');
    } catch (e) {}
  };

  // Parâmetros da Calculadora de Sobrevivência
  const [vocation, setVocation] = useState('Knight');
  const [level, setLevel] = useState(1000);
  const [customHp, setCustomHp] = useState(0); // 0 = calcular automático
  const [selectedScenarioId, setSelectedScenarioId] = useState('darklight-double-beam');
  const [taintLevel, setTaintLevel] = useState(2);
  
  // Equipamentos defensivos selecionados
  const [selectedRing, setSelectedRing] = useState('might'); // 'none', 'might' (20%), 'prismatic' (10%), 'ssa' (80%)
  const [elementalResistPercent, setElementalResistPercent] = useState(35); // Resistência elemental primária
  const [physicalResistPercent, setPhysicalResistPercent] = useState(25); // Resistência física do set
  const [hasImbuementTier3, setHasImbuementTier3] = useState(true); // +15% resistência elemental

  // Cálculo de HP Base conforme vocação e level
  const baseHp = useMemo(() => {
    if (customHp > 0) return customHp;
    const lvl = Math.max(1, parseInt(level) || 1000);
    if (vocation === 'Knight') return 185 + (lvl - 8) * 15;
    if (vocation === 'Paladin') return 185 + (lvl - 8) * 10;
    if (vocation === 'Mage') return 185 + (lvl - 8) * 5;
    if (vocation === 'Monk') return 185 + (lvl - 8) * 12;
    return 185 + (lvl - 8) * 10;
  }, [vocation, level, customHp]);

  // Cenário de combate atual
  const scenario = useMemo(() => {
    return COMBAT_SCENARIOS.find(s => s.id === selectedScenarioId) || COMBAT_SCENARIOS[0];
  }, [selectedScenarioId]);

  // Taint info
  const taintInfo = useMemo(() => {
    return TAINT_LEVELS.find(t => t.level === taintLevel) || TAINT_LEVELS[2];
  }, [taintLevel]);

  // Motor de Cálculo de Mitigação de Dano
  const calculationResult = useMemo(() => {
    // Fator do Ring
    let ringReduction = 0;
    if (selectedRing === 'might') ringReduction = 0.20;
    else if (selectedRing === 'prismatic') ringReduction = 0.10;
    else if (selectedRing === 'ssa') ringReduction = 0.80;

    // Fator de Proteção Elemental
    const elemProt = Math.min(0.75, (elementalResistPercent + (hasImbuementTier3 ? 15 : 0)) / 100);
    const physProt = Math.min(0.60, physicalResistPercent / 100);

    // Dano aumentado pelo Taint
    const taintDmgMultiplier = 1 + (taintInfo.damageTakenIncrease / 100);

    // Calcular dano mínimo e máximo recebido após defesas
    const calcMitigated = (rawDmg) => {
      const dmgAfterTaint = rawDmg * taintDmgMultiplier;
      
      // Quebra proporcional
      const elemPart = dmgAfterTaint * (1 - (scenario.elementalSplit.physical || 0.25));
      const physPart = dmgAfterTaint * (scenario.elementalSplit.physical || 0.25);

      const mitigatedElem = elemPart * (1 - elemProt);
      const mitigatedPhys = physPart * (1 - physProt);

      const subTotal = mitigatedElem + mitigatedPhys;
      const finalDmg = subTotal * (1 - ringReduction);
      return Math.round(finalDmg);
    };

    const mitigatedMin = calcMitigated(scenario.rawMinDamage);
    const mitigatedMax = calcMitigated(scenario.rawMaxDamage);

    // Sobrevivência
    const remainingHpMin = baseHp - mitigatedMin;
    const remainingHpMax = baseHp - mitigatedMax;
    
    // Taxa de Sobrevivência
    let status = 'safe'; // 'safe', 'danger', 'dead'
    let riskPercentage = 0;

    if (remainingHpMax > 0) {
      const margin = remainingHpMax / baseHp;
      if (margin > 0.35) {
        status = 'safe';
        riskPercentage = 0;
      } else {
        status = 'danger';
        riskPercentage = Math.round((1 - margin) * 50);
      }
    } else {
      status = 'dead';
      riskPercentage = Math.min(100, Math.round((Math.abs(remainingHpMax) / baseHp) * 100) + 50);
    }

    // Nível necessário para 100% de segurança
    const hpNeededForSafety = Math.round(mitigatedMax * 1.25);
    const hpDeficit = Math.max(0, hpNeededForSafety - baseHp);
    const hpPerLevel = vocation === 'Knight' ? 15 : vocation === 'Paladin' ? 10 : vocation === 'Monk' ? 12 : 5;
    const levelsNeeded = Math.ceil(hpDeficit / hpPerLevel);

    return {
      mitigatedMin,
      mitigatedMax,
      remainingHpMin,
      remainingHpMax,
      status,
      riskPercentage,
      levelsNeeded,
      hpDeficit
    };
  }, [scenario, taintInfo, selectedRing, elementalResistPercent, hasImbuementTier3, physicalResistPercent, baseHp, vocation]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Banner Principal com Estética Rotten Blood (Rubi Carmesim & Ouro) */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/40 bg-gradient-to-b from-red-950/60 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300 uppercase tracking-wider mb-3">
              <Skull size={14} className="text-red-400 animate-pulse" />
              Rotten Blood & Soul War Strategy Hub 🩸
            </div>
            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold">
              Calculadora de Headshot & Taints
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Descubra matematicamente se o seu personagem suporta os combos letais dos 4 quadrantes de Bakragore e chefes de Soul War, 
              simule o impacto das corrupções de <strong className="text-red-400">Taint</strong> e consulte as armas BiS Sanguine.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="bg-black/80 border border-red-500/40 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Combos Mapeados</span>
              <span className="text-xl font-bold text-red-400 font-mono">6 Cenários</span>
            </div>
            <div className="bg-black/80 border border-yellow-500/40 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Taint Simulator</span>
              <span className="text-xl font-bold text-yellow-400 font-mono">0 a 5 Níveis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação de Abas do Hub */}
      <div className="flex border-b border-tibia-border gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-t-2xl transition-all flex items-center gap-2 border-t border-x ${
            activeTab === 'calculator'
              ? 'bg-red-950/40 text-red-300 border-red-500/50'
              : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <ShieldAlert size={16} className={activeTab === 'calculator' ? 'text-red-400' : ''} />
          Calculadora Anti-Headshot
        </button>

        <button
          onClick={() => setActiveTab('taint')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-t-2xl transition-all flex items-center gap-2 border-t border-x ${
            activeTab === 'taint'
              ? 'bg-red-950/40 text-red-300 border-red-500/50'
              : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <Activity size={16} className={activeTab === 'taint' ? 'text-red-400' : ''} />
          Simulador de Taints (Corrupção)
        </button>

        <button
          onClick={() => setActiveTab('bis')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-t-2xl transition-all flex items-center gap-2 border-t border-x ${
            activeTab === 'bis'
              ? 'bg-red-950/40 text-red-300 border-red-500/50'
              : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <Swords size={16} className={activeTab === 'bis' ? 'text-red-400' : ''} />
          Armas BiS Sanguine & Preços
        </button>

        <button
          onClick={() => setActiveTab('timer')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-t-2xl transition-all flex items-center gap-2 border-t border-x ${
            activeTab === 'timer'
              ? 'bg-red-950/40 text-red-300 border-red-500/50'
              : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <Clock size={16} className={activeTab === 'timer' ? 'text-red-400' : ''} />
          Timer Bakragore & Taints
        </button>
      </div>

      {/* CONTEÚDO 1: CALCULADORA ANTI-HEADSHOT */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Painel Esquerdo: Configurações do Personagem & Cenário (5 colunas) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            <div className="bg-black/70 border border-tibia-border p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
              <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                <Sliders size={16} /> 1. Seu Personagem & Defesas
              </h3>

              {/* Vocação */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold">Vocação:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['Knight', 'Paladin', 'Mage', 'Monk'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVocation(v)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        vocation === v
                          ? 'bg-red-500/30 border-red-500 text-red-200 shadow-md'
                          : 'bg-black/50 border-tibia-border text-gray-400 hover:text-white'
                      }`}
                    >
                      {v === 'Mage' ? 'MS / ED' : v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level & HP Total */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold">Level Atual:</label>
                  <input
                    type="number"
                    min={100}
                    max={3000}
                    value={level}
                    onChange={(e) => setLevel(parseInt(e.target.value) || 1000)}
                    className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-sm text-yellow-400 font-mono font-bold focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold">
                    HP Pool Total:
                  </label>
                  <div className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-sm text-green-400 font-mono font-bold flex items-center justify-between">
                    <span>{baseHp.toLocaleString()}</span>
                    <Heart size={14} className="text-red-500 fill-red-500" />
                  </div>
                </div>
              </div>

              {/* Anel Defensivo */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold">Anel / Amuleto em Uso:</label>
                <select
                  value={selectedRing}
                  onChange={(e) => setSelectedRing(e.target.value)}
                  className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
                >
                  <option value="none">Nenhum Anel de Redução (0%)</option>
                  <option value="prismatic">Prismatic Ring (-10% Físico)</option>
                  <option value="might">Might Ring (-20% de Todo Dano)</option>
                  <option value="ssa">Stone Skin Amulet / SSA (-80% Físico & Morte)</option>
                </select>
              </div>

              {/* Resistências do Set */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold">
                    Resist. Elemental Set:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={70}
                      value={elementalResistPercent}
                      onChange={(e) => setElementalResistPercent(parseInt(e.target.value) || 0)}
                      className="w-full bg-black/90 border border-tibia-border rounded-xl px-3 py-1.5 text-xs text-blue-400 font-mono font-bold focus:outline-none"
                    />
                    <span className="text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold">
                    Resist. Física Set:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={physicalResistPercent}
                      onChange={(e) => setPhysicalResistPercent(parseInt(e.target.value) || 0)}
                      className="w-full bg-black/90 border border-tibia-border rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none"
                    />
                    <span className="text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Imbuement Tier 3 Checkbox */}
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasImbuementTier3}
                  onChange={(e) => setHasImbuementTier3(e.target.checked)}
                  className="rounded text-red-500 focus:ring-0"
                />
                <span className="text-xs text-gray-300 font-medium">
                  Imbuement de Proteção Elemental Tier 3 ativo (+15%)
                </span>
              </label>

              {/* Nível de Taint na Hunt */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold">
                  Nível de Corrupção (Taint):
                </label>
                <select
                  value={taintLevel}
                  onChange={(e) => setTaintLevel(parseInt(e.target.value))}
                  className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-red-400 font-bold focus:outline-none focus:border-red-500"
                >
                  {TAINT_LEVELS.map(t => (
                    <option key={t.level} value={t.level}>
                      {t.label} ({t.damageTakenIncrease > 0 ? `+${t.damageTakenIncrease}% Dano Sofrido` : 'Sem penalidade'})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Seletor de Cenário de Combate */}
            <div className="bg-black/70 border border-tibia-border p-5 rounded-2xl flex flex-col gap-3 shadow-xl">
              <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                <Skull size={16} /> 2. Cenário Letal Selecionado
              </h3>

              <div className="flex flex-col gap-2">
                {COMBAT_SCENARIOS.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScenarioId(s.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                      selectedScenarioId === s.id
                        ? 'bg-red-950/50 border-red-500/80 shadow-md shadow-red-500/10'
                        : 'bg-black/50 border-tibia-border/60 hover:border-yellow-500/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-200">{s.name}</span>
                      <span className="text-[10px] uppercase font-bold text-red-400 font-mono">
                        {s.rawMinDamage} - {s.rawMaxDamage} Bruto
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">{s.description}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Painel Direito: Diagnóstico Matemático e Relatório de Risco (7 colunas) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Card Principal de Veredito de Sobrevivência */}
            <div className={`p-6 rounded-3xl border-2 shadow-2xl flex flex-col gap-4 relative overflow-hidden ${
              calculationResult.status === 'safe'
                ? 'bg-gradient-to-b from-emerald-950/40 via-black to-black border-emerald-500/60'
                : calculationResult.status === 'danger'
                ? 'bg-gradient-to-b from-yellow-950/40 via-black to-black border-yellow-500/60'
                : 'bg-gradient-to-b from-red-950/50 via-black to-black border-red-500/80'
            }`}>
              
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                    calculationResult.status === 'safe'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : calculationResult.status === 'danger'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                  }`}>
                    {calculationResult.status === 'safe' && '🛡️ 100% SEGURO CONTRA COMBO'}
                    {calculationResult.status === 'danger' && '⚠️ RISCO ELEVADO DE MORTE'}
                    {calculationResult.status === 'dead' && '💀 ALERTA MÁXIMO: HEADSHOT CERTO!'}
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-medieval text-gradient-gold mt-3">
                    {calculationResult.status === 'safe' && 'Você Sobrevive ao Combo!'}
                    {calculationResult.status === 'danger' && 'Risco de Queda Repentina'}
                    {calculationResult.status === 'dead' && 'Você Morre Instantaneamente!'}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Dano Real Sofrido:</span>
                  <span className="text-2xl font-bold font-mono text-red-400">
                    {calculationResult.mitigatedMin.toLocaleString()} ~ {calculationResult.mitigatedMax.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Barra Visual de HP Restante */}
              <div className="bg-black/80 p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-300">HP Após Pior Combo:</span>
                  <span className={calculationResult.remainingHpMax > 0 ? 'text-green-400 font-mono' : 'text-red-500 font-mono'}>
                    {calculationResult.remainingHpMax > 0 
                      ? `+${calculationResult.remainingHpMax.toLocaleString()} HP (${Math.round((calculationResult.remainingHpMax / baseHp) * 100)}% restante)`
                      : `${calculationResult.remainingHpMax.toLocaleString()} HP (Overkill de ${Math.abs(calculationResult.remainingHpMax).toLocaleString()} de dano)`
                    }
                  </span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      calculationResult.status === 'safe' ? 'bg-emerald-500' : calculationResult.status === 'danger' ? 'bg-yellow-500' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, Math.round((calculationResult.remainingHpMax / baseHp) * 100))) }%` }}
                  />
                </div>
              </div>

              {/* Recomendação de Segurança */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs leading-relaxed text-gray-300 flex items-start gap-3">
                <Info size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-yellow-300 block mb-1">Diagnóstico Tático da IA:</strong>
                  {calculationResult.status === 'safe' && (
                    <span>
                      Suas proteções e HP pool atual de <strong>{baseHp.toLocaleString()} HP</strong> são suficientes para segurar 
                      o pior golpe deste combo sem risco de morte súbita. Mantenha a cura ativa no capricho.
                    </span>
                  )}
                  {calculationResult.status === 'danger' && (
                    <span>
                      Se você estiver full HP, você aguenta o tranco com <strong>{calculationResult.remainingHpMax} HP restantes</strong>. 
                      Porém, se receber qualquer hit fraco antes do combo, o headshot é imediato. Recomendado usar <strong>Might Ring</strong> permanente ou aumentar o level.
                    </span>
                  )}
                  {calculationResult.status === 'dead' && (
                    <span>
                      O combo máximo causará <strong>{calculationResult.mitigatedMax.toLocaleString()} de dano</strong>, superando seu HP em 
                      <strong> {calculationResult.hpDeficit.toLocaleString()} pontos</strong>! Para ficar seguro, você precisa de mais 
                      <strong className="text-yellow-400"> +{calculationResult.levelsNeeded} levels</strong> ou equipar um 
                      <strong className="text-red-400"> Might Ring / Stone Skin Amulet</strong> e aumentar sua proteção elemental.
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Comparativo de Anéis Defensivos para o Cenário Atual */}
            <div className="bg-black/70 border border-tibia-border p-5 rounded-2xl flex flex-col gap-3 shadow-xl">
              <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                <Shield size={16} /> Comparativo de Sobrevivência por Anel
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                {/* Sem Anel */}
                <div className="bg-black/80 border border-tibia-border p-3 rounded-xl flex flex-col gap-1">
                  <span className="font-bold text-gray-300">Sem Anel Redutor</span>
                  <span className="text-[11px] text-gray-400">0% de absorção extra</span>
                  <div className="mt-2 text-xs font-mono font-bold text-red-400">
                    Combo: {Math.round(scenario.rawMaxDamage * (1 + taintInfo.damageTakenIncrease/100) * (1 - (elementalResistPercent/100)*0.7))} Dmg
                  </div>
                </div>

                {/* Might Ring */}
                <div className="bg-black/80 border border-yellow-500/30 p-3 rounded-xl flex flex-col gap-1">
                  <span className="font-bold text-yellow-300 flex items-center gap-1">
                    Might Ring ⭐
                  </span>
                  <span className="text-[11px] text-gray-400">Absorve 20% de tudo</span>
                  <div className="mt-2 text-xs font-mono font-bold text-yellow-400">
                    Reduz ~{Math.round(scenario.rawMaxDamage * 0.20)} de dano
                  </div>
                </div>

                {/* SSA */}
                <div className="bg-black/80 border border-emerald-500/30 p-3 rounded-xl flex flex-col gap-1">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    Stone Skin (SSA)
                  </span>
                  <span className="text-[11px] text-gray-400">Absorve 80% físico/death</span>
                  <div className="mt-2 text-xs font-mono font-bold text-emerald-400">
                    Mitigação Quase Total
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* CONTEÚDO 2: SIMULADOR DE TAINTS */}
      {activeTab === 'taint' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          
          <div className="bg-black/70 border border-tibia-border p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-lg font-medieval text-yellow-400 flex items-center gap-2">
              <Activity size={20} className="text-red-400" />
              Mecânica Oficial de Corrupção (Taints) do RubinOT
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              Em Rotten Blood, conforme você derrota criaturas e avança pelos quadrantes, seu personagem acumula 
              pontos de loucura denominados <strong>Taints</strong>. A cada nível de Taint, a cura recebida pelo Druid e por potions cai severamente, 
              enquanto o dano recebido de todos os monstros se eleva.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {TAINT_LEVELS.map(t => (
                <div 
                  key={t.level}
                  className={`bg-black/80 border p-4 rounded-2xl flex flex-col gap-2 transition-all ${
                    taintLevel === t.level ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-tibia-border/70'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${t.color}`}>{t.label}</span>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white/10">
                      Nível {t.level}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 mt-1">{t.desc}</p>

                  <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs mt-auto">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Penalidade de Cura:</span>
                      <span className="font-bold text-red-400 font-mono">-{t.healingReduction}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Dano Sofrido:</span>
                      <span className="font-bold text-yellow-400 font-mono">+{t.damageTakenIncrease}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* CONTEÚDO 3: ARMAS BIS SANGUINE & SOULWAR */}
      {activeTab === 'bis' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="bg-black/70 border border-tibia-border p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-lg font-medieval text-yellow-400 flex items-center gap-2">
              <Swords size={20} className="text-yellow-400" />
              Catálogo Supremo de Armas Sanguine & Valores de Mercado
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Itens Sanguine são os equipamentos definitivos de Tibia e RubinOT. Obtidos exclusivamente em Rotten Blood, 
              eles adicionam poder de ataque devastador e amplificação elemental única.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-black/80 text-yellow-400 uppercase text-[10px] font-bold border-b border-tibia-border">
                  <tr>
                    <th className="py-3 px-3">Item / Arma</th>
                    <th className="py-3 px-3">Classe</th>
                    <th className="py-3 px-3">Tipo / Elemento</th>
                    <th className="py-3 px-3">Atributos & Buffs</th>
                    <th className="py-3 px-3">Origem</th>
                    <th className="py-3 px-3 text-right">Preço FIPE Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tibia-border/50">
                  {BIS_WEAPONS.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-bold text-yellow-300 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-red-400" />
                        {item.name}
                      </td>
                      <td className="py-3 px-3 text-gray-200 font-semibold">{item.voc}</td>
                      <td className="py-3 px-3 text-gray-300">{item.element}</td>
                      <td className="py-3 px-3 text-gray-400">{item.bonus}</td>
                      <td className="py-3 px-3 text-red-300 font-medium">{item.drop}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-yellow-400">
                        {item.priceTC}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO 4: TIMER DO BAKRAGORE & TAINT TRACKER */}
      {activeTab === 'timer' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Card Principal: Cronômetro do Boss */}
          <div className="bg-black/80 border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Esquerda: Status e Relógio Gigante */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                    isBakragoreReady 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}>
                    {isBakragoreReady ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    {isBakragoreReady ? 'BAKRAGORE LIVRE / PRONTO PARA MATAR' : 'COOLDOWN DE 20H ATIVO'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    Cooldown Oficial: 20 horas por personagem
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                    {isBakragoreReady ? (
                      <span className="text-emerald-400">00:00:00</span>
                    ) : (
                      <span className="text-red-400">
                        {String(hoursRemaining).padStart(2, '0')}:
                        {String(minsRemaining).padStart(2, '0')}:
                        {String(secsRemaining).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {isBakragoreReady 
                      ? 'Você não possui penalidade ativa. Pode entrar na sala do boss a qualquer momento.'
                      : `Liberado em: ${new Date(readyAtMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`
                    }
                  </p>
                </div>

                {/* Barra de Progresso do Cooldown */}
                {!isBakragoreReady && (
                  <div className="w-full bg-black/60 border border-tibia-border h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-1000 rounded-full"
                      style={{ width: `${Math.max(2, Math.min(100, 100 - (msRemaining / cooldownDurationMs * 100)))}%` }}
                    />
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleStartBakragoreCooldown}
                    className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-red-600/30"
                  >
                    <Play size={16} /> Matei o Bakragore Agora! (Iniciar 20h)
                  </button>

                  <button
                    onClick={handleResetBakragoreTimer}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition border border-tibia-border"
                  >
                    <RotateCcw size={14} /> Resetar / Está Livre
                  </button>
                </div>
              </div>

              {/* Direita: Dicas Rápidas de Alavanca */}
              <div className="lg:col-span-5 bg-black/60 border border-tibia-border/80 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <Flame size={14} className="text-red-400" /> Requisitos da Alavanca do Boss:
                </h4>
                <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
                  <li>Time formado por <strong>5 jogadores</strong> (EK, ED, MS e 2 RPs).</li>
                  <li>Todos devem ter derrotado os 4 bosses dos quadrantes (Murk, Chagorz, Ichgahal e Vemiath).</li>
                  <li>Nenhum membro pode estar com o cooldown de 20h ativo.</li>
                  <li>O nível de Taint de cada um determina a chance de drop de <em>Bag You Desire</em>.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Simulador de Taints da Party (Quem aguenta o Bakragore?) */}
          <div className="bg-black/70 border border-tibia-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tibia-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity size={20} className="text-red-400" /> Calculador de Taint da Party (5 Jogadores)
                </h3>
                <p className="text-xs text-gray-400">
                  Defina o nível de Taint de cada membro da sua equipe para calcular a corrupção total da sala e risco de wipe.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-300 uppercase">Taints Acumulados:</span>
                <span className="px-3 py-1 bg-red-950/60 border border-red-500/50 rounded-xl font-mono font-bold text-red-300 text-lg">
                  {partyTaints.ek + partyTaints.ed + partyTaints.ms + partyTaints.rp1 + partyTaints.rp2} / 25
                </span>
              </div>
            </div>

            {/* Controles por Vocação da Party */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { key: 'ek', role: 'Elite Knight (Blocker)', color: 'text-yellow-400' },
                { key: 'ed', role: 'Elder Druid (Healer)', color: 'text-blue-400' },
                { key: 'ms', role: 'Master Sorcerer (DPS)', color: 'text-purple-400' },
                { key: 'rp1', role: 'Royal Paladin 1 (DPS)', color: 'text-emerald-400' },
                { key: 'rp2', role: 'Royal Paladin 2 (DPS)', color: 'text-teal-400' },
              ].map(member => (
                <div key={member.key} className="bg-black/80 border border-tibia-border rounded-2xl p-4 space-y-3">
                  <div className="font-bold text-xs text-gray-200">
                    {member.role}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Nível de Taint:
                    </label>
                    <select
                      value={partyTaints[member.key]}
                      onChange={(e) => setPartyTaints({ ...partyTaints, [member.key]: parseInt(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-yellow-400 focus:outline-none"
                    >
                      <option value={0}>Taint 0 (Sem Taint)</option>
                      <option value={1}>Taint 1 (+6% Dano / -8% Heal)</option>
                      <option value={2}>Taint 2 (+14% Dano / -18% Heal)</option>
                      <option value={3}>Taint 3 (+22% Dano / -28% Heal)</option>
                      <option value={4}>Taint 4 (+32% Dano / -40% Heal)</option>
                      <option value={5}>Taint 5 (+45% Dano / -55% Heal)</option>
                    </select>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Dano sofrido: <strong className="text-red-400">+{TAINT_LEVELS[partyTaints[member.key]].damageTakenIncrease}%</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Veredito do Bakragore */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-gray-300">
                  {partyTaints.ek + partyTaints.ed + partyTaints.ms + partyTaints.rp1 + partyTaints.rp2 >= 15 ? (
                    <strong className="text-red-400">Risco Extremo de Wipe!</strong>
                  ) : (
                    <strong className="text-emerald-400">Composição Estável para a Arena!</strong>
                  )}{' '}
                  Mantenha Stone Skin Amulets na hotkey para troca rápida no momento do combo triplo de Miasma.
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Banner de Anúncios AdSense */}
      <AdBanner slot="rotten_blood_footer" format="horizontal" />
    </div>
  );
}
