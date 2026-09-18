export const WORLDS_CONFIG = [
  { world: 'Auroria', guild: 'Shellpatrocina', defaultBank: 'Bank Rubin Auroria', icon: '🛡️' },
  { world: 'Belaria', guild: 'Battlestorm Belaria', defaultBank: 'Bank Rubin Belaria', icon: '⚔️' },
  { world: 'Bellum', guild: 'Battlestorm Bellum', defaultBank: 'Bank Rubin Bellum', icon: '⚡' },
  { world: 'Drakaria', guild: 'Battlestorm Drakaria', defaultBank: 'Bank Rubin Drakaria', icon: '🐉' },
  { world: 'Eldrian', guild: 'Battlestorm Eldrian', defaultBank: 'Bank Rubin Eldrian', icon: '🌿' },
  { world: 'Elysian', guild: 'Battlestorm Elysian', defaultBank: 'Bank Rubin Elysian', icon: '✨' },
  { world: 'Infernum I', guild: 'Battlestorm Infernum I', defaultBank: 'Bank Rubin Infernum I', icon: '🔥' },
  { world: 'Infernum II', guild: 'Battlestorm Infernum II', defaultBank: 'Bank Rubin Infernum II', icon: '🌋' },
  { world: 'Infernum III', guild: 'Battlestorm Infernum III', defaultBank: 'Bank Rubin Infernum III', icon: '☄️' },
  { world: 'Lunarian', guild: 'Battlestorm Lunarian', defaultBank: 'Bank Rubin Lunarian', icon: '🌙' },
  { world: 'Malveria', guild: 'Battlestorm Malveria', defaultBank: 'Bank Rubin Malveria', icon: '🏹' },
  { world: 'Mystian', guild: 'Battlestorm Mystian', defaultBank: 'Bank Rubin Mystian', icon: '🔮' },
  { world: 'Obsidian', guild: 'Battlestorm Obsidian', defaultBank: 'Bank Rubin Obsidian', icon: '💎' },
  { world: 'Solarian', guild: 'Battlestorm Solarian', defaultBank: 'Bank Rubin Solarian', icon: '☀️' },
  { world: 'Tenebrium', guild: 'Battlestorm Retro', defaultBank: 'Bank Rubin Tenebrium', icon: '💀' },
  { world: 'Vesperia', guild: 'Battlestorm Vesperia', defaultBank: 'Bank Rubin Vesperia', icon: '🦅' }
];

