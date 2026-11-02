// On-device pose tracking with MediaPipe. Video never leaves the phone.
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const BASE = import.meta.env.BASE_URL || '/';
let loading = null;

export function loadPose() {
  if (!loading) {
    loading = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(`${BASE}wasm`);
      // The link build ships the model as base64 text (the only way it can be hosted there).
      let modelAssetBuffer = null;
      if (import.meta.env.VITE_DEMO) {
        const b64 = (await (await fetch(`${BASE}models/pose_landmarker_lite.txt`)).text()).trim();
        modelAssetBuffer = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      }
      const opts = (delegate) => ({
        baseOptions: modelAssetBuffer ? { modelAssetBuffer, delegate } : { modelAssetPath: `${BASE}models/pose_landmarker_lite.task`, delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      try { return await PoseLandmarker.createFromOptions(fileset, opts('GPU')); } catch { return PoseLandmarker.createFromOptions(fileset, opts('CPU')); }
    })().catch((e) => { loading = null; throw e; });
  }
  return loading;
}

// Convert a MediaPipe result into the compact frame format used by the scoring engine.
export function toFrame(result, t) {
  const lm = result?.landmarks?.[0];
  const w = result?.worldLandmarks?.[0];
  if (!lm || !w) return null;
  return {
    t,
    img: lm.map((p) => [p.x, p.y, p.visibility ?? 1]),
    world: w.map((p) => [p.x, p.y, p.z]),
  };
}

const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [27, 29], [28, 30],
];

// Draw the skeleton on a canvas that covers the video with object-fit: cover.
export function drawSkeleton(canvas, video, frame, color = '#1fd17a') {
  const ctx = canvas.getContext('2d');
  const cw = canvas.clientWidth; const ch = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  if (!frame || !video.videoWidth) return;
  const vw = video.videoWidth; const vh = video.videoHeight;
  const s = Math.max(cw / vw, ch / vh);
  const ox = (cw - vw * s) / 2; const oy = (ch - vh * s) / 2;
  const P = (i) => [frame.img[i][0] * vw * s + ox, frame.img[i][1] * vh * s + oy, frame.img[i][2]];

  ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 16;
  ctx.strokeStyle = color; ctx.lineWidth = 6;
  for (const [a, b] of BONES) {
    const pa = P(a); const pb = P(b);
    if (pa[2] < 0.4 || pb[2] < 0.4) continue;
    ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    const p = P(i);
    if (p[2] < 0.4) continue;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, Math.PI * 2); ctx.fill();
  }
}

// Whole body in view: head, shoulders, hips and ankles visible and inside the frame.
export function fullBodyVisible(frame) {
  if (!frame) return false;
  const ids = [0, 11, 12, 23, 24, 25, 26, 27, 28];
  return ids.every((i) => frame.img[i][2] > 0.6 && frame.img[i][1] > 0.01 && frame.img[i][1] < 0.99 && frame.img[i][0] > 0.01 && frame.img[i][0] < 0.99);
}
