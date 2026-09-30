import { describe, it, expect } from 'vitest';
import Matter from 'matter-js';
import { createWorld, step, addGround, frictionAirAt } from '../src/physics.js';

describe('physics', () => {
  it('gravity pulls a body downward over steps', () => {
    const { engine } = createWorld();
    const box = Matter.Bodies.rectangle(800, 100, 40, 40);
    Matter.Composite.add(engine.world, box);
    const y0 = box.position.y;
    for (let i = 0; i < 30; i++) step(engine);
    expect(box.position.y).toBeGreaterThan(y0 + 50);
  });

  it('ground stops a falling body', () => {
    const { engine } = createWorld();
    addGround(engine, { width: 1600, height: 800 });
    const box = Matter.Bodies.rectangle(800, 100, 40, 40);
    Matter.Composite.add(engine.world, box);
    for (let i = 0; i < 600; i++) step(engine);
    expect(box.position.y).toBeLessThan(800);
    expect(box.position.y).toBeGreaterThan(740);
  });

  // water drag: bird gets extra air friction while submerged
  it('frictionAir rises inside the pond and resets outside', () => {
    const water = { x: 460, y: 560, w: 820, h: 240 };
    expect(frictionAirAt(1000, 700, water)).toBe(0.06); // submerged
    expect(frictionAirAt(1000, 500, water)).toBe(0.01); // above surface
    expect(frictionAirAt(300, 700, water)).toBe(0.01); // outside pond x-range
    expect(frictionAirAt(1000, 700, null)).toBe(0.01); // dry level
  });
});
