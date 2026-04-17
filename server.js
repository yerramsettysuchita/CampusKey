'use strict';

require('dotenv').config();

// Polyfill Web Crypto for Node 18 (required by @simplewebauthn/server v13)
if (!globalThis.crypto) {
  globalThis.crypto = require('crypto').webcrypto;
}

/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║          CAMPUSKEY  —  Passwordless Auth API  (v2.0.0)           ║
 * ║          WebAuthn Passkeys + JWT sessions + /auth/me             ║
 * ║          theme: #0a0e1a  ·  port: $PORT (default 3001)          ║
 * ╚════════════════════════════════════════════════════════════════════╝
 *
 * Routes
 *   POST /auth/register/start   → issue WebAuthn registration options
 *   POST /auth/register/finish  → verify passkey, persist, return JWT
 *   POST /auth/login/start      → issue WebAuthn authentication options
 *   POST /auth/login/finish     → verify passkey, return JWT
 *   GET  /auth/me               → validate JWT, return { user }
 */

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const bodyParser = require('body-parser');
const { Pool }   = require('pg');
const path       = require('path');
const jwt        = require('jsonwebtoken');
const os         = require('os');

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const PORT       = process.env.PORT        || 3001;
const RP_ID      = process.env.RP_ID       || 'localhost';
const RP_NAME    = process.env.RP_NAME     || 'Campus Passkey';
const ORIGIN     = process.env.ORIGIN      || 'http://localhost:3000';
const ADMIN_CODE = process.env.ADMIN_CODE  || 'ADMIN123';
const JWT_SECRET = process.env.JWT_SECRET  || 'campuskey-dev-secret-CHANGE-IN-PROD';
const JWT_TTL    = process.env.JWT_TTL     || '24h';

const STUDENT_PASSKEY = process.env.STUDENT_PASSKEY || 'Ruas@123';
const FACULTY_PASSKEY = process.env.FACULTY_PASSKEY || 'RuasF@123';

if (process.env.NODE_ENV === 'production' && JWT_SECRET.includes('CHANGE-IN-PROD')) {
  console.warn('[WARN] JWT_SECRET is still the default dev value. Set JWT_SECRET env var in production.');
}

// ── LAN IP detection ───────────────────────────────────────────────────────
function getLanIPs() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal)
    .map(i => i.address);
}

const CONFIGURED_ORIGINS = ORIGIN.split(',').map(s => s.trim());
const PRIVATE_NET = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (CONFIGURED_ORIGINS.includes(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+(\.vercel\.app)$/.test(origin)) return true;
  if (process.env.NODE_ENV !== 'production' && PRIVATE_NET.test(origin)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHALLENGE STORE  (in-memory, 5-min TTL, one-time use)
// ─────────────────────────────────────────────────────────────────────────────
const challengeStore = new Map();

function storeChallenge(key, challenge) {
  challengeStore.set(key, { challenge, expires: Date.now() + 5 * 60 * 1000 });
}

function consumeChallenge(key) {
  const entry = challengeStore.get(key);
  challengeStore.delete(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.challenge;
}

// ── Origin / rpID helper (defensive) ─────────────────────────────────────────
// Some mobile browsers / proxies send Origin: null — fall back to ORIGIN env var.
function resolveOrigin(req) {
  const raw = req.headers.origin;
  if (raw && raw !== 'null') {
    try { return { origin: raw, rpId: new URL(raw).hostname }; } catch {}
  }
  const fallback = (ORIGIN.split(',')[0] || '').trim();
  try { return { origin: fallback, rpId: new URL(fallback).hostname }; } catch {}
  return { origin: `https://${RP_ID}`, rpId: RP_ID };
}

// ── QR session store ───────────────────────────────────────────────────────
const qrSessions = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of qrSessions) {
    if (now > s.expires) qrSessions.delete(id);
  }
}, 60_000);

