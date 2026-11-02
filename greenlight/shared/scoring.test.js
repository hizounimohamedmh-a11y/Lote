import { test } from 'node:test';
import assert from 'node:assert/strict';
import { squatMetrics, balanceMetrics, reachMetrics, buildBaseline, assess, buildPlan, angle, LM } from './scoring.js';

// Build a synthetic person facing the camera. Knee flexion in degrees per leg,
// arm angle (shoulder flexion) per side, foot lift for balance, hip shift for sway.
function frame({ kneeL = 0, kneeR = 0, armL = 0, armR = 0, liftL = 0, liftR = 0, shift = 0, t = 0, vis = 0.95 }) {
  const world = Array.from({ length: 33 }, () => [0, 0, 0]);
  const img = Array.from({ length: 33 }, () => [0.5, 0.5, vis]);
  const rad = (d) => (d * Math.PI) / 180;
  // World: y down, metres. Thigh and shin 0.45 m. Knee bends forward (z).
  for (const [side, knee, sx] of [['l', kneeL, -0.1], ['r', kneeR, 0.1]]) {
    const hip = [sx, 0, 0];
    const thigh = rad(knee / 2); const shin = rad(knee / 2);
    const kneeP = [sx, 0.45 * Math.cos(thigh), -0.45 * Math.sin(thigh)];
    const ankle = [sx, kneeP[1] + 0.45 * Math.cos(shin), kneeP[2] + 0.45 * Math.sin(shin)];
    const i = side === 'l' ? { h: LM.lHip, k: LM.lKnee, a: LM.lAnkle } : { h: LM.rHip, k: LM.rKnee, a: LM.rAnkle };
    world[i.h] = hip; world[i.k] = kneeP; world[i.a] = ankle;
  }
  for (const [side, arm, sx] of [['l', armL, -0.18], ['r', armR, 0.18]]) {
    const sh = [sx, -0.5, 0];
    const wr = [sx, -0.5 + 0.6 * Math.cos(rad(arm)), -0.6 * Math.sin(rad(arm))];
    world[side === 'l' ? LM.lShoulder : LM.rShoulder] = sh;
    world[side === 'l' ? LM.lWrist : LM.rWrist] = wr;
  }
  // Image coords (person facing camera, mirrored left/right is irrelevant here).
  const set = (i, x, y) => { img[i] = [x, y, vis]; };
  set(LM.lShoulder, 0.45 + shift, 0.3); set(LM.rShoulder, 0.55 + shift, 0.3);
  set(LM.lHip, 0.46 + shift, 0.5); set(LM.rHip, 0.54 + shift, 0.5);
  set(LM.lKnee, 0.46, 0.65); set(LM.rKnee, 0.54, 0.65);
  set(LM.lAnkle, 0.46, 0.8 - liftL); set(LM.rAnkle, 0.54, 0.8 - liftR);
  set(LM.lWrist, 0.4, 0.3); set(LM.rWrist, 0.6, 0.3);
  return { t, img, world };
}

function squatFrames({ depthL = 100, depthR = 100, reps = 3 }) {
  const out = [];
  for (let r = 0; r < reps; r++) {
    for (let i = 0; i <= 20; i++) {
      const p = Math.sin((i / 20) * Math.PI);
      out.push(frame({ kneeL: depthL * p, kneeR: depthR * p }));
    }
  }
  return out;
}

test('angle helper', () => {
  assert.equal(Math.round(angle([1, 0, 0], [0, 0, 0], [0, 1, 0])), 90);
});

test('squat: counts reps, measures depth and side difference', () => {
  const m = squatMetrics(squatFrames({ depthL: 100, depthR: 100 }));
  assert.equal(m.ok, true);
  assert.equal(m.reps, 3);
  assert.ok(Math.abs(m.depth - 99) < 3, `depth ${m.depth}`);
  assert.ok(Math.abs(m.asym) < 2);
  const lop = squatMetrics(squatFrames({ depthL: 100, depthR: 75 }));
  assert.ok(lop.asym > 20, `left bends more: ${lop.asym}`);
});

