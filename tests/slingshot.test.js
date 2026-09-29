import { describe, it, expect } from 'vitest';
import { computePull, computeLaunchVelocity, shouldLaunch, isWithinGrabRadius } from '../src/slingshot.js';

const anchor = { x: 220, y: 620 };

describe('slingshot', () => {
  it('pull equals pointer minus anchor', () => {
    expect(computePull(anchor, { x: 320, y: 620 }, 120)).toEqual({ x: 100, y: 0 });
  });
  it('clamps pull length to maxPull', () => {
    const pull = computePull(anchor, { x: 520, y: 620 }, 120); // stretch 300
    expect(Math.hypot(pull.x, pull.y)).toBeCloseTo(120, 5);
    expect(pull.x).toBeCloseTo(120, 5);
    expect(pull.y).toBeCloseTo(0, 5);
  });
  it('launch velocity is reverse pull times power', () => {
    const v = computeLaunchVelocity({ x: 100, y: 0 }, 0.2);
    expect(v.x).toBeCloseTo(-20, 5);
    expect(v.y).toBeCloseTo(0, 5);
  });
  it('no launch below min pull', () => {
    expect(shouldLaunch({ x: 3, y: 4 }, 10)).toBe(false); // length 5
    expect(shouldLaunch({ x: 6, y: 8 }, 10)).toBe(true); // length 10
  });
  it('grab radius check', () => {
    expect(isWithinGrabRadius({ x: 250, y: 620 }, anchor, 60)).toBe(true);
    expect(isWithinGrabRadius({ x: 400, y: 620 }, anchor, 60)).toBe(false);
  });
});
