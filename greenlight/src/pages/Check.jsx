import { useState } from 'react';
import { api, go, Icon, localDay, Orb, DEMO } from '../lib.jsx';
import { QUESTIONS, RED_FLAGS } from '../../shared/content.js';
import BodyMap from '../components/BodyMap.jsx';
import Scan from '../components/Scan.jsx';
import VideoScan from '../components/VideoScan.jsx';

const EMOJI = { sleep: ['😵', '😐', '😴'], energy: ['🪫', '😮‍💨', '🙂', '💪', '🔥'], load: ['🛋️', '🚶', '🏋️', '🏟️'] };

function Question({ id, value, onChange }) {
  const q = QUESTIONS[id];
  const cls = q.options.length === 5 ? 'row5' : q.options.length === 3 ? 'row3' : 'row4';
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="label">{q.q}</div>
      <div className={`options ${cls}`} role="radiogroup" aria-label={q.q}>
        {q.options.map((o, i) => (
          <button key={o.v} role="radio" aria-checked={value === o.v} className={`opt${value === o.v ? ' sel' : ''}`} onClick={() => onChange(o.v)}>
            <span className="big" aria-hidden="true">{EMOJI[id][i]}</span>{o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Check({ onFinished }) {
  const [step, setStep] = useState(0); // 0 questions, 1 body, 2 flags, 3 scan intro, 4 scanning, 5 saving
  const [answers, setAnswers] = useState({});
  const [soreness, setSoreness] = useState({});
  const [flags, setFlags] = useState({});
  const [error, setError] = useState(null);
  const needFlags = Object.values(soreness).some((l) => l >= 6);
  const total = 4;
  const progressStep = step === 0 ? 1 : step === 1 ? 2 : step === 2 ? 2.5 : 3;

  const submit = async (movement) => {
    setStep(5); setError(null);
    try {
      const { check } = await api('/checks', { method: 'POST', body: { day: localDay(), answers, soreness, flags, movement } });
      try { sessionStorage.setItem('gl-reveal', String(check.id)); } catch { /* optional */ }
      onFinished?.(check);
      go('/');
    } catch (e) { setError(e.message); setStep(3); }
  };

  if (step === 4) return <Scan onDone={submit} onSkip={() => setStep(3)} />;

  return (
    <div className="flow">
      <div className="flow-top">
        <button className="icon-btn" onClick={() => (step === 0 ? go('/') : setStep(step === 3 && !needFlags ? 1 : step - 1))} aria-label={step === 0 ? 'Close' : 'Back'}>
          <Icon name={step === 0 ? 'close' : 'back'} />
        </button>
        <div className="bar"><i style={{ width: `${(progressStep / total) * 100}%` }} /></div>
        <span className="small muted nums">{Math.min(3, Math.ceil(progressStep))}/3</span>
      </div>

      <div className="flow-body">
        {step === 0 && (
          <>
            <h2>How are you today?</h2>
            <Question id="sleep" value={answers.sleep} onChange={(v) => setAnswers({ ...answers, sleep: v })} />
            <Question id="energy" value={answers.energy} onChange={(v) => setAnswers({ ...answers, energy: v })} />
            <Question id="load" value={answers.load} onChange={(v) => setAnswers({ ...answers, load: v })} />
            <div className="flow-foot">
              <button className="btn block big" disabled={!answers.sleep || !answers.energy || answers.load === undefined} onClick={() => setStep(1)}>Next</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="stack" style={{ gap: 6 }}>
              <h2>Anything sore?</h2>
              <p className="muted small">Tap where you feel it. Tap again to make it stronger. Skip if you feel fine.</p>
            </div>
            <BodyMap value={soreness} onChange={setSoreness} />
            <div className="flow-foot">
              <button className="btn block big" onClick={() => setStep(needFlags ? 2 : 3)}>
                {Object.values(soreness).some(Boolean) ? 'Next' : 'Nothing sore · Next'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="stack" style={{ gap: 6 }}>
              <h2>A few safety questions</h2>
              <p className="muted small">About the spot that’s sore or painful. Be honest. This is what keeps a small problem small.</p>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {RED_FLAGS.map((f) => (
                <div key={f.id} className="card flat row between" style={{ flexWrap: 'nowrap', padding: 14 }}>
                  <span style={{ fontWeight: 600 }}>{f.q}</span>
                  <div className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
                    <button className={`opt${flags[f.id] === false ? ' sel' : ''}`} style={{ padding: '8px 14px' }} onClick={() => setFlags({ ...flags, [f.id]: false })}>No</button>
                    <button className={`opt${flags[f.id] === true ? ' sel' : ''}`} style={{ padding: '8px 14px', ...(flags[f.id] === true ? { borderColor: 'var(--stop)', background: 'var(--stop-soft)' } : {}) }} onClick={() => setFlags({ ...flags, [f.id]: true })}>Yes</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flow-foot">
              <button className="btn block big" disabled={RED_FLAGS.some((f) => flags[f.id] === undefined)} onClick={() => setStep(3)}>Next</button>
            </div>
          </>
        )}

        {step === 3 && DEMO && <VideoScan onDone={submit} onSkip={() => submit(null)} />}
        {step === 3 && !DEMO && (
          <>
            <div className="stack" style={{ gap: 6 }}>
              <h2>30-second movement scan</h2>
              <p className="muted">Your camera watches how you move today and compares it with your normal. Three moves: squats, balance on each leg, arms up.</p>
            </div>
            <div className="card stack" style={{ gap: 14 }}>
              <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><span className="pill green">1</span><span>Lean your phone against a wall, bag or shoe on the floor, in portrait.</span></div>
              <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><span className="pill green">2</span><span>Step back 2–3 metres until your whole body is on screen.</span></div>
              <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><span className="pill green">3</span><span>Follow the voice. Turn your sound on.</span></div>
            </div>
            <div className="row small muted" style={{ flexWrap: 'nowrap' }}><span style={{ width: 18, flex: 'none', display: 'inline-flex' }}><Icon name="shield" /></span> The video is processed on your phone and never uploaded.</div>
            {error && <div className="alert">{error}</div>}
            <div className="flow-foot stack" style={{ gap: 10 }}>
              <button className="btn block big" onClick={() => setStep(4)}><Icon name="camera" /> Start the scan</button>
              <button className="btn block ghost" onClick={() => submit(null)}>Skip the scan today</button>
            </div>
          </>
        )}

        {step === 5 && (
          <div className="center stack" style={{ justifyItems: 'center', gap: 26 }}>
            <Orb color={null} size={160}><div className="spinner" /></Orb>
            <h3>Reading your body…</h3>
            {error && <div className="alert">{error}</div>}
          </div>
        )}
        {step === 3 && DEMO && error && <div className="alert">{error}</div>}
      </div>
    </div>
  );
}
