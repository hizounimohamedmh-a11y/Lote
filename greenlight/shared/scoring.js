// GreenLight scoring engine. Pure functions, shared by the app and the server.
//
// Movement metrics come from MediaPipe pose landmarks (33 points).
// Each frame: { t: ms, img: [[x,y,vis] x33] (normalised image coords), world: [[x,y,z] x33] (metres, hip-centred) }

import { REGION_PLAN, RECOVERY, WARMUPS, SPORTS, EXERCISES, regionLabel, baseRegion } from './content.js';

export const LM = {
  nose: 0, lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16,
  lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28,
};

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], (a[2] || 0) - (b[2] || 0)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);
export function angle(a, b, c) {
  // Angle ABC in degrees.
  const u = sub(a, b); const v = sub(c, b);
  const d = norm(u) * norm(v);
  if (!d) return NaN;
  return (Math.acos(Math.max(-1, Math.min(1, dot(u, v) / d))) * 180) / Math.PI;
}
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const median = (xs) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const std = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
const round = (x, d = 1) => (Number.isFinite(x) ? Math.round(x * 10 ** d) / 10 ** d : null);

function visible(frame, ids, min = 0.5) {
  return ids.every((i) => (frame.img[i]?.[2] ?? 0) >= min);
}

// ---------------------------------------------------------------------------
// Test 1: squat (3 reps). Knee flexion depth, left/right difference, knee tracking.
// ---------------------------------------------------------------------------
export function squatMetrics(frames) {
  const need = [LM.lHip, LM.rHip, LM.lKnee, LM.rKnee, LM.lAnkle, LM.rAnkle];
  const ok = frames.filter((f) => visible(f, need));
  if (ok.length < 15 || ok.length < frames.length * 0.5) return { ok: false, reason: 'Your hips, knees and ankles need to stay in view.' };

  const flex = ok.map((f) => {
    const w = f.world;
    const l = 180 - angle(w[LM.lHip], w[LM.lKnee], w[LM.lAnkle]);
    const r = 180 - angle(w[LM.rHip], w[LM.rKnee], w[LM.rAnkle]);
    const kneeW = Math.abs(f.img[LM.lKnee][0] - f.img[LM.rKnee][0]);
    const ankleW = Math.abs(f.img[LM.lAnkle][0] - f.img[LM.rAnkle][0]);
    return { l, r, avg: (l + r) / 2, track: ankleW > 0 ? kneeW / ankleW : NaN };
  });

  // Count reps: crossing into a squat (>= 60° flexion) from standing (< 30°).
  let reps = 0; let down = false;
  for (const f of flex) {
    if (!down && f.avg >= 60) { down = true; reps++; }
    if (down && f.avg < 30) down = false;
  }

  // "Bottom" frames: the deepest 15% of frames.
  const sorted = [...flex].sort((a, b) => b.avg - a.avg);
  const bottom = sorted.slice(0, Math.max(3, Math.round(sorted.length * 0.15)));
  return {
    ok: reps >= 1,
    reason: reps >= 1 ? null : 'We didn’t see a squat. Squat down until your thighs are close to parallel.',
    reps,
    depth: round(mean(bottom.map((f) => f.avg))),
    depthL: round(mean(bottom.map((f) => f.l))),
    depthR: round(mean(bottom.map((f) => f.r))),
    asym: round(mean(bottom.map((f) => f.l - f.r))), // + = left bends more
    track: round(median(bottom.map((f) => f.track).filter(Number.isFinite)), 2), // < 0.8 = knees caving in
  };
}

