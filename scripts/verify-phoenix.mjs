// Verify phoenix pixels on canvas + fullscreen wiring on mobile context.
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const log = (...a) => console.log('[phoenix]', ...a);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({
  viewport: { width: 844, height: 390 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
});
const page = await context.newPage();
page.on('pageerror', (e) => log('PAGE ERROR:', e.message));

await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="btn-level-0"]');

// stub fullscreen API before starting (headless support varies)
await page.evaluate(() => {
  window.__fsCalls = 0;
  document.documentElement.requestFullscreen = () => {
    window.__fsCalls += 1;
    return Promise.resolve();
  };
  // force the coarse-pointer branch so auto-fullscreen path is exercised
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
});

// start level by tap → should auto-request fullscreen inside the gesture
const box = await page.locator('[data-testid="btn-level-0"]').boundingBox();
await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForTimeout(900);

const fsAuto = await page.evaluate(() => window.__fsCalls);
log('auto fullscreen requested on level start:', fsAuto >= 1);

// sample phoenix body pixel on the canvas (device-pixel space)
const px = await page.evaluate(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  const scale = Math.min(cssW / 1600, cssH / 900);
  const r = canvas.width / cssW;
  const ox = ((cssW - 1600 * scale) / 2) * r;
  const oy = ((cssH - 900 * scale) / 2) * r;
  const x = Math.round(220 * scale * r + ox);
  const y = Math.round(620 * scale * r + oy);
  const d = ctx.getImageData(x, y, 1, 1).data;
  return { x, y, rgba: [d[0], d[1], d[2], d[3]] };
});
log('bird center pixel:', JSON.stringify(px.rgba), 'expect ~[255,111,0]');

const [cr, cg, cb] = px.rgba;
const isPhoenix = cr > 230 && cg > 80 && cg < 140 && cb < 40;
log('phoenix body color match:', isPhoenix);

// manual fullscreen button also wired
const fsBefore = await page.evaluate(() => window.__fsCalls);
await page.click('[data-testid="btn-fullscreen"]');
const fsAfter = await page.evaluate(() => window.__fsCalls);
log('fullscreen button increments calls:', fsAfter > fsBefore);

await browser.close();
const ok = fsAuto && isPhoenix && fsAfter > fsBefore;
console.log(ok ? 'PHOENIX+FULLSCREEN PASSED' : 'FAILED');
process.exit(ok ? 0 : 1);
