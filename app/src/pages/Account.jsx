import { useEffect, useState } from 'react';
import { api, useApi, fmtMinutes, Icon } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { LEVELS, PROFESSIONS } from '../../shared/content.js';

function Settings() {
  const session = useSession();
  const u = session.user;
  const [form, setForm] = useState({ name: u.name, level: u.level, profession: u.profession, goalMinutes: u.goalMinutes, examDate: u.examDate || '' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try {
      const { user } = await api('/me', { method: 'PUT', body: { ...form, examDate: form.examDate || null } });
      session.setUser(user); setMsg({ ok: true, text: 'Saved.' });
    } catch (err) { setMsg({ ok: false, text: err.message }); }
  };
  return (
    <form className="card stack" onSubmit={save}>
      <h2>Your profile</h2>
      <div className="grid2">
        <label className="field">Name<input className="input" value={form.name} onChange={set('name')} /></label>
        <label className="field">Profession
          <select className="input" value={form.profession} onChange={set('profession')}>
            {PROFESSIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="field">Current level
          <select className="input" value={form.level} onChange={set('level')}>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="field">Exam date<input className="input" type="date" value={form.examDate} onChange={set('examDate')} /></label>
      </div>
      <label className="field">Daily goal: {fmtMinutes(Number(form.goalMinutes))}
        <input type="range" min="60" max="300" step="30" value={form.goalMinutes} onChange={set('goalMinutes')} />
      </label>
      {msg && <div className={`alert ${msg.ok ? 'ok' : ''}`}>{msg.text}</div>}
      <div><button className="btn">Save</button></div>
    </form>
  );
}

function Subscription() {
  const { access, refresh } = useSession();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const paid = window.location.hash.includes('paid=1');
  useEffect(() => {
    if (!paid) return undefined;
    const t = setTimeout(refresh, 4000);
    return () => clearTimeout(t);
  }, [paid, refresh]);
  if (!access?.billingEnabled) return null;
  const go = async (path) => {
    setBusy(true); setError(null);
    try { window.location.href = (await api(path, { method: 'POST' })).url; } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <div className="card stack">
      <h2>Subscription</h2>
      {paid && <div className="alert ok">Thank you! Your subscription is being activated. It can take a few seconds.</div>}
      {access.subscribed ? (
        <>
          <p style={{ margin: 0 }}><span className="pill ok">Active</span> Lote Standard · €149 / month</p>
          <div><button className="btn ghost" onClick={() => go('/billing/portal')} disabled={busy}>Manage payment or cancel</button></div>
        </>
      ) : (
        <>
          <p style={{ margin: 0 }}>
            {access.trialActive ? `Your free week ends on ${new Date(access.trialEndsAt).toLocaleDateString()}.` : 'Your free week has ended.'}
            {' '}Subscribe to keep live classes, the AI partner and your study plan.
          </p>
          <div><button className="btn" onClick={() => go('/billing/checkout')} disabled={busy}>Subscribe · €149 / month</button></div>
        </>
      )}
      {error && <div className="alert">{error}</div>}
    </div>
  );
}

function Admin() {
  const { data, error, reload } = useApi('/admin');
  const [links, setLinks] = useState({});
  const [msg, setMsg] = useState(null);
  useEffect(() => { if (data) setLinks(data.classLinks); }, [data]);
  if (error) return <div className="alert">{error.message}</div>;
  if (!data) return null;
  const save = async () => {
    try { await api('/admin/class-links', { method: 'PUT', body: links }); setMsg({ ok: true, text: 'Links saved.' }); reload(); } catch (e) { setMsg({ ok: false, text: e.message }); }
  };
  return (
    <div className="card stack">
      <div className="row between"><h2 style={{ margin: 0 }}>Admin</h2><span className="pill accent">Only you see this</span></div>
      <div className="grid3">
        <div className="stat"><div className="lbl">Users</div><div className="num">{data.users}</div></div>
        <div className="stat"><div className="lbl">Paying subscribers</div><div className="num">{data.subscribers}</div></div>
        <div className="stat"><div className="lbl">Est. monthly revenue</div><div className="num">€{data.estimatedMrr.toLocaleString()}</div></div>
        <div className="stat"><div className="lbl">On free trial</div><div className="num">{data.trials}</div></div>
        <div className="stat"><div className="lbl">Active last 7 days</div><div className="num">{data.activeLast7}</div></div>
        <div className="stat"><div className="lbl">Study hours last 7 days</div><div className="num">{data.hoursLast7}</div></div>
      </div>
      <div className="row">
        <span className={`pill ${data.aiEnabled ? 'ok' : 'warn'}`}>AI {data.aiEnabled ? 'on' : 'off: set ANTHROPIC_API_KEY'}</span>
        <span className={`pill ${data.billingEnabled ? 'ok' : 'warn'}`}>Payments {data.billingEnabled ? 'on' : 'off: set Stripe keys'}</span>
      </div>
      <h3>Live class meeting links</h3>
      <p className="small muted" style={{ margin: 0 }}>Paste a Zoom, Google Meet or Jitsi link for each class. Learners only see the link when they join.</p>
      {data.schedule.map((c) => (
        <label key={c.id} className="field">{c.level} · {c.time} · {c.teacher}
          <input className="input" placeholder="https://…" value={links[c.id] || ''} onChange={(e) => setLinks({ ...links, [c.id]: e.target.value })} />
        </label>
      ))}
      {msg && <div className={`alert ${msg.ok ? 'ok' : ''}`}>{msg.text}</div>}
      <div><button className="btn" onClick={save}>Save links</button></div>
    </div>
  );
}

export default function Account() {
  const session = useSession();
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div className="row between">
        <h1 style={{ margin: 0 }}>Account</h1>
        <button className="btn ghost small" onClick={session.logout}><Icon name="logout" /> Log out</button>
      </div>
      <p className="muted" style={{ margin: 0 }}>{session.user.email}</p>
      <Subscription />
      <Settings />
      {session.user.isAdmin && <Admin />}
    </div>
  );
}
