import { WORLD, GROUND_Y } from './config.js';
import { addGround } from './physics.js';
import { createBlock } from './blocks.js';
import { createPig } from './pig.js';

export function loadLevel(engine, cfg) {
  const ground = addGround(engine, { width: WORLD.width, height: GROUND_Y });
  const blocks = cfg.blocks.map((b) => createBlock(engine, b));
  const pigs = cfg.pigs.map((p) => createPig(engine, p));
  return { blocks, pigs, birdsRemaining: cfg.birds, ground };
}
