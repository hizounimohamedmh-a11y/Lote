import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { api, useRoute, Icon, Spinner, DEMO } from './lib.jsx';
import Welcome from './pages/Welcome.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Today from './pages/Today.jsx';
import Speak from './pages/Speak.jsx';
import Vocab from './pages/Vocab.jsx';
import Lessons from './pages/Lessons.jsx';
import Write from './pages/Write.jsx';
import Exams from './pages/Exams.jsx';
import Classes from './pages/Classes.jsx';
import Progress from './pages/Progress.jsx';
import Account from './pages/Account.jsx';

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

const NAV = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/speak', label: 'Speak', icon: 'speak' },
  { to: '/vocab', label: 'Words', icon: 'cards' },
  { to: '/lessons', label: 'Grammar', icon: 'book' },
  { to: '/write', label: 'Writing', icon: 'pen' },
  { to: '/exams', label: 'Exams', icon: 'exam' },
  { to: '/classes', label: 'Live classes', icon: 'video' },
  { to: '/progress', label: 'Progress', icon: 'chart' },
  { to: '/account', label: 'Account', icon: 'user' },
];
const MOBILE_NAV = ['/', '/speak', '/vocab', '/lessons', '/more'];

function page(route) {
  const [, first, ...rest] = route.split('/');
  const id = rest.join('/');
  switch (first) {
    case '': return <Today />;
    case 'speak': return <Speak id={id} />;
    case 'vocab': return <Vocab id={id} />;
    case 'lessons': return <Lessons id={id} />;
    case 'write': return <Write id={id} />;
    case 'exams': return <Exams id={id} />;
    case 'classes': return <Classes />;
    case 'progress': return <Progress />;
    case 'account': return <Account />;
    case 'more': return <More />;
    default: return <Today />;
  }
}

function More() {
  return (
    <div className="stack">
      <h1>More</h1>
      {NAV.filter((n) => !MOBILE_NAV.includes(n.to)).map((n) => (
        <a key={n.to} className="card link tight row" href={`#${n.to}`}>
          <span className="plan-icon"><Icon name={n.icon} /></span>
          <strong>{n.label}</strong>
        </a>
      ))}
    </div>
  );
}

function Paywall({ session }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const checkout = async () => {
    setBusy(true); setError(null);
    try { window.location.href = (await api('/billing/checkout', { method: 'POST' })).url; } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <div className="center">
      <div className="card stack" style={{ maxWidth: 460 }}>
        <span className="pill accent">Your free week is over</span>
        <h1>Keep your progress going</h1>
        <p className="muted">Everything you learned is saved. Subscribe to continue with daily live classes, the AI speaking partner, exam training and your study plan.</p>
        <div className="stat"><span className="num">€149</span> <span className="muted">/ month · cancel any time</span></div>
        {error && <div className="alert">{error}</div>}
        <button className="btn block" onClick={checkout} disabled={busy}>{busy ? 'Opening checkout…' : 'Subscribe'}</button>
        <button className="btn ghost block" onClick={session.logout}>Log out</button>
      </div>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const [me, setMe] = useState(undefined);
  const [paywall, setPaywall] = useState(false);

  const refresh = useCallback(() => api('/me').then((d) => { setMe(d); setPaywall(d.user ? !d.access.hasAccess : false); })
    .catch(() => setMe({ user: null })), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const on = () => setPaywall(true);
    window.addEventListener('lote:paywall', on);
    return () => window.removeEventListener('lote:paywall', on);
  }, []);

  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); window.location.hash = '/'; refresh(); };
  const session = { ...me, refresh, logout, setUser: (user) => setMe((m) => ({ ...m, user })) };

  if (me === undefined) return <Spinner />;
  if (!me.user) return <SessionContext.Provider value={session}><Welcome /></SessionContext.Provider>;
  if (!me.user.onboarded) return <SessionContext.Provider value={session}><Onboarding /></SessionContext.Provider>;

  const section = `/${route.split('/')[1] || ''}`;
  const isOn = (to) => (to === '/' ? section === '/' : section === to);

  return (
    <SessionContext.Provider value={session}>
      <div className="shell">
        <aside className="side">
          <div className="logo">Lote<span>.</span></div>
          <nav className="nav">
            {NAV.map((n) => (
              <a key={n.to} href={`#${n.to}`} className={isOn(n.to) ? 'on' : ''}><Icon name={n.icon} />{n.label}</a>
            ))}
          </nav>
          <div style={{ marginTop: 'auto' }} className="small muted">
            {me.user.name} · {me.user.level}
          </div>
        </aside>
        <main className="main">
          <div className="mobile-top">
            <div className="logo" style={{ padding: 0 }}>Lote<span>.</span></div>
            <a className="pill accent" href="#/account">{me.user.level}</a>
          </div>
          {DEMO && <div className="alert info small" style={{ marginBottom: 16 }}>Demo version: your progress is saved for you only. Live classes and payments start at launch.</div>}
          {paywall && me.access?.billingEnabled ? <Paywall session={session} /> : page(route)}
        </main>
        <nav className="bottom-nav">
          {MOBILE_NAV.map((to) => {
            const n = NAV.find((x) => x.to === to) || { to: '/more', label: 'More', icon: 'more' };
            const on = to === '/more' ? ['/write', '/exams', '/classes', '/progress', '/account', '/more'].includes(section) : isOn(to);
            return <a key={to} href={`#${to}`} className={on ? 'on' : ''}><Icon name={n.icon} />{n.label}</a>;
          })}
        </nav>
      </div>
    </SessionContext.Provider>
  );
}
