// Wiring checks: wall moved closer (pixel) + bird frictionAir rises in water.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const log = (...a) => console.log('[wire]', ...a);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => log('PAGE ERROR:', e.message));
await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="btn-level-0"]');

// wall position via level body
await page.evaluate(() => window.__app.startLevel(0));
await page.waitForTimeout(400);
const wallX = await page.evaluate(() => window.__game().level.wall.position.x);
log('wall x:', wallX, '(want 1300)');

// wall pixel on canvas (grey column at x1300 y400)
const wallPx = await page.evaluate(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const cssW = canvas.clientWidth;
  const scale = Math.min(cssW / 1600, canvas.clientHeight / 900);
  const r = canvas.width / cssW;
  const ox = ((cssW - 1600 * scale) / 2) * r;
  const oy = ((canvas.clientHeight - 900 * scale) / 2) * r;
  const d = ctx.getImageData(Math.round(1300 * scale * r + ox), Math.round(400 * scale * r + oy), 1, 1).data;
  return [d[0], d[1], d[2]];
});
log('wall pixel:', JSON.stringify(wallPx), 'expect ~[120,144,156]');
const wallVisible = Math.abs(wallPx[0] - 120) < 40 && Math.abs(wallPx[2] - 156) < 40;

// water drag: launch into the pond, sample frictionAir mid-submersion
await page.evaluate(() => window.__app.startLevel(8));
await page.waitForTimeout(500);
const pts = await page.evaluate(() => {
  const r = document.getElementById('game').getBoundingClientRect();
  const s = Math.min(r.width / 1600, r.height / 900);
  const ox = r.left + (r.width - 1600 * s) / 2;
  const oy = r.top + (r.height - 900 * s) / 2;
  return {
    bird: { x: ox + 220 * s, y: oy + 620 * s },
    drag: { x: ox + 160 * s, y: oy + 720 * s }, // strong down-left pull → flat far shot into pond
  };
});
await page.mouse.move(pts.bird.x, pts.bird.y);
await page.mouse.down();
await page.mouse.move(pts.drag.x, pts.drag.y, { steps: 8 });
await page.mouse.up();
let sawWaterDrag = false;
let sawAirDrag = false;
for (let i = 0; i < 30; i++) {
  const f = await page.evaluate(() => {
    const g = window.__game();
    if (!g.bird) return null;
    return { air: g.bird.frictionAir, y: g.bird.position.y, phase: g.state.phase };
  });
  if (!f) break;
  if (f.y > 560 && f.air === 0.06) sawWaterDrag = true;
  if (f.y <= 560 && f.air === 0.01) sawAirDrag = true;
  if (f.phase !== 'flying' && f.phase !== 'dragging') break;
  await page.waitForTimeout(80);
}
log('saw air drag 0.01 before water:', sawAirDrag, '| saw water drag 0.06:', sawWaterDrag);

await browser.close();
const ok = wallX === 1300 && wallVisible && sawWaterDrag;
console.log(ok ? 'WIRING PASSED' : 'WIRING FAILED');
process.exit(ok ? 0 : 1);
