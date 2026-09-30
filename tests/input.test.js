// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createInput } from '../src/input.js';

function fire(target, type, x, y) {
  const E = globalThis.PointerEvent || MouseEvent;
  const ev = new E(type, { bubbles: true, clientX: x, clientY: y });
  target.dispatchEvent(ev);
}

describe('createInput (pointer events: mouse + touch)', () => {
  it('maps pointer coordinates through toWorld and fires handlers', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const toWorld = vi.fn((p) => p);
    const handlers = { onDown: vi.fn(), onMove: vi.fn(), onUp: vi.fn() };
    const input = createInput(canvas, toWorld, handlers);

    fire(canvas, 'pointerdown', 10, 20);
    expect(handlers.onDown).toHaveBeenCalledWith({ x: 10, y: 20 });

    fire(globalThis, 'pointermove', 30, 40);
    expect(handlers.onMove).toHaveBeenCalledWith({ x: 30, y: 40 });

    fire(globalThis, 'pointerup', 50, 60);
    expect(handlers.onUp).toHaveBeenCalledWith({ x: 50, y: 60 });

    input.destroy();
  });

  it('fires onUp on pointercancel so a drag never dangles', () => {
    const canvas = document.createElement('canvas');
    const handlers = { onDown: vi.fn(), onMove: vi.fn(), onUp: vi.fn() };
    const input = createInput(canvas, (p) => p, handlers);
    fire(canvas, 'pointerdown', 1, 1);
    fire(globalThis, 'pointercancel', 2, 2);
    expect(handlers.onUp).toHaveBeenCalled();
    input.destroy();
  });

  it('destroy removes listeners', () => {
    const canvas = document.createElement('canvas');
    const handlers = { onDown: vi.fn(), onMove: vi.fn(), onUp: vi.fn() };
    const input = createInput(canvas, (p) => p, handlers);
    input.destroy();
    fire(canvas, 'pointerdown', 9, 9);
    expect(handlers.onDown).not.toHaveBeenCalled();
  });
});
