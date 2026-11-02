import { useCallback, useEffect, useState } from 'react';

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export const DEMO = Boolean(import.meta.env.VITE_DEMO);

export async function api(path, { method = 'GET', body } = {}) {
  if (DEMO) {
    const { demoApi } = await import('./demo/backend.js');
    return demoApi(path, { method, body: body && JSON.parse(JSON.stringify(body)) });
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  return data;
}

export function useApi(path) {
  const [s, set] = useState({ data: null, error: null, loading: true });
  const load = useCallback(() => {
    set((x) => ({ ...x, loading: true }));
    api(path).then((data) => set({ data, error: null, loading: false })).catch((error) => set({ data: null, error, loading: false }));
  }, [path]);
  useEffect(load, [load]);
  return { ...s, reload: load };
}

export function useRoute() {
  const get = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0];
  const [r, set] = useState(get);
  useEffect(() => {
    const on = () => { set(get()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}
export const go = (p) => { window.location.hash = p; };

// The user's own calendar day.
export function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function say(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 1.02;
    window.speechSynthesis.speak(u);
  } catch { /* voice is optional */ }
}

export function vibrate(ms = 30) { try { navigator.vibrate?.(ms); } catch { /* optional */ } }

export function Spinner() { return <div className="center"><div className="spinner" /></div>; }

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert row between">
      <span>{error.message}</span>
      {onRetry && <button className="btn small ghost" onClick={onRetry}>Try again</button>}
    </div>
  );
}

const P = {
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  history: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4M12 8v4l3 2',
  team: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3.5 6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M15 18l-6-6 6-6',
  check: 'M5 12.5l4.5 4.5L19 7',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  share: 'M12 3v12M7 8l5-5 5 5M5 14v6h14v-6',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  redo: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
};
export function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

export function Orb({ color, score, size = 220, reveal = false, children }) {
  return (
    <div className={`orb ${color || 'none'}${reveal ? ' reveal' : ''}`} style={{ '--s': `${size}px` }}>
      <div>
        {children ?? (
          <>
            <div className="score nums">{score}</div>
            <div className="word">{color === 'green' ? 'Go' : color === 'yellow' ? 'Easy' : 'Rest'}</div>
          </>
        )}
      </div>
    </div>
  );
}

// Animate a number from 0 to target.
export function useCountUp(target, ms = 900) {
  const [v, set] = useState(0);
  useEffect(() => {
    if (target == null) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { set(target); return undefined; }
    let raf; const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      set(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
