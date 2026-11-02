import { db, today } from './db.js';
import { LEVELS, LEVEL_HOURS, LESSONS, EXAMS, DECKS, dailyPlan, CLASS_SCHEDULE } from '../shared/content.js';

const dayStr = (d) => d.toISOString().slice(0, 10);

export function levelHours(level) {
  const i = LEVELS.indexOf(level);
  return LEVEL_HOURS[level] - (i > 0 ? LEVEL_HOURS[LEVELS[i - 1]] : 0);
}

export function minutesByType(userId, day) {
  const rows = db.prepare('SELECT type, seconds FROM activity WHERE user_id = ? AND day = ?').all(userId, day);
  return Object.fromEntries(rows.map((r) => [r.type, Math.round(r.seconds / 60)]));
}

// Consecutive days (ending today, or yesterday if today is not started) with 10+ minutes.
export function streak(userId) {
  const rows = db.prepare(
    'SELECT day FROM activity WHERE user_id = ? GROUP BY day HAVING SUM(seconds) >= 600 ORDER BY day DESC LIMIT 400',
  ).all(userId);
  const days = new Set(rows.map((r) => r.day));
  const d = new Date();
  if (!days.has(dayStr(d))) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (days.has(dayStr(d))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

export function lastDays(userId, count = 14) {
  const out = [];
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (count - 1));
  const rows = db.prepare('SELECT day, SUM(seconds) AS s FROM activity WHERE user_id = ? AND day >= ? GROUP BY day')
    .all(userId, dayStr(d));
  const map = Object.fromEntries(rows.map((r) => [r.day, r.s]));
  for (let i = 0; i < count; i++) {
    const key = dayStr(d);
    out.push({ day: key, minutes: Math.round((map[key] || 0) / 60) });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function totals(userId, since = '0000-00-00') {
  const row = db.prepare('SELECT COALESCE(SUM(seconds), 0) AS s FROM activity WHERE user_id = ? AND day >= ?').get(userId, since);
  return row.s / 3600;
}

export function levelProgress(user) {
  const hours = totals(user.id, user.level_since);
  const hoursPct = Math.min(1, hours / levelHours(user.level));

  const levelLessons = LESSONS.filter((l) => l.level === user.level);
  const passed = db.prepare('SELECT lesson_id FROM lesson_results WHERE user_id = ? AND best_score >= 0.7').all(user.id)
    .map((r) => r.lesson_id);
  const lessonPct = levelLessons.length ? levelLessons.filter((l) => passed.includes(l.id)).length / levelLessons.length : hoursPct;

  const levelExams = EXAMS.filter((e) => e.level === user.level).map((e) => e.id);
  let examPct = lessonPct;
  if (levelExams.length) {
    const best = db.prepare(
      `SELECT MAX(score) AS s FROM exam_results WHERE user_id = ? AND exam_id IN (${levelExams.map(() => '?').join(',')})`,
    ).get(user.id, ...levelExams).s;
    examPct = best ?? 0;
  }
  const pct = 0.5 * hoursPct + 0.3 * lessonPct + 0.2 * examPct;
  return {
    level: user.level,
    percent: Math.round(pct * 100),
    hours: Math.round(hours * 10) / 10,
    hoursNeeded: levelHours(user.level),
    lessonPct: Math.round(lessonPct * 100),
    examPct: Math.round(examPct * 100),
  };
}

export function dueCardCount(userId) {
  return db.prepare('SELECT COUNT(*) AS n FROM cards WHERE user_id = ? AND due_at <= ?').get(userId, new Date().toISOString()).n;
}

export function deckStats(userId) {
  const now = new Date().toISOString();
  const rows = db.prepare(
    `SELECT deck_id, COUNT(*) AS seen, SUM(CASE WHEN due_at <= ? THEN 1 ELSE 0 END) AS due,
            SUM(CASE WHEN interval_days >= 7 THEN 1 ELSE 0 END) AS known
     FROM cards WHERE user_id = ? GROUP BY deck_id`,
  ).all(now, userId);
  const map = Object.fromEntries(rows.map((r) => [r.deck_id, r]));
  return DECKS.map((d) => ({
    id: d.id, title: d.title, level: d.level, profession: d.profession, total: d.cards.length,
    seen: map[d.id]?.seen || 0, due: map[d.id]?.due || 0, known: map[d.id]?.known || 0,
  }));
}

// Simplified SM-2 spaced repetition. grade: 0 again, 1 hard, 2 good, 3 easy.
export function scheduleCard(prev, grade) {
  let { ease = 2.5, interval_days: interval = 0, reps = 0 } = prev || {};
  if (grade === 0) {
    reps = 0; interval = 0; ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) interval = grade === 3 ? 3 : 1;
    else if (reps === 2) interval = grade === 1 ? 3 : 6;
    else interval = Math.round(interval * (grade === 1 ? 1.2 : grade === 3 ? ease * 1.3 : ease));
    ease = Math.max(1.3, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
  }
  // "Again" comes back in 2 minutes inside the same session.
  const dueMs = grade === 0 ? 2 * 60e3 : interval * 864e5;
  return { ease, interval_days: interval, reps, due_at: new Date(Date.now() + dueMs).toISOString() };
}

export function todaysClasses(level) {
  const now = new Date();
  // Days are Monday=1..Sunday=7 in Berlin time.
  const berlin = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const dow = berlin.getDay() === 0 ? 7 : berlin.getDay();
  return CLASS_SCHEDULE.filter((c) => c.level === level && c.days.includes(dow));
}

export function dashboard(user) {
  const day = today();
  const done = minutesByType(user.id, day);
  const plan = dailyPlan(user.goal_minutes).map((p) => ({ ...p, done: done[p.type] || 0 }));
  const todayMinutes = Object.values(done).reduce((a, b) => a + b, 0);
  const passed = new Set(db.prepare('SELECT lesson_id FROM lesson_results WHERE user_id = ? AND best_score >= 0.7').all(user.id).map((r) => r.lesson_id));
  const nextLesson = LESSONS.find((l) => l.level === user.level && !passed.has(l.id))
    || LESSONS.find((l) => !passed.has(l.id)) || null;
  return {
    plan,
    todayMinutes,
    goalMinutes: user.goal_minutes,
    streak: streak(user.id),
    days: lastDays(user.id, 14),
    totalHours: Math.round(totals(user.id) * 10) / 10,
    progress: levelProgress(user),
    dueCards: dueCardCount(user.id),
    nextLesson: nextLesson && { id: nextLesson.id, title: nextLesson.title, level: nextLesson.level },
    classes: todaysClasses(user.level),
    attended: db.prepare('SELECT class_id FROM attendance WHERE user_id = ? AND day = ?').all(user.id, day).map((r) => r.class_id),
  };
}
