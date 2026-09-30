import Matter from 'matter-js';
import { DRAG } from './config.js';

export function createWorld() {
  const engine = Matter.Engine.create();
  engine.gravity.y = 1;
  return { engine, world: engine.world };
}

export function step(engine, delta = 1000 / 60) {
  Matter.Engine.update(engine, delta);
}

export function addGround(engine, { width, height }) {
  const ground = Matter.Bodies.rectangle(width / 2, height + 50, width, 100, {
    isStatic: true,
    friction: 0.9,
    label: 'ground',
  });
  Matter.Composite.add(engine.world, ground);
  return ground;
}

// extra drag while the body is submerged in the pond
export function frictionAirAt(x, y, water, air = DRAG.air, waterAir = DRAG.water) {
  if (!water) return air;
  const inX = x >= water.x && x <= water.x + water.w;
  const inY = y > water.y && y < water.y + water.h;
  return inX && inY ? waterAir : air;
}
