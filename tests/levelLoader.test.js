import { describe, it, expect } from 'vitest';
import { createWorld } from '../src/physics.js';
import { loadLevel } from '../src/levelLoader.js';

const cfg = {
  birds: 3,
  blocks: [
    { x: 900, y: 760, w: 100, h: 40, material: 'wood' },
    { x: 900, y: 700, w: 40, h: 80, material: 'stone' },
    { x: 1000, y: 760, w: 60, h: 60, material: 'ice' },
  ],
  pigs: [{ x: 950, y: 740 }],
};

describe('levelLoader', () => {
  it('builds bodies from config', () => {
    const { engine } = createWorld();
    const level = loadLevel(engine, cfg);
    expect(level.blocks).toHaveLength(3);
    expect(level.pigs).toHaveLength(1);
    expect(level.birdsRemaining).toBe(3);
    expect(level.blocks[0].plugin.material).toBe('wood');
    expect(level.blocks[1].plugin.hp).toBe(14);
    expect(level.ground.isStatic).toBe(true);
  });

  it('rejects unknown material', () => {
    const { engine } = createWorld();
    expect(() => loadLevel(engine, {
      birds: 1, blocks: [{ x: 0, y: 0, w: 10, h: 10, material: 'diamond' }], pigs: [],
    })).toThrow(/material/i);
  });
});
