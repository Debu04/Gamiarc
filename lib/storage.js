/**
 * Gamiarc - Namespaced Browser Storage Abstraction
 * Ensures SSR safety and isolates per-game data in localStorage.
 */

const STORAGE_PREFIX = 'gamiarc_game';

export function getStorageKey(gameId, key) {
  const sanitizedId = String(gameId).toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `${STORAGE_PREFIX}_${sanitizedId}_${key}`;
}

export function saveGameData(gameId, key, value) {
  if (typeof window === 'undefined') return;
  try {
    const storageKey = getStorageKey(gameId, key);
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Gamiarc Storage] Failed to save data for ${gameId}/${key}:`, err);
  }
}

export function loadGameData(gameId, key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const storageKey = getStorageKey(gameId, key);
    const item = window.localStorage.getItem(storageKey);
    return item !== null ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`[Gamiarc Storage] Failed to load data for ${gameId}/${key}:`, err);
    return fallback;
  }
}

export function clearGameData(gameId) {
  if (typeof window === 'undefined') return;
  try {
    const prefix = `${STORAGE_PREFIX}_${String(gameId).toLowerCase().replace(/[^a-z0-9_]/g, '_')}_`;
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch (err) {
    console.warn(`[Gamiarc Storage] Failed to clear data for ${gameId}:`, err);
  }
}
