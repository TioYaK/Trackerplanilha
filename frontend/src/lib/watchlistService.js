// Serviço de Armazenamento Local da Watchlist / Jogadores Fixados
// Rubinot Tracker - Sincronização em Tempo Real via CustomEvent

const STORAGE_KEY = 'rubinot_pinned_players';
const MAX_PINNED = 15;
const EVENT_NAME = 'rubinot_watchlist_updated';

export function getPinnedPlayers() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Erro ao carregar watchlist de jogadores:', err);
    return [];
  }
}

export function isPlayerPinned(playerName) {
  if (!playerName || typeof window === 'undefined') return false;
  const list = getPinnedPlayers();
  const target = playerName.trim().toLowerCase();
  return list.some(p => (p.name || '').trim().toLowerCase() === target);
}

export function togglePinPlayer(player) {
  if (!player || !player.name || typeof window === 'undefined') return false;
  
  const list = getPinnedPlayers();
  const nameNorm = player.name.trim();
  const existingIdx = list.findIndex(p => (p.name || '').trim().toLowerCase() === nameNorm.toLowerCase());

  let nextList;
  let isPinned;

  if (existingIdx >= 0) {
    // Desafixar
    nextList = list.filter((_, idx) => idx !== existingIdx);
    isPinned = false;
  } else {
    // Fixar
    const newItem = {
      name: nameNorm,
      world: player.world || 'Auroria',
      level: player.level || null,
      vocation: player.vocation || null,
      pinnedAt: new Date().toISOString()
    };
    // Adiciona no início e limita a MAX_PINNED
    nextList = [newItem, ...list.filter(p => (p.name || '').trim().toLowerCase() !== nameNorm.toLowerCase())].slice(0, MAX_PINNED);
    isPinned = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
  } catch (e) {
    console.error('Falha ao salvar na watchlist:', e);
  }

  // Notifica componentes na mesma aba e em outras abas
  dispatchWatchlistChange(nameNorm, isPinned, nextList);
  return isPinned;
}

export function removePinnedPlayer(playerName) {
  if (!playerName || typeof window === 'undefined') return;
  const list = getPinnedPlayers();
  const nameNorm = playerName.trim();
  const nextList = list.filter(p => (p.name || '').trim().toLowerCase() !== nameNorm.toLowerCase());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
  } catch (e) {
    console.error('Falha ao atualizar watchlist:', e);
  }

  dispatchWatchlistChange(nameNorm, false, nextList);
}

function dispatchWatchlistChange(name, isPinned, list) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: { name, isPinned, list }
    }));
  }
}

export function subscribeWatchlist(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e) => {
    callback(e.detail?.list || getPinnedPlayers());
  };

  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getPinnedPlayers());
    }
  };

  window.addEventListener(EVENT_NAME, handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}
