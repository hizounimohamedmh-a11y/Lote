import { useMemo } from 'react';
import { useApi, Spinner, ErrorBox, Orb, Icon, localDay } from '../lib.jsx';
import { useSession } from '../App.jsx';
import Result from '../components/Result.jsx';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
}

export function streakOf(checks) {
  const days = new Set(checks.map((c) => c.day));
  const d = new Date();
  if (!days.has(localDay(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(localDay(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function Week({ checks }) {
  const byDay = Object.fromEntries(checks.map((c) => [c.day, c]));
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
  return (
    <div className="week">
      {days.map((d, i) => {
        const c = byDay[localDay(d)];
        return (
          <div key={i} className={`d${i === 6 ? ' today' : ''}`}>
            <span className={`dot ${c?.color || ''}`} title={c ? `${c.color} ${c.score}` : 'No check'} />
            {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { user } = useSession();
  const day = localDay();
  const today = useApi(`/checks/today?day=${day}`);
  const hist = useApi('/checks');
  const reveal = useMemo(() => {
    try { const id = sessionStorage.getItem('gl-reveal'); sessionStorage.removeItem('gl-reveal'); return id; } catch { return null; }
  }, []);

  if ((today.loading && !today.data) || (hist.loading && !hist.data)) return <Spinner />;
  if (today.error) return <ErrorBox error={today.error} onRetry={today.reload} />;
  const check = today.data.check;
  const checks = hist.data?.checks || [];
  const streak = streakOf(checks);

  return (
    <div className="stack" style={{ gap: 20 }}>
      {check ? (
        <Result check={check} reveal={String(check.id) === reveal} />
      ) : (
        <div className="stack" style={{ justifyItems: 'center', textAlign: 'center', gap: 26, paddingTop: 12 }}>
          <span className="label">{greeting()}, {user.name.split(' ')[0]}</span>
          <a href="#/check" aria-label="Start today’s check" style={{ textDecoration: 'none' }}>
            <Orb color={null} size={230}>
              <div className="display" style={{ fontSize: 34, lineHeight: 1 }}>TAP TO<br />CHECK</div>
              <div className="small muted" style={{ marginTop: 6 }}>30 seconds</div>
            </Orb>
          </a>
          <div className="stack" style={{ gap: 8, justifyItems: 'center' }}>
            <h1 style={{ fontSize: 'clamp(36px, 8vw, 56px)' }}>Should you train today?</h1>
            <p className="muted" style={{ maxWidth: 420 }}>Three questions, a tap on anything sore and a 30-second movement scan. You get green, yellow or red, and exactly what to do.</p>
          </div>
          <a className="btn big" href="#/check" style={{ minWidth: 260 }}><Icon name="bolt" /> Start today’s check</a>
        </div>
      )}

      <div className="card stack" style={{ gap: 14 }}>
        <div className="row between">
          <span className="label">This week</span>
          <span className="small"><strong className="nums">{streak}</strong> <span className="muted">day streak</span></span>
        </div>
        <Week checks={checks} />
      </div>
    </div>
  );
}
