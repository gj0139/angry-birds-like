import { MATERIALS } from './materials.js';
import { WORLD, PIG, BIRD } from './config.js';

const PIG_FILL = '#7CB342';
const PIG_STROKE = '#558B2F';
const BIRD_FILL = '#E53935';
const BIRD_STROKE = '#B71C1C';
const GROUND_FILL = '#8D6E63';
const SKY_FILL = '#81D4FA';
const SLING_FILL = '#6D4C41';
const AIM_LENGTH = 160;

export function computeViewport(worldW, worldH, canvasW, canvasH) {
  const scale = Math.min(canvasW / worldW, canvasH / worldH);
  const offsetX = (canvasW - worldW * scale) / 2;
  const offsetY = (canvasH - worldH * scale) / 2;
  return { scale, offsetX, offsetY };
}

export function toWorld(point, vp) {
  return { x: (point.x - vp.offsetX) / vp.scale, y: (point.y - vp.offsetY) / vp.scale };
}

export function toScreen(point, vp) {
  return { x: point.x * vp.scale + vp.offsetX, y: point.y * vp.scale + vp.offsetY };
}

export function createRenderer(canvas) {
  let vp = computeViewport(WORLD.width, WORLD.height, canvas.width || 1600, canvas.height || 900);

  function resize() {
    const dpr = globalThis.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || canvas.width;
    const cssH = canvas.clientHeight || canvas.height;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    vp = computeViewport(WORLD.width, WORLD.height, cssW, cssH);
  }

  function toWorldPt(p) {
    return toWorld(p, vp);
  }

  function toScreenPt(p) {
    return toScreen(p, vp);
  }

  function drawSlingFork(ctx, anchor) {
    ctx.strokeStyle = SLING_FILL;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y + 70);
    ctx.lineTo(anchor.x, anchor.y);
    ctx.moveTo(anchor.x, anchor.y);
    ctx.lineTo(anchor.x - 16, anchor.y - 36);
    ctx.moveTo(anchor.x, anchor.y);
    ctx.lineTo(anchor.x + 16, anchor.y - 36);
    ctx.stroke();
  }

  function drawBands(ctx, anchor, birdPos) {
    ctx.strokeStyle = '#4E342E';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(anchor.x - 16, anchor.y - 36);
    ctx.lineTo(birdPos.x, birdPos.y);
    ctx.moveTo(anchor.x + 16, anchor.y - 36);
    ctx.lineTo(birdPos.x, birdPos.y);
    ctx.stroke();
  }

  function drawAimRay(ctx, birdPos, stretch) {
    const len = Math.hypot(stretch.x, stretch.y);
    if (len < 0.01) return;
    // Launch velocity is -stretch * power, so the truthful indicator is
    // exactly this direction (the fork-tip band line is ~15-20° off).
    const ux = -stretch.x / len;
    const uy = -stretch.y / len;
    const ex = birdPos.x + ux * AIM_LENGTH;
    const ey = birdPos.y + uy * AIM_LENGTH;
    ctx.save();
    ctx.setLineDash([12, 9]);
    ctx.strokeStyle = '#B71C1C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(birdPos.x, birdPos.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // arrowhead
    ctx.setLineDash([]);
    const ah = 12;
    const px = -uy;
    const py = ux;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ux * ah + px * ah * 0.5, ey - uy * ah + py * ah * 0.5);
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ux * ah - px * ah * 0.5, ey - uy * ah - py * ah * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function draw(scene) {
    const ctx = canvas.getContext('2d');
    // Backing store is in device px while vp is computed from CSS px;
    // r bridges the two spaces so draw and input stay inverses at any dpr.
    const cssW = canvas.clientWidth || canvas.width;
    const r = canvas.width / cssW;
    ctx.setTransform(vp.scale * r, 0, 0, vp.scale * r, vp.offsetX * r, vp.offsetY * r);

    ctx.fillStyle = SKY_FILL;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = GROUND_FILL;
    ctx.fillRect(0, scene.groundY, WORLD.width, WORLD.height - scene.groundY);

    const anchor = scene.slingAnchor;
    const birdPos = scene.stretch
      ? { x: anchor.x + scene.stretch.x, y: anchor.y + scene.stretch.y }
      : anchor;

    drawSlingFork(ctx, anchor);
    if (scene.bird) drawBands(ctx, anchor, birdPos);
    if (scene.stretch) drawAimRay(ctx, birdPos, scene.stretch);

    for (const b of scene.blocks) {
      const mat = MATERIALS[b.plugin.material] || MATERIALS.wood;
      const w = b.plugin.w || 0;
      const h = b.plugin.h || 0;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle || 0);
      ctx.fillStyle = mat.fill;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = mat.stroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      if (b.plugin.hp < b.plugin.maxHp) {
        const ratio = b.plugin.hp / b.plugin.maxHp;
        ctx.fillStyle = '#00000055';
        ctx.fillRect(-w / 2, -h / 2 - 8, w, 4);
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(-w / 2, -h / 2 - 8, w * ratio, 4);
      }
      ctx.restore();
    }

    for (const pig of scene.pigs) {
      ctx.save();
      ctx.translate(pig.position.x, pig.position.y);
      ctx.rotate(pig.angle || 0);
      ctx.fillStyle = PIG_FILL;
      ctx.beginPath();
      ctx.arc(0, 0, PIG.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PIG_STROKE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-7, -6, 5, 0, Math.PI * 2);
      ctx.arc(7, -6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-7, -6, 2, 0, Math.PI * 2);
      ctx.arc(7, -6, 2, 0, Math.PI * 2);
      ctx.fill();
      const ratio = pig.plugin.hp / pig.plugin.maxHp;
      ctx.fillStyle = '#00000055';
      ctx.fillRect(-PIG.radius, -PIG.radius - 12, PIG.radius * 2, 5);
      ctx.fillStyle = '#66BB6A';
      ctx.fillRect(-PIG.radius, -PIG.radius - 12, PIG.radius * 2 * ratio, 5);
      ctx.restore();
    }

    for (const birdBody of scene.birds || []) {
      ctx.save();
      ctx.translate(birdBody.position.x, birdBody.position.y);
      ctx.rotate(birdBody.angle || 0);
      ctx.fillStyle = BIRD_FILL;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = BIRD_STROKE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(5, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(7, -5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFB300';
      ctx.beginPath();
      ctx.moveTo(BIRD.radius - 2, -3);
      ctx.lineTo(BIRD.radius + 8, 0);
      ctx.lineTo(BIRD.radius - 2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return { resize, draw, toWorld: toWorldPt, toScreen: toScreenPt };
}
