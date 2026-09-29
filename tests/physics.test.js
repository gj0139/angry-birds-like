import { describe, it, expect } from 'vitest';
import Matter from 'matter-js';
import { createWorld, step, addGround } from '../src/physics.js';

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
});
