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
