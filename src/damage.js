export function applyImpactDamage(body, impactSpeed, { byBird = false } = {}) {
  const p = body.plugin;
  if (!p || typeof p.hp !== 'number') return false;
  if (p.destroyed) return true;
  if (impactSpeed < 1) return false;
  p.hp -= impactSpeed * (byBird ? 2 : 1);
  if (p.hp <= 0) {
    p.hp = 0;
    p.destroyed = true;
    return true;
  }
  return false;
}

export function isDestroyed(body) {
  return Boolean(body.plugin && body.plugin.destroyed);
}