// ---------------------------------------------------------------------------
// Test 2: single-leg balance. Hip sway while standing on each leg.
// The test runner tells us which leg the person stands on in each frame window.
// ---------------------------------------------------------------------------
export function balanceMetrics(frames, standing /* 'left' | 'right' */) {
  const need = [LM.lHip, LM.rHip, LM.lShoulder, LM.rShoulder, LM.lAnkle, LM.rAnkle];
  const ok = frames.filter((f) => visible(f, need));
  if (ok.length < 15) return { ok: false, reason: 'Stay fully in view while you balance.' };
  // Only frames where the other foot is clearly lifted.
  const lift = ok.filter((f) => {
    const ly = f.img[LM.lAnkle][1]; const ry = f.img[LM.rAnkle][1];
    const torso = Math.abs(f.img[LM.lShoulder][1] - f.img[LM.lHip][1]) || 0.2;
    const diff = (standing === 'left' ? ry - ly : ly - ry) / torso; // lifted foot is higher (smaller y)
    return diff < -0.15;
  });
  if (lift.length < ok.length * 0.4) {
    return { ok: false, reason: `Lift your ${standing === 'left' ? 'right' : 'left'} foot off the floor and hold it there.` };
  }
  const xs = lift.map((f) => {
    const torso = Math.abs((f.img[LM.lShoulder][1] + f.img[LM.rShoulder][1]) / 2 - (f.img[LM.lHip][1] + f.img[LM.rHip][1]) / 2) || 0.2;
    return { x: ((f.img[LM.lHip][0] + f.img[LM.rHip][0]) / 2) / torso, y: ((f.img[LM.lHip][1] + f.img[LM.rHip][1]) / 2) / torso };
  });
  // Sway in % of torso length; held = share of the test with the foot up.
  return {
    ok: true,
    sway: round(Math.hypot(std(xs.map((p) => p.x)), std(xs.map((p) => p.y))) * 100),
    held: round(lift.length / ok.length, 2),
  };
}

// ---------------------------------------------------------------------------
// Test 3: arms overhead. Shoulder flexion per side.
// ---------------------------------------------------------------------------
export function reachMetrics(frames) {
  const need = [LM.lShoulder, LM.rShoulder, LM.lHip, LM.rHip, LM.lWrist, LM.rWrist];
  const ok = frames.filter((f) => visible(f, need));
  if (ok.length < 10) return { ok: false, reason: 'Keep your arms and hips in view.' };
  const per = ok.map((f) => {
    const w = f.world;
    return { l: angle(w[LM.lHip], w[LM.lShoulder], w[LM.lWrist]), r: angle(w[LM.rHip], w[LM.rShoulder], w[LM.rWrist]) };
  });
  // Use the best (top 20%) reach so a slow start doesn't count against you.
  const top = (k) => { const s = per.map((p) => p[k]).filter(Number.isFinite).sort((a, b) => b - a); return mean(s.slice(0, Math.max(3, Math.round(s.length * 0.2)))); };
  const l = top('l'); const r = top('r');
  if (Math.max(l, r) < 120) return { ok: false, reason: 'Raise both arms all the way above your head.' };
  return { ok: true, left: round(l), right: round(r), asym: round(l - r) };
}

// ---------------------------------------------------------------------------
// Baseline: median of the person's previous complete scans (up to 10).
// ---------------------------------------------------------------------------
export function buildBaseline(previous) {
  const scans = previous.filter((p) => p?.squat?.ok && p?.balanceL?.ok && p?.balanceR?.ok && p?.reach?.ok).slice(0, 10);
  if (scans.length < 2) return { n: scans.length };
  const m = (f) => median(scans.map(f).filter(Number.isFinite));
  return {
    n: scans.length,
    depth: m((s) => s.squat.depth),
    asym: m((s) => Math.abs(s.squat.asym)),
    track: m((s) => s.squat.track),
    swayL: m((s) => s.balanceL.sway),
    swayR: m((s) => s.balanceR.sway),
    reachL: m((s) => s.reach.left),
    reachR: m((s) => s.reach.right),
  };
}

