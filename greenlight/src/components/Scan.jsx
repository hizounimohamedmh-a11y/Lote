import { useEffect, useRef, useState } from 'react';
import { loadPose, toFrame, drawSkeleton, fullBodyVisible } from '../pose.js';
import { squatMetrics, balanceMetrics, reachMetrics, angle, LM } from '../../shared/scoring.js';
import { Icon, say, vibrate } from '../lib.jsx';

const TESTS = [
  { id: 'squat', title: '3 slow squats', voice: 'Do three slow squats. Go as deep as feels comfortable.', ms: 16000, hint: 'Arms out in front. As deep as feels comfortable.' },
  { id: 'balanceL', title: 'Balance on your left leg', voice: 'Lift your right foot and balance on your left leg.', ms: 10000, hint: 'Hands on hips. Lift your right foot.' },
  { id: 'balanceR', title: 'Balance on your right leg', voice: 'Now switch. Balance on your right leg.', ms: 10000, hint: 'Hands on hips. Lift your left foot.' },
  { id: 'reach', title: 'Both arms up', voice: 'Raise both arms straight up above your head, and hold.', ms: 6000, hint: 'Reach as high as you can. Hold.' },
];

function measure(test, frames) {
  if (test.id === 'squat') return squatMetrics(frames);
  if (test.id === 'balanceL') return balanceMetrics(frames, 'left');
  if (test.id === 'balanceR') return balanceMetrics(frames, 'right');
  return reachMetrics(frames);
}

function Ring({ value }) {
  const r = 31; const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 76 76" aria-hidden="true">
      <circle className="bg" cx="38" cy="38" r={r} />
      <circle className="fg" cx="38" cy="38" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} />
    </svg>
  );
}

