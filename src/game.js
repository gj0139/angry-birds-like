import Matter from 'matter-js';
import { createWorld, step } from './physics.js';
import { loadLevel } from './levelLoader.js';
import { createBird, launchBird } from './bird.js';
import { applyImpact, isDestroyed } from './blocks.js';
import { applyPigImpact } from './pig.js';
import { createGame, reduce } from './gameState.js';
import {
  computePull,
  computeLaunchVelocity,
  shouldLaunch,
  isWithinGrabRadius,
  adaptiveGrabRadius,
} from './slingshot.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { SLING, SETTLE, WORLD } from './config.js';

export function isSettleDue(settleMs, now, launchAt, settle = SETTLE) {
  if (settleMs >= settle.durationMs) return true;
  return launchAt != null && now - launchAt >= settle.timeoutMs;
}

export function advanceSteps(accum, dt, stepMs = 1000 / 60, maxSteps = 5) {
  let a = accum + dt;
  let steps = 0;
  while (a >= stepMs && steps < maxSteps) {
    steps += 1;
    a -= stepMs;
  }
  if (a >= stepMs) a = 0; // capped: drop backlog so a stall can't spiral
  return { steps, accum: a };
}

export function createDamageCollector(
  engine,
  { onPigDied = () => {}, onBlockImpact = () => {}, byBirdBody = null } = {},
) {
  const queue = [];

  function attach() {
    Matter.Events.on(engine, 'collisionStart', (ev) => {
      for (const pair of ev.pairs) {
        const { bodyA, bodyB } = pair;
        const speed = Math.hypot(
          bodyA.velocity.x - bodyB.velocity.x,
          bodyA.velocity.y - bodyB.velocity.y,
        );
        const bird = typeof byBirdBody === 'function' ? byBirdBody() : byBirdBody;
        const byBird = bird != null && (bodyA === bird || bodyB === bird);
        for (const b of [bodyA, bodyB]) {
          if (b.plugin && b.plugin.hp != null && !b.plugin.destroyed) {
            queue.push({ body: b, speed, byBird });
          }
        }
      }
    });
  }

  function flush() {
    if (queue.length === 0) return;
    const items = queue.splice(0, queue.length);
    for (const { body, speed, byBird } of items) {
      if (!body.plugin || body.plugin.hp == null) continue;
      let dead;
      if (body.plugin.kind === 'pig') {
        dead = applyPigImpact(body, speed, { byBird });
        if (dead && !body.plugin.counted) {
          body.plugin.counted = true;
          onPigDied();
        }
      } else {
        if (speed >= 1) onBlockImpact(speed);
        dead = applyImpact(body, speed, { byBird });
      }
      if (dead && isDestroyed(body)) {
        const stillThere = Matter.Composite.allBodies(engine.world).includes(body);
        if (stillThere) Matter.Composite.remove(engine.world, body);
      }
    }
  }

  return {
    attach,
    flush,
    pending: () => queue.length,
  };
}

export class Game {
  constructor({ canvas, sfx, levelCfg, callbacks }) {
    this.canvas = canvas;
    this.sfx = sfx;
    this.levelCfg = levelCfg;
    this.callbacks = callbacks;
    this.rafId = null;
    this.engine = null;
    this.collector = null;
    this.input = null;
    this.renderer = null;
    this.state = null;
    this.bird = null;
    this.birds = [];
    this.pull = null;
    this.settleMs = 0;
    this.accum = 0;
    this.lastNow = 0;
    this.destroyed = false;
  }

  start() {
    this.destroyed = false;
    const { engine } = createWorld();
    this.engine = engine;
    this.level = loadLevel(engine, this.levelCfg);
    this.state = createGame(this.level.birdsRemaining, this.level.pigs.length);
    this.birds = [];
    this.accum = 0;

    this.renderer = createRenderer(this.canvas);
    this.renderer.resize();

    this.collector = createDamageCollector(engine, {
      onPigDied: () => {
        this.dispatch({ type: 'PIG_DIED' });
        this.sfx?.play('pigDie');
      },
      onBlockImpact: (speed) => {
        if (speed >= 2) this.sfx?.play('impact');
      },
      byBirdBody: () => this.bird,
    });
    this.collector.attach();

    this.loadBird();
    this.input = createInput(this.canvas, this.renderer.toWorld, {
      onDown: (pt) => this.onDown(pt),
      onMove: (pt) => this.onMove(pt),
      onUp: (pt) => this.onUp(pt),
    });

    this.onResize = () => this.renderer.resize();
    globalThis.addEventListener?.('resize', this.onResize);

    this.lastNow = performance.now();
    this.callbacks.onStateChange?.(this.state);
    this.loop(performance.now());
  }

  loadBird() {
    this.bird = createBird(this.engine, SLING.anchor);
    this.birds.push(this.bird);
    this.pull = null;
  }

