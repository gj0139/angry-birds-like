// Visual + integrity acceptance for themed backgrounds and 8 levels.
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const OUT = process.argv[2] || '.';
const log = (...a) => console.log('[themes]', ...a);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => log('PAGE ERROR:', e.message));

await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="btn-level-7"]', { timeout: 10000 });

const btnCount = await page.locator('[data-testid^="btn-level-"]').count();
log('level buttons:', btnCount, '(expect 8)');
if (btnCount !== 8) throw new Error('level select should show 8 levels');

const results = [];
const SHOT_LEVELS = [3, 4, 5, 7]; // desert, night, snow, dawn
for (let i = 0; i < 8; i++) {
  await page.evaluate((n) => window.__app.startLevel(n), i);
  await page.waitForTimeout(900); // let physics settle
  const s = await page.evaluate(() => {
    const g = window.__game();
    return {
      theme: g.levelCfg.theme,
      blocksLeft: g.level.blocks.filter((b) => !b.plugin.destroyed).length,
      blocksTotal: g.level.blocks.length,
      pigsAlive: g.level.pigs.filter((p) => !p.plugin.destroyed).length,
      pigsTotal: g.level.pigs.length,
    };
  });
  log(`L${i + 1} [${s.theme}] blocks ${s.blocksLeft}/${s.blocksTotal} pigs ${s.pigsAlive}/${s.pigsTotal}`);
  if (s.blocksLeft !== s.blocksTotal || s.pigsAlive !== s.pigsTotal) {
    results.push({ level: i + 1, ok: false, reason: 'load damage' });
  } else {
    results.push({ level: i + 1, ok: true });
  }
  if (SHOT_LEVELS.includes(i)) {
    await page.screenshot({ path: path.join(OUT, `theme-L${i + 1}-${s.theme}.png`) });
  }
}

// gameplay smoke on the last level (dawn): one shot must launch
await page.evaluate(() => window.__app.startLevel(7));
await page.waitForTimeout(700);
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
await page.waitForTimeout(400);
const phase = await page.evaluate(() => window.__game().state.phase);
log('L8 shot phase:', phase);

await browser.close();
const allOk = results.every((r) => r.ok) && phase === 'flying' && btnCount === 8;
log(allOk ? 'ALL LEVELS CLEAN' : 'FAILURES: ' + JSON.stringify(results));
console.log(allOk ? 'THEME ACCEPTANCE PASSED' : 'THEME ACCEPTANCE FAILED');
process.exit(allOk ? 0 : 1);
