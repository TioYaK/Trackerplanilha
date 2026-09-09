export const WORLDS_CONFIG = [
  { world: 'Auroria', guild: 'Shellpatrocina', defaultBank: 'Bank Rubin Auroria', icon: '🛡️' },
  { world: 'Belaria', guild: 'Battlestorm Belaria', defaultBank: 'Bank Rubin Belaria', icon: '⚔️' },
  { world: 'Bellum', guild: 'Battlestorm Bellum', defaultBank: 'Bank Rubin Bellum', icon: '⚡' },
  { world: 'Tenebrium', guild: 'Battlestorm Retro', defaultBank: 'Bank Rubin Tenebrium', icon: '💀' },
  { world: 'Vesperia', guild: 'Battlestorm Vesperia', defaultBank: 'Bank Rubin Vesperia', icon: '🦅' },
  { world: 'Malveria', guild: 'Battlestorm Malveria', defaultBank: 'Bank Rubin Malveria', icon: '🏹' }
];

export const WORLD_GUILD_MAP = {
  'Auroria': 'Shellpatrocina',
  'Belaria': 'Battlestorm Belaria',
  'Bellum': 'Battlestorm Bellum',
  'Tenebrium': 'Battlestorm Retro',
  'Vesperia': 'Battlestorm Vesperia',
  'Malveria': 'Battlestorm Malveria'
};

/**
 * Cotação média de mercado no RubinOT:
 * 25 RC ≈ 2.0 KK de Gold (2.000.000 Gold Coins)
 * 1 RC = 0.08 KK (80.000 Gold Coins)
 * 1 KK = 12.5 RC
 */
export const MARKET_EXCHANGE_RATE = {
  rcToKk: 2.0 / 25, // 0.08 KK por 1 RC
  kkToRc: 25 / 2.0  // 12.5 RC por 1 KK
};

/**
 * Converte valor de RC para KK com base na taxa de mercado
 */
export function convertRcToKk(rcAmount, rate = MARKET_EXCHANGE_RATE.rcToKk) {
  const num = Number(rcAmount) || 0;
  return Number((num * rate).toFixed(2));
}

/**
 * Converte valor de KK para RC com base na taxa de mercado
 */
export function convertKkToRc(kkAmount, rate = MARKET_EXCHANGE_RATE.kkToRc) {
  const num = Number(kkAmount) || 0;
  return Math.round(num * rate);
}

/**
 * Calcula o Poder de Fogo Líquido em Gold (KK) total somando
 * o saldo de KKs em caixa + o saldo em RC convertido pela cotação média
 */
export function calculateGoldPower(rcBalance, kkBalance, rate = MARKET_EXCHANGE_RATE.rcToKk) {
  const rc = Number(rcBalance) || 0;
  const kk = Number(kkBalance) || 0;
  const rcConverted = rc * rate;
  return Number((kk + rcConverted).toFixed(2));
}

/**
 * Catálogo Oficial da Wiki do RubinOT (Guild Ascension)
 * https://wiki.rubinot.com/pt-BR/guild-ascension
 */

// 1. General Bonuses (Slots 1 a 3 - Sem repetição na Season)
export const ASCENSION_GENERAL_BONUSES = [
  { title: 'Experience', effect: 'Aumenta percentualmente a experiência obtida pelo personagem.' },
  { title: 'Loot', effect: 'Aumenta percentualmente a taxa de loot dos monstros derrotados.' },
  { title: 'Life Leech', effect: 'Aumenta o percentual de roubo de vida do personagem.' },
  { title: 'Mana Leech', effect: 'Aumenta o percentual de roubo de mana do personagem.' },
  { title: 'Critical', effect: 'Aumenta o percentual relacionado à chance de ataque crítico do personagem.' },
  { title: 'Skill', effect: 'Aumenta o Skill principal do personagem de acordo com sua vocação.' },
  { title: 'Stamina Regeneration', effect: 'Aumenta a velocidade de regeneração da Stamina.' },
  { title: 'Fast Exercise', effect: 'Aumenta a velocidade de treinamento utilizando Exercise Weapons.' },
  { title: 'Weapon Proficiency', effect: 'Aumenta percentualmente a experiência obtida no sistema de Weapon Proficiency.' },
  { title: 'Familiar Damage', effect: 'Aumenta o dano causado pelo Familiar do personagem.' }
];

