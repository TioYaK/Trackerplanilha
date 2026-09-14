// Catálogo Oficial de Equipamentos & Defesas (Tibia & RubinOT)
// Resistências e atributos oficiais para cálculo composto de dano

export const GEAR_DATABASE = {
  helmets: [
    { id: 'falcon-coif', name: 'Falcon Coif', voc: ['Knight', 'Paladin'], arm: 10, res: { physical: 3, fire: 10 }, tier: 'BiS', icon: '🪖' },
    { id: 'falcon-circlet', name: 'Falcon Circlet', voc: ['Druid', 'Sorcerer'], arm: 7, res: { energy: 7, fire: 4 }, tier: 'BiS', icon: '🪖' },
    { id: 'sanguine-hat', name: 'Sanguine Hat', voc: ['Druid', 'Sorcerer'], arm: 8, res: { death: 5, energy: 5 }, tier: 'BiS SSS', icon: '🪖' },
    { id: 'cobra-hood', name: 'Cobra Hood', voc: ['Knight', 'Paladin'], arm: 9, res: { terra: 6, physical: 2 }, tier: 'High-End', icon: '🪖' },
    { id: 'lion-spangenhelm', name: 'Lion Spangenhelm', voc: ['Paladin'], arm: 11, res: { holy: 5, physical: 3 }, tier: 'High-End', icon: '🪖' },
    { id: 'gnome-helmet', name: 'Gnome Helmet', voc: ['Druid', 'Sorcerer', 'Paladin'], arm: 8, res: { energy: 8, physical: 2 }, tier: 'High-End', icon: '🪖' },
    { id: 'prismatic-helmet', name: 'Prismatic Helmet', voc: ['Knight'], arm: 11, res: { physical: 5 }, tier: 'Mid/High', icon: '🪖' },
    { id: 'galea-mortis', name: 'Galea Mortis', voc: ['Druid', 'Sorcerer', 'Paladin', 'Knight'], arm: 6, res: { death: 6 }, tier: 'Mid/High', icon: '🪖' },
    { id: 'demon-helmet', name: 'Demon Helmet', voc: ['All'], arm: 10, res: {}, tier: 'Classic', icon: '🪖' }
  ],

  armors: [
    { id: 'falcon-plate', name: 'Falcon Plate', voc: ['Knight'], arm: 18, res: { physical: 12, energy: 10 }, tier: 'BiS', icon: '🛡️' },
    { id: 'sanguine-cloak', name: 'Sanguine Cloak', voc: ['Druid', 'Sorcerer'], arm: 14, res: { death: 8, physical: 4 }, tier: 'BiS SSS', icon: '🛡️' },
    { id: 'soulmantle', name: 'Soulmantle', voc: ['Druid', 'Sorcerer'], arm: 15, res: { physical: 4, energy: 10 }, tier: 'BiS', icon: '🛡️' },
    { id: 'soulshroud', name: 'Soulshroud', voc: ['Paladin'], arm: 16, res: { physical: 4, death: 10 }, tier: 'BiS', icon: '🛡️' },
    { id: 'naga-robe', name: 'Naga Robe', voc: ['Druid', 'Sorcerer'], arm: 14, res: { ice: 10, physical: 3 }, tier: 'High-End', icon: '🛡️' },
    { id: 'elven-mail', name: 'Elven Mail (3 Slots)', voc: ['All'], arm: 9, res: {}, tier: 'Custom Tank', slots: 3, icon: '🛡️' },
    { id: 'prismatic-armor', name: 'Prismatic Armor', voc: ['Knight', 'Paladin'], arm: 15, res: { physical: 5 }, tier: 'Mid/High', icon: '🛡️' },
    { id: 'eldritch-warmantle', name: 'Eldritch Warmantle', voc: ['Knight'], arm: 17, res: { fire: 8, physical: 5 }, tier: 'High-End', icon: '🛡️' }
  ],

  legs: [
    { id: 'falcon-greaves', name: 'Falcon Greaves', voc: ['Knight', 'Paladin'], arm: 10, res: { physical: 7, ice: 7 }, tier: 'BiS', icon: '👖' },
    { id: 'soulstrider', name: 'Soulstrider', voc: ['Paladin'], arm: 9, res: { physical: 4, holy: 7 }, tier: 'BiS', icon: '👖' },
    { id: 'sanguine-legs', name: 'Sanguine Legs', voc: ['All'], arm: 11, res: { physical: 8, death: 6 }, tier: 'BiS SSS', icon: '👖' },
    { id: 'bastion-greaves', name: 'Bastion Greaves', voc: ['Knight'], arm: 10, res: { physical: 6, earth: 6 }, tier: 'High-End', icon: '👖' },
    { id: 'fabulous-legs', name: 'Fabulous Legs', voc: ['Knight'], arm: 9, res: { fire: 4, physical: 4 }, tier: 'High-End', icon: '👖' },
    { id: 'prismatic-legs', name: 'Prismatic Legs', voc: ['Knight', 'Paladin'], arm: 8, res: { physical: 3 }, tier: 'Mid/High', icon: '👖' }
  ],

  boots: [
    { id: 'soulwalkers', name: 'Pair of Soulwalkers', voc: ['Knight'], arm: 4, res: { physical: 7, fire: 5 }, tier: 'BiS', icon: '👢' },
    { id: 'sanguine-boots', name: 'Sanguine Boots', voc: ['All'], arm: 4, res: { physical: 5, death: 5 }, tier: 'BiS SSS', icon: '👢' },
    { id: 'soulstalkers', name: 'Pair of Soulstalkers', voc: ['Paladin'], arm: 3, res: { physical: 5, energy: 5 }, tier: 'BiS', icon: '👢' },
    { id: 'dreamwalkers', name: 'Pair of Dreamwalkers', voc: ['Druid', 'Sorcerer'], arm: 2, res: { energy: 5, ice: 3 }, tier: 'BiS', icon: '👢' },
    { id: 'depth-calcei', name: 'Depth Calcei', voc: ['Knight'], arm: 3, res: { physical: 5 }, tier: 'Mid/High', icon: '👢' },
    { id: 'winged-boots', name: 'Winged Boots', voc: ['All'], arm: 2, res: { physical: 2 }, tier: 'Mid/High', icon: '👢' }
  ],

  shields: [
    { id: 'falcon-escutcheon', name: 'Falcon Escutcheon', voc: ['Knight', 'Paladin'], def: 41, res: { fire: 15, physical: 7 }, tier: 'BiS', icon: '🛡️' },
    { id: 'soulbastion', name: 'Soulbastion', voc: ['Knight'], def: 42, res: { physical: 10, death: 10 }, tier: 'BiS', icon: '🛡️' },
    { id: 'spiritthorn-shield', name: 'Spiritthorn Shield', voc: ['Knight'], def: 40, res: { earth: 12, physical: 6 }, tier: 'BiS SSS', icon: '🛡️' },
    { id: 'gnome-shield', name: 'Gnome Shield', voc: ['Knight', 'Paladin'], def: 38, res: { energy: 8, physical: 6 }, tier: 'High-End', icon: '🛡️' },
    { id: 'sanguine-core', name: 'Sanguine Core', voc: ['Druid', 'Sorcerer'], def: 24, res: { death: 8, physical: 4 }, tier: 'BiS SSS', icon: '📖' },
    { id: 'soulhexer', name: 'Soulhexer', voc: ['Sorcerer'], def: 22, res: { death: 8 }, tier: 'BiS', icon: '📖' },
    { id: 'prismatic-shield', name: 'Prismatic Shield', voc: ['Knight', 'Paladin'], def: 37, res: { physical: 4 }, tier: 'Mid/High', icon: '🛡️' }
  ],

  amulets: [
    { id: 'foxtail-amulet', name: 'Foxtail Amulet', arm: 2, res: { physical: 5 }, tier: 'Standard', icon: '📿' },
    { id: 'red-plasma-collar', name: 'Collar of Red Plasma', arm: 4, res: { physical: 5 }, tier: 'Buffer', icon: '📿' },
    { id: 'blue-plasma-collar', name: 'Collar of Blue Plasma', arm: 2, res: { physical: 3 }, tier: 'Buffer', icon: '📿' },
    { id: 'stone-skin-amulet', name: 'Stone Skin Amulet (SSA)', arm: 0, res: { physical: 80, death: 80 }, charges: 5, tier: 'Panic Reducer', icon: '📿' },
    { id: 'glacier-amulet', name: 'Glacier Amulet', arm: 0, res: { ice: 20, fire: -10 }, tier: 'Elemental', icon: '📿' },
    { id: 'magma-amulet', name: 'Magma Amulet', arm: 0, res: { fire: 20, ice: -10 }, tier: 'Elemental', icon: '📿' },
    { id: 'lightning-pendant', name: 'Lightning Pendant', arm: 0, res: { energy: 20, earth: -10 }, tier: 'Elemental', icon: '📿' },
    { id: 'terra-amulet', name: 'Terra Amulet', arm: 0, res: { earth: 20, fire: -10 }, tier: 'Elemental', icon: '📿' },
    { id: 'sacred-tree-amulet', name: 'Sacred Tree Amulet', arm: 0, res: { physical: 8 }, tier: 'Elemental', icon: '📿' }
  ],

  rings: [
    { id: 'might-ring', name: 'Might Ring', res: { physical: 20, fire: 20, ice: 20, energy: 20, earth: 20, death: 20, holy: 20 }, charges: 20, tier: 'Panic Reducer', icon: '💍' },
    { id: 'prismatic-ring', name: 'Prismatic Ring', res: { physical: 10 }, tier: 'Tank Sustentação', icon: '💍' },
    { id: 'blue-plasma-ring', name: 'Ring of Blue Plasma', res: { physical: 3 }, tier: 'Buffer', icon: '💍' },
    { id: 'red-plasma-ring', name: 'Ring of Red Plasma', res: { physical: 3 }, tier: 'Buffer', icon: '💍' },
    { id: 'butterfly-ring', name: 'Butterfly Ring', arm: 2, res: { death: 3 }, tier: 'Standard', icon: '💍' },
    { id: 'ring-of-souls', name: 'Ring of Souls', res: { death: 10 }, tier: 'High-End', icon: '💍' },
    { id: 'none-ring', name: 'Sem Anel / Ring de Skill', res: {}, tier: 'DPS', icon: '💍' }
  ]
};

