export const WORLD = { width: 1600, height: 900 };
export const GROUND_Y = 800;

export const SLING = {
  anchor: { x: 220, y: 620 },
  maxPull: 120,
  minPull: 10,
  power: 0.28, // raised from 0.20 — full pull now hits the wall mid-height
  grabRadius: 60,
};

export const SETTLE = {
  speedThreshold: 0.5,
  durationMs: 1500,
  timeoutMs: 6000,
};

export const PIG = { radius: 22, maxHp: 10, impactKillSpeed: 8 };
// restitution is paired as min(a,b): ground stays 0 (no bounce on land),
// the back wall (0.9) therefore bounces the bird at this value.
export const BIRD = { radius: 18, density: 0.005, restitution: 0.8 };

// Back wall behind every level's structures: bird bounces off it with a
// physical restitution (normal component reversed, scaled by restitution).
// Pulled closer per playtest feedback — reachable with a normal arc.
export const WALL = { x: 1300, width: 40, restitution: 0.9, friction: 0.05 };

// Air friction: base everywhere, raised for the bird while submerged.
export const DRAG = { air: 0.01, water: 0.06 };

// Water refraction (cartoon model): apparent depth = real depth / n.
export const WATER_REFRACT_INDEX = 1.33;
