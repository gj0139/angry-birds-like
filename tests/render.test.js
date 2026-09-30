import { describe, it, expect, vi, afterEach } from 'vitest';
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
    set: (_, prop, value) => {
      calls.push([prop, value]); // record fillStyle/strokeStyle/lineWidth assignments
      return true;
    },
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
  afterEach(() => vi.unstubAllGlobals());

  it('draws every entity without throwing, using a mock ctx', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: { x: 60, y: 20 },
      birds: [{ position: { x: 220, y: 620 }, angle: 0, plugin: { kind: 'bird' } }],
      bird: { position: { x: 220, y: 620 }, angle: 0, plugin: { kind: 'bird' } },
      blocks: [{ position: { x: 900, y: 760 }, angle: 0.1, plugin: { kind: 'block', material: 'wood', hp: 4, maxHp: 6, w: 100, h: 40 } }],
      pigs: [{ position: { x: 950, y: 740 }, angle: 0, plugin: { kind: 'pig', hp: 6, maxHp: 10 } }],
      groundY: 800,
    });
    expect(calls.length).toBeGreaterThan(10);
    expect(calls.some(([m]) => m === 'arc')).toBe(true);
    expect(calls.some(([m]) => m === 'fillRect')).toBe(true);
  });

  // Review Focus #5 / reviewer C1: draw transform must live in the same
  // pixel space as the device-pixel backing store (dpr != 1).
  it('draw transform scales to device-pixel backing (dpr=2)', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const { ctx, calls } = makeMockCtx();
    const canvas = {
      width: 2400,
      height: 1400,
      clientWidth: 1200,
      clientHeight: 700,
      getContext: () => ctx,
      style: {},
    };
    const r = createRenderer(canvas);
    r.resize();
    expect(canvas.width).toBe(2400); // backing store in device px
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: null,
      bird: null,
      birds: [],
      blocks: [],
      pigs: [],
      groundY: 800,
    });
    const vp = computeViewport(1600, 900, 1200, 700);
    const st = calls.find(([m]) => m === 'setTransform');
    expect(st).toEqual(['setTransform', vp.scale * 2, 0, 0, vp.scale * 2, vp.offsetX * 2, vp.offsetY * 2]);
  });

  // reviewer I5: previously launched birds stay visible
  it('draws every bird in scene.birds', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: null,
      bird: null,
      birds: [
        { position: { x: 400, y: 700 }, angle: 0, plugin: { kind: 'bird' } },
        { position: { x: 600, y: 750 }, angle: 0, plugin: { kind: 'bird' } },
      ],
      blocks: [],
      pigs: [],
      groundY: 800,
    });
    const translates = calls.filter(([m]) => m === 'translate');
    // both birds drawn at their own positions (background adds arcs, so
    // pinning translate coordinates is the reliable signal)
    expect(translates.some(([, x, y]) => Math.abs(x - 400) < 1 && Math.abs(y - 700) < 1)).toBe(true);
    expect(translates.some(([, x, y]) => Math.abs(x - 600) < 1 && Math.abs(y - 750) < 1)).toBe(true);
  });

  // aim ray must lie exactly along the launch direction (-stretch),
  // because the fork-tip band line is ~15-20° off from it.
  it('draws aim ray along the true launch direction (-stretch)', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    const stretch = { x: -100, y: 0 }; // pulled left → launch (1,0)*L
    const birdAt = { x: 220 + stretch.x, y: 620 + stretch.y };
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch,
      bird: null,
      birds: [{ position: birdAt, angle: 0, plugin: { kind: 'bird' } }],
      blocks: [],
      pigs: [],
      groundY: 800,
    });
    const L = 160;
    const hit = calls.some(
      ([m, x, y]) => m === 'lineTo' && Math.abs(x - (birdAt.x + L)) < 0.5 && Math.abs(y - birdAt.y) < 0.5,
    );
    expect(hit).toBe(true);
  });

  it('draws no aim ray without a stretch', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    const before = calls.length;
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: null,
      bird: null,
      birds: [],
      blocks: [],
      pigs: [],
      groundY: 800,
    });
    const aimCalls = calls.slice(before).filter(([m]) => m === 'setLineDash');
    expect(aimCalls).toHaveLength(0);
  });

  // themed background: sky + ground colors come from the level theme
  it('draws themed sky and ground for night', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      theme: 'night',
      slingAnchor: { x: 220, y: 620 },
      stretch: null,
      bird: null,
      birds: [],
      blocks: [],
      pigs: [],
      groundY: 800,
    });
    const styles = calls.filter(([m, v]) => m === 'fillStyle').map(([, v]) => v);
    expect(styles).toContain('#0D1B2A'); // night sky
    expect(styles).toContain('#4E342E'); // night ground
  });

  it('falls back to day theme when none given', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: null,
      bird: null,
      birds: [],
      blocks: [],
      pigs: [],
      groundY: 800,
    });
    const styles = calls.filter(([m, v]) => m === 'fillStyle').map(([, v]) => v);
    expect(styles).toContain('#7EC8E3'); // day sky
  });

  // phoenix: distinctive fire-bird palette, only when a bird is on screen
  it('draws the phoenix in fire colors when a bird is present', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: null,
      bird: null,
      birds: [{ position: { x: 400, y: 700 }, angle: 0, plugin: { kind: 'bird' } }],
      blocks: [],
      pigs: [],
      groundY: 800,
    });
    const styles = calls.filter(([m, v]) => m === 'fillStyle').map(([, v]) => v);
    expect(styles).toContain('#FF6F00'); // phoenix body orange
    expect(styles).toContain('#FFD54F'); // crest / flame tip gold
    expect(styles).not.toContain('#E53935'); // old red bird is gone
  });

  it('draws no phoenix colors without any bird', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      theme: 'dusk',
      slingAnchor: { x: 220, y: 620 },
      stretch: null,
      bird: null,
      birds: [],
      blocks: [],
      pigs: [],
      groundY: 800,
    });
    const styles = calls.filter(([m, v]) => m === 'fillStyle').map(([, v]) => v);
    expect(styles).not.toContain('#FF6F00');
  });

  const birdAt = (skin, extra = {}) => ({
    position: { x: 400, y: 700 },
    angle: 0,
    plugin: { kind: 'bird', skin, trail: [], ...extra },
  });

  it('draws the red bird variant in classic colors', () => {
    const { ctx, calls } = makeMockCtx();
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: null,
      bird: null,
      birds: [birdAt('bird')],
      blocks: [],
      pigs: [],
      groundY: 800,
    });
    const styles = calls.filter(([m, v]) => m === 'fillStyle').map(([, v]) => v);
    expect(styles).toContain('#E53935'); // classic red
    expect(styles).not.toContain('#FF6F00'); // no phoenix body
  });

  it('phoenix wing flaps: drawing at different times differs', () => {
    const drawAt = (t) => {
      const { ctx, calls } = makeMockCtx();
      const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
      r.resize();
      r.draw({
        t,
        slingAnchor: { x: 220, y: 620 },
        stretch: null,
        bird: null,
        birds: [birdAt('phoenix')],
        blocks: [],
        pigs: [],
        groundY: 800,
      });
      // the wing flap is a time-based rotate() — compare transform calls
      return JSON.stringify(calls.filter(([m]) => m === 'rotate'));
    };
    expect(drawAt(0)).not.toBe(drawAt(50));
  });

  it('phoenix trail draws extra flame dots', () => {
    const countArcs = (trail) => {
      const { ctx, calls } = makeMockCtx();
      const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
      r.resize();
      r.draw({
        t: 100,
        slingAnchor: { x: 220, y: 620 },
        stretch: null,
        bird: null,
        birds: [birdAt('phoenix', { trail })],
        blocks: [],
        pigs: [],
        groundY: 800,
      });
      return calls.filter(([m]) => m === 'arc').length;
    };
    const noTrail = countArcs([]);
    const withTrail = countArcs([
      { x: 380, y: 705 },
      { x: 360, y: 708 },
      { x: 340, y: 710 },
      { x: 320, y: 712 },
    ]);
    expect(withTrail).toBeGreaterThan(noTrail);
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
      birds: [],
      blocks: [block],
      pigs: [],
      groundY: 800,
    });
    const rect = calls.find(([m, , , w, h]) => m === 'fillRect' && w === 100 && h === 40);
    expect(rect).toBeTruthy();
  });
});
