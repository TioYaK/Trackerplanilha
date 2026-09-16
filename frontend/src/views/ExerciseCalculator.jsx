import React, { useState, useMemo } from 'react';
import { 
  Sword, Shield, Wand2, Calculator, Coins, Clock, Sparkles, 
  CheckCircle2, Flame, ArrowRight, Zap, Target, Copy, Check, TrendingDown 
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

export default function ExerciseCalculator({ onNavigate }) {
  const [vocation, setVocation] = useState('Knight');
  const [skillType, setSkillType] = useState('Melee'); // 'Melee', 'Distance', 'Magic', 'Shielding'
  const [currentSkill, setCurrentSkill] = useState(80);
  const [percentToNext, setPercentToNext] = useState(50);
  const [targetSkill, setTargetSkill] = useState(100);
  const [dummyType, setDummyType] = useState('house'); // 'standard' (1.0x), 'house' (1.10x)
  const [isDouble, setIsDouble] = useState(false); // 2x event
  const [loyaltyBonus, setLoyaltyBonus] = useState(0); // 0% to 50%
  const [tcPriceGold, setTcPriceGold] = useState(40000); // 40k gold por TC

  // Custos Oficiais das Armas de Treino
  // Regular: 500 charges = 262.500 gp (ou 25 TC)
  // Durable: 1.800 charges = 945.000 gp (ou 90 TC)
  // Lasting: 14.400 charges = 7.560.000 gp (ou 720 TC)
  const WEAPON_REGULAR = { name: 'Normal (500)', charges: 500, gold: 262500, tc: 25, seconds: 1000 };
  const WEAPON_DURABLE = { name: 'Durable (1.800)', charges: 1800, gold: 945000, tc: 90, seconds: 3600 };
  const WEAPON_LASTING = { name: 'Lasting (14.400)', charges: 14400, gold: 7560000, tc: 720, seconds: 28800 };

  // Cálculo matemático exato dos pontos necessários
  const calculation = useMemo(() => {
    const cur = Number(currentSkill) || 10;
    const tgt = Number(targetSkill) || 11;
    const pct = Number(percentToNext) || 0;

    if (tgt <= cur) {
      return { totalCharges: 0, lasting: 0, durable: 0, regular: 0, totalGold: 0, totalTc: 0, totalHours: 0 };
    }

    // Fatores de vocação
    let vocFactor = 1.1;
    let baseConstant = 50;

    if (skillType === 'Magic') {
      baseConstant = 1600;
      if (vocation === 'Mage' || vocation.includes('Sorcerer') || vocation.includes('Druid')) vocFactor = 1.1;
      else if (vocation === 'Paladin') vocFactor = 1.4;
      else vocFactor = 3.0;
    } else if (skillType === 'Distance') {
      baseConstant = 30;
      vocFactor = vocation === 'Paladin' ? 1.1 : 1.4;
    } else if (skillType === 'Melee') {
      baseConstant = 50;
      vocFactor = vocation === 'Knight' ? 1.1 : (vocation === 'Monk' ? 1.08 : 1.3);
    } else { // Shielding
      baseConstant = 100;
      vocFactor = 1.15;
    }

    // Calcula total de pontos de skill necessários de cur até tgt
    let totalPoints = 0;

    for (let lvl = cur; lvl < tgt; lvl++) {
      const pointsForThisLevel = baseConstant * Math.pow(vocFactor, lvl - 10);
      if (lvl === cur) {
        // Deduz a % já feita
        const remainingFraction = (100 - pct) / 100;
        totalPoints += pointsForThisLevel * remainingFraction;
      } else {
        totalPoints += pointsForThisLevel;
      }
    }

    // Eficiência por carga
    let effMultiplier = dummyType === 'house' ? 1.10 : 1.0;
    if (isDouble) effMultiplier *= 2.0;
    const loyaltyFactor = 1 + (Number(loyaltyBonus) / 100);
    effMultiplier *= loyaltyFactor;

    // Cada carga de exercise weapon gera 1 ponto base de melee ou 600 mana
    let pointsPerCharge = skillType === 'Magic' ? (600 / 1600) * 50 : 1.0;
    const totalChargesNeeded = Math.ceil(totalPoints / (pointsPerCharge * effMultiplier));

    // Decomposição em Armas Lasting, Durable e Regular
    const lastingCount = Math.floor(totalChargesNeeded / WEAPON_LASTING.charges);
    const remainderAfterLasting = totalChargesNeeded % WEAPON_LASTING.charges;

    const durableCount = Math.floor(remainderAfterLasting / WEAPON_DURABLE.charges);
    const remainderAfterDurable = remainderAfterLasting % WEAPON_DURABLE.charges;

    const regularCount = Math.ceil(remainderAfterDurable / WEAPON_REGULAR.charges);

    const totalGold = (lastingCount * WEAPON_LASTING.gold) + (durableCount * WEAPON_DURABLE.gold) + (regularCount * WEAPON_REGULAR.gold);
    const totalTc = (lastingCount * WEAPON_LASTING.tc) + (durableCount * WEAPON_DURABLE.tc) + (regularCount * WEAPON_REGULAR.tc);
    const totalSeconds = totalChargesNeeded * 2; // 2 segundos por carga
    const totalHours = (totalSeconds / 3600).toFixed(1);

    const costIfBoughtWithTcInGold = totalTc * tcPriceGold;
    const goldSavingsVsTc = costIfBoughtWithTcInGold - totalGold;
    const isGoldCheaper = goldSavingsVsTc > 0;

    return {
      totalCharges: totalChargesNeeded,
      lasting: lastingCount,
      durable: durableCount,
      regular: regularCount,
      totalGold,
      totalTc,
      totalHours,
      costIfBoughtWithTcInGold,
      goldSavingsVsTc,
      isGoldCheaper
    };
  }, [vocation, skillType, currentSkill, percentToNext, targetSkill, dummyType, isDouble, loyaltyBonus, tcPriceGold]);

  const [copiedPlan, setCopiedPlan] = useState(false);

  const copyTrainingPlan = () => {
    let msg = `🎯 **PLANO DE TREINO RUBINOT** 🎯\n`;
    msg += `🧙‍♂️ **Vocação:** ${vocation} | ⚔️ **Skill:** ${skillType}\n`;
    msg += `📈 **Meta:** ${currentSkill} (${percentToNext}%) ➔ ${targetSkill}\n`;
    msg += `⏱️ **Tempo Estimado:** ${calculation.totalHours} horas (~${(calculation.totalHours / 24).toFixed(1)} dias)\n`;
    msg += `📦 **Armas:** ${calculation.lasting} Lasting (8h), ${calculation.durable} Durable (1h), ${calculation.regular} Normal (16m)\n`;
    msg += `💰 **Custo no NPC:** ${(calculation.totalGold / 1000000).toFixed(2)} KKs (${calculation.totalGold.toLocaleString('pt-BR')} gp)\n`;
    msg += `💎 **Custo no Store:** ${calculation.totalTc.toLocaleString('pt-BR')} Tibia Coins\n`;
    if (calculation.isGoldCheaper) {
      msg += `💡 **Melhor Opção:** Comprar com Gold no NPC economiza ${(calculation.goldSavingsVsTc / 1000000).toFixed(2)} KKs!\n`;
    }
    msg += `⚡ *Calculado via Rubinot Tracker - trackerplanilha.vercel.app*`;
    navigator.clipboard.writeText(msg);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2500);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Banner Principal */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              Simulador Matemático Oficial
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold">
              Calculadora de Treino & Exercise Weapons
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
              Descubra quantas Exercise Weapons (Normal, Durable ou Lasting) você precisa para alcançar o skill dos seus sonhos, com custo exato em Gold (KKs) e Tibia Coins!
            </p>
          </div>

          <div className="flex items-center gap-2 bg-yellow-500/15 border border-yellow-500/40 px-4 py-2.5 rounded-2xl shrink-0">
            <Coins className="text-yellow-400" size={20} />
            <div>
              <p className="text-[10px] uppercase font-bold text-yellow-400">1 TC = {tcPriceGold.toLocaleString('pt-BR')} gp</p>
              <p className="text-xs text-gray-300 font-sans">Cotação Média Rubinot</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Formulário de Configuração */}
        <div className="lg:col-span-5 bg-black/60 border border-tibia-border p-5 rounded-2xl flex flex-col gap-5">
          
          {/* Vocação & Skill */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Vocação</label>
              <select
                value={vocation}
                onChange={(e) => setVocation(e.target.value)}
                className="w-full bg-black/80 border border-tibia-border rounded-xl p-2.5 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
              >
                <option value="Knight">Knight</option>
                <option value="Paladin">Paladin</option>
                <option value="Mage">Mage (MS / ED)</option>
                <option value="Monk">Monk</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Tipo de Skill</label>
              <select
                value={skillType}
                onChange={(e) => setSkillType(e.target.value)}
                className="w-full bg-black/80 border border-tibia-border rounded-xl p-2.5 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
              >
                <option value="Melee">Melee (Sword/Axe/Club)</option>
                <option value="Distance">Distance Fighting</option>
                <option value="Magic">Magic Level</option>
                <option value="Shielding">Shielding</option>
              </select>
            </div>
          </div>

          {/* Níveis e Porcentagem */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Skill Atual</label>
              <input
                type="number"
                min="10"
                max="140"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(Number(e.target.value))}
                className="w-full bg-black/80 border border-tibia-border rounded-xl p-2.5 text-sm font-bold text-white text-center focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">% para Próximo</label>
              <input
                type="number"
                min="0"
                max="99"
                value={percentToNext}
                onChange={(e) => setPercentToNext(Number(e.target.value))}
                className="w-full bg-black/80 border border-tibia-border rounded-xl p-2.5 text-sm font-bold text-yellow-400 text-center focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Skill Alvo</label>
              <input
                type="number"
                min="11"
                max="150"
                value={targetSkill}
                onChange={(e) => setTargetSkill(Number(e.target.value))}
                className="w-full bg-black/80 border border-yellow-500/50 rounded-xl p-2.5 text-sm font-bold text-green-400 text-center focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          {/* Metas Rápidas Populares (Presets) */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase mb-1.5 block">Metas Populares Rápidas:</label>
            <div className="flex flex-wrap gap-1.5">
              {(skillType === 'Magic' ? [
                { cur: 80, tgt: 90 },
                { cur: 90, tgt: 100 },
                { cur: 100, tgt: 110 },
                { cur: 110, tgt: 120 }
              ] : [
                { cur: 90, tgt: 100 },
                { cur: 100, tgt: 110 },
                { cur: 110, tgt: 120 },
                { cur: 120, tgt: 125 }
              ]).map(preset => (
                <button
                  key={`${preset.cur}-${preset.tgt}`}
                  type="button"
                  onClick={() => {
                    setCurrentSkill(preset.cur);
                    setTargetSkill(preset.tgt);
                    setPercentToNext(0);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 text-[11px] font-bold transition-all active:scale-95"
                >
                  {preset.cur} ➔ {preset.tgt}
                </button>
              ))}
            </div>
          </div>

          {/* Bônus: Dummy & Eventos */}
          <div className="space-y-3 pt-2 border-t border-tibia-border/50">
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300 font-bold">Boneco de Treino (Dummy):</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDummyType('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dummyType === 'standard' ? 'bg-yellow-500 text-black' : 'bg-black/60 text-gray-400 border border-white/10'
                  }`}
                >
                  Padrão (1.0x)
                </button>
                <button
                  onClick={() => setDummyType('house')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dummyType === 'house' ? 'bg-yellow-500 text-black font-bold shadow-md' : 'bg-black/60 text-gray-400 border border-white/10'
                  }`}
                >
                  House (+10%)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300 font-bold flex items-center gap-1.5">
                <Flame size={14} className="text-orange-400" /> Evento Double XP/Skill:
              </span>
              <button
                onClick={() => setIsDouble(!isDouble)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isDouble ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-black/60 text-gray-400 border border-white/10'
                }`}
              >
                {isDouble ? 'Ativo (2.0x)' : 'Desativado'}
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400 font-bold">Bônus de Loyalty:</span>
                <span className="text-xs font-bold text-yellow-400">+{loyaltyBonus}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="50"
                step="5"
                value={loyaltyBonus}
                onChange={(e) => setLoyaltyBonus(Number(e.target.value))}
                className="w-full accent-yellow-500"
              />
            </div>

          </div>

        </div>

        {/* Lado Direito: Resultados Visuais e Compras Sugeridas */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Card Gigante de Custo Total */}
          <div className="bg-gradient-to-b from-yellow-950/30 via-black/80 to-black border-2 border-yellow-500/40 p-6 rounded-2xl shadow-xl flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-yellow-500/20 pb-4">
              <div>
                <h3 className="text-xl font-medieval text-yellow-400 flex items-center gap-2">
                  <Target className="text-yellow-400" size={20} />
                  Meta: {currentSkill} ➔ {targetSkill} ({skillType})
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Tempo estimado de treino contínuo: <strong className="text-white">{calculation.totalHours} horas</strong> (~{(calculation.totalHours / 24).toFixed(1)} dias)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyTrainingPlan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-bold text-xs transition-all active:scale-95"
                >
                  {copiedPlan ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedPlan ? 'Plano Copiado!' : 'Copiar Plano'}</span>
                </button>

                <div className="px-3.5 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-mono text-xs font-bold">
                  {calculation.totalCharges.toLocaleString('pt-BR')} Cargas
                </div>
              </div>
            </div>

            {/* Grid de Valores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/60 border border-tibia-border p-4 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/40 text-yellow-400">
                  <Coins size={28} />
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold text-gray-400">Custo em Gold (KKs)</p>
                  <p className="text-2xl font-bold text-yellow-400 font-mono">
                    {(calculation.totalGold / 1000000).toFixed(2)} KK
                  </p>
                  <p className="text-[10px] text-gray-500">{calculation.totalGold.toLocaleString('pt-BR')} gp</p>
                </div>
              </div>

              <div className="bg-black/60 border border-tibia-border p-4 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/40 text-blue-400">
                  <Sparkles size={28} />
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold text-gray-400">Custo em Tibia Coins</p>
                  <p className="text-2xl font-bold text-blue-400 font-mono">
                    {calculation.totalTc.toLocaleString('pt-BR')} TC
                  </p>
                  <p className="text-[10px] text-gray-500">Valor oficial no Store</p>
                </div>
              </div>
            </div>

            {/* Comparativo Financeiro Inteligente */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              calculation.isGoldCheaper 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                : 'bg-blue-950/30 border-blue-500/40 text-blue-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg shrink-0 ${calculation.isGoldCheaper ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {calculation.isGoldCheaper ? <Coins size={20} /> : <Sparkles size={20} />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {calculation.isGoldCheaper ? 'Comprar com Gold no NPC é mais barato!' : 'Comprar com Tibia Coins no Store é mais barato!'}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {calculation.isGoldCheaper 
                      ? `Você economiza ${(calculation.goldSavingsVsTc / 1000000).toFixed(2)} KKs comprando armas direto nos NPCs do RubinOT com Gold.`
                      : `Você economiza ${Math.abs(calculation.goldSavingsVsTc / 1000000).toFixed(2)} KKs comprando as armas com TC no Store.`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold font-mono px-2 py-1 rounded bg-black/50 border border-white/10">
                  Cotação: {(tcPriceGold / 1000).toFixed(0)}k/TC
                </span>
              </div>
            </div>

            {/* Armas Recomendadas */}
            <div>
              <h4 className="text-xs uppercase font-bold text-gray-400 mb-2.5">Pacote de Armas Ideal:</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/70 border border-yellow-500/30 p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-yellow-400 font-mono">{calculation.lasting}</p>
                  <p className="text-[11px] text-white font-bold">Lasting (8h)</p>
                  <p className="text-[10px] text-gray-500">14.400 cargas</p>
                </div>

                <div className="bg-black/70 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-yellow-300 font-mono">{calculation.durable}</p>
                  <p className="text-[11px] text-white font-bold">Durable (1h)</p>
                  <p className="text-[10px] text-gray-500">1.800 cargas</p>
                </div>

                <div className="bg-black/70 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-gray-300 font-mono">{calculation.regular}</p>
                  <p className="text-[11px] text-white font-bold">Normal (16m)</p>
                  <p className="text-[10px] text-gray-500">500 cargas</p>
                </div>
              </div>
            </div>

          </div>

          {/* Dica Estratégica */}
          <div className="p-4 bg-yellow-950/20 border border-yellow-500/30 rounded-2xl flex items-center gap-3 text-xs text-yellow-200">
            <Zap className="text-yellow-400 shrink-0" size={20} />
            <p>
              <strong>Dica de Mestre:</strong> Durante eventos de <strong>Double Skill</strong> com dummy de <strong>House (+10%)</strong>, você economiza mais de <strong>55% do investimento total</strong> em Gold e Tibia Coins!
            </p>
          </div>

        </div>

      </div>

      {/* Banner de Anúncios AdSense */}
      <AdBanner slot="exercise_calc_footer" format="horizontal" />
    </div>
  );
}
