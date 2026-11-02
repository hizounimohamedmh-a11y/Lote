import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
delete process.env.ANTHROPIC_API_KEY;

const { default: app } = await import('../index.js');
const { scheduleCard } = await import('../progress.js');
const { db } = await import('../db.js');

let server; let base;
before(() => new Promise((resolve) => {
  server = app.listen(0, () => { base = `http://localhost:${server.address().port}/api`; resolve(); });
}));
after(() => server.close());

// Minimal cookie-keeping client.
function client() {
  let cookie = '';
  return async (path, { method = 'GET', body } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, body: await res.json().catch(() => null) };
  };
}

test('register, log out, log in again', async () => {
  const c = client();
  assert.equal((await c('/auth/register', { method: 'POST', body: { name: 'A', email: 'a@x.io', password: 'short' } })).status, 400);
  assert.equal((await c('/auth/register', { method: 'POST', body: { name: 'A', email: 'a@x.io', password: 'longenough' } })).status, 200);
  assert.equal((await c('/me')).body.user.email, 'a@x.io');
  assert.equal((await c('/me')).body.user.isAdmin, true, 'first user is admin');
  await c('/auth/logout', { method: 'POST' });
  assert.equal((await c('/me')).body.user, null);
  assert.equal((await c('/auth/login', { method: 'POST', body: { email: 'a@x.io', password: 'wrongpass' } })).status, 401);
  assert.equal((await c('/auth/login', { method: 'POST', body: { email: 'A@X.io', password: 'longenough' } })).status, 200);
  assert.equal((await c('/auth/register', { method: 'POST', body: { name: 'B', email: 'a@x.io', password: 'longenough' } })).status, 409);
});

test('learning endpoints require login', async () => {
  const c = client();
  assert.equal((await c('/dashboard')).status, 401);
  assert.equal((await c('/activity', { method: 'POST', body: { type: 'vocab', seconds: 60 } })).status, 401);
});

test('activity is capped per report and shows on the dashboard', async () => {
  const c = client();
  await c('/auth/register', { method: 'POST', body: { name: 'C', email: 'c@x.io', password: 'longenough' } });
  assert.equal((await c('/activity', { method: 'POST', body: { type: 'nope', seconds: 60 } })).status, 400);
  await c('/activity', { method: 'POST', body: { type: 'vocab', seconds: 100000 } });
  await c('/activity', { method: 'POST', body: { type: 'vocab', seconds: 60 } });
  const d = (await c('/dashboard')).body;
  assert.equal(d.plan.find((p) => p.type === 'vocab').done, 3, '90s cap + 60s = 150s = 3 min (rounded)');
});

test('exams are graded on the server', async () => {
  const c = client();
  await c('/auth/register', { method: 'POST', body: { name: 'D', email: 'd@x.io', password: 'longenough' } });
  const r = (await c('/exams/mock-a2-1/result', { method: 'POST', body: { answers: [[1, 0, 1, 2], [0, 0, 0, 0]] } })).body;
  assert.equal(r.total, 8);
  assert.equal(r.correct, 5);
});

test('joining a live class credits one hour once per day', async () => {
  process.env.LIVE_CLASS_URL = 'https://meet.example.com/x';
  const c = client();
  await c('/auth/register', { method: 'POST', body: { name: 'E', email: 'e@x.io', password: 'longenough' } });
  assert.equal((await c('/classes/a1-am/join', { method: 'POST' })).body.url, 'https://meet.example.com/x');
  await c('/classes/a1-am/join', { method: 'POST' });
  const d = (await c('/dashboard')).body;
  assert.equal(d.plan.find((p) => p.type === 'class').done, 60);
  delete process.env.LIVE_CLASS_URL;
});

test('AI endpoints explain when no API key is configured', async () => {
  const c = client();
  await c('/auth/register', { method: 'POST', body: { name: 'F', email: 'f@x.io', password: 'longenough' } });
  const r = await c('/speak', { method: 'POST', body: { scenarioId: 'intro', history: [{ role: 'assistant', text: 'Hallo' }, { role: 'user', text: 'Hi' }] } });
  assert.equal(r.status, 503);
  const bad = await c('/speak', { method: 'POST', body: { scenarioId: 'intro', history: [{ role: 'user', text: 'Hi' }] } });
  assert.equal(bad.status, 400);
});

test('non-admins cannot open the admin area', async () => {
  const c = client();
  await c('/auth/register', { method: 'POST', body: { name: 'G', email: 'g@x.io', password: 'longenough' } });
  assert.equal((await c('/admin')).status, 403);
});

test('spaced repetition intervals grow and reset', () => {
  let s = scheduleCard(null, 2);
  assert.equal(s.interval_days, 1);
  s = scheduleCard(s, 2);
  assert.equal(s.interval_days, 6);
  s = scheduleCard(s, 2);
  assert.equal(s.interval_days, 15);
  const again = scheduleCard(s, 0);
  assert.equal(again.interval_days, 0);
  assert.ok(again.ease < s.ease);
  assert.ok(db);
});
