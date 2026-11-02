import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, useRoute, Icon, Spinner } from './lib.jsx';
import Welcome from './pages/Welcome.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Home from './pages/Home.jsx';
import Check from './pages/Check.jsx';
import History from './pages/History.jsx';
import Team from './pages/Team.jsx';
import Account from './pages/Account.jsx';

const Ctx = createContext(null);
export const useSession = () => useContext(Ctx);

const NAV = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/team', label: 'Team', icon: 'team' },
  { to: '/account', label: 'You', icon: 'user' },
];

export default function App() {
  const route = useRoute();
  const [me, setMe] = useState(undefined);
  const refresh = useCallback(() => api('/me').then(setMe).catch(() => setMe({ user: null })), []);
  useEffect(() => { refresh(); }, [refresh]);
  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); window.location.hash = '/'; refresh(); };
  const session = { ...me, refresh, logout, setUser: (user) => setMe((m) => ({ ...m, user })) };

  if (me === undefined) return <Spinner />;
  if (!me.user) return <Ctx.Provider value={session}><Welcome /></Ctx.Provider>;
  if (!me.user.onboarded) return <Ctx.Provider value={session}><Onboarding /></Ctx.Provider>;

  const [, first, id] = route.split('/');
  if (first === 'check') return <Ctx.Provider value={session}><Check /></Ctx.Provider>;
  const section = `/${first || ''}`;
  const page = first === 'history' ? <History /> : first === 'team' ? <Team id={id} /> : first === 'account' ? <Account /> : <Home />;

  return (
    <Ctx.Provider value={session}>
      <div className="shell">
        <aside className="side">
          <div className="brand"><i />GreenLight</div>
          <nav className="nav">
            {NAV.map((n) => <a key={n.to} href={`#${n.to}`} className={section === n.to ? 'on' : ''}><Icon name={n.icon} />{n.label}</a>)}
          </nav>
          <a className="btn" href="#/check" style={{ marginTop: 16 }}><Icon name="bolt" /> Daily check</a>
          <div className="small faint" style={{ marginTop: 'auto', padding: '0 8px' }}>{me.user.name}</div>
        </aside>
        <main className="main">
          <div className="mtop">
            <div className="brand"><i />GreenLight</div>
            <a className="btn small" href="#/check"><Icon name="bolt" /> Check</a>
          </div>
          {page}
        </main>
        <nav className="tabbar">
          {NAV.map((n) => <a key={n.to} href={`#${n.to}`} className={section === n.to ? 'on' : ''}><Icon name={n.icon} />{n.label}</a>)}
        </nav>
      </div>
    </Ctx.Provider>
  );
}