  dispatch(event) {
    const prev = this.state;
    const next = reduce(prev, event);
    if (next === prev) return;
    this.state = next;
    this.callbacks.onStateChange?.(next);

    if (prev.phase === 'flying' && next.phase === 'aiming') {
      this.loadBird();
      this.settleMs = 0;
    } else if (next.phase === 'won' || next.phase === 'lost') {
      this.settleMs = 0;
      const won = next.phase === 'won';
      this.sfx?.play(won ? 'win' : 'lose');
      this.callbacks.onResult?.({ won, stars: next.stars });
    } else if (next.phase === 'aiming' && prev.phase === 'dragging') {
      this.pull = null;
      if (this.bird) Matter.Body.setPosition(this.bird, SLING.anchor);
    }
  }

  onDown(pt) {
    if (this.state.phase !== 'aiming' || !this.bird) return;
    const cssW = this.canvas.clientWidth || this.canvas.width;
    const cssH = this.canvas.clientHeight || this.canvas.height;
    const scale = Math.min(cssW / WORLD.width, cssH / WORLD.height) || 1;
    const grab = adaptiveGrabRadius(SLING.grabRadius, scale);
    if (!isWithinGrabRadius(pt, this.bird.position, grab)) return;
    this.dispatch({ type: 'DRAG_START' });
    this.pull = computePull(SLING.anchor, pt, SLING.maxPull);
    // move the bird immediately so band/aim ray and body agree on grab
    Matter.Body.setPosition(this.bird, {
      x: SLING.anchor.x + this.pull.x,
      y: SLING.anchor.y + this.pull.y,
    });
  }

  onMove(pt) {
    if (this.state.phase !== 'dragging' || !this.bird) return;
    this.pull = computePull(SLING.anchor, pt, SLING.maxPull);
    Matter.Body.setPosition(this.bird, {
      x: SLING.anchor.x + this.pull.x,
      y: SLING.anchor.y + this.pull.y,
    });
  }

  onUp() {
    if (this.state.phase !== 'dragging' || !this.bird) return;
    const pull = this.pull || { x: 0, y: 0 };
    if (shouldLaunch(pull, SLING.minPull)) {
      const v = computeLaunchVelocity(pull, SLING.power);
      launchBird(this.engine, this.bird, v);
      this.sfx?.play('launch');
      this.settleMs = 0;
      this.dispatch({ type: 'LAUNCH', now: performance.now() });
    } else {
      this.dispatch({ type: 'DRAG_CANCEL' });
    }
  }

  allSettled() {
    const bodies = Matter.Composite.allBodies(this.engine.world);
    for (const b of bodies) {
      if (b.isStatic) continue;
      if (Math.hypot(b.velocity.x, b.velocity.y) >= SETTLE.speedThreshold) return false;
    }
    return true;
  }

  birdOutOfBounds() {
    if (!this.bird) return false;
    const { x, y } = this.bird.position;
    return x < -200 || x > 1800 || y > 1100;
  }

  loop(now) {
    if (this.destroyed) return;
    const dt = Math.min(now - this.lastNow, 100);
    this.lastNow = now;

    const adv = advanceSteps(this.accum, dt);
    this.accum = adv.accum;
    for (let i = 0; i < adv.steps; i++) step(this.engine);
    if (adv.steps > 0) this.collector.flush();

    if (this.bird && this.birdOutOfBounds()) {
      Matter.Composite.remove(this.engine.world, this.bird);
      this.birds = this.birds.filter((b) => b !== this.bird);
      this.bird = null;
    }

    // phoenix flame trail while flying
    if (this.bird && this.state.phase === 'flying' && this.bird.plugin?.skin === 'phoenix') {
      const tr = this.bird.plugin.trail;
      tr.push({ x: this.bird.position.x, y: this.bird.position.y });
      if (tr.length > 16) tr.shift();
    }

    if (this.state.phase === 'flying') {
      if (this.allSettled()) {
        this.settleMs += dt;
      } else {
        this.settleMs = 0;
      }
      if (isSettleDue(this.settleMs, now, this.state.launchAt)) {
        this.dispatch({ type: 'SETTLED' });
      }
    }

    this.renderer.draw({
      theme: this.levelCfg.theme,
      t: now,
      slingAnchor: SLING.anchor,
      stretch: this.state.phase === 'dragging' ? this.pull : null,
      bird: this.bird,
      birds: this.birds,
      blocks: this.level.blocks.filter((b) => !isDestroyed(b)),
      pigs: this.level.pigs.filter((p) => !isDestroyed(p)),
      groundY: this.level.ground.position.y - 50,
    });

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  restart() {
    this.teardown();
    this.start();
  }

  teardown() {
    this.destroyed = true;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.input?.destroy();
    this.input = null;
    if (this.onResize) globalThis.removeEventListener?.('resize', this.onResize);
  }

  destroy() {
    this.teardown();
  }
}
