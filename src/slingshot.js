export function computePull(anchor, pointer, maxPull) {
  let dx = pointer.x - anchor.x;
  let dy = pointer.y - anchor.y;
  const len = Math.hypot(dx, dy);
  if (len > maxPull && len > 0) {
    const s = maxPull / len;
    dx *= s;
    dy *= s;
  }
  return { x: dx, y: dy };
}

export function computeLaunchVelocity(pull, power) {
  return { x: -pull.x * power, y: -pull.y * power };
}

export function shouldLaunch(pull, minPull) {
  return Math.hypot(pull.x, pull.y) >= minPull;
}

export function isWithinGrabRadius(point, birdPos, grabRadius) {
  return Math.hypot(point.x - birdPos.x, point.y - birdPos.y) <= grabRadius;
}
