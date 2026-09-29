import { createSfx } from './audio.js';
import { Game } from './game.js';

const levelCfg = {
  birds: 3,
  blocks: [
    { x: 900, y: 780, w: 100, h: 40, material: 'wood' }, // bottom rests on ground 800
    { x: 900, y: 720, w: 40, h: 80, material: 'stone' }, // bottom rests on wood top 760
    { x: 1010, y: 770, w: 60, h: 60, material: 'ice' }, // bottom rests on ground
  ],
  pigs: [{ x: 945, y: 778 }], // bottom rests on ground (r=22)
};

const canvas = document.getElementById('game');
const sfx = createSfx();

const game = new Game({
  canvas,
  sfx,
  levelCfg,
  callbacks: {
    onStateChange: (state) => console.log('[state]', state.phase, state),
    onResult: (result) => console.log('[result]', result),
  },
});

game.start();

if (import.meta.env.DEV) window.__game = game;

