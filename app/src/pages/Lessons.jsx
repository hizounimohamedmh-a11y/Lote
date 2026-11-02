import { useMemo, useState } from 'react';
import { api, useApi, Spinner, ErrorBox, Back, normalize, shuffle, speak, canSpeak, Icon, useStudyTimer } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { LEVELS, lessonById } from '../../shared/content.js';

function LessonList() {
  const { user } = useSession();
  const { data, error, loading, reload } = useApi('/lessons');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <div className="stack">
      <div>
        <h1>Grammar</h1>
        <p className="muted">Short lessons with practice. Score 70% or more to complete a lesson.</p>
      </div>
      {LEVELS.filter((l) => data.lessons.some((x) => x.level === l)).map((level) => (
        <div key={level} className="stack" style={{ gap: 10 }}>
          <div className="row"><h2 style={{ margin: 0 }}>{level}</h2>{level === user.level && <span className="pill accent">Your level</span>}</div>
          <div className="grid2">
            {data.lessons.filter((l) => l.level === level).map((l) => (
              <a key={l.id} className="card link tight row between" href={`#/lessons/${l.id}`}>
                <span><strong>{l.title}</strong><br /><span className="small muted">{l.minutes} min</span></span>
                {l.best === null ? <span className="pill">New</span>
                  : <span className={`pill ${l.best >= 0.7 ? 'ok' : 'warn'}`}>{Math.round(l.best * 100)}%</span>}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Exercise({ ex, index, onDone }) {
  const [value, setValue] = useState('');
  const [picked, setPicked] = useState([]);
  const [result, setResult] = useState(null);
  const bank = useMemo(() => shuffle(ex.words || [], index + 7), [ex, index]);

  const check = (answer) => {
    let ok = false; let correct = '';
    if (ex.type === 'mc') { ok = answer === ex.answer; correct = ex.options[ex.answer]; }
    if (ex.type === 'fill') {
      const accepted = [ex.answer, ...(ex.accept || [])].map(normalize);
      ok = accepted.includes(normalize(value)); correct = ex.answer;
    }
    if (ex.type === 'order') {
      const sentence = picked.map((i) => bank[i]).join(' ');
      ok = [ex.answer, ...(ex.alt || [])].map(normalize).includes(normalize(sentence)); correct = ex.answer;
    }
    setResult({ ok, correct, answer });
  };

  const prompt = ex.type === 'order' ? 'Put the words in the right order.' : ex.q;
  return (
    <div className="card stack">
      <div className="small muted">Exercise {index + 1}</div>
      <h3 style={{ fontSize: 20 }}>{prompt}</h3>

      {ex.type === 'mc' && (
        <div className="choice">
          {ex.options.map((o, i) => {
            const cls = result ? (i === ex.answer ? 'right' : i === result.answer ? 'wrong' : '') : '';
            return <button key={o} className={cls} disabled={Boolean(result)} onClick={() => check(i)}>{o}</button>;
          })}
        </div>
      )}

      {ex.type === 'fill' && (
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (!result && value.trim()) check(); }}>
          <input className="input" style={{ flex: 1, minWidth: 160 }} value={value} onChange={(e) => setValue(e.target.value)} disabled={Boolean(result)}
            placeholder="Type the missing word" autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          {!result && <button className="btn" disabled={!value.trim()}>Check</button>}
        </form>
      )}

      {ex.type === 'order' && (
        <>
          <div className="answer-line">
            {picked.map((i, k) => (
              <button key={k} disabled={Boolean(result)} onClick={() => setPicked(picked.filter((_, j) => j !== k))}>{bank[i]}</button>
            ))}
          </div>
          <div className="word-bank">
            {bank.map((w, i) => !picked.includes(i) && (
              <button key={i} disabled={Boolean(result)} onClick={() => setPicked([...picked, i])}>{w}</button>
            ))}
          </div>
          {!result && <button className="btn" disabled={picked.length !== bank.length} onClick={() => check()}>Check</button>}
        </>
      )}

      {result && (
        <div className={`alert ${result.ok ? 'ok' : ''}`}>
          {result.ok ? 'Richtig!' : <>Not quite. Correct answer: <strong>{result.correct}</strong></>}
        </div>
      )}
      {result && <button className="btn" onClick={() => onDone(result.ok)}>Continue</button>}
    </div>
  );
}

function LessonPlayer({ lesson }) {
  useStudyTimer('lesson');
  const [step, setStep] = useState(-1);
  const [score, setScore] = useState(0);
  const total = lesson.exercises.length;

  const next = (ok) => {
    const s = score + (ok ? 1 : 0);
    setScore(s);
    if (step + 1 >= total) api(`/lessons/${lesson.id}/result`, { method: 'POST', body: { score: s / total } }).catch(() => {});
    setStep(step + 1);
  };

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <Back to="/lessons">All lessons</Back>
      <div className="row between">
        <h1 style={{ margin: 0 }}>{lesson.title}</h1>
        <span className="pill">{lesson.level}</span>
      </div>
      {step >= 0 && step < total && (
        <div className="bar"><i style={{ width: `${(step / total) * 100}%` }} /></div>
      )}

      {step === -1 && (
        <div className="card stack">
          {lesson.explain.map((p) => <p key={p} style={{ margin: 0 }}>{p}</p>)}
          <div className="stack" style={{ gap: 8 }}>
            <strong>Examples</strong>
            {lesson.examples.map((e) => (
              <div key={e} className="row" style={{ gap: 8 }}>
                {canSpeak && <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => speak(e)} aria-label="Listen"><Icon name="volume" /></button>}
                <span>{e}</span>
              </div>
            ))}
          </div>
          <button className="btn" onClick={() => setStep(0)}>Start practice ({total} exercises)</button>
        </div>
      )}

      {step >= 0 && step < total && <Exercise key={step} ex={lesson.exercises[step]} index={step} onDone={next} />}

      {step >= total && (
        <div className="card empty">
          <h2>{score / total >= 0.7 ? 'Lesson complete!' : 'Good effort!'}</h2>
          <p>You scored {score} of {total} ({Math.round((score / total) * 100)}%).</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn ghost" onClick={() => { setScore(0); setStep(-1); }}>Try again</button>
            <a className="btn" href="#/lessons">Next lesson</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Lessons({ id }) {
  const lesson = id && lessonById(id);
  return lesson ? <LessonPlayer key={lesson.id} lesson={lesson} /> : <LessonList />;
}
