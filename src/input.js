export function createInput(canvas, toWorld, handlers) {
  const rectPoint = (e) => {
    const rect = canvas.getBoundingClientRect();
    return toWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const onDown = (e) => handlers.onDown(rectPoint(e));
  const onMove = (e) => handlers.onMove(rectPoint(e));
  const onUp = (e) => handlers.onUp(rectPoint(e));
  canvas.addEventListener('mousedown', onDown);
  globalThis.addEventListener?.('mousemove', onMove);
  globalThis.addEventListener?.('mouseup', onUp);
  return {
    destroy() {
      canvas.removeEventListener('mousedown', onDown);
      globalThis.removeEventListener?.('mousemove', onMove);
      globalThis.removeEventListener?.('mouseup', onUp);
    },
  };
}
