import React, { useState, useMemo } from 'react';
import { Compass, Sparkles, Shield, Zap, Flame, Award, Copy, Check, ChevronRight } from 'lucide-react';

const VOCATION_BUILDS = {
  knight: {
    name: 'Elite Knight',
    icon: '⚔️',
    color: 'text-red-400 border-red-500/30',
    builds: [
      {
        id: 'ek_berserk',
        name: 'Solo Hunt Berserk (Dano Brutal)',
        focus: 'Dano de Corte & Executioner Throw',
        pointsReq: 450,
        description: 'Foco total em amplificar o Fierce Berserk e habilitar o Executioner\'s Throw com crítico ampliado para limpar caixas de monstros rapidamente.',
        perks: ['Executioner\'s Throw Rank II', 'Fierce Berserk +8% Dano', 'Físico Mitigation +3.2%', 'Life Leech Boost +2.5%'],
        quadrants: 'Noroeste (Foco Ofensivo) + Sudoeste (Resistência)'
      },
      {
        id: 'ek_war_wall',
        name: 'War Defense Wall (Tanque Militar)',
        focus: 'Avatar of Steel & Mitigação Máxima',
        pointsReq: 650,
        description: 'Construída para segurar traps e sobreviver a combos massivos de PvP. Libera o Avatar of Steel com 15% de redução de dano geral.',
        perks: ['Avatar of Steel Desbloqueado', 'Mitigação Geral +6.0%', 'Health Pool +450 HP', 'Dodge Chance +3%'],
        quadrants: 'Sudoeste e Sudeste (Defensivo Puro)'
      }
    ]
  },
  druid: {
    name: 'Elder Druid',
    icon: '🌿',
    color: 'text-emerald-400 border-emerald-500/30',
    builds: [
      {
        id: 'ed_healer',
        name: 'Mega Mass Sio Healer (Team Hunt)',
        focus: 'Mass Healing & Nature\'s Embrace',
        pointsReq: 500,
        description: 'A build definitiva para manter o Knight vivo nas hunts mais perigosas do jogo (Rotten Blood / Soul War) com cura em área aprimorada.',
        perks: ['Nature\'s Embrace Acelerado', 'Mass Healing +15% Cura', 'Mana Pool +600 MP', 'Cooldown Reduction em 1s'],
        quadrants: 'Nordeste (Suporte & Cura) + Sudeste'
      },
      {
        id: 'ed_ice_burst',
        name: 'Ice Avalanche Destroyer (Solo Hunt)',
        focus: 'Strong Ice Wave & Dano de Gelo',
        pointsReq: 550,
        description: 'Maximiza a área e dano do Strong Ice Wave (Exevo Gran Frigo Hur) com crítico elemental devastador.',
        perks: ['Strong Ice Wave Rank II', 'Ice Damage +10%', 'Spell Crit Chance +4%', 'Gelo Resistance +5%'],
        quadrants: 'Noroeste (Dano Elemental Gelo)'
      }
    ]
  },
  sorcerer: {
    name: 'Master Sorcerer',
    icon: '🔥',
    color: 'text-orange-400 border-orange-500/30',
    builds: [
      {
        id: 'ms_hellfire',
        name: 'Hellfire Cataclysm Burst (Máximo Dano AoE)',
        focus: 'Great Fire Wave & Hell\'s Core',
        pointsReq: 500,
        description: 'A maior máquina de dano do jogo. Amplifica a Great Fire Wave e reduz o cooldown do Hell\'s Core para derreter qualquer pull de monstros.',
        perks: ['Great Fire Wave Rank II (+12% dano)', 'Hell\'s Core Redução de Cooldown', 'Fire Magic Level +4', 'Mana Leech Boost'],
        quadrants: 'Noroeste (Fogo) + Nordeste (Energia)'
      },
      {
        id: 'ms_curse',
        name: 'Death Curse & Exposure (War PvP)',
        focus: 'Expose Weakness & Wand Charge',
        pointsReq: 600,
        description: 'Especializada em debuffar os inimigos na War com Expose Weakness em área e dano de morte concentrado.',
        perks: ['Expose Weakness Amplificado (+5% dano do time)', 'Death Damage +8%', 'Avatar of Fire', 'Magic Shield Capacidade +15%'],
        quadrants: 'Sudoeste (Morte e Debuffs)'
      }
    ]
  },
  paladin: {
    name: 'Royal Paladin',
    icon: '🏹',
    color: 'text-yellow-400 border-yellow-500/30',
    builds: [
      {
        id: 'rp_grenade',
        name: 'Divine Grenade Spam (Meta Hunt & Solo)',
        focus: 'Divine Grenade Rank II & Mas San',
        pointsReq: 550,
        description: 'A rotação meta do Tibia moderno: joga a Divine Grenade no meio da caixa com dano sagrado acumulativo e Mas San maximizado.',
        perks: ['Divine Grenade Rank II', 'Divine Caldera (Mas San) +10% Dano', 'Holy Damage +6%', 'Distance Skill +3'],
        quadrants: 'Noroeste (Santo) + Nordeste (Físico)'
      },
      {
        id: 'rp_avatar',
        name: 'Avatar of Light (Boss & PvP God)',
        focus: 'Avatar of Light & Survivability',
        pointsReq: 750,
        description: 'Invoca o Avatar da Luz com velocidade extrema, 100% de precisão de flechas e imunidade parcial a controles.',
        perks: ['Avatar of Light Desbloqueado', 'Dodge Fatal +4%', 'Health Pool +500 HP', 'Cura de San +12%'],
        quadrants: 'Quadrantes Completos (Endgame)'
      }
    ]
  }
};

