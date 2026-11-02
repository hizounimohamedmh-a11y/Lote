import { useState } from 'react';
import { api } from '../lib.jsx';
import { useSession } from '../App.jsx';

function AuthForm() {
  const session = useSession();
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api(`/auth/${mode}`, { method: 'POST', body: form });
      await session.refresh();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="card" id="start">
      <div className="tabs">
        <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Start free week</button>
        <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
      </div>
      <form className="stack" onSubmit={submit}>
        {mode === 'register' && (
          <label className="field">Your name<input className="input" value={form.name} onChange={set('name')} autoComplete="name" required /></label>
        )}
        <label className="field">Email<input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></label>
        <label className="field">Password
          <input className="input" type="password" value={form.password} onChange={set('password')} minLength={mode === 'register' ? 8 : undefined}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required />
        </label>
        {error && <div className="alert">{error}</div>}
        <button className="btn block" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Log in'}</button>
        {mode === 'register' && <p className="tiny muted" style={{ margin: 0 }}>7 days free. No card needed to start.</p>}
      </form>
    </div>
  );
}

const FEATURES = [
  ['Live class', 'A real teacher and at most 15 classmates at your level, every weekday.'],
  ['AI speaking partner', 'Speak out loud in job interviews, hospital shifts and phone calls. Get corrected instantly.'],
  ['Words that stick', 'Spaced-repetition flashcards for everyday life and your profession.'],
  ['Exam-ready', 'Grammar lessons, AI-graded writing and mock exams in the Goethe/telc format.'],
];

export default function Welcome() {
  return (
    <div className="welcome">
      <header>
        <div className="logo" style={{ padding: 0 }}>Lote<span>.</span></div>
        <a className="btn small" href="#start" onClick={(e) => { e.preventDefault(); document.getElementById('start')?.scrollIntoView({ behavior: 'smooth' }); }}>Start free</a>
      </header>
      <section className="hero">
        <div>
          <span className="pill accent">Nurses · Care workers · Skilled trades · IT</span>
          <h1 style={{ marginTop: 16 }}>From zero German to a job in Germany.</h1>
          <p className="lead">3–4 focused hours a day, planned for you: live classes, an AI speaking partner, vocabulary, grammar, writing and exam training. One price, one goal: getting you hired.</p>
          <div className="row">
            <span className="pill ok">€149 / month</span>
            <span className="small muted">Cancel any time · first week free</span>
          </div>
        </div>
        <AuthForm />
      </section>
      <section className="features">
        {FEATURES.map(([t, d]) => (
          <div className="card" key={t}><h3>{t}</h3><p className="muted small" style={{ margin: 0 }}>{d}</p></div>
        ))}
      </section>
    </div>
  );
}