test('squat: rejects when no squat or person out of view', () => {
  const still = Array.from({ length: 40 }, () => frame({}));
  assert.equal(squatMetrics(still).ok, false);
  const hidden = Array.from({ length: 40 }, () => frame({ vis: 0.1 }));
  assert.equal(squatMetrics(hidden).ok, false);
});

test('balance: measures sway only while the foot is lifted', () => {
  const steady = Array.from({ length: 60 }, (_, i) => frame({ liftR: 0.1, shift: 0.002 * Math.sin(i) }));
  const shaky = Array.from({ length: 60 }, (_, i) => frame({ liftR: 0.1, shift: 0.02 * Math.sin(i) }));
  const a = balanceMetrics(steady, 'left'); const b = balanceMetrics(shaky, 'left');
  assert.equal(a.ok, true); assert.equal(b.ok, true);
  assert.ok(b.sway > a.sway * 3, `${b.sway} vs ${a.sway}`);
  assert.equal(balanceMetrics(Array.from({ length: 60 }, () => frame({})), 'left').ok, false, 'no lifted foot');
});

test('reach: measures each arm', () => {
  const f = Array.from({ length: 30 }, (_, i) => frame({ armL: Math.min(170, i * 8), armR: Math.min(140, i * 8) }));
  const m = reachMetrics(f);
  assert.equal(m.ok, true);
  assert.ok(Math.abs(m.left - 170) < 6 && Math.abs(m.right - 140) < 6 && m.asym > 20, JSON.stringify(m));
});

const goodScan = () => ({
  squat: { ok: true, depth: 100, asym: 2, track: 1 },
  balanceL: { ok: true, sway: 2, held: 1 }, balanceR: { ok: true, sway: 2, held: 1 },
  reach: { ok: true, left: 170, right: 168, asym: 2 },
});

test('assess: fresh athlete is green', () => {
  const r = assess({ answers: { sleep: 3, energy: 4, load: 1 }, movement: goodScan(), baseline: buildBaseline([goodScan(), goodScan()]) });
  assert.equal(r.color, 'green');
  assert.equal(r.score, 100);
});

test('assess: tired + sore + worse movement turns yellow or red, and points at the side', () => {
  const today = goodScan();
  today.squat = { ok: true, depth: 85, asym: 20, track: 1 }; // right leg bends less
  const r = assess({ answers: { sleep: 2, energy: 2, load: 2 }, soreness: { right_knee: 6 }, movement: today, baseline: buildBaseline([goodScan(), goodScan(), goodScan()]) });
  assert.ok(['yellow', 'red'].includes(r.color), r.color);
  assert.equal(r.focus[0], 'right_knee');
  assert.ok(r.findings.some((f) => f.text.includes('right')));
});

test('assess: red flags always mean red and see a professional', () => {
  const r = assess({ answers: { sleep: 3, energy: 5, load: 0 }, soreness: { left_ankle: 6 }, flags: { swelling: true } });
  assert.equal(r.color, 'red');
  assert.equal(r.seeDoctor, true);
  assert.ok(r.score < 50);
});

test('assess: one painful spot caps at yellow', () => {
  const r = assess({ answers: { sleep: 3, energy: 5, load: 0 }, soreness: { lower_back: 8 } });
  assert.equal(r.color, 'yellow');
});

test('plan matches the color and the sore region', () => {
  const r = assess({ answers: { sleep: 1, energy: 3, load: 2 }, soreness: { left_hamstring: 6 } });
  const p = buildPlan(r, 'football');
  assert.match(p.headline, /70%/);
  assert.ok(p.blocks[0].items.some((e) => e.id === 'ham_floss'));
  assert.ok(p.avoid.join(' ').includes('sprints'));
  const green = buildPlan(assess({ answers: { sleep: 3, energy: 4, load: 0 } }), 'basketball');
  assert.match(green.headline, /Go/);
});

test('assess: a sore spot is never green', () => {
  const r = assess({ answers: { sleep: 3, energy: 5, load: 0 }, soreness: { right_knee: 6 } });
  assert.equal(r.color, 'yellow');
  assert.ok(r.score <= 74);
  const stiff = assess({ answers: { sleep: 3, energy: 5, load: 0 }, soreness: { right_knee: 3 } });
  assert.equal(stiff.color, 'green', 'a bit stiff is still fine');
});
