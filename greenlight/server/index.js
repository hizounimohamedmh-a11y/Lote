import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, validDay } from './db.js';
import {
  COOKIE, createSession, destroySession, cookieOptions, registerUser, verifyPassword, loadUser, requireUser, requireAdmin,
} from './auth.js';
import { accessInfo, billingEnabled, createCheckout, createPortal, webhook } from './billing.js';
import { aiEnabled, coachNote, AiError } from './ai.js';
import { SPORTS, REGIONS, RED_FLAGS, SORENESS } from '../shared/content.js';
import { assess, buildBaseline, buildPlan } from '../shared/scoring.js';

const app = express();
app.set('trust proxy', 1);

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!billingEnabled) return res.status(404).end();
  webhook(req, res);
});
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(loadUser);

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, msg, status = 400) => res.status(status).json({ error: msg });

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, sport: u.sport, onboarded: Boolean(u.onboarded), isAdmin: Boolean(u.is_admin) };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const attempts = new Map();
function tooMany(key) {
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < 15 * 60e3);
  list.push(now); attempts.set(key, list);
  return list.length > 10;
}

app.post('/api/auth/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || name.length > 80) return bad(res, 'Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'Please enter a valid email.');
  if (password.length < 8) return bad(res, 'Password must be at least 8 characters.');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return bad(res, 'An account with this email already exists. Log in instead.', 409);
  const s = createSession(registerUser({ name, email, password }));
  res.cookie(COOKIE, s.token, cookieOptions(s.expires)).json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (tooMany(`${req.ip}:${email}`)) return bad(res, 'Too many attempts. Try again in 15 minutes.', 429);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(String(req.body.password || ''), user.password_hash)) return bad(res, 'Wrong email or password.', 401);
  const s = createSession(user.id);
  res.cookie(COOKIE, s.token, cookieOptions(s.expires)).json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  if (req.cookies?.[COOKIE]) destroySession(req.cookies[COOKIE]);
  res.clearCookie(COOKIE, { path: '/' }).json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: publicUser(req.user), access: accessInfo(req.user), aiEnabled: aiEnabled() });
});

app.put('/api/me', requireUser, (req, res) => {
  const u = req.user;
  const sport = SPORTS.some((s) => s.id === req.body.sport) ? req.body.sport : u.sport;
  const name = typeof req.body.name === 'string' && req.body.name.trim() ? req.body.name.trim().slice(0, 80) : u.name;
  const onboarded = req.body.onboarded ? 1 : u.onboarded;
  db.prepare('UPDATE users SET name = ?, sport = ?, onboarded = ? WHERE id = ?').run(name, sport, onboarded, u.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(u.id)) });
});

app.delete('/api/me', requireUser, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.clearCookie(COOKIE, { path: '/' }).json({ ok: true });
});

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------
const REGION_IDS = new Set(Object.entries(REGIONS).flatMap(([id, r]) => (r.sided ? [`left_${id}`, `right_${id}`] : [id])));
const LEVELS = new Set(SORENESS.map((s) => s.level));
const num = (x, lo, hi) => (typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi ? x : null);

// The phone sends only computed numbers; video never leaves the device.
function cleanMovement(m) {
  if (!m || typeof m !== 'object') return null;
  const squat = m.squat?.ok ? { ok: true, reps: num(m.squat.reps, 0, 50), depth: num(m.squat.depth, 0, 180), asym: num(m.squat.asym, -90, 90), track: num(m.squat.track, 0, 5) } : { ok: false };
  if (squat.ok && (squat.depth === null || squat.asym === null)) squat.ok = false;
  const bal = (b) => (b?.ok && num(b.sway, 0, 1000) !== null ? { ok: true, sway: b.sway, held: num(b.held, 0, 1) ?? 1 } : { ok: false });
  const reach = m.reach?.ok && num(m.reach.left, 0, 180) !== null && num(m.reach.right, 0, 180) !== null
    ? { ok: true, left: m.reach.left, right: m.reach.right, asym: m.reach.left - m.reach.right } : { ok: false };
  return { squat, balanceL: bal(m.balanceL), balanceR: bal(m.balanceR), reach };
}

