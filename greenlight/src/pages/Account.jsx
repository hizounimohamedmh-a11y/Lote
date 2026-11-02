import { useEffect, useState } from 'react';
import { api, useApi, Icon } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { SPORTS } from '../../shared/content.js';

function Plan() {
  const { access, refresh } = useSession();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const paid = window.location.hash.includes('paid=1');
  useEffect(() => { if (!paid) return undefined; const t = setTimeout(refresh, 4000); return () => clearTimeout(t); }, [paid, refresh]);
  const open = async (path, body) => {
    setBusy(true); setError(null);
    try { window.location.href = (await api(path, { method: 'POST', body })).url; } catch (e) { setError(e.message); setBusy(false); }
  };
  if (!access.billingEnabled) {
    return <div className="card stack" style={{ gap: 6 }}><span className="label">Your plan</span><h3>Everything unlocked</h3><p className="small muted">Payments aren’t switched on yet, so every feature is free for now.</p></div>;
  }
  const trialDays = Math.max(0, Math.ceil((new Date(access.trialEndsAt) - new Date()) / 864e5));
  return (
    <div className="card stack" style={{ gap: 14 }}>
      <span className="label">Your plan</span>
      {paid && <div className="alert ok">Thank you! Your plan is being activated.</div>}
      <h3>{access.plan === 'team' ? 'Team' : access.plan === 'pro' ? 'Pro' : access.trialActive ? `Pro trial · ${trialDays} day${trialDays === 1 ? '' : 's'} left` : 'Free'}</h3>
      {access.plan === 'free' ? (
        <div className="grid2">
          <div className="card flat stack" style={{ gap: 8 }}>
            <strong>Pro · €7.99/month</strong>
            <span className="small muted">Full daily plan, the why behind your light, AI coach note, all history and movement trends.</span>
            <button className="btn small" disabled={busy} onClick={() => open('/billing/checkout', { plan: 'pro' })}>Go Pro</button>
          </div>
          <div className="card flat stack" style={{ gap: 8 }}>
            <strong>Team · €29/month</strong>
            <span className="small muted">Everything in Pro plus the coach dashboard for your whole squad.</span>
            <button className="btn small soft" disabled={busy} onClick={() => open('/billing/checkout', { plan: 'team' })}>Get Team</button>
          </div>
        </div>
      ) : (
        <div><button className="btn ghost small" disabled={busy} onClick={() => open('/billing/portal')}>Manage payment or cancel</button></div>
      )}
      {error && <div className="alert">{error}</div>}
    </div>
  );
}

function Admin() {
  const { data } = useApi('/admin');
  if (!data) return null;
  const c = Object.fromEntries(data.colors7.map((x) => [x.color, x.n]));
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="row between"><span className="label">Admin · only you see this</span>
        <span className="row" style={{ gap: 6 }}><span className={`pill ${data.aiEnabled ? 'green' : 'yellow'}`}>AI {data.aiEnabled ? 'on' : 'off'}</span><span className={`pill ${data.billingEnabled ? 'green' : 'yellow'}`}>Payments {data.billingEnabled ? 'on' : 'off'}</span></span>
      </div>
      <div className="grid2">
        {[['Users', data.users], ['Paying Pro', data.pro], ['Paying teams', data.team], ['Est. monthly revenue', `€${data.estimatedMrr}`], ['Active last 7 days', data.active7], ['Checks last 7 days', data.checks7]].map(([l, v]) => (
          <div key={l} className="stack" style={{ gap: 2 }}><span className="small muted">{l}</span><span className="display nums" style={{ fontSize: 32 }}>{v}</span></div>
        ))}
      </div>
      <div className="row small"><span className="dot green" /> {c.green || 0} <span className="dot yellow" /> {c.yellow || 0} <span className="dot red" /> {c.red || 0} <span className="muted">lights this week</span></div>
    </div>
  );
}

export default function Account() {
  const session = useSession();
  const u = session.user;
  const [form, setForm] = useState({ name: u.name, sport: u.sport });
  const [msg, setMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    try { const { user } = await api('/me', { method: 'PUT', body: form }); session.setUser(user); setMsg('Saved.'); } catch (err) { setMsg(err.message); }
  };
  const del = async () => { await api('/me', { method: 'DELETE' }); window.location.hash = '/'; session.refresh(); };

  return (
    <div className="stack" style={{ gap: 18, maxWidth: 720 }}>
      <div className="row between">
        <h1 style={{ fontSize: 48 }}>You</h1>
        <button className="btn ghost small" onClick={session.logout}><Icon name="logout" /> Log out</button>
      </div>
      <Plan />
      <form className="card stack" onSubmit={save} style={{ gap: 12 }}>
        <span className="label">Profile</span>
        <label className="field">Name<input id="acc-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field">Main sport
          <select id="acc-sport" className="input" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
            {SPORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <p className="small muted">{u.email}</p>
        {msg && <div className="alert ok">{msg}</div>}
        <div><button className="btn small">Save</button></div>
      </form>
      <div className="card stack" style={{ gap: 8 }}>
        <span className="label">Privacy</span>
        <p className="small muted">Camera video is processed on your device and never uploaded. We store your answers, sore spots and movement measurements to learn your normal. Coaches of teams you join see your daily light, score and sore spots only.</p>
        {!confirmDelete
          ? <div><button className="btn ghost small" onClick={() => setConfirmDelete(true)}>Delete my account and data</button></div>
          : <div className="row"><span className="small">This permanently deletes everything.</span><button className="btn small" style={{ background: 'var(--stop)', color: '#fff' }} onClick={del}>Delete forever</button><button className="btn ghost small" onClick={() => setConfirmDelete(false)}>Cancel</button></div>}
      </div>
      {u.isAdmin && <Admin />}
    </div>
  );
}
