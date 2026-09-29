import { describe, it, expect } from 'vitest';
import { loadProgress, saveStars, isUnlocked, totalStars } from '../src/progress.js';

const memStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  };
};

describe('progress', () => {
  it('defaults to three zero-star levels', () => {
    expect(loadProgress(memStorage())).toEqual({ stars: [0, 0, 0] });
  });

  it('saves max stars per level', () => {
    let s = memStorage();
    s = saveStars(s, 0, 2);
    s = saveStars(s, 0, 1); // no downgrade
    expect(loadProgress(s).stars).toEqual([2, 0, 0]);
  });

  it('locks level until previous has a star', () => {
    const p = { stars: [0, 0, 0] };
    expect(isUnlocked(p, 0)).toBe(true);
    expect(isUnlocked(p, 1)).toBe(false);
    expect(isUnlocked({ stars: [1, 0, 0] }, 1)).toBe(true);
  });

  it('corrupt stars reset to zero', () => {
    const s = { getItem: () => '{"stars":[9,"x",-1]}', setItem: () => {} };
    expect(loadProgress(s)).toEqual({ stars: [0, 0, 0] });
  });

  it('survives storage error', () => {
    const boom = {
      getItem: () => {
        throw new Error('nope');
      },
      setItem: () => {
        throw new Error('nope');
      },
    };
    expect(() => loadProgress(boom)).not.toThrow();
    expect(loadProgress(boom)).toEqual({ stars: [0, 0, 0] });
    expect(() => saveStars(boom, 0, 3)).not.toThrow();
  });

  it('totals stars', () => {
    expect(totalStars({ stars: [3, 1, 0] })).toBe(4);
  });
});
