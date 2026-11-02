import { useApi, Spinner, ErrorBox, localDay } from '../lib.jsx';
import { regionLabel } from '../../shared/content.js';
import { streakOf } from './Home.jsx';

function ScoreChart({ checks }) {
  const pts = [...checks].reverse().slice(-30);
  if (pts.length < 2) return <p className="small muted">Your score trend appears after two checks.</p>;
  const W = 600; const H = 160; const pad = { l: 30, r: 10, t: 10, b: 22 };
  const x = (i) => pad.l + (i / (pts.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const col = { green: 'var(--go)', yellow: 'var(--easy)', red: 'var(--stop)' };
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Readiness score over time">
      {[0, 50, 75, 100].map((v) => (
        <g key={v}><line className="grid" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} /><text x={pad.l - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>
      ))}
      <path className="area" d={area} />
      <path className="line" d={line} vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => <circle key={p.id} cx={x(i)} cy={y(p.score)} r="4" fill={col[p.color]} />)}
      <text x={pad.l} y={H - 4}>{pts[0].day.slice(5)}</text>
      <text x={W - pad.r} y={H - 4} textAnchor="end">{pts[pts.length - 1].day.slice(5)}</text>
    </svg>
  );
}

function Trend({ label, values, unit, better }) {
  const v = values.filter((x) => Number.isFinite(x));
  if (v.length < 2) return null;
  const last = v[0]; const avg = v.reduce((s, x) => s + x, 0) / v.length;
  const diff = last - avg;
  const good = better === 'higher' ? diff >= 0 : diff <= 0;
  return (
    <div className="card flat stack" style={{ gap: 4 }}>
      <span className="label">{label}</span>
      <span className="display nums" style={{ fontSize: 34 }}>{Math.round(last)}{unit}</span>
      <span className={`small ${Math.abs(diff) < 1 ? 'muted' : ''}`} style={{ color: Math.abs(diff) < 1 ? undefined : good ? 'var(--go)' : 'var(--stop)' }}>
        {Math.abs(diff) < 1 ? 'Same as your average' : `${diff > 0 ? '+' : ''}${Math.round(diff)}${unit} vs your average`}
      </span>
    </div>
  );
}

export default function History() {
  const { data, error, loading, reload } = useApi('/checks');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const checks = data.checks;
  const byDay = Object.fromEntries(checks.map((c) => [c.day, c]));
  const span = data.limitedTo || 56;
  const days = [];
  for (let i = span - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(localDay(d)); }
  const counts = { green: 0, yellow: 0, red: 0 };
  checks.forEach((c) => { counts[c.color]++; });
  const sore = {};
  checks.forEach((c) => Object.entries(c.soreness).forEach(([k, l]) => { if (l > 0) sore[k] = (sore[k] || 0) + 1; }));
  const topSore = Object.entries(sore).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const mv = checks.filter((c) => c.movement);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <h1 style={{ fontSize: 48 }}>History</h1>
      <div className="grid2">
        <div className="card stack" style={{ gap: 4 }}><span className="label">Streak</span><span className="display nums" style={{ fontSize: 48 }}>{streakOf(checks)} days</span><span className="small muted">{data.totalDays} checks in total</span></div>
        <div className="card stack" style={{ gap: 10 }}>
          <span className="label">Your lights</span>
          <div className="row" style={{ gap: 18 }}>
            {['green', 'yellow', 'red'].map((c) => <span key={c} className="row" style={{ gap: 8 }}><span className={`dot ${c}`} /><strong className="nums" style={{ fontSize: 22 }}>{counts[c]}</strong></span>)}
          </div>
        </div>
      </div>

      <div className="card stack" style={{ gap: 12 }}>
        <div className="row between"><span className="label">Last {span} days</span>{data.limitedTo && <a className="small" href="#/account" style={{ color: 'var(--go)' }}>See all history with Pro</a>}</div>
        <div className="cal">
          {days.map((d) => <div key={d} className={`c ${byDay[d]?.color || ''}`} title={byDay[d] ? `${d}: ${byDay[d].color} ${byDay[d].score}` : d} />)}
        </div>
      </div>

      <div className="card stack" style={{ gap: 10 }}>
        <span className="label">Readiness score</span>
        <ScoreChart checks={checks} />
      </div>

      {mv.length >= 2 && (
        <div className="stack" style={{ gap: 10 }}>
          <span className="label">Your movement today vs your average</span>
          <div className="grid2">
            <Trend label="Squat depth" unit="°" better="higher" values={mv.map((c) => (c.movement.squat?.ok ? c.movement.squat.depth : NaN))} />
            <Trend label="Left/right squat difference" unit="°" better="lower" values={mv.map((c) => (c.movement.squat?.ok ? Math.abs(c.movement.squat.asym) : NaN))} />
            <Trend label="Balance wobble, left leg" unit="" better="lower" values={mv.map((c) => (c.movement.balanceL?.ok ? c.movement.balanceL.sway : NaN))} />
            <Trend label="Balance wobble, right leg" unit="" better="lower" values={mv.map((c) => (c.movement.balanceR?.ok ? c.movement.balanceR.sway : NaN))} />
            <Trend label="Left arm reach" unit="°" better="higher" values={mv.map((c) => (c.movement.reach?.ok ? c.movement.reach.left : NaN))} />
            <Trend label="Right arm reach" unit="°" better="higher" values={mv.map((c) => (c.movement.reach?.ok ? c.movement.reach.right : NaN))} />
          </div>
        </div>
      )}

      {topSore.length > 0 && (
        <div className="card stack" style={{ gap: 10 }}>
          <span className="label">Where it hurts most often</span>
          {topSore.map(([k, n]) => (
            <div key={k} className="stack" style={{ gap: 4 }}>
              <div className="row between small"><span>{regionLabel(k)}</span><span className="muted nums">{n} day{n === 1 ? '' : 's'}</span></div>
              <div style={{ height: 8, borderRadius: 8, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{ width: `${(n / checks.length) * 100}%`, height: '100%', background: 'var(--easy)' }} />
              </div>
            </div>
          ))}
          {topSore[0][1] >= 3 && <p className="small muted">Your {regionLabel(topSore[0][0]).toLowerCase()} keeps coming back. If it doesn’t settle, it’s worth showing it to a physiotherapist.</p>}
        </div>
      )}
    </div>
  );
}
