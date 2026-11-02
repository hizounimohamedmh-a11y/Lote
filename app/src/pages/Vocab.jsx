import { useEffect, useState } from 'react';
import { api, useApi, Spinner, ErrorBox, Bar, Back, speak, canSpeak, Icon, useStudyTimer } from '../lib.jsx';
import { useSession } from '../App.jsx';

function DeckList() {
  const { user } = useSession();
  const { data, error, loading, reload } = useApi('/vocab');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const decks = [...data.decks].sort((a, b) => (b.profession === user.profession) - (a.profession === user.profession));
  const due = decks.reduce((n, d) => n + d.due, 0);
  return (
    <div className="stack">
      <div>
        <h1>Words</h1>
        <p className="muted">Short daily reviews move words into long-term memory. {due ? `${due} cards are waiting for review.` : 'No reviews due. Learn some new words.'}</p>
      </div>
      <div className="grid2">
        {decks.map((d) => (
          <a key={d.id} className="card link" href={`#/vocab/${d.id}`}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{d.title}</h3>
              <span className="row" style={{ gap: 6 }}>
                {d.profession === user.profession && <span className="pill accent">Your job</span>}
                <span className="pill">{d.level}</span>
              </span>
            </div>
            <Bar value={(d.known / d.total) * 100} ok />
            <div className="row between small muted" style={{ marginTop: 8 }}>
              <span>{d.known} known · {d.seen - d.known} learning · {d.total - d.seen} new</span>
              {d.due > 0 && <span className="pill warn">{d.due} due</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

const GRADES = [
  { g: 0, label: 'Again', hint: '< 2 min' },
  { g: 1, label: 'Hard', hint: 'soon' },
  { g: 2, label: 'Good', hint: 'later' },
  { g: 3, label: 'Easy', hint: 'much later' },
];

function Session({ id }) {
  useStudyTimer('vocab');
  const { data, error, loading, reload } = useApi(`/vocab/${id}/session`);
  const [queue, setQueue] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => { if (data) setQueue(data.cards); }, [data]);
  const card = queue?.[0];
  useEffect(() => {
    if (card && !reverse && canSpeak) speak(card.de);
  }, [card, reverse]);

  useEffect(() => {
    const onKey = (e) => {
      if (!card) return;
      if (e.key === ' ') { e.preventDefault(); setFlipped(true); }
      if (flipped && ['1', '2', '3', '4'].includes(e.key)) grade(Number(e.key) - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!queue) return <Spinner />;

  function grade(g) {
    api('/vocab/review', { method: 'POST', body: { deckId: id, index: card.index, grade: g } }).catch(() => {});
    setReviewed((n) => n + 1);
    setFlipped(false);
    // "Again" goes back into the queue a few cards later.
    setQueue((q) => {
      const rest = q.slice(1);
      if (g === 0) rest.splice(Math.min(3, rest.length), 0, { ...card, isNew: false });
      return rest;
    });
  }

  if (!card) {
    return (
      <div className="stack">
        <Back to="/vocab">All decks</Back>
        <div className="card empty">
          <h2>Fertig! 🎉</h2>
          <p>You reviewed {reviewed} card{reviewed === 1 ? '' : 's'} in {data.deck.title}.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <a className="btn" href="#/vocab">Back to decks</a>
            <button className="btn ghost" onClick={() => { setReviewed(0); reload(); }}>Learn more</button>
          </div>
        </div>
      </div>
    );
  }

  const front = reverse ? card.en : card.de;
  return (
    <div className="stack">
      <Back to="/vocab">All decks</Back>
      <div className="row between">
        <h2 style={{ margin: 0 }}>{data.deck.title}</h2>
        <div className="row">
          <span className="small muted">{queue.length} left</span>
          <div className="seg">
            <button className={!reverse ? 'on' : ''} onClick={() => setReverse(false)}>DE → EN</button>
            <button className={reverse ? 'on' : ''} onClick={() => setReverse(true)}>EN → DE</button>
          </div>
        </div>
      </div>
      <div className="card flash" onClick={() => setFlipped(true)} role="button" tabIndex={0} aria-label="Show answer">
        <div>
          {card.isNew && <span className="pill accent" style={{ marginBottom: 12 }}>New word</span>}
          <div className="de">{front}</div>
          {flipped ? (
            <>
              <div className="en">{reverse ? card.de : card.en}</div>
              <div className="ex">{card.ex}</div>
              {canSpeak && (
                <button className="btn small ghost" style={{ marginTop: 12 }} onClick={(e) => { e.stopPropagation(); speak(`${card.de}. ${card.ex}`); }}>
                  <Icon name="volume" /> Listen
                </button>
              )}
            </>
          ) : <p className="muted small" style={{ marginTop: 16 }}>Tap to show the answer</p>}
        </div>
      </div>
      {flipped ? (
        <div className="grades">
          {GRADES.map((x) => <button key={x.g} onClick={() => grade(x.g)}>{x.label}<small>{x.hint}</small></button>)}
        </div>
      ) : (
        <button className="btn block" onClick={() => setFlipped(true)}>Show answer</button>
      )}
    </div>
  );
}

export default function Vocab({ id }) {
  return id ? <Session key={id} id={id} /> : <DeckList />;
}
