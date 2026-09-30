// Verify aim-ray fix: grab follows immediately, ray direction == launch direction.
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const OUT = process.argv[2] || '.';
const log = (...a) => console.log('[aimfix]', ...a);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => log('PAGE ERROR:', e.message));

await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="btn-level-0"]');
await page.evaluate(() => window.__app.startLevel(0));
await page.waitForTimeout(600);

const toScreen = (w) =>
  page.evaluate((p) => {
    const r = document.getElementById('game').getBoundingClientRect();
    const s = Math.min(r.width / 1600, r.height / 900);
    const ox = r.left + (r.width - 1600 * s) / 2;
    const oy = r.top + (r.height - 900 * s) / 2;
    return { x: ox + p.x * s, y: oy + p.y * s };
  }, w);

const birdPt = await toScreen({ x: 220, y: 620 });
const dragPt = await toScreen({ x: 100, y: 700 });

// M5: grab moves the bird BEFORE any mousemove
await page.mouse.move(birdPt.x, birdPt.y);
await page.mouse.down();
await page.waitForTimeout(60);
const afterDown = await page.evaluate(() => {
  const g = window.__game();
  return { bird: { ...g.bird.position }, pull: { ...g.pull }, anchor: { x: 220, y: 620 } };
});
const wantX = afterDown.anchor.x + afterDown.pull.x;
const wantY = afterDown.anchor.y + afterDown.pull.y;
const followed =
  Math.abs(afterDown.bird.x - wantX) < 1 && Math.abs(afterDown.bird.y - wantY) < 1;
log('M5 grab-follow:', followed ? 'PASS' : `FAIL bird=${JSON.stringify(afterDown.bird)} want=(${wantX.toFixed(1)},${wantY.toFixed(1)})`);

await page.mouse.move(dragPt.x, dragPt.y, { steps: 8 });
await page.waitForTimeout(80);
await page.screenshot({ path: path.join(OUT, 'aimfix-drag.png') });

const pull = await page.evaluate(() => ({ ...window.__game().pull }));
await page.mouse.up();
// sample velocity ASAP after launch
await page.waitForTimeout(16);
const vel = await page.evaluate(() => ({ ...window.__game().bird.velocity }));

const angRay = (Math.atan2(-pull.y, -pull.x) * 180) / Math.PI;
const angVel = (Math.atan2(vel.y, vel.x) * 180) / Math.PI;
let diff = angVel - angRay;
while (diff > 180) diff -= 360;
while (diff < -180) diff += 360;
log(`ray angle=${angRay.toFixed(1)}° launch=${angVel.toFixed(1)}° diff=${diff.toFixed(1)}°`);

// let it fly and confirm game still settles
await page.waitForTimeout(2500);
const ph = await page.evaluate(() => window.__game().state.phase);
log('phase after shot:', ph);

await browser.close();
const ok = followed && Math.abs(diff) < 10;
console.log(ok ? 'AIM FIX VERIFIED' : 'AIM FIX FAILED');
process.exit(ok ? 0 : 1);
