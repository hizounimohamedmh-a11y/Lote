import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, today, getSetting, setSetting } from './db.js';
import {
  COOKIE, createSession, destroySession, cookieOptions, registerUser, verifyPassword,
  loadUser, requireUser, requireAdmin,
} from './auth.js';
import { accessInfo, requireAccess, billingEnabled, createCheckout, createPortal, webhook } from './billing.js';
import { aiEnabled, tutorTurn, gradeWriting, useQuota, AiError } from './ai.js';
import { dashboard, deckStats, scheduleCard, lastDays, levelProgress } from './progress.js';
import {
  LEVELS, PROFESSIONS, ACTIVITIES, CLASS_SCHEDULE, DECKS, LESSONS, EXAMS, WRITING_TASKS,
  deckById, lessonById, scenarioById, writingById, examById,
} from '../shared/content.js';

const app = express();
app.set('trust proxy', 1);

// Stripe needs the raw body, so this route comes before express.json().
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!billingEnabled) return res.status(404).end();
  webhook(req, res);
});

app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(loadUser);

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, msg, status = 400) => res.status(status).json({ error: msg });
const learner = [requireUser, requireAccess];

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, level: u.level, profession: u.profession,
    goalMinutes: u.goal_minutes, examDate: u.exam_date, onboarded: Boolean(u.onboarded), isAdmin: Boolean(u.is_admin),
  };
}

function classLink(classId) {
  const links = getSetting('classLinks', {});
  return links[classId] || process.env.LIVE_CLASS_URL || null;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const loginAttempts = new Map();
function tooManyAttempts(key) {
  const now = Date.now();
  const list = (loginAttempts.get(key) || []).filter((t) => now - t < 15 * 60e3);
  list.push(now);
  loginAttempts.set(key, list);
  return list.length > 10;
}

app.post('/api/auth/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || name.length > 80) return bad(res, 'Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'Please enter a valid email.');
  if (password.length < 8) return bad(res, 'Password must be at least 8 characters.');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return bad(res, 'An account with this email already exists.', 409);
  const id = registerUser({ name, email, password });
  const s = createSession(id);
  res.cookie(COOKIE, s.token, cookieOptions(s.expires)).json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (tooManyAttempts(`${req.ip}:${email}`)) return bad(res, 'Too many attempts. Try again in 15 minutes.', 429);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(String(req.body.password || ''), user.password_hash)) {
    return bad(res, 'Wrong email or password.', 401);
  }
  const s = createSession(user.id);
  res.cookie(COOKIE, s.token, cookieOptions(s.expires)).json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies?.[COOKIE];
  if (token) destroySession(token);
  res.clearCookie(COOKIE, { path: '/' }).json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: publicUser(req.user), access: accessInfo(req.user), aiEnabled: aiEnabled() });
});

app.put('/api/me', requireUser, (req, res) => {
  const u = req.user;
  const b = req.body;
  const level = LEVELS.includes(b.level) ? b.level : u.level;
  const profession = PROFESSIONS.some((p) => p.id === b.profession) ? b.profession : u.profession;
  const goal = Number.isFinite(Number(b.goalMinutes)) ? Math.min(360, Math.max(30, Math.round(Number(b.goalMinutes)))) : u.goal_minutes;
  const examDate = b.examDate === null || /^\d{4}-\d{2}-\d{2}$/.test(b.examDate ?? '') ? (b.examDate ?? null) : u.exam_date;
  const name = typeof b.name === 'string' && b.name.trim() ? b.name.trim().slice(0, 80) : u.name;
  const onboarded = b.onboarded ? 1 : u.onboarded;
  const levelSince = level !== u.level ? today() : u.level_since;
  db.prepare(`UPDATE users SET name=?, level=?, level_since=?, profession=?, goal_minutes=?, exam_date=?, onboarded=? WHERE id=?`)
    .run(name, level, levelSince, profession, goal, examDate, onboarded, u.id);
  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
  res.json({ user: publicUser(fresh) });
});

