import { useEffect, useRef, useState } from 'react';
import {
  api, Icon, Back, useStudyTimer, speak, stopSpeaking, canSpeak, canListen, useDictation,
} from '../lib.jsx';
import { useSession } from '../App.jsx';
import { SCENARIOS, LEVELS, PROFESSIONS, scenarioById } from '../../shared/content.js';

function ScenarioList() {
  const { user, aiEnabled } = useSession();
  const mine = (s) => (s.profession === user.profession ? 0 : s.profession ? 2 : 1);
  const sorted = [...SCENARIOS].sort((a, b) => mine(a) - mine(b)
    || Math.abs(LEVELS.indexOf(a.level) - LEVELS.indexOf(user.level)) - Math.abs(LEVELS.indexOf(b.level) - LEVELS.indexOf(user.level)));
  return (
    <div className="stack">
      <div>
        <h1>AI speaking partner</h1>
        <p className="muted">Pick a situation and talk out loud. Your partner answers at your level and corrects your mistakes.</p>
      </div>
      {!aiEnabled && <div className="alert info">The AI partner isn’t switched on yet. The owner of this site needs to add an Anthropic API key.</div>}
      {!canListen && <div className="alert info">Your browser can’t use the microphone for German. Use Chrome or Edge to speak, or type your answers.</div>}
      <div className="grid2">
        {sorted.map((s) => (
          <a key={s.id} className="card link" href={`#/speak/${s.id}`}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>{s.title}</h3>
              <span className="pill">{s.level}</span>
            </div>
            <p className="small muted" style={{ margin: 0 }}>{s.goal}</p>
            {s.profession && <span className="pill accent" style={{ marginTop: 10 }}>{PROFESSIONS.find((p) => p.id === s.profession)?.label}</span>}
          </a>
        ))}
      </div>
    </div>
  );
}

function Correction({ c }) {
  return (
    <div className="fix">
      <s>{c.original}</s> → <b>{c.corrected}</b>
      <div className="small muted" style={{ marginTop: 4 }}>{c.explanation}</div>
    </div>
  );
}

function Conversation({ scenario }) {
  useStudyTimer('speak');
  const [turns, setTurns] = useState([{ role: 'assistant', text: scenario.opener }]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showEn, setShowEn] = useState(false);
  const [done, setDone] = useState(false);
  const end = useRef(null);

  useEffect(() => { if (autoSpeak) speak(scenario.opener); return stopSpeaking; }, [scenario.opener]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [turns, busy]);

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || busy) return;
    const next = [...turns, { role: 'user', text: msg }];
    setTurns(next); setDraft(''); setBusy(true); setError(null);
    try {
      const history = next.map(({ role, text: t }) => ({ role, text: t }));
      const r = await api('/speak', { method: 'POST', body: { scenarioId: scenario.id, history } });
      setTurns((cur) => {
        const copy = [...cur];
        copy[copy.length - 1] = { ...copy[copy.length - 1], corrections: r.corrections, better: r.better_phrase };
        return [...copy, { role: 'assistant', text: r.reply, en: r.reply_en }];
      });
      if (r.goal_reached) setDone(true);
      if (autoSpeak) speak(r.reply);
    } catch (e) {
      setError(e.message);
      setTurns(turns); setDraft(msg);
    } finally { setBusy(false); }
  };

  const mic = useDictation((text) => send(text));
  const corrections = turns.reduce((n, t) => n + (t.corrections?.length || 0), 0);
  const spoken = turns.filter((t) => t.role === 'user').length;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <Back to="/speak">All situations</Back>
      <div className="row between">
        <div>
          <h2 style={{ margin: 0 }}>{scenario.title}</h2>
          <p className="small muted" style={{ margin: 0 }}>Goal: {scenario.goal}</p>
        </div>
        <div className="seg">
          <button className={autoSpeak ? 'on' : ''} onClick={() => { setAutoSpeak(!autoSpeak); stopSpeaking(); }} disabled={!canSpeak}>Voice {autoSpeak ? 'on' : 'off'}</button>
          <button className={showEn ? 'on' : ''} onClick={() => setShowEn(!showEn)}>English</button>
        </div>
      </div>

      <div className="chat" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className="stack" style={{ gap: 8 }}>
            {t.role === 'assistant' ? (
              <div className="bubble ai">
                <div className="row" style={{ gap: 8, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  <span style={{ flex: 1 }}>{t.text}</span>
                  {canSpeak && <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => speak(t.text)} aria-label="Play"><Icon name="volume" /></button>}
                </div>
                {showEn && t.en && <div className="tr">{t.en}</div>}
              </div>
            ) : (
              <>
                <div className="bubble me">{t.text}</div>
                {t.corrections?.map((c, j) => <Correction key={j} c={c} />)}
                {t.better && !t.corrections?.length && <div className="fix"><span className="small muted">More natural:</span> <b>{t.better}</b></div>}
                {t.corrections && !t.corrections.length && !t.better && <div className="tiny muted" style={{ textAlign: 'right' }}>✓ No mistakes</div>}
              </>
            )}
          </div>
        ))}
        {busy && <div className="bubble ai"><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /></div>}
        {done && (
          <div className="alert ok">
            Goal reached! You spoke {spoken} times with {corrections} correction{corrections === 1 ? '' : 's'}. Keep going or <a href="#/speak">try another situation</a>.
          </div>
        )}
        {error && <div className="alert">{error}</div>}
        <div ref={end} />
      </div>

      <div className="composer">
        <button className={`mic${mic.listening ? ' on' : ''}`} onClick={mic.listening ? mic.stop : mic.start} disabled={!canListen || busy}
          aria-label={mic.listening ? 'Stop recording' : 'Speak'} title={canListen ? 'Hold a conversation by voice' : 'Voice input needs Chrome or Edge'}>
          <Icon name={mic.listening ? 'stop' : 'speak'} />
        </button>
        <textarea className="input" rows={1} placeholder={mic.listening ? (mic.interim || 'Listening… speak German') : 'Speak or type in German'}
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft); } }} />
        <button className="btn" onClick={() => send(draft)} disabled={busy || !draft.trim()} aria-label="Send"><Icon name="send" /></button>
      </div>
    </div>
  );
}

export default function Speak({ id }) {
  const scenario = id && scenarioById(id);
  return scenario ? <Conversation key={scenario.id} scenario={scenario} /> : <ScenarioList />;
}
