import { useState } from 'react';
import { api, Icon } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { SPORTS } from '../../shared/content.js';

export default function Onboarding() {
  const session = useSession();
  const [sport, setSport] = useState(null);
  const [error, setError] = useState(null);
  const finish = async () => {
    try { const { user } = await api('/me', { method: 'PUT', body: { sport, onboarded: true } }); session.setUser(user); window.location.hash = '/check'; } catch (e) { setError(e.message); }
  };
  return (
    <div className="flow">
      <div className="flow-body" style={{ paddingTop: 'max(28px, env(safe-area-inset-top))' }}>
        <div className="brand" style={{ padding: 0 }}><i />GreenLight</div>
        <div className="stack" style={{ gap: 8 }}>
          <h1 style={{ fontSize: 46 }}>What do you play, {session.user.name.split(' ')[0]}?</h1>
          <p className="muted">Your plan and warm-ups are built for your sport.</p>
        </div>
        <div className="options row4">
          {SPORTS.map((s) => (
            <button key={s.id} className={`opt${sport === s.id ? ' sel' : ''}`} style={{ padding: '18px 10px', fontSize: 15 }} onClick={() => setSport(s.id)}>{s.label}</button>
          ))}
        </div>
        <div className="card flat row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <span style={{ width: 22, flex: 'none', display: 'inline-flex', color: 'var(--go)' }}><Icon name="shield" /></span>
          <p className="small muted">Your camera video is processed on your phone and never uploaded. We only save the measurements, like squat depth and balance, to learn your normal.</p>
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="flow-foot">
          <button className="btn block big" disabled={!sport} onClick={finish}>Do my first check</button>
        </div>
      </div>
    </div>
  );
}