// ---------------------------------------------------------------------------
// Dashboard and time tracking
// ---------------------------------------------------------------------------
app.get('/api/dashboard', ...learner, (req, res) => res.json(dashboard(req.user)));

app.get('/api/progress', ...learner, (req, res) => {
  const byType = db.prepare('SELECT type, SUM(seconds) AS s FROM activity WHERE user_id = ? GROUP BY type').all(req.user.id)
    .map((r) => ({ type: r.type, hours: Math.round((r.s / 3600) * 10) / 10 }));
  const exams = db.prepare('SELECT exam_id, score, taken_at FROM exam_results WHERE user_id = ? ORDER BY taken_at DESC LIMIT 20').all(req.user.id);
  const writing = db.prepare('SELECT task_id, score, created_at FROM writing_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json({ days: lastDays(req.user.id, 28), byType, exams, writing, progress: levelProgress(req.user) });
});

app.post('/api/activity', ...learner, (req, res) => {
  const type = String(req.body.type || '');
  const seconds = Math.round(Number(req.body.seconds));
  if (!ACTIVITIES[type]) return bad(res, 'Unknown activity.');
  if (!(seconds > 0)) return bad(res, 'Invalid duration.');
  // Clients report at most once a minute; cap to stop inflated numbers.
  const s = Math.min(seconds, 90);
  db.prepare(`INSERT INTO activity (user_id, day, type, seconds) VALUES (?, ?, ?, ?)
              ON CONFLICT(user_id, day, type) DO UPDATE SET seconds = seconds + excluded.seconds`)
    .run(req.user.id, today(), type, s);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------
app.get('/api/vocab', ...learner, (req, res) => res.json({ decks: deckStats(req.user.id) }));

app.get('/api/vocab/:deckId/session', ...learner, (req, res) => {
  const deck = deckById(req.params.deckId);
  if (!deck) return bad(res, 'Deck not found.', 404);
  const rows = db.prepare('SELECT * FROM cards WHERE user_id = ? AND deck_id = ?').all(req.user.id, deck.id);
  const seen = new Map(rows.map((r) => [r.card_index, r]));
  const now = new Date().toISOString();
  const due = rows.filter((r) => r.due_at <= now).sort((a, b) => a.due_at.localeCompare(b.due_at)).map((r) => r.card_index);
  const fresh = deck.cards.map((_, i) => i).filter((i) => !seen.has(i)).slice(0, 10);
  const order = [...due.slice(0, 30), ...fresh];
  res.json({ deck: { id: deck.id, title: deck.title }, cards: order.map((i) => ({ index: i, ...deck.cards[i], isNew: !seen.has(i) })) });
});

app.post('/api/vocab/review', ...learner, (req, res) => {
  const deck = deckById(req.body.deckId);
  const index = Number(req.body.index);
  const grade = Number(req.body.grade);
  if (!deck || !deck.cards[index] || ![0, 1, 2, 3].includes(grade)) return bad(res, 'Invalid review.');
  const prev = db.prepare('SELECT * FROM cards WHERE user_id = ? AND deck_id = ? AND card_index = ?').get(req.user.id, deck.id, index);
  const next = scheduleCard(prev, grade);
  db.prepare(`INSERT INTO cards (user_id, deck_id, card_index, ease, interval_days, reps, due_at) VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id, deck_id, card_index) DO UPDATE SET ease=excluded.ease, interval_days=excluded.interval_days,
              reps=excluded.reps, due_at=excluded.due_at`)
    .run(req.user.id, deck.id, index, next.ease, next.interval_days, next.reps, next.due_at);
  res.json({ next });
});

// ---------------------------------------------------------------------------
// Lessons and exams
// ---------------------------------------------------------------------------
app.get('/api/lessons', ...learner, (req, res) => {
  const scores = Object.fromEntries(db.prepare('SELECT lesson_id, best_score FROM lesson_results WHERE user_id = ?').all(req.user.id)
    .map((r) => [r.lesson_id, r.best_score]));
  res.json({ lessons: LESSONS.map((l) => ({ id: l.id, level: l.level, title: l.title, minutes: l.minutes, best: scores[l.id] ?? null })) });
});

app.post('/api/lessons/:id/result', ...learner, (req, res) => {
  const lesson = lessonById(req.params.id);
  const score = Number(req.body.score);
  if (!lesson || !(score >= 0 && score <= 1)) return bad(res, 'Invalid result.');
  db.prepare(`INSERT INTO lesson_results (user_id, lesson_id, best_score, completed_at) VALUES (?, ?, ?, datetime('now'))
              ON CONFLICT(user_id, lesson_id) DO UPDATE SET best_score = MAX(best_score, excluded.best_score), completed_at = excluded.completed_at`)
    .run(req.user.id, lesson.id, score);
  res.json({ ok: true });
});

app.get('/api/exams', ...learner, (req, res) => {
  const best = Object.fromEntries(db.prepare('SELECT exam_id, MAX(score) AS s, COUNT(*) AS n FROM exam_results WHERE user_id = ? GROUP BY exam_id')
    .all(req.user.id).map((r) => [r.exam_id, { best: r.s, attempts: r.n }]));
  res.json({ exams: EXAMS.map((e) => ({ id: e.id, level: e.level, title: e.title, minutes: e.minutes, ...(best[e.id] || { best: null, attempts: 0 }) })) });
});

app.post('/api/exams/:id/result', ...learner, (req, res) => {
  const exam = examById(req.params.id);
  const answers = req.body.answers;
  if (!exam || !Array.isArray(answers)) return bad(res, 'Invalid result.');
  // Grade on the server against the answer key.
  let total = 0; let correct = 0;
  exam.sections.forEach((s, si) => s.questions.forEach((q, qi) => {
    total++; if (answers?.[si]?.[qi] === q.answer) correct++;
  }));
  const score = correct / total;
  db.prepare('INSERT INTO exam_results (user_id, exam_id, score) VALUES (?, ?, ?)').run(req.user.id, exam.id, score);
  res.json({ score, correct, total });
});

// ---------------------------------------------------------------------------
// AI speaking partner and writing
// ---------------------------------------------------------------------------
app.post('/api/speak', ...learner, wrap(async (req, res) => {
  const scenario = scenarioById(req.body.scenarioId);
  const history = req.body.history;
  if (!scenario || !Array.isArray(history) || history.length < 2 || history.length > 80) return bad(res, 'Invalid conversation.');
  const clean = history.map((t) => ({ role: t.role === 'assistant' ? 'assistant' : 'user', text: String(t.text || '').slice(0, 1500) }));
  for (let i = 0; i < clean.length; i++) {
    if (clean[i].role !== (i % 2 === 0 ? 'assistant' : 'user') || !clean[i].text.trim()) return bad(res, 'Invalid conversation.');
  }
  if (clean[clean.length - 1].role !== 'user') return bad(res, 'Invalid conversation.');
  useQuota(req.user.id);
  res.json(await tutorTurn({ user: req.user, scenario, history: clean }));
}));

app.get('/api/writing', ...learner, (req, res) => {
  const rows = db.prepare('SELECT task_id, MAX(score) AS best FROM writing_results WHERE user_id = ? GROUP BY task_id').all(req.user.id);
  const best = Object.fromEntries(rows.map((r) => [r.task_id, r.best]));
  res.json({ tasks: WRITING_TASKS.map((t) => ({ ...t, best: best[t.id] ?? null })) });
});

app.post('/api/writing/:id', ...learner, wrap(async (req, res) => {
  const task = writingById(req.params.id);
  const text = String(req.body.text || '').trim();
  if (!task) return bad(res, 'Task not found.', 404);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 10) return bad(res, 'Write at least 10 words first.');
  if (text.length > 5000) return bad(res, 'Your text is too long.');
  useQuota(req.user.id);
  const feedback = await gradeWriting({ user: req.user, task, text });
  db.prepare('INSERT INTO writing_results (user_id, task_id, text, feedback, score) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, task.id, text, JSON.stringify(feedback), feedback.score);
  res.json(feedback);
}));

// ---------------------------------------------------------------------------
// Live classes
// ---------------------------------------------------------------------------
app.get('/api/classes', ...learner, (req, res) => {
  const attended = db.prepare('SELECT class_id FROM attendance WHERE user_id = ? AND day = ?').all(req.user.id, today()).map((r) => r.class_id);
  res.json({
    classes: CLASS_SCHEDULE.map((c) => ({ ...c, hasLink: Boolean(classLink(c.id)), attendedToday: attended.includes(c.id) })),
    attendedTotal: db.prepare('SELECT COUNT(*) AS n FROM attendance WHERE user_id = ?').get(req.user.id).n,
  });
});

app.post('/api/classes/:id/join', ...learner, (req, res) => {
  const cls = CLASS_SCHEDULE.find((c) => c.id === req.params.id);
  if (!cls) return bad(res, 'Class not found.', 404);
  const url = classLink(cls.id);
  if (!url) return bad(res, 'This class has no meeting link yet.', 409);
  const first = db.prepare('INSERT OR IGNORE INTO attendance (user_id, day, class_id) VALUES (?, ?, ?)').run(req.user.id, today(), cls.id);
  // Credit the full class hour once per class per day.
  if (first.changes) {
    db.prepare(`INSERT INTO activity (user_id, day, type, seconds) VALUES (?, ?, 'class', 3600)
                ON CONFLICT(user_id, day, type) DO UPDATE SET seconds = seconds + 3600`).run(req.user.id, today());
  }
  res.json({ url });
});

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------
app.post('/api/billing/checkout', requireUser, wrap(async (req, res) => {
  if (!billingEnabled) return bad(res, 'Payments are not set up yet.', 503);
  res.json({ url: await createCheckout(req) });
}));

app.post('/api/billing/portal', requireUser, wrap(async (req, res) => {
  if (!billingEnabled || !req.user.stripe_customer_id) return bad(res, 'No subscription to manage.', 400);
  res.json({ url: await createPortal(req) });
}));

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
app.get('/api/admin', requireUser, requireAdmin, (req, res) => {
  const count = (sql, ...p) => db.prepare(sql).get(...p).n;
  const since7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const subscribers = count("SELECT COUNT(*) AS n FROM users WHERE subscription_status IN ('active','trialing','past_due')");
  res.json({
    users: count('SELECT COUNT(*) AS n FROM users'),
    subscribers,
    trials: count('SELECT COUNT(*) AS n FROM users WHERE trial_ends_at > ?', new Date().toISOString()),
    activeLast7: count('SELECT COUNT(DISTINCT user_id) AS n FROM activity WHERE day >= ?', since7),
    hoursLast7: Math.round((db.prepare('SELECT COALESCE(SUM(seconds),0) AS s FROM activity WHERE day >= ?').get(since7).s / 3600) * 10) / 10,
    estimatedMrr: subscribers * Number(process.env.PRICE_EUR || 149),
    classLinks: getSetting('classLinks', {}),
    schedule: CLASS_SCHEDULE,
    billingEnabled,
    aiEnabled: aiEnabled(),
  });
});

app.put('/api/admin/class-links', requireUser, requireAdmin, (req, res) => {
  const links = {};
  for (const c of CLASS_SCHEDULE) {
    const url = String(req.body?.[c.id] || '').trim();
    if (url && !/^https:\/\//.test(url)) return bad(res, `Link for ${c.id} must start with https://`);
    if (url) links[c.id] = url;
  }
  setSetting('classLinks', links);
  res.json({ classLinks: links });
});

// Public content (no answers for exams).
app.get('/api/content', (_req, res) => {
  res.json({
    decks: DECKS.map((d) => ({ id: d.id, title: d.title, level: d.level, profession: d.profession, size: d.cards.length })),
  });
});

app.use('/api', (_req, res) => bad(res, 'Not found.', 404));

// Errors
app.use((err, _req, res, _next) => {
  if (err instanceof AiError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// ---------------------------------------------------------------------------
// Web app (built by Vite)
// ---------------------------------------------------------------------------
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = Number(process.env.PORT || 3001);
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Lote running on http://localhost:${port}`));
}

export default app;
