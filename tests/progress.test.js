import { describe, it, expect } from 'vitest';
import { loadProgress, saveStars, isUnlocked, totalStars, getStorage } from '../src/progress.js';
import { LEVELS } from '../src/levels/index.js';

const EIGHT_ZEROS = [0, 0, 0, 0, 0, 0, 0, 0];

const memStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  };
};

describe('progress', () => {
  it('defaults to eight zero-star levels', () => {
    expect(loadProgress(memStorage())).toEqual({ stars: EIGHT_ZEROS });
    expect(loadProgress(memStorage()).stars).toHaveLength(LEVELS.length);
  });

  it('saves max stars per level', () => {
    let s = memStorage();
    s = saveStars(s, 0, 2);
    s = saveStars(s, 0, 1); // no downgrade
    expect(loadProgress(s).stars).toEqual([2, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('locks level until previous has a star', () => {
    const p = { stars: [0, 0, 0] };
    expect(isUnlocked(p, 0)).toBe(true);
    expect(isUnlocked(p, 1)).toBe(false);
    expect(isUnlocked({ stars: [1, 0, 0] }, 1)).toBe(true);
  });

  it('corrupt stars reset to zero', () => {
    const s = { getItem: () => '{"stars":[9,"x",-1]}', setItem: () => {} };
    expect(loadProgress(s)).toEqual({ stars: EIGHT_ZEROS });
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
    expect(loadProgress(boom)).toEqual({ stars: EIGHT_ZEROS });
    expect(() => saveStars(boom, 0, 3)).not.toThrow();
  });

  it('totals stars', () => {
    expect(totalStars({ stars: [3, 1, 0] })).toBe(4);
  });

  // reviewer I2(a): write throws while read succeeds (quota / private mode)
  it('stars survive when setItem throws but getItem works', () => {
    const s = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    saveStars(s, 0, 2);
    expect(loadProgress(s).stars).toEqual([2, 0, 0, 0, 0, 0, 0, 0]);
  });

  // reviewer I2(b): accessing window.localStorage itself may throw
  it('getStorage survives property access throwing', () => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      const st = getStorage();
      expect(() => st.getItem('k')).not.toThrow();
      expect(st.getItem('k')).toBeNull();
      st.setItem('k', 'v');
      expect(st.getItem('k')).toBe('v');
    } finally {
      if (desc) Object.defineProperty(globalThis, 'localStorage', desc);
      else delete globalThis.localStorage;
    }
  });
});
