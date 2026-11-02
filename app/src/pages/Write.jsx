import { useState } from 'react';
import { api, useApi, Spinner, ErrorBox, Back, Bar, useStudyTimer } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { writingById } from '../../shared/content.js';

function TaskList() {
  const { aiEnabled } = useSession();
  const { data, error, loading, reload } = useApi('/writing');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <div className="stack">
      <div>
        <h1>Writing</h1>
        <p className="muted">Exam-style writing tasks. An examiner-trained AI scores your text, explains each mistake and shows an improved version.</p>
      </div>
      {!aiEnabled && <div className="alert info">AI grading isn’t switched on yet. The owner of this site needs to add an Anthropic API key.</div>}
      <div className="grid2">
        {data.tasks.map((t) => (
          <a key={t.id} className="card link" href={`#/write/${t.id}`}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>{t.title}</h3>
              <span className="row" style={{ gap: 6 }}>
                {t.best !== null && <span className={`pill ${t.best >= 60 ? 'ok' : 'warn'}`}>{Math.round(t.best)}/100</span>}
                <span className="pill">{t.level}</span>
              </span>
            </div>
            <p className="small muted" style={{ margin: 0 }}>{t.words} words</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function Feedback({ f, onAgain }) {
  return (
    <div className="stack">
      <div className="card">
        <div className="row between">
          <div className="stat"><div className="lbl">Score</div><div className="num">{Math.round(f.score)}/100</div></div>
          <span className={`pill ${f.score >= 60 ? 'ok' : 'warn'}`}>{f.score >= 60 ? 'Pass' : 'Not yet a pass'} · your text reads like {f.estimated_level}</span>
        </div>
        <div className="grid2" style={{ marginTop: 14 }}>
          {f.criteria.map((c) => (
            <div key={c.name}>
              <div className="row between small"><strong>{c.name}</strong><span>{c.score}/5</span></div>
              <Bar value={(c.score / 5) * 100} ok={c.score >= 3} />
              <p className="small muted" style={{ marginTop: 6 }}>{c.comment}</p>
            </div>
          ))}
        </div>
      </div>
      {f.corrections.length > 0 && (
        <div className="card stack" style={{ gap: 10 }}>
          <h3>Corrections</h3>
          {f.corrections.map((c, i) => (
            <div key={i} className="fix" style={{ maxWidth: '100%', marginLeft: 0 }}>
              <s>{c.original}</s> → <b>{c.corrected}</b>
              <div className="small muted" style={{ marginTop: 4 }}>{c.explanation}</div>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <h3>Improved version</h3>
        <div className="text-block">{f.improved_version}</div>
      </div>
      <div className="alert ok"><strong>Next step:</strong> {f.next_step}</div>
      <div className="row">
        <button className="btn ghost" onClick={onAgain}>Rewrite and try again</button>
        <a className="btn" href="#/write">Other tasks</a>
      </div>
    </div>
  );
}

function Editor({ task }) {
  useStudyTimer('write');
  const draftKey = `lote-draft-${task.id}`;
  const [text, setText] = useState(() => { try { return localStorage.getItem(draftKey) || ''; } catch { return ''; } });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const update = (v) => { setText(v); try { localStorage.setItem(draftKey, v); } catch { /* ignore */ } };
  const submit = async () => {
    setBusy(true); setError(null);
    try { setFeedback(await api(`/writing/${task.id}`, { method: 'POST', body: { text } })); window.scrollTo(0, 0); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="stack" style={{ maxWidth: 780 }}>
      <Back to="/write">All tasks</Back>
      <div className="row between"><h1 style={{ margin: 0 }}>{task.title}</h1><span className="pill">{task.level}</span></div>
      <div className="card">
        <p style={{ margin: 0 }}>{task.prompt}</p>
        <p className="small muted" style={{ margin: '8px 0 0' }}>Write {task.words} words.</p>
      </div>
      {feedback ? <Feedback f={feedback} onAgain={() => setFeedback(null)} /> : (
        <>
          <textarea className="input" value={text} onChange={(e) => update(e.target.value)} placeholder="Schreiben Sie hier …" lang="de" spellCheck={false} />
          <div className="row between">
            <span className="small muted">{words} words</span>
            <button className="btn" onClick={submit} disabled={busy || words < 10}>{busy ? 'Grading… (about 20 seconds)' : 'Get feedback'}</button>
          </div>
          {error && <div className="alert">{error}</div>}
        </>
      )}
    </div>
  );
}

export default function Write({ id }) {
  const task = id && writingById(id);
  return task ? <Editor key={task.id} task={task} /> : <TaskList />;
}
