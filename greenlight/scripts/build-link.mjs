// Builds GreenLight as one page plus its body-tracking files, runnable without a server.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

execSync('node scripts/copy-wasm.mjs && npx vite build --mode link', { stdio: 'inherit' });
const dir = 'dist-link';
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const read = (href) => fs.readFileSync(path.join(dir, href.replace(/^\.?\//, '')), 'utf8');
const js = [...html.matchAll(/<script type="module" crossorigin src="([^"]+)"><\/script>/g)].map((m) => read(m[1])).join('\n');
const css = [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)">/g)].map((m) => read(m[1])).join('\n');
const fonts = html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];

const page = `<title>GreenLight</title>
<meta name="description" content="Should you train today? A 30-second check that gives you green, yellow or red and a plan.">
<link rel="preconnect" href="https://fonts.googleapis.com">
${fonts}
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
fs.writeFileSync(path.join(dir, 'greenlight.html'), page);
console.log(`greenlight.html ${(page.length / 1024).toFixed(0)} KB`);
fs.writeFileSync(path.join(dir, 'models/pose_landmarker_lite.txt'), fs.readFileSync(path.join(dir, 'models/pose_landmarker_lite.task')).toString('base64'));
fs.rmSync(path.join(dir, 'models/pose_landmarker_lite.task'));
for (const f of ['wasm/vision_wasm_internal.js', 'wasm/vision_wasm_internal.wasm', 'wasm/vision_wasm_nosimd_internal.js', 'wasm/vision_wasm_nosimd_internal.wasm', 'models/pose_landmarker_lite.txt']) {
  console.log(f, (fs.statSync(path.join(dir, f)).size / 1e6).toFixed(1), 'MB');
}