function rowToCheck(r, full) {
  const result = JSON.parse(r.result);
  const check = {
    id: r.id, day: r.day, createdAt: r.created_at, score: r.score, color: r.color,
    answers: JSON.parse(r.answers), soreness: JSON.parse(r.soreness), flags: JSON.parse(r.flags),
    movement: r.movement ? JSON.parse(r.movement) : null, result, coachNote: r.coach_note,
  };
  if (!full) {
    // Free plan: color, score and headline. The "why" and the full plan are Pro.
    check.locked = true;
    check.result = { ...result, factors: [], findings: [], plan: { headline: result.plan.headline, summary: result.plan.summary, avoid: result.plan.avoid, blocks: [] } };
    check.coachNote = null;
  }
  return check;
}

app.post('/api/checks', requireUser, (req, res) => {
  const u = req.user;
  const b = req.body || {};
  const answers = { sleep: num(b.answers?.sleep, 1, 3), energy: num(b.answers?.energy, 1, 5), load: num(b.answers?.load, 0, 3) };
  if (Object.values(answers).some((v) => v === null)) return bad(res, 'Please answer the three questions.');
  const soreness = {};
  for (const [k, v] of Object.entries(b.soreness || {})) {
    if (!REGION_IDS.has(k) || !LEVELS.has(v)) return bad(res, 'Invalid body map.');
    if (v > 0) soreness[k] = v;
  }
  const flags = {};
  for (const f of RED_FLAGS) if (b.flags?.[f.id] === true) flags[f.id] = true;
  const movement = cleanMovement(b.movement);
  const day = validDay(b.day);

  const previous = db.prepare('SELECT movement FROM checks WHERE user_id = ? AND movement IS NOT NULL ORDER BY created_at DESC LIMIT 10').all(u.id)
    .map((r) => JSON.parse(r.movement));
  const result = assess({ answers, soreness, flags, movement, baseline: buildBaseline(previous) });
  result.plan = buildPlan(result, u.sport);

  const info = db.prepare(`INSERT INTO checks (user_id, day, score, color, answers, soreness, flags, movement, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(u.id, day, result.score, result.color, JSON.stringify(answers), JSON.stringify(soreness),
    JSON.stringify(flags), movement ? JSON.stringify(movement) : null, JSON.stringify(result));
  const row = db.prepare('SELECT * FROM checks WHERE id = ?').get(Number(info.lastInsertRowid));
  res.json({ check: rowToCheck(row, accessInfo(u).pro) });
});

app.get('/api/checks', requireUser, (req, res) => {
  const pro = accessInfo(req.user).pro;
  const days = pro ? 120 : 7;
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  // Latest check per day.
  const rows = db.prepare(`SELECT c.* FROM checks c JOIN (SELECT day, MAX(id) AS id FROM checks WHERE user_id = ? AND day >= ? GROUP BY day) l ON l.id = c.id
    ORDER BY c.day DESC`).all(req.user.id, since);
  const all = db.prepare('SELECT COUNT(DISTINCT day) AS n FROM checks WHERE user_id = ?').get(req.user.id).n;
  res.json({ checks: rows.map((r) => rowToCheck(r, pro)), limitedTo: pro ? null : 7, totalDays: all });
});

app.get('/api/checks/today', requireUser, (req, res) => {
  const day = validDay(req.query.day);
  const row = db.prepare('SELECT * FROM checks WHERE user_id = ? AND day = ? ORDER BY id DESC LIMIT 1').get(req.user.id, day);
  res.json({ check: row ? rowToCheck(row, accessInfo(req.user).pro) : null });
});

app.post('/api/checks/:id/coach', requireUser, wrap(async (req, res) => {
  if (!accessInfo(req.user).pro) return bad(res, 'The AI coach is part of Pro.', 402);
  const row = db.prepare('SELECT * FROM checks WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
  if (!row) return bad(res, 'Check not found.', 404);
  if (row.coach_note) return res.json({ note: row.coach_note });
  const history = db.prepare('SELECT day, color, score FROM checks WHERE user_id = ? AND id < ? ORDER BY id DESC LIMIT 7').all(req.user.id, row.id);
  const note = await coachNote({ user: req.user, check: rowToCheck(row, true), history });
  db.prepare('UPDATE checks SET coach_note = ? WHERE id = ?').run(note, row.id);
  res.json({ note });
}));

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------
function newCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    const code = Array.from(crypto.randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
    if (!db.prepare('SELECT 1 FROM teams WHERE code = ?').get(code)) return code;
  }
}
const membership = (teamId, userId) => db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(teamId, userId)?.role;

app.get('/api/teams', requireUser, (req, res) => {
  const teams = db.prepare(`SELECT t.id, t.name, t.sport, t.code, m.role,
      (SELECT COUNT(*) FROM team_members x WHERE x.team_id = t.id AND x.role = 'player') AS players
    FROM team_members m JOIN teams t ON t.id = m.team_id WHERE m.user_id = ? ORDER BY t.created_at`).all(req.user.id);
  res.json({ teams: teams.map((t) => (t.role === 'coach' ? t : { ...t, code: undefined })) });
});

app.post('/api/teams', requireUser, (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 60);
  const sport = SPORTS.some((s) => s.id === req.body.sport) ? req.body.sport : req.user.sport;
  if (!name) return bad(res, 'Give your team a name.');
  const count = db.prepare("SELECT COUNT(*) AS n FROM team_members WHERE user_id = ? AND role = 'coach'").get(req.user.id).n;
  if (count >= 10) return bad(res, 'You can coach up to 10 teams.');
  const info = db.prepare('INSERT INTO teams (name, sport, code, coach_id) VALUES (?, ?, ?, ?)').run(name, sport, newCode(), req.user.id);
  const id = Number(info.lastInsertRowid);
  db.prepare("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'coach')").run(id, req.user.id);
  res.json({ team: db.prepare('SELECT id, name, sport, code FROM teams WHERE id = ?').get(id) });
});

app.post('/api/teams/join', requireUser, (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const team = db.prepare('SELECT * FROM teams WHERE code = ?').get(code);
  if (!team) return bad(res, 'No team with that code. Check it with your coach.', 404);
  if (membership(team.id, req.user.id)) return res.json({ team: { id: team.id, name: team.name } });
  const players = db.prepare("SELECT COUNT(*) AS n FROM team_members WHERE team_id = ? AND role = 'player'").get(team.id).n;
  if (players >= 60) return bad(res, 'This team is full.');
  db.prepare("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'player')").run(team.id, req.user.id);
  res.json({ team: { id: team.id, name: team.name } });
});

app.get('/api/teams/:id', requireUser, (req, res) => {
  const id = Number(req.params.id);
  const role = membership(id, req.user.id);
  if (!role) return bad(res, 'Team not found.', 404);
  const team = db.prepare('SELECT id, name, sport, code FROM teams WHERE id = ?').get(id);
  if (role !== 'coach') return res.json({ team: { ...team, code: undefined }, role });
  if (!accessInfo(req.user).team) return res.json({ team, role, locked: true });
  const day = validDay(req.query.day);
  // Coaches see each player's latest check today: color, score and sore spots. Never video or answers.
  const roster = db.prepare(`SELECT u.id, u.name, c.color, c.score, c.soreness, c.result, c.created_at
    FROM team_members m JOIN users u ON u.id = m.user_id
    LEFT JOIN checks c ON c.id = (SELECT MAX(id) FROM checks WHERE user_id = u.id AND day = ?)
    WHERE m.team_id = ? AND m.role = 'player' ORDER BY u.name`).all(day, id)
    .map((r) => ({
      id: r.id, name: r.name, color: r.color, score: r.score, checkedAt: r.created_at,
      sore: r.soreness ? Object.entries(JSON.parse(r.soreness)).filter(([, l]) => l > 0).map(([k, l]) => ({ region: k, level: l })) : [],
      seeDoctor: r.result ? JSON.parse(r.result).seeDoctor : false,
    }));
  const week = db.prepare(`SELECT c.day, c.color, COUNT(*) AS n FROM checks c JOIN team_members m ON m.user_id = c.user_id
    WHERE m.team_id = ? AND m.role = 'player' AND c.day >= ? AND c.id IN (SELECT MAX(id) FROM checks GROUP BY user_id, day)
    GROUP BY c.day, c.color`).all(id, new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10));
  res.json({ team, role, roster, week });
});

app.delete('/api/teams/:id/members/:userId', requireUser, (req, res) => {
  const id = Number(req.params.id);
  const target = req.params.userId === 'me' ? req.user.id : Number(req.params.userId);
  const role = membership(id, req.user.id);
  if (!role) return bad(res, 'Team not found.', 404);
  if (target !== req.user.id && role !== 'coach') return bad(res, 'Only the coach can remove players.', 403);
  if (target === req.user.id && role === 'coach') {
    db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    return res.json({ ok: true, deleted: true });
  }
  db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(id, target);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Billing and admin
// ---------------------------------------------------------------------------
app.post('/api/billing/checkout', requireUser, wrap(async (req, res) => {
  if (!billingEnabled) return bad(res, 'Payments are not set up yet.', 503);
  res.json({ url: await createCheckout(req, req.body.plan === 'team' ? 'team' : 'pro') });
}));
app.post('/api/billing/portal', requireUser, wrap(async (req, res) => {
  if (!billingEnabled || !req.user.stripe_customer_id) return bad(res, 'No subscription to manage.');
  res.json({ url: await createPortal(req) });
}));

app.get('/api/admin', requireUser, requireAdmin, (req, res) => {
  const n = (sql, ...p) => db.prepare(sql).get(...p).n;
  const since7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const pro = n("SELECT COUNT(*) AS n FROM users WHERE subscription_status IN ('active','trialing','past_due') AND plan = 'pro'");
  const team = n("SELECT COUNT(*) AS n FROM users WHERE subscription_status IN ('active','trialing','past_due') AND plan = 'team'");
  res.json({
    users: n('SELECT COUNT(*) AS n FROM users'),
    pro, team,
    estimatedMrr: Math.round(pro * Number(process.env.PRICE_PRO_EUR || 7.99) + team * Number(process.env.PRICE_TEAM_EUR || 29)),
    checks7: n('SELECT COUNT(*) AS n FROM checks WHERE day >= ?', since7),
    active7: n('SELECT COUNT(DISTINCT user_id) AS n FROM checks WHERE day >= ?', since7),
    teams: n('SELECT COUNT(*) AS n FROM teams'),
    colors7: db.prepare('SELECT color, COUNT(*) AS n FROM checks WHERE day >= ? GROUP BY color').all(since7),
    billingEnabled, aiEnabled: aiEnabled(),
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', (_req, res) => bad(res, 'Not found.', 404));
app.use((err, _req, res, _next) => {
  if (err instanceof AiError) return res.status(err.status).json({ error: err.message });
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// ---------------------------------------------------------------------------
// Web app
// ---------------------------------------------------------------------------
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, {
    index: false,
    setHeaders: (res, file) => {
      if (/\.(wasm|task)$/.test(file)) res.setHeader('Cache-Control', 'public, max-age=604800');
      if (file.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm');
    },
  }));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = Number(process.env.PORT || 3002);
if (process.env.NODE_ENV !== 'test') app.listen(port, () => console.log(`GreenLight running on http://localhost:${port}`));
export default app;