// Full-screen guided movement scan. Calls onDone(movement) or onSkip().
export default function Scan({ onDone, onSkip }) {
  const video = useRef(null);
  const canvas = useRef(null);
  const latest = useRef(null);
  const rec = useRef({ on: false, frames: [] });
  const live = useRef({ reps: 0, down: false });
  const [phase, setPhase] = useState('loading'); // loading | position | count | record | retry | error
  const [error, setError] = useState(null);
  const [testIdx, setTestIdx] = useState(0);
  const [count, setCount] = useState(3);
  const [progress, setProgress] = useState(0);
  const [reps, setReps] = useState(0);
  const [inView, setInView] = useState(false);
  const [retryReason, setRetryReason] = useState(null);
  const [facing, setFacing] = useState('user');
  const results = useRef({});
  const test = TESTS[testIdx];

  // Camera + model
  useEffect(() => {
    let stream; let raf; let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      } catch (e) {
        setError(e?.name === 'NotAllowedError'
          ? 'Camera access was blocked. Allow the camera for this site in your browser settings, then try again.'
          : 'We couldn’t start a camera on this device.');
        setPhase('error');
        return;
      }
      if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
      const v = video.current;
      v.srcObject = stream;
      await v.play().catch(() => {});
      let landmarker;
      try { landmarker = await loadPose(); } catch {
        setError('The body tracker couldn’t load. Check your connection and try again.');
        setPhase('error');
        return;
      }
      setPhase((p) => (p === 'loading' ? 'position' : p));
      let lastTime = -1;
      const loop = () => {
        if (stopped) return;
        if (v.readyState >= 2 && v.currentTime !== lastTime) {
          lastTime = v.currentTime;
          const now = performance.now();
          const frame = toFrame(landmarker.detectForVideo(v, now), now);
          latest.current = frame;
          if (rec.current.on && frame) rec.current.frames.push(frame);
          drawSkeleton(canvas.current, v, frame, rec.current.on ? '#1fd17a' : '#ffffff');
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    })();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [facing]);

  // Positioning: wait until the whole body is in view for ~1.2 s.
  useEffect(() => {
    if (phase !== 'position') return undefined;
    say('Prop your phone up and step back until your whole body is in the frame.');
    let since = 0;
    const id = setInterval(() => {
      const ok = fullBodyVisible(latest.current);
      setInView(ok);
      if (ok) { since += 150; if (since >= 1200) { vibrate(60); setPhase('count'); } } else since = 0;
    }, 150);
    return () => clearInterval(id);
  }, [phase]);

  // Countdown before each test
  useEffect(() => {
    if (phase !== 'count') return undefined;
    say(test.voice);
    setCount(3);
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(id); vibrate(40); setPhase('record'); } else setCount(n);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, testIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recording
  useEffect(() => {
    if (phase !== 'record') return undefined;
    rec.current = { on: true, frames: [] };
    live.current = { reps: 0, down: false };
    setReps(0); setProgress(0);
    const t0 = performance.now();
    const id = setInterval(() => {
      const el = performance.now() - t0;
      setProgress(el / test.ms);
      // Live rep counter for squats; finish early after 3 reps once standing.
      if (test.id === 'squat' && latest.current) {
        const w = latest.current.world;
        const f = 360 - angle(w[LM.lHip], w[LM.lKnee], w[LM.lAnkle]) - angle(w[LM.rHip], w[LM.rKnee], w[LM.rAnkle]);
        const avg = f / 2;
        if (!live.current.down && avg >= 60) { live.current.down = true; live.current.reps += 1; setReps(live.current.reps); vibrate(25); }
        if (live.current.down && avg < 30) { live.current.down = false; if (live.current.reps >= 3) finish(); }
      }
      if (el >= test.ms) finish();
    }, 100);
    let done = false;
    function finish() {
      if (done) return; done = true;
      clearInterval(id);
      rec.current.on = false;
      const m = measure(test, rec.current.frames);
      if (!m.ok) {
        setRetryReason(m.reason || 'We didn’t catch that.');
        say('Let’s try that one again.');
        setPhase('retry');
        return;
      }
      results.current[test.id] = m;
      next();
    }
    return () => { clearInterval(id); rec.current.on = false; };
  }, [phase, testIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    vibrate(80);
    if (testIdx + 1 < TESTS.length) { setTestIdx(testIdx + 1); setPhase('count'); return; }
    say('Done. Calculating your light.');
    const r = results.current;
    onDone({
      squat: r.squat || { ok: false },
      balanceL: r.balanceL || { ok: false },
      balanceR: r.balanceR || { ok: false },
      reach: r.reach || { ok: false },
    });
  }
  function skipTest() { results.current[test.id] = { ok: false }; next(); }

  return (
    <div className="cam" role="dialog" aria-label="Movement scan">
      <video ref={video} playsInline muted style={facing === 'environment' ? { transform: 'none' } : undefined} />
      <canvas ref={canvas} style={facing === 'environment' ? { transform: 'none' } : undefined} />
      {phase === 'count' && <div className="count" key={`${testIdx}-${count}`}>{count}</div>}

      <div className="hud">
        <div className="stack" style={{ gap: 12 }}>
          <div className="row between" style={{ flexWrap: 'nowrap' }}>
            <div className="steps" style={{ flex: 1 }}>
              {TESTS.map((t, i) => <i key={t.id} className={i < testIdx ? 'done' : i === testIdx && phase !== 'position' && phase !== 'loading' ? 'now' : ''} />)}
            </div>
            <button className="icon-btn" style={{ background: 'rgba(0,0,0,.4)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}
              onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')} aria-label="Switch camera"><Icon name="redo" /></button>
            <button className="icon-btn" style={{ background: 'rgba(0,0,0,.4)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}
              onClick={onSkip} aria-label="Close scan"><Icon name="close" /></button>
          </div>
          {phase === 'loading' && <div className="glass row"><div className="spinner" /> Starting camera and body tracker…</div>}
          {phase === 'position' && (
            <div className="glass stack" style={{ gap: 8 }}>
              <div className="instr">{inView ? 'Hold still…' : 'Get your whole body in frame'}</div>
              <p className="small" style={{ opacity: .85 }}>Lean your phone against something on the floor and step back 2–3 metres. Head to feet must be visible.</p>
            </div>
          )}
          {(phase === 'count' || phase === 'record') && (
            <div className="glass row" style={{ flexWrap: 'nowrap', justifyContent: 'space-between' }}>
              <div className="stack" style={{ gap: 6 }}>
                <div className="instr">{test.title}</div>
                <p className="small" style={{ opacity: .85 }}>{test.hint}</p>
              </div>
              {phase === 'record' && (
                <div style={{ position: 'relative' }}>
                  <Ring value={progress} />
                  {test.id === 'squat' && <div className="display" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 30 }}>{reps}</div>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="stack" style={{ gap: 10 }}>
          {phase === 'retry' && (
            <div className="glass stack" style={{ gap: 12 }}>
              <strong>{retryReason}</strong>
              <div className="row">
                <button className="btn" onClick={() => setPhase('count')}>Try again</button>
                <button className="btn ghost" onClick={skipTest}>Skip this move</button>
              </div>
            </div>
          )}
          {phase === 'error' && (
            <div className="glass stack" style={{ gap: 12 }}>
              <strong>{error}</strong>
              <button className="btn" onClick={onSkip}>Continue without the scan</button>
            </div>
          )}
          {phase !== 'error' && phase !== 'retry' && (
            <div className="row tiny" style={{ opacity: .8, justifyContent: 'center' }}><Icon name="shield" /> Video stays on your phone. Only the measurements are saved.</div>
          )}
        </div>
      </div>
    </div>
  );
}
