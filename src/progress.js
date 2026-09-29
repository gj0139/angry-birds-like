const KEY = 'ab-like-progress';
const LEVEL_COUNT = 3;
const memory = new Map();

function readRaw(storage) {
  try {
    return storage.getItem(KEY);
  } catch {
    return memory.get(KEY) ?? null;
  }
}

function writeRaw(storage, value) {
  try {
    storage.setItem(KEY, value);
  } catch {
    memory.set(KEY, value);
  }
}

function sanitizeStar(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0;
}

export function loadProgress(storage) {
  const stars = new Array(LEVEL_COUNT).fill(0);
  try {
    const raw = readRaw(storage);
    if (!raw) return { stars };
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.stars) ? parsed.stars : [];
    for (let i = 0; i < LEVEL_COUNT; i++) stars[i] = sanitizeStar(list[i]);
  } catch {
    // corrupt JSON or throwing storage → defaults
  }
  return { stars };
}

export function saveStars(storage, levelIndex, stars) {
  const progress = loadProgress(storage);
  if (levelIndex >= 0 && levelIndex < LEVEL_COUNT) {
    progress.stars[levelIndex] = Math.max(progress.stars[levelIndex], sanitizeStar(stars));
    writeRaw(storage, JSON.stringify(progress));
  }
  return storage;
}

export function isUnlocked(progress, levelIndex) {
  if (levelIndex <= 0) return true;
  return (progress.stars[levelIndex - 1] ?? 0) >= 1;
}

export function totalStars(progress) {
  return progress.stars.reduce((a, b) => a + b, 0);
}