// ─────────────────────────────────────────────────────────────────────────────
//  POSTGRESQL
// ─────────────────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    email       TEXT PRIMARY KEY,
    name        TEXT,
    role        TEXT NOT NULL DEFAULT 'student',
    roll_number TEXT,
    department  TEXT,
    branch      TEXT
  );
  CREATE TABLE IF NOT EXISTS credentials (
    id            SERIAL PRIMARY KEY,
    user_email    TEXT    NOT NULL,
    credential_id TEXT    NOT NULL UNIQUE,
    public_key    BYTEA   NOT NULL,
    counter       INTEGER NOT NULL DEFAULT 0,
    transports    TEXT    DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id         SERIAL PRIMARY KEY,
    email      TEXT,
    action     TEXT        NOT NULL,
    ip         TEXT,
    user_agent TEXT,
    risk_score INTEGER     DEFAULT 0,
    risk_level TEXT        DEFAULT 'low',
    status     TEXT        DEFAULT 'success',
    meta       TEXT        DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`).catch(err => console.error('[DB init error]', err.message));

const dbGet = (sql, p = []) => pool.query(sql, p).then(r => r.rows[0]);
const dbAll = (sql, p = []) => pool.query(sql, p).then(r => r.rows);
const dbRun = (sql, p = []) => pool.query(sql, p);

// ─────────────────────────────────────────────────────────────────────────────
//  AUDIT LOGGER  (fire-and-forget — never throws, never blocks auth)
// ─────────────────────────────────────────────────────────────────────────────
async function logAudit(email, action, req, { status = 'success', meta = {} } = {}) {
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.socket?.remoteAddress || 'unknown';
    const ua = (req.headers['user-agent'] || 'unknown').slice(0, 220);

    let riskScore = 0;
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) riskScore += 30;          // Late-night login
    if (status === 'failure')  riskScore += 40;           // Failed attempt

    if (email && action.includes('login')) {
      try {
        const r = await pool.query(
          `SELECT COUNT(*)::int AS cnt FROM audit_logs
           WHERE email=$1 AND status='failure' AND created_at > NOW()-INTERVAL '1 hour'`,
          [email]
        );
        riskScore += (r.rows[0]?.cnt || 0) * 15;
      } catch { /* ignore */ }
    }

    riskScore = Math.min(riskScore, 100);
    const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

    await pool.query(
      `INSERT INTO audit_logs (email, action, ip, user_agent, risk_score, risk_level, status, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [email || null, action, ip, ua, riskScore, riskLevel, status, JSON.stringify(meta)]
    );
  } catch (e) {
    console.error('[logAudit]', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  JWT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function signToken(email) {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_TTL });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== ADMIN_CODE) {
    return res.status(403).json({ error: 'Invalid admin key' });
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXPRESS APP
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => cb(isAllowedOrigin(origin) ? null : new Error('CORS not allowed'), isAllowedOrigin(origin)),
  credentials: true,
}));
app.use(bodyParser.json());

