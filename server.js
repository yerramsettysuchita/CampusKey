'use strict';

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
