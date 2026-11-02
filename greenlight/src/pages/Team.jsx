import { useState } from 'react';
import { api, useApi, Spinner, ErrorBox, Icon, localDay, go, DEMO } from '../lib.jsx';
import { useSession } from '../App.jsx';
import { SPORTS, regionLabel } from '../../shared/content.js';

const ORDER = { red: 0, yellow: 1, green: 2 };

function Roster({ id }) {
  const { data, error, loading, reload } = useApi(`/teams/${id}?day=${localDay()}`);
  const [copied, setCopied] = useState(false);
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const { team, role, roster = [], locked } = data;

  const leave = async () => {
    if (role === 'coach' && !window.confirm?.('Delete this team for everyone?')) return;
    await api(`/teams/${id}/members/me`, { method: 'DELETE' }).catch(() => {});
    go('/team');
  };

  if (role !== 'coach') {
    return (
      <div className="stack">
        <a className="small muted" href="#/team">← Teams</a>
        <h1 style={{ fontSize: 46 }}>{team.name}</h1>
        <div className="card stack" style={{ gap: 10 }}>
          <p>Your coach sees your daily light, score and sore spots. Not your video, not your answers.</p>
          <div><button className="btn ghost small" onClick={leave}>Leave team</button></div>
        </div>
      </div>
    );
  }

  const invite = `${window.location.origin}/#/team/join/${team.code}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(invite); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };
  const sorted = [...roster].sort((a, b) => (ORDER[a.color] ?? 3) - (ORDER[b.color] ?? 3));
  const counts = { green: 0, yellow: 0, red: 0, none: 0 };
  roster.forEach((p) => { counts[p.color || 'none']++; });

  return (
    <div className="stack" style={{ gap: 18 }}>
      <a className="small muted" href="#/team">← Teams</a>
      <div className="row between">
        <h1 style={{ fontSize: 46 }}>{team.name}</h1>
        <span className="pill">{SPORTS.find((s) => s.id === team.sport)?.label}</span>
      </div>

      {locked ? (
        <div className="card stack" style={{ gap: 10 }}>
          <strong>The coach dashboard is part of the Team plan.</strong>
          <p className="muted small">See every player’s light before training, who to hold back and who needs a physio.</p>
          <div><a className="btn small" href="#/account">Get Team · €29/month</a></div>
        </div>
      ) : (
        <>
          <div className="card row" style={{ justifyContent: 'space-around' }}>
            {[['green', 'Ready'], ['yellow', 'Go easy'], ['red', 'Rest'], ['none', 'Not checked']].map(([c, l]) => (
              <div key={c} className="stack" style={{ gap: 4, justifyItems: 'center' }}>
                <span className={`dot ${c === 'none' ? '' : c}`} style={{ width: 18, height: 18 }} />
                <span className="display nums" style={{ fontSize: 34 }}>{counts[c]}</span>
                <span className="tiny muted">{l}</span>
              </div>
            ))}
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="label">Today · worst first</span>
            {sorted.length === 0 && <div className="card muted">No players yet. Share the invite code below.</div>}
            <div className="roster">
              {sorted.map((p) => (
                <div key={p.id} className="player">
                  <span className={`dot ${p.color || ''}`} style={{ width: 16, height: 16 }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="nm">{p.name}</div>
                    <div className="small muted">
                      {p.color ? (p.sore.length ? p.sore.map((s) => regionLabel(s.region)).join(', ') : 'Nothing sore') : 'Hasn’t checked in today'}
                      {p.seeDoctor && <strong style={{ color: 'var(--stop)' }}> · needs a physio check</strong>}
                    </div>
                  </div>
                  <span className="display nums" style={{ fontSize: 26 }}>{p.score ?? '–'}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="card stack" style={{ gap: 10 }}>
        <span className="label">Invite players</span>
        <div className="code">{team.code}</div>
        <p className="small muted">Players enter this code in GreenLight under Team, or open your invite link.</p>
        <div className="row">
          <button className="btn soft small" onClick={copy}><Icon name="copy" /> {copied ? 'Link copied' : 'Copy invite link'}</button>
          <span className="small faint" style={{ userSelect: 'all', wordBreak: 'break-all' }}>{invite}</span>
        </div>
      </div>
      <div><button className="btn ghost small" onClick={leave}>Delete team</button></div>
    </div>
  );
}

function TeamList({ joinCode }) {
  const { user } = useSession();
  const { data, error, loading, reload } = useApi('/teams');
  const [code, setCode] = useState(joinCode || '');
  const [name, setName] = useState('');
  const [sport, setSport] = useState(user.sport);
  const [msg, setMsg] = useState(null);
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const join = async (e) => {
    e.preventDefault(); setMsg(null);
    try { const { team } = await api('/teams/join', { method: 'POST', body: { code } }); go(`/team/${team.id}`); } catch (err) { setMsg(err.message); }
  };
  const create = async (e) => {
    e.preventDefault(); setMsg(null);
    try { const { team } = await api('/teams', { method: 'POST', body: { name, sport } }); go(`/team/${team.id}`); } catch (err) { setMsg(err.message); }
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <h1 style={{ fontSize: 48 }}>Team</h1>
      {data.teams.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          {data.teams.map((t) => (
            <a key={t.id} className="player" href={`#/team/${t.id}`} style={{ textDecoration: 'none' }}>
              <span className="dot green" />
              <div><div className="nm">{t.name}</div><div className="small muted">{t.role === 'coach' ? `You coach · ${t.players} player${t.players === 1 ? '' : 's'}` : 'You play'}</div></div>
              <span className="muted">→</span>
            </a>
          ))}
        </div>
      )}
      {msg && <div className="alert">{msg}</div>}
      <div className="grid2">
        <form className="card stack" onSubmit={join} style={{ gap: 12 }}>
          <h3>Join your team</h3>
          <p className="small muted">Your coach will see your daily light and sore spots. Never your video.</p>
          <input id="code" className="input display" style={{ fontSize: 26, letterSpacing: '.14em', textTransform: 'uppercase' }} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" maxLength={6} aria-label="Team code" />
          <button className="btn" disabled={code.length !== 6}>Join</button>
        </form>
        <form className="card stack" onSubmit={create} style={{ gap: 12 }}>
          <h3>I’m a coach</h3>
          <p className="small muted">Create a team and see your whole squad’s lights before every session.</p>
          <input id="team-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name, e.g. FC Atlas U19" />
          <select id="team-sport" className="input" value={sport} onChange={(e) => setSport(e.target.value)} aria-label="Sport">
            {SPORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button className="btn" disabled={!name.trim()}>Create team</button>
        </form>
      </div>
    </div>
  );
}

export default function Team({ id }) {
  if (DEMO) {
    return (
      <div className="stack" style={{ gap: 18 }}>
        <h1 style={{ fontSize: 48 }}>Team</h1>
        <div className="card stack" style={{ gap: 10 }}>
          <span className="label">For coaches</span>
          <h3>Your whole squad’s lights before training</h3>
          <p className="muted">Coaches create a team and share a 6-letter code. Every player’s light, score and sore spots show up on one screen, worst first, with a warning for anyone who should see a physio.</p>
          <p className="small muted">Team dashboards need the full GreenLight app, because players’ checks are shared with the coach.</p>
        </div>
      </div>
    );
  }
  const join = window.location.hash.match(/#\/team\/join\/([A-Z0-9]{6})/i)?.[1];
  if (join) return <TeamList joinCode={join.toUpperCase()} />;
  return id ? <Roster key={id} id={id} /> : <TeamList />;
}
