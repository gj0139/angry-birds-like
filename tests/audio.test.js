import { describe, it, expect } from 'vitest';
import { createSfx } from '../src/audio.js';

describe('sfx', () => {
  it('starts unmuted and toggles', () => {
    const sfx = createSfx();
    expect(sfx.isMuted()).toBe(false);
    sfx.setMuted(true);
    expect(sfx.isMuted()).toBe(true);
  });

  it('play does not throw without AudioContext (node env)', () => {
    const sfx = createSfx();
    expect(() => sfx.play('launch')).not.toThrow();
    expect(() => sfx.play('nope')).not.toThrow(); // unknown name ignored
  });

  it('play does not throw while muted', () => {
    const sfx = createSfx();
    sfx.setMuted(true);
    expect(() => sfx.play('impact')).not.toThrow();
  });
});
