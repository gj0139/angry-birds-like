import Matter from 'matter-js';
import { PIG } from './config.js';
import { applyImpactDamage } from './damage.js';

export function createPig(engine, { x, y }) {
  const body = Matter.Bodies.circle(x, y, PIG.radius, {
    density: 0.002,
    friction: 0.6,
    restitution: 0.2,
  });
  body.plugin = { kind: 'pig', hp: PIG.maxHp, maxHp: PIG.maxHp, destroyed: false };
  Matter.Composite.add(engine.world, body);
  return body;
}

export function applyPigImpact(pigBody, impactSpeed, { byBird = false } = {}) {
  if (impactSpeed >= PIG.impactKillSpeed) {
    pigBody.plugin.hp = 0;
    pigBody.plugin.destroyed = true;
    return true;
  }
  return applyImpactDamage(pigBody, impactSpeed, { byBird });
}
