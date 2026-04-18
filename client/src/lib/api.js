/**
 * CampusKey API client
 *
 * BASE URL resolution (priority):
 *   1. import.meta.env.VITE_API_URL  — set in .env.production for Vercel deploy
 *   2. window.location.hostname      — if phone loads app via LAN IP (192.168.x.x:3000),
 *                                       backend is automatically resolved at same IP port 3001
 *   3. http://localhost:3001          — local dev fallback
 *
 * This means the phone never tries to reach "localhost:3001" — it uses the
 * same IP the QR code directed it to, which the laptop's backend is listening on.
 */
function resolveBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    // LAN IP (phone via QR) — backend on same machine port 3001
    if (/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(h)) {
      return `http://${h}:3001`;
    }
    // localhost dev
    if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:3001';
  }
  // Production (Vercel) — always hit Render backend
  return 'https://campuskey-api.onrender.com';
}

export const BASE = resolveBase();

function getToken() {
  return sessionStorage.getItem('ck_token');
}

async function request(method, path, body) {
  const token = getToken();

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.detail || json.error || `HTTP ${res.status}`);
  }
  return json;
}

const post = (path, body) => request('POST', path, body);
const get  = (path)       => request('GET',  path);

export async function sendVerificationCode(email, purpose = 'registration', name = '', role = '') {
  const res = await fetch(`${BASE}/auth/send-verification`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ email, purpose, name, role }),
  });
  return res.json();
}

export async function verifyCode(email, code, purpose = 'registration') {
  const res = await fetch(`${BASE}/auth/verify-code`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ email, code, purpose }),
  });
  return res.json();
}

export const api = {
  // ── WebAuthn flows ─────────────────────────────────────────────────────────
  registerStart : (data)                       => post('/auth/register/start',  data),
  registerFinish: (email, credential, sessionId) => post('/auth/register/finish', { email, credential, ...(sessionId ? { sessionId } : {}) }),
  loginStart    : (email)                      => post('/auth/login/start',     { email }),
  loginFinish   : (email, credential)          => post('/auth/login/finish',    { email, credential }),

  // ── QR session (cross-device enrolment) ────────────────────────────────────
  qrSessionCreate: ()    => post('/auth/qr-session/create', {}),
  qrSessionStatus: (id)  => get(`/auth/qr-session/status/${id}`),

  // ── Session validation ──────────────────────────────────────────────────────
  me: () => get('/auth/me'),

  // ── Audit (user's own security log) ─────────────────────────────────────────
  auditMe: () => get('/api/audit/me'),

  // ── Admin endpoints (pass admin key as header) ───────────────────────────────
  adminStats : (key) => fetch(`${BASE}/api/admin/stats`,  { headers: { 'x-admin-key': key } }).then(r => r.json()),
  adminUsers : (key) => fetch(`${BASE}/api/admin/users`,  { headers: { 'x-admin-key': key } }).then(r => r.json()),
  adminAudit : (key) => fetch(`${BASE}/api/admin/audit`,  { headers: { 'x-admin-key': key } }).then(r => r.json()),
  adminRevoke: (key, email) => fetch(`${BASE}/api/admin/revoke/${encodeURIComponent(email)}`, {
    method: 'DELETE', headers: { 'x-admin-key': key },
  }).then(r => r.json()),

  // ── Analytics (admin) ─────────────────────────────────────────────────────
  getLoginAnalytics  : (key) => fetch(`${BASE}/api/admin/analytics/logins-over-time`,  { headers: { 'x-admin-key': key } }).then(r => r.json()),
  getRiskDistribution: (key) => fetch(`${BASE}/api/admin/analytics/risk-distribution`, { headers: { 'x-admin-key': key } }).then(r => r.json()),
  getDeviceBreakdown : (key) => fetch(`${BASE}/api/admin/analytics/device-breakdown`,  { headers: { 'x-admin-key': key } }).then(r => r.json()),
  getHourlyActivity  : (key) => fetch(`${BASE}/api/admin/analytics/hourly-activity`,   { headers: { 'x-admin-key': key } }).then(r => r.json()),
  getAuthMethods     : (key) => fetch(`${BASE}/api/admin/analytics/auth-methods`,      { headers: { 'x-admin-key': key } }).then(r => r.json()),

  // ── Seed demo data ────────────────────────────────────────────────────────
  seedDemoData: (key) => fetch(`${BASE}/api/admin/seed-demo-data`, {
    method: 'POST',
    headers: { 'x-admin-key': key, 'Content-Type': 'application/json' },
    body: '{}',
  }).then(r => r.json()),
};
