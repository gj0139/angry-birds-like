import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/levels/index.js';
import { MATERIALS } from '../src/materials.js';
import { WORLD } from '../src/config.js';

describe('levels', () => {
  const THEMES = ['day', 'forest', 'dusk', 'desert', 'night', 'snow', 'sea', 'dawn', 'water'];

  it('has exactly 11 levels, each 3 birds, 1-6 pigs, with a valid theme', () => {
    expect(LEVELS).toHaveLength(11);
    for (const lv of LEVELS) {
      expect(lv.birds).toBe(3);
      expect(lv.pigs.length).toBeGreaterThanOrEqual(1);
      expect(lv.pigs.length).toBeLessThanOrEqual(6);
      expect(THEMES).toContain(lv.theme);
    }
  });

  it('all pieces sit on or above the ground and inside the world', () => {
    for (const lv of LEVELS) {
      for (const b of lv.blocks) {
        expect(b.material in MATERIALS).toBe(true);
        expect(b.y + b.h / 2).toBeLessThanOrEqual(800.5); // not buried
        // ≥750 keeps clear of the slingshot zone (sling x=220, bird range ~945)
        expect(b.x).toBeGreaterThan(750);
        expect(b.x).toBeLessThan(1350);
        expect(b.x - b.w / 2).toBeGreaterThan(0);
        expect(b.x + b.w / 2).toBeLessThan(WORLD.width);
      }
      for (const p of lv.pigs) {
        expect(p.y).toBeLessThan(800);
        expect(p.x).toBeGreaterThan(750);
      }
    }
  });

  it('difficulty ramps: later levels use more materials and pieces', () => {
    const mats = (lv) => new Set(lv.blocks.map((b) => b.material));
    expect(mats(LEVELS[0])).toEqual(new Set(['wood']));
    expect(mats(LEVELS[1]).size).toBeGreaterThanOrEqual(2);
    expect(LEVELS[2].blocks.length).toBeGreaterThan(LEVELS[0].blocks.length);
    expect(mats(LEVELS[7])).toEqual(new Set(['wood', 'stone', 'ice'])); // finale mixes all
    expect(LEVELS[7].blocks.length).toBeGreaterThanOrEqual(LEVELS[3].blocks.length);
  });

  // difficulty ramp: the back half demands all 3 pigs cleared with 3 birds
  // and mixes at least two materials (protection / tougher targets)
  it('levels 4-8 each have 3 pigs and at least 2 materials', () => {
    const mats = (lv) => new Set(lv.blocks.map((b) => b.material));
    for (const lv of LEVELS.slice(3, 8)) {
      expect(lv.pigs).toHaveLength(3);
      expect(mats(lv).size).toBeGreaterThanOrEqual(2);
    }
  });

  it('every level has a structurally distinct layout', () => {
    const shapes = LEVELS.map((lv) =>
      JSON.stringify(lv.blocks.map((b) => [b.x, b.y, b.w, b.h]).sort()),
    );
    expect(new Set(shapes).size).toBe(LEVELS.length);
  });

  // water levels 9-11: pool config + more pigs hiding underwater
  it('water levels 9-11 carry a pool and 4-6 pigs', () => {
    for (const lv of LEVELS.slice(8)) {
      expect(lv.theme).toBe('water');
      expect(lv.water).toBeTruthy();
      expect(lv.water.w).toBeGreaterThan(0);
      expect(lv.water.h).toBeGreaterThan(0);
      expect(lv.pigs.length).toBeGreaterThanOrEqual(4);
      expect(lv.pigs.length).toBeLessThanOrEqual(6);
      // every pig is actually submerged (real position below the surface)
      for (const p of lv.pigs) {
        expect(p.y).toBeGreaterThan(lv.water.y);
        expect(p.x).toBeGreaterThan(lv.water.x);
        expect(p.x).toBeLessThan(lv.water.x + lv.water.w);
      }
    }
  });
});
