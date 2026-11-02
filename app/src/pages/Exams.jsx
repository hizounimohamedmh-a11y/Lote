import { useEffect, useState } from 'react';
import { api, useApi, Spinner, ErrorBox, Back, Icon, speak, stopSpeaking, canSpeak, useStudyTimer } from '../lib.jsx';
import { examById } from '../../shared/content.js';

function ExamList() {
  const { data, error, loading, reload } = useApi('/exams');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <div className="stack">
      <div>
        <h1>Mock exams</h1>
        <p className="muted">Practice under exam conditions with a timer. Reading and listening in the Goethe/telc style. 60% is a pass.</p>
      </div>
      <div className="grid2">
        {data.exams.map((e) => (
          <a key={e.id} className="card link" href={`#/exams/${e.id}`}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>{e.title}</h3>
              <span className="pill">{e.level}</span>
            </div>
            <div className="row between small muted">
              <span>{e.minutes} min · {e.attempts} attempt{e.attempts === 1 ? '' : 's'}</span>
              {e.best !== null && <span className={`pill ${e.best >= 0.6 ? 'ok' : 'warn'}`}>Best {Math.round(e.best * 100)}%</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function Listening({ text }) {
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => stopSpeaking, []);
  if (!canSpeak) return <div className="text-block">{text}</div>;
  const play = () => { setPlaying(true); setPlays((p) => p + 1); speak(text, { rate: 0.9, onEnd: () => setPlaying(false) }); };
  return (
    <div className="row">
      <button className="btn soft" onClick={playing ? () => { stopSpeaking(); setPlaying(false); } : play} disabled={!playing && plays >= 2}>
        <Icon name={playing ? 'stop' : 'play'} /> {playing ? 'Stop' : plays ? 'Play again' : 'Play audio'}
      </button>
      <span className="small muted">You can listen twice, like in the real exam.</span>
    </div>
  );
}

function ExamPlayer({ exam }) {
  useStudyTimer('exam');
  const [answers, setAnswers] = useState(exam.sections.map((s) => s.questions.map(() => null)));
  const [left, setLeft] = useState(exam.minutes * 60);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started || result) return undefined;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [started, result]);

  const submit = async () => {
    stopSpeaking();
    try { setResult(await api(`/exams/${exam.id}/result`, { method: 'POST', body: { answers } })); window.scrollTo(0, 0); } catch (e) { setError(e.message); }
  };
  useEffect(() => { if (started && left <= 0 && !result) submit(); }); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (si, qi, oi) => setAnswers((a) => a.map((s, i) => (i === si ? s.map((x, j) => (j === qi ? oi : x)) : s)));
  const answered = answers.flat().filter((x) => x !== null).length;
  const total = answers.flat().length;
  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, '0');
  const ss = String(Math.max(0, left % 60)).padStart(2, '0');

  if (!started) {
    return (
      <div className="stack" style={{ maxWidth: 720 }}>
        <Back to="/exams">All exams</Back>
        <div className="card stack">
          <h1>{exam.title}</h1>
          <p className="muted" style={{ margin: 0 }}>{exam.sections.length} parts · {total} questions · {exam.minutes} minutes.</p>
          <p style={{ margin: 0 }}>Find a quiet place and use headphones for the listening part. The exam is submitted automatically when time runs out.</p>
          <button className="btn" onClick={() => setStarted(true)}>Start exam</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 780 }}>
      <div className="row between" style={{ position: 'sticky', top: 0, background: 'var(--bg)', padding: '8px 0', zIndex: 2 }}>
        <h2 style={{ margin: 0 }}>{exam.title}</h2>
        {!result && <span className={`pill ${left < 120 ? 'warn' : ''}`}><Icon name="clock" /> {mm}:{ss}</span>}
      </div>

      {result && (
        <div className={`alert ${result.score >= 0.6 ? 'ok' : 'info'}`}>
          <strong>{Math.round(result.score * 100)}%</strong> — {result.correct} of {result.total} correct. {result.score >= 0.6 ? 'That’s a pass. Sehr gut!' : 'Not a pass yet. Review the answers below and try again.'}
        </div>
      )}

      {exam.sections.map((s, si) => (
        <div key={si} className="card stack">
          <div className="row between"><h3 style={{ margin: 0 }}>Part {si + 1}: {s.title}</h3><span className="pill">{s.kind}</span></div>
          {s.kind === 'reading' || result ? <div className="text-block">{s.text}</div> : <Listening text={s.text} />}
          {s.questions.map((q, qi) => (
            <div key={qi} className="stack" style={{ gap: 8 }}>
              <strong>{qi + 1}. {q.q}</strong>
              <div className="choice">
                {q.options.map((o, oi) => {
                  const chosen = answers[si][qi] === oi;
                  const cls = result ? (oi === q.answer ? 'right' : chosen ? 'wrong' : '') : chosen ? 'sel' : '';
                  return <button key={oi} className={cls} disabled={Boolean(result)} onClick={() => pick(si, qi, oi)}>{o}</button>;
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {error && <div className="alert">{error}</div>}
      {result ? (
        <div className="row"><a className="btn" href="#/exams">Back to exams</a></div>
      ) : (
        <div className="row between">
          <span className="small muted">{answered} of {total} answered</span>
          <button className="btn" onClick={submit}>Submit exam</button>
        </div>
      )}
    </div>
  );
}

export default function Exams({ id }) {
  const exam = id && examById(id);
  return exam ? <ExamPlayer key={exam.id} exam={exam} /> : <ExamList />;
}
