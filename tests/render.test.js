import { describe, it, expect } from 'vitest';
import { computeViewport, toWorld, toScreen, createRenderer } from '../src/render.js';
import { createWorld } from '../src/physics.js';
import { createBlock } from '../src/blocks.js';

function makeMockCtx() {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'canvas') return { width: 1200, height: 700 };
      return (...args) => calls.push([prop, ...args]);
    },
    set: () => true,
  });
  return { ctx, calls };
}

describe('viewport', () => {
  it('letterboxes 1600x900 into a wider canvas', () => {
    const vp = computeViewport(1600, 900, 2000, 900);
    expect(vp.scale).toBeCloseTo(1, 5);
    expect(vp.offsetX).toBeCloseTo(200, 5);
    expect(vp.offsetY).toBeCloseTo(0, 5);
  });
  it('roundtrip screen↔world', () => {
    const vp = computeViewport(1600, 900, 1200, 700);
    const world = { x: 220, y: 620 };
    const back = toWorld(toScreen(world, vp), vp);
    expect(back.x).toBeCloseTo(world.x, 5);
    expect(back.y).toBeCloseTo(world.y, 5);
  });
});

describe('renderer', () => {
  it('draws every entity without throwing, using a mock ctx', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: { x: 60, y: 20 },
      bird: { position: { x: 220, y: 620 }, angle: 0, plugin: { kind: 'bird' } },
      blocks: [{ position: { x: 900, y: 760 }, angle: 0.1, plugin: { kind: 'block', material: 'wood', hp: 4, maxHp: 6 } }],
      pigs: [{ position: { x: 950, y: 740 }, angle: 0, plugin: { kind: 'pig', hp: 6, maxHp: 10 } }],
      groundY: 800,
    });
    expect(calls.length).toBeGreaterThan(10);
    expect(calls.some(([m]) => m === 'arc')).toBe(true);
    expect(calls.some(([m]) => m === 'fillRect')).toBe(true);
  });

  it('draws a real block using its plugin dimensions', () => {
    const { engine } = createWorld();
    const block = createBlock(engine, { x: 900, y: 760, w: 100, h: 40, material: 'wood' });
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: null,
      bird: null,
      blocks: [block],
      pigs: [],
      groundY: 800,
    });
    const rect = calls.find(([m, , , w, h]) => m === 'fillRect' && w === 100 && h === 40);
    expect(rect).toBeTruthy();
  });
});
