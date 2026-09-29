import { describe, it, expect } from 'vitest';
import { createGame, reduce } from '../src/gameState.js';

const chain = (state, ...events) => events.reduce(reduce, state);

describe('gameState', () => {
  it('happy path: aiming → dragging → flying → won with 3 stars', () => {
    let s = createGame(3, 2);
    s = reduce(s, { type: 'DRAG_START' });
    expect(s.phase).toBe('dragging');
    s = reduce(s, { type: 'LAUNCH', now: 1000 });
    expect(s).toMatchObject({ phase: 'flying', birdsRemaining: 2 });
    s = reduce(s, { type: 'PIG_DIED' });
    s = reduce(s, { type: 'PIG_DIED' });
    s = reduce(s, { type: 'SETTLED' });
    expect(s.phase).toBe('won');
    expect(s.stars).toBe(3); // min(2+1, 3)
  });

  it('lose when birds run out and pigs remain', () => {
    let s = createGame(1, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'LAUNCH', now: 0 }, { type: 'SETTLED' });
    expect(s.phase).toBe('lost');
  });

  it('reload next bird when pigs survive', () => {
    let s = createGame(3, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'LAUNCH', now: 0 }, { type: 'SETTLED' });
    expect(s.phase).toBe('aiming');
    expect(s.birdsRemaining).toBe(2);
    expect(s.pigsRemaining).toBe(1);
  });

  it('win when last pig dies before settle check', () => {
    let s = createGame(2, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'LAUNCH', now: 0 }, { type: 'PIG_DIED' }, { type: 'SETTLED' });
    expect(s.phase).toBe('won');
    expect(s.stars).toBe(2); // min(1+1, 3)
  });

  it('stars bottom out at 1', () => {
    let s = createGame(1, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'LAUNCH', now: 0 }, { type: 'PIG_DIED' }, { type: 'SETTLED' });
    expect(s.stars).toBe(1);
  });

  it('events in wrong phase are ignored', () => {
    const s = createGame(3, 1);
    expect(reduce(s, { type: 'LAUNCH', now: 0 })).toEqual(s);
    expect(reduce(s, { type: 'SETTLED' })).toEqual(s);
    const d = reduce(s, { type: 'DRAG_START' });
    expect(reduce(d, { type: 'DRAG_START' }).phase).toBe('dragging');
  });

  it('drag cancel returns to aiming', () => {
    let s = createGame(3, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'DRAG_CANCEL' });
    expect(s.phase).toBe('aiming');
    expect(s.birdsRemaining).toBe(3);
  });

  it('RESTART resets everything', () => {
    let s = createGame(1, 2);
    s = chain(
      s,
      { type: 'DRAG_START' },
      { type: 'LAUNCH', now: 0 },
      { type: 'PIG_DIED' },
      { type: 'SETTLED' },
      { type: 'RESTART', birds: 1, pigs: 2 },
    );
    expect(s).toMatchObject({ phase: 'aiming', birdsRemaining: 1, pigsRemaining: 2, stars: 0 });
  });
});
