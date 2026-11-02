// In-browser stand-in for the Lote server, used by the hosted demo build.
// Progress is saved per viewer (claude.ai storage when available, otherwise
// this browser). The AI partner uses the viewer's own Claude account.
import {
  DECKS, LESSONS, EXAMS, WRITING_TASKS, CLASS_SCHEDULE, ACTIVITIES, LEVELS, LEVEL_HOURS, PROFESSIONS,
  dailyPlan, deckById, lessonById, scenarioById, writingById, examById,
} from '../../shared/content.js';

class DemoError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const LOCAL_KEY = 'lote-demo-state';
const today = () => new Date().toISOString().slice(0, 10);
const dayStr = (d) => d.toISOString().slice(0, 10);

let state = null;
let store = null; // { save(state) }
let samplePromise = null;
let signedOut = false;

const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))]);

function getSample() {
  if (!samplePromise) samplePromise = window.claude?.use ? withTimeout(window.claude.use('sample').catch(() => null), 6000) : Promise.resolve(null);
  return samplePromise;
}

async function load() {
  if (state) return state;
  let saved = null;
  // Prefer claude.ai storage (follows the viewer across devices), else this browser.
  try {
    const db = window.claude?.use ? await withTimeout(window.claude.use('db'), 6000) : null;
    const user = window.claude?.use ? await withTimeout(window.claude.use('user'), 6000) : null;
    const uid = db && user ? await user.id() : null;
    if (db && uid) {
      const ref = db.doc(`data/users/${uid}/state`);
      const snap = await withTimeout(ref.get(), 8000);
      if (snap) {
        if (snap.exists) saved = snap.data().json ? JSON.parse(snap.data().json) : null;
        store = { save: (s) => ref.set({ json: JSON.stringify(s), updatedAt: new Date().toISOString() }) };
      }
    }
  } catch { /* fall through to local */ }
  if (!store) {
    try { saved = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); } catch { saved = null; }
    store = { local: true, save: async (s) => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(s)); } catch { /* ignore */ } } };
  }
  state = saved || { user: null, activity: {}, cards: {}, lessons: {}, exams: [], writing: [], attendance: {} };
  return state;
}

let saveTimer = null;
let saving = Promise.resolve();
function flush() {
  clearTimeout(saveTimer); saveTimer = null;
  saving = saving.then(() => store.save(state)).catch(() => {});
}
// Browser storage saves right away; claude.ai storage batches quick changes.
function persist() {
  if (store.local) { flush(); return; }
  if (!saveTimer) saveTimer = setTimeout(flush, 1500);
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && saveTimer) flush(); });
}

// ---------------------------------------------------------------------------
// Progress logic (mirrors server/progress.js)
// ---------------------------------------------------------------------------
function levelHours(level) {
  const i = LEVELS.indexOf(level);
  return LEVEL_HOURS[level] - (i > 0 ? LEVEL_HOURS[LEVELS[i - 1]] : 0);
}
function minutesByType(day) {
  return Object.fromEntries(Object.entries(state.activity[day] || {}).map(([t, s]) => [t, Math.round(s / 60)]));
}
function daySeconds(day) { return Object.values(state.activity[day] || {}).reduce((a, b) => a + b, 0); }
function streak() {
  const d = new Date();
  if (daySeconds(dayStr(d)) < 600) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (daySeconds(dayStr(d)) >= 600) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}
