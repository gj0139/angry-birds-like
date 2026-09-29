import { createSfx } from './audio.js';
import { Game } from './game.js';
import { createHud } from './ui.js';
import { loadProgress, saveStars, isUnlocked } from './progress.js';

// Placeholder until Task 11 ships real level data.
const tempLevel = {
  birds: 3,
  blocks: [
    { x: 900, y: 780, w: 100, h: 40, material: 'wood' },
    { x: 900, y: 720, w: 40, h: 80, material: 'stone' },
    { x: 1010, y: 770, w: 60, h: 60, material: 'ice' },
  ],
  pigs: [{ x: 945, y: 778 }],
};
const LEVELS = [tempLevel, tempLevel, tempLevel];

const canvas = document.getElementById('game');
const hudRoot = document.getElementById('hud');
const sfx = createSfx();
const storage = window.localStorage;

let progress = loadProgress(storage);
let game = null;
let current = 0;

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
  game = new Game({
    canvas,
    sfx,
    levelCfg: LEVELS[index],
    callbacks: {
      onStateChange: (state) => {
        hud.renderTopBar({ birdsLeft: state.birdsRemaining, levelIndex: index });
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

showSelect();
