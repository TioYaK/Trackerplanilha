// Base de Dados de Quests e Acessos Resumidos (Passo a Passo com Checklists)
// Focado em alta velocidade, spoilers práticos de NPCs, suprimentos e locais liberados

export const QUEST_CATEGORIES = [
  { id: 'ALL', label: 'Todas as Quests', color: 'text-yellow-400' },
  { id: 'endgame', label: 'Endgame & Taints (Level 600+)', color: 'text-rose-400' },
  { id: 'meta_access', label: 'Acessos Meta & Hunts (Level 250+)', color: 'text-cyan-400' },
  { id: 'boss_access', label: 'Acesso a Bosses Diários & 20h', color: 'text-purple-400' },
  { id: 'utility', label: 'Utilitárias & Clássicas do Tibia', color: 'text-emerald-400' }
];

export const QUESTS_DATABASE = [
  // ==========================================
  // --- ENDGAME ---
  // ==========================================
  {
    id: 'rotten-blood-access',
    name: 'Rotten Blood: Acesso Completo & 4 Portais',
    category: 'endgame',
    recommendedLevel: 900,
    estimatedTime: '45 - 90 min',
    requiredItems: ['Level 900+', 'Might Rings (10+)', 'Stone Skin Amulets (15+)', 'Supreme Health/Mana Potions'],
    rewards: ['Acesso a Jaded Roots, Darklight Core, Putrefactory e Gloom Pillars', 'Acesso ao Bakragore (Boss Final)'],
    huntsUnlocked: ['Rotten Blood: Jaded Roots', 'Rotten Blood: Darklight Core', 'Rotten Blood: Putrefactory', 'Rotten Blood: Gloom Pillars'],
    bossesUnlocked: ['Bakragore', 'Murk', 'Chagorz', 'Ichgahal', 'Vemiath'],
    shortDescription: 'O maior desafio do Tibia. Libera os 4 ramos de Rotten Blood e a câmara do temido Bakragore sob o sistema de Taints.',
    steps: [
      {
        id: 'rb-1',
        title: 'Entrada pelo Buried Cathedral',
        npc: 'Teleport Secreto',
        dialogue: 'Descer até o andar mais profundo do Buried Cathedral em Kilmaresh.',
        description: 'Vá até o último subsolo da Buried Cathedral (-4). Encontre o portal corrompido pulsando em vermelho escuro para adentrar o Santuário de Sangue.',
        tip: 'Mages devem manter Energy Ring ou Utamo Vita ativo ao atravessar o portal.',
        danger: 5
      },
      {
        id: 'rb-2',
        title: 'Comunhão com o Tainted Crucible',
        npc: 'Tainted Crucible',
        dialogue: 'Dar use no altar de sacrifício central.',
        description: 'No saguão central de Rotten Blood, interaja com o Tainted Crucible para receber o Taint inicial e sintonizar os 4 caminhos dimensionais.',
        tip: 'Entenda que cada Taint adicional reduz o healing recebido e amplifica o dano sofrido.',
        danger: 3
      },
      {
        id: 'rb-3',
        title: 'Liberar os 4 Caminhos (Roots, Core, Putrefactory, Pillars)',
        npc: 'Portais Elementais',
        dialogue: 'Sobreviver ao percurso e ativar as 4 runas de sangue.',
        description: 'Percorra o início de cada um dos quatro caminhos enfrentando os mobs de cada área e acione as alavancas rúnicas para desbloquear o respawn permanente.',
        tip: 'Jaded Roots = Terra/Physical, Darklight = Energy/Death, Putrefactory = Terra/Death, Gloom = Holy/Physical.',
        danger: 5
      },
      {
        id: 'rb-4',
        title: 'Sintonia do Bakragore Sanctum',
        npc: 'Bakragore Eye',
        dialogue: 'Alavanca de time (5 players).',
        description: 'Com os 4 caminhos visitados e os bosses menores derrotados, a party pode puxar a alavanca do boss final Bakragore com o nível de Taints desejado.',
        tip: 'Verifique se toda a party está com Might Rings e Stone Skins prontos na hotkey.',
        danger: 5
      }
    ]
  },
  {
    id: 'soul-war-access',
    name: 'Soul War: Acesso aos 5 Portais & Goshnar',
    category: 'endgame',
    recommendedLevel: 750,
    estimatedTime: '2 a 3 horas',
    requiredItems: ['Level 400+ (Recomendado 750+ para caçar)', 'Rope', 'Shovel', 'Energy Rings', 'Might Rings'],
    rewards: ['Acesso aos 5 terrenos de Soul War', 'Acesso a Goshnar\'s Megalomania e Mini-bosses'],
    huntsUnlocked: ['Soul War: Rotten Wasteland', 'Soul War: Ebb and Flow', 'Soul War: Furious Crater', 'Soul War: Claustrophobic Inferno', 'Soul War: Mirrored Nightmare'],
    bossesUnlocked: ['Goshnar\'s Megalomania', 'Goshnar\'s Malice', 'Goshnar\'s Cruelty', 'Goshnar\'s Spite', 'Goshnar\'s Hatred', 'Goshnar\'s Greed'],
    shortDescription: 'A saga dos horrores de Goshnar em Thais/Cemetery. Acesso aos 5 spots lendários de Soul War.',
    steps: [
      {
        id: 'sw-1',
        title: 'Falar com Fardos Shrine em Thais',
        npc: 'Shrine of the White Raven',
        dialogue: 'hi -> soul war -> investigate -> yes',
        description: 'Vá ao monastério de Thais e investigue o santuário corrompido para iniciar a investigação do retorno de Goshnar.',
        tip: 'Anote as coordenadas das fendas espirituais.',
        danger: 2
      },
      {
        id: 'sw-2',
        title: 'Acesso ao Ebb and Flow (Mares Espirituais)',
        npc: 'Portal das Almas',
        dialogue: 'Atravessar a fenda submersa.',
        description: 'Localizado através do atalho marítimo. Exige nadar pelas águas espirituais desviando dos peixes espectrais.',
        tip: 'Cuidado com os Fear Feasters que drenam mana instantaneamente.',
        danger: 4
      },
      {
        id: 'sw-3',
        title: 'Acesso a Furious Crater & Claustrophobic Inferno',
        npc: 'Cratera Vulcânica',
        dialogue: 'Pisar nas cinzas de magma.',
        description: 'Entre na cratera e desça até os corredores estreitos de magma onde habitam os Brachiodemons e Infernal Phantoms.',
        tip: 'Proteção de Fire e Death de no mínimo 40% cada.',
        danger: 5
      },
      {
        id: 'sw-4',
        title: 'Acesso a Rotten Wasteland & Mirrored Nightmare',
        npc: 'Portal do Pântano',
        dialogue: 'Usar a essência purificada na fenda do pesadelo.',
        description: 'Acesse o pântano pútrido e as salas espelhadas de Mirrored Nightmare após derrotar os emissários espectrais.',
        tip: 'O Knight deve lurar de costas para evitar a wave de debuff dos Many Faces.',
        danger: 5
      }
    ]
  },
  {
    id: 'secret-library-access',
    name: 'Secret Library: Acesso às 4 Alas Elementais',
    category: 'endgame',
    recommendedLevel: 500,
    estimatedTime: '60 min',
    requiredItems: ['Level 250+ (Hunt 500+)', 'Inquisition completa', 'Dwarven Ring', 'Suprimentos de time'],
    rewards: ['Acesso à Secret Library (Fire, Ice, Energy e Death)', 'Acesso ao boss The Scourge of Oblivion'],
    huntsUnlocked: ['Secret Library: Fire Section', 'Secret Library: Ice Section', 'Secret Library: Energy Section', 'Secret Library: Death Section'],
    bossesUnlocked: ['The Scourge of Oblivion', 'Gorzindel', 'Lokathmor', 'Mazzinor', 'Ghulosh'],
    shortDescription: 'A biblioteca proibida de Asura Palace/Darashia. Caçadas de altíssima experiência em 4 seções elementais.',
    steps: [
      {
        id: 'lib-1',
        title: 'Encontrar a entrada secreta de Asura Palace',
        npc: 'Alavanca do Espelho',
        dialogue: 'Dar use no espelho secreto no subsolo do Palácio das Asuras.',
        description: 'Desça até o subsolo do Asura Palace e ative o mecanismo secreto que revela a escadaria da biblioteca antiga.',
        tip: 'Leve Stealth Ring para passar pelas Asuras no caminho sem tomar travas.',
        danger: 3
      },
      {
        id: 'lib-2',
        title: 'Desbloquear as 4 Chaves dos Tomos',
        npc: 'Ancient Knowledge Altar',
        dialogue: 'hi -> knowledge -> unlock -> examine',
        description: 'Interaja com as 4 estantes de livros antigas localizadas nos cantos da biblioteca para sintonizar as alas de Fogo, Gelo, Energia e Morte.',
        tip: 'Cuidado com os Ink Blobs e Animated Books que aplicam Silence e Paralyze contínuo.',
        danger: 4
      },
      {
        id: 'lib-3',
        title: 'Acesso definitivo aos portais de Hunt',
        npc: 'Grand Archive Gate',
        dialogue: 'Entrar na barreira mágica elemental.',
        description: 'Agora a party pode caçar livremente em qualquer uma das 4 alas ou puxar as alavancas dos mini-bosses da biblioteca.',
        tip: 'Ala de Fogo exige proteção contra Fire e Death. Ala de Gelo exige proteção contra Ice e Energy.',
        danger: 4
      }
    ]
  },

  // ==========================================
  // --- METAS DE ACESSO & HUNTS ---
  // ==========================================
  {
    id: 'inquisition-quest',
    name: 'The Inquisition Quest (Acesso Geral & Blessings)',
    category: 'meta_access',
    recommendedLevel: 100,
    estimatedTime: '2 a 3 horas (em Service ou Time)',
    requiredItems: ['Holy Water (fornecida na quest)', 'Vampire Teeth', 'Demon Horn', 'Flask of Embalming Fluid'],
    rewards: ['Acesso a Henricus para comprar todas as 5 Blessings de uma vez', 'Acesso a The Vats, Blood Pits, Shadow Nexus', 'Demon Hunter Outfit', 'Escolha entre: Demon Shield / Vampire Shield / Spellbook of Dark Mysteries'],
    huntsUnlocked: ['The Inquisition: The Vats (Ushuriel)', 'Pits of Inferno: Dark Torturers City (PoI)', 'MotA Fury Dungeon (Museum of Arts)'],
    bossesUnlocked: ['Ushuriel', 'Zugurosh', 'Madareth', 'Annihilon', 'Hellgorak', 'Latrivan & Golgordan'],
    shortDescription: 'A quest mais importante da história do Tibia. Libera a compra rápida de bênçãos no Henricus e áreas de caça lendárias.',
    steps: [
      {
        id: 'inq-1',
        title: 'Iniciar com Henricus em Thais',
        npc: 'Henricus (Thais)',
        dialogue: 'hi -> inquisition -> mission -> yes (repetir até receber a primeira missão)',
        description: 'Fale com Henricus no quartel-general da Inquisição em Thais. Responda às perguntas jurando lealdade à inquisição.',
        tip: 'Não feche o diálogo sem confirmar com "yes".',
        danger: 1
      },
      {
        id: 'inq-2',
        title: 'Missões 1 a 6 (Investigações & Bruxas)',
        npc: 'Vários NPCs pelo continente',
        dialogue: 'Fazer as inspeções em Carlin, Fidera, Edron e Darashia.',
        description: 'Use a Holy Water nos locais profanados e colete os relatórios dos inquisidores.',
        tip: 'Pode ser feito em 20 minutos usando barcos e tapetes.',
        danger: 2
      },
      {
        id: 'inq-3',
        title: 'Missão 7: Os 7 Selos da Inquisição (The Seven Seals)',
        npc: 'Teleports de Thais/Inq',
        dialogue: 'Derrotar os 7 bosses: Ushuriel, Zugurosh, Madareth, Annihilon, Hellgorak, Golgordan/Latrivan e Demon Outburst.',
        description: 'Avançar pelos salões de tortura e fogo, pisando nos 7 portais e matando os chefes para purificar os selos.',
        tip: 'Zugurosh dropa Golden Boots e itens de valor absurdo.',
        danger: 4
      },
      {
        id: 'inq-4',
        title: 'Finalização & Recompensa com Henricus',
        npc: 'Henricus',
        dialogue: 'hi -> mission -> yes -> reward',
        description: 'Fale com Henricus para receber a bênção do inquisidor e liberar a opção de comprar as 5 blessings normais instantaneamente com uma só frase.',
        tip: 'Frase mágica do Henricus: "hi -> blessings -> yes". Nunca mais perca tempo andando pelas cidades!',
        danger: 1
      }
    ]
  },
  {
    id: 'wrath-of-the-emperor',
    name: 'Wrath of the Emperor (WotE) - Zao Completo',
    category: 'meta_access',
    recommendedLevel: 130,
    estimatedTime: '2 horas',
    requiredItems: ['The New Frontier completada até a missão 8', 'Pick', 'Machete', 'Cana de Açúcar / Canais de Zao'],
    rewards: ['Acesso a Draken Walls (Razachai)', 'Acesso ao Emperor Palace e Chayenne', 'Escolha de item: Royal Drakonian Armor, Elite Draken Helmet, ou Royal Scale Robe'],
    huntsUnlocked: ['Draken Walls (Razachai)', 'Dragonblaze Peaks: Draken Elite & Warmasters (Zao)', 'Lizard Chosen: Corruption Hole (Zao)'],
    bossesUnlocked: ['Snake God Essence', 'Fury of the Emperor', 'Spite of the Emperor', 'Wrath of the Emperor'],
    shortDescription: 'A saga de libertação de Zao. Desbloqueia a lendária hunt de Draken Walls e armaduras de alto tier.',
    steps: [
      {
        id: 'wote-1',
        title: 'Missões 1 a 3: Infiltração em Razachai',
        npc: 'Zalamon (Muggy Plains)',
        dialogue: 'hi -> mission -> yes',
        description: 'Fale com o xamã Zalamon no acampamento rebelde e invada o palácio dos répteis.',
        tip: 'Leve Dwarven Ring para não ficar bêbado nos dutos.',
        danger: 2
      },
      {
        id: 'wote-2',
        title: 'Missão 4: O Labirinto das Plantas Carnívoras',
        npc: 'Caminho de Vinhas',
        dialogue: 'Cortar as vinhas com machete e evitar os guardas.',
        description: 'Passe pelo pátio furtivo sem ser detectado pelos sentinelas lagartos.',
        tip: 'Siga rigorosamente as linhas de sombra para não ser mandado de volta à prisão.',
        danger: 2
      },
      {
        id: 'wote-3',
        title: 'Missões 8 a 10: As 4 Portas dos Rebeldes & Boss Fight',
        npc: 'Zalamon',
        dialogue: 'hi -> mission -> emperor',
        description: 'Enfrente as 4 encarnações da fúria do imperador e quebre o orbe sagrado do Deus Serpente.',
        tip: 'Tenha o Druid curando em área constante contra os summons de lava.',
        danger: 4
      },
      {
        id: 'wote-4',
        title: 'Recompensa Imperial',
        npc: 'Baús do Tesouro Imperial',
        dialogue: 'Dar use no baú da sua vocação.',
        description: 'Colete sua armadura ou capacete draken de elite e aproveite o livre acesso a Draken Walls.',
        tip: 'Elite Draken Helmet e Royal Scale Robe são altamente cotados no mercado.',
        danger: 1
      }
    ]
  },
  {
    id: 'asura-mirror-access',
    name: 'Asura Palace & Mirror: Acesso ao Espelho Secreto',
    category: 'meta_access',
    recommendedLevel: 250,
    estimatedTime: '20 min',
    requiredItems: ['Small Enchanted Ruby (1x)', 'Small Enchanted Sapphire (1x)', 'Small Enchanted Amethyst (1x)', 'Small Enchanted Emerald (1x)'],
    rewards: ['Acesso ao Asura Mirror (True Asuras: Midnight, Dawnfire e Frost Flower)', 'Um dos melhores spots de XP e Profit Solo do Tibia'],
    huntsUnlocked: ['True Asuras (Asura Mirror)', 'Asura Palace (Lower Floors & Balcony)'],
    bossesUnlocked: ['The Flaming Orchid', 'The Moonlight Aster'],
    shortDescription: 'O portal dimensional atrás da tapeçaria do Asura Palace. Permite caçar as True Asuras no espelho.',
    steps: [
      {
        id: 'asura-1',
        title: 'Limpar o terraço do Asura Palace',
        npc: 'Alavanca do Topo',
        dialogue: 'Subir até o último andar do palácio.',
        description: 'Vá até o palácio na selva de Port Hope e suba até o terraço eliminando Dawnfire e Midnight Asuras.',
        tip: 'Cuidado com os Beams de Mana Drain das Frost Flowers.',
        danger: 3
      },
      {
        id: 'asura-2',
        title: 'Ativar a bacia com as 4 jóias encantadas',
        npc: 'Mystic Basin',
        dialogue: 'Usar as gemas encantadas (Ruby, Sapphire, Amethyst, Emerald) no receptáculo.',
        description: 'Encontre o altar escondido no pátio dos fundos e insira as 4 pedras mágicas.',
        tip: 'Compre as gemas já encantadas no Market para não perder tempo com mana waste.',
        danger: 2
      },
      {
        id: 'asura-3',
        title: 'Atravessar o Espelho Encantado',
        npc: 'The Mirror Portal',
        dialogue: 'Dar use no grande espelho de moldura dourada.',
        description: 'O espelho agora funcionará como portal bidirecional para a dimensão espelhada das True Asuras.',
        tip: 'Acesso permanente liberado para sempre no char!',
        danger: 3
      }
    ]
  },
  {
    id: 'pits-of-inferno',
    name: 'Pits of Inferno (PoI) - Os 7 Tronos e Alavancas',
    category: 'meta_access',
    recommendedLevel: 80,
    estimatedTime: '2 horas',
    requiredItems: ['Rope', 'Shovel', 'Pick', 'Holy Tinsel', 'Vampire Dust', '2000 GP'],
    rewards: ['Acesso permanente aos atalhos de PoI', 'Soft Boots', 'Backpack of Holding', 'Arcane Staff ou Avenger ou Arbalest'],
    huntsUnlocked: ['Pits of Inferno: Dark Torturers City (PoI)', 'Pits of Inferno: Phantasm & Spectre Halls', 'Pits of Inferno: Blood Pits & Dragon Lords (PoI D-Lair)'],
    bossesUnlocked: ['The Handmaiden', 'Massacre', 'Dracola', 'Countess Sorrow', 'Mr. Punish'],
    shortDescription: 'A lendária descida aos Pits of Inferno em Plains of Havoc. Conquista da cobiçada Soft Boots.',
    steps: [
      {
        id: 'poi-1',
        title: 'As 15 Alavancas de Plains of Havoc',
        npc: 'Alavancas da Necrópole',
        dialogue: 'Puxar as 15 alavancas na ordem correta.',
        description: 'No subsolo de PoH, coordene o acionamento das alavancas para abaixar a ponte de pedra que dá acesso ao PoI.',
        tip: 'Se for em Service com a guilda, a ponte geralmente já está aberta.',
        danger: 2
      },
      {
        id: 'poi-2',
        title: 'O Labirinto de Fogo & Pisos de Lava',
        npc: 'Pisos Sagrados',
        dialogue: 'Andar sobre o caminho iluminado.',
        description: 'Passe pelos corredores de lava fervente usando Destroy Field ou Firewalker Boots.',
        tip: 'Nunca ande fora do piso correto para não tomar hit contínuo de 500+ de fogo.',
        danger: 3
      },
      {
        id: 'poi-3',
        title: 'Os 7 Tronos dos Lordes Demoníacos',
        npc: 'Tronos Elementais',
        dialogue: 'Dar use em cada um dos 7 tronos (Bazir, Infernatil, Tafariel, etc.).',
        description: 'Entre em cada uma das 7 salas secretas enfrentando hordas de Dark Torturers, Juggernauts, Spectres e Hellhounds para tocar o trono correspondente.',
        tip: 'Toque todos os 7 tronos para abrir a sala do tesouro final.',
        danger: 4
      },
      {
        id: 'poi-4',
        title: 'A Sala do Tesouro & Soft Boots',
        npc: 'Baús do Tesouro de PoI',
        dialogue: 'Dar use nos 4 baús da sala final.',
        description: 'Pegue sua cobiçada Soft Boots, Backpack of Holding e arma de escolha.',
        tip: 'Parabéns! Você agora tem a bota mais icônica do jogo e atalhos liberados.',
        danger: 1
      }
    ]
  },

  // ==========================================
  // --- BOSS ACCESS ---
  // ==========================================
  {
    id: 'cobra-falcon-bastion',
    name: 'Cobra & Falcon Bastion (Scarlett & Oberon)',
    category: 'boss_access',
    recommendedLevel: 250,
    estimatedTime: '30 min',
    requiredItems: ['Grave Danger pré-requisito parcial', 'Cobra Tongue', 'Falcon Crest'],
    rewards: ['Acesso diário a Scarlett Etzel (Cobra items BiS)', 'Acesso diário a Grand Master Oberon (Falcon items BiS)'],
    huntsUnlocked: ['Cobra Bastion', 'Falcon Bastion'],
    bossesUnlocked: ['Scarlett Etzel', 'Grand Master Oberon'],
    shortDescription: 'Os dois bosses diários mais lucrativos do jogo. Chances de Cobra Club/Wand/Boots e Falcon Greaves/Plate.',
    steps: [
      {
        id: 'bastion-1',
        title: 'Acesso a Falcon Bastion (Edron)',
        npc: 'Bounac / Edron Coast',
        dialogue: 'Navegar com o capitão até a ilha de Falcon.',
        description: 'Pegue o barco secreto para a ilha de Falcon Bastion e avance pelos pátios até a torre do Oberon.',
        tip: 'Mecânica do Oberon: Use as frases nas perguntas dele para quebrar a imunidade.',
        danger: 3
      },
      {
        id: 'bastion-2',
        title: 'Mecânica das Frases do Grand Master Oberon',
        npc: 'Grand Master Oberon',
        dialogue: 'Frases de resposta obrigatórias no chat local.',
        description: 'Quando Oberon gritar no chat, responda com a frase oposta exata para deixá-lo vulnerável ao ataque.',
        tip: 'Frases clássicas: "Then show me your strength!", "Are you ever going to fight?", etc.',
        danger: 3
      },
      {
        id: 'bastion-3',
        title: 'Acesso a Cobra Bastion (Ankrahmun)',
        npc: 'Cobra Gatekeeper',
        dialogue: 'Investigar a pirâmide ao norte de Ankrahmun.',
        description: 'Vá até o bastião das serpentes e suba até a câmara da Scarlett Etzel.',
        tip: 'Mecânica da Scarlett: Use o espelho de bronze nos pilares de luz para refletir o tiro na Scarlett quando ela estiver armada.',
        danger: 2
      }
    ]
  },
  {
    id: 'feaster-of-souls-access',
    name: 'Feaster of Souls: Acesso aos 5 Bosses & Brain Head',
    category: 'boss_access',
    recommendedLevel: 250,
    estimatedTime: '60 min',
    requiredItems: ['Level 250+', 'Vesperoth Bones', 'Soul Vessel'],
    rewards: ['Acesso a Thaian, Bane of Light, Unaz the Mean, Irgix the Flimsy e Brain Head', 'Drop de Soul items e Ghost Backpack'],
    huntsUnlocked: ['Bounac Castle (Lion Sanctum)', 'Buried Cathedral -3 / -4'],
    bossesUnlocked: ['The Brain Head', 'Thaian', 'Bane of Light', 'Unaz the Mean', 'Irgix the Flimsy'],
    shortDescription: 'Série de chefes sombrios com alta chance de drop de equipamentos fantasmagóricos.',
    steps: [
      {
        id: 'fos-1',
        title: 'Falar com a Ordem dos Espectros em Port Hope',
        npc: 'Ghostly Apparition',
        dialogue: 'hi -> feaster -> soul -> yes',
        description: 'Inicie a quest nas ruínas assombradas de Port Hope para receber o receptáculo espiritual.',
        tip: 'Carregue o receptáculo matando os monstros indicados.',
        danger: 2
      },
      {
        id: 'fos-2',
        title: 'Purificar os 4 Mini-bosses',
        npc: 'Alavancas de Boss',
        dialogue: 'Puxar as alavancas de time em dupla ou trio.',
        description: 'Derrote Thaian, Bane of Light, Unaz e Irgix nas suas respectivas câmaras assombradas.',
        tip: 'Cada boss possui uma fraqueza específica e mecânica de campo de força.',
        danger: 3
      },
      {
        id: 'fos-3',
        title: 'Acesso ao Brain Head',
        npc: 'Central Portal',
        dialogue: 'Entrar na mente corrompida.',
        description: 'Com os 4 mini-bosses derrotados, o portal central para o cérebro colossal é liberado permanentemente.',
        tip: 'Mate os neurônios cinzas antes que eles detonem na sala.',
        danger: 4
      }
    ]
  },

  // ==========================================
  // --- UTILITÁRIAS & CLÁSSICAS ---
  // ==========================================
  {
    id: 'postman-quest',
    name: 'The Postman Missions (Correios & Royal Mail)',
    category: 'utility',
    recommendedLevel: 30,
    estimatedTime: '60 - 90 min',
    requiredItems: ['Crowbar', '20 Bones', '1 Banana Skin', '500 GP'],
    rewards: ['Desconto de 5 GP em todas as parcels e letters', 'Acesso a caixas de correio exclusivas protegidas por portas seladas (ex: Kazordoon, Mintwallin, D-Lairs)', 'Post Officer Hat'],
    huntsUnlocked: ['Corym Black Market & Tunnels'],
    bossesUnlocked: [],
    shortDescription: 'A quest mais útil para lootbags e envio de parcels em respawns isolados sem precisar voltar ao banco.',
    steps: [
      {
        id: 'post-1',
        title: 'Iniciar com Kevin no Post Office (Kazordoon)',
        npc: 'Kevin (Post Office)',
        dialogue: 'hi -> mission -> yes',
        description: 'Encontre a agência central dos correios perto de Kazordoon e aliste-se como carteiro novato.',
        tip: 'Kevin sempre repete as regras do correio real.',
        danger: 1
      },
      {
        id: 'post-2',
        title: 'As 10 Rotas de Entrega Continental',
        npc: 'Vários carteiros pelo Tibia',
        dialogue: 'Entregar correspondências em Venore, Thais, Carlin e Kazordoon.',
        description: 'Complete as entregas expressas, destranque a caixa de correio emperrada com a Crowbar e viaje pelas capitais.',
        tip: 'Use barcos e tapetes para economizar tempo.',
        danger: 1
      },
      {
        id: 'post-3',
        title: 'Promoção a Archpostman',
        npc: 'Kevin',
        dialogue: 'hi -> advancement -> yes -> reward',
        description: 'Receba a patente máxima de carteiro real, habilitando abrir todas as portas com maçaneta azul de correio pelo mundo.',
        tip: 'Agora você pode jogar lootbags direto na mailbox dos respawns!',
        danger: 1
      }
    ]
  },
  {
    id: 'djinn-war-access',
    name: 'Djinn War: Green Djinn (Efreet) ou Blue Djinn (Marid)',
    category: 'utility',
    recommendedLevel: 40,
    estimatedTime: '45 min',
    requiredItems: ['Level 40+', 'Gemstone', 'Scarab Coin', 'Dwarven Ring'],
    rewards: ['Vender itens azuis e verdes para Alesar ou Nah\'Bob (Blue/Green PoC, armas mágicas, gemas, etc.)'],
    huntsUnlocked: ['Peninsula Tomb - Subsolo 4 (Ankrahmun Vampires)', 'Ankrahmun Tombs: Tarpit Tomb Deep (-4 / -5)'],
    bossesUnlocked: [],
    shortDescription: 'Essencial para negociar loots mágicos com os gênios de Ankrahmun sem taxas do Market.',
    steps: [
      {
        id: 'djinn-1',
        title: 'Escolher a Facção: Verde ou Azul',
        npc: 'Melchior (Ankrahmun) / Bo\'ques',
        dialogue: 'hi -> djinn -> faction',
        description: 'Decida se quer se aliar aos Efreet (Verdes / Mal\'ouquah) ou aos Marid (Azuis / Ashta\'daramai).',
        tip: 'Geralmente os jogadores em guilds dividem: metade faz Green e metade faz Blue.',
        danger: 2
      },
      {
        id: 'djinn-2',
        title: 'Provar Lealdade ao Rei dos Gênios',
        npc: 'King Gabel ou Malor',
        dialogue: 'hi -> mission -> yes',
        description: 'Infiltre-se na torre da facção rival e recupere a lâmpada sagrada do tesouro.',
        tip: 'Leve Stealth Ring para passar pelos Djinns sem gastar poções.',
        danger: 3
      },
      {
        id: 'djinn-3',
        title: 'Comércio Mágico Liberado',
        npc: 'Alesar (Green) ou Nah\'Bob (Blue)',
        dialogue: 'hi -> trade',
        description: 'Acesso permanente liberado aos mercadores gênios para vender jóias, armaduras mágicas e produtos de criaturas.',
        tip: 'Excelente para esvaziar a backpack de loot das hunts de forma instantânea!',
        danger: 1
      }
    ]
  }
];
