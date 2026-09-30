// Measure: does the bird's initial velocity direction match -pull (band direction)?
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="btn-level-0"]');
await page.evaluate(() => window.__app.startLevel(0));
await page.waitForTimeout(600);

function toScreen(world) {
  return page.evaluate((w) => {
    const r = document.getElementById('game').getBoundingClientRect();
    const s = Math.min(r.width / 1600, r.height / 900);
    const ox = r.left + (r.width - 1600 * s) / 2;
    const oy = r.top + (r.height - 900 * s) / 2;
    return { x: ox + w.x * s, y: oy + w.y * s };
  }, world);
}

const cases = [
  { name: 'flat-left', world: { x: 100, y: 620 } },
  { name: 'down-left', world: { x: 100, y: 700 } },
  { name: 'up-left', world: { x: 100, y: 560 } },
];

const results = [];
for (const c of cases) {
  await page.evaluate(() => window.__app.startLevel(0));
  await page.waitForTimeout(400);
  const birdPt = await toScreen({ x: 220, y: 620 });
  const dragPt = await toScreen(c.world);
  await page.mouse.move(birdPt.x, birdPt.y);
  await page.mouse.down();
  await page.mouse.move(dragPt.x, dragPt.y, { steps: 5 });
  await page.waitForTimeout(50);
  const pull = await page.evaluate(() => {
    const g = window.__game();
    return { ...g.pull, birdPos: { ...g.bird.position } };
  });
  await page.mouse.up();
  await page.waitForTimeout(50);
  const vel = await page.evaluate(() => {
    const g = window.__game();
    return { ...g.bird.velocity, pos: { ...g.bird.position } };
  });
  const angPull = (Math.atan2(-pull.y, -pull.x) * 180) / Math.PI; // launch = -pull
  const angVel = (Math.atan2(vel.y, vel.x) * 180) / Math.PI;
  const bandTipMid = { x: 220, y: 620 - 36 }; // fork arm midpoint above anchor
  // perceived line of fire: from bird through fork-tip midpoint, extended
  const angBand = (Math.atan2(bandTipMid.y - pull.birdPos.y, bandTipMid.x - pull.birdPos.x) * 180) / Math.PI;
  results.push({
    case: c.name,
    pull: { x: +pull.x.toFixed(1), y: +pull.y.toFixed(1) },
    angVel: +angVel.toFixed(1),
    angMinusPull: +angPull.toFixed(1),
    angBandTipLine: +angBand.toFixed(1),
    diffVelVsMinusPull: +(angVel - angPull).toFixed(2),
    diffBandVsActual: +(angBand - angVel).toFixed(1),
  });
}
console.log(JSON.stringify(results, null, 2));
await browser.close();
