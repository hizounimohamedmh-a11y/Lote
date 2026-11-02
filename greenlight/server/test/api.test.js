import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
delete process.env.ANTHROPIC_API_KEY;
delete process.env.STRIPE_SECRET_KEY;

const { default: app } = await import('../index.js');
let server; let base;
before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}/api`; r(); }); }));
after(() => server.close());

function client() {
  let cookie = '';
  return async (path, { method = 'GET', body } = {}) => {
    const res = await fetch(base + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const set = res.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    return { status: res.status, body: await res.json().catch(() => null) };
  };
}
async function signup(email) {
  const c = client();
  assert.equal((await c('/auth/register', { method: 'POST', body: { name: email.split('@')[0], email, password: 'password123' } })).status, 200);
  return c;
}
const scan = (depth = 100, asym = 2) => ({
  squat: { ok: true, reps: 3, depth, asym, track: 1 },
  balanceL: { ok: true, sway: 2, held: 1 }, balanceR: { ok: true, sway: 2, held: 1 },
  reach: { ok: true, left: 170, right: 168 },
});

test('a check is scored on the server and returned with a plan', async () => {
  const c = await signup('a@x.io');
  assert.equal((await c('/checks', { method: 'POST', body: { answers: { sleep: 3 } } })).status, 400);
  assert.equal((await c('/checks', { method: 'POST', body: { answers: { sleep: 3, energy: 4, load: 0 }, soreness: { left_toe: 3 } } })).status, 400);
  const r = await c('/checks', { method: 'POST', body: { day: '2026-11-02', answers: { sleep: 3, energy: 4, load: 0 }, soreness: {}, movement: scan() } });
  assert.equal(r.status, 200);
  assert.equal(r.body.check.color, 'green');
  assert.ok(r.body.check.result.plan.blocks.length > 0, 'trial users get the full plan');
  const today = await c('/checks/today?day=2026-11-02');
  assert.equal(today.body.check.id, r.body.check.id);
});

test('baseline: after two normal scans, a worse scan lowers the score', async () => {
  const c = await signup('b@x.io');
  const ans = { sleep: 3, energy: 4, load: 0 };
  await c('/checks', { method: 'POST', body: { day: '2026-10-30', answers: ans, movement: scan() } });
  await c('/checks', { method: 'POST', body: { day: '2026-10-31', answers: ans, movement: scan() } });
  const r = await c('/checks', { method: 'POST', body: { day: '2026-11-01', answers: ans, movement: scan(70, 25) } });
  assert.equal(r.body.check.result.calibrating, false);
  assert.ok(r.body.check.score < 75, `score ${r.body.check.score}`);
  assert.ok(r.body.check.result.findings.length >= 2);
  const hist = await c('/checks');
  assert.equal(hist.body.checks.length, 3);
});

test('red flags force red', async () => {
  const c = await signup('c@x.io');
  const r = await c('/checks', { method: 'POST', body: { answers: { sleep: 3, energy: 5, load: 0 }, soreness: { right_knee: 6 }, flags: { swelling: true } } });
  assert.equal(r.body.check.color, 'red');
  assert.equal(r.body.check.result.seeDoctor, true);
});

test('teams: coach sees players’ colors; players cannot see the roster', async () => {
  const coach = await signup('coach@x.io');
  const t = (await coach('/teams', { method: 'POST', body: { name: 'FC Test', sport: 'football' } })).body.team;
  assert.match(t.code, /^[A-Z2-9]{6}$/);
  const p = await signup('player@x.io');
  assert.equal((await p('/teams/join', { method: 'POST', body: { code: 'NOPE00' } })).status, 404);
  assert.equal((await p('/teams/join', { method: 'POST', body: { code: t.code.toLowerCase() } })).status, 200);
  await p('/checks', { method: 'POST', body: { day: '2026-11-02', answers: { sleep: 1, energy: 1, load: 3 }, soreness: { left_hamstring: 8 } } });
  const view = await coach(`/teams/${t.id}?day=2026-11-02`);
  assert.equal(view.body.roster.length, 1);
  assert.equal(view.body.roster[0].color, 'red');
  assert.equal(view.body.roster[0].sore[0].region, 'left_hamstring');
  const pv = await p(`/teams/${t.id}`);
  assert.equal(pv.body.roster, undefined);
  assert.equal(pv.body.team.code, undefined);
  const outsider = await signup('out@x.io');
  assert.equal((await outsider(`/teams/${t.id}`)).status, 404);
  assert.equal((await p(`/teams/${t.id}/members/me`, { method: 'DELETE' })).status, 200);
  assert.equal((await coach(`/teams/${t.id}?day=2026-11-02`)).body.roster.length, 0);
});

test('AI coach explains when not configured', async () => {
  const c = await signup('d@x.io');
  const r = await c('/checks', { method: 'POST', body: { answers: { sleep: 3, energy: 4, load: 0 } } });
  assert.equal((await c(`/checks/${r.body.check.id}/coach`, { method: 'POST' })).status, 503);
});

test('checks require login and admin is protected', async () => {
  const c = client();
  assert.equal((await c('/checks')).status, 401);
  const u = await signup('e@x.io');
  assert.equal((await u('/admin')).status, 403);
});
