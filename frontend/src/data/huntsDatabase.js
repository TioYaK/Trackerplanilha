// Base de Dados Completa e Curada do Meta de Hunts (RubinOT & Tibia Global)
// Contém rotas, pull mechanics, prioridades de proteção, charms, imbuements e guias de vídeo

export const HUNT_CATEGORIES = [
  { id: 'ALL', label: 'Todas as Categorias', icon: 'Sparkles', color: 'text-yellow-400' },
  { id: 'rotten_blood', label: 'Rotten Blood (Endgame SSS 900+)', icon: 'Skull', color: 'text-rose-400' },
  { id: 'soul_war', label: 'Soul War (Endgame SS 750+)', icon: 'Flame', color: 'text-purple-400' },
  { id: 'gnomprona', label: 'Gnomprona Hazard (700+)', icon: 'Zap', color: 'text-cyan-400' },
  { id: 'library', label: 'Secret Library (550+)', icon: 'BookOpen', color: 'text-amber-400' },
  { id: 'bastions', label: 'Bastions & Marapur (450+)', icon: 'Shield', color: 'text-emerald-400' },
  { id: 'ferumbras', label: 'Ferumbras Seals (450+)', icon: 'Skull', color: 'text-red-400' },
  { id: 'meta_hunts', label: 'Meta High Level (350 - 650)', icon: 'Award', color: 'text-yellow-400' },
  { id: 'mid_game', label: 'Mid Game Meta (150 - 450)', icon: 'Compass', color: 'text-blue-400' },
  { id: 'early_game', label: 'Iniciante & PG Starter (40 - 150)', icon: 'Sparkles', color: 'text-green-400' },
  { id: 'farm_profit', label: 'Reis do Lucro & Farme Puro', icon: 'Coins', color: 'text-amber-300' },
];

