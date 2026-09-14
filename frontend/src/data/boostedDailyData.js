// Catálogo de Criaturas e Bosses Boostados do RubinOT
// Sincronizado dinamicamente com o Server Save diário (10:00 UTC / 07:00 BRT)

export const RUBINOT_BOOSTED_CREATURES = [
  {
    id: 'dark-torturer',
    name: 'Dark Torturer',
    slug: 'dark_torturer',
    category: 'Prison / Catacombs',
    hp: 7350,
    baseExp: 4650,
    boostedExp: 9300,
    bestElement: 'Gelo (Ice)',
    bestElementMultiplier: '+15%',
    bestDefense: 'Físico + Fogo',
    bestCharm: 'Freeze',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/dark_torturer.gif',
    huntQuery: 'dark torturer',
    bonusText: 'XP Dobrada (9.3k) & Loot 2x em Prison e Catacombs'
  },
  {
    id: 'werelion',
    name: 'Werelion',
    slug: 'werelion',
    category: 'Darashia Lion Sanctum',
    hp: 4900,
    baseExp: 3800,
    boostedExp: 7600,
    bestElement: 'Gelo (Ice)',
    bestElementMultiplier: '+20%',
    bestDefense: 'Holy + Físico',
    bestCharm: 'Freeze',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/werelion.gif',
    huntQuery: 'werelion',
    bonusText: 'Lucro absurdo e 7.6k XP por monstro em Darashia'
  },
  {
    id: 'hellflayer',
    name: 'Hellflayer',
    slug: 'hellflayer',
    category: 'Prison -3 / Ferumbras',
    hp: 12000,
    baseExp: 11000,
    boostedExp: 22000,
    bestElement: 'Gelo / Holy',
    bestElementMultiplier: '+20%',
    bestDefense: 'Death + Fogo',
    bestCharm: 'Divine Wrath / Freeze',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/hellflayer.gif',
    huntQuery: 'prison',
    bonusText: 'Top Rush 4x Team: 22k XP base por Hellflayer'
  },
  {
    id: 'flimsy-lost-soul',
    name: 'Flimsy Lost Soul',
    slug: 'flimsy_lost_soul',
    category: 'Port Hope / Flimsies',
    hp: 4800,
    baseExp: 4100,
    boostedExp: 8200,
    bestElement: 'Fogo / Energy',
    bestElementMultiplier: '+25%',
    bestDefense: 'Death (55%+)',
    bestCharm: 'Wound / Zap',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/flimsy_lost_soul.gif',
    huntQuery: 'flimsy',
    bonusText: 'Respawns de Port Hope e Venore voando em XP'
  },
  {
    id: 'naga-warrior',
    name: 'Naga Warrior',
    slug: 'naga_warrior',
    category: 'Marapur Bastion',
    hp: 8500,
    baseExp: 7100,
    boostedExp: 14200,
    bestElement: 'Energy / Terra',
    bestElementMultiplier: '+15%',
    bestDefense: 'Gelo + Terra',
    bestCharm: 'Zap',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/naga_warrior.gif',
    huntQuery: 'nagas',
    bonusText: 'Chance dobrada de pedras preciosas e drops Naga'
  },
  {
    id: 'gazer-spectre',
    name: 'Gazer Spectre',
    slug: 'gazer_spectre',
    category: 'Haunted Temple',
    hp: 4500,
    baseExp: 4200,
    boostedExp: 8400,
    bestElement: 'Gelo (Ice)',
    bestElementMultiplier: '+25%',
    bestDefense: 'Fogo + Melee',
    bestCharm: 'Freeze',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/gazer_spectre.gif',
    huntQuery: 'spectres',
    bonusText: 'Hunt Duo ED/EK com lucro triplicado e 8.4k XP'
  },
  {
    id: 'sphinx',
    name: 'Sphinx',
    slug: 'sphinx',
    category: 'Kilmaresh / Issavi',
    hp: 9500,
    baseExp: 8900,
    boostedExp: 17800,
    bestElement: 'Death / Terra',
    bestElementMultiplier: '+20%',
    bestDefense: 'Holy + Fogo',
    bestCharm: 'Enflame / Curse',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/sphinx.gif',
    huntQuery: 'issavi',
    bonusText: 'Meta Solo e Duo em Issavi: 17.8k XP por Sphinx'
  },
  {
    id: 'silencer',
    name: 'Silencer',
    slug: 'silencer',
    category: 'Roshamuul Valley',
    hp: 4200,
    baseExp: 3400,
    boostedExp: 6800,
    bestElement: 'Fogo / Físico',
    bestElementMultiplier: '+20%',
    bestDefense: 'Energy + Terra',
    bestCharm: 'Wound',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/silencer.gif',
    huntQuery: 'roshamuul',
    bonusText: 'Silencer Claws com taxa de drop máxima'
  },
  {
    id: 'cobra-assassin',
    name: 'Cobra Assassin',
    slug: 'cobra_assassin',
    category: 'Cobra Bastion',
    hp: 7600,
    baseExp: 6800,
    boostedExp: 13600,
    bestElement: 'Gelo / Fogo',
    bestElementMultiplier: '+15%',
    bestDefense: 'Terra + Físico',
    bestCharm: 'Freeze',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/cobra_assassin.gif',
    huntQuery: 'cobra',
    bonusText: 'Bastion rush com 13.6k XP e chance de Cobra Amulets'
  }
];

