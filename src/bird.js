import Matter from 'matter-js';
import { BIRD } from './config.js';

export function createBird(engine, anchor) {
  const body = Matter.Bodies.circle(anchor.x, anchor.y, BIRD.radius, {
    density: BIRD.density,
    friction: 0.5,
    restitution: 0.4,
  });
  // Must freeze via setStatic() after creation: creating with the isStatic
  // option never records _original mass, so setStatic(false) can't restore it.
  Matter.Body.setStatic(body, true);
  body.plugin = { kind: 'bird' };
  Matter.Composite.add(engine.world, body);
  return body;
}

export function launchBird(engine, bird, velocity) {
  Matter.Body.setStatic(bird, false);
  Matter.Body.setVelocity(bird, velocity);
}
