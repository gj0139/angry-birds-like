// Reproduce + verify: open dist/index.html via file:// and via http, screenshot both.
import { createRequire } from 'module';
import path from 'path';
import http from 'http';
import fs from 'fs';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/86151/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core');

const root = path.resolve(process.argv[2]);
const outDir = process.argv[3] || root;
const mode = process.argv[4] || 'both'; // 'file' | 'http' | 'both'
const log = (...a) => console.log('[blackfix]', ...a);

const browser = await chromium.launch({ channel: 'msedge', headless: true });

async function shoot(url, label) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url()));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const hasSelect = await page.locator('[data-testid="btn-level-0"]').count();
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.screenshot({ path: path.join(outDir, `black-${label}.png`) });
  log(`${label}: select=${hasSelect > 0} bg=${bodyBg} errors=${JSON.stringify(errors.slice(0, 4))}`);
  await page.close();
  return hasSelect > 0 && errors.length === 0;
}

let ok = true;
if (mode === 'file' || mode === 'both') {
  const fileUrl = 'file:///' + path.join(root, 'index.html').replace(/\\/g, '/');
  ok = (await shoot(fileUrl, 'file')) && ok;
}
if (mode === 'http' || mode === 'both') {
  const server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    const file = fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(root, 'index.html');
    const ext = path.extname(file);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(5299, r));
  // simulate a SUBPATH mount, like preview panels often do
  ok = (await shoot('http://localhost:5299/index.html', 'http-root')) && ok;
  server.close();
}

await browser.close();
console.log(ok ? 'ALL OK' : 'BROKEN');
process.exit(ok ? 0 : 1);
