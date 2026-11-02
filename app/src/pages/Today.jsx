import { useApi, Spinner, ErrorBox, Bar, Icon, fmtMinutes, ACTIVITY_ICON, ACTIVITY_LINK } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { ACTIVITIES } from '../../shared/content.js';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
}

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / 864e5);
}

export function Chart({ days, goal }) {
  const max = Math.max(goal, ...days.map((d) => d.minutes), 1);
  return (
    <div>
      <div className="chart" role="img" aria-label="Minutes studied per day">
        {days.map((d) => (
          <div key={d.day} className={`col${d.minutes >= goal ? ' goal' : ''}${d.minutes === 0 ? ' empty-day' : ''}`} title={`${d.day}: ${d.minutes} min`}>
            <i style={{ height: `${(d.minutes / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="row between tiny muted" style={{ marginTop: 6 }}>
        <span>{days[0]?.day.slice(5)}</span><span>today</span>
      </div>
    </div>
  );
}

export default function Today() {
  const { user, access } = useSession();
  const { data, error, loading, reload } = useApi('/dashboard');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const d = data;
  const goalPct = Math.round((d.todayMinutes / d.goalMinutes) * 100);
  const toExam = daysUntil(user.examDate);
  const trialDays = access?.billingEnabled && !access.subscribed && access.trialActive ? daysUntil(access.trialEndsAt) : null;

  return (
    <div className="stack">
      <div>
        <h1>{greeting()}, {user.name.split(' ')[0]}!</h1>
        <p className="muted">
          {d.todayMinutes >= d.goalMinutes ? 'You hit today’s goal. Ausgezeichnet!' : `${fmtMinutes(Math.max(0, d.goalMinutes - d.todayMinutes))} left to reach today’s goal.`}
          {toExam !== null && toExam >= 0 && ` · ${toExam} days until your exam.`}
        </p>
      </div>

      {trialDays !== null && (
        <div className="alert info row between">
          <span>Free week: {trialDays} day{trialDays === 1 ? '' : 's'} left.</span>
          <a className="btn small" href="#/account">Subscribe</a>
        </div>
      )}

      <div className="stats">
        <div className="card stat">
          <div className="lbl">Today</div>
          <div className="num">{fmtMinutes(d.todayMinutes)}</div>
          <Bar value={goalPct} ok={goalPct >= 100} />
        </div>
        <div className="card stat">
          <div className="lbl">Streak</div>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--accent)', width: 22, display: 'inline-flex', flex: 'none' }}><Icon name="flame" /></span>{d.streak}<span className="hide-sm">&nbsp;day{d.streak === 1 ? '' : 's'}</span>
          </div>
          <div className="lbl hide-sm">{d.totalHours} {d.totalHours === 1 ? 'hour' : 'hours'} studied in total</div>
        </div>
        <a className="card stat link" href="#/progress">
          <div className="lbl">Path to {d.progress.level}</div>
          <div className="num">{d.progress.percent}%</div>
          <Bar value={d.progress.percent} />
        </a>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="row between"><h2>Today’s plan</h2><span className="small muted">{fmtMinutes(d.goalMinutes)}</span></div>
          <div>
            {d.plan.map((p) => {
              const done = p.done >= p.minutes;
              return (
                <a key={p.type} className="plan-item" href={`#${ACTIVITY_LINK[p.type]}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  <span className={`plan-icon${done ? ' done' : ''}`}><Icon name={done ? 'check' : ACTIVITY_ICON[p.type]} /></span>
                  <div>
                    <strong>{ACTIVITIES[p.type]}</strong>
                    <div className="small muted">{p.done} of {p.minutes} min</div>
                  </div>
                  <span className="btn small soft">{done ? 'More' : p.done ? 'Continue' : 'Start'}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h3>Up next</h3>
            <div className="stack" style={{ gap: 10, marginTop: 10 }}>
              {d.classes.length > 0 && (
                <a className="row between" href="#/classes" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <span><strong>Live class {d.classes.map((c) => c.time).join(' or ')}</strong><br /><span className="small muted">{d.progress.level} · Berlin time</span></span>
                  <span className={`pill ${d.attended.length ? 'ok' : 'accent'}`}>{d.attended.length ? 'Joined' : 'Today'}</span>
                </a>
              )}
              <a className="row between" href="#/vocab" style={{ color: 'inherit', textDecoration: 'none' }}>
                <span><strong>Review words</strong><br /><span className="small muted">Spaced repetition</span></span>
                <span className={`pill ${d.dueCards ? 'accent' : 'ok'}`}>{d.dueCards ? `${d.dueCards} due` : 'All done'}</span>
              </a>
              {d.nextLesson && (
                <a className="row between" href={`#/lessons/${d.nextLesson.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  <span><strong>{d.nextLesson.title}</strong><br /><span className="small muted">Grammar · {d.nextLesson.level}</span></span>
                  <span className="pill">Lesson</span>
                </a>
              )}
            </div>
          </div>
          <div className="card">
            <div className="row between"><h3>Last 14 days</h3><span className="tiny muted">green = goal reached</span></div>
            <Chart days={d.days} goal={d.goalMinutes} />
          </div>
        </div>
      </div>
    </div>
  );
}
