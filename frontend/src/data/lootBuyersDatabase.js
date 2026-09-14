// Catálogo de Compradores de Loot (Yasir, Djinns, Rashid)
// Permite calcular o total de GP obtido por NPC e planejar rotas de venda

export const LOOT_BUYERS_DATABASE = [
  // YASIR (Creature Products & Commodities)
  { id: 'vampire-teeth', name: 'Vampire Teeth', price: 275, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'bloody-pincers', name: 'Bloody Pincers', price: 100, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'rope-belt', name: 'Rope Belt', price: 66, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'protective-charm', name: 'Protective Charm', price: 60, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'sabretooth', name: 'Sabretooth', price: 400, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'silencer-claws', name: 'Silencer Claws', price: 390, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'vexclaw-talon', name: 'Vexclaw Talon', price: 1100, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'grimeleech-wings', name: 'Grimeleech Wings', price: 1200, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'dead-brain', name: 'Dead Brain', price: 420, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'spider-silk', name: 'Spider Silk', price: 100, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'dragon-leathery-legs', name: 'Dragon Leathery Legs', price: 800, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'demonic-essence', name: 'Demonic Essence', price: 1000, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'cultish-robe', name: 'Cultish Robe', price: 150, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },
  { id: 'woe', name: "Piece of Massacre's Shell", price: 50000, buyer: 'Yasir', city: 'Carlin / Ank / LB', category: 'Creature Product' },

  // GREEN DJINN (Malor - Ashta'daramur, Yalahar / Ankrahmun)
  { id: 'terra-legs', name: 'Terra Legs', price: 11000, buyer: 'Green Djinn', city: 'Ankrahmun / Yalahar', category: 'Legs' },
  { id: 'terra-boots', name: 'Terra Boots', price: 2500, buyer: 'Green Djinn', city: 'Ankrahmun / Yalahar', category: 'Boots' },
  { id: 'terra-mantle', name: 'Terra Mantle', price: 11000, buyer: 'Green Djinn', city: 'Ankrahmun / Yalahar', category: 'Armor' },
  { id: 'springsprout-rod', name: 'Springsprout Rod', price: 3600, buyer: 'Green Djinn', city: 'Ankrahmun / Yalahar', category: 'Weapon' },
  { id: 'wand-of-cosmic-energy', name: 'Wand of Cosmic Energy', price: 2000, buyer: 'Green Djinn', city: 'Ankrahmun / Yalahar', category: 'Weapon' },
  { id: 'wand-of-voodoo', name: 'Wand of Voodoo', price: 4400, buyer: 'Green Djinn', city: 'Ankrahmun / Yalahar', category: 'Weapon' },
  { id: 'hailstorm-rod', name: 'Hailstorm Rod', price: 3000, buyer: 'Green Djinn', city: 'Ankrahmun / Yalahar', category: 'Weapon' },
  { id: 'focus-cape', name: 'Focus Cape', price: 6000, buyer: 'Green Djinn', city: 'Ankrahmun / Yalahar', category: 'Armor' },

  // BLUE DJINN (Alesar / Nah'bob - Ankrahmun / Yalahar)
  { id: 'fire-sword', name: 'Fire Sword', price: 4000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Weapon' },
  { id: 'ice-rapier', name: 'Ice Rapier', price: 1000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Weapon' },
  { id: 'serpent-sword', name: 'Serpent Sword', price: 900, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Weapon' },
  { id: 'spike-sword', name: 'Spike Sword', price: 1000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Weapon' },
  { id: 'tower-shield', name: 'Tower Shield', price: 8000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Shield' },
  { id: 'vampire-shield', name: 'Vampire Shield', price: 15000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Shield' },
  { id: 'crown-armor', name: 'Crown Armor', price: 12000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Armor' },
  { id: 'crown-legs', name: 'Crown Legs', price: 12000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Legs' },
  { id: 'crown-shield', name: 'Crown Shield', price: 8000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Shield' },
  { id: 'crusader-helmet', name: 'Crusader Helmet', price: 6000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Helmet' },
  { id: 'royal-helmet', name: 'Royal Helmet', price: 30000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Helmet' },
  { id: 'boots-of-haste', name: 'Boots of Haste', price: 30000, buyer: 'Blue Djinn', city: 'Ankrahmun / Yalahar', category: 'Boots' },

  // RASHID (Traveling Trader)
  { id: 'magic-plate-armor', name: 'Magic Plate Armor (MPA)', price: 90000, buyer: 'Rashid', city: 'Rota Diária', category: 'Armor' },
  { id: 'dragon-scale-mail', name: 'Dragon Scale Mail (DSM)', price: 40000, buyer: 'Rashid', city: 'Rota Diária', category: 'Armor' },
  { id: 'demon-shield', name: 'Demon Shield', price: 30000, buyer: 'Rashid', city: 'Rota Diária', category: 'Shield' },
  { id: 'mastermind-shield', name: 'Mastermind Shield (MMS)', price: 50000, buyer: 'Rashid', city: 'Rota Diária', category: 'Shield' },
  { id: 'golden-legs', name: 'Golden Legs', price: 30000, buyer: 'Rashid', city: 'Rota Diária', category: 'Legs' },
  { id: 'golden-armor', name: 'Golden Armor', price: 20000, buyer: 'Rashid', city: 'Rota Diária', category: 'Armor' },
  { id: 'giant-sword', name: 'Giant Sword', price: 17000, buyer: 'Rashid', city: 'Rota Diária', category: 'Weapon' },
  { id: 'relic-sword', name: 'Relic Sword', price: 25000, buyer: 'Rashid', city: 'Rota Diária', category: 'Weapon' },
  { id: 'war-axe', name: 'War Axe', price: 9000, buyer: 'Rashid', city: 'Rota Diária', category: 'Weapon' },
  { id: 'demon-helmet', name: 'Demon Helmet', price: 40000, buyer: 'Rashid', city: 'Rota Diária', category: 'Helmet' },
  { id: 'skull-helmet', name: 'Skull Helmet', price: 40000, buyer: 'Rashid', city: 'Rota Diária', category: 'Helmet' },
  { id: 'zaoan-helmet', name: 'Zaoan Helmet', price: 45000, buyer: 'Rashid', city: 'Rota Diária', category: 'Helmet' },
  { id: 'zaoan-legs', name: 'Zaoan Legs', price: 14000, buyer: 'Rashid', city: 'Rota Diária', category: 'Legs' },
  { id: 'zaoan-armor', name: 'Zaoan Armor', price: 14000, buyer: 'Rashid', city: 'Rota Diária', category: 'Armor' }
];
