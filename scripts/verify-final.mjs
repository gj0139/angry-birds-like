// Final acceptance: wall, skins, trail, water levels, 11-level select.
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const log = (...a) => console.log('[final]', ...a);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => log('PAGE ERROR:', e.message));

await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="btn-level-10"]', { timeout: 8000 });

const btnCount = await page.locator('[data-testid^="btn-level-"]').count();
log('level buttons:', btnCount, '(expect 11)');

// 1) all 11 levels load clean + wall present
const loads = [];
for (let i = 0; i < 11; i++) {
  await page.evaluate((n) => window.__app.startLevel(n), i);
  await page.waitForTimeout(800);
  const s = await page.evaluate(() => {
    const g = window.__game();
    return {
      theme: g.levelCfg.theme,
      blocks: g.level.blocks.filter((b) => !b.plugin.destroyed).length,
      blocksTotal: g.level.blocks.length,
      pigs: g.level.pigs.filter((p) => !p.plugin.destroyed).length,
      pigsTotal: g.level.pigs.length,
      hasWall: Boolean(g.level.wall),
      water: Boolean(g.levelCfg.water),
    };
  });
  const clean = s.blocks === s.blocksTotal && s.pigs === s.pigsTotal && s.hasWall;
  loads.push({ level: i + 1, clean, ...s });
  if (!clean) log(`L${i + 1} DIRTY`, JSON.stringify(s));
}
log('all loads clean:', loads.every((l) => l.clean));
log(
  'water levels:',
  loads.filter((l) => l.water).map((l) => l.level).join(','),
  '| pigs:',
  loads
    .slice(8)
    .map((l) => l.pigsTotal)
    .join(','),
);

// 2) random skins across reloads — both variants should appear
const skins = new Set();
for (let i = 0; i < 14; i++) {
  await page.evaluate(() => window.__app.startLevel(0));
  await page.waitForTimeout(120);
  const skin = await page.evaluate(() => window.__game().bird.plugin.skin);
  skins.add(skin);
}
log('skins seen:', [...skins].join(','), '(want both)');

// 3) phoenix trail grows while flying
let trailOk = false;
for (let attempt = 0; attempt < 6 && !trailOk; attempt++) {
  await page.evaluate(() => window.__app.startLevel(0));
  await page.waitForTimeout(200);
  const skin = await page.evaluate(() => window.__game().bird.plugin.skin);
  if (skin !== 'phoenix') continue;
  const pts = await page.evaluate(() => {
    const r = document.getElementById('game').getBoundingClientRect();
    const s = Math.min(r.width / 1600, r.height / 900);
    const ox = r.left + (r.width - 1600 * s) / 2;
    const oy = r.top + (r.height - 900 * s) / 2;
    return {
      bird: { x: ox + 220 * s, y: oy + 620 * s },
      drag: { x: ox + 100 * s, y: oy + 632 * s },
    };
  });
  await page.mouse.move(pts.bird.x, pts.bird.y);
  await page.mouse.down();
  await page.mouse.move(pts.drag.x, pts.drag.y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const trail = await page.evaluate(() => {
    const g = window.__game();
    return g.bird ? g.bird.plugin.trail.length : 0;
  });
  trailOk = trail > 0;
  log('phoenix trail length after launch:', trail);
}

// 4) water pixel: pool area tinted vs dry ground
await page.evaluate(() => window.__app.startLevel(8)); // L9 water
await page.waitForTimeout(700);
const poolPx = await page.evaluate(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const cssW = canvas.clientWidth;
  const scale = Math.min(cssW / 1600, canvas.clientHeight / 900);
  const r = canvas.width / cssW;
  const ox = ((cssW - 1600 * scale) / 2) * r;
  const oy = ((canvas.clientHeight - 900 * scale) / 2) * r;
  const at = (wx, wy) => {
    const d = ctx.getImageData(Math.round(wx * scale * r + ox), Math.round(wy * scale * r + oy), 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  return { inPool: at(1300, 650), dry: at(500, 650) };
});
log('pool pixel:', JSON.stringify(poolPx.inPool), 'dry pixel:', JSON.stringify(poolPx.dry));
const dryDiff =
  Math.abs(poolPx.inPool[0] - poolPx.dry[0]) +
  Math.abs(poolPx.inPool[1] - poolPx.dry[1]) +
  Math.abs(poolPx.inPool[2] - poolPx.dry[2]);
log('pool vs dry differs:', dryDiff > 30);

await browser.close();
const ok =
  btnCount === 11 &&
  loads.every((l) => l.clean) &&
  loads.slice(8).every((l) => l.water && l.pigs >= 4) &&
  skins.size === 2 &&
  trailOk &&
  dryDiff > 30;
console.log(ok ? 'FINAL ACCEPTANCE PASSED' : 'FINAL ACCEPTANCE FAILED');
process.exit(ok ? 0 : 1);
