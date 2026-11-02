import crypto from 'node:crypto';
import { db } from './db.js';

const SESSION_DAYS = 30;
export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 7);
export const COOKIE = 'lote_session';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const hash = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, 'hex'));
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires);
  return { token, expires };
}

export function destroySession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function cookieOptions(expires) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expires),
    path: '/',
  };
}

export function registerUser({ email, name, password }) {
  const trialEnds = new Date(Date.now() + TRIAL_DAYS * 864e5).toISOString();
  const isFirst = db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0;
  const info = db.prepare(
    'INSERT INTO users (email, name, password_hash, trial_ends_at, is_admin) VALUES (?, ?, ?, ?, ?)',
  ).run(email, name, hashPassword(password), trialEnds, isFirst ? 1 : 0);
  return Number(info.lastInsertRowid);
}

// Attaches req.user when a valid session cookie is present.
export function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    const row = db.prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    ).get(token, new Date().toISOString());
    if (row) req.user = row;
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'Admins only.' });
  next();
}
