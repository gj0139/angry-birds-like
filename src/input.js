export function createInput(canvas, toWorld, handlers) {
  // Pointer Events unify mouse, touch and pen — mobile touch never fired
  // the old mouse listeners reliably.
  const pt = (e) => {
    const rect = canvas.getBoundingClientRect();
    return toWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const down = (e) => {
    e.preventDefault?.();
    handlers.onDown(pt(e));
  };
  const move = (e) => handlers.onMove(pt(e));
  const up = (e) => handlers.onUp(pt(e));

  canvas.addEventListener('pointerdown', down);
  globalThis.addEventListener('pointermove', move);
  globalThis.addEventListener('pointerup', up);
  globalThis.addEventListener('pointercancel', up);
  return {
    destroy() {
      canvas.removeEventListener('pointerdown', down);
      globalThis.removeEventListener('pointermove', move);
      globalThis.removeEventListener('pointerup', up);
      globalThis.removeEventListener('pointercancel', up);
    },
  };
}
