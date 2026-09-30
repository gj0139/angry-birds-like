// Post-build: inline the JS chunk into index.html so the game runs from
// file:// (external module scripts are blocked there by CORS) and from any
// http subpath. One self-contained HTML is the whole deliverable.
import fs from 'fs';
import path from 'path';

const dist = path.resolve('dist');
const htmlPath = path.join(dist, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const match = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
if (!match) {
  console.error('[inline] module script tag not found — nothing to inline');
  process.exit(1);
}

const src = match[1].replace(/^\.\//, '');
const jsPath = path.join(dist, src);
let js = fs.readFileSync(jsPath, 'utf8');
// Prevent the inlined payload from closing the script tag early.
js = js.replace(/<\/script/gi, '<\\/script');

html = html.replace(match[0], `<script type="module">\n${js}\n</script>`);
fs.writeFileSync(htmlPath, html);
fs.rmSync(path.join(dist, 'assets'), { recursive: true, force: true });

console.log(`[inline] ${src} → index.html (${html.length} bytes total)`);
