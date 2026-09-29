import { createWorld } from './physics.js';

const { engine } = createWorld();
console.log('world ready', engine.world.bodies.length);
