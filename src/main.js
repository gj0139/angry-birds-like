import { createSfx } from './audio.js';
import { Game } from './game.js';
import { createHud } from './ui.js';
import { loadProgress, saveStars, isUnlocked, getStorage } from './progress.js';
import { LEVELS } from './levels/index.js';
import { shouldShowRotateHint } from './ui.js';

const canvas = document.getElementById('game');
const hudRoot = document.getElementById('hud');
const sfx = createSfx();
const storage = getStorage();

let progress = loadProgress(storage);
let game = null;
let current = 0;
let muted = false;
let lastState = null;
let autoFsTried = false;

function requestFullscreen() {
  try {
    const p = document.documentElement.requestFullscreen?.();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    /* iOS Safari and some browsers refuse — ignore */
  }
}

function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else requestFullscreen();
  } catch {
    /* ignore */
  }
}

document.addEventListener('fullscreenchange', () => {
  hud.setFullscreen(Boolean(document.fullscreenElement));
});

function renderTopBar() {
  if (!lastState) return;
  hud.renderTopBar({
    birdsLeft: lastState.birdsRemaining,
    levelIndex: current,
    muted,
  });
}

const hud = createHud(hudRoot, {
  onRestart: () => {
    hud.hideOverlays();
    game?.restart();
  },
  onNext: () => {
    if (current + 1 < LEVELS.length) startLevel(current + 1);
    else showSelect();
  },
  onSelectLevel: (i) => {
    if (i < 0) showSelect();
    else if (isUnlocked(progress, i)) startLevel(i);
  },
  onToggleMute: () => {
    muted = !muted;
    sfx.setMuted(muted);
    renderTopBar();
  },
  onToggleFullscreen: () => toggleFullscreen(),
});

function showSelect() {
  game?.destroy();
  game = null;
  hud.hideTopBar();
  hud.showLevelSelect({
    levels: LEVELS.length,
    stars: progress.stars,
    unlocked: LEVELS.map((_, i) => isUnlocked(progress, i)),
  });
}

function startLevel(index) {
  current = index;
  hud.hideOverlays();
  game?.destroy();
  // mobile: enter fullscreen inside the tap gesture that started the level
  if (!autoFsTried && globalThis.matchMedia?.('(pointer: coarse)').matches) {
    autoFsTried = true;
    requestFullscreen();
  }
  game = new Game({
    canvas,
    sfx,
    levelCfg: LEVELS[index],
    callbacks: {
      onStateChange: (state) => {
        lastState = state;
        hud.renderTopBar({ birdsLeft: state.birdsRemaining, levelIndex: index, muted });
      },
      onResult: ({ won, stars }) => {
        if (won) {
          saveStars(storage, index, stars);
          progress = loadProgress(storage);
        }
        hud.showResult({ won, stars, hasNext: index < LEVELS.length - 1 });
      },
    },
  });
  game.start();
}

if (import.meta.env.DEV) {
  window.__game = () => game;
  window.__app = { startLevel, showSelect, get progress() { return progress; } };
}

function syncOrientation() {
  hud.showRotateHint(shouldShowRotateHint(window.innerWidth, window.innerHeight));
}
globalThis.addEventListener('resize', syncOrientation);
globalThis.addEventListener('orientationchange', syncOrientation);
syncOrientation();

showSelect();
