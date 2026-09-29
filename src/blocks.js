import Matter from 'matter-js';
import { MATERIALS } from './materials.js';
import { applyImpactDamage, isDestroyed } from './damage.js';

export function createBlock(engine, { x, y, w, h, material }) {
  const mat = MATERIALS[material];
  if (!mat) throw new Error(`unknown material: ${material}`);
  const body = Matter.Bodies.rectangle(x, y, w, h, {
    density: mat.density,
    friction: mat.friction,
    restitution: 0.1,
  });
  body.plugin = { kind: 'block', material, hp: mat.hp, maxHp: mat.hp, destroyed: false };
  Matter.Composite.add(engine.world, body);
  return body;
}

export function applyImpact(body, impactSpeed, opts) {
  return applyImpactDamage(body, impactSpeed, opts);
}

export { isDestroyed };
