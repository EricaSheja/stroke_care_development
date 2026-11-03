import crypto from 'node:crypto';
import { Router } from 'express';
import { cleanText } from './util.js';

// Sign up, sign in, sessions and consent. Owner: Axel. Who may use which route is decided in access.js (Kenneth).
// Passwords are hashed with scrypt. Sessions are random tokens stored in the database with an expiry.
// Planned: rate limiting on login, audit log of sign ins.

const SESSION_DAYS = 7;
const SELF_SERVICE_ROLES = ['survivor', 'prevention']; // clinicians are created by an admin, never by sign up

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

export function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires);
  return token;
}

export function authMiddleware(db) {
  const find = db.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.consent_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > ?`
  );
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const user = token ? find.get(token, new Date().toISOString()) : null;
    if (!user) return res.status(401).json({ error: 'Please sign in.' });
    req.user = user;
    req.token = token;
    next();
  };
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, consent_at: u.consent_at });

export function authRouter(db, auth) {
  const r = Router();

  r.post('/register', (req, res) => {
    const name = cleanText(req.body?.name, 80);
    const email = cleanText(req.body?.email, 120)?.toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = req.body?.role;
    if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter your name and a valid email.' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (!SELF_SERVICE_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Choose survivor or prevention user.' });
    }
    try {
      const info = db
        .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
        .run(name, email, hashPassword(password), role);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json({ token: createSession(db, user.id), user: publicUser(user) });
    } catch (err) {
      if (String(err.code).startsWith('SQLITE_CONSTRAINT')) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      throw err;
    }
  });

  r.post('/login', (req, res) => {
    const email = cleanText(req.body?.email, 120)?.toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = email ? db.prepare('SELECT * FROM users WHERE email = ?').get(email) : null;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email or password is not correct.' });
    }
    res.json({ token: createSession(db, user.id), user: publicUser(user) });
  });

  r.post('/logout', auth, (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
    res.json({ ok: true });
  });

  r.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

  r.post('/consent', auth, (req, res) => {
    if (req.body?.accepted !== true) return res.status(400).json({ error: 'Consent must be accepted to continue.' });
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET consent_at = ? WHERE id = ? AND consent_at IS NULL').run(now, req.user.id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json({ user: publicUser(user) });
  });

  return r;
}
