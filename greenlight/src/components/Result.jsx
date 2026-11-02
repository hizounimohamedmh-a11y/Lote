import { useEffect, useState } from 'react';
import { api, Icon, Orb, useCountUp, go } from '../lib.jsx';
import { useSession } from '../App.jsx';

const HEX = { green: '#1fd17a', yellow: '#ffc233', red: '#ff4d4f' };
const WORD = { green: 'GREEN', yellow: 'YELLOW', red: 'RED' };
const TAG = { green: 'Ready to go.', yellow: 'Training smart today.', red: 'Recovery day.' };

// Draw a 1080×1920 story image of today's light.
async function shareImage(check, name) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1920;
  const x = c.getContext('2d');
  const col = HEX[check.color];
  x.fillStyle = '#0b0f0d'; x.fillRect(0, 0, 1080, 1920);
  const glow = x.createRadialGradient(540, 820, 60, 540, 820, 620);
  glow.addColorStop(0, `${col}88`); glow.addColorStop(1, '#0b0f0d00');
  x.fillStyle = glow; x.fillRect(0, 0, 1080, 1920);
  const orb = x.createRadialGradient(470, 720, 30, 540, 820, 330);
  orb.addColorStop(0, '#ffffff'); orb.addColorStop(0.25, col); orb.addColorStop(1, '#0b0f0d');
  x.fillStyle = orb; x.beginPath(); x.arc(540, 820, 330, 0, Math.PI * 2); x.fill();
  try { await document.fonts.load('800 100px "Barlow Condensed"'); } catch { /* fallback font */ }
  x.textAlign = 'center';
  x.fillStyle = '#06120b'; x.font = '800 260px "Barlow Condensed", Impact, sans-serif'; x.fillText(String(check.score), 540, 900);
  x.fillStyle = '#ffffff'; x.font = '800 150px "Barlow Condensed", Impact, sans-serif'; x.fillText(`I’M ${WORD[check.color]}`, 540, 1340);
  x.fillStyle = '#93a39a'; x.font = '600 52px Figtree, system-ui, sans-serif'; x.fillText(TAG[check.color], 540, 1430);
  x.fillStyle = '#ffffff'; x.font = '800 64px "Barlow Condensed", Impact, sans-serif'; x.fillText('● GREENLIGHT', 540, 1760);
  x.fillStyle = '#5f6e66'; x.font = '500 38px Figtree, system-ui, sans-serif'; x.fillText(`${name} · ${new Date(check.createdAt.replace(' ', 'T') + 'Z').toLocaleDateString()}`, 540, 1830);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

function Exercise({ ex }) {
  const [done, setDone] = useState(false);
  return (
    <div className={`ex${done ? ' done' : ''}`} role="checkbox" aria-checked={done} tabIndex={0}
      onClick={() => setDone(!done)} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setDone(!done); } }}>
      <span className="box">{done && <Icon name="check" />}</span>
      <span>
        <span className="name" style={{ fontWeight: 700 }}>{ex.name}</span> <span className="muted small nums">· {ex.dose}</span>
        <span className="small muted" style={{ display: 'block' }}>{ex.cue}</span>
      </span>
    </div>
  );
}

function CoachNote({ check }) {
  const { aiEnabled } = useSession();
  const [note, setNote] = useState(check.coachNote);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (note || check.locked || !aiEnabled) return;
    api(`/checks/${check.id}/coach`, { method: 'POST' }).then((r) => setNote(r.note)).catch((e) => setError(e.message));
  }, [check.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!aiEnabled || check.locked) return null;
  return (
    <div className="card stack" style={{ gap: 10, borderColor: 'color-mix(in srgb, var(--go) 35%, var(--line))' }}>
      <div className="row" style={{ gap: 8 }}><span style={{ width: 18, display: 'inline-flex', color: 'var(--go)' }}><Icon name="sparkle" /></span><span className="label">Coach note</span></div>
      {note ? <p style={{ fontSize: 17 }}>{note}</p> : error ? <p className="small muted">{error}</p> : <div className="row small muted"><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Your coach is reading your check…</div>}
    </div>
  );
}

