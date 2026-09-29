// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createHud } from '../src/ui.js';

describe('hud', () => {
  it('result overlay wires restart and next', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onRestart = vi.fn();
    const onNext = vi.fn();
    const hud = createHud(root, { onRestart, onNext, onSelectLevel: vi.fn() });
    hud.showResult({ won: true, stars: 2, hasNext: true });
    root.querySelector('[data-testid="btn-restart"]').click();
    expect(onRestart).toHaveBeenCalled();
    root.querySelector('[data-testid="btn-next"]').click();
    expect(onNext).toHaveBeenCalled();
    hud.hideOverlays();
    expect(root.querySelector('[data-testid="btn-next"]')).toBeNull();
  });

  it('level select renders locks', () => {
    const root = document.createElement('div');
    const hud = createHud(root, { onRestart: vi.fn(), onNext: vi.fn(), onSelectLevel: vi.fn() });
    hud.showLevelSelect({ levels: 3, stars: [2, 0, 0], unlocked: [true, true, false] });
    expect(root.querySelector('[data-testid="btn-level-0"]').disabled).toBe(false);
    expect(root.querySelector('[data-testid="btn-level-2"]').disabled).toBe(true);
    expect(root.querySelector('[data-testid="btn-level-0"]').textContent).toContain('★');
  });
});
