import { useEffect, useRef, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
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
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    if (res.status === 402) window.dispatchEvent(new Event('lote:paywall'));
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    api(path).then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}

// ---------------------------------------------------------------------------
// Router (hash based, so it works on any static host)
// ---------------------------------------------------------------------------
export function useRoute() {
  const get = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0];
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => { setRoute(get()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
export const go = (path) => { window.location.hash = path; };

// ---------------------------------------------------------------------------
// Study timer: reports active minutes of a given activity type.
// Only counts time while the tab is visible and the learner did something
// in the last 2 minutes.
// ---------------------------------------------------------------------------
export function useStudyTimer(type, enabled = true) {
  const lastInput = useRef(Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    const mark = () => { lastInput.current = Date.now(); };
    const events = ['keydown', 'pointerdown', 'touchstart', 'scroll', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    let pending = 0;
    const tick = setInterval(() => {
      const active = document.visibilityState === 'visible' && Date.now() - lastInput.current < 120e3;
      if (active) pending += 15;
      if (pending >= 60) {
        const seconds = pending; pending = 0;
        api('/activity', { method: 'POST', body: { type, seconds } }).catch(() => {});
      }
    }, 15e3);
    return () => {
      clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, mark));
      if (pending >= 15) api('/activity', { method: 'POST', body: { type, seconds: pending } }).catch(() => {});
    };
  }, [type, enabled]);
}

// ---------------------------------------------------------------------------
// Speech (browser built-in, free)
// ---------------------------------------------------------------------------
let voices = [];
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('de'));
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text, { rate = 0.95, onEnd } = {}) {
  if (!canSpeak) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = rate;
  const preferred = voices.find((v) => /google|natural|neural|anna|helena|katja/i.test(v.name)) || voices[0];
  if (preferred) u.voice = preferred;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}
export function stopSpeaking() { if (canSpeak) window.speechSynthesis.cancel(); }

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = Boolean(Recognition);

export function useDictation(onFinal) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [blocked, setBlocked] = useState(false);
  const rec = useRef(null);
  const cb = useRef(onFinal);
  cb.current = onFinal;

  const stop = useCallback(() => { rec.current?.stop(); }, []);
  const start = useCallback(() => {
    if (!Recognition) return;
    stopSpeaking();
    const r = new Recognition();
    r.lang = 'de-DE';
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let text = ''; let final = '';
      for (const res of e.results) (res.isFinal ? (final += res[0].transcript) : (text += res[0].transcript));
      setInterim(text);
      if (final) cb.current(final.trim());
    };
    r.onend = () => { setListening(false); setInterim(''); };
    r.onerror = (e) => { setListening(false); setInterim(''); if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setBlocked(true); };
    rec.current = r;
    try { r.start(); } catch { setBlocked(true); return; }
    setListening(true);
  }, []);
  useEffect(() => () => rec.current?.abort(), []);
  return { listening, interim, start, stop, blocked };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
export const normalize = (s) => s.toLowerCase().replace(/[.,!?;:„“"'’]/g, '').replace(/\s+/g, ' ').trim();

export function shuffle(list, seed = 1) {
  const a = [...list];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmtMinutes(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60); const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function Spinner() { return <div className="center"><div className="spinner" /></div>; }

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert row between">
      <span>{error.message}</span>
      {onRetry && <button className="btn small ghost" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function Bar({ value, ok }) {
  return <div className={`bar${ok ? ' ok' : ''}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function Back({ to, children }) {
  return <a className="back" href={`#${to}`}><Icon name="back" /> {children}</a>;
}

// ---------------------------------------------------------------------------
// Icons (inline SVG, stroke style)
// ---------------------------------------------------------------------------
const PATHS = {
  home: 'M3 11l9-8 9 8M5 9.5V21h5v-6h4v6h5V9.5',
  speak: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  cards: 'M4 7h12v13H4zM8 4h12v13',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7',
  pen: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  exam: 'M9 4h6l1 2h3v15H5V6h3zM9 12l2 2 4-4',
  video: 'M3 7h12v10H3zM15 10l6-3v10l-6-3',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  back: 'M15 18l-6-6 6-6',
  play: 'M7 5l12 7-12 7z',
  stop: 'M6 6h12v12H6z',
  send: 'M4 12l16-8-6 16-2-6z',
  check: 'M5 12l5 5 9-10',
  flame: 'M12 3s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2c0-4 2-6 2-9z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  volume: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
};
export function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
export const ACTIVITY_ICON = { class: 'video', speak: 'speak', vocab: 'cards', lesson: 'book', write: 'pen', exam: 'exam' };
export const ACTIVITY_LINK = { class: '/classes', speak: '/speak', vocab: '/vocab', lesson: '/lessons', write: '/write', exam: '/exams' };