export const WORLD_GUILD_MAP = {
  'Auroria': 'Shellpatrocina',
  'Belaria': 'Battlestorm Belaria',
  'Bellum': 'Battlestorm Bellum',
  'Drakaria': 'Battlestorm Drakaria',
  'Eldrian': 'Battlestorm Eldrian',
  'Elysian': 'Battlestorm Elysian',
  'Infernum I': 'Battlestorm Infernum I',
  'Infernum II': 'Battlestorm Infernum II',
  'Infernum III': 'Battlestorm Infernum III',
  'Lunarian': 'Battlestorm Lunarian',
  'Malveria': 'Battlestorm Malveria',
  'Mystian': 'Battlestorm Mystian',
  'Obsidian': 'Battlestorm Obsidian',
  'Solarian': 'Battlestorm Solarian',
  'Tenebrium': 'Battlestorm Retro',
  'Vesperia': 'Battlestorm Vesperia'
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

/**
 * Catálogo Canônico de Itens / Creature Products da Guild Ascension (RubinOT)
 */
export const DEFAULT_ASCENSION_ITEMS = [
  {
    id: 'item-1',
    name: 'Demon Horn',
    category: 'Demon Damage / Fire Damage',
    quantityPerMember: 5,
    quantityTotal: 2500,
    calcMode: 'per_member', // 'per_member' | 'total_fixed'
    priceKk: 0.05, // 50.000 Gold cada (0.05 KK)
    serverOrigin: 'Belaria',
    status: 'comprando', // 'planejado' | 'comprando' | 'em_transito' | 'estoque'
    notes: 'Mercado de Belaria com melhor oferta'
  },
  {
    id: 'item-2',
    name: 'Vampire Teeth',
    category: 'Life Leech (General Bonus)',
    quantityPerMember: 8,
    quantityTotal: 4000,
    calcMode: 'per_member',
    priceKk: 0.04, // 40.000 Gold cada (0.04 KK)
    serverOrigin: 'Infernum I',
    status: 'comprando',
    notes: 'Comprar no Market de Infernum I'
  },
  {
    id: 'item-3',
    name: 'Wyrm Scale',
    category: 'Dragon Damage / Energy Damage',
    quantityPerMember: 10,
    quantityTotal: 5000,
    calcMode: 'per_member',
    priceKk: 0.02, // 20.000 Gold cada (0.02 KK)
    serverOrigin: 'Drakaria',
    status: 'comprando',
    notes: 'Grande oferta no Drakaria'
  },
  {
    id: 'item-4',
    name: 'Silencer Claws',
    category: 'Mana Leech (General Bonus)',
    quantityPerMember: 6,
    quantityTotal: 3000,
    calcMode: 'per_member',
    priceKk: 0.06, // 60.000 Gold cada (0.06 KK)
    serverOrigin: 'Bellum',
    status: 'planejado',
    notes: 'Importar de Bellum'
  },
  {
    id: 'item-5',
    name: 'Glooth Capsule',
    category: 'Construct Damage / Earth',
    quantityPerMember: 15,
    quantityTotal: 7500,
    calcMode: 'per_member',
    priceKk: 0.015, // 15.000 Gold cada
    serverOrigin: 'Auroria',
    status: 'estoque',
    notes: 'Estoque local em Auroria'
  },
  {
    id: 'item-6',
    name: 'Cultish Robe',
    category: 'Critical / Humanoid',
    quantityPerMember: 12,
    quantityTotal: 6000,
    calcMode: 'per_member',
    priceKk: 0.025, // 25.000 Gold cada
    serverOrigin: 'Solarian',
    status: 'planejado',
    notes: 'Comprar de hunts em Solarian'
  },
  {
    id: 'item-7',
    name: 'Dragon Hide',
    category: 'Dragon Damage / Fire Defense',
    quantityPerMember: 8,
    quantityTotal: 4000,
    calcMode: 'per_member',
    priceKk: 0.03, // 30.000 Gold cada
    serverOrigin: 'Malveria',
    status: 'planejado',
    notes: 'Comprar no Market de Malveria'
  },
  {
    id: 'item-8',
    name: 'Hellspawn Tail',
    category: 'Demon Damage / Fire Defense',
    quantityPerMember: 4,
    quantityTotal: 2000,
    calcMode: 'per_member',
    priceKk: 0.07, // 70.000 Gold cada
    serverOrigin: 'Vesperia',
    status: 'em_transito',
    notes: 'Lote fechado via World Transfer'
  }
];

/**
 * Catálogo Rápido com Itens Típicos do RubinOT para Adição Imediata
 */
export const CATALOG_SUGGESTED_ITEMS = [
  { name: 'Bloody Pincers', category: 'Life Leech Tier 3', defaultPerMember: 5, defaultKk: 0.08, defaultOrigin: 'Infernum I' },
  { name: 'Sabreteeth', category: 'Critical Damage Bonus', defaultPerMember: 8, defaultKk: 0.045, defaultOrigin: 'Belaria' },
  { name: 'Protective Charm', category: 'Damage Reduction / Energy', defaultPerMember: 10, defaultKk: 0.035, defaultOrigin: 'Drakaria' },
  { name: 'Elvish Scouting Glass', category: 'Distance Bonus / Movement', defaultPerMember: 6, defaultKk: 0.05, defaultOrigin: 'Solarian' },
  { name: 'Spider Silk', category: 'Armor / Physical Defense', defaultPerMember: 15, defaultKk: 0.02, defaultOrigin: 'Auroria' },
  { name: 'Goosebump Leather', category: 'Ice Damage / Magic Shield', defaultPerMember: 4, defaultKk: 0.09, defaultOrigin: 'Malveria' },
  { name: 'Peppercorn', category: 'Food Buff / Stamina Bonus', defaultPerMember: 20, defaultKk: 0.01, defaultOrigin: 'Auroria' },
  { name: 'Ogre Tooth', category: 'Club Damage / Knockback', defaultPerMember: 10, defaultKk: 0.03, defaultOrigin: 'Vesperia' },
  { name: 'Brimstone Shell', category: 'Earth / Poison Resistance', defaultPerMember: 8, defaultKk: 0.04, defaultOrigin: 'Bellum' },
  { name: 'Snake Skin', category: 'Earth Damage Bonus', defaultPerMember: 12, defaultKk: 0.015, defaultOrigin: 'Auroria' }
];

/**
 * Presets de Cenários de Ascensão
 */
export const PROJECTION_PRESETS = [
  {
    id: 'full_ascension',
    name: 'Full Ascension (Todos os 8 Perks)',
    description: 'Cobre todos os buffs canônicos com frete cross-server planejado.',
    itemsCount: 8,
    wtCount: 3
  },
  {
    id: 'essential_leech',
    name: 'Essencial (Life & Mana Leech + Crit)',
    description: 'Apenas os 4 perks essenciais para hunts eficientes.',
    itemsCount: 4,
    wtCount: 2
  },
  {
    id: 'local_zero_wt',
    name: 'Econômico Local (Zero World Transfer)',
    description: 'Utiliza apenas itens estocados e comprados no mercado local de Auroria.',
    itemsCount: 5,
    wtCount: 0
  }
];

/**
 * Padrões de World Transfer (RubinOT Oficial: 1490 RC por char)
 */
export const DEFAULT_WORLD_TRANSFERS = [
  { id: 'wt-1', fromWorld: 'Belaria', toWorld: 'Auroria', charactersCount: 1, costRcPerChar: 1490, extraGoldKk: 0, notes: 'Traz Demon Horns e supplies' },
  { id: 'wt-2', fromWorld: 'Infernum I', toWorld: 'Auroria', charactersCount: 1, costRcPerChar: 1490, extraGoldKk: 0, notes: 'Traz Vampire Teeth e creature products' },
  { id: 'wt-3', fromWorld: 'Drakaria', toWorld: 'Auroria', charactersCount: 1, costRcPerChar: 1490, extraGoldKk: 0, notes: 'Traz Wyrm Scales e Dragon Hides' },
];

/**
 * Calculadora Avançada de Projeção Item por Item, World Transfers e Cota em RC
 */
export function calculateDetailedPerkProjection({
  items = DEFAULT_ASCENSION_ITEMS,
  members = 500,
  rateRc = 25,
  rateKk = 2.0,
  activationCostPerMemberKk = 0.8,
  worldTransfers = DEFAULT_WORLD_TRANSFERS,
  safetyMarginPct = 10,
  usePerMemberQty = false,
  customFeeRc = null
}) {
  const safeMembers = Math.max(1, Number(members) || 1);
  const safeRateRc = Math.max(0.01, Number(rateRc) || 25);
  const safeRateKk = Math.max(0.01, Number(rateKk) || 2.0);
  const rateKkPerRc = safeRateKk / safeRateRc; // ex: 2.0 / 25 = 0.08 KK por RC

  // 1. Cálculo Item por Item com total clareza matemática
  let totalItemsCount = 0;
  let totalItemsCostKk = 0;
  let totalItemsCostRc = 0;
  const serverBreakdown = {};

  const itemsCalculated = items.map(item => {
    // Modo de cálculo do item: respeita o modo individual do item ou a flag global
    const isPerMember = item.calcMode ? item.calcMode === 'per_member' : usePerMemberQty;
    
    let effectiveQty = 0;
    let effectiveQtyPerMember = 0;

    if (isPerMember) {
      effectiveQtyPerMember = Math.max(0, Number(item.quantityPerMember) || 0);
      effectiveQty = Math.round(effectiveQtyPerMember * safeMembers);
    } else {
      effectiveQty = Math.max(0, Math.round(Number(item.quantityTotal) || 0));
      effectiveQtyPerMember = Number((effectiveQty / safeMembers).toFixed(2));
    }

    const unitPriceKk = Number(item.priceKk) || 0;
    const unitPriceGp = Math.round(unitPriceKk * 1000000);
    const unitPriceRc = rateKkPerRc > 0 ? Number((unitPriceKk / rateKkPerRc).toFixed(4)) : 0;

    const subtotalKk = Number((effectiveQty * unitPriceKk).toFixed(2));
    const subtotalRc = rateKkPerRc > 0 ? Math.ceil(subtotalKk / rateKkPerRc) : 0;
    const subtotalGp = Math.round(subtotalKk * 1000000);

    // Custo individual deste item para 1 jogador
    const costPerMemberKk = Number((subtotalKk / safeMembers).toFixed(3));
    const costPerMemberRc = Number((subtotalRc / safeMembers).toFixed(2));
    const costPerMemberGp = Math.round(subtotalGp / safeMembers);

    totalItemsCount += effectiveQty;
    totalItemsCostKk += subtotalKk;
    totalItemsCostRc += subtotalRc;

    const server = item.serverOrigin || 'Local';
    if (!serverBreakdown[server]) {
      serverBreakdown[server] = { server, totalQty: 0, totalCostKk: 0, totalCostRc: 0, itemsCount: 0 };
    }
    serverBreakdown[server].totalQty += effectiveQty;
    serverBreakdown[server].totalCostKk += subtotalKk;
    serverBreakdown[server].totalCostRc += subtotalRc;
    serverBreakdown[server].itemsCount += 1;

    return {
      ...item,
      isPerMember,
      effectiveQty,
      effectiveQtyPerMember,
      unitPriceKk,
      unitPriceGp,
      unitPriceRc,
      subtotalKk,
      subtotalRc,
      subtotalGp,
      costPerMemberKk,
      costPerMemberRc,
      costPerMemberGp
    };
  });

  totalItemsCostKk = Number(totalItemsCostKk.toFixed(2));

  // 2. Cálculo dos Custos de Transferência de Mundos (World Transfer)
  let totalWtTransfersCount = 0;
  let totalWtCostRc = 0;
  let totalWtExtraGoldKk = 0;

  const transfersCalculated = worldTransfers.map(wt => {
    const chars = Math.max(0, Number(wt.charactersCount) || 0);
    const costRc = Math.max(0, Number(wt.costRcPerChar) || 1490);
    const extraKk = Math.max(0, Number(wt.extraGoldKk) || 0);

    const subtotalRc = chars * costRc;
    const subtotalKk = Number((subtotalRc * rateKkPerRc + extraKk).toFixed(2));

    totalWtTransfersCount += chars;
    totalWtCostRc += subtotalRc;
    totalWtExtraGoldKk += extraKk;

    return {
      ...wt,
      subtotalRc,
      subtotalKk,
      costPerMemberRc: Number((subtotalRc / safeMembers).toFixed(2))
    };
  });

  const totalWtCostKk = Number((totalWtCostRc * rateKkPerRc + totalWtExtraGoldKk).toFixed(2));

  // 3. Taxas de Ativação do Sistema (Gold da Guild Ascension)
  const activationCostKk = Number((safeMembers * (Number(activationCostPerMemberKk) || 0)).toFixed(2));
  const activationCostRc = Math.ceil(activationCostKk / rateKkPerRc);

  // 4. CUSTO TOTAL COMBINADO
  const grandTotalCostKk = Number((totalItemsCostKk + totalWtCostKk + activationCostKk).toFixed(2));
  const grandTotalCostRc = totalItemsCostRc + totalWtCostRc + activationCostRc;

  // 5. Decomposição exata por Membro (Break-Even Puro)
  const itemsCostPerMemberRc = Number((totalItemsCostRc / safeMembers).toFixed(2));
  const wtCostPerMemberRc = Number((totalWtCostRc / safeMembers).toFixed(2));
  const activationCostPerMemberRc = Number((activationCostRc / safeMembers).toFixed(2));

  const costPerMemberKk = Number((grandTotalCostKk / safeMembers).toFixed(2));
  const breakEvenExactRc = Number((grandTotalCostRc / safeMembers).toFixed(2));
  const breakEvenFeeRc = Math.ceil(breakEvenExactRc);

  // 6. Cota Recomendada com Margem de Segurança / Reserva
  const marginMultiplier = 1 + (Math.max(0, Number(safetyMarginPct) || 0) / 100);
  const recommendedFeeRc = customFeeRc !== null && customFeeRc !== undefined && customFeeRc > 0
    ? Number(customFeeRc)
    : Math.ceil(breakEvenFeeRc * marginMultiplier);
  const recommendedFeeKk = Number((recommendedFeeRc * rateKkPerRc).toFixed(2));
  const marginRcPerMember = Math.max(0, recommendedFeeRc - breakEvenFeeRc);

  // 7. Arrecadação Global & Balanço Financeiro
  const grossRevenueRc = Math.round(safeMembers * recommendedFeeRc);
  const grossRevenueKk = Number((grossRevenueRc * rateKkPerRc).toFixed(2));

  const surplusRc = Math.max(0, grossRevenueRc - grandTotalCostRc);
  const surplusKk = Number((surplusRc * rateKkPerRc).toFixed(2));
  const surplusMarginPct = grossRevenueRc > 0 ? Math.round((surplusRc / grossRevenueRc) * 100) : 0;

  // 8. Percentual de cada componente no custo
  const itemsSharePct = grandTotalCostRc > 0 ? Math.round((totalItemsCostRc / grandTotalCostRc) * 100) : 0;
  const wtSharePct = grandTotalCostRc > 0 ? Math.round((totalWtCostRc / grandTotalCostRc) * 100) : 0;
  const activationSharePct = grandTotalCostRc > 0 ? Math.round((activationCostRc / grandTotalCostRc) * 100) : 0;

  // 9. Cota Híbrida: Taxa fixa em RC para quem entregar 100% dos seus itens
  const hybridFixedLogisticsRc = Math.ceil(wtCostPerMemberRc + activationCostPerMemberRc);

  return {
    members: safeMembers,
    rateKkPerRc,
    rateRc: safeRateRc,
    rateKk: safeRateKk,
    items: itemsCalculated,
    totalItemsCount,
    totalItemsCostKk,
    totalItemsCostRc,
    serverBreakdown: Object.values(serverBreakdown),
    worldTransfers: transfersCalculated,
    totalWtTransfersCount,
    totalWtCostRc,
    totalWtCostKk,
    activationCostKk,
    activationCostRc,
    grandTotalCostKk,
    grandTotalCostRc,
    breakdownPerMember: {
      itemsCostRc: itemsCostPerMemberRc,
      wtCostRc: wtCostPerMemberRc,
      activationCostRc: activationCostPerMemberRc,
      marginRc: marginRcPerMember,
      breakEvenExactRc,
      breakEvenFeeRc,
      recommendedFeeRc,
      recommendedFeeKk
    },
    costPerMemberKk,
    breakEvenFeeRc,
    safetyMarginPct,
    recommendedFeeRc,
    recommendedFeeKk,
    grossRevenueRc,
    grossRevenueKk,
    surplusRc,
    surplusKk,
    surplusMarginPct,
    hybridContribution: {
      logisticsFeeRc: hybridFixedLogisticsRc,
      itemsRequired: itemsCalculated.map(it => ({
        name: it.name,
        category: it.category,
        qty: it.effectiveQtyPerMember
      }))
    },
    shares: {
      itemsSharePct,
      wtSharePct,
      activationSharePct
    }
  };
}


