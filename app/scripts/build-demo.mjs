// Builds the demo as one HTML file (JS and CSS inlined) for static hosting.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

execSync('npx vite build --mode demo', { stdio: 'inherit' });
const dir = 'dist-demo';
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const read = (href) => fs.readFileSync(path.join(dir, href.replace(/^\.?\//, '')), 'utf8');

const js = [...html.matchAll(/<script type="module" crossorigin src="([^"]+)"><\/script>/g)].map((m) => read(m[1]));
const css = [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)">/g)].map((m) => read(m[1]));
const title = html.match(/<title>.*?<\/title>/)[0];
const fonts = html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];
const safeJs = js.join('\n').replace(/<\/script/gi, '<\\/script');

const page = `${title}
<meta name="description" content="Lote demo: daily German training for people who want a job in Germany.">
<link rel="preconnect" href="https://fonts.googleapis.com">
${fonts}
<style>${css.join('\n')}</style>
<div id="root"></div>
<script type="module">${safeJs}</script>
`;
fs.writeFileSync(path.join(dir, 'lote-demo.html'), page);
console.log(`lote-demo.html: ${(page.length / 1024).toFixed(0)} KB`);
