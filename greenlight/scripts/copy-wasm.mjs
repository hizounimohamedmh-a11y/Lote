// Copies MediaPipe's WebAssembly runtime into public/ so the app serves it itself.
import fs from 'node:fs';
const src = 'node_modules/@mediapipe/tasks-vision/wasm';
const dst = 'public/wasm';
fs.mkdirSync(dst, { recursive: true });
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  fs.copyFileSync(`${src}/${f}`, `${dst}/${f}`);
}
console.log('MediaPipe runtime copied to public/wasm');
