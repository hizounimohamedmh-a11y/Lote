import { useState } from 'react';
import { api, useApi, Spinner, ErrorBox } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { LEVELS } from '../../shared/content.js';

const DAY = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function localTime(berlinTime) {
  // Show the class time in the learner's own time zone as well.
  const [h, m] = berlinTime.split(':').map(Number);
  const now = new Date();
  const berlinNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const offset = now.getTime() - berlinNow.getTime();
  const d = new Date(berlinNow.getFullYear(), berlinNow.getMonth(), berlinNow.getDate(), h, m);
  return new Date(d.getTime() + offset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Classes() {
  const { user } = useSession();
  const { data, error, loading, reload } = useApi('/classes');
  const [level, setLevel] = useState(user.level);
  const [msg, setMsg] = useState(null);
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const join = async (c) => {
    setMsg(null);
    // Open the window first so mobile browsers don't block it as a popup.
    const w = window.open('', '_blank');
    try {
      const { url } = await api(`/classes/${c.id}/join`, { method: 'POST' });
      if (w) w.location.href = url; else window.location.href = url;
      reload();
    } catch (e) { w?.close(); setMsg(e.message); }
  };

  const list = data.classes.filter((c) => c.level === level);
  return (
    <div className="stack">
      <div>
        <h1>Live classes</h1>
        <p className="muted">60 minutes with a real teacher and up to 15 classmates at your level. Join the same group every day. You’ve joined {data.attendedTotal} class{data.attendedTotal === 1 ? '' : 'es'} so far.</p>
      </div>
      <div className="seg">
        {LEVELS.map((l) => <button key={l} className={l === level ? 'on' : ''} onClick={() => setLevel(l)}>{l}</button>)}
      </div>
      {msg && <div className="alert">{msg}</div>}
      <div className="grid2">
        {list.map((c) => (
          <div key={c.id} className="card stack" style={{ gap: 10 }}>
            <div className="row between">
              <h3 style={{ margin: 0 }}>{c.time} Berlin</h3>
              {c.attendedToday && <span className="pill ok">Joined today</span>}
            </div>
            <div className="small muted">
              {c.days.map((d) => DAY[d]).join(', ')} · {c.teacher} · your time {localTime(c.time)}
            </div>
            <button className="btn" onClick={() => join(c)} disabled={!c.hasLink}>{c.hasLink ? 'Join class' : 'Link coming soon'}</button>
          </div>
        ))}
      </div>
      <p className="small muted">Joining a class adds the hour to today’s plan.</p>
    </div>
  );
}
