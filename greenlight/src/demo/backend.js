// In-browser stand-in for the GreenLight server, used by the link (artifact) build.
// Checks are saved per viewer in claude.ai storage when available, else this browser.
// The AI coach note uses the viewer's own Claude account.
import { SPORTS, REGIONS, RED_FLAGS, SORENESS, regionLabel } from '../../shared/content.js';
import { assess, buildBaseline, buildPlan } from '../../shared/scoring.js';

class DemoError extends Error { constructor(m, s = 400) { super(m); this.status = s; } }

const KEY = 'greenlight-state';
const wait = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))]);
let state = null; let store = null; let signedOut = false; let samplePromise = null;

const claudeUse = (name) => (window.claude?.use ? wait(window.claude.use(name).catch(() => null), 6000) : Promise.resolve(null));
function getSample() { if (!samplePromise) samplePromise = claudeUse('sample'); return samplePromise; }

async function load() {
  if (state) return state;
  let saved = null;
  try {
    const [db, user] = await Promise.all([claudeUse('db'), claudeUse('user')]);
    const uid = db && user ? await user.id() : null;
    if (uid) {
      const ref = db.doc(`data/users/${uid}/state`);
      const snap = await wait(ref.get(), 8000);
      if (snap) {
        if (snap.exists && snap.data()?.json) saved = JSON.parse(snap.data().json);
        store = { save: (s) => ref.set({ json: JSON.stringify(s), updatedAt: new Date().toISOString() }) };
      }
    }
  } catch { /* use this browser instead */ }
  if (!store) {
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { saved = null; }
    store = { local: true, save: async (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } } };
  }
  state = saved || { user: null, checks: [], nextId: 1 };
  return state;
}

let timer = null; let chain = Promise.resolve();
function flush() { clearTimeout(timer); timer = null; chain = chain.then(() => store.save(state)).catch(() => {}); }
function persist() { if (store.local) flush(); else if (!timer) timer = setTimeout(flush, 1200); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && timer) flush(); });

const REGION_IDS = new Set(Object.entries(REGIONS).flatMap(([id, r]) => (r.sided ? [`left_${id}`, `right_${id}`] : [id])));
const LEVELS = new Set(SORENESS.map((s) => s.level));
const pub = (u) => ({ id: 1, name: u.name, email: u.email, sport: u.sport, onboarded: u.onboarded, isAdmin: false });
const latestPerDay = () => {
  const m = new Map();
  for (const c of state.checks) if (!m.has(c.day) || m.get(c.day).id < c.id) m.set(c.day, c);
  return [...m.values()].sort((a, b) => b.day.localeCompare(a.day));
};

async function coach(check) {
  const sample = await getSample();
  if (!sample) throw new DemoError('The AI coach works when this page is opened on claude.ai.', 503);
  const r = check.result; const u = state.user;
  const sport = SPORTS.find((s) => s.id === u.sport)?.label || 'general fitness';
  const prompt = `You are the coach voice inside GreenLight, an app that gives athletes a daily green / yellow / red training signal from a check-in and a phone-camera movement scan.

Write a coach note for today's result: 2 to 4 sentences, warm and direct, like a good physio who knows this athlete. Explain the color using the specific factors and findings below (mention sides and numbers). Give one practical tip for today that fits their sport. Never diagnose or name a medical condition. If they should see a professional, say so plainly. No greeting, no sign-off, no markdown, no emojis. Reply with only the note.

Athlete: ${u.name.split(' ')[0]}, sport: ${sport}.
Today: ${r.color.toUpperCase()}, score ${r.score}/100.${r.seeDoctor ? ' Red-flag symptoms reported: tell them to see a doctor or physio.' : ''}
Factors: ${r.factors.map((f) => `${f.label} (${f.impact}): ${f.detail}`).join('; ') || 'none'}.
Sore spots: ${Object.entries(check.soreness).map(([k, l]) => `${regionLabel(k)} ${l}/10`).join(', ') || 'none'}.`;
  try {
    const { text } = await sample(prompt, { modelTier: 'quick' });
    return text.trim();
  } catch (e) {
    if (e?.code === 'not_granted') throw new DemoError('Allow this page to use Claude to get your coach note.', 503);
    throw new DemoError('The coach isn’t available right now.', 503);
  }
}

