// Mobile acceptance: portrait hint, landscape play, real touch drag to launch.
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const log = (...a) => console.log('[touch]', ...a);
const URL_ = process.argv[2] || 'http://localhost:5199';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, // portrait phone first
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
});
const page = await context.newPage();
page.on('pageerror', (e) => log('PAGE ERROR:', e.message));

await page.goto(URL_, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="btn-level-0"]');

// 1) portrait → rotate hint visible
const hintPortrait = await page.evaluate(() => {
  const h = document.querySelector('[data-testid="rotate-hint"]');
  return h && getComputedStyle(h).display !== 'none';
});
log('portrait hint visible:', hintPortrait);
if (!hintPortrait) throw new Error('portrait should show rotate hint');

// 2) rotate to landscape → hint hidden
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(300);
const hintLandscape = await page.evaluate(() => {
  const h = document.querySelector('[data-testid="rotate-hint"]');
  return h && getComputedStyle(h).display !== 'none';
});
log('landscape hint hidden:', !hintLandscape);
if (hintLandscape) throw new Error('landscape should hide rotate hint');

// 3) touch-tap level 1 → game starts
await page.touchscreen.tap(422, 250); // rough center; refine below
let started = await page.evaluate(() => Boolean(window.__game && window.__game()));
if (!started) {
  const box = await page.locator('[data-testid="btn-level-0"]').boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  started = await page.evaluate(() => Boolean(window.__game && window.__game()));
}
log('level started by touch:', started);
if (!started) throw new Error('touch tap did not start level');

await page.waitForTimeout(800);

// 4) real touch drag: bird (220,620 world) → pull to (100,632)
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
log('touch points:', JSON.stringify(pts));

const cdp = await context.newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x: pts.bird.x, y: pts.bird.y }],
});
const steps = 8;
for (let i = 1; i <= steps; i++) {
  const x = pts.bird.x + ((pts.drag.x - pts.bird.x) * i) / steps;
  const y = pts.bird.y + ((pts.drag.y - pts.bird.y) * i) / steps;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  await page.waitForTimeout(30);
}
const mid = await page.evaluate(() => window.__game().state.phase);
log('phase during drag (want dragging):', mid);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForTimeout(300);
const launched = await page.evaluate(() => window.__game().state.phase);
log('phase after release (want flying):', launched);

await browser.close();
const ok = hintPortrait && !hintLandscape && started && mid === 'dragging' && launched === 'flying';
console.log(ok ? 'MOBILE ACCEPTANCE PASSED' : 'MOBILE ACCEPTANCE FAILED');
process.exit(ok ? 0 : 1);
