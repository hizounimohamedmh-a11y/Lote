import { useState } from 'react';
import { api, Orb } from '../lib.jsx';
import { useSession } from '../App.jsx';

function Auth() {
  const session = useSession();
  const [mode, setMode] = useState('register');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try { await api(`/auth/${mode}`, { method: 'POST', body: f }); await session.refresh(); } catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <div className="card" id="start" style={{ padding: 22 }}>
      <div className="tabs">
        <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Get started</button>
        <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
      </div>
      <form className="stack" onSubmit={submit} style={{ gap: 12 }}>
        {mode === 'register' && <label className="field">Name<input id="name" className="input" value={f.name} onChange={set('name')} autoComplete="name" required /></label>}
        <label className="field">Email<input id="email" className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></label>
        <label className="field">Password<input id="password" className="input" type="password" value={f.password} onChange={set('password')} minLength={mode === 'register' ? 8 : undefined} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required /></label>
        {error && <div className="alert">{error}</div>}
        <button className="btn block big" disabled={busy}>{busy ? 'One moment…' : mode === 'register' ? 'Start free · 14 days of Pro' : 'Log in'}</button>
        {mode === 'register' && <p className="tiny faint" style={{ textAlign: 'center' }}>No card needed. The daily light stays free forever.</p>}
      </form>
    </div>
  );
}

export default function Welcome() {
  return (
    <div className="welcome">
      <header>
        <div className="brand" style={{ padding: 0 }}><i />GreenLight</div>
        <a className="btn small ghost" href="#start" onClick={(e) => { e.preventDefault(); document.getElementById('start')?.scrollIntoView({ behavior: 'smooth' }); }}>Log in</a>
      </header>

      <section className="hero">
        <div className="stack" style={{ gap: 22 }}>
          <div className="lights" aria-hidden="true">
            <Orb color="red" size={34}><span /></Orb>
            <Orb color="yellow" size={34}><span /></Orb>
            <Orb color="green" size={34}><span /></Orb>
          </div>
          <h1>Should you train today? <em>Know in 30 seconds.</em></h1>
          <p className="muted" style={{ fontSize: 19, maxWidth: 520 }}>
            Point your phone at yourself. GreenLight watches how your body moves today, compares it with your normal and gives you one answer: go, go easy or rest. Plus exactly what to do about it.
          </p>
          <div className="row small muted">
            <span className="pill green">No watch or strap needed</span>
            <span className="pill">Video never leaves your phone</span>
          </div>
        </div>
        <Auth />
      </section>

      <section className="stack" style={{ gap: 18, paddingBottom: 56 }}>
        <span className="label">How it works</span>
        <div className="how">
          <div className="card stack" style={{ gap: 8 }}><span className="n">01</span><h3>Check in</h3><p className="muted">Sleep, energy, yesterday’s load. Tap anything sore on the body map.</p></div>
          <div className="card stack" style={{ gap: 8 }}><span className="n">02</span><h3>Move</h3><p className="muted">3 squats, balance on each leg, arms up. Your camera tracks 33 points on your body.</p></div>
          <div className="card stack" style={{ gap: 8 }}><span className="n">03</span><h3>Get your light</h3><p className="muted">Green, yellow or red, why, and a plan built for your sport and your sore spots.</p></div>
        </div>
      </section>

      <section className="grid2" style={{ paddingBottom: 56 }}>
        <div className="card stack" style={{ gap: 10 }}>
          <span className="label">For athletes</span>
          <h2>Stop guessing. Stop missing games.</h2>
          <p className="muted">Most injuries happen on days your body was already telling you something. GreenLight catches it: a squat that’s 15% shallower, a leg that’s shakier than normal, a shoulder that won’t go all the way up.</p>
        </div>
        <div className="card stack" style={{ gap: 10 }}>
          <span className="label">For coaches</span>
          <h2>Your whole squad’s lights before training.</h2>
          <p className="muted">Players check in from home. You see who’s green, who to hold back and who needs a physio, in one screen. One team plan covers everyone.</p>
        </div>
      </section>

      <section className="card stack" style={{ gap: 14, marginBottom: 40 }}>
        <span className="label">Pricing</span>
        <div className="grid2">
          <div className="stack" style={{ gap: 6 }}><h3>Free</h3><p className="muted">Your daily light, score and headline. Forever.</p></div>
          <div className="stack" style={{ gap: 6 }}><h3>Pro · €7.99 / month</h3><p className="muted">Your full daily plan, the reasons behind your light, the AI coach note and all your history. First 14 days free.</p></div>
          <div className="stack" style={{ gap: 6 }}><h3>Team · €29 / month</h3><p className="muted">Coach dashboard for your whole squad, plus Pro for you.</p></div>
        </div>
      </section>
      <p className="tiny faint" style={{ textAlign: 'center', paddingBottom: 24 }}>GreenLight gives training guidance, not a medical diagnosis. For pain that worries you, see a doctor or physiotherapist.</p>
    </div>
  );
}