export const HUNTS_DATABASE = [
// --- ROTTEN BLOOD (ENDGAME ABSOLUTO 900 - 1500+) ---
  {
    id: 'rotten-jaded-roots',
    name: 'Rotten Blood: Jaded Roots',
    city: 'Bakragore Realm',
    category: 'rotten_blood',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 850,
    recommendedLevel: 1050,
    modes: ['Team 4x', 'Trio'],
    rawXp: '28M - 45M/h',
    profit: '3.5M - 7.0M/h',
    danger: 5,
    tier: 'Endgame SSS',
    tags: ['Tainted Mechanics', 'Lucro Máximo', 'XP Extrema', 'Sanguine Drops'],
    elements: ['Earth', 'Life Drain', 'Physical'],
    protectionPriorities: [
      { element: 'Earth', percent: '45%+', note: 'Essencial contra spams de veneno' },
      { element: 'Life Drain', percent: '25%+', note: 'Mitiga vampirismo dos monstros' },
      { element: 'Physical', percent: '35%+', note: 'Porrada pesada nos boxes fechados' }
    ],
    charms: [
      { monster: 'Tainted Soul', charm: 'Divine Wrath / Enflame', weakness: 'Fire (+15%), Holy (+10%)' },
      { monster: 'Jaded Roots Crawler', charm: 'Freeze / Zap', weakness: 'Ice (+20%), Energy (+10%)' },
      { monster: 'Root Golem', charm: 'Curse / Low Blow', weakness: 'Death (+15%), Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Mana Leech + Void/Element',
      armor: 'Life Leech + Earth Protection (Snake Skin)',
      helmet: 'Mana Leech + Skill Boost',
      shield: 'Earth Protection + Turtle Slice'
    },
    pullStrategy: 'Puxadas de 8 a 12 monstros no máximo. O Knight deve fechar o box contra as raízes fixas para evitar ser empurrado. Druid foca em Mass Healing nos turnos ímpares e Sio direto.',
    roles: {
      ek: 'Tank central, segurar Exori Gran na rotação e nunca deixar box abrir.',
      ed: 'Mass Healing contínuo, Earth Protections ativas, manter o EK 100% de HP.',
      ms: 'Debuff de Sap Strength constante nos grandes mobs e waves de fogo.',
      rp: 'Mas San sincronizado, lurar bichos desgarrados e manter distância de segurança.'
    },
    youtubeId: '85XbU4kE3g0',
    youtubeTitle: 'Rotten Blood Jaded Roots - 4x Team Hunt Guide & Route',
    description: 'Um dos quatro quadrantes letais de Bakragore. Monstros aplicam corrupção e life drain em área. Drop de armas e armaduras Sanguine.'
  },
  {
    id: 'rotten-darklight-core',
    name: 'Rotten Blood: Darklight Core',
    city: 'Bakragore Realm',
    category: 'rotten_blood',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 900,
    recommendedLevel: 1100,
    modes: ['Team 4x'],
    rawXp: '30M - 48M/h',
    profit: '4.0M - 8.0M/h',
    danger: 5,
    tier: 'Endgame SSS',
    tags: ['Energy & Death', 'Área Letal', 'Sanguine Drops', 'Meta Atual'],
    elements: ['Energy', 'Death', 'Physical'],
    protectionPriorities: [
      { element: 'Energy', percent: '40%+', note: 'Sparks e campos elétricos' },
      { element: 'Death', percent: '35%+', note: 'Beam letal dos Darklight Stalkers' },
      { element: 'Physical', percent: '30%+', note: 'Bate físico corpo a corpo' }
    ],
    charms: [
      { monster: 'Darklight Construct', charm: 'Freeze / Wound', weakness: 'Ice (+20%), Physical' },
      { monster: 'Darklight Striker', charm: 'Divine Wrath / Zap', weakness: 'Holy (+15%), Energy' },
      { monster: 'Darklight Matter', charm: 'Enflame / Curse', weakness: 'Fire (+15%)' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Mana Leech + Ice Conversion',
      armor: 'Life Leech + Energy Protection (Cloud Fabric)',
      helmet: 'Mana Leech + Magic/Skill',
      shield: 'Energy Protection + Death Shield'
    },
    pullStrategy: 'O time deve avançar em bloco compacto. Nunca correr na frente do EK porque os beams de Death atravessam meia tela e podem dar combo fatal.',
    roles: {
      ek: 'Posicionar costas para paredes estreitas para limitar contato a 5-6 bichos.',
      ed: 'Manter Sio engatilhado a cada 1 segundo; usar Wild Growth para trapar corredores.',
      ms: 'Rotação de Cryomancy/Energy Wave e UH pronta pro Paladin.',
      rp: 'Off-tanking seletivo com prismatic ring e Diamond Arrows.'
    },
    youtubeId: '_4Cg_xMvxK8',
    youtubeTitle: 'Darklight Core Rotten Blood 4x Full Hunt 50kk/h',
    description: 'Quadrante elétrico e sombrio de Rotten Blood com a maior densidade de XP/hora do jogo para times de elite.'
  },
  {
    id: 'rotten-putrefactory',
    name: 'Rotten Blood: Putrefactory',
    city: 'Bakragore Realm',
    category: 'rotten_blood',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 900,
    recommendedLevel: 1050,
    modes: ['Team 4x'],
    rawXp: '27M - 44M/h',
    profit: '3.0M - 6.5M/h',
    danger: 5,
    tier: 'Endgame SSS',
    tags: ['Putrid Slime', 'Sanguine Rod/Bow', 'Alta Intensidade'],
    elements: ['Earth', 'Death', 'Physical'],
    protectionPriorities: [
      { element: 'Earth', percent: '40%+', note: 'Gargoyle spams de veneno bruto' },
      { element: 'Death', percent: '30%+', note: 'Miasma pestilento e ondas' },
      { element: 'Physical', percent: '30%+', note: 'Golpes pesados de melee' }
    ],
    charms: [
      { monster: 'Putrefactory Slime', charm: 'Freeze / Divine Wrath', weakness: 'Ice (+25%), Holy (+10%)' },
      { monster: 'Tainted Gargoyle', charm: 'Enflame / Wound', weakness: 'Fire (+15%), Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Life Leech + Ice',
      armor: 'Life Leech + Earth Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Earth Protection + Physical'
    },
    pullStrategy: 'Lurar sala por sala. Tomar extremo cuidado com os lodos que surgem no chão reduzindo velocidade e aplicando debuff de cura.',
    roles: {
      ek: 'Exori Gran focado e rotação de defesa com Might Rings nos pulls maiores.',
      ed: 'Cura Massiva + Avalanche.',
      ms: 'Flam Hur e Great Fireball.',
      rp: 'Diamond Arrows + Divine Caldera constante.'
    },
    youtubeId: 'J-rYg9kU_r8',
    youtubeTitle: 'Rotten Blood Putrefactory 4x Team Hunt Guide',
    description: 'Pântano pestilento de Bakragore com alto drop de Bag You Desire e itens de Sanguine.'
  },
  {
    id: 'rotten-gloom-pillars',
    name: 'Rotten Blood: Gloom Pillars',
    city: 'Bakragore Realm',
    category: 'rotten_blood',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 850,
    recommendedLevel: 1000,
    modes: ['Team 4x'],
    rawXp: '26M - 42M/h',
    profit: '3.0M - 6.0M/h',
    danger: 5,
    tier: 'Endgame SSS',
    tags: ['Gloom Horrors', 'Holy & Physical', 'Sanguine Weapons'],
    elements: ['Holy', 'Physical', 'Death'],
    protectionPriorities: [
      { element: 'Holy', percent: '35%+', note: 'Combos de raios sagrados invertidos' },
      { element: 'Physical', percent: '40%+', note: 'Esmagamento físico maciço' }
    ],
    charms: [
      { monster: 'Gloom Horror', charm: 'Zap / Freeze', weakness: 'Energy (+20%), Ice (+10%)' },
      { monster: 'Pillar Warden', charm: 'Enflame / Curse', weakness: 'Fire (+15%), Death' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Mana Leech + Energy',
      armor: 'Life Leech + Holy Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Physical Protection'
    },
    pullStrategy: 'Prender os Pillar Wardens com Wild Growth para isolar o dano corpo-a-corpo.',
    roles: {
      ek: 'Manter a atenção nos monstros que mudam de alvo repentinamente.',
      ed: 'Curar o RP caso ele tome retargeting dos Gloom Horrors.',
      ms: 'Energy Wave e debuff de dano físico.',
      rp: 'Manter distância de 3 SQMs da box.'
    },
    youtubeId: '81k5Ew_K7j0',
    youtubeTitle: 'Gloom Pillars Rotten Blood Hunt Guide',
    description: 'Quadrante dos pilares de corrupção sombria com excelente densidade de bichos e alta taxa de sobrevivência para times coordenados.'
  },

  // --- SOUL WAR (ENDGAME 700 - 1200+) ---
  {
    id: 'soulwar-rotten-wasteland',
    name: 'Soul War: Rotten Wasteland',
    city: 'Thais (Soul War Hub)',
    category: 'soul_war',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 750,
    recommendedLevel: 950,
    modes: ['Team 4x', 'Duo'],
    rawXp: '20M - 34M/h',
    profit: '2.5M - 5.5M/h',
    danger: 5,
    tier: 'Endgame SS',
    tags: ['Branchy Crawler', 'Soulshredder Drop', 'Meta Clássico'],
    elements: ['Death', 'Earth', 'Physical'],
    protectionPriorities: [
      { element: 'Death', percent: '45%+', note: 'Crítico de death pode hitar 3000+' },
      { element: 'Earth', percent: '30%+', note: 'Ondas venenosas contínuas' },
      { element: 'Physical', percent: '25%+', note: 'Melee dos Golems' }
    ],
    charms: [
      { monster: 'Branchy Crawler', charm: 'Freeze / Enflame', weakness: 'Ice (+20%), Fire (+10%)' },
      { monster: 'Rotten Golem', charm: 'Zap / Divine Wrath', weakness: 'Energy (+20%), Holy (+10%)' },
      { monster: 'Mould Phantom', charm: 'Curse / Wound', weakness: 'Death (+10%), Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Mana Leech + Ice Imbuement',
      armor: 'Life Leech + Death Protection (Lich Shroud)',
      helmet: 'Mana Leech + Skill Boost',
      shield: 'Death Protection + Physical'
    },
    pullStrategy: 'Lurar em formato de circulo no salão central. O EK deve sempre colar de costas para a rocha. Druid e MS ficam 4 SQMs para trás usando mas res.',
    roles: {
      ek: 'Controle de exeta res é vital para os phantoms não virarem nos mages.',
      ed: 'Sio prioritário + mass healing com foco nas waves venenosas.',
      ms: 'Energy waves e avalanche alternadas.',
      rp: 'Atirar no centro do box e queimar com Divine Caldera.'
    },
    youtubeId: '8q6P9V6d6jI',
    youtubeTitle: 'Soul War Rotten Wasteland 4x Team Guide Tibia',
    description: 'O clássico de Soul War. Fonte primária de Soulshredder, Soulpiercer e Bag You Covet.'
  },
  {
    id: 'soulwar-ebb-flow',
    name: 'Soul War: Ebb and Flow',
    city: 'Thais (Soul War Hub)',
    category: 'soul_war',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 750,
    recommendedLevel: 900,
    modes: ['Team 4x', 'Duo'],
    rawXp: '19M - 32M/h',
    profit: '2.0M - 4.8M/h',
    danger: 5,
    tier: 'Endgame SS',
    tags: ['Afogamento', 'Ice & Energy', 'Soulmantle / Soulhexer'],
    elements: ['Ice', 'Energy', 'Drown'],
    protectionPriorities: [
      { element: 'Ice', percent: '40%+', note: 'Ondas de gelo dos aquaticos' },
      { element: 'Energy', percent: '30%+', note: 'Correntes elétricas subaquáticas' }
    ],
    charms: [
      { monster: 'Bony Sea Devil', charm: 'Zap / Enflame', weakness: 'Energy (+25%), Fire (+15%)' },
      { monster: 'Capricious Phantom', charm: 'Wound / Freeze', weakness: 'Physical, Ice' },
      { monster: 'Turbulent Elemental', charm: 'Curse / Low Blow', weakness: 'Death (+20%)' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Energy Imbue + Mana Leech',
      armor: 'Life Leech + Ice Protection (Winter Furs)',
      helmet: 'Mana Leech + Magic Level',
      shield: 'Ice Protection + Energy'
    },
    pullStrategy: 'Cuidado com a mecânica da maré (maré alta e maré baixa alteram a resistência dos monstros). Lure suavemente pelas pontes estreitas.',
    roles: {
      ek: 'Evitar correr quando a maré subir para não ficar isolado.',
      ed: 'Energy bomb nas saídas para segurar adds.',
      ms: 'Energy Wave destrói os Sea Devils rapidamente.',
      rp: 'Focar dano nos monstros com maior fraqueza física.'
    },
    youtubeId: 'mXz4F28g2eE',
    youtubeTitle: 'Ebb and Flow Soul War Full Route & Guide',
    description: 'Respawn aquático de Soul War com excelente rendimento e drop de armaduras e elmos Soul.'
  },
  {
    id: 'soulwar-furious-crater',
    name: 'Soul War: Furious Crater',
    city: 'Thais (Soul War Hub)',
    category: 'soul_war',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 800,
    recommendedLevel: 950,
    modes: ['Team 4x'],
    rawXp: '21M - 35M/h',
    profit: '2.5M - 5.2M/h',
    danger: 5,
    tier: 'Endgame SS',
    tags: ['Fire & Physical', 'Cloak of Terror', 'Soulbiter'],
    elements: ['Fire', 'Physical', 'Death'],
    protectionPriorities: [
      { element: 'Fire', percent: '45%+', note: 'Lava e meteoros contínuos' },
      { element: 'Physical', percent: '35%+', note: 'Bate dos Many Faces' }
    ],
    charms: [
      { monster: 'Cloak of Terror', charm: 'Freeze / Zap', weakness: 'Ice (+25%), Energy (+15%)' },
      { monster: 'Many Faces', charm: 'Curse / Enflame', weakness: 'Death (+15%), Fire' },
      { monster: 'Courage Leech', charm: 'Divine Wrath / Low Blow', weakness: 'Holy (+20%)' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice Imbuement + Mana Leech',
      armor: 'Life Leech + Fire Protection (Dragon Hide)',
      helmet: 'Mana Leech + Skill',
      shield: 'Fire Protection (Sun Medal)'
    },
    pullStrategy: 'Lurar no sentido anti-horário das crateras de magma. Manter o EK sempre fora das poças vermelhas que causam dano percentual.',
    roles: {
      ek: 'Não ficar parado em poças de calor.',
      ed: 'Avalanche constante e cura de sangramento.',
      ms: 'Ice wave / Avalanche e debuff de dano.',
      rp: 'Manter a retaguarda livre de Cloaks.'
    },
    youtubeId: 'k1jX76E46-w',
    youtubeTitle: 'Soul War Furious Crater 4x Hunt Guide',
    description: 'Vulcão infernal de Soul War com combos pesados de Fogo e Físico. Ótimo para magias de gelo.'
  },
  {
    id: 'soulwar-claustrophobic-inferno',
    name: 'Soul War: Claustrophobic Inferno',
    city: 'Thais (Soul War Hub)',
    category: 'soul_war',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 800,
    recommendedLevel: 1000,
    modes: ['Team 4x'],
    rawXp: '22M - 36M/h',
    profit: '2.8M - 6.0M/h',
    danger: 5,
    tier: 'Endgame SS',
    tags: ['Brachiodemon', 'Fogo & Morte', 'Soulbleeder Drop'],
    elements: ['Fire', 'Death', 'Physical'],
    protectionPriorities: [
      { element: 'Fire', percent: '40%+', note: 'Explosões de demônios' },
      { element: 'Death', percent: '40%+', note: 'Beams dos Brachiodemons' }
    ],
    charms: [
      { monster: 'Brachiodemon', charm: 'Freeze / Zap', weakness: 'Ice (+25%), Energy (+15%)' },
      { monster: 'Infernal Demon', charm: 'Divine Wrath / Wound', weakness: 'Holy (+20%), Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice Imbue + Mana Leech',
      armor: 'Life Leech + Fire & Death Protection',
      helmet: 'Mana Leech + Skill Boost',
      shield: 'Death Protection + Fire'
    },
    pullStrategy: 'Respeitar as salas fechadas. Os Brachiodemons castam waves frontais mortais: nunca fique alinhado na frente deles!',
    roles: {
      ek: 'Virar os demônios para fora da direção dos mages.',
      ed: 'Curar no capricho; se o EK tomar wave dupla de Brachiodemon, usar Gran Sio.',
      ms: 'Ice Wave e Avalanche.',
      rp: 'Dano máximo à distância com Mas San.'
    },
    youtubeId: 'Yg4_T1B7nF0',
    youtubeTitle: 'Soul War Claustrophobic Inferno Guide',
    description: 'O inferno claustrofóbico de Soul War. Alta chance de dropar Soulbleeder e Soulcrusher.'
  },
  {
    id: 'soulwar-mirrored-nightmare',
    name: 'Soul War: Mirrored Nightmare',
    city: 'Thais (Soul War Hub)',
    category: 'soul_war',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 750,
    recommendedLevel: 900,
    modes: ['Team 4x', 'Duo'],
    rawXp: '18M - 30M/h',
    profit: '2.0M - 4.5M/h',
    danger: 5,
    tier: 'Endgame SS',
    tags: ['Holy & Energy', 'Espelhos', 'Soulstrider / Soultainted'],
    elements: ['Holy', 'Energy', 'Physical'],
    protectionPriorities: [
      { element: 'Holy', percent: '35%+', note: 'Combos de reflexo divino' },
      { element: 'Energy', percent: '35%+', note: 'Beams prismáticos' }
    ],
    charms: [
      { monster: 'Mirror Image', charm: 'Curse / Enflame', weakness: 'Death (+20%), Fire (+15%)' },
      { monster: 'Phantasm of Pain', charm: 'Freeze / Wound', weakness: 'Ice (+15%), Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Death Imbue + Mana Leech',
      armor: 'Life Leech + Holy Protection',
      helmet: 'Mana Leech + Magic',
      shield: 'Energy & Holy'
    },
    pullStrategy: 'Atrair os phantasms para o centro do piso de espelhos. Evitar correr em corredores cegos.',
    roles: {
      ek: 'Box central controlado.',
      ed: 'Curar e usar Sudden Death nos adds.',
      ms: 'Flam Hur e Great Fireball.',
      rp: 'Manter a linha de fogo limpa.'
    },
    youtubeId: 'nQ9-4z9e2Y0',
    youtubeTitle: 'Soul War Mirrored Nightmare Team Route',
    description: 'Quadrante dos pesadelos refletidos. Rápida rotação de pulls e ótima taxa de sobrevivência.'
  },

  // --- GNOMPRONA / PRIMAL ORDEAL (HAZARD SYSTEM 650 - 1100+) ---
  {
    id: 'gnomprona-monster-graveyard',
    name: 'Gnomprona: Monster Graveyard',
    city: 'Gnomprona Deep Mines',
    category: 'gnomprona',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 650,
    recommendedLevel: 850,
    modes: ['Team 4x', 'Duo', 'Solo'],
    rawXp: '18M - 36M/h',
    profit: '2.5M - 6.0M/h',
    danger: 4,
    tier: 'Meta S',
    tags: ['Hazard System', 'Plunder Patriarch', 'Primal Items', 'XP Insana'],
    elements: ['Earth', 'Death', 'Physical'],
    protectionPriorities: [
      { element: 'Earth', percent: '40%+', note: 'Veneno dos ossos primais' },
      { element: 'Physical', percent: '35%+', note: 'Impacto esmagador dos dinossauros' },
      { element: 'Death', percent: '25%+', note: 'Necrose dos fósseis' }
    ],
    charms: [
      { monster: 'Primal Pod', charm: 'Freeze / Low Blow', weakness: 'Ice (+20%), Physical' },
      { monster: 'Fossilised Titan', charm: 'Divine Wrath / Zap', weakness: 'Holy (+20%), Energy' },
      { monster: 'Prehistoric Crawler', charm: 'Enflame / Wound', weakness: 'Fire (+15%)' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice Imbuement + Mana Leech',
      armor: 'Life Leech + Earth Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Physical Protection + Earth'
    },
    pullStrategy: 'Ajuste o nível de Hazard conforme a força da sua equipe (Hazard 1-5 para segurança, Hazard 8-12 para XP extrema). Atenção ao spawn do Plunder Patriarch!',
    roles: {
      ek: 'Fixar o box nos nós rochosos para não ser arrastado pelos fósseis.',
      ed: 'Avalanche constante e Mass Healing.',
      ms: 'Great Fireball e debuff de armadura.',
      rp: 'Lurar os titãs desgarrados e focar nas pods.'
    },
    youtubeId: 'w2B9k8Z1L3s',
    youtubeTitle: 'Gnomprona Monster Graveyard Hazard 10 Guide',
    description: 'Cemitério de monstros primordiais com mecânica de Hazard escalonável. Muito lucro em joias e drops de Primal Bag.'
  },
  {
    id: 'gnomprona-crystal-enigma',
    name: 'Gnomprona: Crystal Enigma',
    city: 'Gnomprona Deep Mines',
    category: 'gnomprona',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 700,
    recommendedLevel: 880,
    modes: ['Team 4x'],
    rawXp: '17M - 32M/h',
    profit: '2.0M - 5.0M/h',
    danger: 4,
    tier: 'Meta S',
    tags: ['Hazard Scalable', 'Ice & Energy', 'Gnome Bags'],
    elements: ['Ice', 'Energy', 'Physical'],
    protectionPriorities: [
      { element: 'Ice', percent: '40%+', note: 'Estilhaços de cristal glacial' },
      { element: 'Energy', percent: '35%+', note: 'Descargas piezoelétricas' }
    ],
    charms: [
      { monster: 'Crystal Elemental', charm: 'Enflame / Zap', weakness: 'Fire (+20%), Energy' },
      { monster: 'Enigmatic Shard', charm: 'Wound / Freeze', weakness: 'Physical, Ice' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Fire Imbuement + Mana',
      armor: 'Life Leech + Ice Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Ice Protection'
    },
    pullStrategy: 'Evitar quebrar cristais sem o time estar posicionado para não atrair monstros invisíveis simultaneamente.',
    roles: {
      ek: 'Segurar os cristais maiores de costas pro time.',
      ed: 'Foco total na cura do EK.',
      ms: 'Flam Hur contínuo.',
      rp: 'Atirar com Holy no foco secundário.'
    },
    youtubeId: 'K9_rX1Z2b_s',
    youtubeTitle: 'Gnomprona Crystal Enigma Team Guide',
    description: 'Caverna cristalina de Gnomprona com monstros que refletem status e rendem altíssima XP por hora.'
  },

  // --- SECRET LIBRARY (500 - 900+) ---
  {
    id: 'secret-library-fire',
    name: 'Secret Library: Fire Section',
    city: 'Asura Island (Library)',
    category: 'library',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 550,
    recommendedLevel: 750,
    modes: ['Team 4x', 'Duo'],
    rawXp: '15M - 26M/h',
    profit: '1.5M - 3.8M/h',
    danger: 4,
    tier: 'Meta S',
    tags: ['Burning Books', 'Livros Vivos', 'Excelente XP'],
    elements: ['Fire', 'Physical', 'Life Drain'],
    protectionPriorities: [
      { element: 'Fire', percent: '50%+', note: 'Campos de fogo e meteoros massivos' },
      { element: 'Physical', percent: '30%+', note: 'Esmagamento das estantes vivas' }
    ],
    charms: [
      { monster: 'Burning Book', charm: 'Freeze / Zap', weakness: 'Ice (+30%), Energy (+15%)' },
      { monster: 'Guardian of Tales', charm: 'Wound / Divine Wrath', weakness: 'Physical, Holy' },
      { monster: 'Rage Squid', charm: 'Freeze / Low Blow', weakness: 'Ice (+20%)' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice Imbuement + Mana Leech',
      armor: 'Life Leech + Fire Protection (Dragon Hide)',
      helmet: 'Mana Leech + Magic/Skill',
      shield: 'Fire Protection (Sun Medal)'
    },
    pullStrategy: 'Lurar em volta dos pilares da biblioteca. Nunca deixar os Burning Books darem wave na diagonal dos shooters.',
    roles: {
      ek: 'Virar os livros para longe do time e manter Exeta Amp Res ativo.',
      ed: 'Avalanche sem parar + cura dupla no EK.',
      ms: 'Ice Wave no cooldown + Great Fireball/Avalanche.',
      rp: 'Posicionamento 3 SQMs atrás do box.'
    },
    youtubeId: 'Z49_k1L2b7Y',
    youtubeTitle: 'Secret Library Fire Section 4x Team Hunt',
    description: 'A seção de fogo da Biblioteca Secreta. O maior campo de teste para times médios e avançados refinarem sinergia.'
  },
  {
    id: 'secret-library-ice',
    name: 'Secret Library: Ice Section',
    city: 'Asura Island (Library)',
    category: 'library',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 550,
    recommendedLevel: 750,
    modes: ['Team 4x'],
    rawXp: '14M - 25M/h',
    profit: '1.2M - 3.2M/h',
    danger: 4,
    tier: 'Meta S',
    tags: ['Ice Books', 'Paralyze Constante', 'Time Coordenado'],
    elements: ['Ice', 'Death', 'Physical'],
    protectionPriorities: [
      { element: 'Ice', percent: '45%+', note: 'Golpes congelantes' },
      { element: 'Death', percent: '30%+', note: 'Ink Blobs e maldições' }
    ],
    charms: [
      { monster: 'Ice Book', charm: 'Enflame / Zap', weakness: 'Fire (+30%), Energy (+15%)' },
      { monster: 'Ink Blob', charm: 'Divine Wrath / Wound', weakness: 'Holy, Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Fire Imbuement + Mana Leech',
      armor: 'Life Leech + Ice Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Ice Protection'
    },
    pullStrategy: 'Usar cure paralysis frequentemente. O EK deve andar com time ring e foxtail amulet.',
    roles: {
      ek: 'Andar devagar para não descolar do druid nos momentos de paralisia.',
      ed: 'Manter Mass Healing e curar os mages paralisados.',
      ms: 'Great Fireball e Flam Hur contínuos.',
      rp: 'Foco nos Ink Blobs para tirá-los rapidamente da tela.'
    },
    youtubeId: '4K9_m1L2z8Y',
    youtubeTitle: 'Secret Library Ice Section 4x Full Hunt',
    description: 'A seção de gelo da Biblioteca Secreta com monstros que drenam mana e aplicam paralisia severa.'
  },

  // --- META SOLO & DUO & 4X (400 - 800) ---
  {
    id: 'cobra-bastion',
    name: 'Cobra Bastion',
    city: 'Scarlett Island',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 450,
    recommendedLevel: 600,
    modes: ['Solo', 'Duo', 'Team 4x'],
    rawXp: '9.0M - 15M/h',
    profit: '1.5M - 3.2M/h',
    danger: 4,
    tier: 'Meta S',
    tags: ['Cobra Items', 'Lucro Brutal', 'Solo EK / RP Meta', 'Scarlett'],
    elements: ['Earth', 'Physical'],
    protectionPriorities: [
      { element: 'Earth', percent: '40%+', note: 'Flechas e feitiços venenosos dos Cobras' },
      { element: 'Physical', percent: '35%+', note: 'Ataques corpo a corpo pesados' }
    ],
    charms: [
      { monster: 'Cobra Vizier', charm: 'Freeze / Zap', weakness: 'Ice (+15%), Energy (+10%)' },
      { monster: 'Cobra Scout', charm: 'Wound / Low Blow', weakness: 'Physical, Fire' },
      { monster: 'Cobra Assassin', charm: 'Freeze / Enflame', weakness: 'Ice, Fire' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Mana Leech + Ice/Life',
      armor: 'Life Leech + Earth Protection',
      helmet: 'Mana Leech + Skill Boost',
      shield: 'Physical Protection + Earth'
    },
    pullStrategy: 'Lurar os andares do castelo em volta das escadas. No subsolo, tome cuidado com o combo de 3 Viziers de longe.',
    roles: {
      ek: 'Solo: fechar box de 8 em cantos com 2 scouts. Em time: trapar Scarlett e limpar andares.',
      ed: 'Se em dupla, colar no EK e soltar avalanche sem parar.',
      ms: 'Great Fireball e debuff nos Assassins.',
      rp: 'Diamond Arrows com prismatic armor/ring se for solo.'
    },
    youtubeId: 'E4X0P7q7z6k',
    youtubeTitle: 'Cobra Bastion Solo EK 600+ Full Guide & Profit',
    description: 'O melhor respawn de lucro e equilíbrio para Knights e Paladins solo. Risco moderado com drops valiosos de Cobra Wand, Sword e Crossbow.'
  },
  {
    id: 'falcon-bastion',
    name: 'Falcon Bastion',
    city: 'Edron / Zao',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 450,
    recommendedLevel: 620,
    modes: ['Solo', 'Duo', 'Team 4x'],
    rawXp: '8.5M - 14.5M/h',
    profit: '1.2M - 2.8M/h',
    danger: 4,
    tier: 'Meta S',
    tags: ['Falcon Items', 'Holy & Energy', 'Grand Master Oberon'],
    elements: ['Holy', 'Energy', 'Physical'],
    protectionPriorities: [
      { element: 'Holy', percent: '35%+', note: 'Combos de Paladins e Knights sagrados' },
      { element: 'Energy', percent: '30%+', note: 'Golpes de relâmpago' },
      { element: 'Physical', percent: '30%+', note: 'Impacto direto de espadas' }
    ],
    charms: [
      { monster: 'Falcon Knight', charm: 'Freeze / Curse', weakness: 'Ice (+15%), Death (+15%)' },
      { monster: 'Falcon Paladin', charm: 'Zap / Wound', weakness: 'Energy, Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Death Imbue + Mana Leech',
      armor: 'Life Leech + Holy Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Physical + Holy'
    },
    pullStrategy: 'Lure cuidadoso nos andares superiores. Os Falcon Paladins batem à distância e podem acumular dano repentino se deixados soltos.',
    roles: {
      ek: 'Priorizar matar os Paladins primeiro.',
      ed: 'Usar Sudden Death nos monstros isolados.',
      ms: 'Energy Wave e debuff.',
      rp: 'Trapar paladins soltos com Diamond Arrows.'
    },
    youtubeId: 'Y7Z2x4W1b8A',
    youtubeTitle: 'Falcon Bastion Guide Tibia 450+',
    description: 'Baluarte dos falcões com alta densidade de drops de gemas, anéis e itens de Falcon.'
  },
  {
    id: 'asuras-mirror',
    name: 'True Asuras (Asura Mirror)',
    city: 'Tiquanda / Port Hope',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 400,
    recommendedLevel: 550,
    modes: ['Solo', 'Duo'],
    rawXp: '8.0M - 13.5M/h',
    profit: '1.4M - 2.6M/h',
    danger: 4,
    tier: 'Meta S',
    tags: ['Lucro Absoluto', 'Espelho Secreto', 'Solo Master', 'Meta Rubinot'],
    elements: ['Fire', 'Death', 'Life Drain', 'Physical'],
    protectionPriorities: [
      { element: 'Fire', percent: '35%+', note: 'Chamas das Hellflayer e Midnight Asuras' },
      { element: 'Death', percent: '30%+', note: 'Maldições das True Asuras' },
      { element: 'Life Drain', percent: '20%+', note: 'Dreno voraz no corpo a corpo' }
    ],
    charms: [
      { monster: 'True Dawnfire Asura', charm: 'Freeze / Wound', weakness: 'Ice (+25%), Physical' },
      { monster: 'True Midnight Asura', charm: 'Zap / Divine Wrath', weakness: 'Energy (+20%), Holy (+15%)' },
      { monster: 'True Frost Flower Asura', charm: 'Enflame / Curse', weakness: 'Fire (+25%), Death' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Life Leech + Mana Leech',
      armor: 'Life Leech + Fire Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Physical + Fire Protection'
    },
    pullStrategy: 'Giro contínuo nos 3 andares do espelho. Não parar entre as salas: manter o leilão de XP sempre rodando.',
    roles: {
      ek: 'Exori Gran > Exori Mas > Exori Min sem parar com Life Leech duplo.',
      ed: 'Avalanche + Sio se duo.',
      ms: 'Solo na SD/Thunderstorm ou Duo.',
      rp: 'Diamond Arrows + Mas San a cada 2 segundos.'
    },
    youtubeId: '5rQ-d0B4m1E',
    youtubeTitle: 'Asuras Mirror Solo EK 500+ Rotas & Lucro',
    description: 'Um dos respawns mais disputados de todo o Tibia. Densidade absurda de monstros rápidos e rentabilidade em raw gold e gemas.'
  },
  {
    id: 'naga-temple-marapur',
    name: 'Naga Temple (Marapur)',
    city: 'Marapur',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Monk'],
    minLevel: 500,
    recommendedLevel: 680,
    modes: ['Solo', 'Duo'],
    rawXp: '9.5M - 15.5M/h',
    profit: '1.8M - 3.5M/h',
    danger: 4,
    tier: 'Meta S',
    tags: ['Lucro Extremo', 'Marapur', 'Naga Items', 'Solo EK/RP'],
    elements: ['Ice', 'Energy', 'Physical'],
    protectionPriorities: [
      { element: 'Ice', percent: '40%+', note: 'Magias glaciais das Nagas' },
      { element: 'Energy', percent: '30%+', note: 'Descargas das Makaras' },
      { element: 'Physical', percent: '30%+', note: 'Ataques corpo a corpo rápidos' }
    ],
    charms: [
      { monster: 'Naga Warrior', charm: 'Low Blow / Wound', weakness: 'Physical, Energy (+10%)' },
      { monster: 'Naga Archer', charm: 'Freeze / Zap', weakness: 'Ice, Energy' },
      { monster: 'Makara', charm: 'Enflame / Curse', weakness: 'Fire (+15%), Death' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Energy Imbue + Mana Leech',
      armor: 'Life Leech + Ice Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Ice Protection'
    },
    pullStrategy: 'Lurar os corredores de Marapur até o centro dos templos. Excelente respawn para fazer tasks e farmar creature products caros.',
    roles: {
      ek: 'Fechar box com 8 nagas sem medo de paralisia.',
      ed: 'Suporte com thunderstorm e curas rápidas.',
      ms: 'Energy waves.',
      rp: 'Andar kiteando em círculos largos.'
    },
    youtubeId: '9Z6j_kL1m3A',
    youtubeTitle: 'Nagas Marapur Solo EK 600+ Full Route',
    description: 'Ilha mística de Marapur com monstros anfíbios de alto lucro. Chance de dropar armas e itens da coleção Naga.'
  },
  {
    id: 'ingol-subsolo-4',
    name: 'Ingol - Subsolo 4 (Harpy & Boar)',
    city: 'Ingol',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 450,
    recommendedLevel: 600,
    modes: ['Solo', 'Duo', 'Team 4x'],
    rawXp: '8.5M - 14M/h',
    profit: '1.2M - 2.8M/h',
    danger: 4,
    tier: 'Meta A',
    tags: ['Ingol Quest', 'Earth & Death', 'Ótima XP'],
    elements: ['Earth', 'Death', 'Physical'],
    protectionPriorities: [
      { element: 'Earth', percent: '35%+', note: 'Ácido das harpias' },
      { element: 'Physical', percent: '35%+', note: 'Investida dos homens javali' }
    ],
    charms: [
      { monster: 'Boar Man', charm: 'Freeze / Wound', weakness: 'Ice (+20%), Physical' },
      { monster: 'Harpy', charm: 'Enflame / Zap', weakness: 'Fire (+15%), Energy' },
      { monster: 'Rhino Man', charm: 'Divine Wrath / Low Blow', weakness: 'Holy, Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice Imbue + Mana Leech',
      armor: 'Life Leech + Earth Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Physical Protection'
    },
    pullStrategy: 'Cuidado com os Rhino Men que dão charge e empurram o jogador contra a parede.',
    roles: {
      ek: 'Fixar costas na parede para anular o knockback dos javalis.',
      ed: 'Curar com foco no início de cada pull.',
      ms: 'Great Fireball e debuff.',
      rp: 'Mas San sincronizado.'
    },
    youtubeId: '7b1k8L2_3A9',
    youtubeTitle: 'Ingol -4 Team Hunt & Solo Guide',
    description: 'Subsolo profundo da ilha de Ingol repleto de homens-animais mutantes e alta taxa de gemas.'
  },
  {
    id: 'bulltaurs-lair',
    name: 'Bulltaurs Lair (Padron)',
    city: 'Padron',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Monk'],
    minLevel: 550,
    recommendedLevel: 700,
    modes: ['Solo', 'Duo', 'Team 4x'],
    rawXp: '10M - 16M/h',
    profit: '1.4M - 3.0M/h',
    danger: 4,
    tier: 'Meta S',
    tags: ['Minotauros Novos', 'Fogo & Físico', 'XP Forte'],
    elements: ['Physical', 'Fire', 'Earth'],
    protectionPriorities: [
      { element: 'Physical', percent: '40%+', note: 'Esmagamento dos machados de guerra' },
      { element: 'Fire', percent: '35%+', note: 'Forjas e feitiços flamejantes' }
    ],
    charms: [
      { monster: 'Bulltaur Forgepriest', charm: 'Freeze / Zap', weakness: 'Ice (+20%), Energy' },
      { monster: 'Bulltaur Alchemist', charm: 'Wound / Divine Wrath', weakness: 'Physical, Holy' },
      { monster: 'Bulltaur Brute', charm: 'Enflame / Low Blow', weakness: 'Fire, Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice Imbuement + Mana Leech',
      armor: 'Life Leech + Fire & Physical Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Physical Protection'
    },
    pullStrategy: 'Lurar os ferreiros com calma pois eles aumentam o dano dos brutos ao redor.',
    roles: {
      ek: 'Dano de área contínuo e trocar elmo para Zaoan se a vida descer.',
      ed: 'Avalanche constante.',
      ms: 'Ice waves e avalanche.',
      rp: 'Atirar na diagonal.'
    },
    youtubeId: '2M1b8K9_3A4',
    youtubeTitle: 'Bulltaurs Padron Solo EK 700+ Guide',
    description: 'Mina profunda dos Bulltaurs com monstros de machado pesado e XP comparável a Cobras e Nagas.'
  },
  {
    id: 'bounac-castle',
    name: 'Bounac Castle (Lion Sanctum)',
    city: 'Bounac',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 400,
    recommendedLevel: 550,
    modes: ['Solo', 'Duo'],
    rawXp: '7.5M - 12M/h',
    profit: '1.0M - 2.4M/h',
    danger: 3,
    tier: 'Meta A',
    tags: ['Lion Items', 'Castelo Seguro', 'Solo Paladin'],
    elements: ['Holy', 'Physical'],
    protectionPriorities: [
      { element: 'Holy', percent: '30%+', note: 'Feitiços sagrados dos cavaleiros' },
      { element: 'Physical', percent: '35%+', note: 'Dano físico' }
    ],
    charms: [
      { monster: 'Crypt Warrior', charm: 'Freeze / Curse', weakness: 'Ice, Death (+20%)' },
      { monster: 'Lion Knight', charm: 'Zap / Wound', weakness: 'Energy, Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Death Imbue + Mana Leech',
      armor: 'Life Leech + Holy Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Physical Protection'
    },
    pullStrategy: 'Limpar andar por andar descendo pelas muralhas.',
    roles: {
      ek: 'Rotação padrão de Exori.',
      ed: 'SD nos monstros mais distantes.',
      ms: 'Energy waves.',
      rp: 'Diamond arrows e holy.'
    },
    youtubeId: '1K9_b1L2z8Y',
    youtubeTitle: 'Bounac Castle Full Hunt & Guide',
    description: 'Castelo medieval de Bounac com cavaleiros leoninos e chance de dropar Lion Spelleater, Longbow e Wand.'
  },
  {
    id: 'deathlings-cave',
    name: 'Deathlings Cave',
    city: 'Gray Island',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 350,
    recommendedLevel: 500,
    modes: ['Solo', 'Duo'],
    rawXp: '7.0M - 11.5M/h',
    profit: '800k - 2.0M/h',
    danger: 3,
    tier: 'Meta A',
    tags: ['Gray Island', 'Drown & Ice', 'Best Charms'],
    elements: ['Ice', 'Drown', 'Physical'],
    protectionPriorities: [
      { element: 'Ice', percent: '35%+', note: 'Magias glaciais dos Spellsingers' },
      { element: 'Physical', percent: '30%+', note: 'Mordidas no corpo a corpo' }
    ],
    charms: [
      { monster: 'Deathling Spellsinger', charm: 'Zap / Enflame', weakness: 'Energy (+20%), Fire (+15%)' },
      { monster: 'Deathling Scout', charm: 'Wound / Freeze', weakness: 'Physical, Ice' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Energy Imbue + Mana',
      armor: 'Life Leech + Ice Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Ice Protection'
    },
    pullStrategy: 'Lurar até as salas de coral e fechar box rápido para os cantores não ficarem correndo.',
    roles: {
      ek: 'Exori Gran rápido antes que os Spellsingers fujam na red life.',
      ed: 'Thunderstorm e curas.',
      ms: 'Energy Wave destrói essa hunt.',
      rp: 'Diamond Arrows.'
    },
    youtubeId: '3b1k8L2_4A9',
    youtubeTitle: 'Deathlings Gray Island Solo & Duo Guide',
    description: 'Caverna abissal submersa de Gray Island. Famosa pelos drops de itens de addon e gemas valiosas.'
  },
  {
    id: 'buried-cathedral',
    name: 'Buried Cathedral -3 / -4',
    city: 'Venore / Otherworld',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 300,
    recommendedLevel: 450,
    modes: ['Team 4x', 'Duo'],
    rawXp: '7.5M - 13M/h',
    profit: '800k - 1.8M/h',
    danger: 4,
    tier: 'Meta A',
    tags: ['4x Clássico', 'Venore', 'Arachnophobica', 'Ótima Sinergia'],
    elements: ['Death', 'Ice', 'Physical'],
    protectionPriorities: [
      { element: 'Death', percent: '40%+', note: 'Teias sombrias e beams' },
      { element: 'Ice', percent: '30%+', note: 'Burster Spectres' }
    ],
    charms: [
      { monster: 'Burster Spectre', charm: 'Enflame / Zap', weakness: 'Fire (+25%), Energy (+15%)' },
      { monster: 'Gazer Spectre', charm: 'Freeze / Curse', weakness: 'Ice (+25%), Death (+15%)' },
      { monster: 'Arachnophobica', charm: 'Freeze / Divine Wrath', weakness: 'Ice (+20%), Holy' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Fire Imbuement + Mana Leech',
      armor: 'Life Leech + Death Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Death & Ice'
    },
    pullStrategy: 'Descer nos andares -3 e -4 em formação estrita. EK puxa a sala central para as colunas.',
    roles: {
      ek: 'Manter Exeta Amp Res para os Spectres não darem retarget.',
      ed: 'Avalanche nos Gazers e Wild Growth se juntar muito bicho.',
      ms: 'Great Fireball e debuff.',
      rp: 'Dano principal com Mas San.'
    },
    youtubeId: 'M3K9b1L2z8A',
    youtubeTitle: 'Buried Cathedral -4 Team Hunt 4x Guide',
    description: 'A catedral soterrada definitiva para times de nível 300 a 500 subirem de nível com estabilidade e lucro.'
  },
  {
    id: 'issavi-sewers',
    name: 'Issavi Sewers & Sphinx',
    city: 'Issavi',
    category: 'meta_hunts',
    vocations: ['Mage', 'Paladin', 'Knight', 'Monk'],
    minLevel: 250,
    recommendedLevel: 400,
    modes: ['Solo', 'Duo'],
    rawXp: '6.5M - 12M/h',
    profit: '400k - 1.0M/h',
    danger: 3,
    tier: 'Meta A',
    tags: ['Rush de XP', 'Fácil de Correr', 'SD Solo Mage', 'Sphinx'],
    elements: ['Holy', 'Fire', 'Death'],
    protectionPriorities: [
      { element: 'Holy', percent: '35%+', note: 'Magias das Sphinx' },
      { element: 'Fire', percent: '30%+', note: 'Beams flamejantes' }
    ],
    charms: [
      { monster: 'Sphinx', charm: 'Curse / Enflame', weakness: 'Death (+15%), Fire (+10%)' },
      { monster: 'Crypt Warden', charm: 'Divine Wrath / Freeze', weakness: 'Holy (+20%), Ice (+15%)' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Mana Leech',
      armor: 'Life Leech + Fire Protection',
      helmet: 'Mana Leech + Magic Level',
      shield: 'Holy Protection'
    },
    pullStrategy: 'Mages correm soltando Sudden Death ou Avalanche de tela inteira. Knights luram de 5 em 5 nas esquinas dos esgotos.',
    roles: {
      ek: 'Fechar box com as costas na parede do esgoto.',
      ed: 'SD solo ou Avalanche duo.',
      ms: 'Rush absurdo na SD solo com utamo vita.',
      rp: 'Diamond Arrows e cura rápida.'
    },
    youtubeId: 'p9L2M4k8vY1',
    youtubeTitle: 'Issavi Sewers & Sphinx Solo Mage Rush 10kk/h',
    description: 'O maior rush de XP solo para magos e paladins de nível 250 a 400. Suba levels em velocidade recorde.'
  },
  {
    id: 'werelions-sanctum',
    name: 'Werelions Sanctuary',
    city: 'Darashia',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Monk'],
    minLevel: 220,
    recommendedLevel: 320,
    modes: ['Solo', 'Duo'],
    rawXp: '4.5M - 7.5M/h',
    profit: '600k - 1.4M/h',
    danger: 2,
    tier: 'Midgame A',
    tags: ['Mina de Ouro', 'Solo EK / RP', 'Fácil Acesso', 'Safe'],
    elements: ['Holy', 'Physical', 'Earth'],
    protectionPriorities: [
      { element: 'Holy', percent: '30%+', note: 'Ataques sagrados dos leões' },
      { element: 'Physical', percent: '35%+', note: 'Melee' }
    ],
    charms: [
      { monster: 'Werelion', charm: 'Freeze / Wound', weakness: 'Ice (+15%), Physical' },
      { monster: 'Werelioness', charm: 'Zap / Curse', weakness: 'Energy (+15%), Death (+10%)' },
      { monster: 'White Lion', charm: 'Enflame / Low Blow', weakness: 'Fire (+10%)' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice Imbuement + Mana Leech',
      armor: 'Life Leech + Holy Protection',
      helmet: 'Mana Leech + Skill',
      shield: 'Physical Protection'
    },
    pullStrategy: 'Fazer a volta completa no andar -1 e -2. Lurar salas de 6 a 8 leões sem parar.',
    roles: {
      ek: 'Exori Gran e rotação fluida sem risco de morte.',
      ed: 'Suporte com avalanche.',
      ms: 'Great Fireball se duo.',
      rp: 'Diamond arrows e profit altíssimo.'
    },
    youtubeId: 'L1b2k8L9_4A',
    youtubeTitle: 'Werelions Darashia Solo EK 250+ Route & Profit',
    description: 'O melhor banco de dinheiro do jogo para Knights e Paladins no midgame. Lucro limpo garantido a cada hora.'
  },
  {
    id: 'werehyenas-darashia',
    name: 'Werehyenas & Weretigers',
    city: 'Darashia',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 160,
    recommendedLevel: 240,
    modes: ['Solo'],
    rawXp: '3.5M - 6.0M/h',
    profit: '400k - 900k/h',
    danger: 2,
    tier: 'Midgame A',
    tags: ['Iniciante/Médio', 'Mina de Ouro', 'Seguro', 'Best Charms'],
    elements: ['Death', 'Physical'],
    protectionPriorities: [
      { element: 'Death', percent: '25%+', note: 'Life drain e ataques sombrios' },
      { element: 'Physical', percent: '30%+', note: 'Dano físico de melee' }
    ],
    charms: [
      { monster: 'Werehyena', charm: 'Freeze / Wound', weakness: 'Ice (+20%), Physical' },
      { monster: 'Werehyena Shaman', charm: 'Curse / Zap', weakness: 'Death, Energy' }
    ],
    imbuements: {
      weapon: 'Mana Leech + Life Leech + Ice',
      armor: 'Life Leech',
      helmet: 'Mana Leech',
      shield: 'Physical Protection'
    },
    pullStrategy: 'Correr pelos túneis puxando 6 a 8 hienas por vez. Fechar nos cruzamentos para maximizar o dano em área.',
    roles: {
      ek: 'Exori Gran e Exori Min sem parar.',
      ed: 'Avalanche solo correndo de bota.',
      ms: 'Great Fireball correndo.',
      rp: 'Diamond arrows a partir do level 150.'
    },
    youtubeId: '7b1k8L2_8A9',
    youtubeTitle: 'Werehyenas Darashia Solo Guide 150+',
    description: 'Excelente para transição do level 150 para o 250 com retorno financeiro imediato.'
  },
  {
    id: 'exotic-cave',
    name: 'Exotic Bat & Spider Cave',
    city: 'Issavi (Exotic)',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 120,
    recommendedLevel: 180,
    modes: ['Solo'],
    rawXp: '2.8M - 5.0M/h',
    profit: '500k - 1.1M/h',
    danger: 1,
    tier: 'Iniciante S',
    tags: ['Iniciante', 'Dinheiro Fácil', 'Zero Risco', 'Pirats'],
    elements: ['Earth', 'Physical'],
    protectionPriorities: [
      { element: 'Earth', percent: '25%+', note: 'Veneno fraco das aranhas' },
      { element: 'Physical', percent: '25%+', note: 'Melee dos morcegos' }
    ],
    charms: [
      { monster: 'Exotic Bat', charm: 'Freeze / Wound', weakness: 'Ice (+20%), Physical' },
      { monster: 'Exotic Cave Spider', charm: 'Enflame / Zap', weakness: 'Fire (+20%), Energy' }
    ],
    imbuements: {
      weapon: 'Mana Leech + Life Leech',
      armor: 'Life Leech',
      helmet: 'Mana Leech',
      shield: 'Physical'
    },
    pullStrategy: 'Lurar salas inteiras sem nenhum receio. Os monstros batem muito pouco e dropam centenas de platinum coins.',
    roles: {
      ek: 'Puxar 8 bichos e queimar com magias básicas.',
      ed: 'Avalanche em massa.',
      ms: 'Great Fireball sem parar.',
      rp: 'Burst Arrows ou Diamond Arrows.'
    },
    youtubeId: 'Q1b2k8L9_5A',
    youtubeTitle: 'Exotic Cave Issavi Solo 100+ Best Profit Guide',
    description: 'A caverna mais relaxante e lucrativa do level 100 ao 200. Ideal para juntar dinheiro para comprar itens de imbuement e sets caros.'
  },
  {
    id: 'oramond-catacombs',
    name: 'Oramond Catacombs & Dark Trails',
    city: 'Rathleton (Oramond)',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 320,
    recommendedLevel: 450,
    modes: ['Team 4x', 'Duo', 'Solo'],
    rawXp: '7.0M - 12.5M/h',
    profit: '600k - 1.5M/h',
    danger: 4,
    tier: 'Meta A',
    tags: ['Dark Torturer', 'Grimeleech', 'Hellflayer', 'Clássico 4x'],
    elements: ['Death', 'Fire', 'Physical'],
    protectionPriorities: [
      { element: 'Death', percent: '40%+', note: 'Beams dos Dark Torturers e Grimeleeches' },
      { element: 'Fire', percent: '35%+', note: 'Ondas dos Hellflayers' }
    ],
    charms: [
      { monster: 'Dark Torturer', charm: 'Freeze / Divine Wrath', weakness: 'Ice (+20%), Holy (+10%)' },
      { monster: 'Grimeleech', charm: 'Enflame / Zap', weakness: 'Fire (+20%), Energy' },
      { monster: 'Hellflayer', charm: 'Freeze / Wound', weakness: 'Ice (+25%), Physical' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice Imbuement + Mana Leech',
      armor: 'Life Leech + Death Protection',
      helmet: 'Mana Leech + Skill Boost',
      shield: 'Death Protection + Physical'
    },
    pullStrategy: 'Lurar nas salas redondas das catacumbas. Cuidado com o retarget dos Hellflayers.',
    roles: {
      ek: 'Manter os Hellflayers travados de costas para a party.',
      ed: 'Avalanche contínua e Sio no EK.',
      ms: 'Energy wave e debuff.',
      rp: 'Mas San e Diamond Arrows.'
    },
    youtubeId: 'V9b1k8L2_8A',
    youtubeTitle: 'Oramond Catacombs 4x Team Hunt Guide',
    description: 'O clássico mais amado da história do Tibia para times de nível 300+. Ótima XP, frags rápidos e adrenalina pura.'
  },
  {
    id: 'roshamuul-prison',
    name: 'Roshamuul Prison -1 / -3',
    city: 'Roshamuul',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 300,
    recommendedLevel: 420,
    modes: ['Team 4x', 'Duo'],
    rawXp: '6.5M - 11M/h',
    profit: '700k - 1.6M/h',
    danger: 4,
    tier: 'Meta A',
    tags: ['Prisão Roshamuul', 'Juggernauts', 'Demon Drops', '4x Clássico'],
    elements: ['Physical', 'Death', 'Energy'],
    protectionPriorities: [
      { element: 'Physical', percent: '40%+', note: 'Ataques brutais dos Juggernauts' },
      { element: 'Death', percent: '30%+', note: 'Plaguesmiths e Demons' }
    ],
    charms: [
      { monster: 'Juggernaut', charm: 'Freeze / Zap', weakness: 'Ice (+20%), Energy' },
      { monster: 'Plaguesmith', charm: 'Enflame / Divine Wrath', weakness: 'Fire, Holy' },
      { monster: 'Demon', charm: 'Freeze / Holy', weakness: 'Ice (+20%), Holy (+10%)' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice Imbuement + Mana Leech',
      armor: 'Life Leech + Physical Protection (Zaoan/Prt)',
      helmet: 'Mana Leech + Skill',
      shield: 'Physical Protection'
    },
    pullStrategy: 'Limpar cela por cela e lurar no corredor central. Mages ficam 3 SQMs atrás da porta da cela.',
    roles: {
      ek: 'Fechar a porta da cela como funil para limitar contato a 3 monstros.',
      ed: 'Curar e soltar avalanche.',
      ms: 'Ice wave e Great Fireball.',
      rp: 'Atirar na diagonal.'
    },
    youtubeId: 'W1b2k8L9_6A',
    youtubeTitle: 'Roshamuul Prison -1 & -3 Team Hunt 4x Guide',
    description: 'Prisão lendária de Roshamuul com Juggernauts, Demons e Plaguesmiths. Ótimo farm de cluster of solaces.'
  },
  {
    id: 'nightmare-isles',
    name: 'Nightmare Isles',
    city: 'Drefia Island',
    category: 'meta_hunts',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 260,
    recommendedLevel: 380,
    modes: ['Team 4x', 'Duo'],
    rawXp: '5.5M - 9.5M/h',
    profit: '500k - 1.2M/h',
    danger: 3,
    tier: 'Midgame A',
    tags: ['Drefia', 'Silencer & Choking Fear', 'Party Clássica'],
    elements: ['Fire', 'Death', 'Physical'],
    protectionPriorities: [
      { element: 'Fire', percent: '35%+', note: 'Fogo dos Nightmares' },
      { element: 'Death', percent: '30%+', note: 'Gritos dos Choking Fears' }
    ],
    charms: [
      { monster: 'Choking Fear', charm: 'Freeze / Zap', weakness: 'Ice (+20%), Energy' },
      { monster: 'Silencer', charm: 'Wound / Divine Wrath', weakness: 'Physical, Holy' }
    ],
    imbuements: {
      weapon: 'Critical Tier 3 + Ice + Mana',
      armor: 'Life Leech + Fire Protection',
      helmet: 'Mana Leech',
      shield: 'Fire & Physical'
    },
    pullStrategy: 'Avançar em círculo na ilha central. O EK deve dar challenge nos Silencers para não silenciarem o druid.',
    roles: {
      ek: 'Controlar o aggro dos Silencers.',
      ed: 'Avalanche constante.',
      ms: 'Energy waves.',
      rp: 'Mas San e arrows.'
    },
    youtubeId: 'X9b1k8L2_2A',
    youtubeTitle: 'Nightmare Isles Team Hunt Guide 250+',
    description: 'Ilha dos pesadelos com respawn rápido e excelente treino para formações de party hunt.'
  },

  // =========================================================================
  // --- EXPANSÃO GLOBAL DE HUNTS: BASTIONS, MARAPUR, WARZONES, MID & EARLY ---
  // =========================================================================
  {
    "id": "secret-library-energy",
    "name": "Secret Library: Energy Section",
    "city": "Asura Island (Library)",
    "category": "library",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 550,
    "recommendedLevel": 750,
    "modes": [
      "Team 4x"
    ],
    "rawXp": "20M - 34M/h",
    "profit": "1.2M - 2.8M/h",
    "danger": 5,
    "tier": "Endgame SS",
    "tags": [
      "Energy Section",
      "Strikers",
      "Alta Densidade",
      "Library Meta"
    ],
    "elements": [
      "Energy",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Energy",
        "percent": "45%+",
        "note": "Ondas elétricas massivas dos Strikers"
      },
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Beams escuros dos Brainstealers"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Golpes pesados nos boxes de 8 criaturas"
      }
    ],
    "charms": [
      {
        "monster": "Energetic Book",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Brainstealer",
        "charm": "Divine Wrath / Curse",
        "weakness": "Holy (+15%), Death (+5%)"
      },
      {
        "monster": "Rage Squid",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+5%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice Conversion",
      "armor": "Life Leech + Energy Protection (Cloud Fabric)",
      "helmet": "Mana Leech + Skill/Magic Boost",
      "shield": "Energy Protection + Physical"
    },
    "pullStrategy": "Avanço coordenado corredor por corredor. Knight foca em manter os Strikers virados para longe dos mages. Druid usa Terra Wave e Ice Waves.",
    "roles": {
      "ek": "Trapar nas esquinas da biblioteca para evitar ser cercado por mais de 8 monstros.",
      "ed": "Mass Healing constante; nunca deixar o Knight descer de 70% de vida.",
      "ms": "Manter Sap Strength e Great Fireball/Energy Waves.",
      "rp": "Diamond Arrows contínuas no centro do mob e Mas San nos turnos livres."
    },
    "youtubeId": "vC69n1T0i_U",
    "youtubeTitle": "Secret Library Energy Section 4x Hunt Guide 30kk/h",
    "description": "Quadrante elétrico da lendária Secret Library. Monstros com altíssima fraqueza a gelo e densidade bruta de experiência."
  },
  {
    "id": "secret-library-death",
    "name": "Secret Library: Death Section",
    "city": "Asura Island (Library)",
    "category": "library",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 550,
    "recommendedLevel": 800,
    "modes": [
      "Team 4x"
    ],
    "rawXp": "21M - 35M/h",
    "profit": "1.4M - 3.0M/h",
    "danger": 5,
    "tier": "Endgame SS",
    "tags": [
      "Death Section",
      "Biting Books",
      "Beams Letais",
      "S-Tier XP"
    ],
    "elements": [
      "Death",
      "Physical",
      "Life Drain"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "45%+",
        "note": "Beams negros que atravessam telas"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Biting Books mordem muito forte"
      },
      {
        "element": "Life Drain",
        "percent": "20%+",
        "note": "Mitiga o vampirismo dos monstros"
      }
    ],
    "charms": [
      {
        "monster": "Biting Book",
        "charm": "Divine Wrath / Freeze",
        "weakness": "Holy (+25%), Ice (+15%)"
      },
      {
        "monster": "Squawker",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+10%)"
      },
      {
        "monster": "Ink Blob",
        "charm": "Curse / Wound",
        "weakness": "Death (+15%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Holy/Ice",
      "armor": "Life Leech + Death Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Death Protection + Turtle Shield"
    },
    "pullStrategy": "Lurar até as salas octogonais. Nunca ficar na reta dos Biting Books pois o combo de death beam pode solar um mage em 1 turno.",
    "roles": {
      "ek": "Fechar o box contra estantes fixas e manter Exeta Amp Res ativo.",
      "ed": "Cura prioritária no EK e Mas Frigo contínuo.",
      "ms": "Expose Elements em Holy/Ice e Great Fireball constante.",
      "rp": "Off-tanking nas bordas e Mas San sem parar."
    },
    "youtubeId": "oF_0d2_qQc4",
    "youtubeTitle": "Secret Library Death Section Full Hunt 4x",
    "description": "Quadrante sombrio da biblioteca com alto risco e maior rendimento de XP pura da Secret Library."
  },
  {
    "id": "mitmah-seer-temple",
    "name": "Mitmah Seer Temple & Catacombs",
    "city": "Marapur",
    "category": "bastions",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 450,
    "recommendedLevel": 650,
    "modes": [
      "Team 4x",
      "Duo",
      "Solo RP"
    ],
    "rawXp": "15M - 26M/h",
    "profit": "1.5M - 3.2M/h",
    "danger": 4,
    "tier": "Meta S+",
    "tags": [
      "Marapur",
      "Mitmah",
      "Lucro Alto",
      "Naga Expansion"
    ],
    "elements": [
      "Earth",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "40%+",
        "note": "Veneno e pedradas mágicas"
      },
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Maldições dos Mitmah Seers"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Melee dos batedores Mitmah"
      }
    ],
    "charms": [
      {
        "monster": "Mitmah Seer",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+20%), Fire (+15%)"
      },
      {
        "monster": "Mitmah Scout",
        "charm": "Zap / Wound",
        "weakness": "Energy (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Fire/Ice",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech + Magic/Skill",
      "shield": "Earth Protection + Physical"
    },
    "pullStrategy": "Puxadas em formato de oito entre os salões de pedra esculpida. Os monstros correm com pouca vida, então fechar os cantos acelera a rotação.",
    "roles": {
      "ek": "Box nos cantos e Challenge para evitar que os Seers fujam.",
      "ed": "Avalanche constante e Mass Healing sincronizado.",
      "ms": "Great Fireball e Energy Wave nos corredores.",
      "rp": "Diamond Arrows + Divine Caldera."
    },
    "youtubeId": "L_0oQ1aK2mE",
    "youtubeTitle": "Mitmah Seers Marapur Hunt Guide 20kk/h",
    "description": "Templo ancestral subterrâneo de Marapur habitado por guerreiros felinos e videntes místicos. Excelente fonte de gemas e ouro."
  },
  {
    "id": "iks-ancient-ruins",
    "name": "Iks Ancient Ruins & Deep Tunnels",
    "city": "Marapur",
    "category": "bastions",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 400,
    "recommendedLevel": 600,
    "modes": [
      "Solo RP",
      "Solo EK",
      "Duo"
    ],
    "rawXp": "12M - 22M/h",
    "profit": "1.0M - 2.5M/h",
    "danger": 3,
    "tier": "Meta S",
    "tags": [
      "Iks Ruins",
      "Solo RP Meta",
      "Marapur",
      "Ouro e Gemas"
    ],
    "elements": [
      "Holy",
      "Physical",
      "Fire"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Lanças pesadas dos Iks Ahputu"
      },
      {
        "element": "Holy",
        "percent": "25%+",
        "note": "Flechas sagradas e raios solares"
      },
      {
        "element": "Fire",
        "percent": "20%+",
        "note": "Explosões térmicas tribais"
      }
    ],
    "charms": [
      {
        "monster": "Iks Ahputu",
        "charm": "Freeze / Curse",
        "weakness": "Ice (+20%), Death (+15%)"
      },
      {
        "monster": "Iks Yupan",
        "charm": "Wound / Enflame",
        "weakness": "Physical, Fire (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Life Leech + Ice",
      "armor": "Life Leech + Physical Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection + Holy"
    },
    "pullStrategy": "Puxadas médias de 6 a 8 monstros. Ótimo respawn para correr atirando (kite) se for Paladin ou fechar box se for Knight.",
    "roles": {
      "ek": "Box móvel, andando de pack em pack com Exori Gran.",
      "ed": "Curar o EK e focar em Frigo Hur.",
      "ms": "Rotação de Avalanche e Death Wave.",
      "rp": "Correr em círculos com Diamond Arrows ou tankar de prismatic ring."
    },
    "youtubeId": "B8xK2mQ1aL4",
    "youtubeTitle": "Iks Ruins Marapur Solo RP & EK Guide",
    "description": "Ruínas misteriosas da tribo Iks na encosta sul de Marapur. Ótima XP solo e respawn tranquilo para farmar sem stress."
  },
  {
    "id": "weretigers-murky-geyser",
    "name": "Murky Geyser & Podzilla Weretigers",
    "city": "Marapur",
    "category": "bastions",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 350,
    "recommendedLevel": 500,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Duo"
    ],
    "rawXp": "10M - 18M/h",
    "profit": "900k - 2.2M/h",
    "danger": 3,
    "tier": "Meta S",
    "tags": [
      "Weretigers",
      "Werecrocodiles",
      "Lucro Rápido",
      "Marapur Geysers"
    ],
    "elements": [
      "Earth",
      "Ice",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Dano de mordida e garras corpo a corpo"
      },
      {
        "element": "Earth",
        "percent": "30%+",
        "note": "Jatos de lama tóxica"
      },
      {
        "element": "Ice",
        "percent": "20%+",
        "note": "Água gélida dos gêiseres"
      }
    ],
    "charms": [
      {
        "monster": "Weretiger",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+15%)"
      },
      {
        "monster": "Werecrocodile",
        "charm": "Zap / Freeze",
        "weakness": "Energy (+25%), Ice (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Energy/Fire",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Limpar os gêiseres de forma circular. Cuidado para não lurar mais de 2 Werecrocodiles grandes de uma vez em níveis abaixo de 400.",
    "roles": {
      "ek": "Box de 8 encostado nos gêiseres com rotação de fogo/energia.",
      "ed": "Ice Wave e cura contínua.",
      "ms": "Energy Wave e Great Fireball.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "Z8mR2kX1oP4",
    "youtubeTitle": "Weretigers Marapur Hunt 15kk/h Profit Guide",
    "description": "Gêiseres pantanosos habitados por Tigres e Crocodilos licantropos. Drop abundante de carnes nobres, joias e peles valiosas."
  },
  {
    "id": "ferumbras-plagirath",
    "name": "Ferumbras Ascendant: Grounds of Plagirath",
    "city": "Kharos / Darashia",
    "category": "ferumbras",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 450,
    "recommendedLevel": 650,
    "modes": [
      "Team 4x",
      "Duo"
    ],
    "rawXp": "16M - 28M/h",
    "profit": "1.2M - 2.8M/h",
    "danger": 4,
    "tier": "Meta S+",
    "tags": [
      "Ferumbras Seal",
      "Plagirath",
      "Blightwalkers",
      "High Density"
    ],
    "elements": [
      "Earth",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "40%+",
        "note": "Poison storm e gosma dos Plaguesmiths"
      },
      {
        "element": "Death",
        "percent": "35%+",
        "note": "Maldição profunda dos Blightwalkers"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Golpes de garras brutais"
      }
    ],
    "charms": [
      {
        "monster": "Plaguesmith",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+20%), Fire (+15%)"
      },
      {
        "monster": "Blightwalker",
        "charm": "Divine Wrath / Freeze",
        "weakness": "Holy (+25%), Ice (+15%)"
      },
      {
        "monster": "Defiler",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice/Fire",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Earth Protection + Death Shield"
    },
    "pullStrategy": "Lurar os corredores até as salas circulares. Knight usa Exori Gran e Exori Mas para segurar aggro dos Blightwalkers.",
    "roles": {
      "ek": "Box fixo em esquinas com Might Ring se puxar mais de 10.",
      "ed": "Mass Healing contínuo e Avalanche.",
      "ms": "Great Fireball e Sap Strength.",
      "rp": "Mas San e Diamond Arrows."
    },
    "youtubeId": "M9kX1mQ2oP7",
    "youtubeTitle": "Ferumbras Ascendant Plagirath Seal Team Hunt",
    "description": "Selo pestilento da torre de Ferumbras. Monstros mortos-vivos com alta experiência e loot recheado de itens raros de veneno."
  },
  {
    "id": "ferumbras-mazoran",
    "name": "Ferumbras Ascendant: Grounds of Mazoran",
    "city": "Kharos / Darashia",
    "category": "ferumbras",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 500,
    "recommendedLevel": 700,
    "modes": [
      "Team 4x",
      "Duo"
    ],
    "rawXp": "18M - 30M/h",
    "profit": "1.5M - 3.5M/h",
    "danger": 5,
    "tier": "Meta S+",
    "tags": [
      "Mazoran Seal",
      "Hellflayers",
      "Dano de Fogo Extremo",
      "Demon Meta"
    ],
    "elements": [
      "Fire",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "45%+",
        "note": "Hellfire e bombas vulcânicas de Mazoran"
      },
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Beams dos Hellflayers"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Patadas dos Grimeleechs"
      }
    ],
    "charms": [
      {
        "monster": "Hellflayer",
        "charm": "Freeze / Divine Wrath",
        "weakness": "Ice (+25%), Holy (+15%)"
      },
      {
        "monster": "Grimeleech",
        "charm": "Zap / Wound",
        "weakness": "Energy (+20%), Physical"
      },
      {
        "monster": "Vexclaw",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice Conversion",
      "armor": "Life Leech + Fire Protection (Dragon Hide)",
      "helmet": "Mana Leech + Skill",
      "shield": "Fire Protection (Sun Medal / Fire Shield)"
    },
    "pullStrategy": "Puxadas rápidas de 6 a 8 demônios. Os Hellflayers conjuram beams de fogo e death de longa distância, portanto posicionar o EK no fundo da sala.",
    "roles": {
      "ek": "Box firme, sempre de costas para o time para direcionar os beams longe dos mages.",
      "ed": "Cura focada no EK e Avalanche ininterrupto.",
      "ms": "Energy Wave, Cryomancy e UH no Paladin se necessário.",
      "rp": "Off-tanking nas criaturas extras com Prismatic Ring."
    },
    "youtubeId": "C7xR2mK1aP9",
    "youtubeTitle": "Mazoran Seal Ferumbras Team Hunt 25kk/h",
    "description": "Selo ígneo infernal de Ferumbras habitado por Hellflayers, Grimeleechs e Vexclaws. Um dos maiores testes de resistência a fogo do jogo."
  },
  {
    "id": "roshamuul-west",
    "name": "Roshamuul West (Silencer Plateau & Ruins)",
    "city": "Roshamuul",
    "category": "meta_hunts",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 400,
    "recommendedLevel": 550,
    "modes": [
      "Solo RP",
      "Solo EK",
      "Duo"
    ],
    "rawXp": "14M - 24M/h",
    "profit": "1.2M - 3.0M/h",
    "danger": 4,
    "tier": "Meta S",
    "tags": [
      "Roshamuul",
      "Silencers",
      "Solo RP Dream",
      "Frazzlemaws"
    ],
    "elements": [
      "Physical",
      "Death",
      "Earth"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "40%+",
        "note": "Patadas múltiplas dos Frazzlemaws"
      },
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Uivos de morte e gritos dos Silencers"
      },
      {
        "element": "Earth",
        "percent": "20%+",
        "note": "Veneno de área"
      }
    ],
    "charms": [
      {
        "monster": "Silencer",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Frazzlemaw",
        "charm": "Zap / Divine Wrath",
        "weakness": "Energy (+20%), Holy (+10%)"
      },
      {
        "monster": "Choking Fear",
        "charm": "Divine Wrath / Curse",
        "weakness": "Holy (+20%), Death (+5%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice/Energy",
      "armor": "Life Leech + Death Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Lurar as ruínas abertas em círculos gigantescos. Paladins e Knights de nível 500+ conseguem puxar 15+ criaturas em movimento contínuo.",
    "roles": {
      "ek": "Fechar box com Exori Gran e rotação defensiva usando Might Rings nos mobs grandes.",
      "ed": "Cura rápida e Avalanche contínuo.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Kiting dinâmico com Diamond Arrows e Mas San."
    },
    "youtubeId": "D8xK1mQ2oP4",
    "youtubeTitle": "Roshamuul West Solo RP Guide 20kk/h",
    "description": "Planalto oeste de Roshamuul repleto de Frazzlemaws e Silencers. Um dos respawns solo mais lendários de Tibia para Paladins e Knights."
  },
  {
    "id": "roshamuul-bones",
    "name": "Roshamuul Bones (Valley of Sight)",
    "city": "Roshamuul",
    "category": "meta_hunts",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 450,
    "recommendedLevel": 600,
    "modes": [
      "Duo (EK+ED)",
      "Solo RP",
      "Team 4x"
    ],
    "rawXp": "15M - 25M/h",
    "profit": "1.5M - 3.5M/h",
    "danger": 5,
    "tier": "Meta S+",
    "tags": [
      "Bones",
      "Guzzlemaws",
      "Lucro Massivo",
      "Combo Letal"
    ],
    "elements": [
      "Physical",
      "Death",
      "Life Drain"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "45%+",
        "note": "Dano físico extremo de Guzzlemaws em fúria"
      },
      {
        "element": "Death",
        "percent": "35%+",
        "note": "Beams sonoros dos Shock Heads"
      },
      {
        "element": "Life Drain",
        "percent": "20%+",
        "note": "Vampirismo"
      }
    ],
    "charms": [
      {
        "monster": "Guzzlemaw",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      },
      {
        "monster": "Shock Head",
        "charm": "Divine Wrath / Curse",
        "weakness": "Holy (+20%), Death (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Life Leech + Ice",
      "armor": "Life Leech + Death Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection + Death"
    },
    "pullStrategy": "Cuidado extremo com o corredor de ossos. Puxar no máximo 2 Guzzlemaws ao mesmo tempo se for Duo, pois o combo conjunto de boca e rabo é mortal.",
    "roles": {
      "ek": "Foco total em manter HP no topo e usar Might Ring/SSA nos momentos de fúria.",
      "ed": "Sio instantâneo e Avalanche.",
      "ms": "Sap Strength e Great Fireball.",
      "rp": "Diamond Arrows e cura secundária com UH no EK."
    },
    "youtubeId": "H9xR2mK1aP6",
    "youtubeTitle": "Roshamuul Bones Duo Hunt Guide (EK + ED)",
    "description": "Vale das carcaças de Roshamuul habitado pelas temíveis Guzzlemaws. Alto risco com um dos maiores retornos financeiros por hora do servidor."
  },
  {
    "id": "warzone-4-diremaw",
    "name": "Warzone 4: The Vesperoth & Diremaw Caves",
    "city": "Gnomegate / Deep Caves",
    "category": "farm_profit",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 250,
    "recommendedLevel": 350,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Duo"
    ],
    "rawXp": "7.5M - 13M/h",
    "profit": "800k - 2.0M/h",
    "danger": 3,
    "tier": "Lucro Alto",
    "tags": [
      "Warzone 4",
      "Diremaws",
      "Suspicious Devices",
      "Solo Profit"
    ],
    "elements": [
      "Earth",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "40%+",
        "note": "Veneno espirrado pelas larvas e vermes"
      },
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Mordidas dos vermes gigantes"
      }
    ],
    "charms": [
      {
        "monster": "Diremaw",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+15%)"
      },
      {
        "monster": "Deepworm",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Fire",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Lurar os vermes em grupos de 6 a 8. Eles morrem muito rápido para dano de fogo e deixam incontáveis Suspicious Devices e itens de valor.",
    "roles": {
      "ek": "Box de 8 com Exori Gran e rotação de Fire.",
      "ed": "Terra Wave e Avalanche.",
      "ms": "Great Fireball e Flam Hur.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "P7kX2mQ1aL9",
    "youtubeTitle": "Warzone 4 Diremaw Solo EK 1kk Profit/h Guide",
    "description": "Caverna subterrânea dos gnomos com altíssimo drop de Suspicious Devices, carnes nobres e equipamentos vendáveis."
  },
  {
    "id": "pirats-wreck-grotto",
    "name": "Pirats Wreck Grotto & Bilge Cave",
    "city": "Rascacoon",
    "category": "farm_profit",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 180,
    "recommendedLevel": 280,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "6.5M - 12M/h",
    "profit": "700k - 1.8M/h",
    "danger": 2,
    "tier": "Rei do Lucro",
    "tags": [
      "Pirats",
      "Rascacoon",
      "Lucro Fácil",
      "Bosses Diários"
    ],
    "elements": [
      "Physical",
      "Death",
      "Fire"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Tiros de canhão e sabre dos ratos piratas"
      },
      {
        "element": "Fire",
        "percent": "20%+",
        "note": "Bombas e pólvora"
      }
    ],
    "charms": [
      {
        "monster": "Pirat Cutthroat",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      },
      {
        "monster": "Pirat Scoundrel",
        "charm": "Enflame / Wound",
        "weakness": "Fire (+15%), Physical"
      },
      {
        "monster": "Pirat Bombardier",
        "charm": "Curse / Zap",
        "weakness": "Death (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice",
      "armor": "Life Leech + Physical",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Andar limpando as salas e conveses dos navios naufragados. Puxar de 8 a 10 ratos. Rotação tranquila e segura com lucro em cada bicho.",
    "roles": {
      "ek": "Box contínuo, andando sempre para frente.",
      "ed": "Avalanche constante.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows + Divine Caldera."
    },
    "youtubeId": "T_6yT1mN5Y4",
    "youtubeTitle": "Pirats Rascacoon Solo Profit Guide 1.5kk/h",
    "description": "Esconderijo dos Pirats na ilha de Rascacoon. O maior ratio de lucro por risco do jogo para o mid game."
  },
  {
    "id": "glooth-bandits",
    "name": "Glooth Bandits & Brigands",
    "city": "Oramond (Factory)",
    "category": "farm_profit",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 130,
    "recommendedLevel": 220,
    "modes": [
      "Solo Mage",
      "Solo RP",
      "Solo EK"
    ],
    "rawXp": "4.5M - 8.5M/h",
    "profit": "500k - 1.2M/h",
    "danger": 2,
    "tier": "Solo Profit Clássico",
    "tags": [
      "Glooth Bandits",
      "300 Pontos Oramond",
      "Ouro em Chão",
      "Seguro"
    ],
    "elements": [
      "Physical",
      "Poison"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Golpes e adagas dos bandidos"
      },
      {
        "element": "Earth",
        "percent": "25%+",
        "note": "Frascos de ácido e lodo"
      }
    ],
    "charms": [
      {
        "monster": "Glooth Bandit",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+20%), Fire (+15%)"
      },
      {
        "monster": "Glooth Brigand",
        "charm": "Zap / Wound",
        "weakness": "Energy (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech",
      "shield": "Physical"
    },
    "pullStrategy": "Puxadas em formato de corredor na fábrica sul ou leste. Monstros dropam pilhas gigantescas de Platinum Coins diretas no chão.",
    "roles": {
      "ek": "Box de 8 e Exori Gran contínuo.",
      "ed": "Avalanche correndo ou fechando box com terra gear.",
      "ms": "Great Fireball limpando telas inteiras.",
      "rp": "Diamond Arrows ou Burst Arrows."
    },
    "youtubeId": "Y7Z1-sE4EGo",
    "youtubeTitle": "Glooth Bandits 300 Pts Oramond Solo Profit Guide",
    "description": "A lendária fábrica de Glooth de Oramond. Exige 300 pontos de voto em Rathleton e garante lucro sustentado para bancar qualquer supply."
  },
  {
    "id": "banuta-deeper",
    "name": "Banuta Deeper Floors (-4 / -5)",
    "city": "Port Hope",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 200,
    "recommendedLevel": 320,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage",
      "Duo"
    ],
    "rawXp": "6.0M - 11M/h",
    "profit": "400k - 1.2M/h",
    "danger": 3,
    "tier": "Meta Mid Game",
    "tags": [
      "Banuta",
      "Medusas",
      "Serpent Spawns",
      "Tasks da Paw & Fur"
    ],
    "elements": [
      "Earth",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "40%+",
        "note": "Veneno pesado de Serpent Spawn e Hydra"
      },
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Life drain e maldições de Medusa"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Golpes físicos dos Behemoths"
      }
    ],
    "charms": [
      {
        "monster": "Medusa",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+20%), Fire (+15%)"
      },
      {
        "monster": "Serpent Spawn",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+10%)"
      },
      {
        "monster": "Hydra",
        "charm": "Zap / Energy",
        "weakness": "Energy (+20%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Earth Protection"
    },
    "pullStrategy": "Lurar os grandes salões circulares de Banuta -4. Utilizar garlick necklace contra waves de life drain e ter cura de paralyze engatilhada.",
    "roles": {
      "ek": "Box de 8 nos salões com Exori Min/Gran/Mas.",
      "ed": "Avalanche contínuo e cura de paralyze.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows e Divine Caldera em movimento."
    },
    "youtubeId": "K8xR1mK2aP9",
    "youtubeTitle": "Banuta Deeper -4 Solo EK & RP Guide",
    "description": "Cidade perdida dos macacos e das serpentes mitológicas. Um dos melhores locais para completar as tarefas da Paw and Fur Society."
  },
  {
    "id": "asura-palace-lower",
    "name": "Asura Palace (Lower Floors & Balcony)",
    "city": "Tiquanda / Port Hope",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 180,
    "recommendedLevel": 260,
    "modes": [
      "Solo EK",
      "Solo Mage",
      "Duo"
    ],
    "rawXp": "7.0M - 13M/h",
    "profit": "600k - 1.5M/h",
    "danger": 4,
    "tier": "Meta Mid Game",
    "tags": [
      "Asura Palace",
      "Pre-Mirror",
      "XP Brutal",
      "Mage PG"
    ],
    "elements": [
      "Fire",
      "Death",
      "Life Drain"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "35%+",
        "note": "Dano de morte concentrado das Dawnfires"
      },
      {
        "element": "Fire",
        "percent": "35%+",
        "note": "Campos de fogo e waves"
      },
      {
        "element": "Life Drain",
        "percent": "25%+",
        "note": "Mana drain constante das Midnight Asuras"
      }
    ],
    "charms": [
      {
        "monster": "Midnight Asura",
        "charm": "Divine Wrath / Freeze",
        "weakness": "Holy (+20%), Ice (+15%)"
      },
      {
        "monster": "Dawnfire Asura",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+10%)"
      },
      {
        "monster": "Hellhound",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+25%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice",
      "armor": "Life Leech + Fire Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Fire Shield / Death"
    },
    "pullStrategy": "Lurar os andares térreo e superiores até a varanda. Cuidado com o mana drain: sempre manter poções de mana no dedo rápido.",
    "roles": {
      "ek": "Box de 8 nos corredores com Exori Gran e rotação de Ice.",
      "ed": "Avalanche constante e Mass Healing.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows com prismatic ring."
    },
    "youtubeId": "G9kX2mQ1oP4",
    "youtubeTitle": "Asura Palace Lower Floors Solo Hunt Guide",
    "description": "Palácio das Asuras na selva de Tiquanda. O degrau preparatório para quem busca ingressar no disputado Asura Mirror."
  },
  {
    "id": "draken-walls",
    "name": "Draken Walls (Razachai)",
    "city": "Razachai (Zao)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 180,
    "recommendedLevel": 280,
    "modes": [
      "Solo EK",
      "Duo"
    ],
    "rawXp": "5.5M - 10M/h",
    "profit": "500k - 1.3M/h",
    "danger": 3,
    "tier": "Clássico Solo EK",
    "tags": [
      "Draken Walls",
      "Solo EK King",
      "Zao",
      "WOTPO Tasks"
    ],
    "elements": [
      "Fire",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "40%+",
        "note": "Bolas de fogo dos Spellweavers"
      },
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Machadadas dos Warmasters"
      }
    ],
    "charms": [
      {
        "monster": "Draken Warmaster",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+10%)"
      },
      {
        "monster": "Draken Spellweaver",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice",
      "armor": "Life Leech + Fire Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Fire Protection"
    },
    "pullStrategy": "Subir as muralhas de Razachai puxando grupos de 8 a 10 Drakens. O Knight deve fechar box encostado nas ameias e focar nos Spellweavers.",
    "roles": {
      "ek": "Rei absoluto da hunt. Box de 8 com Exori Gran + Exori Min.",
      "ed": "Suporte de Avalanche e Sio em duo.",
      "ms": "Energy Wave e Great Fireball.",
      "rp": "Diamond Arrows nas esquinas."
    },
    "youtubeId": "B7xR1mK2aP8",
    "youtubeTitle": "Draken Walls Solo EK Profit & XP Guide",
    "description": "Muralhas imperiais da dinastia Draken em Zao. O lar histórico dos Knights do nível 200 ao 300."
  },
  {
    "id": "summer-court",
    "name": "Summer Court (Feyrist Dream Elves)",
    "city": "Feyrist (Dream Courts)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 250,
    "recommendedLevel": 400,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage",
      "Duo"
    ],
    "rawXp": "9.0M - 16M/h",
    "profit": "800k - 2.0M/h",
    "danger": 4,
    "tier": "Meta S",
    "tags": [
      "Summer Court",
      "Elfos de Fogo",
      "XP Rápida",
      "Dream Courts"
    ],
    "elements": [
      "Fire",
      "Holy",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "45%+",
        "note": "Explosões de calor dos elfos de verão"
      },
      {
        "element": "Holy",
        "percent": "25%+",
        "note": "Flechas solares"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Garras dos Thanatursus"
      }
    ],
    "charms": [
      {
        "monster": "Thanatursus",
        "charm": "Freeze / Curse",
        "weakness": "Ice (+25%), Death (+15%)"
      },
      {
        "monster": "Crazed Summer Rearguard",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      },
      {
        "monster": "Crazed Summer Vanguard",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice Conversion",
      "armor": "Life Leech + Fire Protection (Dragon Hide)",
      "helmet": "Mana Leech + Skill",
      "shield": "Fire Protection (Sun Mirror / Shield)"
    },
    "pullStrategy": "Lurar os pátios e torres do castelo de verão. Monstros são extremamente frágeis a dano de gelo. Usar armas com conversão de gelo para derreter os mobs.",
    "roles": {
      "ek": "Box de 8 nos pátios com armas de Ice.",
      "ed": "Ice Wave massivo e cura no EK.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows com flechas de gelo."
    },
    "youtubeId": "K2kXjG6bH9E",
    "youtubeTitle": "Summer Court Solo EK & RP Guide 15kk/h",
    "description": "Palácio de fogo e sol da corte de Feyrist. Excelente densidade de XP e lucro alto em itens de elfos e pedras preciosas."
  },
  {
    "id": "winter-court",
    "name": "Winter Court (Feyrist Dream Elves)",
    "city": "Feyrist (Dream Courts)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 250,
    "recommendedLevel": 400,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage",
      "Duo"
    ],
    "rawXp": "9.0M - 16M/h",
    "profit": "800k - 2.0M/h",
    "danger": 4,
    "tier": "Meta S",
    "tags": [
      "Winter Court",
      "Elfos de Gelo",
      "Fire Weapons",
      "Dream Courts"
    ],
    "elements": [
      "Ice",
      "Physical",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Ice",
        "percent": "45%+",
        "note": "Nevascas e estilhaços congelantes"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Patadas dos Harbingers"
      },
      {
        "element": "Death",
        "percent": "20%+",
        "note": "Dano sombrio de gelo eterno"
      }
    ],
    "charms": [
      {
        "monster": "Soul-Broken Harbinger",
        "charm": "Enflame / Divine Wrath",
        "weakness": "Fire (+25%), Holy (+15%)"
      },
      {
        "monster": "Crazed Winter Rearguard",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+10%)"
      },
      {
        "monster": "Crazed Winter Vanguard",
        "charm": "Enflame / Wound",
        "weakness": "Fire (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Fire Conversion",
      "armor": "Life Leech + Ice Protection (Quara Scale)",
      "helmet": "Mana Leech + Skill",
      "shield": "Ice Protection"
    },
    "pullStrategy": "Lurar os andares do castelo de inverno. O time deve usar proteção máxima de gelo e armas com conversão de fogo para máxima eficiência.",
    "roles": {
      "ek": "Box de 8 no castelo com armas de Fire.",
      "ed": "Terra Wave e cura do Knight.",
      "ms": "Flam Hur e Great Fireball.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "qE8rT6yU_1E",
    "youtubeTitle": "Winter Court Solo EK & RP Guide 15kk/h",
    "description": "Palácio de gelo eterno da corte dos pesadelos. Monstros derretem para fogo com loot rico em itens de imbuement e joias."
  },
  {
    "id": "carnivors-lair",
    "name": "Carnivors Lair (Wood & Rock Sanctum)",
    "city": "Port Hope",
    "category": "farm_profit",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 220,
    "recommendedLevel": 320,
    "modes": [
      "Solo EK",
      "Solo RP"
    ],
    "rawXp": "5.0M - 9.5M/h",
    "profit": "800k - 2.2M/h",
    "danger": 3,
    "tier": "Rei do Lucro Solo",
    "tags": [
      "Carnivors",
      "Lucro Supremo",
      "Solo EK Meta",
      "Ouro Puro"
    ],
    "elements": [
      "Physical",
      "Earth",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "40%+",
        "note": "Porrada bruta de madeira e pedra"
      },
      {
        "element": "Earth",
        "percent": "30%+",
        "note": "Espinhas e veneno vegetal"
      },
      {
        "element": "Death",
        "percent": "20%+",
        "note": "Seiva amaldiçoada"
      }
    ],
    "charms": [
      {
        "monster": "Menacing Carnivor",
        "charm": "Enflame / Freeze",
        "weakness": "Fire (+20%), Ice (+15%)"
      },
      {
        "monster": "Lumbering Carnivor",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+25%), Energy (+10%)"
      },
      {
        "monster": "Spiky Carnivor",
        "charm": "Enflame / Wound",
        "weakness": "Fire (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Fire",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Lurar os andares -1 e -2. Monstros são muito lentos mas batem pesado no corpo a corpo. Rotação de fogo e boxes constantes encostados em troncos.",
    "roles": {
      "ek": "Box contínuo de 8 plantas. Uma das maiores fontes de lucro líquido por hora do jogo.",
      "ed": "Avalanche e cura de suporte.",
      "ms": "Flam Hur e Great Fireball.",
      "rp": "Diamond Arrows com Fire Wall."
    },
    "youtubeId": "7nJzR1mK8aE",
    "youtubeTitle": "Carnivors Lair Solo EK 1.8kk Profit Guide",
    "description": "Caverna subterrânea das plantas carnívoras de Port Hope. Famosa mundialmente por render sacolas de gemas e pedras preciosas sem risco de morte."
  },
  {
    "id": "oramond-west-quaras",
    "name": "Oramond West (Quaras Active Raid)",
    "city": "Rathleton (Oramond)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 150,
    "recommendedLevel": 250,
    "modes": [
      "Solo Mage",
      "Solo RP"
    ],
    "rawXp": "7.0M - 14M/h",
    "profit": "-200k - 400k/h (XP Rush)",
    "danger": 4,
    "tier": "XP Rush PG",
    "tags": [
      "Oramond West",
      "Quara Raid",
      "Thunderstorm",
      "Mage PG"
    ],
    "elements": [
      "Energy",
      "Water",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Energy",
        "percent": "30%+",
        "note": "Descargas de água e eletricidade"
      },
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Devourers e Quaras correndo soltos"
      }
    ],
    "charms": [
      {
        "monster": "Devourer",
        "charm": "Zap / Wound",
        "weakness": "Energy (+25%), Physical"
      },
      {
        "monster": "Glooth Anemone",
        "charm": "Enflame / Freeze",
        "weakness": "Fire (+20%), Ice (+10%)"
      },
      {
        "monster": "Quara Constrictor",
        "charm": "Zap / Freeze",
        "weakness": "Energy (+25%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech",
      "armor": "Life Leech + Physical/Energy",
      "helmet": "Mana Leech + Magic Boost",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Correr a planície inteira lurando 20 a 30 bichos ao mesmo tempo enquanto taca Thunderstorm Runes sem parar. Gill Set completo e Garlic Necklace.",
    "roles": {
      "ek": "Menos recomendado para box fechado devido ao paralyze massivo.",
      "ed": "Rei do PG com Thunderstorm e cura de paralyze.",
      "ms": "Energy Wave e Thunderstorm em movimento contínuo.",
      "rp": "Diamond Arrows e Mas San correndo velozmente."
    },
    "youtubeId": "W9jR6xL0P2A",
    "youtubeTitle": "Oramond West Quaras Raid Mage PG Guide",
    "description": "Planície aberta de Rathleton durante a invasão de Quaras. Um dos picos de experiência bruta por hora mais insanos do jogo para Mages 150-250."
  },
  {
    "id": "issavi-surface",
    "name": "Issavi Kilmaresh Surface (Sphinxes & Crypt Wardens)",
    "city": "Kilmaresh (Issavi)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 150,
    "recommendedLevel": 300,
    "modes": [
      "Solo RP",
      "Solo Mage (SD)",
      "Duo"
    ],
    "rawXp": "6.5M - 13M/h",
    "profit": "200k - 800k/h",
    "danger": 4,
    "tier": "Meta PG",
    "tags": [
      "Issavi Surface",
      "Sphinx SD Rush",
      "Solo RP",
      "Kilmaresh"
    ],
    "elements": [
      "Holy",
      "Fire",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "40%+",
        "note": "Patadas esmagadoras das Sphinxes"
      },
      {
        "element": "Holy",
        "percent": "30%+",
        "note": "Beams sagrados e orbes dos Crypt Wardens"
      },
      {
        "element": "Fire",
        "percent": "20%+",
        "note": "Ondas solares"
      }
    ],
    "charms": [
      {
        "monster": "Sphinx",
        "charm": "Freeze / Curse",
        "weakness": "Ice (+25%), Death (+15%)"
      },
      {
        "monster": "Crypt Warden",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      },
      {
        "monster": "Feral Sphinx",
        "charm": "Curse / Enflame",
        "weakness": "Death (+20%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice",
      "armor": "Life Leech + Physical/Holy",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Para mages: SD Rush correndo em linha reta com mana shield ativo (Utamo Vita). Para Paladins: Diamond Arrows puxando em círculos nos obeliscos.",
    "roles": {
      "ek": "Box cauteloso a partir do level 300+ com Might Ring.",
      "ed": "Ice Wave e SDs cirúrgicos nos Crypt Wardens.",
      "ms": "Great Fireball e Death Waves.",
      "rp": "Kiting perfeito em volta dos templos de Issavi."
    },
    "youtubeId": "H9kX4mQ2y7A",
    "youtubeTitle": "Issavi Surface Solo SD Rush & RP Guide",
    "description": "A superfície monumental de Kilmaresh habitada por esfinges sagradas e guardiões de tumbas. O atalho mais veloz para rushar mages."
  },
  {
    "id": "edron-hero-fortress",
    "name": "Edron Hero Fortress / Old Fortress",
    "city": "Edron",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 70,
    "recommendedLevel": 130,
    "modes": [
      "Duo (EK+ED)",
      "Team 4x",
      "Solo EK",
      "Solo RP"
    ],
    "rawXp": "2.5M - 5.5M/h",
    "profit": "100k - 450k/h",
    "danger": 2,
    "tier": "Iniciante SSS",
    "tags": [
      "Hero Cave",
      "Edron Fortress",
      "Primeira Team Hunt",
      "Duo Clássico"
    ],
    "elements": [
      "Physical",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Golpes de espadas dos Renegade Knights"
      },
      {
        "element": "Death",
        "percent": "25%+",
        "note": "Maldições dos Vile Grandmasters"
      }
    ],
    "charms": [
      {
        "monster": "Hero",
        "charm": "Zap / Freeze",
        "weakness": "Energy (+20%), Ice (+10%)"
      },
      {
        "monster": "Vicious Squire",
        "charm": "Enflame / Wound",
        "weakness": "Fire (+15%), Physical"
      },
      {
        "monster": "Renegade Knight",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Life Leech + Critical",
      "armor": "Life Leech + Physical",
      "helmet": "Mana Leech",
      "shield": "Physical"
    },
    "pullStrategy": "Andares -2 e -3 da fortaleza. O Knight puxa os corredores com Exeta Res e fecha o box nas esquinas para o Druid e Sorcerer castarem Avalanche/GFB.",
    "roles": {
      "ek": "Box de 8 e Exori contínuo.",
      "ed": "Avalanche constante e Sio no EK.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Burst Arrows ou Diamond Arrows nos mobs."
    },
    "youtubeId": "G8c4RzX0p9g",
    "youtubeTitle": "Edron Hero Fortress Team Hunt Guide Level 80-150",
    "description": "A fortaleza medieval dos Heróis em Edron. O melhor e mais celebrado local de aprendizado para formações de party hunt do Tibia."
  },
  {
    "id": "barkless-elves",
    "name": "Barkless Elves (Cult of Ab'Dendriel)",
    "city": "Ab'Dendriel",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 150,
    "recommendedLevel": 220,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "6.0M - 12M/h",
    "profit": "-150k/h (Puro Rush)",
    "danger": 4,
    "tier": "Suicídio PG",
    "tags": [
      "Barkless",
      "XP Insana",
      "Zero Loot",
      "PG Rush"
    ],
    "elements": [
      "Physical",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "40%+",
        "note": "Ataques violentos dos fanáticos"
      },
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Maldições e explosões suicidas"
      }
    ],
    "charms": [
      {
        "monster": "Barkless Fanatic",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      },
      {
        "monster": "Barkless Devotee",
        "charm": "Zap / Enflame",
        "weakness": "Energy (+20%), Fire (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Life Leech + Mana Leech",
      "armor": "Life Leech + Physical Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical"
    },
    "pullStrategy": "Puxar corredores inteiros. Os monstros têm pouquíssima vida e dão XP absurda, mas explodem ao morrer. Ter Might Ring pronto para emergências.",
    "roles": {
      "ek": "Box móvel, andando sem parar com Exori Gran.",
      "ed": "Avalanche e cura instantânea.",
      "ms": "Great Fireball limpando o pack em 2 turnos.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "Zc8yKq_Pq3A",
    "youtubeTitle": "Barkless Elves Solo EK & RP Pure XP Guide",
    "description": "Subsolo sombrio de Ab'Dendriel com os elfos fanáticos sem casca. A maior taxa de experiência solo para o level 150-220 com zero preocupação de pegar loot."
  },
  {
    "id": "carlin-cults",
    "name": "Carlin Cults / Seacrest Grounds",
    "city": "Carlin (Sewers)",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 80,
    "recommendedLevel": 140,
    "modes": [
      "Solo EK",
      "Solo Mage",
      "Duo"
    ],
    "rawXp": "3.0M - 6.5M/h",
    "profit": "150k - 500k/h",
    "danger": 3,
    "tier": "Starter Meta",
    "tags": [
      "Carlin Cults",
      "Esgoto",
      "High Density",
      "Bestiary Rápido"
    ],
    "elements": [
      "Death",
      "Ice",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "35%+",
        "note": "Dano sombrio dos Cult Believers"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Garras dos Man-Bats"
      }
    ],
    "charms": [
      {
        "monster": "Cult Believer",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+15%)"
      },
      {
        "monster": "Cult Enforcer",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      },
      {
        "monster": "Vicious Man-Bat",
        "charm": "Enflame / Divine Wrath",
        "weakness": "Fire (+25%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Life Leech + Fire",
      "armor": "Life Leech + Death Protection",
      "helmet": "Mana Leech",
      "shield": "Death Protection"
    },
    "pullStrategy": "Descer o alçapão dos esgotos de Carlin e limpar os salões em sentido horário. Drop alto de cultish masks e joias.",
    "roles": {
      "ek": "Box de 8 com Exori e rotação de Fire.",
      "ed": "Avalanche constante.",
      "ms": "Great Fireball e Flam Hur.",
      "rp": "Burst Arrows ou Diamond Arrows."
    },
    "youtubeId": "N9xR1mK2aP3",
    "youtubeTitle": "Carlin Cults Solo EK & Mage Hunt Guide",
    "description": "Catacumbas secretas sob o cemitério de Carlin. Densidade gigantesca de monstros com fraqueza extrema a fogo."
  },
  {
    "id": "krailos-spider-caves",
    "name": "Krailos Wailing Widows & Brimstone Bugs",
    "city": "Krailos",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 60,
    "recommendedLevel": 110,
    "modes": [
      "Solo EK",
      "Solo RP"
    ],
    "rawXp": "1.8M - 3.8M/h",
    "profit": "100k - 350k/h",
    "danger": 2,
    "tier": "Iniciante Confortável",
    "tags": [
      "Krailos",
      "Wailing Widows",
      "Brimstone Fangs",
      "Lucro Starter"
    ],
    "elements": [
      "Earth",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "35%+",
        "note": "Veneno das aranhas e escorpiões"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Patadas dos besouros"
      }
    ],
    "charms": [
      {
        "monster": "Wailing Widow",
        "charm": "Enflame / Freeze",
        "weakness": "Fire (+20%), Ice (+10%)"
      },
      {
        "monster": "Brimstone Bug",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+25%), Energy (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Life Leech + Fire",
      "armor": "Earth Protection",
      "helmet": "Mana Leech",
      "shield": "Physical"
    },
    "pullStrategy": "Puxadas de 4 a 6 monstros nos corredores da montanha de Krailos. Os monstros morrem rápido com dano de fogo e dropam Brimstone Fangs valiosos.",
    "roles": {
      "ek": "Box nos cantos com Exori e Fire weapon.",
      "ed": "Avalanche e cura.",
      "ms": "Great Fireball.",
      "rp": "Single target ou Burst Arrows."
    },
    "youtubeId": "C8kX2mQ1oP6",
    "youtubeTitle": "Krailos Spiders Solo EK Level 70-100 Guide",
    "description": "Cavernas montanhosas de Krailos. Respawn calmo, seguro e muito lucrativo para quem está subindo seus primeiros 100 níveis."
  },
  {
    "id": "mother-of-scarabs",
    "name": "Mother of Scarabs Lair (Roaring Lions)",
    "city": "Ankrahmun",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 50,
    "recommendedLevel": 90,
    "modes": [
      "Solo Mage (GFB)",
      "Solo EK"
    ],
    "rawXp": "1.5M - 3.2M/h",
    "profit": "80k - 250k/h",
    "danger": 3,
    "tier": "Mage PG Starter",
    "tags": [
      "Ancient Scarabs",
      "Roaring Lions",
      "GFB Rush",
      "Ankrahmun"
    ],
    "elements": [
      "Earth",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "40%+",
        "note": "Paralyze e veneno das Ancient Scarabs"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Rugidos e patadas dos Roaring Lions"
      }
    ],
    "charms": [
      {
        "monster": "Ancient Scarab",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+25%), Energy (+15%)"
      },
      {
        "monster": "Roaring Lion",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Fire",
      "armor": "Earth Protection",
      "helmet": "Mana Leech",
      "shield": "Physical"
    },
    "pullStrategy": "Correr em círculos nas salas dos leões e escaravelhos soltando Great Fireball. Ter hotkey de Exana Pox e Exura para quebrar paralisias.",
    "roles": {
      "ek": "Box encostado com Exori e cura rápida.",
      "ed": "GFB correndo e cura contínua.",
      "ms": "Flam Hur e Great Fireball.",
      "rp": "Correr com Burst Arrows."
    },
    "youtubeId": "E7xR1mK2aP9",
    "youtubeTitle": "Mother of Scarabs Lair Mage PG Guide 50-80",
    "description": "Tumba ancestral sob as dunas de Ankrahmun. O clássico rito de passagem para mages uparem do level 50 ao 90 com Great Fireballs."
  },
  {
    "id": "porthope-giant-spiders",
    "name": "Port Hope Giant Spiders (The Old Widow Lair)",
    "city": "Port Hope",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 50,
    "recommendedLevel": 90,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "1.2M - 2.5M/h",
    "profit": "100k - 300k/h",
    "danger": 2,
    "tier": "Iniciante Ouro",
    "tags": [
      "Giant Spiders",
      "Spider Silk",
      "The Old Widow",
      "Paw and Fur"
    ],
    "elements": [
      "Poison",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "30%+",
        "note": "Veneno das GS"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Ataques corpo a corpo"
      }
    ],
    "charms": [
      {
        "monster": "Giant Spider",
        "charm": "Enflame / Freeze",
        "weakness": "Fire (+25%), Ice (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire / Critical",
      "armor": "Physical / Earth",
      "helmet": "Mana Leech",
      "shield": "Physical"
    },
    "pullStrategy": "Lurar 2 a 3 Giant Spiders por vez. Utilizar armas de fogo ou Fireballs para derreter as aranhas. Coletar Spider Silks valiosos para imbuements.",
    "roles": {
      "ek": "Box frontal com Exori.",
      "ed": "Ice / Fire e cura.",
      "ms": "Great Fireball e Flam Hur.",
      "rp": "Kiting com flechas e bolts."
    },
    "youtubeId": "M8xR1mK2aP4",
    "youtubeTitle": "Port Hope Giant Spiders Hunt Guide Level 60+",
    "description": "Ninho das aranhas gigantes na floresta de Tiquanda. O local ideal para juntar Spider Silks necessários para o imbuement de velocidade."
  },
  {
    "id": "oramond-minos",
    "name": "Oramond Minotaur Entrance",
    "city": "Rathleton (Oramond)",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 50,
    "recommendedLevel": 100,
    "modes": [
      "Solo Mage (SD)",
      "Solo RP"
    ],
    "rawXp": "2.0M - 4.5M/h",
    "profit": "-50k - 150k/h (SD PG)",
    "danger": 3,
    "tier": "SD Rush Clássico",
    "tags": [
      "Oramond Minos",
      "SD Rush",
      "Roots de Oramond",
      "Level 50 a 100"
    ],
    "elements": [
      "Physical",
      "Fire"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Pedradas e machados dos minotauros"
      },
      {
        "element": "Fire",
        "percent": "25%+",
        "note": "Chamas dos Worm Priests"
      }
    ],
    "charms": [
      {
        "monster": "Minotaur Hunter",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      },
      {
        "monster": "Mooh'Tah Warrior",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+10%)"
      },
      {
        "monster": "Worm Priest",
        "charm": "Curse / Freeze",
        "weakness": "Death (+15%), Ice (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Critical",
      "armor": "Physical Protection",
      "helmet": "Mana Leech",
      "shield": "Physical"
    },
    "pullStrategy": "Mages correm na entrada atirando Sudden Death (SD) um por um nos minotauros e coletando as raízes (roots) para acumular pontos de voto em Rathleton.",
    "roles": {
      "ek": "Não recomendado antes do 120.",
      "ed": "SD correndo em linha reta.",
      "ms": "SD rush veloz.",
      "rp": "Kiting com Drill Bolts."
    },
    "youtubeId": "K7kX2mQ1oP9",
    "youtubeTitle": "Oramond Minotaurs SD Rush Guide Level 50-100",
    "description": "A porta de entrada de Rathleton. O ponto de encontro de todos os mages recém-saídos do level 50 que querem explodir a barra de XP com Sudden Death Runes."
  },
  {
    "id": "edron-werecreatures",
    "name": "Edron Grimvale Werecreatures",
    "city": "Edron (Grimvale)",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 80,
    "recommendedLevel": 140,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage",
      "Duo"
    ],
    "rawXp": "2.5M - 5.0M/h",
    "profit": "150k - 400k/h",
    "danger": 2,
    "tier": "Starter Meta",
    "tags": [
      "Grimvale",
      "Werewolves",
      "Werefoxes",
      "Silver Amulet"
    ],
    "elements": [
      "Physical",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Garras e mordidas"
      },
      {
        "element": "Death",
        "percent": "25%+",
        "note": "Uivos de maldição"
      }
    ],
    "charms": [
      {
        "monster": "Werewolf",
        "charm": "Enflame / Wound",
        "weakness": "Fire (+20%), Physical"
      },
      {
        "monster": "Werebadger",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      },
      {
        "monster": "Werefox",
        "charm": "Ice / Divine Wrath",
        "weakness": "Ice (+25%), Holy (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Life Leech + Fire",
      "armor": "Life Leech + Physical",
      "helmet": "Mana Leech",
      "shield": "Physical"
    },
    "pullStrategy": "Andares -1 a -3 da ilha de Grimvale. Usar moonlight crystals para quebrar maldições de lua cheia. Puxadas compactas de 6 a 8 lobisomens.",
    "roles": {
      "ek": "Box firme nos corredores.",
      "ed": "Avalanche ou Great Fireball.",
      "ms": "GFB e Energy Wave.",
      "rp": "Burst Arrows ou Diamond Arrows."
    },
    "youtubeId": "R9xR1mK2aP4",
    "youtubeTitle": "Grimvale Werecreatures Solo Hunt Guide Level 90+",
    "description": "A ilha amaldiçoada de Grimvale ao norte de Edron. Peles de lobisomem, garras e itens de imbuement garantem lucro líquido e experiência fluida."
  },
  {
    "id": "darashia-dragon-lair",
    "name": "Darashia Dragon Lair",
    "city": "Darashia",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 50,
    "recommendedLevel": 85,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "1.2M - 2.8M/h",
    "profit": "80k - 250k/h",
    "danger": 2,
    "tier": "Iniciante Clássico",
    "tags": [
      "Dragons",
      "Dragon Lords",
      "Dragon Leather",
      "Nostalgia"
    ],
    "elements": [
      "Fire",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "35%+",
        "note": "Waves de fogo frontais"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Patadas de dragão"
      }
    ],
    "charms": [
      {
        "monster": "Dragon",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+10%)"
      },
      {
        "monster": "Dragon Lord",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+25%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Critical + Ice",
      "armor": "Fire Protection (Dragon Hide)",
      "helmet": "Mana Leech",
      "shield": "Fire Protection (Dragon Slayer / Shield)"
    },
    "pullStrategy": "Lurar 2 a 3 dragões por vez. Nunca ficar de frente para a boca do dragão para evitar as waves de fogo e dano de fogo contínuo.",
    "roles": {
      "ek": "Posicionar o dragão na diagonal com Exori e rotação de Ice.",
      "ed": "Frigo Hur e Ice Strike constante.",
      "ms": "Energy Wave e Avalanche.",
      "rp": "Kiting com crossbow e flechas de gelo."
    },
    "youtubeId": "D8xR1mK2aP7",
    "youtubeTitle": "Darashia Dragon Lair Solo Level 50-80 Guide",
    "description": "A mais emblemática caverna de dragões de Tibia nas dunas de Darashia. Excelente para farmar Dragon Leathers e Royal Helmets."
  },
  {
    "id": "yalahar-cults",
    "name": "Yalahar Magician Quarter Cults",
    "city": "Yalahar",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 45,
    "recommendedLevel": 75,
    "modes": [
      "Solo EK",
      "Solo Mage",
      "Solo RP"
    ],
    "rawXp": "1.0M - 2.2M/h",
    "profit": "120k - 350k/h",
    "danger": 2,
    "tier": "Farm de Imbue",
    "tags": [
      "Rope Belts",
      "Yalahar",
      "Cults",
      "Lucro Rápido"
    ],
    "elements": [
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Life drain e maldições dos sacerdotes"
      },
      {
        "element": "Physical",
        "percent": "20%+",
        "note": "Golpes dos novatos"
      }
    ],
    "charms": [
      {
        "monster": "Novice of the Cult",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+15%)"
      },
      {
        "monster": "Acolyte of the Cult",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech",
      "armor": "Death Protection",
      "helmet": "Mana Leech",
      "shield": "Physical"
    },
    "pullStrategy": "Andar pelas casas e subsolos do quarteirão dos magos de Yalahar. Puxar as salas inteiras com Exori ou GFB e recolher todos os Rope Belts.",
    "roles": {
      "ek": "Box contínuo com Exori.",
      "ed": "Avalanche ou GFB.",
      "ms": "Great Fireball.",
      "rp": "Burst Arrows."
    },
    "youtubeId": "Y9kX2mQ1oP2",
    "youtubeTitle": "Yalahar Cults Rope Belts Farm Guide Level 50+",
    "description": "Quarteirão dos Magos em Yalahar. Famoso mundialmente pelo drop massivo de Cultish Rope Belts, essenciais para imbuement de Mana Leech."
  },
  {
    "id": "coryms-port-hope",
    "name": "Corym Black Market & Tunnels",
    "city": "Port Hope",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 30,
    "recommendedLevel": 65,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "800k - 1.8M/h",
    "profit": "50k - 180k/h",
    "danger": 1,
    "tier": "Iniciante Starter",
    "tags": [
      "Coryms",
      "Level 30 a 60",
      "Port Hope",
      "Leather Whips"
    ],
    "elements": [
      "Physical",
      "Earth"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Clube e adagas dos ratos Corym"
      },
      {
        "element": "Earth",
        "percent": "20%+",
        "note": "Frascos de veneno"
      }
    ],
    "charms": [
      {
        "monster": "Corym Charlatan",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      },
      {
        "monster": "Corym Skirmisher",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+10%)"
      },
      {
        "monster": "Corym Vanguard",
        "charm": "Zap / Wound",
        "weakness": "Energy (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech",
      "armor": "Physical",
      "helmet": "Mana Leech",
      "shield": "Physical"
    },
    "pullStrategy": "Túneis sob o pântano de Port Hope. Limpar sala por sala com Stealth Ring se o nível for inferior a 40 para evitar dano dos Vanguards.",
    "roles": {
      "ek": "Box de 4 a 6 e Exori.",
      "ed": "GFB e cura.",
      "ms": "GFB rush.",
      "rp": "Single target com flechas de fogo."
    },
    "youtubeId": "B8xR1mK2aP5",
    "youtubeTitle": "Port Hope Coryms Level 30-60 Hunt Guide",
    "description": "Túneis de contrabando dos Coryms. O melhor início de jornada para personagens recém-saídos de Dawnport/Rookgaard."
  },
  {
    "id": "drefia-wyrms",
    "name": "Drefia Wyrm & Elder Wyrm Lair",
    "city": "Drefia (Darashia)",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 70,
    "recommendedLevel": 120,
    "modes": [
      "Solo RP",
      "Solo Mage",
      "Solo EK"
    ],
    "rawXp": "1.8M - 3.5M/h",
    "profit": "100k - 300k/h",
    "danger": 2,
    "tier": "Iniciante Meta",
    "tags": [
      "Drefia",
      "Wyrms",
      "Elder Wyrms",
      "Composite Hornbow"
    ],
    "elements": [
      "Energy",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Energy",
        "percent": "35%+",
        "note": "Beams elétricos e raios das Wyrms"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Mordidas no melee"
      }
    ],
    "charms": [
      {
        "monster": "Wyrm",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Elder Wyrm",
        "charm": "Freeze / Curse",
        "weakness": "Ice (+25%), Death (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Critical + Ice",
      "armor": "Energy Protection (Cloud Fabric)",
      "helmet": "Mana Leech",
      "shield": "Energy Shield / Physical"
    },
    "pullStrategy": "Subsolo de Drefia. Puxar de 2 a 4 Wyrms em círculos. Muito cuidado para não ficar alinhado com o beam de energia que dá dano duplo.",
    "roles": {
      "ek": "Diagonal com Exori e rotação de Ice.",
      "ed": "Ice Strike e Frigo Hur.",
      "ms": "Death Wave e Avalanche.",
      "rp": "Drill Bolts ou Diamond Arrows mantendo distância."
    },
    "youtubeId": "W7kX2mQ1oP8",
    "youtubeTitle": "Drefia Wyrms Solo Hunt Guide Level 80-120",
    "description": "Ninho dos dragões relâmpago nas profundezas de Drefia. Ótimo drop de Wand of Draconia, Focus Capes e escamas de energia."
  },
  {
    "id": "warzone-5-gnomegate",
    "name": "Warzone 5: The Suspicious Mound & Cavern",
    "city": "Gnomegate / Deep Caverns",
    "category": "farm_profit",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 300,
    "recommendedLevel": 450,
    "modes": [
      "Duo",
      "Team 4x",
      "Solo EK"
    ],
    "rawXp": "9.0M - 15M/h",
    "profit": "1.0M - 2.5M/h",
    "danger": 3,
    "tier": "Lucro Alto",
    "tags": [
      "Warzone 5",
      "Cave Devourers",
      "Suspicious Devices",
      "Gnome Tasks"
    ],
    "elements": [
      "Energy",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Energy",
        "percent": "35%+",
        "note": "Pulsos de choque dos Devourers"
      },
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Patadas dos Tyrants"
      }
    ],
    "charms": [
      {
        "monster": "Cave Devourer",
        "charm": "Enflame / Freeze",
        "weakness": "Fire (+20%), Ice (+15%)"
      },
      {
        "monster": "Tunnel Tyrant",
        "charm": "Zap / Wound",
        "weakness": "Energy (+20%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Fire",
      "armor": "Life Leech + Energy Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Lurar os corredores de cristais em blocos de 8 criaturas. Monstros dropam grandes quantidades de ouro líquido, gemas e suspicious devices.",
    "roles": {
      "ek": "Box central com Exori Gran e rotação de Fire.",
      "ed": "Avalanche contínuo e cura.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "E8xR1mK2aP4",
    "youtubeTitle": "Warzone 5 Gnomegate Team & Solo Hunt Guide",
    "description": "Caverna cristalina dos gnomos com altíssima taxa de lucro líquido por hora para jogadores do nível 300 ao 450."
  },
  {
    "id": "warzone-6-deep",
    "name": "Warzone 6: The Magma & Deep Crystals",
    "city": "Gnomegate / Deep Caverns",
    "category": "farm_profit",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 300,
    "recommendedLevel": 450,
    "modes": [
      "Duo",
      "Team 4x",
      "Solo EK"
    ],
    "rawXp": "9.5M - 16M/h",
    "profit": "1.2M - 2.6M/h",
    "danger": 4,
    "tier": "Lucro Alto",
    "tags": [
      "Warzone 6",
      "Lava Golems",
      "Magma Crawlers",
      "Dispositivos"
    ],
    "elements": [
      "Fire",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "45%+",
        "note": "Chuva de magma e chamas constantes"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Porrada pesada de pedra fundida"
      }
    ],
    "charms": [
      {
        "monster": "Lava Golem",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+15%)"
      },
      {
        "monster": "Magma Crawler",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+25%), Physical"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice Conversion",
      "armor": "Life Leech + Fire Protection (Dragon Hide)",
      "helmet": "Mana Leech + Skill",
      "shield": "Fire Protection"
    },
    "pullStrategy": "Lurar pelas pontes de rocha vulcânica. Ter armaduras de gelo e armas com conversão de gelo para estourar os golens de lava rapidamente.",
    "roles": {
      "ek": "Box com armas de Ice e Might Ring nos mobs duplos.",
      "ed": "Ice Wave massivo e cura no EK.",
      "ms": "Energy Wave e Great Fireball.",
      "rp": "Diamond Arrows com flechas de gelo."
    },
    "youtubeId": "J9kX2mQ1oP6",
    "youtubeTitle": "Warzone 6 Deep Magma Caves Hunt Guide",
    "description": "Vulcão subterrâneo da Warzone 6. Monstros com fraqueza absurda a gelo e drops consistentes de equipamentos caros e itens de forja."
  },
  {
    "id": "medusa-tower",
    "name": "Medusa Tower (Port Hope Deep Sanctum)",
    "city": "Port Hope",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 180,
    "recommendedLevel": 270,
    "modes": [
      "Solo RP",
      "Solo Mage",
      "Solo EK"
    ],
    "rawXp": "5.5M - 10M/h",
    "profit": "400k - 1.1M/h",
    "danger": 3,
    "tier": "Meta Solo RP",
    "tags": [
      "Medusa Tower",
      "Solo RP Dream",
      "Omniscience",
      "Paw and Fur"
    ],
    "elements": [
      "Earth",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "40%+",
        "note": "Paralisias e venenos de Medusa"
      },
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Life drain e maldições"
      }
    ],
    "charms": [
      {
        "monster": "Medusa",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+20%), Fire (+15%)"
      },
      {
        "monster": "Serpent Spawn",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+10%)"
      },
      {
        "monster": "Clay Golem",
        "charm": "Wound / Enflame",
        "weakness": "Physical, Fire (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Earth Protection"
    },
    "pullStrategy": "Subir os andares da torre limpando cada pavimento em círculos. Espaço estreito perfeito para Paladins e Mages traparem com Energy Wall ou Fire Wall.",
    "roles": {
      "ek": "Box de 8 encostado na escada com Exori.",
      "ed": "Avalanche correndo e cura rápida de paralyze.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Rei da torre: Diamond Arrows e Mas San subindo andar por andar."
    },
    "youtubeId": "L9kX2mQ1aP6",
    "youtubeTitle": "Medusa Tower Solo RP Level 200+ Guide",
    "description": "Torre secreta encravada na floresta de Tiquanda. O paraíso solo dos Paladins que precisam finalizar o bestiário de Medusas e Serpent Spawns."
  },
  {
    "id": "charnel-mines",
    "name": "Charnel Mines (Lost Dwarves of Kazordoon)",
    "city": "Kazordoon",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 180,
    "recommendedLevel": 280,
    "modes": [
      "Solo EK",
      "Solo RP"
    ],
    "rawXp": "5.0M - 9.5M/h",
    "profit": "450k - 1.2M/h",
    "danger": 3,
    "tier": "Solo EK Lucro",
    "tags": [
      "Lost Dwarves",
      "Charnel Mines",
      "Iron Ore",
      "Solo EK"
    ],
    "elements": [
      "Physical",
      "Fire"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "40%+",
        "note": "Marretadas dos Lost Bashers"
      },
      {
        "element": "Fire",
        "percent": "25%+",
        "note": "Magia dos Enslaved Dwarves"
      }
    ],
    "charms": [
      {
        "monster": "Enslaved Dwarf",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      },
      {
        "monster": "Lost Basher",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      },
      {
        "monster": "Lost Husher",
        "charm": "Enflame / Curse",
        "weakness": "Fire (+20%), Death (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice",
      "armor": "Life Leech + Physical",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical"
    },
    "pullStrategy": "Lurar os corredores das minas anãs. Ter Garlic Necklace contra o life drain dos Hushers e usar armas de gelo para liquidar os Bashers.",
    "roles": {
      "ek": "Box de 8 firme nos cruzamentos de trilho de trem.",
      "ed": "Avalanche constante.",
      "ms": "Great Fireball.",
      "rp": "Diamond Arrows nas esquinas."
    },
    "youtubeId": "F8xR1mK2aP6",
    "youtubeTitle": "Charnel Mines Lost Dwarves Solo EK Guide",
    "description": "Minas perdidas de Kazordoon dominadas por anões escravizados e enlouquecidos. Excelente taxa de gold coins, joias e ferro puro."
  },
  {
    "id": "feyrist-nightmares",
    "name": "Feyrist Nightmare Cave (Krazanur)",
    "city": "Feyrist (Krazanur)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 130,
    "recommendedLevel": 220,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "4.5M - 8.5M/h",
    "profit": "350k - 900k/h",
    "danger": 2,
    "tier": "Mid Game Seguro",
    "tags": [
      "Nightmares",
      "Feyrist",
      "Demonic Essences",
      "Solo Seguro"
    ],
    "elements": [
      "Fire",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "35%+",
        "note": "Dano sombrio dos Nightmares"
      },
      {
        "element": "Fire",
        "percent": "25%+",
        "note": "Chamas dos Boars infernais"
      }
    ],
    "charms": [
      {
        "monster": "Nightmare",
        "charm": "Divine Wrath / Freeze",
        "weakness": "Holy (+20%), Ice (+15%)"
      },
      {
        "monster": "Nightmare Scion",
        "charm": "Divine Wrath / Zap",
        "weakness": "Holy (+20%), Energy (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Critical + Ice",
      "armor": "Life Leech + Death Protection",
      "helmet": "Mana Leech",
      "shield": "Death Shield"
    },
    "pullStrategy": "Descer o poço de Feyrist e limpar a caverna em círculo contínuo. Puxadas confortáveis de 6 a 8 pesadelos sem perigo de combo fatal.",
    "roles": {
      "ek": "Box nos cogumelos com Exori.",
      "ed": "Avalanche contínuo.",
      "ms": "Energy Wave e Great Fireball.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "H9kX2mQ1oP5",
    "youtubeTitle": "Feyrist Nightmares Solo Hunt Guide 150+",
    "description": "Caverna dos pesadelos na mágica ilha de Feyrist. Excelente fonte de Demonic Essences, Scythe Legs e Bohs com baixíssimo risco de morte."
  },
  {
    "id": "deepling-caves",
    "name": "Deepling Caves & Submerged World",
    "city": "Fiehonsha (Gray Island)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 160,
    "recommendedLevel": 260,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Duo"
    ],
    "rawXp": "4.0M - 8.0M/h",
    "profit": "400k - 1.1M/h",
    "danger": 2,
    "tier": "Farme de Foxtail",
    "tags": [
      "Deeplings",
      "Fiehonsha",
      "Underwater",
      "Foxtail Amulet Quest"
    ],
    "elements": [
      "Drown",
      "Life Drain",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Lanças pesadas dos Deepling Warriors"
      },
      {
        "element": "Life Drain",
        "percent": "25%+",
        "note": "Cânticos dos Spellsingers"
      }
    ],
    "charms": [
      {
        "monster": "Deepling Warrior",
        "charm": "Zap / Enflame",
        "weakness": "Energy (+20%), Fire (+15%)"
      },
      {
        "monster": "Deepling Spellsinger",
        "charm": "Zap / Wound",
        "weakness": "Energy (+25%), Physical"
      },
      {
        "monster": "Deepling Guard",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Energy",
      "armor": "Life Leech + Physical",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical"
    },
    "pullStrategy": "Navegar os salões submersos com helmet of the deep ou depth ocrea. Os monstros são extremamente sensíveis a Energy e dano físico.",
    "roles": {
      "ek": "Box de 8 com armas de Energy e Exori Gran.",
      "ed": "Energy / Terra Wave e cura.",
      "ms": "Energy Wave e Thunderstorm.",
      "rp": "Diamond Arrows com flechas de energia."
    },
    "youtubeId": "Q8xR1mK2aP3",
    "youtubeTitle": "Deepling Caves Solo Hunt & Foxtail Guide",
    "description": "O reino submerso dos Deeplings nas profundezas oceânicas de Fiehonsha. Drops ricos de armas profundas, gemas azuis e itens da quest do Foxtail Amulet."
  },
  {
    "id": "ingol-subsolo-3",
    "name": "Ingol - Subsolo 3 (Crape Man & Harpy Lair)",
    "city": "Ingol",
    "category": "bastions",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 400,
    "recommendedLevel": 550,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Duo",
      "Team 4x"
    ],
    "rawXp": "13M - 23M/h",
    "profit": "1.1M - 2.6M/h",
    "danger": 4,
    "tier": "Meta S",
    "tags": [
      "Ingol -3",
      "Harpies",
      "Crape Man",
      "Gemas e Forja"
    ],
    "elements": [
      "Physical",
      "Earth",
      "Energy"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "40%+",
        "note": "Ataques vorazes das Harpias"
      },
      {
        "element": "Earth",
        "percent": "30%+",
        "note": "Esgotos de lama tóxica"
      }
    ],
    "charms": [
      {
        "monster": "Harpy",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical"
      },
      {
        "monster": "Crape Man",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Lurar os corredores de pedra e laboratórios de Ingol -3. As Harpias são rápidas e aplicam debuffs, portanto manter Exeta Res em dia.",
    "roles": {
      "ek": "Box encostado nas mesas cirúrgicas.",
      "ed": "Avalanche constante e cura.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "U9xR1mK2aP7",
    "youtubeTitle": "Ingol -3 Solo EK & Duo Hunt Guide 20kk/h",
    "description": "Laboratórios subterrâneos da ilha de Ingol. Monstros híbridos com excelente equilíbrio entre experiência extrema e lucro de jóias raras."
  },

  // =========================================================================
  // --- EXPANSÃO ULTRA MASTER 100+ HUNTS: POI, INQ, WARZONES, FERUMBRAS, ZAO, DREFIA, EARLY GAME ---
  // =========================================================================
  {
    "id": "poi-dt-city",
    "name": "Pits of Inferno: Dark Torturers City (PoI)",
    "city": "Plains of Havoc (PoI)",
    "category": "meta_hunts",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 300,
    "recommendedLevel": 450,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Duo",
      "Team 4x"
    ],
    "rawXp": "8.5M - 15M/h",
    "profit": "800k - 2.0M/h",
    "danger": 4,
    "tier": "Clássico S-Tier",
    "tags": [
      "PoI",
      "Dark Torturers",
      "Hellfire Fighters",
      "Steel Boots",
      "Plaguesmiths"
    ],
    "elements": [
      "Physical",
      "Fire",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "40%+",
        "note": "Guilhotinas e serras dos Dark Torturers"
      },
      {
        "element": "Fire",
        "percent": "35%+",
        "note": "Chamas dos Hellfire Fighters"
      },
      {
        "element": "Death",
        "percent": "25%+",
        "note": "Maldições dos Spectres"
      }
    ],
    "charms": [
      {
        "monster": "Dark Torturer",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Hellfire Fighter",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+15%)"
      },
      {
        "monster": "Juggernaut",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+15%), Fire (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech + Ice",
      "armor": "Life Leech + Fire Protection (Dragon Hide)",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Lurar os corredores de sangue e fogo da cidade dos Dark Torturers. Manter armas de gelo ativas para destruir os Hellfire Fighters.",
    "roles": {
      "ek": "Box encostado nas colunas com Exori Gran e rotação de gelo.",
      "ed": "Avalanche constante e cura no EK.",
      "ms": "Energy Wave e Great Fireball.",
      "rp": "Diamond Arrows com flechas de gelo."
    },
    "youtubeId": "A7mX9eQ0y4U",
    "youtubeTitle": "PoI Dark Torturer City Solo & Duo Guide 12kk/h",
    "description": "A metrópole dos suplícios nas profundezas de Pits of Inferno. Um dos marcos mais reverenciados da história de caçadas no Tibia."
  },
  {
    "id": "poi-levers",
    "name": "Pits of Inferno: Phantasm & Spectre Halls",
    "city": "Plains of Havoc (PoI)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 180,
    "recommendedLevel": 280,
    "modes": [
      "Solo Mage",
      "Duo (EK+ED)"
    ],
    "rawXp": "5.5M - 10M/h",
    "profit": "400k - 900k/h",
    "danger": 3,
    "tier": "Mage Ice Rush",
    "tags": [
      "Phantasms",
      "Spectres",
      "Avalanche Rush",
      "PoI"
    ],
    "elements": [
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "40%+",
        "note": "Life drain severo dos Phantasms"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Golpes das mãos espectrais"
      }
    ],
    "charms": [
      {
        "monster": "Phantasm",
        "charm": "Enflame / Divine Wrath",
        "weakness": "Fire (+25%), Holy (+20%)"
      },
      {
        "monster": "Spectre",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+25%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Critical + Fire",
      "armor": "Death Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Death Shield"
    },
    "pullStrategy": "Correr os salões de mármore branco tacando Great Fireball e Avalanche. Cuidado com o mana drain absurdo dos Spectres.",
    "roles": {
      "ek": "Box de 8 com armas de fogo.",
      "ed": "GFB e cura.",
      "ms": "Flam Hur e Great Fireball.",
      "rp": "Burst Arrows de fogo."
    },
    "youtubeId": "F9xR1mK2aP8",
    "youtubeTitle": "PoI Phantasm Halls Mage Hunt Guide",
    "description": "Salões espectrais de PoI com alta imunidade a dano físico e fraqueza colossal a dano de fogo e holy."
  },
  {
    "id": "inquisition-fury-dungeon",
    "name": "MotA Fury Dungeon (Museum of Arts)",
    "city": "Thais (Museum)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 160,
    "recommendedLevel": 260,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "4.8M - 8.5M/h",
    "profit": "600k - 1.6M/h",
    "danger": 3,
    "tier": "Profit S-Tier",
    "tags": [
      "Furies",
      "Red POC",
      "Gold Ingot",
      "Thais"
    ],
    "elements": [
      "Fire",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "35%+",
        "note": "Combustão contínua das Furies"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Ataques corpo-a-corpo velozes"
      }
    ],
    "charms": [
      {
        "monster": "Fury",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Mana Leech + Critical",
      "armor": "Fire Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Fire Shield"
    },
    "pullStrategy": "Lurar 4 a 6 Furies pelos corredores estreitos do museu. Focar gelo para derreter a vida rapidamente.",
    "roles": {
      "ek": "Lurar 5 furies e fechar diagonal no corredor.",
      "ed": "Ice Wave e Avalanche.",
      "ms": "Energy Wave e SD finisher.",
      "rp": "Diamond Arrows e Divine Caldera."
    },
    "youtubeId": "T8mR1nK4vB2",
    "youtubeTitle": "MotA Fury Dungeon Thais Solo EK Guide Profit Insano",
    "description": "Porões do Museu de Artes em Thais infestados de Fúrias. Um dos melhores spots do jogo para lucro de Red Piece of Cloth e joias."
  },
  {
    "id": "inquisition-vats",
    "name": "The Inquisition: The Vats (Ushuriel)",
    "city": "Thais (Inquisition)",
    "category": "meta_hunts",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 320,
    "recommendedLevel": 460,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Team 4x"
    ],
    "rawXp": "8M - 14M/h",
    "profit": "700k - 1.8M/h",
    "danger": 4,
    "tier": "Inquisition Clássico",
    "tags": [
      "Hellhounds",
      "Son of Verminor",
      "The Vats",
      "Demon Dust"
    ],
    "elements": [
      "Earth",
      "Fire",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "40%+",
        "note": "Veneno fétido dos Sons of Verminor"
      },
      {
        "element": "Fire",
        "percent": "35%+",
        "note": "Waves dos Hellhounds"
      }
    ],
    "charms": [
      {
        "monster": "Hellhound",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      },
      {
        "monster": "Son of Verminor",
        "charm": "Enflame / Divine Wrath",
        "weakness": "Fire (+25%), Holy (+20%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire Damage ou Ice + Critical",
      "armor": "Earth Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Fire / Earth Protection"
    },
    "pullStrategy": "Andar pelas passarelas de ácido e lodo tóxico puxando Hellhounds e Sons of Verminor. Ter Poison Cure preparado.",
    "roles": {
      "ek": "Travar Hellhounds de costas para os shooters.",
      "ed": "Cura prioritária e Avalanche.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "K9xL2aB3vM1",
    "youtubeTitle": "Inquisition The Vats Solo & Team 10kk/h Guide",
    "description": "Os tanques de lodo e dejetos demoníacos da Inquisição. Excelente para farmar Demon Dust e loots de alto valor."
  },
  {
    "id": "lizard-chosen-corruption-hole",
    "name": "Lizard Chosen: Corruption Hole (Zao)",
    "city": "Farmine (Zao)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 100,
    "recommendedLevel": 160,
    "modes": [
      "Solo RP",
      "Solo Mage",
      "Solo EK"
    ],
    "rawXp": "2.5M - 5.5M/h",
    "profit": "300k - 750k/h",
    "danger": 2,
    "tier": "Midgame King",
    "tags": [
      "Lizard Chosen",
      "Zao",
      "Corruption Hole",
      "Lizard Scales"
    ],
    "elements": [
      "Physical",
      "Earth"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Ataques corpo a corpo pesados"
      },
      {
        "element": "Earth",
        "percent": "20%+",
        "note": "Spits de veneno"
      }
    ],
    "charms": [
      {
        "monster": "Lizard Chosen",
        "charm": "Zap / Freeze",
        "weakness": "Energy (+20%), Ice (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Energy Damage + Critical + Mana Leech",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Correr nos degraus de templo ou fazer box de 5 a 8 Chosen. Os Chosen são lentos, ideais para kite com flechas e magias.",
    "roles": {
      "ek": "Box de 8 com Exori Gran e rotação Energy.",
      "ed": "Avalanche e cura.",
      "ms": "Energy Wave e Great Fireball.",
      "rp": "Kiting com Drill Bolts ou Diamond Arrows."
    },
    "youtubeId": "L8mN1kP4aZ3",
    "youtubeTitle": "Lizard Chosen Corruption Hole Solo Hunt Guide",
    "description": "O fosso de corrupção dos Lizards em Zao. Um clássico consagrado para Paladinos e Cavaleiros intermediários lucrarem."
  },
  {
    "id": "dragonblaze-peaks-drakens",
    "name": "Dragonblaze Peaks: Draken Elite & Warmasters (Zao)",
    "city": "Farmine (Zao)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 220,
    "recommendedLevel": 320,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Duo (EK+ED)"
    ],
    "rawXp": "5.5M - 9.5M/h",
    "profit": "500k - 1.2M/h",
    "danger": 3,
    "tier": "Zao Meta",
    "tags": [
      "Draken Warmaster",
      "Draken Elite",
      "Zao Mountains",
      "Zaoan Helmet"
    ],
    "elements": [
      "Physical",
      "Fire"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Golpes cortantes dos Drakens"
      },
      {
        "element": "Fire",
        "percent": "30%+",
        "note": "Explosões de fogo"
      }
    ],
    "charms": [
      {
        "monster": "Draken Warmaster",
        "charm": "Ice / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Draken Elite",
        "charm": "Zap / Freeze",
        "weakness": "Ice (+20%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Critical + Mana Leech",
      "armor": "Fire Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Lurar os topos montanhosos de Dragonblaze Peaks. Drakens Elites curam muito rápido, foque os Elites primeiro no single target.",
    "roles": {
      "ek": "Box com armas de Gelo.",
      "ed": "Ice Wave e cura contínua.",
      "ms": "Energy Wave e SD no Elite.",
      "rp": "Diamond Arrows e Crystalline Arrows."
    },
    "youtubeId": "D7xK2mP9aQ1",
    "youtubeTitle": "Dragonblaze Peaks Draken Solo EK Guide 8kk/h",
    "description": "Picos nevados e vulcânicos de Zao com alta densidade de Warmasters e Elites. Ótimo drop de Zaoan Helmets e Legs."
  },
  {
    "id": "drefia-grim-reapers",
    "name": "Drefia Grim Reapers (The Hellway)",
    "city": "Darashia (Drefia)",
    "category": "mid_game",
    "vocations": [
      "Paladin",
      "Mage",
      "Knight",
      "Monk"
    ],
    "minLevel": 150,
    "recommendedLevel": 250,
    "modes": [
      "Solo RP",
      "Solo Mage",
      "Solo EK"
    ],
    "rawXp": "4.5M - 9M/h",
    "profit": "200k - 600k/h",
    "danger": 4,
    "tier": "XP Rush Clássico",
    "tags": [
      "Grim Reaper",
      "Drefia",
      "Rush Level",
      "Nightmare Blade"
    ],
    "elements": [
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "45%+",
        "note": "Beam frontal de Death devastador (evitar ficar na reta)"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Corte da Foice da Morte"
      }
    ],
    "charms": [
      {
        "monster": "Grim Reaper",
        "charm": "Divine Wrath / Enflame",
        "weakness": "Holy (+25%), Fire (+20%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire Damage ou Holy + Critical",
      "armor": "Death Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Death Shield"
    },
    "pullStrategy": "NUNCA fique na reta frontal do Grim Reaper! Corra em círculos com Firebombs ou lurar de 3 a 5 e estourar Mas San.",
    "roles": {
      "ek": "Ficar na diagonal absoluta com armas de Fire.",
      "ed": "GFB e Exura Sio.",
      "ms": "Flam Hur e Great Fireball.",
      "rp": "Crystalline Arrows ou Diamond Arrows com Mas San."
    },
    "youtubeId": "G8mR2kP1vX4",
    "youtubeTitle": "Drefia Grim Reapers Solo RP Rush Level Guide",
    "description": "As catacumbas sagradas da Morte em Drefia. O melhor ponto de rush de XP puro para Paladinos e Magos do level 150 ao 300."
  },
  {
    "id": "yalahar-grim-reapers",
    "name": "Yalahar Grim Reapers (Cemetery Quarter -3)",
    "city": "Yalahar",
    "category": "mid_game",
    "vocations": [
      "Paladin",
      "Mage",
      "Knight",
      "Monk"
    ],
    "minLevel": 130,
    "recommendedLevel": 220,
    "modes": [
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "3.5M - 7M/h",
    "profit": "150k - 500k/h",
    "danger": 4,
    "tier": "Paladin Heaven",
    "tags": [
      "Grim Reaper",
      "Yalahar Cemetery",
      "Firebomb Kite"
    ],
    "elements": [
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "40%+",
        "note": "Beams frontais de morte letal"
      }
    ],
    "charms": [
      {
        "monster": "Grim Reaper",
        "charm": "Divine Wrath / Enflame",
        "weakness": "Holy (+25%), Fire (+20%)"
      }
    ],
    "imbuements": {
      "weapon": "Critical Tier 3 + Mana Leech",
      "armor": "Death Protection (Lit Moon Mirror / Koshei)",
      "helmet": "Mana Leech",
      "shield": "Death Shield"
    },
    "pullStrategy": "Tacar Firebomb no chão para travar a movimentação dos Grims e correr em volta dando Crystalline Arrows e Mas San.",
    "roles": {
      "ek": "Cuidado extremo com múltiplos Grims nos corredores estreitos.",
      "ed": "Fireball e cura rápida.",
      "ms": "Fire Wave e SD.",
      "rp": "Kite com Firebomb e Holy damage."
    },
    "youtubeId": "Y9xL1mK4aV2",
    "youtubeTitle": "Yalahar Cemetery Grim Reapers Solo Paladin 5kk/h",
    "description": "Subsolo profundo do Cemetery Quarter em Yalahar. Clássico histórico de Paladinos subindo centenas de levels com Firebombs."
  },
  {
    "id": "okolnir-frost-dragons",
    "name": "Svargrond Frost Dragons (Okolnir)",
    "city": "Svargrond",
    "category": "mid_game",
    "vocations": [
      "Mage",
      "Paladin",
      "Knight",
      "Monk"
    ],
    "minLevel": 90,
    "recommendedLevel": 160,
    "modes": [
      "Solo Mage (SD Rush)",
      "Solo RP",
      "Solo EK"
    ],
    "rawXp": "2.5M - 5M/h",
    "profit": "-50k - 300k/h (Pode ser waste em rush SD)",
    "danger": 3,
    "tier": "SD Rush Clássico",
    "tags": [
      "Frost Dragon",
      "Okolnir",
      "SD Rush",
      "Dragon Slayer"
    ],
    "elements": [
      "Ice",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Ice",
        "percent": "40%+",
        "note": "Ondas de gelo que paralisam"
      },
      {
        "element": "Physical",
        "percent": "20%+",
        "note": "Dano de mordida"
      }
    ],
    "charms": [
      {
        "monster": "Frost Dragon",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+25%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire Damage + Critical",
      "armor": "Ice Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Glacier Shield"
    },
    "pullStrategy": "Lurar os dragões de gelo na montanha de Okolnir. Eles têm fraqueza extrema a dano de fogo. Mages podem usar SDs e Great Fireballs.",
    "roles": {
      "ek": "Box com arma de Fire e Glacier Amulet.",
      "ed": "Fire Wave e Great Fireball.",
      "ms": "Hell's Core, Flam Hur e SD.",
      "rp": "Fire Arrows ou Diamond Arrows."
    },
    "youtubeId": "O8mK1nP4aV3",
    "youtubeTitle": "Okolnir Frost Dragons Mage SD Rush Fast Level",
    "description": "A montanha gélida de Okolnir ao norte de Svargrond. O spot lendário de caça com Sudden Death para catapultar magos novatos."
  },
  {
    "id": "fenrock-dragon-lords",
    "name": "Fenrock Dragon Lords (Secret Pyre)",
    "city": "Yalahar (Fenrock)",
    "category": "mid_game",
    "vocations": [
      "Paladin",
      "Mage",
      "Knight",
      "Monk"
    ],
    "minLevel": 80,
    "recommendedLevel": 140,
    "modes": [
      "Solo RP",
      "Solo Mage",
      "Solo EK"
    ],
    "rawXp": "2.0M - 4.5M/h",
    "profit": "100k - 400k/h",
    "danger": 3,
    "tier": "Mito da Comunidade",
    "tags": [
      "Dragon Lord",
      "Fenrock",
      "Golden Machete",
      "Dragon Scale Mail"
    ],
    "elements": [
      "Fire",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "45%+",
        "note": "Fire waves e Great Fireballs dos DLs"
      }
    ],
    "charms": [
      {
        "monster": "Dragon Lord",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Critical",
      "armor": "Fire Protection (Dragon Hide)",
      "helmet": "Mana Leech",
      "shield": "Magma / Fire Shield"
    },
    "pullStrategy": "Navegar até a caverna secreta de Fenrock passando pelos Beregar dwarfs. Manter Magma Amulet ativo o tempo todo.",
    "roles": {
      "ek": "Ficar na diagonal para não tomar fire wave.",
      "ed": "Ice Wave e cura constante.",
      "ms": "Energy Wave e SD nos DLs.",
      "rp": "Kite com Crystalline Arrows e Exori Con."
    },
    "youtubeId": "F1xL3mK8aP0",
    "youtubeTitle": "Fenrock Dragon Lords Guia Completo e Rotação",
    "description": "O spawn lendário nas cavernas de Fenrock. Um dos santuários mais amados pela comunidade do Tibia para nostalgia e caça descontraída."
  },
  {
    "id": "warzone-1-gnomebase",
    "name": "Warzone 1: Deathstrike Cavern (Gnomebase Alpha)",
    "city": "Kazordoon (Gnomebase)",
    "category": "meta_hunts",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 200,
    "recommendedLevel": 300,
    "modes": [
      "Team 4x",
      "Duo",
      "Solo EK 350+"
    ],
    "rawXp": "5.5M - 10M/h",
    "profit": "800k - 2.0M/h",
    "danger": 3,
    "tier": "Lucro de Tokens",
    "tags": [
      "Warzone 1",
      "Deathstrike",
      "Gnomebase",
      "Major Crystalline Token"
    ],
    "elements": [
      "Physical",
      "Earth",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "35%+",
        "note": "Veneno e lama dos monstros subterrâneos"
      },
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Pancadas dos golens e besouros"
      }
    ],
    "charms": [
      {
        "monster": "Armadile",
        "charm": "Ice / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Hideous Fungus",
        "charm": "Enflame / Freeze",
        "weakness": "Fire (+25%), Ice (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire / Ice + Critical + Mana Leech",
      "armor": "Earth Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Earth Shield"
    },
    "pullStrategy": "Lurar os cogumelos e golens no caminho do boss Deathstrike. Matar em packs grandes aproveitando o dano de área.",
    "roles": {
      "ek": "Puxar 8 monstros nos cruzamentos.",
      "ed": "Avalanche ou GFB com cura rápida.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows e Mas San."
    },
    "youtubeId": "W1xL4mK7aZ8",
    "youtubeTitle": "Warzone 1 Cavern Hunt Guide & Token Farm",
    "description": "Primeira zona de guerra dos gnomos. Rende centenas de cristais, Major Tokens e itens raros de forja gnomica."
  },
  {
    "id": "warzone-2-gnomebase",
    "name": "Warzone 2: Gnomevil Lair & Humongous Fungus",
    "city": "Kazordoon (Gnomebase)",
    "category": "meta_hunts",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 220,
    "recommendedLevel": 320,
    "modes": [
      "Team 4x",
      "Duo",
      "Solo EK"
    ],
    "rawXp": "6M - 11M/h",
    "profit": "900k - 2.2M/h",
    "danger": 3,
    "tier": "Lucro de Tokens",
    "tags": [
      "Warzone 2",
      "Gnomevil",
      "Fungus",
      "Gnome Shield"
    ],
    "elements": [
      "Earth",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "40%+",
        "note": "Esporos dos fungos gigantes"
      },
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Magias necróticas"
      }
    ],
    "charms": [
      {
        "monster": "Humongous Fungus",
        "charm": "Enflame / Freeze",
        "weakness": "Fire (+25%), Ice (+15%)"
      },
      {
        "monster": "Cliff Strider",
        "charm": "Ice / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire Damage + Critical + Mana Leech",
      "armor": "Earth Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Avançar pelas câmaras de esporos destruindo os fungos parasitários com grande alcance de fogo.",
    "roles": {
      "ek": "Box central com Exori Gran de Fire.",
      "ed": "Great Fireball e suporte ao EK.",
      "ms": "Flam Hur e Great Fireball.",
      "rp": "Diamond Arrows de Fire."
    },
    "youtubeId": "W2xL5mK8aP1",
    "youtubeTitle": "Warzone 2 Deep Farm & Gnomevil Path",
    "description": "Segunda zona de guerra dos gnomos repleta de fungos colossais e insetos petrificados ricos em minérios."
  },
  {
    "id": "warzone-3-gnomebase",
    "name": "Warzone 3: Versperoth & Parasites Deep Abyss",
    "city": "Kazordoon (Gnomebase)",
    "category": "meta_hunts",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 250,
    "recommendedLevel": 360,
    "modes": [
      "Team 4x",
      "Duo",
      "Solo EK 400+"
    ],
    "rawXp": "7M - 12M/h",
    "profit": "1.0M - 2.5M/h",
    "danger": 4,
    "tier": "Warzone Master",
    "tags": [
      "Warzone 3",
      "Abyssador",
      "Parasites",
      "Iron Ore"
    ],
    "elements": [
      "Energy",
      "Physical",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Energy",
        "percent": "35%+",
        "note": "Eletricidade dos golens"
      },
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Pancadas dos Ironblights"
      }
    ],
    "charms": [
      {
        "monster": "Ironblight",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+10%)"
      },
      {
        "monster": "Orewalker",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+20%), Fire (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Critical + Mana Leech",
      "armor": "Energy Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical Shield"
    },
    "pullStrategy": "Lurar os Ironblights em formato de cruz. Seus ataques quebram defesa física com grande intensidade.",
    "roles": {
      "ek": "Encostar na parede para reduzir os ângulos de ataque.",
      "ed": "Avalanche constante e Mass Healing.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "W3xL6mK9aV4",
    "youtubeTitle": "Warzone 3 High Level Team Hunt Guide",
    "description": "O abismo mais profundo das Warzones clássicas. Monólitos de ferro ambulantes com alto índice de gemas raras e tokens."
  },
  {
    "id": "demona-warlocks",
    "name": "Demona: Warlock Lair (Maze of Lost Souls)",
    "city": "Carlin (Maze of Lost Souls)",
    "category": "mid_game",
    "vocations": [
      "Paladin",
      "Knight",
      "Mage",
      "Monk"
    ],
    "minLevel": 100,
    "recommendedLevel": 160,
    "modes": [
      "Solo RP",
      "Solo EK",
      "Solo Mage"
    ],
    "rawXp": "2.0M - 4.5M/h",
    "profit": "250k - 700k/h",
    "danger": 3,
    "tier": "Nostalgia Pura",
    "tags": [
      "Warlock",
      "Demona",
      "Ring of the Sky",
      "Skull Staff",
      "Blue Robe"
    ],
    "elements": [
      "Fire",
      "Energy",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "35%+",
        "note": "Fire wave e Great Fireball"
      },
      {
        "element": "Energy",
        "percent": "30%+",
        "note": "Energy beam devastador"
      }
    ],
    "charms": [
      {
        "monster": "Warlock",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Mana Leech",
      "armor": "Fire Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Fire Shield"
    },
    "pullStrategy": "Navegar o labirinto de Demona até a cidade antiga. Warlocks ficam invisíveis com frequência; leve Energy Wall ou Bomb para revelar a posição.",
    "roles": {
      "ek": "Usar Exori Mas ou Ice para quebrar invisibilidade.",
      "ed": "Ice Wave e Exori Frigo.",
      "ms": "SD e Energy Wall.",
      "rp": "Crystalline Arrows e Holy Flash."
    },
    "youtubeId": "M7xP1mK3aZ2",
    "youtubeTitle": "Demona Warlocks Solo Hunt Guide Nostalgia",
    "description": "A cidade subterrânea escondida após o Labirinto das Almas Perdidas. Berço dos Warlocks clássicos do Tibia."
  },
  {
    "id": "goroma-demon-hell",
    "name": "Goroma: Demon Hell & Volcano",
    "city": "Liberty Bay (Goroma)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 160,
    "recommendedLevel": 250,
    "modes": [
      "Solo RP",
      "Solo EK",
      "Solo Mage",
      "Duo"
    ],
    "rawXp": "3.5M - 7.5M/h",
    "profit": "400k - 1.2M/h",
    "danger": 3,
    "tier": "Demon Task Meta",
    "tags": [
      "Demon",
      "Goroma",
      "Demon Task",
      "Magic Plate Armor",
      "Fire Axe"
    ],
    "elements": [
      "Fire",
      "Physical",
      "Energy"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "45%+",
        "note": "Fire wave, Great Fireball e fields"
      },
      {
        "element": "Energy",
        "percent": "20%+",
        "note": "Energy beam"
      }
    ],
    "charms": [
      {
        "monster": "Demon",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+15%), Holy (+20%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Critical + Mana Leech",
      "armor": "Fire Protection (Dragon Hide Tier 3)",
      "helmet": "Mana Leech + Skill",
      "shield": "Fire / Magma Shield"
    },
    "pullStrategy": "Lurar Demons um a um ou duplas no vulcão de Goroma. Mantenha-se fora da linha de frente para não levar fire wave direta.",
    "roles": {
      "ek": "Travar o Demon na diagonal com arma de Gelo.",
      "ed": "Ice Wave e Avalanche com cura.",
      "ms": "Energy Wave e SD.",
      "rp": "Crystalline Arrows com Holy San."
    },
    "youtubeId": "G1xP5mK8aB9",
    "youtubeTitle": "Goroma Demon Hell Solo Hunt Demon Task Guide",
    "description": "O lendário inferno vulcânico de Goroma. Principal local para realizar a clássica Demon Task dos 6666 Demons."
  },
  {
    "id": "seacrest-grounds-subaquatic",
    "name": "Seacrest Grounds: Underwater Oramond",
    "city": "Rathleton (Oramond)",
    "category": "meta_hunts",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 250,
    "recommendedLevel": 350,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Duo (EK+ED)"
    ],
    "rawXp": "6.5M - 11M/h",
    "profit": "600k - 1.5M/h",
    "danger": 3,
    "tier": "Oramond Secreto",
    "tags": [
      "Seacrest Pearl",
      "Seacrest Serpent",
      "Oramond Underwater"
    ],
    "elements": [
      "Ice",
      "Energy",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Ice",
        "percent": "35%+",
        "note": "Rajadas glaciais das Seacrest Serpents"
      },
      {
        "element": "Energy",
        "percent": "30%+",
        "note": "Choques elétricos subaquáticos"
      }
    ],
    "charms": [
      {
        "monster": "Seacrest Serpent",
        "charm": "Enflame / Wound",
        "weakness": "Fire (+20%), Physical (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire Damage + Critical + Mana Leech",
      "armor": "Ice Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Ice Shield"
    },
    "pullStrategy": "Navegar as profundezas oceânicas de Oramond lurando Seacrest Serpents em círculos. Elas dropam Seacrest Pearls que garantem lucro alto.",
    "roles": {
      "ek": "Box nos corais com armas de Fogo.",
      "ed": "Energy Wave ou Great Fireball com cura.",
      "ms": "Great Fireball e Flam Hur.",
      "rp": "Diamond Arrows de Fogo."
    },
    "youtubeId": "S7xQ2mK9aR3",
    "youtubeTitle": "Seacrest Grounds Oramond Solo EK Guide 9kk/h",
    "description": "Gruta abissal submersa de Rathleton. Excelente combinação de caçada dinâmica com pérolas raras de alto valor nos NPCs de Rathleton."
  },
  {
    "id": "glooth-tower-oramond",
    "name": "Glooth Tower (Oramond Minotaur & Golems)",
    "city": "Rathleton (Oramond)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 180,
    "recommendedLevel": 260,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "4.5M - 8M/h",
    "profit": "400k - 900k/h",
    "danger": 3,
    "tier": "Oramond Clássico",
    "tags": [
      "Glooth Golem",
      "Rustheap Golem",
      "Minotaur Hunter",
      "Oramond Tower"
    ],
    "elements": [
      "Energy",
      "Physical",
      "Earth"
    ],
    "protectionPriorities": [
      {
        "element": "Energy",
        "percent": "35%+",
        "note": "Eletricidade dos Rustheap Golems"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Tiros de minotauro e golens"
      }
    ],
    "charms": [
      {
        "monster": "Glooth Golem",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+20%), Fire (+15%)"
      },
      {
        "monster": "Rustheap Golem",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Critical + Mana Leech",
      "armor": "Energy Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Subir os andares da torre lurando os golens e minotauros até o terraço. Use Ice Wave ou Avalanche para rápido burst.",
    "roles": {
      "ek": "Box de 8 no centro da sala da torre.",
      "ed": "Avalanche contínua e Mas Res.",
      "ms": "Energy Wave e Great Fireball.",
      "rp": "Diamond Arrows com Avalanche."
    },
    "youtubeId": "G9xP3mK4aL2",
    "youtubeTitle": "Glooth Tower Oramond Solo EK & Mage Hunt Guide",
    "description": "A torre tecnológica de Rathleton habitada por golens de esgoto e minotauros armados. Ótimo spot para exp equilibrada e loots mecânicos."
  },
  {
    "id": "yalahar-war-golems",
    "name": "Yalahar War Golems (Factory Quarter)",
    "city": "Yalahar",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 100,
    "recommendedLevel": 170,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage",
      "Duo"
    ],
    "rawXp": "2.5M - 5M/h",
    "profit": "300k - 800k/h",
    "danger": 2,
    "tier": "Eazy Profit",
    "tags": [
      "War Golem",
      "Factory Quarter",
      "Epee",
      "Tin Key",
      "Energy"
    ],
    "elements": [
      "Energy",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Energy",
        "percent": "40%+",
        "note": "Feixes de choque elétrico"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Soco metálico dos golens"
      }
    ],
    "charms": [
      {
        "monster": "War Golem",
        "charm": "Freeze / Enflame",
        "weakness": "Ice (+20%), Fire (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Mana Leech",
      "armor": "Energy Protection (Lightning Coat)",
      "helmet": "Mana Leech",
      "shield": "Lightning Shield"
    },
    "pullStrategy": "Usar as alavancas e portas de fábrica em Yalahar. Puxar War Golems em corredores ou box solo com arma elemental de Ice.",
    "roles": {
      "ek": "Box encostado nas esteiras mecânicas.",
      "ed": "Ice Wave e Exori Frigo.",
      "ms": "Energy Wave e SD.",
      "rp": "Crystalline Arrows de longe."
    },
    "youtubeId": "Y1xW8mK3aP5",
    "youtubeTitle": "Yalahar War Golems Solo Hunt Tin Key Farm",
    "description": "O setor fabril do Factory Quarter em Yalahar. Famoso pela chance de dropar a lendária Tin Key (montaria Tin Lizzard) e barras de ferro."
  },
  {
    "id": "yalahar-mutated-tigers",
    "name": "Mutated Tigers & Bats (Yalahar Arena & Alchemist)",
    "city": "Yalahar",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 50,
    "recommendedLevel": 90,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "900k - 2.2M/h",
    "profit": "200k - 500k/h",
    "danger": 2,
    "tier": "Sabretooth Farm King",
    "tags": [
      "Mutated Tiger",
      "Sabretooth",
      "Alchemist Quarter",
      "Arena Quarter"
    ],
    "elements": [
      "Earth",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "30%+",
        "note": "Veneno dos tigres e morcegos"
      },
      {
        "element": "Physical",
        "percent": "20%+",
        "note": "Ataques corpo a corpo"
      }
    ],
    "charms": [
      {
        "monster": "Mutated Tiger",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      },
      {
        "monster": "Mutated Bat",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice / Fire + Mana Leech",
      "armor": "Life Leech + Earth Protection",
      "helmet": "Mana Leech",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Lurar os andares superiores do Arena Quarter ou o circo do Alchemist. Mutated Tigers dropam Sabretooth em abundância (imbuement essencial).",
    "roles": {
      "ek": "Box de 4 a 6 tigres com Exori.",
      "ed": "Avalanche contínua e Exura.",
      "ms": "Great Fireball e Energy Strike.",
      "rp": "Burst Arrows ou flechas de fogo."
    },
    "youtubeId": "M1xT4mK9aV8",
    "youtubeTitle": "Yalahar Mutated Tigers Sabretooth Farm Guide",
    "description": "O melhor local para jogadores iniciantes e intermediários garantirem centenas de Sabretooths para imbuements de Critical no mercado."
  },
  {
    "id": "the-spike-lower",
    "name": "The Spike: Lower Floors (Svargrond Undead Rush)",
    "city": "Kazordoon (The Spike)",
    "category": "early_game",
    "vocations": [
      "Mage",
      "Paladin",
      "Knight",
      "Monk"
    ],
    "minLevel": 50,
    "recommendedLevel": 80,
    "modes": [
      "Solo Mage (Avalanche / GFB)",
      "Solo RP"
    ],
    "rawXp": "1.2M - 2.8M/h",
    "profit": "50k - 200k/h",
    "danger": 3,
    "tier": "Early Game Speedrun",
    "tags": [
      "The Spike",
      "Zombie",
      "Demon Skeleton",
      "Corym",
      "Level 50-80"
    ],
    "elements": [
      "Death",
      "Earth",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Dano necrótico dos Demon Skeletons e Zombies"
      }
    ],
    "charms": [
      {
        "monster": "Demon Skeleton",
        "charm": "Divine Wrath / Enflame",
        "weakness": "Holy (+25%), Fire (+20%)"
      },
      {
        "monster": "Corym Vanguard",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire / Holy + Mana Leech",
      "armor": "Death Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Demon Shield"
    },
    "pullStrategy": "Caverna exclusiva para personagens entre level 50 e 80 (ou andares inferiores). Lurar packs inteiros e castigar com Great Fireball e Avalanche.",
    "roles": {
      "ek": "Box com Exori e rotação rápida.",
      "ed": "Avalanche constante e cura rápida.",
      "ms": "Great Fireball e Flam Hur.",
      "rp": "Burst Arrows de Fogo."
    },
    "youtubeId": "S1xP9mK2aZ4",
    "youtubeTitle": "The Spike Level 50-80 Speedrun Mage Guide",
    "description": "Cavernas de The Spike com teleports e restrições por faixa de nível. Uma das formas mais aceleradas de rushar magos do level 50 ao 80."
  },
  {
    "id": "cyclopolis-behemoths",
    "name": "Cyclopolis: Behemoth Depths (Edron)",
    "city": "Edron",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 90,
    "recommendedLevel": 150,
    "modes": [
      "Solo RP",
      "Solo EK",
      "Solo Mage",
      "Duo"
    ],
    "rawXp": "1.8M - 4.0M/h",
    "profit": "250k - 650k/h",
    "danger": 2,
    "tier": "Nostalgia Behemoth",
    "tags": [
      "Behemoth",
      "Cyclopolis",
      "Steel Boots",
      "Titan Axe",
      "Edron"
    ],
    "elements": [
      "Physical",
      "Earth"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Arremesso de pedregulhos e socos pesados"
      }
    ],
    "charms": [
      {
        "monster": "Behemoth",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Mana Leech + Critical",
      "armor": "Physical Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Physical Shield"
    },
    "pullStrategy": "Descer até o último andar de Cyclopolis. Travar os Behemoths nos corredores de pedra e usar armas ou magias de gelo.",
    "roles": {
      "ek": "Box de 3 a 5 Behemoths encostado na parede.",
      "ed": "Avalanche e Exori Frigo com cura.",
      "ms": "Energy Wave e SD.",
      "rp": "Kite com Crystalline Arrows de longe."
    },
    "youtubeId": "C1xB4mK8aP2",
    "youtubeTitle": "Cyclopolis Behemoths Solo Hunt Guide Edron",
    "description": "O clássico labirinto de Cyclopolis em Edron. Destino lendário onde guerreiros antigos conquistavam suas primeiras Steel Boots."
  },
  {
    "id": "yalahar-hellspawns-surface",
    "name": "Yalahar Hellspawns & Plaguesmiths (Magician Surface)",
    "city": "Yalahar",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Mage",
      "Paladin",
      "Monk"
    ],
    "minLevel": 100,
    "recommendedLevel": 170,
    "modes": [
      "Duo (EK+ED)",
      "Solo EK 150+",
      "Solo RP"
    ],
    "rawXp": "2.5M - 5.5M/h",
    "profit": "200k - 500k/h",
    "danger": 3,
    "tier": "Duo Clássico",
    "tags": [
      "Hellspawn",
      "Plaguesmith",
      "Magician Quarter",
      "Duo Level 100"
    ],
    "elements": [
      "Fire",
      "Physical",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "35%+",
        "note": "Fire waves dos Hellspawns"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Pancada e martelo dos Plaguesmiths"
      }
    ],
    "charms": [
      {
        "monster": "Hellspawn",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+15%)"
      },
      {
        "monster": "Plaguesmith",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Mana Leech + Critical",
      "armor": "Fire Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Fire Shield"
    },
    "pullStrategy": "Subir os portões mágicos do Magician Quarter. O EK puxa 4 a 6 Hellspawns e o ED spamma Avalanche e Exura Sio freneticamente.",
    "roles": {
      "ek": "Virar as costas dos Hellspawns para o Druid.",
      "ed": "Posicionar na diagonal e spammar Sio + Avalanche.",
      "ms": "Energy Wave e Great Fireball.",
      "rp": "Diamond Arrows e cura secundária."
    },
    "youtubeId": "H1xS7mK3aZ9",
    "youtubeTitle": "Yalahar Hellspawns Duo EK+ED Level 100-150 Guide",
    "description": "O spot de Duo mais tradicional da história do Tibia moderno. Consolidou gerações de duplas de EK e ED upando em sinergia."
  },
  {
    "id": "nargor-pirates",
    "name": "Nargor Pirates & Buccaneer Caves",
    "city": "Liberty Bay (Nargor)",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 45,
    "recommendedLevel": 80,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "800k - 1.8M/h",
    "profit": "250k - 600k/h",
    "danger": 2,
    "tier": "Pirate Task & Bosses",
    "tags": [
      "Pirate",
      "Nargor",
      "Ron the Ripper",
      "Brutus Bloodbeard",
      "Pirate Hat"
    ],
    "elements": [
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Tiros de bacamarte e espadas piratas"
      }
    ],
    "charms": [
      {
        "monster": "Pirate Buccaneer",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+15%), Physical (+10%)"
      },
      {
        "monster": "Pirate Corsair",
        "charm": "Zap / Freeze",
        "weakness": "Energy (+20%), Ice (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Critical",
      "armor": "Life Leech",
      "helmet": "Mana Leech",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Lurar os andares superiores do navio pirata e as cavernas subterrâneas de Nargor. Excelente para a task dos 3000 Piratas.",
    "roles": {
      "ek": "Box nos corredores do navio com Exori.",
      "ed": "Avalanche ou GFB.",
      "ms": "Great Fireball e Energy Strike.",
      "rp": "Burst Arrows ou flechas normais."
    },
    "youtubeId": "N1xP8mK4aT6",
    "youtubeTitle": "Nargor Pirates Solo Hunt & Task Guide",
    "description": "O esconderijo da pirataria ao sul de Liberty Bay. Essencial para matar os 4 chefes piratas e conquistar itens de addon raríssimos."
  },
  {
    "id": "ankrahmun-peninsula-tomb",
    "name": "Peninsula Tomb - Subsolo 4 (Ankrahmun Vampires)",
    "city": "Ankrahmun",
    "category": "early_game",
    "vocations": [
      "Mage",
      "Knight",
      "Paladin",
      "Monk"
    ],
    "minLevel": 40,
    "recommendedLevel": 75,
    "modes": [
      "Solo Mage (GFB Rush)",
      "Solo EK",
      "Solo RP"
    ],
    "rawXp": "900k - 2.0M/h",
    "profit": "150k - 400k/h",
    "danger": 2,
    "tier": "GFB Rush Clássico",
    "tags": [
      "Vampire Teeth",
      "Necromancer",
      "Boots of Haste",
      "Ankrahmun Tomb"
    ],
    "elements": [
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Dreno de vida dos Vampires"
      }
    ],
    "charms": [
      {
        "monster": "Vampire",
        "charm": "Divine Wrath / Enflame",
        "weakness": "Holy (+25%), Fire (+20%)"
      },
      {
        "monster": "Necromancer",
        "charm": "Divine Wrath / Freeze",
        "weakness": "Holy (+25%), Ice (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire / Holy + Mana Leech",
      "armor": "Death Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Vampire Shield"
    },
    "pullStrategy": "Passar pela fenda de moedas de escaravelho (Scarab Coin) para acessar os andares após a chama azul. Lurar múmias, vampiros e necromantes com GFB.",
    "roles": {
      "ek": "Box de 8 nos corredores de areia com Exori.",
      "ed": "Great Fireball contínua.",
      "ms": "Great Fireball e Flam Hur.",
      "rp": "Burst Arrows de fogo."
    },
    "youtubeId": "A1xT5mK9aP3",
    "youtubeTitle": "Ankrahmun Peninsula Tomb -4 GFB Rush Guide",
    "description": "A tumba clássica da península de Ankrahmun. Excelente drop de Vampire Teeth (produto valioso para imbuement de Life Leech)."
  },
  {
    "id": "vengoth-castle-towers",
    "name": "Vengoth Castle (Blood Brother Towers)",
    "city": "Yalahar (Vengoth)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 140,
    "recommendedLevel": 220,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Duo (EK+ED)"
    ],
    "rawXp": "3.0M - 6.5M/h",
    "profit": "300k - 800k/h",
    "danger": 3,
    "tier": "Vengoth Vampire",
    "tags": [
      "Vampire Bride",
      "Haunted Treeling",
      "Spectre",
      "Vengoth Castle"
    ],
    "elements": [
      "Death",
      "Physical",
      "Earth"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "40%+",
        "note": "Dano sombrio e maldições dos vampiros"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Galhos dos Treelings"
      }
    ],
    "charms": [
      {
        "monster": "Haunted Treeling",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+25%), Energy (+15%)"
      },
      {
        "monster": "Vampire Bride",
        "charm": "Divine Wrath / Freeze",
        "weakness": "Holy (+25%), Ice (+15%)"
      },
      {
        "monster": "Spectre",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+25%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Critical + Fire",
      "armor": "Death Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Death Shield"
    },
    "pullStrategy": "Subir as torres do castelo de Vengoth. Cuidado com o andar dos Spectres que exigem dano elemental de fogo para morrer rapidamente.",
    "roles": {
      "ek": "Box nos arcos góticos com armas de Fire.",
      "ed": "Avalanche ou GFB com cura.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Burst Arrows ou Diamond Arrows."
    },
    "youtubeId": "F7xR1mK2aP2",
    "youtubeTitle": "Vengoth Castle Solo & Duo Hunt Guide",
    "description": "O castelo gótico da família Blood Brother em Vengoth. Ambiente sombrio e repleto de vampiros aristocratas e fantasmas torturados."
  },
  {
    "id": "formorgar-mines-deep",
    "name": "Formorgar Mines: The Deep Abyss (Svargrond)",
    "city": "Svargrond",
    "category": "meta_hunts",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 240,
    "recommendedLevel": 350,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Duo (EK+ED)",
      "Team 4x"
    ],
    "rawXp": "6.5M - 12M/h",
    "profit": "600k - 1.5M/h",
    "danger": 4,
    "tier": "Svargrond Clássico",
    "tags": [
      "Plaguesmith",
      "Destroyer",
      "Lost Soul",
      "Behemoth",
      "Svargrond Mines"
    ],
    "elements": [
      "Physical",
      "Death",
      "Fire"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "40%+",
        "note": "Marretas dos Destroyers e Plaguesmiths"
      },
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Life drain dos Lost Souls"
      }
    ],
    "charms": [
      {
        "monster": "Destroyer",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      },
      {
        "monster": "Plaguesmith",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Critical + Mana Leech",
      "armor": "Physical Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Physical / Death Shield"
    },
    "pullStrategy": "Descer os elevadores congelados de Formorgar Mines. Os Destroyers batem pesado em área, manter box encostado nas paredes de gelo.",
    "roles": {
      "ek": "Fechar box nas quinas de gelo com arma de Ice.",
      "ed": "Avalanche contínua e Sio prioritário.",
      "ms": "Energy Wave e Great Fireball.",
      "rp": "Diamond Arrows e Crystalline Arrows."
    },
    "youtubeId": "F4xM8mK1aP9",
    "youtubeTitle": "Formorgar Mines Deep Solo & Duo Guide 10kk/h",
    "description": "As profundezas gélidas das minas de Formorgar ao norte de Svargrond. Berço dos temidos Plaguesmiths e Destroyers colossais."
  },
  {
    "id": "ferumbras-tarbaz-grounds",
    "name": "Ferumbras Ascendant: Grounds of Tarbaz (The Despair)",
    "city": "Darashia (Ferumbras Citadel)",
    "category": "ferumbras",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 450,
    "recommendedLevel": 600,
    "modes": [
      "Team 4x",
      "Duo (EK+ED 650+)",
      "Solo EK 700+"
    ],
    "rawXp": "15M - 26M/h",
    "profit": "1.2M - 3.0M/h",
    "danger": 5,
    "tier": "Ferumbras End-Game",
    "tags": [
      "Tarbaz",
      "Hellflayer",
      "Vexclaw",
      "Grimeleech",
      "Ferumbras Ascendant"
    ],
    "elements": [
      "Fire",
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "40%+",
        "note": "Chamas e inferno dos Vexclaws"
      },
      {
        "element": "Death",
        "percent": "35%+",
        "note": "Beams mortais de Hellflayer"
      },
      {
        "element": "Physical",
        "percent": "30%+",
        "note": "Garras devastadoras"
      }
    ],
    "charms": [
      {
        "monster": "Hellflayer",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      },
      {
        "monster": "Vexclaw",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Grimeleech",
        "charm": "Enflame / Freeze",
        "weakness": "Fire (+20%), Ice (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Critical + Mana Leech",
      "armor": "Fire Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Fire / Death Protection"
    },
    "pullStrategy": "Puxar os salões de tortura de Tarbaz. Jamais deixe o Hellflayer na reta do ED ou MS. O EK precisa girar os monstros de costas para o time.",
    "roles": {
      "ek": "Box de 8 virado contra a parede com Exori Gran.",
      "ed": "Avalanche constante e Mass Healing.",
      "ms": "Energy Wave e Great Fireball nos Hellflayers.",
      "rp": "Diamond Arrows de Gelo + Mas San."
    },
    "youtubeId": "F5xT9mK4aL1",
    "youtubeTitle": "Ferumbras Tarbaz Seal Team Hunt 25kk/h Guide",
    "description": "O selo de desespero de Tarbaz dentro da cidadela de Ferumbras. Extrema intensidade de dano elemental de fogo e trevas."
  },
  {
    "id": "ferumbras-zamulosh-grounds",
    "name": "Ferumbras Ascendant: Grounds of Zamulosh (The Illusion)",
    "city": "Darashia (Ferumbras Citadel)",
    "category": "ferumbras",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 450,
    "recommendedLevel": 620,
    "modes": [
      "Team 4x",
      "Duo (EK+ED 650+)"
    ],
    "rawXp": "16M - 27M/h",
    "profit": "1.2M - 3.2M/h",
    "danger": 5,
    "tier": "Ferumbras End-Game",
    "tags": [
      "Zamulosh",
      "Grim Reaper",
      "Hellflayer",
      "Vexclaw",
      "Ferumbras Ascendant"
    ],
    "elements": [
      "Death",
      "Fire",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "45%+",
        "note": "Beams frontais e maldições de Grim Reapers e Hellflayers"
      },
      {
        "element": "Fire",
        "percent": "35%+",
        "note": "Lava dos Vexclaws"
      }
    ],
    "charms": [
      {
        "monster": "Grim Reaper",
        "charm": "Divine Wrath / Enflame",
        "weakness": "Holy (+25%), Fire (+20%)"
      },
      {
        "monster": "Hellflayer",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage ou Fire + Critical",
      "armor": "Death Protection + Life Leech",
      "helmet": "Mana Leech + Skill",
      "shield": "Death Shield"
    },
    "pullStrategy": "Selo das ilusões de Zamulosh. Cuidado extremo com os Grims e clones espectrais que aumentam o dano da box exponencialmente.",
    "roles": {
      "ek": "Box rápida com proteção de Death ativa.",
      "ed": "Cura ininterrupta e Avalanche.",
      "ms": "Great Fireball e Energy Wave.",
      "rp": "Diamond Arrows + Mas San."
    },
    "youtubeId": "F6xZ1mK7aQ8",
    "youtubeTitle": "Ferumbras Zamulosh Seal Team Hunt Guide",
    "description": "O selo da ilusão de Zamulosh na ascensão de Ferumbras. Uma das rotas de time mais desafiadoras e recompensadoras de todo o Tibia."
  },
  {
    "id": "svargrond-chyllfrost-wyrms",
    "name": "Chyllfrost: Ice Wyrms & Frost Dragons (Svargrond)",
    "city": "Svargrond",
    "category": "mid_game",
    "vocations": [
      "Mage",
      "Paladin",
      "Knight",
      "Monk"
    ],
    "minLevel": 120,
    "recommendedLevel": 190,
    "modes": [
      "Solo Mage",
      "Solo RP",
      "Solo EK"
    ],
    "rawXp": "3.0M - 6.0M/h",
    "profit": "200k - 500k/h",
    "danger": 3,
    "tier": "Ice Island Solo",
    "tags": [
      "Frost Dragon",
      "Ursagrodon",
      "Chyllfrost",
      "Ice Wyrms"
    ],
    "elements": [
      "Ice",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Ice",
        "percent": "40%+",
        "note": "Waves glaciais severas e paralisia"
      }
    ],
    "charms": [
      {
        "monster": "Frost Dragon",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+25%), Energy (+15%)"
      },
      {
        "monster": "Ice Wyrm",
        "charm": "Enflame / Wound",
        "weakness": "Fire (+25%), Physical (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire Damage + Critical + Mana Leech",
      "armor": "Ice Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Glacier Shield"
    },
    "pullStrategy": "Explorar a ilha descongelada temporária de Chyllfrost. Lurar os grupos de dragões de gelo e usar Great Fireballs.",
    "roles": {
      "ek": "Box com arma de Fogo.",
      "ed": "Great Fireball e Fire Wave.",
      "ms": "Flam Hur e Great Fireball.",
      "rp": "Flechas de Fogo ou Diamond Arrows."
    },
    "youtubeId": "C8xY2mK9aT1",
    "youtubeTitle": "Chyllfrost Frost Dragons Solo Mage Guide",
    "description": "A ilha gélida de Chyllfrost ao norte de Svargrond. Lar do Ursagrodon e grandes densidades de Frost Dragons."
  },
  {
    "id": "edron-dragon-lair",
    "name": "Edron Dragon Lair (D-Lair & Dragon Lords)",
    "city": "Edron",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 60,
    "recommendedLevel": 110,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "1.2M - 2.8M/h",
    "profit": "100k - 300k/h",
    "danger": 2,
    "tier": "Clássico Imortal",
    "tags": [
      "Dragon",
      "Dragon Lord",
      "Edron D-Lair",
      "Dragon Slayer"
    ],
    "elements": [
      "Fire",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "35%+",
        "note": "Fire waves frontais dos dragões"
      }
    ],
    "charms": [
      {
        "monster": "Dragon",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Dragon Lord",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Mana Leech",
      "armor": "Fire Protection (Dragon Hide)",
      "helmet": "Mana Leech",
      "shield": "Dragon Shield"
    },
    "pullStrategy": "Lurar os dragões nos pátios de pedra de Edron. Nunca fique na frente da reta dos dragões para evitar rajadas de fogo.",
    "roles": {
      "ek": "Sempre ficar na diagonal do dragão com Exori.",
      "ed": "Ice Wave e Avalanche.",
      "ms": "Frigo Hur e SD nos DLs.",
      "rp": "Kite com flechas ou bolts de gelo."
    },
    "youtubeId": "E1xD5mK7aZ0",
    "youtubeTitle": "Edron Dragon Lair Solo Hunt Level 60-100 Guide",
    "description": "A mais tradicional e clássica caverna de dragões do Tibia. Local de treino e rito de passagem para todo guerreiro de Edron."
  },
  {
    "id": "mount-sternum-undead",
    "name": "Mount Sternum: Undead Catacombs & Cycs (Thais)",
    "city": "Thais",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 35,
    "recommendedLevel": 70,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "600k - 1.5M/h",
    "profit": "80k - 200k/h",
    "danger": 1,
    "tier": "Iniciante Ouro",
    "tags": [
      "Crypt Shambler",
      "Mummy",
      "Cyclops",
      "Mount Sternum",
      "Thais"
    ],
    "elements": [
      "Death",
      "Physical",
      "Earth"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "25%+",
        "note": "Golpes de Crypt Shambler e paralisia de Mummy"
      }
    ],
    "charms": [
      {
        "monster": "Crypt Shambler",
        "charm": "Divine Wrath / Enflame",
        "weakness": "Holy (+25%), Fire (+20%)"
      },
      {
        "monster": "Cyclops",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire / Holy + Mana Leech",
      "armor": "Death Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Limpar os andares subterrâneos do Monte Sternum. Os Crypt Shamblers batem forte corpo a corpo, então lute recuando se for mage.",
    "roles": {
      "ek": "Box com Exori e arma de fogo.",
      "ed": "GFB e Exori Flam.",
      "ms": "Flam Hur e Great Fireball.",
      "rp": "Kite com flechas ou Mas San."
    },
    "youtubeId": "M1xS3mK9aP4",
    "youtubeTitle": "Mount Sternum Undead Solo Mage & RP Level 40 Guide",
    "description": "As famosas catacumbas sob o Mount Sternum entre Thais e Kazordoon. Lar de incontáveis múmias e mortos-vivos para iniciantes."
  },
  {
    "id": "dark-cathedral-sanctuary",
    "name": "Dark Cathedral: Lower Sanctuaries (Plains of Havoc)",
    "city": "Plains of Havoc (PoH)",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 40,
    "recommendedLevel": 80,
    "modes": [
      "Solo EK",
      "Solo RP",
      "Solo Mage"
    ],
    "rawXp": "700k - 1.6M/h",
    "profit": "150k - 350k/h",
    "danger": 2,
    "tier": "Addon & Cult Farm",
    "tags": [
      "Assassin",
      "Dark Monk",
      "Witch",
      "Dark Cathedral",
      "Rope Belt"
    ],
    "elements": [
      "Physical",
      "Death"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Adagas velozes dos Assassins"
      }
    ],
    "charms": [
      {
        "monster": "Assassin",
        "charm": "Freeze / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Dark Monk",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Mana Leech + Critical",
      "armor": "Life Leech",
      "helmet": "Mana Leech",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Descer os 3 andares da Catedral Sombria em Plains of Havoc. Os Dark Monks curam e Assassins dropam panos raros de addon.",
    "roles": {
      "ek": "Lurar os corredores de mármore escuro com Exori.",
      "ed": "GFB e Avalanche.",
      "ms": "Great Fireball contínua.",
      "rp": "Burst Arrows de fogo."
    },
    "youtubeId": "D1xC6mK8aV2",
    "youtubeTitle": "Dark Cathedral PoH Solo Hunt Guide Level 40-70",
    "description": "A basílica corrompida escondida nas profundezas de Plains of Havoc. Local repleto de foras-da-lei, monges renegados e assassinos perigosos."
  },
  {
    "id": "helheim-bonebeasts",
    "name": "Helheim: Bonebeast & Braindeath Caverns (Svargrond)",
    "city": "Svargrond",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 50,
    "recommendedLevel": 95,
    "modes": [
      "Solo EK",
      "Solo Mage (GFB)",
      "Solo RP"
    ],
    "rawXp": "1.0M - 2.4M/h",
    "profit": "120k - 300k/h",
    "danger": 2,
    "tier": "Bonebeast Task Master",
    "tags": [
      "Bonebeast",
      "Braindeath",
      "Demon Skeleton",
      "Helheim",
      "Bonelord Eye"
    ],
    "elements": [
      "Death",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "30%+",
        "note": "Beams e magias necróticas dos Braindeaths"
      }
    ],
    "charms": [
      {
        "monster": "Bonebeast",
        "charm": "Divine Wrath / Enflame",
        "weakness": "Holy (+25%), Fire (+20%)"
      },
      {
        "monster": "Braindeath",
        "charm": "Enflame / Zap",
        "weakness": "Fire (+20%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Fire / Holy + Mana Leech",
      "armor": "Death Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Death Shield"
    },
    "pullStrategy": "Viajar com Buddel até Helheim e descer até o -4 e -5. Densidade perfeita de Bonebeasts para fechar tasks com Great Fireballs.",
    "roles": {
      "ek": "Box de 8 Bonebeasts com arma de Fire.",
      "ed": "Great Fireball constante.",
      "ms": "Great Fireball e Flam Hur.",
      "rp": "Burst Arrows ou flechas de Holy."
    },
    "youtubeId": "H1xB7mK2aR0",
    "youtubeTitle": "Helheim Bonebeast Task Solo Hunt Guide",
    "description": "A ilha maldita de Helheim acessível pelos mares de Svargrond. Famosa pelo grind das tasks de Bonebeasts e olhos de Braindeaths."
  },
  {
    "id": "poi-dragon-lords",
    "name": "Pits of Inferno: Blood Pits & Dragon Lords (PoI D-Lair)",
    "city": "Plains of Havoc (PoI)",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 140,
    "recommendedLevel": 220,
    "modes": [
      "Solo RP",
      "Solo EK",
      "Solo Mage"
    ],
    "rawXp": "3.5M - 7.0M/h",
    "profit": "250k - 600k/h",
    "danger": 3,
    "tier": "PoI DL Master",
    "tags": [
      "Dragon Lord",
      "PoI D-Lair",
      "Firewalker Boots",
      "Royal Helmet"
    ],
    "elements": [
      "Fire",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Fire",
        "percent": "45%+",
        "note": "Fire waves devastadoras em túneis estreitos"
      }
    ],
    "charms": [
      {
        "monster": "Dragon Lord",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+25%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Critical + Mana Leech",
      "armor": "Fire Protection (Dragon Hide)",
      "helmet": "Mana Leech + Skill",
      "shield": "Magma Shield"
    },
    "pullStrategy": "Entrar na caverna de DLs de Pits of Inferno. Use Firewalker Boots para não tomar dano de lava e lurar em linha com flechas ou magias de gelo.",
    "roles": {
      "ek": "Box na diagonal com arma de Gelo.",
      "ed": "Ice Wave e Avalanche.",
      "ms": "Energy Wave e SD.",
      "rp": "Diamond Arrows de Gelo e Mas San."
    },
    "youtubeId": "P1xD9mK4aZ8",
    "youtubeTitle": "PoI Dragon Lair Solo Hunt Guide & Firewalker Boots",
    "description": "O covil profundo de Dragon Lords localizado nas entranhas de Pits of Inferno. Pátios de lava fervente repletos de dragões vermelhos."
  },
  {
    "id": "liberty-bay-behemoth-cave",
    "name": "Liberty Bay: Behemoth Caves (Cyclopolis Deep)",
    "city": "Liberty Bay",
    "category": "mid_game",
    "vocations": [
      "Paladin",
      "Knight",
      "Mage",
      "Monk"
    ],
    "minLevel": 110,
    "recommendedLevel": 180,
    "modes": [
      "Solo RP",
      "Solo EK",
      "Solo Mage"
    ],
    "rawXp": "2.2M - 4.8M/h",
    "profit": "300k - 700k/h",
    "danger": 2,
    "tier": "Task 2000 Behemoths",
    "tags": [
      "Behemoth",
      "Titan Axe",
      "Steel Boots",
      "Liberty Bay Caves"
    ],
    "elements": [
      "Physical",
      "Earth"
    ],
    "protectionPriorities": [
      {
        "element": "Physical",
        "percent": "35%+",
        "note": "Pedregulhos arremessados"
      }
    ],
    "charms": [
      {
        "monster": "Behemoth",
        "charm": "Freeze / Zap",
        "weakness": "Ice (+20%), Energy (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Critical + Mana Leech",
      "armor": "Physical Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Physical Shield"
    },
    "pullStrategy": "Descer as cavernas montanhosas ao norte de Liberty Bay. Kiting com paladino ou fechar quina de caverna com o cavaleiro.",
    "roles": {
      "ek": "Travar até 4 Behemoths por quina de pedra.",
      "ed": "Avalanche e cura.",
      "ms": "Energy Wave e SD.",
      "rp": "Crystalline Arrows e Holy Flash."
    },
    "youtubeId": "L1xB2mK7aQ4",
    "youtubeTitle": "Liberty Bay Behemoth Cave Solo Hunt & Task Guide",
    "description": "Caverna isolada de Behemoths em Liberty Bay. Ideal para a grande task de 2000 Behemoths do Grizzly Adams para liberar bosses."
  },
  {
    "id": "tarpit-tomb-deep",
    "name": "Ankrahmun Tombs: Tarpit Tomb Deep (-4 / -5)",
    "city": "Ankrahmun",
    "category": "mid_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 90,
    "recommendedLevel": 160,
    "modes": [
      "Solo Mage (GFB / Avalanche)",
      "Solo EK",
      "Solo RP"
    ],
    "rawXp": "1.8M - 4.2M/h",
    "profit": "200k - 500k/h",
    "danger": 2,
    "tier": "Tomb Master",
    "tags": [
      "Vampire",
      "Lich",
      "Necromancer",
      "Banshee",
      "Ankrahmun Tomb"
    ],
    "elements": [
      "Death",
      "Earth",
      "Physical"
    ],
    "protectionPriorities": [
      {
        "element": "Death",
        "percent": "35%+",
        "note": "Maldições de Liches e gritos de Banshees"
      }
    ],
    "charms": [
      {
        "monster": "Lich",
        "charm": "Divine Wrath / Enflame",
        "weakness": "Holy (+25%), Fire (+20%)"
      },
      {
        "monster": "Banshee",
        "charm": "Divine Wrath / Freeze",
        "weakness": "Holy (+25%), Ice (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Holy / Fire + Mana Leech + Critical",
      "armor": "Death Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Death Shield"
    },
    "pullStrategy": "Passar da chama azul de Tarpit Tomb com Scarab Coin. Lurar salas imensas de Liches, Vampiros e Banshees destruindo com Great Fireball.",
    "roles": {
      "ek": "Box de 8 no centro da sala funerária.",
      "ed": "Great Fireball e Avalanche.",
      "ms": "Great Fireball e Flam Hur.",
      "rp": "Burst Arrows de Fogo e Mas San."
    },
    "youtubeId": "T1xT8mK3aZ1",
    "youtubeTitle": "Tarpit Tomb -4/-5 Mage GFB Solo Rush Guide",
    "description": "O subsolo mais amplo e repleto de mortos-vivos das tumbas de Ankrahmun. Excelente para quem busca XP rápida e loots de Blue Robe e Vampire Teeth."
  },
  {
    "id": "lions-rock-darashia",
    "name": "Lion's Rock Sanctum (Darashia Roaring Lions)",
    "city": "Darashia",
    "category": "early_game",
    "vocations": [
      "Knight",
      "Paladin",
      "Mage",
      "Monk"
    ],
    "minLevel": 50,
    "recommendedLevel": 90,
    "modes": [
      "Solo Mage (Ice / Fire)",
      "Solo EK",
      "Solo RP"
    ],
    "rawXp": "1.0M - 2.4M/h",
    "profit": "150k - 400k/h",
    "danger": 2,
    "tier": "Early Game Meta",
    "tags": [
      "Roaring Lion",
      "Ancient Scarab",
      "Noble Lion",
      "Lion's Rock",
      "Darashia"
    ],
    "elements": [
      "Earth",
      "Physical",
      "Fire"
    ],
    "protectionPriorities": [
      {
        "element": "Earth",
        "percent": "30%+",
        "note": "Veneno de Ancient Scarabs"
      },
      {
        "element": "Physical",
        "percent": "25%+",
        "note": "Garras dos Roaring Lions"
      }
    ],
    "charms": [
      {
        "monster": "Roaring Lion",
        "charm": "Ice / Wound",
        "weakness": "Ice (+20%), Physical (+10%)"
      },
      {
        "monster": "Ancient Scarab",
        "charm": "Enflame / Freeze",
        "weakness": "Fire (+25%), Ice (+15%)"
      }
    ],
    "imbuements": {
      "weapon": "Ice Damage + Mana Leech",
      "armor": "Earth Protection + Life Leech",
      "helmet": "Mana Leech",
      "shield": "Physical Protection"
    },
    "pullStrategy": "Fazer o acesso rápido de Lion's Rock em Darashia e descer ao santuário sagrado. Correr com Avalanche e Great Fireball aproveitando a fraqueza mútua de gelo e fogo.",
    "roles": {
      "ek": "Box encostado nos pilares leoninos com Exori.",
      "ed": "Avalanche contínua e Exura.",
      "ms": "Great Fireball e Energy Strike.",
      "rp": "Burst Arrows ou Diamond Arrows."
    },
    "youtubeId": "L1xR9mK4aP8",
    "youtubeTitle": "Lion's Rock Darashia Fast Level 50-80 Guide",
    "description": "A rocha dos leões no deserto de Darashia. Um dos santuários mais recomendados para personagens de nível 50 a 90 uparem com segurança e bom lucro."
  }
];
