import React, { createContext, useContext, useState } from 'react';

export const WORLDS_LIST = [
  { id: 'ALL', name: 'Todos os Mundos', shortName: 'Global', icon: '🌐', type: 'Todos' },
  { id: 'Auroria', name: 'Auroria', shortName: 'Auroria', icon: '🛡️', type: 'Open-PvP' },
  { id: 'Belaria', name: 'Belaria', shortName: 'Belaria', icon: '⚔️', type: 'Open-PvP' },
  { id: 'Bellum', name: 'Bellum', shortName: 'Bellum', icon: '⚡', type: 'Retro-PvP' },
  { id: 'Tenebrium', name: 'Tenebrium', shortName: 'Tenebrium', icon: '💀', type: 'Hardcore-PvP' },
  { id: 'Vesperia', name: 'Vesperia', shortName: 'Vesperia', icon: '🦅', type: 'Open-PvP' },
  { id: 'Malveria', name: 'Malveria', shortName: 'Malveria', icon: '🏹', type: 'Open-PvP' }
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