export const RUBINOT_BOOSTED_BOSSES = [
  {
    id: 'grand-master-oberon',
    name: 'Grand Master Oberon',
    slug: 'grand_master_oberon',
    category: 'Falcon Bastion',
    location: 'Falcon Bastion (Edron)',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/grand_master_oberon.gif',
    keyDrops: ['Falcon Battleaxe', 'Falcon Circlet', 'Falcon Plate', 'Falcon Greaves'],
    bonusText: 'Chance de Drop BiS Falcon aumentada significativamente hoje!',
    mechanicsTip: 'Fale a resposta exata do livro na 3ª fala para remover a invulnerabilidade.',
    bossRoute: '/bosses'
  },
  {
    id: 'scarlett-etzel',
    name: 'Scarlett Etzel',
    slug: 'scarlett_etzel',
    category: 'Cobra Bastion',
    location: 'Cobra Bastion (Ankrahmun)',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/scarlett_etzel.gif',
    keyDrops: ['Cobra Wand', 'Cobra Rod', 'Cobra Sword', 'Cobra Boots'],
    bonusText: 'Itens Cobra com probabilidade elevada de saque.',
    mechanicsTip: 'Puxe os 4 espelhos para a armadura e use o Cobra Crest para refletir o golpe.',
    bossRoute: '/bosses'
  },
  {
    id: 'drume',
    name: 'Drume',
    slug: 'drume',
    category: 'Bounac',
    location: 'Bounac Realm',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/drume.gif',
    keyDrops: ['Lion Spangenhelm', 'Lion Plate', 'Lion Spellbook', 'Lion Longsword'],
    bonusText: 'Lion Equipment com bônus de raridade na recompensa.',
    mechanicsTip: 'Proteja o Commander Kesar e evite os soldados no caminho.',
    bossRoute: '/bosses'
  },
  {
    id: 'timira',
    name: 'Timira the Many-Headed',
    slug: 'timira',
    category: 'Marapur',
    location: 'Marapur Depths',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/timira.gif',
    keyDrops: ['Naga Sword', 'Naga Crossbow', 'Naga Wand', 'Naga Quiver'],
    bonusText: 'Itens BiS de Marapur com drop boostado.',
    mechanicsTip: 'Cuidado com os tentáculos e ondas de água. Mages foquem em Energy/Terra.',
    bossRoute: '/bosses'
  },
  {
    id: 'bakragore',
    name: 'Bakragore',
    slug: 'bakragore',
    category: 'Rotten Blood',
    location: 'Bakragore Taint Realm',
    spriteUrl: 'https://tibiopedia.pl/images/static/monsters/bakragore.gif',
    keyDrops: ['Sanguine Blade', 'Sanguine Bow', 'Sanguine Boots', 'Sanguine Coil'],
    bonusText: 'Tier Supremo SSS: Sanguine Items com bônus no RubinOT.',
    mechanicsTip: 'Exige rotação perfeita de Might Rings e coordenação dos 5 Taints.',
    bossRoute: '/rotten-blood'
  }
];

export function getTodayBoosted(referenceDate = new Date()) {
  const now = new Date(referenceDate);
  const ssHourUtc = 10;
  
  const nextSs = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    ssHourUtc, 0, 0
  ));
  if (now.getTime() >= nextSs.getTime()) {
    nextSs.setUTCDate(nextSs.getUTCDate() + 1);
  }

  const cycleTime = now.getTime() - (ssHourUtc * 3600 * 1000);
  const epochDay = Math.floor(cycleTime / (24 * 3600 * 1000));

  const creatureIndex = Math.abs((epochDay * 37 + 13) % RUBINOT_BOOSTED_CREATURES.length);
  const bossIndex = Math.abs((epochDay * 53 + 7) % RUBINOT_BOOSTED_BOSSES.length);

  const creature = RUBINOT_BOOSTED_CREATURES[creatureIndex];
  const boss = RUBINOT_BOOSTED_BOSSES[bossIndex];

  const diffMs = Math.max(0, nextSs.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const formattedCountdown = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  return {
    creature,
    boss,
    nextServerSave: nextSs.toISOString(),
    formattedCountdown,
    diffMs
  };
}
