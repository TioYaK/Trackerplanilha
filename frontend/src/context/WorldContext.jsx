import React, { createContext, useContext, useState } from 'react';

export const WORLDS_LIST = [
  { id: 'ALL', name: 'Todos os Mundos', shortName: 'Global', icon: '🌐', type: 'Todos', transfer: 'N/A' },
  { id: 'Auroria', name: 'Auroria', shortName: 'Auroria', icon: '🛡️', type: 'Open-PvP', transfer: 'Aberta' },
  { id: 'Belaria', name: 'Belaria', shortName: 'Belaria', icon: '⚔️', type: 'Open-PvP', transfer: 'Aberta' },
  { id: 'Bellum', name: 'Bellum', shortName: 'Bellum', icon: '⚡', type: 'Retro-PvP', transfer: 'Aberta' },
  { id: 'Drakaria', name: 'Drakaria', shortName: 'Drakaria', icon: '🐉', type: 'Open-PvP', transfer: 'Bloqueada' },
  { id: 'Eldrian', name: 'Eldrian', shortName: 'Eldrian', icon: '🌿', type: 'Optional-PvP', transfer: 'Bloqueada' },
  { id: 'Elysian', name: 'Elysian', shortName: 'Elysian', icon: '✨', type: 'Optional-PvP', transfer: 'Aberta' },
  { id: 'Infernum I', name: 'Infernum I', shortName: 'Infernum 1', icon: '🔥', type: 'Retro-PvP', transfer: 'Bloqueada' },
  { id: 'Infernum II', name: 'Infernum II', shortName: 'Infernum 2', icon: '🌋', type: 'Retro-PvP', transfer: 'Bloqueada' },
  { id: 'Infernum III', name: 'Infernum III', shortName: 'Infernum 3', icon: '☄️', type: 'Retro-PvP', transfer: 'Bloqueada' },
  { id: 'Lunarian', name: 'Lunarian', shortName: 'Lunarian', icon: '🌙', type: 'Optional-PvP', transfer: 'Aberta' },
  { id: 'Malveria', name: 'Malveria', shortName: 'Malveria', icon: '🏹', type: 'Open-PvP', transfer: 'Bloqueada' },
  { id: 'Mystian', name: 'Mystian', shortName: 'Mystian', icon: '🔮', type: 'Optional-PvP', transfer: 'Aberta' },
  { id: 'Obsidian', name: 'Obsidian', shortName: 'Obsidian', icon: '💎', type: 'Optional-PvP', transfer: 'Bloqueada' },
  { id: 'Solarian', name: 'Solarian', shortName: 'Solarian', icon: '☀️', type: 'Optional-PvP', transfer: 'Aberta' },
  { id: 'Tenebrium', name: 'Tenebrium', shortName: 'Tenebrium', icon: '💀', type: 'Retro-PvP', transfer: 'Bloqueada' },
  { id: 'Vesperia', name: 'Vesperia', shortName: 'Vesperia', icon: '🦅', type: 'Open-PvP', transfer: 'Aberta' }
];

const WorldContext = createContext({
  activeWorld: 'ALL',
  setActiveWorld: () => {},
  worlds: WORLDS_LIST,
  activeWorldObj: WORLDS_LIST[0]
});

export const useWorld = () => useContext(WorldContext);

export const WorldProvider = ({ children }) => {
  const [activeWorld, setActiveWorldState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rubinot_selected_world') || 'ALL';
    }
    return 'ALL';
  });

  const setActiveWorld = (worldId) => {
    setActiveWorldState(worldId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rubinot_selected_world', worldId);
      window.dispatchEvent(new CustomEvent('rubinot_world_changed', { detail: { world: worldId } }));
    }
  };

  const activeWorldObj = WORLDS_LIST.find(w => w.id.toLowerCase() === activeWorld.toLowerCase()) || WORLDS_LIST[0];

  return (
    <WorldContext.Provider value={{ 
      activeWorld, 
      setActiveWorld, 
      selectedWorld: activeWorld, 
      setSelectedWorld: setActiveWorld, 
      worlds: WORLDS_LIST, 
      activeWorldObj,
      worldConfig: activeWorldObj 
    }}>
      {children}
    </WorldContext.Provider>
  );
};