export async function demoApi(path, { method = 'GET', body } = {}) {
  await load();
  const u = state.user;
  const q = new URLSearchParams(path.split('?')[1] || '');
  const p = path.split('?')[0];
  let m;

  if (p === '/me' && method === 'GET') {
    if (!u || signedOut) return { user: null };
    return { user: pub(u), access: { billingEnabled: false, plan: 'free', pro: true, team: true }, aiEnabled: Boolean(await getSample()), demo: true };
  }
  if (p === '/auth/register' || p === '/auth/login') {
    if (p === '/auth/login' && !u) throw new DemoError('No GreenLight profile here yet. Use “Get started”.', 401);
    if (!u) { state.user = { name: String(body?.name || '').trim() || 'Athlete', email: String(body?.email || ''), sport: 'active', onboarded: false }; persist(); }
    signedOut = false;
    return { ok: true };
  }
  if (p === '/auth/logout') { signedOut = true; return { ok: true }; }
  if (!u) throw new DemoError('Please get started first.', 401);

  if (p === '/me' && method === 'PUT') {
    if (SPORTS.some((s) => s.id === body.sport)) u.sport = body.sport;
    if (typeof body.name === 'string' && body.name.trim()) u.name = body.name.trim().slice(0, 80);
    if (body.onboarded) u.onboarded = true;
    persist();
    return { user: pub(u) };
  }
  if (p === '/me' && method === 'DELETE') {
    state = { user: null, checks: [], nextId: 1 }; flush();
    return { ok: true };
  }
  if (p === '/checks' && method === 'POST') {
    const a = body.answers || {};
    const answers = { sleep: a.sleep, energy: a.energy, load: a.load };
    if (![1, 2, 3].includes(answers.sleep) || !(answers.energy >= 1 && answers.energy <= 5) || !(answers.load >= 0 && answers.load <= 3)) throw new DemoError('Please answer the three questions.');
    const soreness = {};
    for (const [k, v] of Object.entries(body.soreness || {})) { if (!REGION_IDS.has(k) || !LEVELS.has(v)) throw new DemoError('Invalid body map.'); if (v > 0) soreness[k] = v; }
    const flags = {};
    for (const f of RED_FLAGS) if (body.flags?.[f.id] === true) flags[f.id] = true;
    const movement = body.movement || null;
    const previous = [...state.checks].reverse().filter((c) => c.movement).slice(0, 10).map((c) => c.movement);
    const result = assess({ answers, soreness, flags, movement, baseline: buildBaseline(previous) });
    result.plan = buildPlan(result, u.sport);
    const check = {
      id: state.nextId++, day: body.day, createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      score: result.score, color: result.color, answers, soreness, flags, movement, result, coachNote: null,
    };
    state.checks.push(check);
    if (state.checks.length > 400) state.checks.splice(0, state.checks.length - 400);
    persist();
    return { check };
  }
  if (p === '/checks/today') {
    const day = q.get('day');
    const list = state.checks.filter((c) => c.day === day);
    return { check: list[list.length - 1] || null };
  }
  if (p === '/checks') {
    const checks = latestPerDay().slice(0, 120);
    return { checks, limitedTo: null, totalDays: checks.length };
  }
  if ((m = p.match(/^\/checks\/(\d+)\/coach$/))) {
    const check = state.checks.find((c) => c.id === Number(m[1]));
    if (!check) throw new DemoError('Check not found.', 404);
    if (!check.coachNote) { check.coachNote = await coach(check); persist(); }
    return { note: check.coachNote };
  }
  if (p.startsWith('/teams')) throw new DemoError('Team dashboards are part of the full app.', 404);
  throw new DemoError('Not available here.', 404);
}
