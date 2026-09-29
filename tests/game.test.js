import { describe, it, expect, vi } from 'vitest';
import Matter from 'matter-js';
import { createWorld, step } from '../src/physics.js';
import { createBlock, isDestroyed } from '../src/blocks.js';
import { createPig } from '../src/pig.js';
import { createDamageCollector, isSettleDue } from '../src/game.js';

describe('createDamageCollector', () => {
  it('queues during step, applies damage and removes only on flush', () => {
    const { engine } = createWorld();
    const wall = createBlock(engine, { x: 800, y: 760, w: 40, h: 80, material: 'ice' });
    const bullet = Matter.Bodies.rectangle(700, 760, 30, 30, { density: 0.01 });
    Matter.Composite.add(engine.world, bullet);

    const collector = createDamageCollector(engine, {});
    collector.attach();
    Matter.Body.setVelocity(bullet, { x: 24, y: 0 });

    let guard = 0;
    while (collector.pending() === 0 && guard++ < 30) step(engine);

    expect(collector.pending()).toBeGreaterThan(0); // collision queued
    expect(Matter.Composite.allBodies(engine.world)).toContain(wall); // not removed during step
    expect(wall.plugin.hp).toBe(3); // damage not yet applied
    expect(isDestroyed(wall)).toBe(false);

    collector.flush();
    expect(isDestroyed(wall)).toBe(true);
    expect(Matter.Composite.allBodies(engine.world)).not.toContain(wall);
  });

  it('pig death fires onPigDied exactly once and removes the pig', () => {
    const { engine } = createWorld();
    const pig = createPig(engine, { x: 900, y: 740 });
    const bullet = Matter.Bodies.rectangle(700, 740, 30, 30, { density: 0.01 });
    Matter.Composite.add(engine.world, bullet);
    const onPigDied = vi.fn();

    const collector = createDamageCollector(engine, { onPigDied });
    collector.attach();
    Matter.Body.setVelocity(bullet, { x: 24, y: 0 });

    let guard = 0;
    while (collector.pending() === 0 && guard++ < 30) step(engine);
    collector.flush();
    collector.flush(); // second flush must not re-fire

    expect(onPigDied).toHaveBeenCalledTimes(1);
    expect(Matter.Composite.allBodies(engine.world)).not.toContain(pig);
  });

  it('marks byBird when the queued body collides with the current bird', () => {
    const { engine } = createWorld();
    const wall = createBlock(engine, { x: 800, y: 760, w: 40, h: 80, material: 'wood' });
    const bird = Matter.Bodies.rectangle(700, 760, 30, 30, { density: 0.005 });
    Matter.Composite.add(engine.world, bird);

    // wood hp 6: bird speed 4 → 4*2=8 >= 6 destroys; without byBird it would survive
    const collector = createDamageCollector(engine, { byBirdBody: bird });
    collector.attach();
    Matter.Body.setVelocity(bird, { x: 4, y: 0 });

    let guard = 0;
    while (collector.pending() === 0 && guard++ < 60) step(engine);
    collector.flush();

    expect(isDestroyed(wall)).toBe(true);
  });
});

describe('isSettleDue (Review Focus #3: timeout force-settle)', () => {
  const cfg = { durationMs: 1500, timeoutMs: 6000 };
  it('not due while bodies still moving', () => {
    expect(isSettleDue(0, 1000, 0, cfg)).toBe(false);
    expect(isSettleDue(1499, 5000, 0, cfg)).toBe(false);
  });
  it('due after quiet duration accumulates', () => {
    expect(isSettleDue(1500, 3000, 0, cfg)).toBe(true);
  });
  it('force-due at timeout even if never quiet', () => {
    expect(isSettleDue(0, 6000, 0, cfg)).toBe(true);
    expect(isSettleDue(0, 5999, 0, cfg)).toBe(false);
  });
});