// ---------------------------------------------------------------------------
// Readiness score
// ---------------------------------------------------------------------------
export function assess({ answers, soreness = {}, flags = {}, movement = null, baseline = { n: 0 } }) {
  let score = 100;
  const factors = []; // { label, impact, detail, region? }
  const add = (impact, label, detail, region) => { if (impact) { score += impact; factors.push({ impact, label, detail, region }); } };

  // How you feel
  const sleepPen = { 1: -10, 2: -3, 3: 0 }[answers.sleep] ?? 0;
  add(sleepPen, 'Sleep', sleepPen <= -10 ? 'A bad night slows reactions and recovery.' : 'An OK night, not your best.');
  const energyPen = { 1: -15, 2: -8, 3: -2, 4: 0, 5: 0 }[answers.energy] ?? 0;
  add(energyPen, 'Energy', energyPen <= -8 ? 'Low energy raises the risk of sloppy movement.' : 'Energy is a little below normal.');
  const loadPen = { 0: 0, 1: 0, 2: -4, 3: -8 }[answers.load] ?? 0;
  add(loadPen, 'Yesterday’s load', loadPen <= -8 ? 'You played or trained very hard yesterday. Your body is still recovering.' : 'You trained hard yesterday.');

  // Sore spots
  let sorePen = 0;
  const sore = Object.entries(soreness).filter(([, lvl]) => lvl > 0).sort((a, b) => b[1] - a[1]);
  for (const [region, lvl] of sore) {
    const p = lvl >= 8 ? -20 : lvl >= 6 ? -10 : -4;
    sorePen += p;
    factors.push({ impact: p, label: regionLabel(region), detail: lvl >= 8 ? 'Painful' : lvl >= 6 ? 'Sore' : 'A bit stiff', region });
  }
  score += Math.max(-45, sorePen);

  // Movement scan, compared with your own normal
  const findings = [];
  let movePen = 0;
  const calibrating = baseline.n < 2;
  if (movement) {
    const { squat, balanceL, balanceR, reach } = movement;
    if (squat?.ok) {
      if (!calibrating) {
        const drop = (baseline.depth - squat.depth) / baseline.depth;
        if (drop > 0.2) { movePen -= 15; findings.push({ text: `Your squat is ${Math.round(drop * 100)}% shallower than your normal.`, region: 'hip' }); } else if (drop > 0.1) { movePen -= 8; findings.push({ text: `Your squat is ${Math.round(drop * 100)}% shallower than your normal.`, region: 'hip' }); }
        const asymUp = Math.abs(squat.asym) - baseline.asym;
        const side = squat.asym > 0 ? 'right' : 'left'; // the side bending less
        if (asymUp > 15) { movePen -= 14; findings.push({ text: `You’re protecting your ${side} leg in the squat (${Math.round(Math.abs(squat.asym))}° difference).`, region: `${side}_knee` }); } else if (asymUp > 8) { movePen -= 8; findings.push({ text: `Your ${side} leg bends less than usual in the squat.`, region: `${side}_knee` }); }
      } else if (Math.abs(squat.asym) > 15) {
        const side = squat.asym > 0 ? 'right' : 'left';
        movePen -= 6; findings.push({ text: `Your ${side} leg bends ${Math.round(Math.abs(squat.asym))}° less than the other in the squat.`, region: `${side}_knee` });
      }
      if (squat.track !== null && squat.track < 0.75) { movePen -= 5; findings.push({ text: 'Your knees cave inward at the bottom of the squat.', region: 'knee' }); }
    }
    for (const [b, side, key] of [[balanceL, 'left', 'swayL'], [balanceR, 'right', 'swayR']]) {
      if (!b?.ok) continue;
      if (b.held < 0.6) { movePen -= 6; findings.push({ text: `You put your foot down often while standing on your ${side} leg.`, region: `${side}_ankle` }); }
      if (!calibrating && baseline[key] > 0) {
        const ratio = b.sway / baseline[key];
        if (ratio > 1.8) { movePen -= 12; findings.push({ text: `Your balance on the ${side} leg is much shakier than normal.`, region: `${side}_ankle` }); } else if (ratio > 1.4) { movePen -= 6; findings.push({ text: `Your balance on the ${side} leg is shakier than normal.`, region: `${side}_ankle` }); }
      }
    }
    if (balanceL?.ok && balanceR?.ok && calibrating) {
      const hi = Math.max(balanceL.sway, balanceR.sway); const lo = Math.min(balanceL.sway, balanceR.sway);
      if (lo > 0 && hi / lo > 1.8) {
        const side = balanceL.sway > balanceR.sway ? 'left' : 'right';
        movePen -= 5; findings.push({ text: `You’re less steady on your ${side} leg than your ${side === 'left' ? 'right' : 'left'}.`, region: `${side}_ankle` });
      }
    }
    if (reach?.ok) {
      for (const [side, key] of [['left', 'reachL'], ['right', 'reachR']]) {
        const val = reach[side];
        if (!calibrating) {
          const drop = baseline[key] - val;
          if (drop > 20) { movePen -= 12; findings.push({ text: `Your ${side} arm reaches ${Math.round(drop)}° less than normal.`, region: `${side}_shoulder` }); } else if (drop > 10) { movePen -= 6; findings.push({ text: `Your ${side} arm reaches a bit less than normal.`, region: `${side}_shoulder` }); }
        }
      }
      if (calibrating && Math.abs(reach.asym) > 15) {
        const side = reach.asym > 0 ? 'right' : 'left';
        movePen -= 5; findings.push({ text: `Your ${side} arm reaches ${Math.round(Math.abs(reach.asym))}° less than the other.`, region: `${side}_shoulder` });
      }
    }
    movePen = Math.max(-35, movePen);
    if (movePen) factors.push({ impact: movePen, label: 'Movement scan', detail: findings.map((f) => f.text).join(' ') });
    score += movePen;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  let color = score >= 75 ? 'green' : score >= 50 ? 'yellow' : 'red';

  // Safety overrides
  const anyFlag = Object.values(flags).some(Boolean);
  const painful = sore.filter(([, l]) => l >= 8);
  let seeDoctor = false;
  if (anyFlag) { color = 'red'; seeDoctor = true; }
  if (painful.length >= 2) color = 'red';
  // Anything sore or painful means no full-intensity day.
  if (sore.some(([, l]) => l >= 6) && color === 'green') color = 'yellow';
  if (color === 'red' && score >= 50) score = 49;
  if (color === 'yellow' && score >= 75) score = 74;

  return {
    score, color, seeDoctor, calibrating, baselineN: baseline.n,
    factors: factors.sort((a, b) => a.impact - b.impact),
    findings,
    focus: focusRegions(sore, findings),
  };
}

// Regions to work on today: sore regions first, then movement findings.
function focusRegions(sore, findings) {
  const out = [];
  for (const [r] of sore) if (!out.includes(r)) out.push(r);
  for (const f of findings) if (f.region && !out.includes(f.region)) out.push(f.region);
  return out.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Today's plan
// ---------------------------------------------------------------------------
export function buildPlan(result, sportId) {
  const sport = SPORTS.find((s) => s.id === sportId) || SPORTS[SPORTS.length - 1];
  const focus = result.focus.map((r) => ({ region: r, label: regionLabel(r), ...REGION_PLAN[baseRegion(r)] }));
  const ex = (id) => ({ id, ...EXERCISES[id] });
  const uniq = (ids) => [...new Set(ids)];

  if (result.color === 'green') {
    return {
      headline: 'Go. Train at full intensity.',
      summary: `Your body is ready for ${sport.load}.`,
      avoid: [],
      blocks: [
        { title: 'Activation warm-up · 8 min', items: uniq(WARMUPS[sport.id] || WARMUPS.active).map(ex) },
        ...(focus.length ? [{ title: `Extra for your ${focus.map((f) => f.label.toLowerCase()).join(' and ')} · 4 min`, items: uniq(focus.flatMap((f) => f.drills.slice(0, 1))).map(ex) }] : []),
      ],
    };
  }
  if (result.color === 'yellow') {
    return {
      headline: 'Train, but at about 70%.',
      summary: focus.length
        ? `Keep the session, take the edge off. Look after your ${focus.map((f) => f.label.toLowerCase()).join(' and ')}.`
        : 'Keep the session but skip your hardest efforts today.',
      avoid: focus.length ? uniq(focus.map((f) => f.avoid)) : [`max-effort ${sport.load}`],
      blocks: [
        ...(focus.length ? [{ title: 'Targeted prep · 10 min', items: uniq(focus.flatMap((f) => f.drills.slice(0, 2))).map(ex) }] : []),
        { title: 'Warm-up · 8 min', items: uniq(WARMUPS[sport.id] || WARMUPS.active).slice(0, 3).map(ex) },
        { title: 'After training · 5 min', items: [ex('breathing'), ...uniq(focus.flatMap((f) => f.drills.slice(-1))).map(ex)] },
      ],
    };
  }
  return {
    headline: result.seeDoctor ? 'Rest today and get it checked.' : 'Rest today. Recover actively.',
    summary: result.seeDoctor
      ? 'What you described can be a sign of an injury. Have a doctor or physiotherapist look at it before you train on it.'
      : 'Training hard today is likely to cost you more days later. Move gently and let your body catch up.',
    avoid: ['training at intensity', ...(focus.length ? uniq(focus.map((f) => f.avoid)) : [])],
    blocks: [
      { title: 'Recovery session · 25 min', items: uniq([...RECOVERY, ...focus.flatMap((f) => (result.seeDoctor ? [] : f.drills.slice(0, 1)))]).map(ex) },
    ],
  };
}

export const COLOR_COPY = {
  green: { word: 'Green', short: 'Go' },
  yellow: { word: 'Yellow', short: 'Easy' },
  red: { word: 'Red', short: 'Rest' },
};