export default function WheelOfDestiny() {
  const [vocation, setVocation] = useState('knight');
  const [charLevel, setCharLevel] = useState(500);
  const [selectedBuildId, setSelectedBuildId] = useState('ek_berserk');
  const [copied, setCopied] = useState(false);

  // Pontos de promoção: 1 por level a partir do 50
  const availablePoints = Math.max(0, charLevel - 50);

  const currentVocData = VOCATION_BUILDS[vocation] || VOCATION_BUILDS.knight;
  const currentBuild = currentVocData.builds.find(b => b.id === selectedBuildId) || currentVocData.builds[0];

  const handleCopyBuild = () => {
    const text = `[Rubinot Wheel] ${currentVocData.name} (Lvl ${charLevel}) - Build: ${currentBuild.name} | Pontos: ${availablePoints} pts alocados.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn text-gray-200">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-sky-950/40 to-stone-900 border border-sky-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Compass size={16} /> Planejador & Builds Meta da Comunidade
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval font-bold text-white tracking-wide drop-shadow-md">
              Roda do Destino <span className="text-sky-400">(Wheel of Destiny)</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-2xl">
              Calcule pontos de promoção disponíveis por level, visualize as árvores de magias e copie as builds consagradas pelos melhores jogadores do meta.
            </p>
          </div>

          <div className="bg-stone-900/90 border border-sky-500/40 rounded-xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-400">Pontos de Promoção</div>
              <div className="text-2xl font-bold text-sky-300 font-mono">
                {availablePoints} <span className="text-xs text-gray-400 font-normal">pts</span>
              </div>
              <div className="text-[10px] text-gray-500">1 pt / level a partir do 50</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Seleção de Vocação & Level */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Seletor de Vocação */}
        <div className="md:col-span-8">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Escolha sua Vocação
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(VOCATION_BUILDS).map(([key, data]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setVocation(key);
                  setSelectedBuildId(data.builds[0].id);
                }}
                className={`p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  vocation === key
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-lg shadow-sky-500/10'
                    : 'bg-stone-800/60 border-stone-700 text-gray-400 hover:text-white hover:border-stone-600'
                }`}
              >
                <span>{data.icon}</span> {data.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input de Level */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Level do Personagem
          </label>
          <div className="relative">
            <input
              type="number"
              min="50"
              max="2500"
              value={charLevel}
              onChange={(e) => setCharLevel(parseInt(e.target.value) || 50)}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-lg font-bold text-sky-300 focus:outline-none focus:border-sky-500"
            />
            <span className="absolute right-3 top-3 text-xs text-gray-400">Level</span>
          </div>
        </div>

      </div>

      {/* Grid de Builds Recomendadas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lista de Builds da Vocação */}
        <div className="lg:col-span-4 space-y-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Builds Pré-Configuradas do Meta
          </div>

          {currentVocData.builds.map(b => (
            <div
              key={b.id}
              onClick={() => setSelectedBuildId(b.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedBuildId === b.id
                  ? 'bg-sky-950/30 border-sky-500 shadow-xl shadow-sky-950/30'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-base">{b.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${availablePoints >= b.pointsReq ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {b.pointsReq} pts
                </span>
              </div>
              <div className="text-xs text-sky-400/90 mt-1 font-medium">{b.focus}</div>
              <p className="text-xs text-gray-400 mt-2 line-clamp-2">{b.description}</p>
            </div>
          ))}
        </div>

        {/* Detalhes da Build Selecionada */}
        <div className="lg:col-span-8 bg-stone-900/90 border border-sky-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
            <div>
              <div className="text-xs text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Award size={15} /> Build Selecionada
              </div>
              <h3 className="text-2xl font-bold text-white mt-1">{currentBuild.name}</h3>
              <div className="text-xs text-gray-400 mt-0.5">Quadrantes: {currentBuild.quadrants}</div>
            </div>

            <button
              type="button"
              onClick={handleCopyBuild}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white text-xs font-bold flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Copiado para o Discord!' : 'Copiar Build (1-Clique)'}
            </button>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
            {currentBuild.description}
          </p>

          {/* Bônus Principais Ativados */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Perks & Habilidades Habilitadas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentBuild.perks.map((perk, idx) => (
                <div key={idx} className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Zap size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-200">{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparativo de Requisitos */}
          <div className="p-4 bg-stone-950/80 rounded-xl border border-stone-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-400">Pontos Necessários: </span>
              <strong className="text-white">{currentBuild.pointsReq} pts</strong>
            </div>
            <div>
              <span className="text-gray-400">Seus Pontos (Lvl {charLevel}): </span>
              <strong className={`font-mono ${availablePoints >= currentBuild.pointsReq ? 'text-emerald-400' : 'text-amber-400'}`}>
                {availablePoints} pts {availablePoints >= currentBuild.pointsReq ? '✅ (Completa)' : `⚠️ (Faltam ${currentBuild.pointsReq - availablePoints} pts)`}
              </strong>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