export default function Result({ check, reveal = false }) {
  const { user } = useSession();
  const score = useCountUp(check.score, reveal ? 1100 : 1);
  const r = check.result;
  const plan = r.plan;
  const [shareMsg, setShareMsg] = useState(null);

  const share = async () => {
    setShareMsg(null);
    try {
      const blob = await shareImage(check, user.name.split(' ')[0]);
      const file = new File([blob], `greenlight-${check.day}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `I'm ${WORD[check.color]} today on GreenLight.` });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        setShareMsg('Image saved. Post it to your story.');
      }
    } catch (e) { if (e?.name !== 'AbortError') setShareMsg('Sharing isn’t available on this device.'); }
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="stack" style={{ justifyItems: 'center', textAlign: 'center', gap: 22, paddingTop: 8 }}>
        <Orb color={check.color} score={score} size={230} reveal={reveal} />
        <div className="stack" style={{ gap: 8, justifyItems: 'center' }}>
          <h1 style={{ fontSize: 'clamp(34px, 7vw, 52px)' }}>{plan.headline}</h1>
          <p className="muted" style={{ maxWidth: 480, fontSize: 17 }}>{plan.summary}</p>
          {r.calibrating && <span className="pill">Learning your normal · scan {Math.min(3, r.baselineN + 1)} of 3</span>}
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn soft small" onClick={share}><Icon name="share" /> Share my light</button>
          <button className="btn ghost small" onClick={() => go('/check')}><Icon name="redo" /> Check again</button>
        </div>
        {shareMsg && <span className="small muted">{shareMsg}</span>}
      </div>

      {r.seeDoctor && (
        <div className="alert"><strong>See a doctor or physiotherapist before training on this.</strong> Swelling, sharp pain, numbness, pain at rest or pain after an impact can mean an injury that needs a proper check.</div>
      )}

      <CoachNote check={check} />

      {plan.avoid?.length > 0 && (
        <div className="card stack" style={{ gap: 8 }}>
          <span className="label">Avoid today</span>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{plan.avoid.map((a) => <li key={a} style={{ marginTop: 4 }}>{a.charAt(0).toUpperCase() + a.slice(1)}</li>)}</ul>
        </div>
      )}

      {check.locked ? (
        <div className="card lock" style={{ minHeight: 220 }}>
          <div className="stack" style={{ gap: 10, filter: 'blur(5px)', opacity: .5 }} aria-hidden="true">
            <span className="label">Your plan for today</span>
            {['Targeted prep · 10 min', 'Warm-up · 8 min', 'After training · 5 min'].map((t) => <div key={t} className="ex"><span className="box" /><span>{t}</span></div>)}
          </div>
          <div className="veil">
            <div className="stack" style={{ gap: 10, justifyItems: 'center' }}>
              <span style={{ width: 26, display: 'inline-flex' }}><Icon name="lock" /></span>
              <strong>Your exact plan and the reasons behind your light are in Pro.</strong>
              <a className="btn small" href="#/account">Unlock Pro · €7.99/month</a>
            </div>
          </div>
        </div>
      ) : (
        <>
          {plan.blocks.map((b) => (
            <div key={b.title} className="card block">
              <span className="label" style={{ marginBottom: 6 }}>{b.title}</span>
              {b.items.map((ex) => <Exercise key={ex.id} ex={ex} />)}
            </div>
          ))}
          {r.factors.length > 0 && (
            <div className="card">
              <span className="label">Why you got {check.color}</span>
              <div style={{ marginTop: 6 }}>
                {r.factors.map((f, i) => (
                  <div key={i} className="factor">
                    <strong>{f.label}</strong><span className="imp nums">{f.impact}</span>
                    <span className="small muted" style={{ gridColumn: '1 / -1' }}>{f.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <p className="tiny faint" style={{ textAlign: 'center' }}>GreenLight gives training guidance, not a medical diagnosis.</p>
    </div>
  );
}
