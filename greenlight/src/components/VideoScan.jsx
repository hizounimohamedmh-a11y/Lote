import { useEffect, useRef, useState } from 'react';
import { loadPose, toFrame, drawSkeleton } from '../pose.js';
import { segment } from '../../shared/scoring.js';
import { Icon } from '../lib.jsx';

const MOVES = [
  ['squat', '3 slow squats', 'As deep as feels comfortable.'],
  ['balanceL', 'Balance on your left leg · 10 s', 'Lift your right foot.'],
  ['balanceR', 'Balance on your right leg · 10 s', 'Lift your left foot.'],
  ['reach', 'Both arms straight up · 5 s', 'Reach as high as you can.'],
];

// Record the scan with the phone's camera app (or pick a video), then analyse it on the device.
export default function VideoScan({ onDone, onSkip }) {
  const input = useRef(null);
  const video = useRef(null);
  const canvas = useRef(null);
  const [phase, setPhase] = useState('intro'); // intro | analysing | review | error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const cancel = useRef(false);

  useEffect(() => { loadPose().catch(() => {}); return () => { cancel.current = true; }; }, []);

  const analyse = async (file) => {
    if (!file) return;
    setPhase('analysing'); setProgress(0); setError(null); cancel.current = false;
    let url;
    try {
      const landmarker = await loadPose();
      const v = video.current;
      url = URL.createObjectURL(file);
      v.src = url;
      await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error('video')); });
      const dur = Math.min(v.duration || 0, 120);
      if (!Number.isFinite(dur) || dur < 3) throw new Error('short');
      const frames = []; const step = 1 / 12;
      for (let t = 0.05; t < dur; t += step) {
        if (cancel.current) return;
        v.currentTime = t;
        await new Promise((res) => { const on = () => { v.removeEventListener('seeked', on); res(); }; v.addEventListener('seeked', on); });
        const f = toFrame(landmarker.detectForVideo(v, Math.round(t * 1000) + 1), t * 1000);
        if (f) frames.push(f);
        drawSkeleton(canvas.current, v, f);
        setProgress(t / dur);
      }
      if (frames.length < 20) throw new Error('nobody');
      const r = segment(frames);
      setResult(r); setPhase('review');
    } catch (e) {
      setError(e.message === 'short' ? 'That video is too short. Record about 30 seconds with all four moves.'
        : e.message === 'nobody' ? 'We couldn’t see a person in that video. Make sure your whole body is in the frame.'
          : e.message === 'video' ? 'This video format can’t be read here. Try recording again.'
            : 'The body tracker couldn’t start here. You can skip the scan for today.');
      setPhase('error');
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  const okCount = result ? Object.values(result).filter((x) => x.ok).length : 0;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <input ref={input} type="file" accept="video/*" capture="user" hidden onChange={(e) => analyse(e.target.files?.[0])} />

      {phase === 'intro' && (
        <>
          <div className="stack" style={{ gap: 6 }}>
            <h2>Record your 30-second scan</h2>
            <p className="muted">Prop your phone on the floor, step back so your whole body is in view, then do these four moves in one video:</p>
          </div>
          <div className="card stack" style={{ gap: 12 }}>
            {MOVES.map(([id, t, h], i) => (
              <div key={id} className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                <span className="pill green nums">{i + 1}</span>
                <span><strong>{t}</strong><br /><span className="small muted">{h}</span></span>
              </div>
            ))}
          </div>
          <div className="row small muted" style={{ flexWrap: 'nowrap' }}><Icon name="shield" /> The video is analysed on your phone and never uploaded.</div>
          <div className="flow-foot stack" style={{ gap: 10 }}>
            <button className="btn block big" onClick={() => input.current?.click()}><Icon name="camera" /> Record my scan</button>
            <button className="btn block ghost" onClick={onSkip}>Skip the scan today</button>
          </div>
        </>
      )}

      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#000', aspectRatio: '3 / 4', display: phase === 'analysing' ? 'block' : 'none' }}>
        <video ref={video} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvas} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </div>
      {phase === 'analysing' && (
        <div className="stack" style={{ gap: 8 }}>
          <div className="row between"><strong>Reading your movement…</strong><span className="nums muted">{Math.round(progress * 100)}%</span></div>
          <div className="flow-top" style={{ padding: 0 }}><div className="bar"><i style={{ width: `${progress * 100}%` }} /></div></div>
        </div>
      )}

      {phase === 'review' && (
        <>
          <h2>{okCount === 4 ? 'All four moves captured' : `We caught ${okCount} of 4 moves`}</h2>
          <div className="card stack" style={{ gap: 10 }}>
            {MOVES.map(([id, t]) => (
              <div key={id} className="row" style={{ flexWrap: 'nowrap' }}>
                <span className={`dot ${result[id].ok ? 'green' : 'red'}`} />
                <span><strong>{t.split(' · ')[0]}</strong>{!result[id].ok && result[id].reason && <><br /><span className="small muted">{result[id].reason}</span></>}
                  {id === 'squat' && result.squat.ok && <span className="small muted"> · {result.squat.reps} reps</span>}</span>
              </div>
            ))}
          </div>
          <div className="flow-foot stack" style={{ gap: 10 }}>
            {okCount > 0
              ? <button className="btn block big" onClick={() => onDone(result)}>Get my light</button>
              : <button className="btn block big" onClick={() => input.current?.click()}>Record again</button>}
            {okCount > 0
              ? <button className="btn block ghost" onClick={() => input.current?.click()}>Record again</button>
              : <button className="btn block ghost" onClick={onSkip}>Continue without the scan</button>}
          </div>
        </>
      )}

      {phase === 'error' && (
        <>
          <div className="alert">{error}</div>
          <div className="flow-foot stack" style={{ gap: 10 }}>
            <button className="btn block big" onClick={() => input.current?.click()}>Record again</button>
            <button className="btn block ghost" onClick={onSkip}>Skip the scan today</button>
          </div>
        </>
      )}
    </div>
  );
}
