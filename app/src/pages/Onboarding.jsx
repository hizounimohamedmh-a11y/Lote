import { useState } from 'react';
import { api, fmtMinutes } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { PROFESSIONS, LEVELS } from '../../shared/content.js';

const LEVEL_HELP = {
  A1: 'I’m a beginner or know only a few words.',
  A2: 'I can handle simple everyday conversations.',
  B1: 'I can talk about work and daily life, with mistakes.',
  B2: 'I speak quite well and want to pass B2.',
};

export default function Onboarding() {
  const session = useSession();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ profession: 'nursing', level: 'A1', goalMinutes: 180, examDate: '' });
  const [error, setError] = useState(null);

  const finish = async () => {
    try {
      const { user } = await api('/me', { method: 'PUT', body: { ...form, examDate: form.examDate || null, onboarded: true } });
      session.setUser(user);
    } catch (e) { setError(e.message); }
  };

  const steps = [
    {
      title: `Welcome, ${session.user.name.split(' ')[0]}! What’s your profession?`,
      sub: 'We use real situations from your job in conversations and vocabulary.',
      body: (
        <div className="choice">
          {PROFESSIONS.map((p) => (
            <button key={p.id} className={form.profession === p.id ? 'sel' : ''} onClick={() => setForm({ ...form, profession: p.id })}>{p.label}</button>
          ))}
        </div>
      ),
    },
    {
      title: 'Which level are you working on now?',
      sub: 'You can change this at any time.',
      body: (
        <div className="choice">
          {LEVELS.map((l) => (
            <button key={l} className={form.level === l ? 'sel' : ''} onClick={() => setForm({ ...form, level: l })}>
              <strong>{l}</strong> <span className="muted">· {LEVEL_HELP[l]}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'How much time can you study each day?',
      sub: '3–4 hours a day is how people reach B1/B2 in months, not years.',
      body: (
        <div className="stack">
          <div className="stat"><span className="num">{fmtMinutes(form.goalMinutes)}</span><span className="lbl"> per day</span></div>
          <input type="range" min="60" max="300" step="30" value={form.goalMinutes}
            onChange={(e) => setForm({ ...form, goalMinutes: Number(e.target.value) })} aria-label="Daily study time" />
          <label className="field">Exam date (optional)
            <input className="input" type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
          </label>
        </div>
      ),
    },
  ];
  const s = steps[step];

  return (
    <div className="center" style={{ padding: 16 }}>
      <div className="card stack" style={{ maxWidth: 520, width: '100%' }}>
        <div className="row between">
          <div className="logo" style={{ padding: 0 }}>Lote<span>.</span></div>
          <span className="small muted">Step {step + 1} of {steps.length}</span>
        </div>
        <div>
          <h2>{s.title}</h2>
          <p className="muted small">{s.sub}</p>
        </div>
        {s.body}
        {error && <div className="alert">{error}</div>}
        <div className="row between">
          <button className="btn ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>Back</button>
          {step < steps.length - 1
            ? <button className="btn" onClick={() => setStep(step + 1)}>Continue</button>
            : <button className="btn" onClick={finish}>Start learning</button>}
        </div>
      </div>
    </div>
  );
}
