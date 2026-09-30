// Acceptance for redesigned levels: load integrity, screenshots, win attempts.
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const OUT = process.argv[2] || '.';
const log = (...a) => console.log('[rework]', ...a);

const DRAGS = [
  { x: 100, y: 632 },
  { x: 110, y: 645 },
  { x: 130, y: 690 },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => log('PAGE ERROR:', e.message));

await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="btn-level-7"]');

async function stats() {
  return page.evaluate(() => {
    const g = window.__game();
    if (!g) return null;
    return {
      phase: g.state.phase,
      birds: g.state.birdsRemaining,
      blocks: g.level.blocks.filter((b) => !b.plugin.destroyed).length,
      blocksTotal: g.level.blocks.length,
      pigs: g.level.pigs.filter((p) => !p.plugin.destroyed).length,
      pigsTotal: g.level.pigs.length,
      stars: g.state.stars,
    };
  });
}

async function waitOutcome(maxMs = 11000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await stats();
    if (s && (s.phase === 'won' || s.phase === 'lost')) return s;
    if (s && s.phase === 'aiming') return s;
    await page.waitForTimeout(250);
  }
  return stats();
}

function screenPts(dragWorld) {
  return page.evaluate((d) => {
    const r = document.getElementById('game').getBoundingClientRect();
    const s = Math.min(r.width / 1600, r.height / 900);
    const ox = r.left + (r.width - 1600 * s) / 2;
    const oy = r.top + (r.height - 900 * s) / 2;
    return {
      bird: { x: ox + 220 * s, y: oy + 620 * s },
      drag: { x: ox + d.x * s, y: oy + d.y * s },
    };
  }, dragWorld);
}

const report = [];
for (let i = 0; i < 8; i++) {
  await page.evaluate((n) => window.__app.startLevel(n), i);
  await page.waitForTimeout(900);
  const init = await stats();
  log(
    `L${i + 1} load: blocks ${init.blocks}/${init.blocksTotal} pigs ${init.pigs}/${init.pigsTotal}`,
  );
  if (i === 3 || i === 4 || i === 6 || i === 7) {
    await page.screenshot({ path: path.join(OUT, `rework-L${i + 1}.png`) });
  }
  if (init.blocks !== init.blocksTotal || init.pigs !== init.pigsTotal) {
    report.push({ level: i + 1, load: 'DAMAGE', win: false });
    continue;
  }

  // win attempt: up to 3 shots cycling presets
  let outcome = null;
  for (let shot = 0; shot < 3; shot++) {
    const pts = await screenPts(DRAGS[shot % DRAGS.length]);
    await page.mouse.move(pts.bird.x, pts.bird.y);
    await page.mouse.down();
    await page.mouse.move(pts.drag.x, pts.drag.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    outcome = await waitOutcome();
    if (outcome && (outcome.phase === 'won' || outcome.phase === 'lost')) break;
  }
  const won = outcome && outcome.phase === 'won';
  log(`L${i + 1} attempt: ${won ? 'WON ' + outcome.stars + '★' : 'phase=' + (outcome && outcome.phase)}`);
  report.push({ level: i + 1, load: 'ok', win: Boolean(won), stars: won ? outcome.stars : 0 });
}

await browser.close();
log('REPORT:', JSON.stringify(report));
const loadsOk = report.every((r) => r.load === 'ok');
const wins = report.filter((r) => r.win).length;
log(`loads=${loadsOk ? 'ALL CLEAN' : 'FAILED'} wins=${wins}/8`);
console.log(loadsOk ? 'INTEGRITY PASSED' : 'INTEGRITY FAILED');
process.exit(loadsOk ? 0 : 1);