// 2. Raças do Bestiary (Slot 4 - Race Damage)
export const ASCENSION_BESTIARY_RACES = [
  'Demon', 'Dragon', 'Undead', 'Construct', 'Extra Dimensional',
  'Giant', 'Human', 'Humanoid', 'Elemental', 'Fey', 'Reptile',
  'Amphibic', 'Aquatic', 'Bird', 'Inkborn', 'Lycanthrope',
  'Magical', 'Mammal', 'Plant', 'Slime', 'Vermin'
];

// 3. Elementos (Slot 5: Elemental Damage / Slot 6: Elemental Defense)
export const ASCENSION_ELEMENTS = [
  'Fire', 'Ice', 'Energy', 'Earth', 'Death', 'Holy', 'Physical'
];

/**
 * Módulo Simulador & Planejador de Orçamento da Ascensão (Admin)
 */
export const SIMULATOR_PRESET_SCENARIOS = [50, 100, 250, 500, 1000];

export function calculatePerkSimulation({
  members = 1000,
  feeRc = 50,
  rateRc = 25,
  rateKk = 2.0,
  targetTier = 'FULL',
  perkCostPerMemberKk = 0.8,
  itemCostPerMemberKk = 0.6
}) {
  const safeMembers = Math.max(1, Number(members) || 1);
  const safeFeeRc = Math.max(1, Number(feeRc) || 1);
  const safeRateRc = Math.max(0.01, Number(rateRc) || 25);
  const safeRateKk = Math.max(0.01, Number(rateKk) || 2.0);
  const rateKkPerRc = safeRateKk / safeRateRc; // ex: 2.0 / 25 = 0.08 KK por RC

  let tierMultiplier = 1.0;
  if (targetTier === 'COMPETITIVE') tierMultiplier = 0.65;
  if (targetTier === 'ESSENTIAL') tierMultiplier = 0.35;

  // 1. Arrecadação Bruta Total
  const grossRc = Math.round(safeMembers * safeFeeRc);
  const grossGoldKk = Number((grossRc * rateKkPerRc).toFixed(2));

  // 2. Custos de Operação
  const perkCostGoldKk = Number((safeMembers * perkCostPerMemberKk * tierMultiplier).toFixed(2));
  const itemCostGoldKk = Number((safeMembers * itemCostPerMemberKk * tierMultiplier).toFixed(2));
  const totalCostGoldKk = Number((perkCostGoldKk + itemCostGoldKk).toFixed(2));

  // 3. RCs necessários vender no market para pagar o Gold e os itens
  const rcNeededForCost = Math.ceil(totalCostGoldKk / rateKkPerRc);

  // 4. Sobra Líquida da Liderança (Lucro / Fundo de Guerra)
  const surplusRc = Math.max(0, grossRc - rcNeededForCost);
  const surplusGoldKk = Number((surplusRc * rateKkPerRc).toFixed(2));
  const surplusMarginPct = grossRc > 0 ? Math.round((surplusRc / grossRc) * 100) : 0;

  // 5. Cota de Break-Even (Mínimo em RC para cobrir sem prejuízo)
  const breakEvenFeeRc = Math.ceil((totalCostGoldKk / safeMembers) / rateKkPerRc);

  return {
    members: safeMembers,
    feeRc: safeFeeRc,
    rateKkPerRc,
    grossRc,
    grossGoldKk,
    perkCostGoldKk,
    itemCostGoldKk,
    totalCostGoldKk,
    rcNeededForCost,
    surplusRc,
    surplusGoldKk,
    surplusMarginPct,
    breakEvenFeeRc
  };
}
