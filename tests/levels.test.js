import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/levels/index.js';
import { MATERIALS } from '../src/materials.js';
import { WORLD } from '../src/config.js';

describe('levels', () => {
  const THEMES = ['day', 'forest', 'dusk', 'desert', 'night', 'snow', 'sea', 'dawn'];

  it('has exactly 8 levels, each 3 birds, 1-3 pigs, with a valid theme', () => {
    expect(LEVELS).toHaveLength(8);
    for (const lv of LEVELS) {
      expect(lv.birds).toBe(3);
      expect(lv.pigs.length).toBeGreaterThanOrEqual(1);
      expect(lv.pigs.length).toBeLessThanOrEqual(3);
      expect(THEMES).toContain(lv.theme);
    }
  });

  it('all pieces sit on or above the ground and inside the world', () => {
    for (const lv of LEVELS) {
      for (const b of lv.blocks) {
        expect(b.material in MATERIALS).toBe(true);
        expect(b.y + b.h / 2).toBeLessThanOrEqual(800.5); // not buried
        expect(b.x).toBeGreaterThan(850);
        expect(b.x).toBeLessThan(1350);
        expect(b.x - b.w / 2).toBeGreaterThan(0);
        expect(b.x + b.w / 2).toBeLessThan(WORLD.width);
      }
      for (const p of lv.pigs) {
        expect(p.y).toBeLessThan(800);
        expect(p.x).toBeGreaterThan(850);
      }
    }
  });

  it('difficulty ramps: later levels use more materials and pieces', () => {
    const mats = (lv) => new Set(lv.blocks.map((b) => b.material));
    expect(mats(LEVELS[0])).toEqual(new Set(['wood']));
    expect(mats(LEVELS[1]).size).toBeGreaterThanOrEqual(2);
    expect(LEVELS[2].blocks.length).toBeGreaterThan(LEVELS[0].blocks.length);
    expect(mats(LEVELS[7])).toEqual(new Set(['wood', 'stone', 'ice'])); // finale mixes all
    expect(LEVELS[7].blocks.length).toBeGreaterThan(LEVELS[3].blocks.length);
  });
});
