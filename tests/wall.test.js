import { describe, it, expect } from 'vitest';
import Matter from 'matter-js';
import { createWorld, step } from '../src/physics.js';
import { loadLevel } from '../src/levelLoader.js';
import { createBird, launchBird } from '../src/bird.js';
import { WALL, SLING } from '../src/config.js';
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
    const bird = createBird(engine, { x: 1100, y: 400 }, () => 0.1); // phoenix, fixed skin irrelevant
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

  it('wall is close enough for a normal arc to reach', () => {
    expect(WALL.x).toBeLessThanOrEqual(1300); // user feedback: 1460 was too far
    const { engine } = createWorld();
    loadLevel(engine, cfg);
    const bird = createBird(engine, { x: 220, y: 620 }, () => 0.1);
    launchBird(engine, bird, { x: 18, y: -18 }); // moderate-high arc
    let maxX = 0;
    for (let i = 0; i < 400; i++) {
      step(engine);
      maxX = Math.max(maxX, bird.position.x);
      if (bird.velocity.x < 0) break; // bounced off something
    }
    expect(maxX).toBeGreaterThanOrEqual(1250); // reaches the wall plane (edge 1280)
  });

  it('initial speed is raised — a full pull hits the wall at half height', () => {
    expect(SLING.power).toBeGreaterThanOrEqual(0.26); // was 0.20, user asked faster
    const { engine } = createWorld();
    loadLevel(engine, cfg);
    const bird = createBird(engine, { x: 220, y: 620 }, () => 0.1);
    // max pull slightly downward → vx max, mild up arc (natural strong shot)
    launchBird(engine, bird, {
      x: 120 * SLING.power,
      y: -40 * SLING.power,
    });
    let impactY = null;
    for (let i = 0; i < 400; i++) {
      step(engine);
      if (bird.position.x >= 1270) {
        impactY = bird.position.y;
        break;
      }
      if (bird.velocity.x < 0 && bird.position.x > 1000) {
        impactY = bird.position.y;
        break;
      }
    }
    expect(impactY).not.toBeNull(); // it reached the wall
    // wall spans 0..800, half height is y=400 — hit in the upper half band
    expect(impactY).toBeLessThanOrEqual(460);
    expect(impactY).toBeGreaterThanOrEqual(80);
  });
});
