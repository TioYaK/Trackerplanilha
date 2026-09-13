import React, { useState, useMemo, useEffect } from 'react';
import { 
  Compass, Search, MapPin, Coins, Zap, Shield, Flame, Skull, 
  ExternalLink, Filter, Star, Sparkles, CheckCircle2, Play, Video, 
  X, Copy, Check, Users, User, ArrowUpDown, ChevronRight, Award,
  AlertTriangle, Heart, ShieldAlert, BookOpen, Layers, Target, Info
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

// Base de Dados Completa e Curada do Meta de Hunts (RubinOT & Tibia Global)
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
  }
];

export default function HuntFinder({ onPlayerClick, onNavigate }) {
  const [selectedVoc, setSelectedVoc] = useState('ALL');
  const [levelRange, setLevelRange] = useState('all');
  const [huntMode, setHuntMode] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommendedLevel'); // 'recommendedLevel', 'rawXp', 'profit', 'danger'
  
  // Modal de Detalhes da Hunt
  const [selectedHunt, setSelectedHunt] = useState(null);
  const [modalTab, setModalTab] = useState('video'); // 'video', 'protection', 'charms', 'roles'
  const [copiedLink, setCopiedLink] = useState(false);

  // Deep linking: verifica se há ?hunt=id na URL ao carregar
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const huntParam = urlParams.get('hunt');
      if (huntParam) {
        const found = HUNTS_DATABASE.find(h => h.id === huntParam);
        if (found) setSelectedHunt(found);
      }
    } catch (e) {
      console.warn('Deep link parse error:', e);
    }
  }, []);

  // Ao abrir o modal, atualiza a query string de forma elegante
  const handleOpenHunt = (hunt) => {
    setSelectedHunt(hunt);
    setModalTab('video');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('hunt', hunt.id);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  const handleCloseModal = () => {
    setSelectedHunt(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('hunt');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  const handleCopyShareLink = () => {
    if (!selectedHunt) return;
    const shareUrl = `${window.location.origin}/hunt-finder?hunt=${selectedHunt.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtragem e Ordenação
  const filteredHunts = useMemo(() => {
    let result = HUNTS_DATABASE.filter(h => {
      if (selectedVoc !== 'ALL' && !h.vocations.includes(selectedVoc)) return false;
      if (huntMode !== 'ALL' && !h.modes.includes(huntMode)) return false;
      if (categoryFilter !== 'ALL' && h.category !== categoryFilter) return false;
      
      if (levelRange === '100-250' && (h.recommendedLevel < 100 || h.minLevel > 250)) return false;
      if (levelRange === '250-450' && (h.recommendedLevel < 250 || h.minLevel > 450)) return false;
      if (levelRange === '450-700' && (h.recommendedLevel < 450 || h.minLevel > 700)) return false;
      if (levelRange === '700-1000' && (h.recommendedLevel < 700 || h.minLevel > 1000)) return false;
      if (levelRange === '1000+' && h.recommendedLevel < 950) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = h.name.toLowerCase().includes(q);
        const matchCity = h.city.toLowerCase().includes(q);
        const matchTag = h.tags.some(t => t.toLowerCase().includes(q));
        const matchCharms = h.charms?.some(c => c.monster.toLowerCase().includes(q) || c.charm.toLowerCase().includes(q));
        const matchElements = h.elements?.some(e => e.toLowerCase().includes(q));
        if (!matchName && !matchCity && !matchTag && !matchCharms && !matchElements) return false;
      }

      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'recommendedLevel') return b.recommendedLevel - a.recommendedLevel;
      if (sortBy === 'levelAsc') return a.recommendedLevel - b.recommendedLevel;
      if (sortBy === 'danger') return b.danger - a.danger;
      if (sortBy === 'profit') {
        const getP = (str) => parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
        return getP(b.profit) - getP(a.profit);
      }
      if (sortBy === 'rawXp') {
        const getX = (str) => parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
        return getX(b.rawXp) - getX(a.rawXp);
      }
      return 0;
    });

    return result;
  }, [selectedVoc, levelRange, huntMode, categoryFilter, searchQuery, sortBy]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Banner Principal com Apelo Visual Épico */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/50 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              <Compass size={14} className="text-yellow-400 animate-spin-slow" />
              Hunt Finder 2.0 & Rotas Meta 🗺️
            </div>
            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold">
              Guia Definitivo de Respawns & Vídeos
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Descubra onde fazer a maior XP/h e lucro líquido no RubinOT. Clique em qualquer respawn para abrir o 
              <strong className="text-yellow-400"> Modal Tático com Vídeo no YouTube</strong>, puxadas de box, fraquezas de charms e proteções elementais recomendadas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="bg-black/80 border border-yellow-500/30 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Respawns no Banco</span>
              <span className="text-xl font-bold text-yellow-400 font-mono">{HUNTS_DATABASE.length} Hunts</span>
            </div>
            <div className="bg-black/80 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Vídeos de Guia</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">100% Curados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Filtros e Busca */}
      <div className="bg-black/70 border border-tibia-border p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Layers size={12} className="text-yellow-400" /> Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="rotten_blood">Rotten Blood (Endgame SSS)</option>
              <option value="soul_war">Soul War (Endgame SS)</option>
              <option value="gnomprona">Gnomprona (Hazard System)</option>
              <option value="library">Secret Library</option>
              <option value="meta_hunts">Meta Solo, Duo & 4x</option>
            </select>
          </div>

          {/* Vocação */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Target size={12} className="text-yellow-400" /> Vocação
            </label>
            <select
              value={selectedVoc}
              onChange={(e) => setSelectedVoc(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="ALL">Todas as Vocações</option>
              <option value="Knight">Knight (EK)</option>
              <option value="Paladin">Paladin (RP)</option>
              <option value="Mage">Mage (MS/ED)</option>
              <option value="Monk">Monk</option>
            </select>
          </div>

          {/* Faixa de Nível */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Sparkles size={12} className="text-yellow-400" /> Nível Recomendado
            </label>
            <select
              value={levelRange}
              onChange={(e) => setLevelRange(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="all">Todos os Níveis</option>
              <option value="100-250">Level 100 - 250 (Iniciante)</option>
              <option value="250-450">Level 250 - 450 (Médio)</option>
              <option value="450-700">Level 450 - 700 (Avançado)</option>
              <option value="700-1000">Level 700 - 1000 (Endgame)</option>
              <option value="1000+">Level 1000+ (Rotten Blood)</option>
            </select>
          </div>

          {/* Formação / Modo */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Users size={12} className="text-yellow-400" /> Formação / Modo
            </label>
            <select
              value={huntMode}
              onChange={(e) => setHuntMode(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="ALL">Solo, Duo & 4x</option>
              <option value="Solo">Solo</option>
              <option value="Duo">Duo</option>
              <option value="Team 4x">Team Hunt 4x</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <ArrowUpDown size={12} className="text-yellow-400" /> Ordenar Por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/90 border border-tibia-border rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
            >
              <option value="recommendedLevel">Maior Nível (Endgame primeiro)</option>
              <option value="levelAsc">Menor Nível (Iniciante primeiro)</option>
              <option value="rawXp">Maior XP/h Estimada</option>
              <option value="profit">Maior Lucro / Farme</option>
              <option value="danger">Maior Perigo (5 Caveiras)</option>
            </select>
          </div>

        </div>

        {/* Busca Textual */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por respawn, cidade, monstro, elemento (ex: Rotten, Ice, Cobra, Earth, Sphinx)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/90 border border-tibia-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white bg-white/10 rounded-full p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

      </div>

      {/* Grid de Cards de Hunts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHunts.map(hunt => {
          const isEndgame = hunt.recommendedLevel >= 800;
          return (
            <div 
              key={hunt.id}
              onClick={() => handleOpenHunt(hunt)}
              className="group bg-gradient-to-b from-black/90 via-black/80 to-black/95 border border-tibia-border hover:border-yellow-500/80 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 shadow-lg hover:shadow-2xl hover:shadow-yellow-500/10 cursor-pointer relative overflow-hidden"
            >
              {/* Badge de Destaque no Topo */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      isEndgame ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      Rec. Level {hunt.recommendedLevel}+
                    </span>
                    {hunt.youtubeId && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                        <Video size={11} /> Vídeo
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-medieval text-yellow-400 group-hover:text-yellow-300 transition-colors flex items-center gap-1.5">
                    {hunt.name}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-red-400" /> {hunt.city}
                  </p>
                </div>

                {/* Caveiras de Perigo */}
                <div className="flex gap-0.5" title={`Perigo: ${hunt.danger} de 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skull 
                      key={i} 
                      size={13} 
                      className={i < hunt.danger ? 'text-red-500' : 'text-gray-700'} 
                    />
                  ))}
                </div>
              </div>

              {/* Descrição Curta */}
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                {hunt.description}
              </p>

              {/* Tags & Modos */}
              <div className="flex flex-wrap gap-1.5">
                {hunt.modes.map(m => (
                  <span key={m} className="px-2 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/25 text-[10px] font-bold rounded-md">
                    {m}
                  </span>
                ))}
                {hunt.tags.slice(0, 2).map(t => (
                  <span key={t} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 text-[10px] font-bold rounded-md">
                    {t}
                  </span>
                ))}
              </div>

              {/* Elementos Predominantes */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Shield size={12} className="text-blue-400" />
                <span className="text-[10px] uppercase font-bold text-gray-500">Defesa:</span>
                <span className="text-gray-300 font-semibold">{hunt.elements.join(', ')}</span>
              </div>

              {/* Estatísticas de XP e Lucro */}
              <div className="pt-3 border-t border-tibia-border/60 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/60 p-2 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">XP Estimada:</span>
                  <span className="font-bold text-green-400 font-mono mt-0.5 text-xs sm:text-sm">{hunt.rawXp}</span>
                </div>

                <div className="bg-black/60 p-2 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Lucro Estimado:</span>
                  <span className="font-bold text-yellow-400 font-mono mt-0.5 text-xs sm:text-sm">{hunt.profit}</span>
                </div>
              </div>

              {/* Call to action no rodapé do card */}
              <div className="flex items-center justify-between text-[11px] font-bold text-yellow-400/80 group-hover:text-yellow-400 pt-1">
                <span className="flex items-center gap-1">
                  <Play size={12} /> Ver Guia Tático & Vídeo
                </span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>

            </div>
          );
        })}
      </div>

      {filteredHunts.length === 0 && (
        <div className="bg-black/60 border border-tibia-border rounded-2xl p-12 text-center flex flex-col items-center gap-3">
          <AlertTriangle size={36} className="text-yellow-400" />
          <h3 className="text-lg font-bold text-gray-200">Nenhum respawn encontrado com esses filtros</h3>
          <p className="text-xs text-gray-400 max-w-md">
            Tente remover alguns filtros de vocação, nível ou busca para ver mais opções da base de dados.
          </p>
          <button
            onClick={() => {
              setSelectedVoc('ALL');
              setLevelRange('all');
              setHuntMode('ALL');
              setCategoryFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded-xl text-xs font-bold transition-all"
          >
            Limpar Todos os Filtros
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TÁTICO COMPLETO DA HUNT COM YOUTUBE E DETALHES META                   */}
      {/* ========================================================================= */}
      {selectedHunt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          
          <div className="bg-gradient-to-b from-gray-950 via-black to-black border-2 border-yellow-500/60 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            
            {/* Header do Modal */}
            <div className="relative p-5 sm:p-6 border-b border-tibia-border bg-gradient-to-r from-yellow-950/40 via-black to-black flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-bold rounded-lg uppercase">
                    Level {selectedHunt.recommendedLevel}+
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-lg uppercase">
                    {selectedHunt.modes.join(' / ')}
                  </span>
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10" title={`Perigo ${selectedHunt.danger}/5`}>
                    <span className="text-[10px] text-gray-400 font-bold mr-1">Risco:</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skull 
                        key={i} 
                        size={12} 
                        className={i < selectedHunt.danger ? 'text-red-500' : 'text-gray-700'} 
                      />
                    ))}
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-medieval text-gradient-gold">
                  {selectedHunt.name}
                </h2>
                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                  <MapPin size={13} className="text-red-400" /> 
                  <strong className="text-gray-200">{selectedHunt.city}</strong>
                  <span>•</span>
                  <span>Vocações recomendadas: {selectedHunt.vocations.join(', ')}</span>
                </p>
              </div>

              {/* Botões do topo: Copiar Link e Fechar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShareLink}
                  title="Copiar Link da Hunt"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-yellow-400 transition-all flex items-center gap-1 text-xs"
                >
                  {copiedLink ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  <span className="hidden sm:inline">{copiedLink ? 'Copiado!' : 'Compartilhar'}</span>
                </button>

                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-gray-400 hover:text-red-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Faixa de Resumo Rápido de Números */}
            <div className="bg-black/90 border-b border-tibia-border/60 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">XP Média / Hora:</span>
                <span className="font-bold text-green-400 font-mono text-sm">{selectedHunt.rawXp}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Lucro Médio / Hora:</span>
                <span className="font-bold text-yellow-400 font-mono text-sm">{selectedHunt.profit}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Level Mínimo:</span>
                <span className="font-bold text-gray-200 font-mono text-sm">{selectedHunt.minLevel}+</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Meta Tier:</span>
                <span className="font-bold text-purple-400 font-mono text-sm">{selectedHunt.tier || 'Meta'}</span>
              </div>
            </div>

            {/* Navegação de Abas do Modal */}
            <div className="bg-black/80 px-6 pt-3 flex border-b border-tibia-border gap-2 overflow-x-auto">
              <button
                onClick={() => setModalTab('video')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x ${
                  modalTab === 'video'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Video size={14} className={modalTab === 'video' ? 'text-yellow-400' : ''} />
                Vídeo & Puxada
              </button>

              <button
                onClick={() => setModalTab('protection')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x ${
                  modalTab === 'protection'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Shield size={14} className={modalTab === 'protection' ? 'text-yellow-400' : ''} />
                Proteções & Imbuements
              </button>

              <button
                onClick={() => setModalTab('charms')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x ${
                  modalTab === 'charms'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Sparkles size={14} className={modalTab === 'charms' ? 'text-yellow-400' : ''} />
                Best Charms & Monstros
              </button>

              <button
                onClick={() => setModalTab('roles')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x ${
                  modalTab === 'roles'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Users size={14} className={modalTab === 'roles' ? 'text-yellow-400' : ''} />
                Funções da Party (EK/ED/MS/RP)
              </button>
            </div>

            {/* Conteúdo Dinâmico das Abas */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              
              {/* ABA 1: VÍDEO & PUXADA */}
              {modalTab === 'video' && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  
                  {/* Player do YouTube */}
                  {selectedHunt.youtubeId ? (
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full overflow-hidden rounded-2xl border border-yellow-500/30 bg-black aspect-video shadow-2xl">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${selectedHunt.youtubeId}?rel=0`}
                          title={selectedHunt.youtubeTitle || selectedHunt.name}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                        <span className="font-semibold text-gray-300">{selectedHunt.youtubeTitle}</span>
                        <a
                          href={`https://www.youtube.com/watch?v=${selectedHunt.youtubeId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink size={12} /> Abrir no YouTube
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/60 border border-yellow-500/30 rounded-2xl p-6 text-center flex flex-col items-center gap-3">
                      <Video size={32} className="text-yellow-400" />
                      <p className="text-sm font-bold text-gray-200">Vídeo específico em renderização</p>
                      <a
                        href={`https://www.youtube.com/results?search_query=tibia+hunt+${encodeURIComponent(selectedHunt.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <ExternalLink size={13} /> Pesquisar Vídeos desta Hunt no YouTube
                      </a>
                    </div>
                  )}

                  {/* Dica de Puxada & Rotação */}
                  <div className="bg-black/70 border border-tibia-border rounded-2xl p-4 flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                      <Compass size={14} /> Estratégia de Puxada & Rotação (Pull Mechanics)
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {selectedHunt.pullStrategy}
                    </p>
                  </div>

                  {/* Fallback Search Button */}
                  <div className="flex justify-end">
                    <a
                      href={`https://www.youtube.com/results?search_query=tibia+hunt+${encodeURIComponent(selectedHunt.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-yellow-400/80 hover:text-yellow-300 flex items-center gap-1.5 underline decoration-yellow-500/50"
                    >
                      <Search size={12} /> Ver mais vídeos e POVs (Knight, Paladin, Mage) no YouTube
                    </a>
                  </div>

                </div>
              )}

              {/* ABA 2: PROTEÇÕES & IMBUEMENTS */}
              {modalTab === 'protection' && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  
                  {/* Prioridades Elementais */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                      <Shield size={14} /> Resistências Elementais Recomendadas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedHunt.protectionPriorities?.map((p, idx) => (
                        <div key={idx} className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-200">{p.element}</span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">{p.percent}</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: p.percent }} />
                          </div>
                          <span className="text-[11px] text-gray-400 mt-1">{p.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Imbuements por Equipamento */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                      <Sparkles size={14} /> Imbuements Recomendados (Tier 3 Powerful)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">⚔️ Arma / Weapon:</span>
                        <span className="text-yellow-300 font-semibold">{selectedHunt.imbuements.weapon}</span>
                      </div>
                      <div className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">🛡️ Armadura / Armor:</span>
                        <span className="text-yellow-300 font-semibold">{selectedHunt.imbuements.armor}</span>
                      </div>
                      <div className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">👑 Elmo / Helmet:</span>
                        <span className="text-yellow-300 font-semibold">{selectedHunt.imbuements.helmet}</span>
                      </div>
                      <div className="bg-black/70 border border-tibia-border p-3.5 rounded-2xl flex flex-col gap-1">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">🛡️ Escudo / Shield / Quiver:</span>
                        <span className="text-yellow-300 font-semibold">{selectedHunt.imbuements.shield}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ABA 3: BEST CHARMS & MONSTROS */}
              {modalTab === 'charms' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                    <Sparkles size={14} /> Charms Ideais por Monstro & Fraquezas
                  </h4>
                  <div className="flex flex-col gap-3">
                    {selectedHunt.charms?.map((c, idx) => (
                      <div key={idx} className="bg-black/70 border border-tibia-border p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <h5 className="text-sm font-bold text-yellow-400">{c.monster}</h5>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Fraqueza Elemental: <strong className="text-emerald-400">{c.weakness}</strong>
                          </p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-xl text-right">
                          <span className="text-[10px] text-gray-400 uppercase block font-bold">Best Charm:</span>
                          <span className="text-xs font-bold text-yellow-300">{c.charm}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 4: FUNÇÕES DA PARTY */}
              {modalTab === 'roles' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                    <Users size={14} /> Posicionamento e Rotações de Cada Vocação
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    
                    <div className="bg-black/70 border border-red-500/30 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="font-bold text-red-400 flex items-center gap-1 text-sm">
                        🛡️ Elite Knight (EK)
                      </span>
                      <p className="text-gray-300 leading-relaxed">
                        {selectedHunt.roles?.ek || 'Foco em trapar o box e manter Exeta Res sincronizado no cooldown.'}
                      </p>
                    </div>

                    <div className="bg-black/70 border border-blue-500/30 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="font-bold text-blue-400 flex items-center gap-1 text-sm">
                        🌿 Elder Druid (ED)
                      </span>
                      <p className="text-gray-300 leading-relaxed">
                        {selectedHunt.roles?.ed || 'Sio no EK, Mass Healing com a party alinhada e suporte de gelo/terra.'}
                      </p>
                    </div>

                    <div className="bg-black/70 border border-purple-500/30 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="font-bold text-purple-400 flex items-center gap-1 text-sm">
                        ⚡ Master Sorcerer (MS)
                      </span>
                      <p className="text-gray-300 leading-relaxed">
                        {selectedHunt.roles?.ms || 'Debuff de Sap Strength, exposição de dano e rotação de waves elementais.'}
                      </p>
                    </div>

                    <div className="bg-black/70 border border-emerald-500/30 p-4 rounded-2xl flex flex-col gap-1.5">
                      <span className="font-bold text-emerald-400 flex items-center gap-1 text-sm">
                        🏹 Royal Paladin (RP)
                      </span>
                      <p className="text-gray-300 leading-relaxed">
                        {selectedHunt.roles?.rp || 'Diamond Arrows contínuas, Mas San sincronizado e off-tanking de criaturas soltas.'}
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-tibia-border bg-black/95 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <span className="text-gray-400 text-center sm:text-left">
                💡 Dica RubinOT: Lembre-se de verificar se o respawn possui leilão ou claim ativo no servidor.
              </span>
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all shadow-lg"
              >
                Fechar Detalhes
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Banner de Anúncios AdSense */}
      <AdBanner slot="hunt_finder_footer" format="horizontal" />
    </div>
  );
}
