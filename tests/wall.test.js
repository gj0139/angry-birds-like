import { describe, it, expect } from 'vitest';
import Matter from 'matter-js';
import { createWorld, step } from '../src/physics.js';
import { loadLevel } from '../src/levelLoader.js';
import { createBird, launchBird } from '../src/bird.js';
import { WALL } from '../src/config.js';

const cfg = { birds: 1, blocks: [], pigs: [] };

describe('back wall (bounce, physical)', () => {
  it('loader always adds a static wall behind the structures', () => {
    const { engine } = createWorld();
    const level = loadLevel(engine, cfg);
    const wall = Matter.Composite.allBodies(engine.world).find((b) => b.label === 'wall');
    expect(wall).toBeTruthy();
    expect(wall.isStatic).toBe(true);
    expect(wall.position.x).toBe(WALL.x);
    expect(level.ground).toBeTruthy();
  });

  it('bird bouncing off the wall reverses direction keeping most speed', () => {
    const { engine } = createWorld();
    loadLevel(engine, cfg);
    const bird = createBird(engine, { x: 1400, y: 400 }, () => 0.1); // phoenix, fixed skin irrelevant
    launchBird(engine, bird, { x: 15, y: 0 });

    let pre = null;
    let post = null;
    let prevVx = bird.velocity.x;
    for (let i = 0; i < 300; i++) {
      step(engine);
      const vx = bird.velocity.x;
      if (prevVx > 0 && vx < 0 && pre === null) {
        pre = prevVx;
        post = vx;
        break;
      }
      prevVx = vx;
    }
    expect(pre).not.toBeNull(); // it did hit the wall
    expect(post).toBeLessThan(0); // reflected
    expect(Math.abs(post)).toBeGreaterThanOrEqual(0.5 * Math.abs(pre)); // keeps >=50% speed
  });
});
