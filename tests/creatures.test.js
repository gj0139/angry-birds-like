import { describe, it, expect } from 'vitest';
import { createWorld, step } from '../src/physics.js';
import { createPig, applyPigImpact } from '../src/pig.js';
import { createBird, launchBird } from '../src/bird.js';

describe('pig', () => {
  it('has spec hp; sub-threshold non-lethal hit survives, >=8 kills instantly', () => {
    const { engine } = createWorld();
    const pig = createPig(engine, { x: 900, y: 700 });
    expect(pig.plugin.hp).toBe(10);
    expect(applyPigImpact(pig, 7.9, { byBird: false })).toBe(false); // 7.9 < 10 hp
    expect(applyPigImpact(pig, 8, { byBird: false })).toBe(true); // instant kill
    expect(pig.plugin.destroyed).toBe(true);
  });
  it('dies from accumulated bird damage', () => {
    const { engine } = createWorld();
    const pig = createPig(engine, { x: 900, y: 700 });
    // 5 * 2 (byBird) = 10 → hp 0
    expect(applyPigImpact(pig, 5, { byBird: true })).toBe(true);
  });
});

describe('bird', () => {
  it('starts static on the anchor and launches with given velocity', () => {
    const { engine } = createWorld();
    const bird = createBird(engine, { x: 220, y: 620 });
    expect(bird.isStatic).toBe(true);
    expect(bird.position).toMatchObject({ x: 220, y: 620 });
    launchBird(engine, bird, { x: -20, y: -10 });
    expect(bird.isStatic).toBe(false);
    for (let i = 0; i < 10; i++) step(engine);
    expect(bird.position.x).toBeLessThan(220); // flies left
  });
});
