import { useApi, Spinner, ErrorBox, Bar } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { ACTIVITIES, EXAMS, WRITING_TASKS } from '../../shared/content.js';
import { Chart } from './Today.jsx';

export default function Progress() {
  const { user } = useSession();
  const { data, error, loading, reload } = useApi('/progress');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const p = data.progress;
  const totalH = data.byType.reduce((s, x) => s + x.hours, 0);
  const avg = Math.round(data.days.reduce((s, d) => s + d.minutes, 0) / data.days.length);

  return (
    <div className="stack">
      <h1>Progress</h1>
      <div className="card stack">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Path to {p.level}</h2>
          <span className="stat"><span className="num">{p.percent}%</span></span>
        </div>
        <Bar value={p.percent} />
        <div className="grid3">
          <div><div className="small muted">Study hours at this level</div><strong>{p.hours} of {p.hoursNeeded} h</strong></div>
          <div><div className="small muted">Grammar lessons passed</div><strong>{p.lessonPct}%</strong></div>
          <div><div className="small muted">Best mock exam</div><strong>{p.examPct}%</strong></div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          The estimate combines study hours (50%), grammar lessons (30%) and mock exams (20%). When it reaches 100%, take a mock exam and move up a level in Account.
        </p>
      </div>

      <div className="card">
        <div className="row between"><h3>Last 28 days</h3><span className="small muted">Average {avg} min/day · goal {user.goalMinutes}</span></div>
        <Chart days={data.days} goal={user.goalMinutes} />
      </div>

      <div className="grid2">
        <div className="card stack" style={{ gap: 10 }}>
          <h3>Time by activity</h3>
          {data.byType.length === 0 && <p className="muted small">No study time yet.</p>}
          {data.byType.sort((a, b) => b.hours - a.hours).map((x) => (
            <div key={x.type}>
              <div className="row between small"><span>{ACTIVITIES[x.type] || x.type}</span><strong>{x.hours} h</strong></div>
              <Bar value={totalH ? (x.hours / totalH) * 100 : 0} />
            </div>
          ))}
        </div>
        <div className="card stack" style={{ gap: 10 }}>
          <h3>Recent results</h3>
          {data.exams.length + data.writing.length === 0 && <p className="muted small">Take a mock exam or a writing task to see results here.</p>}
          {data.exams.map((e, i) => (
            <div key={`e${i}`} className="row between small">
              <span>{EXAMS.find((x) => x.id === e.exam_id)?.title || e.exam_id}<br /><span className="muted tiny">{e.taken_at.slice(0, 10)}</span></span>
              <span className={`pill ${e.score >= 0.6 ? 'ok' : 'warn'}`}>{Math.round(e.score * 100)}%</span>
            </div>
          ))}
          {data.writing.map((w, i) => (
            <div key={`w${i}`} className="row between small">
              <span>Writing: {WRITING_TASKS.find((x) => x.id === w.task_id)?.title || w.task_id}<br /><span className="muted tiny">{w.created_at.slice(0, 10)}</span></span>
              <span className={`pill ${w.score >= 60 ? 'ok' : 'warn'}`}>{Math.round(w.score)}/100</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
