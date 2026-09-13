import React, { useState, useMemo } from 'react';
import { 
  Compass, Search, MapPin, Coins, Zap, Shield, Flame, Skull, 
  ExternalLink, Filter, Star, Sparkles, CheckCircle2 
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

const HUNTS_DATABASE = [
  {
    id: 'cobras',
    name: 'Cobra Bastion',
    city: 'Scarlett Island',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 450,
    recommendedLevel: 600,
    modes: ['Solo', 'Duo', 'Team 4x'],
    rawXp: '8.5M - 14M/h',
    profit: '1.2M - 2.5M/h',
    danger: 4,
    tags: ['Lucro Alto', 'XP Extrema', 'Best Charms'],
    elements: ['Earth', 'Physical'],
    charms: ['Freeze', 'Zap', 'Wound'],
    description: 'Um dos melhores respawns do jogo para Knights e Paladins solo, com drop de Cobra Sword/Crossbow e Cobra Items.'
  },
  {
    id: 'issavi-sewers',
    name: 'Issavi Sewers (Sphinx & Crypt)',
    city: 'Issavi',
    vocations: ['Mage', 'Paladin', 'Knight', 'Monk'],
    minLevel: 250,
    recommendedLevel: 400,
    modes: ['Solo', 'Duo'],
    rawXp: '6.0M - 11M/h',
    profit: '400k - 900k/h',
    danger: 3,
    tags: ['Rush de XP', 'Fácil de Correr'],
    elements: ['Holy', 'Fire'],
    charms: ['Enflame', 'Curse', 'Divine Wrath'],
    description: 'Respawn clássico de rush de mages e paladins na SD e avalanche. Excelente taxa de XP por hora.'
  },
  {
    id: 'buried-cathedral',
    name: 'Buried Cathedral',
    city: 'Venore / Otherworld',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 300,
    recommendedLevel: 450,
    modes: ['Team 4x'],
    rawXp: '7.0M - 12M/h',
    profit: '800k - 1.6M/h',
    danger: 4,
    tags: ['Ouro para 4x', 'Party Hunt Clássica'],
    elements: ['Death', 'Physical'],
    charms: ['Dodge', 'Freeze', 'Zap'],
    description: 'A hunt definitiva para times de 4 jogadores entre os níveis 300 e 500. Excelente sinergia de cura e dano.'
  },
  {
    id: 'nagas',
    name: 'Naga Temple (Marapur)',
    city: 'Marapur',
    vocations: ['Knight', 'Paladin', 'Monk'],
    minLevel: 500,
    recommendedLevel: 700,
    modes: ['Solo', 'Duo'],
    rawXp: '9.0M - 15M/h',
    profit: '1.5M - 3.2M/h',
    danger: 4,
    tags: ['Meta Rubinot', 'Lucro Máximo'],
    elements: ['Ice', 'Energy'],
    charms: ['Low Blow', 'Wound', 'Zap'],
    description: 'Respawn de altíssima rentabilidade em Gold e itens colecionáveis em Marapur.'
  },
  {
    id: 'soulwar-rotten',
    name: 'Rotten Wasteland (Soul War)',
    city: 'Thais (Soul War Hub)',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 800,
    recommendedLevel: 1100,
    modes: ['Team 4x'],
    rawXp: '18M - 32M/h',
    profit: '3.0M - 6.0M/h',
    danger: 5,
    tags: ['Endgame', 'Perigo Máximo', 'Melhor XP do Servidor'],
    elements: ['Death', 'Earth', 'Physical'],
    charms: ['Parry', 'Dodge', 'Curse', 'Freeze'],
    description: 'O ápice do Tibia endgame. Exige coordenação cirúrgica, imbuements Tier 3 e proteção máxima a Death.'
  },
  {
    id: 'exotic-cave',
    name: 'Exotic Bat & Spider Cave',
    city: 'Issavi (Exotic)',
    vocations: ['Knight', 'Paladin', 'Mage', 'Monk'],
    minLevel: 120,
    recommendedLevel: 180,
    modes: ['Solo'],
    rawXp: '2.5M - 4.5M/h',
    profit: '500k - 900k/h',
    danger: 1,
    tags: ['Iniciante/Médio', 'Mina de Ouro', 'Seguro'],
    elements: ['Physical', 'Earth'],
    charms: ['Wound', 'Zap'],
    description: 'A mina de ouro dos jogadores intermediários. Risco quase zero e lucro líquido de quase 1KK por hora para bancar supplies.'
  }
];

export default function HuntFinder({ onNavigate }) {
  const [selectedVoc, setSelectedVoc] = useState('ALL');
  const [levelRange, setLevelRange] = useState('all'); // 'all', '100-300', '300-500', '500-800', '800+'
  const [huntMode, setHuntMode] = useState('ALL'); // 'ALL', 'Solo', 'Team 4x'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHunts = useMemo(() => {
    return HUNTS_DATABASE.filter(h => {
      if (selectedVoc !== 'ALL' && !h.vocations.includes(selectedVoc)) return false;
      if (huntMode !== 'ALL' && !h.modes.includes(huntMode)) return false;
      
      if (levelRange === '100-300' && (h.minLevel > 300 || h.recommendedLevel < 100)) return false;
      if (levelRange === '300-500' && (h.minLevel > 500 || h.recommendedLevel < 300)) return false;
      if (levelRange === '500-800' && (h.minLevel > 800 || h.recommendedLevel < 500)) return false;
      if (levelRange === '800+' && h.minLevel < 700) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = h.name.toLowerCase().includes(q);
        const matchCity = h.city.toLowerCase().includes(q);
        const matchTag = h.tags.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchCity && !matchTag) return false;
      }

      return true;
    });
  }, [selectedVoc, levelRange, huntMode, searchQuery]);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              <Compass size={14} className="text-yellow-400" />
              Guia Estratégico de Respawns
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold">
              Hunt Finder 2.0 & Rotas
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
              Filtre os melhores respawns para sua vocação e level: descubra onde fazer o maior lucro, rushar XP máxima e quais imbuements usar nos 16 mundos de Rubinot.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-black/60 border border-tibia-border p-4 rounded-2xl flex flex-wrap items-center gap-4">
        
        {/* Vocação */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">Vocação:</span>
          <select
            value={selectedVoc}
            onChange={(e) => setSelectedVoc(e.target.value)}
            className="bg-black/80 border border-tibia-border rounded-xl px-3 py-1.5 text-xs text-yellow-400 font-bold focus:outline-none"
          >
            <option value="ALL">Todas Vocações</option>
            <option value="Knight">Knight</option>
            <option value="Paladin">Paladin</option>
            <option value="Mage">Mage (MS/ED)</option>
            <option value="Monk">Monk</option>
          </select>
        </div>

        {/* Level */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">Level:</span>
          <select
            value={levelRange}
            onChange={(e) => setLevelRange(e.target.value)}
            className="bg-black/80 border border-tibia-border rounded-xl px-3 py-1.5 text-xs text-yellow-400 font-bold focus:outline-none"
          >
            <option value="all">Todos os Níveis</option>
            <option value="100-300">Level 100 - 300</option>
            <option value="300-500">Level 300 - 500</option>
            <option value="500-800">Level 500 - 800</option>
            <option value="800+">Level 800+ (Endgame)</option>
          </select>
        </div>

        {/* Modo */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">Modo:</span>
          <select
            value={huntMode}
            onChange={(e) => setHuntMode(e.target.value)}
            className="bg-black/80 border border-tibia-border rounded-xl px-3 py-1.5 text-xs text-yellow-400 font-bold focus:outline-none"
          >
            <option value="ALL">Solo & Time</option>
            <option value="Solo">Solo</option>
            <option value="Team 4x">Team Hunt 4x</option>
          </select>
        </div>

        {/* Busca */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={15} />
            <input
              type="text"
              placeholder="Buscar por respawn, monstro ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/80 border border-tibia-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

      </div>

      {/* Lista de Hunts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHunts.map(hunt => (
          <div 
            key={hunt.id}
            className="bg-black/70 border border-tibia-border hover:border-yellow-500/50 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-lg hover:shadow-yellow-500/5"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-medieval text-yellow-400">{hunt.name}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-red-400" /> {hunt.city} | Rec. Level: <strong className="text-white">{hunt.recommendedLevel}+</strong>
                  </p>
                </div>

                <div className="flex gap-1" title={`Perigo: ${hunt.danger} de 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skull 
                      key={i} 
                      size={13} 
                      className={i < hunt.danger ? 'text-red-500' : 'text-gray-700'} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed mb-3">
                {hunt.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {hunt.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 text-[10px] font-bold rounded-md">
                    {t}
                  </span>
                ))}
                {hunt.modes.map(m => (
                  <span key={m} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold rounded-md">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Rodapé de Estatísticas */}
            <div className="pt-3 border-t border-tibia-border/50 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/50 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block">XP Média:</span>
                <span className="font-bold text-green-400 font-mono">{hunt.rawXp}</span>
              </div>

              <div className="bg-black/50 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block">Lucro Médio:</span>
                <span className="font-bold text-yellow-400 font-mono">{hunt.profit}</span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Banner de Anúncios AdSense */}
      <AdBanner slot="hunt_finder_footer" format="horizontal" />
    </div>
  );
}
