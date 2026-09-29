import Matter from 'matter-js';

export function createWorld() {
  const engine = Matter.Engine.create();
  engine.gravity.y = 1;
  return { engine, world: engine.world };
}

export function step(engine, delta = 1000 / 60) {
  Matter.Engine.update(engine, delta);
}

export function addGround(engine, { width, height }) {
  const ground = Matter.Bodies.rectangle(width / 2, height + 50, width, 100, {
    isStatic: true,
    friction: 0.9,
    label: 'ground',
  });
  Matter.Composite.add(engine.world, ground);
  return ground;
}
