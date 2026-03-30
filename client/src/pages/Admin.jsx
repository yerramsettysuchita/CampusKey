import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, AlertTriangle, CheckCircle2,
  Fingerprint, Loader2, Trash2, RefreshCw, Lock,
  TrendingUp, Activity,
} from 'lucide-react';
import { api } from '../lib/api';

const riskColor = { low: '#059669', medium: '#d97706', high: '#dc2626' };
const riskBg    = { low: '#dcfce7', medium: '#fef3c7', high: '#fee2e2' };

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
  const [tab,       setTab]       = useState('users');

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
    } finally {
      setLoading(false);
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
