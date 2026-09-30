// Measure pig impact speed vs drop height (matter + our pig module).
import { createWorld, step, addGround } from '../src/physics.js';
import { createPig, applyPigImpact } from '../src/pig.js';

for (const drop of [100, 140, 184, 220, 260, 300, 400]) {
  const { engine } = createWorld();
  addGround(engine, { width: 1600, height: 800 });
  const pig = createPig(engine, { x: 900, y: 800 - 22 - drop });
  let impact = null;
  const { default: Matter } = await import('matter-js');
  Matter.Events.on(engine, 'collisionStart', (ev) => {
    for (const p of ev.pairs) {
      if (p.bodyA === pig || p.bodyB === pig) {
        const o = p.bodyA === pig ? p.bodyB : p.bodyA;
        impact = Math.hypot(
          pig.velocity.x - o.velocity.x,
          pig.velocity.y - o.velocity.y,
        );
      }
    }
  });
  for (let i = 0; i < 300 && impact === null; i++) step(engine);
  const dead = impact !== null && applyPigImpact(pig, impact, { byBird: false });
  console.log(
    `drop=${drop}px impact=${impact === null ? 'none' : impact.toFixed(2)} dies=${dead}`,
  );
}