function lastDays(count) {
  const out = []; const d = new Date();
  d.setUTCDate(d.getUTCDate() - (count - 1));
  for (let i = 0; i < count; i++) { const k = dayStr(d); out.push({ day: k, minutes: Math.round(daySeconds(k) / 60) }); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}
function totalHours(since = '0000-00-00') {
  return Object.entries(state.activity).filter(([day]) => day >= since).reduce((s, [day]) => s + daySeconds(day), 0) / 3600;
}
const passedLessons = () => new Set(Object.entries(state.lessons).filter(([, s]) => s >= 0.7).map(([id]) => id));
function levelProgress() {
  const u = state.user;
  const hours = totalHours(u.level_since);
  const hoursPct = Math.min(1, hours / levelHours(u.level));
  const ls = LESSONS.filter((l) => l.level === u.level);
  const passed = passedLessons();
  const lessonPct = ls.length ? ls.filter((l) => passed.has(l.id)).length / ls.length : hoursPct;
  const examIds = EXAMS.filter((e) => e.level === u.level).map((e) => e.id);
  const scores = state.exams.filter((e) => examIds.includes(e.exam_id)).map((e) => e.score);
  const examPct = examIds.length ? (scores.length ? Math.max(...scores) : 0) : lessonPct;
  return {
    level: u.level, percent: Math.round((0.5 * hoursPct + 0.3 * lessonPct + 0.2 * examPct) * 100),
    hours: Math.round(hours * 10) / 10, hoursNeeded: levelHours(u.level),
    lessonPct: Math.round(lessonPct * 100), examPct: Math.round(examPct * 100),
  };
}
function scheduleCard(prev, grade) {
  let { ease = 2.5, interval_days: interval = 0, reps = 0 } = prev || {};
  if (grade === 0) { reps = 0; interval = 0; ease = Math.max(1.3, ease - 0.2); } else {
    reps += 1;
    if (reps === 1) interval = grade === 3 ? 3 : 1;
    else if (reps === 2) interval = grade === 1 ? 3 : 6;
    else interval = Math.round(interval * (grade === 1 ? 1.2 : grade === 3 ? ease * 1.3 : ease));
    ease = Math.max(1.3, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
  }
  return { ease, interval_days: interval, reps, due_at: new Date(Date.now() + (grade === 0 ? 120e3 : interval * 864e5)).toISOString() };
}
function allCards() {
  return Object.entries(state.cards).flatMap(([deck, cards]) => Object.entries(cards).map(([i, c]) => ({ deck, index: Number(i), ...c })));
}
function todaysClasses(level) {
  const berlin = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const dow = berlin.getDay() === 0 ? 7 : berlin.getDay();
  return CLASS_SCHEDULE.filter((c) => c.level === level && c.days.includes(dow));
}
function publicUser(u) {
  return { id: 1, name: u.name, email: u.email, level: u.level, profession: u.profession, goalMinutes: u.goal_minutes, examDate: u.exam_date, onboarded: u.onboarded, isAdmin: false };
}
function addActivity(type, seconds) {
  const d = today();
  state.activity[d] = state.activity[d] || {};
  state.activity[d][type] = (state.activity[d][type] || 0) + seconds;
}

// ---------------------------------------------------------------------------
// AI (viewer's own Claude account)
// ---------------------------------------------------------------------------
function aiErrorMessage(e) {
  if (e?.code === 'not_granted') return 'To use the AI partner, allow this page to use Claude when your browser asks.';
  if (e?.code === 'rate_limited') return 'Too many messages at once. Wait a moment and send again.';
  if (e?.code === 'invalid_json') return 'The tutor gave an unreadable answer. Please send again.';
  return 'The AI partner isn’t available right now. Please try again.';
}

async function tutorTurn({ scenarioId, history }) {
  const sample = await getSample();
  if (!sample) throw new DemoError('The AI partner works when this page is opened on claude.ai.', 503);
  const s = scenarioById(scenarioId);
  const u = state.user;
  const transcript = history.map((t) => `${t.role === 'assistant' ? 'YOU' : 'LEARNER'}: ${t.text}`).join('\n');
  const prompt = `You are the speaking partner inside Lote, a program that prepares people to work in Germany and pass the Goethe/telc exams.

Play this role in a realistic conversation and help the learner speak German.
Scenario: ${s.title}
Your role: ${s.role}
Learner's goal: ${s.goal}
Learner level: ${u.level} (A1 = very short simple sentences; A2 = simple sentences and Perfekt; B1 = everyday speed with subordinate clauses; B2 = natural speech)
Learner's profession: ${u.profession}

Rules: stay in role; reply with ONE short turn (1-3 sentences) ending with a question or prompt; use "Sie" unless the role is a colleague or friend. Ignore missing punctuation and capitalisation. Correct only real grammar, word-choice or word-order mistakes in the learner's LAST message. Be warm and encouraging.

Conversation so far:
${transcript}

Reply with only a JSON object:
{"reply": "your next line in German", "reply_en": "English translation", "corrections": [{"original": "learner's wrong phrase", "corrected": "corrected phrase", "explanation": "one short sentence in simple English"}], "better_phrase": "a more natural way to say the learner's message, or empty string", "goal_reached": false}`;
  try {
    const r = await sample.json(prompt, { modelTier: 'quick', cache: false });
    if (!r || typeof r.reply !== 'string') throw { code: 'invalid_json' };
    return { reply: r.reply, reply_en: String(r.reply_en || ''), corrections: Array.isArray(r.corrections) ? r.corrections : [], better_phrase: String(r.better_phrase || ''), goal_reached: Boolean(r.goal_reached) };
  } catch (e) { throw new DemoError(aiErrorMessage(e), 503); }
}

async function gradeWriting(task, text) {
  const sample = await getSample();
  if (!sample) throw new DemoError('AI grading works when this page is opened on claude.ai.', 503);
  const prompt = `You are an experienced, fair examiner for the Goethe-Zertifikat and telc German exams. Grade the learner's text for target level ${task.level} against: task completion, coherence, vocabulary, grammar. Be honest but encouraging. Comments in simple English. 60/100 is a pass.

Task: ${task.prompt}
Expected length: ${task.words} words

Learner's text:
"""
${text}
"""

Reply with only a JSON object:
{"score": 0-100, "estimated_level": "below A1|A1|A2|B1|B2|C1", "criteria": [{"name": "Task completion", "score": 0-5, "comment": "..."}, {"name": "Coherence", ...}, {"name": "Vocabulary", ...}, {"name": "Grammar", ...}], "corrections": [{"original": "...", "corrected": "...", "explanation": "..."}], "improved_version": "the text rewritten correctly at the target level", "next_step": "one concrete tip"}`;
  try {
    const r = await sample.json(prompt, { modelTier: 'default' });
    if (!r || typeof r.score !== 'number') throw { code: 'invalid_json' };
    return { criteria: [], corrections: [], improved_version: '', next_step: '', estimated_level: task.level, ...r };
  } catch (e) { throw new DemoError(aiErrorMessage(e), 503); }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
export async function demoApi(path, { method = 'GET', body } = {}) {
  await load();
  const u = state.user;
  const need = () => { if (!u) throw new DemoError('Please start the demo first.', 401); };
  let m;

  if (path === '/me' && method === 'GET') {
    if (!u || signedOut) return { user: null };
    return { user: publicUser(u), access: { billingEnabled: false, hasAccess: true, subscribed: false, trialActive: true }, aiEnabled: Boolean(await getSample()) };
  }
  if (path === '/auth/register' || path === '/auth/login') {
    const name = String(body?.name || '').trim() || String(body?.email || '').split('@')[0] || 'Learner';
    if (path === '/auth/login' && !u) throw new DemoError('No demo profile in this browser yet. Use “Start free week”.', 401);
    signedOut = false;
    if (!u) {
      state.user = { name, email: String(body?.email || ''), level: 'A1', level_since: today(), profession: 'other', goal_minutes: 180, exam_date: null, onboarded: false };
      persist();
    }
    return { ok: true };
  }
  if (path === '/auth/logout') {
    // Demo: keep progress; "Log in" brings the same profile back.
    signedOut = true;
    return { ok: true };
  }
  if (path === '/me' && method === 'PUT') {
    need();
    const b = body;
    if (LEVELS.includes(b.level) && b.level !== u.level) { u.level = b.level; u.level_since = today(); }
    if (PROFESSIONS.some((p) => p.id === b.profession)) u.profession = b.profession;
    if (Number(b.goalMinutes)) u.goal_minutes = Math.min(360, Math.max(30, Math.round(Number(b.goalMinutes))));
    if ('examDate' in b) u.exam_date = b.examDate || null;
    if (typeof b.name === 'string' && b.name.trim()) u.name = b.name.trim().slice(0, 80);
    if (b.onboarded) u.onboarded = true;
    persist();
    return { user: publicUser(u) };
  }

  need();

  if (path === '/dashboard') {
    const done = minutesByType(today());
    const passed = passedLessons();
    const next = LESSONS.find((l) => l.level === u.level && !passed.has(l.id)) || LESSONS.find((l) => !passed.has(l.id)) || null;
    const now = new Date().toISOString();
    return {
      plan: dailyPlan(u.goal_minutes).map((p) => ({ ...p, done: done[p.type] || 0 })),
      todayMinutes: Object.values(done).reduce((a, b) => a + b, 0),
      goalMinutes: u.goal_minutes, streak: streak(), days: lastDays(14),
      totalHours: Math.round(totalHours() * 10) / 10, progress: levelProgress(),
      dueCards: allCards().filter((c) => c.due_at <= now).length,
      nextLesson: next && { id: next.id, title: next.title, level: next.level },
      classes: todaysClasses(u.level), attended: state.attendance[today()] || [],
    };
  }
  if (path === '/progress') {
    const byType = {};
    for (const types of Object.values(state.activity)) for (const [t, s] of Object.entries(types)) byType[t] = (byType[t] || 0) + s;
    return {
      days: lastDays(28),
      byType: Object.entries(byType).map(([type, s]) => ({ type, hours: Math.round((s / 3600) * 10) / 10 })),
      exams: [...state.exams].reverse().slice(0, 20), writing: [...state.writing].reverse().slice(0, 20), progress: levelProgress(),
    };
  }
  if (path === '/activity') {
    if (!ACTIVITIES[body.type]) throw new DemoError('Unknown activity.');
    addActivity(body.type, Math.min(Math.round(Number(body.seconds)) || 0, 90));
    persist();
    return { ok: true };
  }
  if (path === '/vocab') {
    const now = new Date().toISOString();
    return {
      decks: DECKS.map((d) => {
        const c = Object.values(state.cards[d.id] || {});
        return { id: d.id, title: d.title, level: d.level, profession: d.profession, total: d.cards.length, seen: c.length, due: c.filter((x) => x.due_at <= now).length, known: c.filter((x) => x.interval_days >= 7).length };
      }),
    };
  }
  if ((m = path.match(/^\/vocab\/([\w-]+)\/session$/))) {
    const deck = deckById(m[1]);
    if (!deck) throw new DemoError('Deck not found.', 404);
    const seen = state.cards[deck.id] || {};
    const now = new Date().toISOString();
    const due = Object.entries(seen).filter(([, c]) => c.due_at <= now).sort((a, b) => a[1].due_at.localeCompare(b[1].due_at)).map(([i]) => Number(i));
    const fresh = deck.cards.map((_, i) => i).filter((i) => !(i in seen)).slice(0, 10);
    return { deck: { id: deck.id, title: deck.title }, cards: [...due.slice(0, 30), ...fresh].map((i) => ({ index: i, ...deck.cards[i], isNew: !(i in seen) })) };
  }
  if (path === '/vocab/review') {
    const deck = deckById(body.deckId);
    if (!deck?.cards[body.index]) throw new DemoError('Invalid review.');
    state.cards[deck.id] = state.cards[deck.id] || {};
    state.cards[deck.id][body.index] = scheduleCard(state.cards[deck.id][body.index], Number(body.grade));
    persist();
    return { next: state.cards[deck.id][body.index] };
  }
  if (path === '/lessons') {
    return { lessons: LESSONS.map((l) => ({ id: l.id, level: l.level, title: l.title, minutes: l.minutes, best: state.lessons[l.id] ?? null })) };
  }
  if ((m = path.match(/^\/lessons\/([\w-]+)\/result$/))) {
    if (!lessonById(m[1])) throw new DemoError('Lesson not found.', 404);
    state.lessons[m[1]] = Math.max(state.lessons[m[1]] ?? 0, Number(body.score));
    persist();
    return { ok: true };
  }
  if (path === '/exams') {
    return {
      exams: EXAMS.map((e) => {
        const r = state.exams.filter((x) => x.exam_id === e.id);
        return { id: e.id, level: e.level, title: e.title, minutes: e.minutes, best: r.length ? Math.max(...r.map((x) => x.score)) : null, attempts: r.length };
      }),
    };
  }
  if ((m = path.match(/^\/exams\/([\w-]+)\/result$/))) {
    const exam = examById(m[1]);
    let total = 0; let correct = 0;
    exam.sections.forEach((s, si) => s.questions.forEach((q, qi) => { total++; if (body.answers?.[si]?.[qi] === q.answer) correct++; }));
    state.exams.push({ exam_id: exam.id, score: correct / total, taken_at: new Date().toISOString() });
    persist();
    return { score: correct / total, correct, total };
  }
  if (path === '/speak') return tutorTurn(body);
  if (path === '/writing') {
    return {
      tasks: WRITING_TASKS.map((t) => {
        const r = state.writing.filter((w) => w.task_id === t.id);
        return { ...t, best: r.length ? Math.max(...r.map((w) => w.score)) : null };
      }),
    };
  }
  if ((m = path.match(/^\/writing\/([\w-]+)$/))) {
    const task = writingById(m[1]);
    const text = String(body.text || '').trim();
    if (text.split(/\s+/).length < 10) throw new DemoError('Write at least 10 words first.');
    const f = await gradeWriting(task, text);
    state.writing.push({ task_id: task.id, score: f.score, created_at: new Date().toISOString() });
    persist();
    return f;
  }
  if (path === '/classes') {
    const att = state.attendance[today()] || [];
    return { classes: CLASS_SCHEDULE.map((c) => ({ ...c, hasLink: false, attendedToday: att.includes(c.id) })), attendedTotal: Object.values(state.attendance).flat().length };
  }
  throw new DemoError('This part isn’t available in the demo.', 404);
}
