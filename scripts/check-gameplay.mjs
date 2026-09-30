import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const fileUrl = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
await page.goto(fileUrl, { waitUntil: 'load' });
await page.waitForTimeout(800);
await page.click('[data-testid="btn-level-0"]');
await page.waitForTimeout(1200);
const topbar = await page.locator('.hud-topbar').textContent().catch(() => null);
await page.screenshot({ path: 'dist-check-gameplay.png' });
console.log('topbar:', topbar, '| errors:', JSON.stringify(errors));
await browser.close();
console.log(topbar && topbar.includes('小鸟') && errors.length === 0 ? 'GAMEPLAY OK' : 'GAMEPLAY BROKEN');
process.exit(topbar && topbar.includes('小鸟') && errors.length === 0 ? 0 : 1);
