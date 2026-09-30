import { WORLD, GROUND_Y, WALL } from './config.js';
import { addGround } from './physics.js';
import { createBlock } from './blocks.js';
import { createPig } from './pig.js';
import Matter from 'matter-js';

export function loadLevel(engine, cfg) {
  const ground = addGround(engine, { width: WORLD.width, height: GROUND_Y });
  const blocks = cfg.blocks.map((b) => createBlock(engine, b));
  const pigs = cfg.pigs.map((p) => createPig(engine, p));
  // tall enough to cover any arc that could fly over the top
  const wall = Matter.Bodies.rectangle(WALL.x, 0, WALL.width, 1800, {
    isStatic: true,
    restitution: WALL.restitution,
    friction: WALL.friction,
    label: 'wall',
  });
  Matter.Composite.add(engine.world, wall);
  return { blocks, pigs, birdsRemaining: cfg.birds, ground, wall };
}
