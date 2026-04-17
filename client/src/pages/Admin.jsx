import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, AlertTriangle, CheckCircle2,
  Fingerprint, Loader2, Trash2, RefreshCw, Lock,
  TrendingUp, Activity, BarChart2, Database,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from 'recharts';

const riskColor = { low: '#059669', medium: '#d97706', high: '#dc2626' };
const riskBg        = { low: '#dcfce7', medium: '#fef3c7', high: '#fee2e2' };
const RISK_COLORS   = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };
const DEVICE_COLORS = { Mobile: '#6366f1', Desktop: '#4f46e5', Tablet: '#818cf8', Unknown: '#94a3b8' };

function Badge({ label, color, bg }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {label}
    </span>
  );
}

export default function Admin() {
  const [adminKey,  setAdminKey]  = useState('');
  const [authed,    setAuthed]    = useState(false);
  const [keyInput,  setKeyInput]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [stats,     setStats]     = useState(null);
  const [users,     setUsers]     = useState([]);
  const [logs,      setLogs]      = useState([]);
  const [revoking,  setRevoking]  = useState('');
  const [tab,              setTab]              = useState('users');
  const [analytics,        setAnalytics]        = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [seeding,          setSeeding]          = useState(false);

  async function fetchAnalytics(key) {
    setAnalyticsLoading(true);
    try {
      const [logins, risk, devices, hourly, methods] = await Promise.all([
        api.getLoginAnalytics(key),
        api.getRiskDistribution(key),
        api.getDeviceBreakdown(key),
        api.getHourlyActivity(key),
        api.getAuthMethods(key),
      ]);
      setAnalytics({
        logins  : logins.data   || [],
        risk    : risk.data     || [],
        devices : devices.data  || [],
        hourly  : hourly.data   || [],
        methods : methods.data  || [],
      });
    } catch (e) {
      console.error('[Analytics]', e);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const s = await api.adminStats(keyInput);
      if (s.error) { setError('Invalid admin key. Please try again.'); setLoading(false); return; }
      const [u, l] = await Promise.all([api.adminUsers(keyInput), api.adminAudit(keyInput)]);
      setStats(s);
      setUsers(u.users || []);
      setLogs(l.logs || []);
      setAdminKey(keyInput);
      setAuthed(true);
      fetchAnalytics(keyInput);
    } catch {
      setError('Could not connect. Please check the key and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(email) {
    if (!window.confirm(`Revoke all passkeys for ${email}? They will need to re-register.`)) return;
    setRevoking(email);
    try {
      await api.adminRevoke(adminKey, email);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, credential_count: 0 } : u));
    } catch {
      alert('Failed to revoke. Please try again.');
    } finally {
      setRevoking('');
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const [s, u, l] = await Promise.all([
        api.adminStats(adminKey),
        api.adminUsers(adminKey),
        api.adminAudit(adminKey),
      ]);
      setStats(s); setUsers(u.users || []); setLogs(l.logs || []);
      fetchAnalytics(adminKey);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedDemoData() {
    if (!window.confirm('Insert 18 demo users and 150 realistic audit log entries for demonstration?')) return;
    setSeeding(true);
    try {
      const result = await api.seedDemoData(adminKey);
      alert(`Demo data seeded! ${result.users_created || 0} users and ${result.logs_created || 0} logs created.`);
      refresh();
    } catch (e) {
      alert('Seeding failed: ' + e.message);
    } finally {
      setSeeding(false);
    }
  }

  const actionLabel = {
    login_success: 'Login successful', login_failure: 'Login failed',
    register_success: 'Passkey registered', admin_revoke: 'Access revoked',
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg,#eef2ff,#f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(99,102,241,0.12)', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 6px 20px rgba(99,102,241,0.30)' }}>
              <Lock style={{ width: 26, height: 26, color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Admin Dashboard</h1>
            <p style={{ fontSize: 13, color: '#64748b' }}>Enter your admin key to access the risk dashboard and user management panel.</p>
          </div>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Admin Key</label>
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Enter admin key"
              required
              style={{ width: '100%', borderRadius: 12, padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <button type="submit" disabled={loading} style={{
              width: '100%', borderRadius: 14, padding: '14px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading ? <><Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /><span>Connecting…</span></> : <><ShieldCheck style={{ width: 18, height: 18 }} /><span>Access Dashboard</span></>}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Navbar */}
      <nav style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 18px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fingerprint size={15} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Campus<span style={{ color: '#4f46e5' }}>Key</span></span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2', border: '1px solid #fecaca', padding: '2px 10px', borderRadius: 20 }}>Admin</span>
          </div>
          <button onClick={refresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 18px 40px' }}>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { icon: Users,         label: 'Total Users',        value: stats.totalUsers,    color: '#4f46e5' },
              { icon: CheckCircle2,  label: 'Logins Today',       value: stats.loginsToday,   color: '#059669' },
              { icon: AlertTriangle, label: 'Failed Attempts',     value: stats.failuresToday, color: '#d97706' },
              { icon: Activity,      label: 'High Risk Events',   value: stats.highRiskToday, color: '#dc2626' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.color}14`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div>
                  <p style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 3 }}>{s.label}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>last 24 hours</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Security Analytics ───────────────────────────────────────── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{ marginBottom: 20 }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={17} color="#4f46e5" />
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>Security Analytics</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {stats.totalUsers < 5 && (
                  <button
                    onClick={handleSeedDemoData}
                    disabled={seeding}
                    title="Populate the database with 18 demo users and 150 realistic audit events"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: '1px solid #fbbf24', background: '#fffbeb', color: '#92400e', fontSize: 12, fontWeight: 700, cursor: seeding ? 'not-allowed' : 'pointer', opacity: seeding ? 0.6 : 1, whiteSpace: 'nowrap' }}
                  >
                    {seeding ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                    {seeding ? 'Seeding…' : 'Populate Demo Data'}
                  </button>
                )}
                <button
                  onClick={() => fetchAnalytics(adminKey)}
                  disabled={analyticsLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <RefreshCw size={12} className={analyticsLoading ? 'animate-spin' : ''} /> Refresh Charts
                </button>
              </div>
            </div>

            {/* Loading state */}
            {analyticsLoading && !analytics && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                <Loader2 size={22} color="#6366f1" className="animate-spin" style={{ margin: '0 auto 10px', display: 'block' }} />
                Loading analytics…
              </div>
            )}

            {/* Charts grid */}
            {analytics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 14 }}>

                {/* Login Trend (30 days) */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14, marginTop: 0 }}>Login Trend — Last 30 Days</p>
                  {analytics.logins.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '40px 0' }}>No login data yet. Populate demo data to see charts.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={analytics.logins.map(d => ({ count: d.count, date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} width={28} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                        <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.5} dot={false} name="Logins" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Risk Distribution */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14, marginTop: 0 }}>Risk Distribution</p>
                  {analytics.risk.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '40px 0' }}>No audit data yet.</p>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ResponsiveContainer width="55%" height={180}>
                        <PieChart>
                          <Pie data={analytics.risk} dataKey="count" nameKey="risk_level" innerRadius={48} outerRadius={74} paddingAngle={3}>
                            {analytics.risk.map((entry) => (
                              <Cell key={entry.risk_level} fill={RISK_COLORS[entry.risk_level] || '#94a3b8'} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v, n) => [v, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {analytics.risk.map(r => (
                          <div key={r.risk_level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_COLORS[r.risk_level] || '#94a3b8', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#475569', flex: 1, textTransform: 'capitalize' }}>{r.risk_level}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Device Breakdown */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14, marginTop: 0 }}>Device Breakdown</p>
                  {analytics.devices.every(d => d.count === 0) ? (
                    <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '40px 0' }}>No device data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={analytics.devices.filter(d => d.count > 0)} layout="vertical" margin={{ left: 8, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                        <YAxis dataKey="device" type="category" tick={{ fontSize: 12, fill: '#475569' }} width={62} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Sessions">
                          {analytics.devices.filter(d => d.count > 0).map((entry) => (
                            <Cell key={entry.device} fill={DEVICE_COLORS[entry.device] || '#94a3b8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Peak Login Hours */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14, marginTop: 0 }}>Peak Login Hours</p>
                  {analytics.hourly.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '40px 0' }}>No login data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart
                        data={Array.from({ length: 24 }, (_, i) => {
                          const found = analytics.hourly.find(h => Number(h.hour) === i);
                          return { hour: `${i}h`, count: found ? found.count : 0 };
                        })}
                        margin={{ right: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={2} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} width={28} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[3, 3, 0, 0]} name="Logins" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
            {[
              { id: 'users',  icon: Users,        label: 'User Management', color: '#4f46e5' },
              { id: 'audit',  icon: TrendingUp,   label: 'Audit Log',       color: '#7c3aed' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '14px 10px', border: 'none', cursor: 'pointer',
                background: tab === t.id ? '#fff' : '#f8fafc',
                borderBottom: `3px solid ${tab === t.id ? t.color : 'transparent'}`,
                color: tab === t.id ? t.color : '#94a3b8',
                fontWeight: tab === t.id ? 700 : 600, fontSize: 13, transition: 'all 0.18s',
              }}>
                <t.icon size={15} />{t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px 18px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

                {/* Users tab */}
                {tab === 'users' && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                          {['Name', 'Email', 'Role', 'Passkeys', 'Last Login', 'Risk Events', 'Action'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.email} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{u.name || '—'}</td>
                            <td style={{ padding: '12px', color: '#475569', fontSize: 12 }}>{u.email}</td>
                            <td style={{ padding: '12px' }}>
                              <Badge label={u.role === 'faculty' ? 'Faculty' : 'Student'} color={u.role === 'faculty' ? '#7c3aed' : '#4f46e5'} bg={u.role === 'faculty' ? '#f5f3ff' : '#eef2ff'} />
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: u.credential_count > 0 ? '#059669' : '#dc2626' }}>{u.credential_count}</td>
                            <td style={{ padding: '12px', color: '#64748b', fontSize: 11 }}>
                              {u.last_login ? new Date(u.last_login).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Never'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              {u.high_risk_events > 0
                                ? <Badge label={`${u.high_risk_events} High`} color='#dc2626' bg='#fee2e2' />
                                : <Badge label="Clean" color='#059669' bg='#dcfce7' />}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <button
                                onClick={() => handleRevoke(u.email)}
                                disabled={revoking === u.email || u.credential_count === 0}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: u.credential_count === 0 ? 'not-allowed' : 'pointer', opacity: u.credential_count === 0 ? 0.5 : 1 }}>
                                {revoking === u.email ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {users.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 13 }}>No users found.</p>
                    )}
                  </div>
                )}

                {/* Audit log tab */}
                {tab === 'audit' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {logs.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 13 }}>No audit events yet.</p>
                    )}
                    {logs.map(log => (
                      <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: log.risk_level === 'high' ? '#fff5f5' : '#f8fafc', borderRadius: 12, border: `1px solid ${log.risk_level === 'high' ? '#fecaca' : '#e2e8f0'}` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: log.status === 'success' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ShieldCheck size={16} color={log.status === 'success' ? '#059669' : '#dc2626'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{actionLabel[log.action] || log.action}</p>
                            <Badge label={log.risk_level.toUpperCase()} color={riskColor[log.risk_level] || '#64748b'} bg={riskBg[log.risk_level] || '#f1f5f9'} />
                          </div>
                          <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0' }}>
                            {log.email || 'Unknown'} · {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} · {log.ip || 'Unknown IP'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: riskColor[log.risk_level] || '#64748b', margin: 0 }}>Risk {log.risk_score}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