// Imbuements de Proteção Elemental Poderosa (+15% de absorção por item)
export const IMBUEMENT_OPTIONS = [
  { id: 'none', label: 'Sem Imbuement Elemental', element: null, value: 0 },
  { id: 'fire', label: "Dragon's Hide (+15% Fogo)", element: 'fire', value: 15 },
  { id: 'ice', label: 'Quara Scale (+15% Gelo)', element: 'ice', value: 15 },
  { id: 'energy', label: 'Cloud Fabric (+15% Energia)', element: 'energy', value: 15 },
  { id: 'earth', label: 'Snake Skin (+15% Terra)', element: 'earth', value: 15 },
  { id: 'death', label: 'Demon Presence (+15% Death)', element: 'death', value: 15 },
  { id: 'holy', label: 'Lich Staff (+15% Holy)', element: 'holy', value: 15 }
];

// Cálculo de Resistência Composta Tibiana:
// Total Mitigated % = (1 - (1 - R1) * (1 - R2) * ... * (1 - Rn)) * 100
export function calculateEffectiveMitigation(resistanceList) {
  if (!resistanceList || resistanceList.length === 0) return 0;
  
  let multiplier = 1.0;
  for (const r of resistanceList) {
    if (r !== 0) {
      multiplier *= (1.0 - (r / 100));
    }
  }

  const finalMitigation = (1.0 - multiplier) * 100;
  return Math.round(finalMitigation * 10) / 10;
}
