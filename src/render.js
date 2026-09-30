import { MATERIALS } from './materials.js';
import { WORLD, PIG, BIRD } from './config.js';

const PIG_FILL = '#7CB342';
const PIG_STROKE = '#558B2F';
const BIRD_FILL = '#E53935';
const BIRD_STROKE = '#B71C1C';
const SLING_FILL = '#6D4C41';
const AIM_LENGTH = 160;

export const THEME_KEYS = ['day', 'forest', 'dusk', 'desert', 'night', 'snow', 'sea', 'dawn'];

const THEMES = {
  day: { sky: '#7EC8E3', skyLow: '#C9EFFF', hillFar: '#A5D6A7', hillNear: '#81C784', ground: '#8D6E63', groundEdge: '#5D4037' },
  forest: { sky: '#7FC8A9', skyLow: '#CDE9DC', hillFar: '#4CAF50', hillNear: '#2E7D32', ground: '#5D4037', groundEdge: '#3E2723' },
  dusk: { sky: '#FF7043', skyLow: '#FFAB91', hillFar: '#8D6E63', hillNear: '#5D4037', ground: '#4E342E', groundEdge: '#3E2723' },
  desert: { sky: '#90CAF9', skyLow: '#FFF9C4', hillFar: '#BCAAA4', hillNear: '#A1887F', ground: '#D7CCC8', groundEdge: '#A1887F' },
  night: { sky: '#0D1B2A', skyLow: '#1B2838', hillFar: '#1B2838', hillNear: '#15202E', ground: '#4E342E', groundEdge: '#3E2723' },
  snow: { sky: '#B3E5FC', skyLow: '#E1F5FE', hillFar: '#CFD8DC', hillNear: '#ECEFF1', ground: '#CFD8DC', groundEdge: '#90A4AE' },
  sea: { sky: '#4FC3F7', skyLow: '#B3E5FC', hillFar: '#66BB6A', hillNear: '#43A047', ground: '#FFE0B2', groundEdge: '#FFCC80' },
  dawn: { sky: '#F8BBD0', skyLow: '#F3E5F5', hillFar: '#A1887F', hillNear: '#8D6E63', ground: '#795548', groundEdge: '#4E342E' },
};

const STARS = [
  [120, 90], [320, 160], [520, 70], [700, 200], [880, 110], [1060, 60],
  [1240, 180], [1420, 100], [1540, 220], [220, 260], [640, 300], [980, 240],
];

function drawCloud(ctx, x, y, s) {
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 30 * s, y - 12 * s, 32 * s, 0, Math.PI * 2);
  ctx.arc(x + 66 * s, y, 24 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawPine(ctx, x, baseY, h, snow = false) {
  ctx.fillStyle = '#33691E';
  ctx.beginPath();
  ctx.moveTo(x, baseY - h);
  ctx.lineTo(x - h * 0.45, baseY);
  ctx.lineTo(x + h * 0.45, baseY);
  ctx.closePath();
  ctx.fill();
  if (snow) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x, baseY - h);
    ctx.lineTo(x - h * 0.2, baseY - h * 0.55);
    ctx.lineTo(x + h * 0.2, baseY - h * 0.55);
    ctx.closePath();
    ctx.fill();
  }
}

function drawDecor(ctx, theme, groundY) {
  switch (theme) {
    case 'day': {
      ctx.fillStyle = '#FFE082';
      ctx.beginPath();
      ctx.arc(1400, 140, 64, 0, Math.PI * 2);
      ctx.fill();
      drawCloud(ctx, 260, 180, 1.1);
      drawCloud(ctx, 780, 120, 0.9);
      drawCloud(ctx, 1180, 240, 1);
      break;
    }
    case 'dusk': {
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(1340, groundY - 170, 78, 0, Math.PI * 2);
      ctx.fill();
      drawCloud(ctx, 360, 200, 1.2);
      drawCloud(ctx, 940, 150, 0.8);
      break;
    }
    case 'dawn': {
      ctx.fillStyle = '#FFAB91';
      ctx.beginPath();
      ctx.arc(1340, groundY - 130, 70, 0, Math.PI * 2);
      ctx.fill();
      drawCloud(ctx, 300, 170, 1.1);
      drawCloud(ctx, 860, 230, 0.9);
      break;
    }
    case 'night': {
      ctx.fillStyle = '#F5F5C6';
      ctx.beginPath();
      ctx.arc(1400, 150, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0D1B2A';
      ctx.beginPath();
      ctx.arc(1422, 136, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      for (const [sx, sy] of STARS) {
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'forest': {
      for (const x of [80, 240, 420, 620, 840, 1040, 1260, 1500]) {
        drawPine(ctx, x, groundY - 40, 120 + (x % 3) * 30);
      }
      break;
    }
    case 'desert': {
      ctx.fillStyle = '#BCAAA4';
      ctx.fillRect(160, groundY - 220, 220, 220);
      ctx.fillRect(240, groundY - 280, 90, 70);
      ctx.fillRect(1180, groundY - 180, 260, 180);
      ctx.fillRect(1280, groundY - 230, 90, 60);
      ctx.fillStyle = '#8D6E63'; // cactus
      ctx.fillRect(640, groundY - 110, 24, 110);
      ctx.fillRect(612, groundY - 80, 28, 20);
      ctx.fillRect(664, groundY - 96, 28, 20);
      break;
    }
    case 'snow': {
      for (const x of [140, 360, 560, 1180, 1420]) drawPine(ctx, x, groundY - 30, 130, true);
      ctx.fillStyle = '#FFFFFF';
      for (const [sx, sy] of STARS.slice(0, 8)) {
        ctx.beginPath();
        ctx.arc(sx, sy + 40, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'sea': {
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(1420, 130, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath();
      ctx.ellipse(420, groundY - 60, 160, 70, 0, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(1180, groundY - 50, 130, 55, 0, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#81D4FA';
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let x = 60; x < 1560; x += 60) {
        ctx.arc(x, groundY - 14, 26, Math.PI, 0, true);
      }
      ctx.stroke();
      break;
    }
    default:
      break;
  }
}

function drawBackground(ctx, themeKey, groundY) {
  const t = THEMES[themeKey] || THEMES.day;
  const W = WORLD.width;
  const H = WORLD.height;

  ctx.fillStyle = t.sky;
  ctx.fillRect(0, 0, W, groundY);
  ctx.fillStyle = t.skyLow;
  ctx.fillRect(0, groundY - 220, W, 220);

  drawDecor(ctx, themeKey in THEMES ? themeKey : 'day', groundY);

  ctx.fillStyle = t.hillFar;
  ctx.beginPath();
  ctx.ellipse(420, groundY + 10, 430, 170, 0, Math.PI, 2 * Math.PI);
  ctx.ellipse(1260, groundY + 10, 400, 140, 0, Math.PI, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = t.hillNear;
  ctx.beginPath();
  ctx.ellipse(880, groundY + 14, 360, 120, 0, Math.PI, 2 * Math.PI);
  ctx.ellipse(160, groundY + 14, 300, 100, 0, Math.PI, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = t.ground;
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = t.groundEdge;
  ctx.fillRect(0, groundY, W, 6);
}

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

    drawBackground(ctx, scene.theme, scene.groundY);

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