app.get('/', (_req, res) => {
  res.json({
    service : 'CampusKey Auth API',
    version : '2.0.0',
    status  : 'online',
    routes  : [
      'POST /auth/register/start',
      'POST /auth/register/finish',
      'POST /auth/login/start',
      'POST /auth/login/finish',
      'GET  /auth/me  (Bearer)',
    ],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /auth/me
// ─────────────────────────────────────────────────────────────────────────────
app.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const row = await dbGet(
      `SELECT email, name, role, roll_number, department, branch FROM users WHERE email = $1`,
      [req.user.email]
    );
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: row });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  QR SESSION
// ─────────────────────────────────────────────────────────────────────────────
app.post('/auth/qr-session/create', (_req, res) => {
  const { randomBytes } = require('crypto');
  const sessionId = randomBytes(18).toString('hex');
  qrSessions.set(sessionId, { status: 'pending', expires: Date.now() + 10 * 60 * 1000 });
  res.json({ sessionId });
});

app.get('/auth/qr-session/status/:id', (req, res) => {
  const session = qrSessions.get(req.params.id);
  if (!session) return res.json({ status: 'expired' });
  if (Date.now() > session.expires) {
    qrSessions.delete(req.params.id);
    return res.json({ status: 'expired' });
  }
  res.json({ status: session.status, token: session.token || null, user: session.user || null });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/register/start
// ─────────────────────────────────────────────────────────────────────────────
app.post('/auth/register/start', async (req, res) => {
  try {
    const { email, bootstrap_code, name, role, roll_number, department, branch } = req.body;
    if (!email || !bootstrap_code) {
      return res.status(400).json({ error: 'email and bootstrap_code are required' });
    }

    const uid          = email.toLowerCase().trim();
    const resolvedRole = (role === 'faculty') ? 'faculty' : 'student';

    const expectedCode = resolvedRole === 'faculty' ? FACULTY_PASSKEY : STUDENT_PASSKEY;
    if (bootstrap_code.trim() !== expectedCode) {
      return res.status(403).json({
        error : 'Invalid College Passkey',
        detail: resolvedRole === 'faculty'
          ? 'Faculty passkey is incorrect. Contact your administrator.'
          : 'Student passkey is incorrect. Contact your administrator.',
      });
    }

    await dbRun(
      `INSERT INTO users (email, name, role, roll_number, department, branch)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE
         SET name = $2, role = $3, roll_number = $4, department = $5, branch = $6`,
      [uid, name || '', resolvedRole, roll_number || null, department || null, branch || null]
    );

    const existing = await dbAll(
      `SELECT credential_id, transports FROM credentials WHERE user_email = $1`,
      [uid]
    );

    const excludeCredentials = existing.map(c => ({
      id        : c.credential_id,
      type      : 'public-key',
      transports: JSON.parse(c.transports || '[]'),
    }));

    const { rpId: rpIdReg } = resolveOrigin(req);

    const options = await generateRegistrationOptions({
      rpName               : RP_NAME,
      rpID                 : rpIdReg,
      userID               : Buffer.from(uid),
      userName             : uid,
      userDisplayName      : name || uid,
      attestationType      : 'none',
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification       : 'required',
        residentKey            : 'preferred',
      },
    });

    storeChallenge(`reg:${uid}`, options.challenge);
    return res.json(options);

  } catch (err) {
    console.error('[/auth/register/start]', err);
    return res.status(500).json({ error: 'Registration start failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/register/finish
// ─────────────────────────────────────────────────────────────────────────────
app.post('/auth/register/finish', async (req, res) => {
  try {
    const { email, credential, sessionId } = req.body;
    if (!email || !credential) {
      return res.status(400).json({ error: 'email and credential are required' });
    }

    const uid = email.toLowerCase().trim();

    const expectedChallenge = consumeChallenge(`reg:${uid}`);
    if (!expectedChallenge) {
      return res.status(400).json({
        error : 'Challenge expired or not found',
        detail: 'Restart registration to get a fresh challenge',
      });
    }

    const { origin: reqOrigin, rpId: reqRPID } = resolveOrigin(req);

    const verification = await verifyRegistrationResponse({
      response               : credential,
      expectedChallenge,
      expectedOrigin         : reqOrigin,
      expectedRPID           : reqRPID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Passkey verification failed' });
    }

    const { id: credId, publicKey, counter, transports: credTransports } =
      verification.registrationInfo.credential;

    const transports = credTransports ?? credential.response?.transports ?? [];

    await dbRun(
      `INSERT INTO credentials (user_email, credential_id, public_key, counter, transports)
       VALUES ($1, $2, $3, $4, $5)`,
      [uid, credId, Buffer.from(publicKey), counter ?? 0, JSON.stringify(transports)]
    );

    const token = signToken(uid);
    const userRow = await dbGet(
      `SELECT email, name, role, roll_number, department, branch FROM users WHERE email = $1`,
      [uid]
    );

    if (sessionId && qrSessions.has(sessionId)) {
      const existing = qrSessions.get(sessionId);
      qrSessions.set(sessionId, { ...existing, status: 'complete', token, user: userRow });
    }

    logAudit(uid, 'register_success', req, { status: 'success' });

    return res.json({
      success     : true,
      message     : 'Passkey registered successfully',
      token,
      credentialId: credId,
      user        : userRow || { email: uid },
    });

  } catch (err) {
    console.error('[/auth/register/finish]', err);
    return res.status(500).json({ error: 'Registration finish failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/login/start
// ─────────────────────────────────────────────────────────────────────────────
app.post('/auth/login/start', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const uid = email.toLowerCase().trim();

    const user = await dbGet(`SELECT email FROM users WHERE email = $1`, [uid]);
    if (!user) {
      return res.status(404).json({
        error : 'User not found',
        detail: 'No account registered for this email',
      });
    }

    const creds = await dbAll(
      `SELECT credential_id, transports FROM credentials WHERE user_email = $1`,
      [uid]
    );
    if (creds.length === 0) {
      return res.status(404).json({
        error : 'No passkeys registered',
        detail: 'Register at least one passkey before logging in',
      });
    }

    const allowCredentials = creds.map(c => ({
      id        : c.credential_id,
      type      : 'public-key',
      transports: JSON.parse(c.transports || '[]'),
    }));

    const { rpId: rpIdAuth } = resolveOrigin(req);

    const options = await generateAuthenticationOptions({
      rpID            : rpIdAuth,
      userVerification: 'required',
      allowCredentials,
    });

    storeChallenge(`auth:${uid}`, options.challenge);
    return res.json(options);

  } catch (err) {
    console.error('[/auth/login/start]', err);
    return res.status(500).json({ error: 'Login start failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /auth/login/finish
// ─────────────────────────────────────────────────────────────────────────────
app.post('/auth/login/finish', async (req, res) => {
  try {
    const { email, credential } = req.body;
    if (!email || !credential) {
      return res.status(400).json({ error: 'email and credential are required' });
    }

    const uid = email.toLowerCase().trim();

    const expectedChallenge = consumeChallenge(`auth:${uid}`);
    if (!expectedChallenge) {
      return res.status(400).json({
        error : 'Challenge expired or not found',
        detail: 'Restart login to get a fresh challenge',
      });
    }

    const credId = credential.id ?? credential.rawId;
    const dbCred = await dbGet(
      `SELECT * FROM credentials WHERE user_email = $1 AND credential_id = $2`,
      [uid, credId]
    );
    if (!dbCred) {
      return res.status(404).json({
        error : 'Credential not found',
        detail: 'This passkey is not registered for the given email',
      });
    }

    const { origin: reqOrigin, rpId: reqRPID } = resolveOrigin(req);

    const verification = await verifyAuthenticationResponse({
      response               : credential,
      expectedChallenge,
      expectedOrigin         : reqOrigin,
      expectedRPID           : reqRPID,
      requireUserVerification: true,
      credential: {
        id        : dbCred.credential_id,
        publicKey : new Uint8Array(dbCred.public_key),
        counter   : dbCred.counter,
        transports: JSON.parse(dbCred.transports || '[]'),
      },
    });

    if (!verification.verified) {
      logAudit(uid, 'login_failure', req, { status: 'failure', meta: { reason: 'verification_failed' } });
      return res.status(401).json({ error: 'Authentication failed' });
    }

    await dbRun(
      `UPDATE credentials SET counter = $1 WHERE id = $2`,
      [verification.authenticationInfo.newCounter, dbCred.id]
    );

    const token = signToken(uid);
    const userRow = await dbGet(
      `SELECT email, name, role, roll_number, department, branch FROM users WHERE email = $1`,
      [uid]
    );

    logAudit(uid, 'login_success', req, { status: 'success' });

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user   : userRow || { email: uid },
    });

  } catch (err) {
    console.error('[/auth/login/finish]', err);
    return res.status(500).json({ error: 'Login finish failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  AUDIT — user sees their own security log
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/audit/me', requireAuth, async (req, res) => {
  try {
    const logs = await dbAll(
      `SELECT id, action, ip, user_agent, risk_score, risk_level, status, created_at
       FROM audit_logs WHERE email=$1 ORDER BY created_at DESC LIMIT 30`,
      [req.user.email]
    );
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN — risk dashboard, user management, revoke
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [users, loginsToday, failures, highRisk] = await Promise.all([
      dbGet(`SELECT COUNT(*)::int AS cnt FROM users`),
      dbGet(`SELECT COUNT(*)::int AS cnt FROM audit_logs WHERE action='login_success' AND created_at > NOW()-INTERVAL '24 hours'`),
      dbGet(`SELECT COUNT(*)::int AS cnt FROM audit_logs WHERE status='failure' AND created_at > NOW()-INTERVAL '24 hours'`),
      dbGet(`SELECT COUNT(*)::int AS cnt FROM audit_logs WHERE risk_level='high' AND created_at > NOW()-INTERVAL '24 hours'`),
    ]);
    res.json({
      totalUsers   : users?.cnt || 0,
      loginsToday  : loginsToday?.cnt || 0,
      failuresToday: failures?.cnt || 0,
      highRiskToday: highRisk?.cnt || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats', detail: err.message });
  }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await dbAll(
      `SELECT u.email, u.name, u.role, u.roll_number, u.department,
              COUNT(DISTINCT c.id)::int                                     AS credential_count,
              MAX(a.created_at)                                              AS last_login,
              SUM(CASE WHEN a.risk_level='high' THEN 1 ELSE 0 END)::int    AS high_risk_events
       FROM users u
       LEFT JOIN credentials c ON c.user_email = u.email
       LEFT JOIN audit_logs  a ON a.email       = u.email
       GROUP BY u.email, u.name, u.role, u.roll_number, u.department
       ORDER BY MAX(a.created_at) DESC NULLS LAST`
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', detail: err.message });
  }
});

app.get('/api/admin/audit', requireAdmin, async (req, res) => {
  try {
    const logs = await dbAll(
      `SELECT id, email, action, ip, user_agent, risk_score, risk_level, status, created_at
       FROM audit_logs ORDER BY created_at DESC LIMIT 150`
    );
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs', detail: err.message });
  }
});

app.delete('/api/admin/revoke/:email', requireAdmin, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();
    const result = await dbRun(`DELETE FROM credentials WHERE user_email=$1`, [email]);
    logAudit(email, 'admin_revoke', req, { status: 'success', meta: { by: 'admin' } });
    res.json({ success: true, removed: result.rowCount, message: `Passkeys revoked for ${email}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke credentials', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/analytics/logins-over-time', requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT DATE(created_at) AS date, COUNT(*)::int AS count
       FROM audit_logs
       WHERE action = 'login_success' AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch login analytics', detail: err.message });
  }
});

app.get('/api/admin/analytics/risk-distribution', requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT risk_level, COUNT(*)::int AS count FROM audit_logs GROUP BY risk_level`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch risk distribution', detail: err.message });
  }
});

app.get('/api/admin/analytics/device-breakdown', requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(`SELECT user_agent FROM audit_logs WHERE user_agent IS NOT NULL`);
    const counts = { Mobile: 0, Desktop: 0, Tablet: 0, Unknown: 0 };
    for (const { user_agent } of rows) {
      const ua = user_agent || '';
      if (/iPad|Tablet/i.test(ua))                  counts.Tablet++;
      else if (/Mobile/i.test(ua))                  counts.Mobile++;
      else if (/Windows|Macintosh|Linux/i.test(ua)) counts.Desktop++;
      else                                           counts.Unknown++;
    }
    const data = Object.entries(counts).map(([device, count]) => ({ device, count }));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch device breakdown', detail: err.message });
  }
});

app.get('/api/admin/analytics/hourly-activity', requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS count
       FROM audit_logs WHERE action = 'login_success'
       GROUP BY hour ORDER BY hour`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hourly activity', detail: err.message });
  }
});

app.get('/api/admin/analytics/auth-methods', requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT meta FROM audit_logs WHERE action IN ('login_success', 'register_success')`
    );
    const counts = {};
    for (const { meta } of rows) {
      let method = 'biometric';
      try {
        const parsed = JSON.parse(meta || '{}');
        if (parsed.method) method = parsed.method;
      } catch { /* ignore malformed meta */ }
      counts[method] = (counts[method] || 0) + 1;
    }
    const data = Object.entries(counts).map(([method, count]) => ({ method, count }));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch auth methods', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  SEED DEMO DATA
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_USERS = [
  { email: 'rahul.sharma@ruas.ac.in',    name: 'Rahul Sharma',          role: 'student', roll_number: 'CSE21001',  department: 'CSE',  branch: 'Computer Science'        },
  { email: 'priya.nair@ruas.ac.in',      name: 'Priya Nair',            role: 'student', roll_number: 'CSE21002',  department: 'CSE',  branch: 'Computer Science'        },
  { email: 'arjun.krishna@ruas.ac.in',   name: 'Arjun Krishna',         role: 'student', roll_number: 'CSE21003',  department: 'CSE',  branch: 'Computer Science'        },
  { email: 'sneha.reddy@ruas.ac.in',     name: 'Sneha Reddy',           role: 'student', roll_number: 'ECE21004',  department: 'ECE',  branch: 'Electronics'             },
  { email: 'vikram.gupta@ruas.ac.in',    name: 'Vikram Gupta',          role: 'student', roll_number: 'ECE21005',  department: 'ECE',  branch: 'Electronics'             },
  { email: 'amit.patel@ruas.ac.in',      name: 'Amit Patel',            role: 'student', roll_number: 'MECH21006', department: 'MECH', branch: 'Mechanical Engineering'  },
  { email: 'divya.menon@ruas.ac.in',     name: 'Divya Menon',           role: 'student', roll_number: 'MECH21007', department: 'MECH', branch: 'Mechanical Engineering'  },
  { email: 'kavya.singh@ruas.ac.in',     name: 'Kavya Singh',           role: 'student', roll_number: 'MBA21008',  department: 'MBA',  branch: 'Business Administration' },
  { email: 'rohan.verma@ruas.ac.in',     name: 'Rohan Verma',           role: 'student', roll_number: 'MBA21009',  department: 'MBA',  branch: 'Business Administration' },
  { email: 'ananya.iyer@ruas.ac.in',     name: 'Ananya Iyer',           role: 'student', roll_number: 'CSE22010',  department: 'CSE',  branch: 'Computer Science'        },
  { email: 'suresh.kumar@ruas.ac.in',    name: 'Suresh Kumar',          role: 'student', roll_number: 'ECE22011',  department: 'ECE',  branch: 'Electronics'             },
  { email: 'lakshmi.prasad@ruas.ac.in',  name: 'Lakshmi Prasad',        role: 'student', roll_number: 'MECH22012', department: 'MECH', branch: 'Mechanical Engineering'  },
  { email: 'dr.ramesh@ruas.ac.in',       name: 'Dr. Ramesh Kumar',      role: 'faculty', roll_number: null,        department: 'CSE',  branch: null                      },
  { email: 'prof.sunita@ruas.ac.in',     name: 'Prof. Sunita Rao',      role: 'faculty', roll_number: null,        department: 'ECE',  branch: null                      },
  { email: 'dr.krishnaswamy@ruas.ac.in', name: 'Dr. Krishnaswamy',      role: 'faculty', roll_number: null,        department: 'MECH', branch: null                      },
  { email: 'prof.malhotra@ruas.ac.in',   name: 'Prof. Anita Malhotra',  role: 'faculty', roll_number: null,        department: 'MBA',  branch: null                      },
  { email: 'dr.venkat@ruas.ac.in',       name: 'Dr. Venkataraman',      role: 'faculty', roll_number: null,        department: 'CSE',  branch: null                      },
  { email: 'prof.deshpande@ruas.ac.in',  name: 'Prof. Meera Deshpande', role: 'faculty', roll_number: null,        department: 'ECE',  branch: null                      },
];

app.post('/api/admin/seed-demo-data', requireAdmin, async (req, res) => {
  try {
    // Idempotency: skip if demo users already exist
    const existingCheck = await dbGet(
      `SELECT COUNT(*)::int AS cnt FROM users WHERE email LIKE '%@ruas.ac.in'`
    );
    if ((existingCheck?.cnt || 0) >= 5) {
      return res.json({ success: true, message: 'Demo data already seeded', users_created: 0, logs_created: 0 });
    }

    // Insert demo users
    let usersCreated = 0;
    for (const u of DEMO_USERS) {
      const result = await dbRun(
        `INSERT INTO users (email, name, role, roll_number, department, branch)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [u.email, u.name, u.role, u.roll_number || null, u.department || null, u.branch || null]
      );
      if (result.rowCount > 0) usersCreated++;
    }

    // Generate 150 realistic audit log entries (5 per day × 30 days)
    const SEED_EMAILS  = DEMO_USERS.map(u => u.email);
    const SEED_UAS     = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/121.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Safari/537.36 Edg/120.0.0.0',
      'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    ];
    const SEED_IPS     = ['10.0.1.45','10.0.1.78','10.0.2.12','10.0.2.56','10.0.3.90','10.0.4.23','10.1.0.15','10.1.1.8'];
    const SEED_ACTIONS = ['login_success','login_success','login_success','login_success','login_failure','register_success','login_success','login_success'];
    // Weighted hour distribution: morning peak 8-10, afternoon 2-4, some evening, rare late-night
    const SEED_HOURS   = [8,8,8,9,9,9,10,14,14,15,15,16,11,13,18,20,1,2];

    let logsCreated = 0;
    let idx = 0;
    const now = new Date();

    for (let day = 0; day < 30; day++) {
      for (let j = 0; j < 5; j++) {
        const email  = SEED_EMAILS [(idx)      % SEED_EMAILS.length];
        const ua     = SEED_UAS    [(idx * 3)  % SEED_UAS.length];
        const ip     = SEED_IPS    [(idx * 7)  % SEED_IPS.length];
        const action = SEED_ACTIONS[(idx * 11) % SEED_ACTIONS.length];
        const hour   = SEED_HOURS  [(idx * 13) % SEED_HOURS.length];
        const minute = (idx * 17) % 60;
        const second = (idx * 31) % 60;

        const ts = new Date(now);
        ts.setDate(ts.getDate() - (29 - day));
        ts.setHours(hour, minute, second, 0);

        const rawRisk   = action === 'login_failure' ? 40 + (idx % 30) :
                          hour < 5                   ? 30 + (idx % 20) : idx % 22;
        const riskScore = Math.min(rawRisk, 100);
        const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
        const status    = action === 'login_failure' ? 'failure' : 'success';

        await dbRun(
          `INSERT INTO audit_logs (email, action, ip, user_agent, risk_score, risk_level, status, meta, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [email, action, ip, ua, riskScore, riskLevel, status, '{}', ts.toISOString()]
        );
        logsCreated++;
        idx++;
      }
    }

    res.json({ success: true, users_created: usersCreated, logs_created: logsCreated });
  } catch (err) {
    console.error('[seed-demo-data]', err);
    res.status(500).json({ error: 'Seed failed', detail: err.message });
  }
});

// ============================================================
// OAuth 2.0 / OpenID Connect Bridge
// Allows campus applications (ERP, LMS, Library) to use
// CampusKey as their identity provider via standard OAuth 2.0
// This enables true Single Sign-On across all campus systems
// ============================================================

const OAUTH_REDIRECT_WHITELIST = [
  'http://localhost:3000/callback',
  'http://localhost:5173/oauth/callback',
  'https://campuskey-five.vercel.app/oauth/callback',
];

const oauthCodes = new Map(); // code -> { userId, redirectUri, expires }
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of oauthCodes) {
    if (now > data.expires) oauthCodes.delete(code);
  }
}, 60_000);

// OpenID Connect Discovery Document
app.get('/.well-known/openid-configuration', (req, res) => {
  const { origin } = resolveOrigin(req);
  res.json({
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    userinfo_endpoint: `${origin}/oauth/userinfo`,
    jwks_uri: `${origin}/.well-known/jwks.json`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['none'],
    claims_supported: ['sub', 'name', 'email', 'role', 'iss', 'iat', 'exp'],
  });
});

// OAuth 2.0 Authorization Endpoint
// Client redirects user here; we validate JWT session and issue a code
app.get('/oauth/authorize', async (req, res) => {
  const { client_id, redirect_uri, response_type, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }
  if (!redirect_uri || !OAUTH_REDIRECT_WHITELIST.includes(redirect_uri)) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  // Require a valid CampusKey JWT
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'login_required', message: 'Present a CampusKey JWT as Bearer token' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }

  const code = require('crypto').randomBytes(20).toString('hex');
  oauthCodes.set(code, {
    userId: payload.sub,
    userName: payload.name,
    userRole: payload.role,
    redirectUri: redirect_uri,
    clientId: client_id,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  const params = new URLSearchParams({ code, state: state || '' });
  res.redirect(`${redirect_uri}?${params}`);
});

// OAuth 2.0 Token Endpoint
// Exchanges authorization code for access_token + id_token
app.post('/oauth/token', async (req, res) => {
  const { code, redirect_uri, grant_type } = req.body;

  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }

  const entry = oauthCodes.get(code);
  if (!entry || Date.now() > entry.expires) {
    return res.status(400).json({ error: 'invalid_grant', message: 'Code expired or not found' });
  }
  if (entry.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: 'invalid_grant', message: 'redirect_uri mismatch' });
  }

  oauthCodes.delete(code); // one-time use

  const user = await dbGet('SELECT id, username, role FROM users WHERE id = $1', [entry.userId]);
  if (!user) {
    return res.status(400).json({ error: 'invalid_grant', message: 'User not found' });
  }

  const { origin } = resolveOrigin(req);
  const accessToken = jwt.sign(
    { sub: user.id, name: user.username, role: user.role, iss: origin, aud: entry.clientId },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '1h' }
  );
  const idToken = jwt.sign(
    { sub: user.id, name: user.username, role: user.role, iss: origin, aud: entry.clientId },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '1h' }
  );

  res.json({
    access_token: accessToken,
    id_token: idToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'openid profile',
  });
});

// OAuth 2.0 UserInfo Endpoint
// Returns profile claims for the authenticated user
app.get('/oauth/userinfo', async (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'missing_token' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }

  const user = await dbGet('SELECT id, username, role FROM users WHERE id = $1', [payload.sub]);
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  res.json({
    sub: user.id,
    name: user.username,
    preferred_username: user.username,
    role: user.role,
    email: `${user.username}@campus.edu`,
    email_verified: true,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

app.use((err, _req, res, _next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────────────────────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const lanIPs = getLanIPs();
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║         CAMPUSKEY  Auth API  v2  —  #0a0e1a     ║');
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log(`  ║   Local    http://localhost:${String(PORT).padEnd(21)}║`);
  lanIPs.forEach(ip => {
    const label = `http://${ip}:${PORT}`;
    console.log(`  ║   Network  ${label.padEnd(38)}║`);
  });
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log('  ║  POST /auth/register/start                       ║');
  console.log('  ║  POST /auth/register/finish  → JWT               ║');
  console.log('  ║  POST /auth/login/start                          ║');
  console.log('  ║  POST /auth/login/finish     → JWT               ║');
  console.log('  ║  GET  /auth/me               ← Bearer            ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');
});
