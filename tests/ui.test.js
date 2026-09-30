// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createHud, shouldShowRotateHint } from '../src/ui.js';

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

  // reviewer I3: beating the last level must not dead-end
  it('menu button present on final-level win', () => {
    const root = document.createElement('div');
    const hud = createHud(root, { onRestart: vi.fn(), onNext: vi.fn(), onSelectLevel: vi.fn() });
    hud.showResult({ won: true, stars: 3, hasNext: false });
    expect(root.querySelector('[data-testid="btn-menu"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="btn-next"]')).toBeNull();
  });

  // reviewer I4: spec mandates a mute switch
  it('mute button in topbar fires onToggleMute', () => {
    const root = document.createElement('div');
    const onToggleMute = vi.fn();
    const hud = createHud(root, {
      onRestart: vi.fn(),
      onNext: vi.fn(),
      onSelectLevel: vi.fn(),
      onToggleMute,
    });
    hud.renderTopBar({ birdsLeft: 3, levelIndex: 0, muted: false });
    root.querySelector('[data-testid="btn-mute"]').click();
    expect(onToggleMute).toHaveBeenCalled();
    hud.renderTopBar({ birdsLeft: 2, levelIndex: 0, muted: true });
    expect(root.querySelector('[data-testid="btn-mute"]').textContent).toContain('关');
  });

  // landscape guidance: portrait shows a rotate hint, landscape hides it
  it('shouldShowRotateHint is true only in portrait', () => {
    expect(shouldShowRotateHint(844, 390)).toBe(false); // landscape phone
    expect(shouldShowRotateHint(390, 844)).toBe(true); // portrait phone
    expect(shouldShowRotateHint(1280, 800)).toBe(false); // desktop
  });

  it('rotate hint toggles visibility', () => {
    const root = document.createElement('div');
    const hud = createHud(root, { onRestart: vi.fn(), onNext: vi.fn(), onSelectLevel: vi.fn() });
    hud.showRotateHint(true);
    const hint = root.querySelector('[data-testid="rotate-hint"]');
    expect(hint).toBeTruthy();
    expect(hint.textContent).toContain('横屏');
    expect(hint.style.display).not.toBe('none');
    hud.showRotateHint(false);
    expect(hint.style.display).toBe('none');
  });
});
