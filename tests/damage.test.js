import { describe, it, expect } from 'vitest';
import { createWorld } from '../src/physics.js';
import { MATERIALS } from '../src/materials.js';
import { createBlock, applyImpact, isDestroyed } from '../src/blocks.js';

describe('materials & damage', () => {
  it('material table matches spec', () => {
    expect(MATERIALS.wood).toMatchObject({ density: 0.001, friction: 0.6, hp: 6 });
    expect(MATERIALS.stone).toMatchObject({ density: 0.004, friction: 0.8, hp: 14 });
    expect(MATERIALS.ice).toMatchObject({ density: 0.0008, friction: 0.2, hp: 3 });
  });

  it('block carries hp from its material', () => {
    const { engine } = createWorld();
    const b = createBlock(engine, { x: 800, y: 700, w: 80, h: 40, material: 'wood' });
    expect(b.plugin.hp).toBe(6);
    expect(b.plugin.kind).toBe('block');
  });

  it('impact below 1 does nothing', () => {
    const { engine } = createWorld();
    const b = createBlock(engine, { x: 0, y: 0, w: 40, h: 40, material: 'wood' });
    expect(applyImpact(b, 0.5, { byBird: false })).toBe(false);
    expect(b.plugin.hp).toBe(6);
  });

  it('bird impact doubles damage: speed 4 destroys wood (4*2=8>=6)', () => {
    const { engine } = createWorld();
    const b = createBlock(engine, { x: 0, y: 0, w: 40, h: 40, material: 'wood' });
    expect(applyImpact(b, 4, { byBird: true })).toBe(true);
    expect(isDestroyed(b)).toBe(true);
  });

  it('non-bird impact: stone survives speed 3, dies to cumulative hits', () => {
    const { engine } = createWorld();
    const s = createBlock(engine, { x: 0, y: 0, w: 40, h: 40, material: 'stone' });
    expect(applyImpact(s, 3, { byBird: false })).toBe(false); // hp 14→11
    expect(s.plugin.hp).toBe(11);
    for (let i = 0; i < 4; i++) applyImpact(s, 3, { byBird: false }); // −12 → −1
    expect(isDestroyed(s)).toBe(true);
  });
});
