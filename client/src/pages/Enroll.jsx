import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldPlus, ShieldCheck, GraduationCap, BookOpen, Fingerprint,
  KeyRound, Loader2, AlertCircle, X, QrCode, Monitor,
  CheckCircle2, Smartphone, Clock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import FloatingOrbs from '../components/FloatingOrbs';
import { useAuth }  from '../context/AuthContext';
import { enrollPasskey } from '../lib/webauthn';
import { api } from '../lib/api';

const WAVE = (
  <div className="wave-footer">
    <svg viewBox="0 0 1440 90" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 45 Q360 5 720 45 Q1080 85 1440 45 L1440 90 L0 90 Z" fill="rgba(99,102,241,0.06)" />
      <path d="M0 60 Q360 20 720 60 Q1080 100 1440 60 L1440 90 L0 90 Z" fill="rgba(99,102,241,0.035)" />
    </svg>
  </div>
);

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics Engineering',
  'Information Science & Engineering',
  'Biotechnology & Genetic Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Mathematics & Statistics',
  'Physics', 'Chemistry',
];
const BRANCHES = ['B.Tech','M.Tech','B.E','M.E','B.Sc','M.Sc','PhD','MBA','MCA'];

const inputStyle = {
  width:'100%', borderRadius:12, padding:'11px 16px',
  background:'#f8fafc', border:'1.5px solid #e2e8f0',
  color:'#0f172a', fontSize:14, outline:'none',
  transition:'border-color 0.2s, box-shadow 0.2s',
};
const labelStyle = {
  display:'block', fontSize:11, fontWeight:700,
  textTransform:'uppercase', letterSpacing:'0.08em',
  color:'#475569', marginBottom:6,
};
function Field({ label, children }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

export default function Enroll() {
  const navigate       = useNavigate();
  const { login }      = useAuth();
  const [searchParams] = useSearchParams();
  const pollingRef     = useRef(null);

  const isFromQR = searchParams.get('qr') === '1';

  const [role,          setRole]          = useState('student');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [focusField,    setFocusField]    = useState('');
  const [showQRModal,   setShowQRModal]   = useState(false);
  const [qrUrl,         setQrUrl]         = useState('');
  const [qrPolling,     setQrPolling]     = useState(false);
  const [phoneSuccess,  setPhoneSuccess]  = useState(false);

  // Student fields
  const [fullName,       setFullName]       = useState('');
  const [rollNumber,     setRollNumber]     = useState('');
  const [studentEmail,   setStudentEmail]   = useState('');
  const [studentPasskey, setStudentPasskey] = useState('');
  // Faculty fields
  const [facultyName,    setFacultyName]    = useState('');
  const [department,     setDepartment]     = useState('');
  const [branch,         setBranch]         = useState('');
  const [facultyEmail,   setFacultyEmail]   = useState('');
  const [facultyPasskey, setFacultyPasskey] = useState('');

  // Pre-fill from QR URL params (phone landing)
  useEffect(() => {
    if (!isFromQR) return;
    const r = searchParams.get('role') || 'student';
    setRole(r);
    if (r === 'student') {
      setFullName(searchParams.get('name') || '');
      setRollNumber(searchParams.get('rn') || '');
      setStudentEmail(searchParams.get('email') || '');
      setStudentPasskey(searchParams.get('cp') || '');
    } else {
      setFacultyName(searchParams.get('name') || '');
      setDepartment(searchParams.get('dept') || '');
      setBranch(searchParams.get('br') || '');
      setFacultyEmail(searchParams.get('email') || '');
      setFacultyPasskey(searchParams.get('cp') || '');
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const focusStyle = (name) => focusField === name
    ? { ...inputStyle, borderColor:'#6366f1', boxShadow:'0 0 0 3px rgba(99,102,241,0.12)', background:'#fff' }
    : inputStyle;

  const selectStyle = (name, val) => ({
    ...focusStyle(name), cursor:'pointer', appearance:'none', WebkitAppearance:'none',
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center', paddingRight:36,
    color: val ? '#0f172a' : '#94a3b8',
  });

  function validate() {
    if (role === 'student') {
      if (!fullName.trim())       { setError('Please enter your full name.'); return false; }
      if (!rollNumber.trim())     { setError('Please enter your roll number.'); return false; }
      if (!studentEmail.trim())   { setError('Please enter your college mail ID.'); return false; }
      if (!studentPasskey.trim()) { setError('Please enter your college passkey.'); return false; }
    } else {
      if (!facultyName.trim())    { setError('Please enter your name.'); return false; }
      if (!department)            { setError('Please select your department.'); return false; }
      if (!branch)                { setError('Please select your branch.'); return false; }
      if (!facultyEmail.trim())   { setError('Please enter your mail ID.'); return false; }
      if (!facultyPasskey.trim()) { setError('Please enter your college passkey.'); return false; }
    }
    return true;
  }

  function getEnrollData(sessionId) {
    const isStudent = role === 'student';
    return {
      email         : (isStudent ? studentEmail : facultyEmail).trim().toLowerCase(),
      bootstrap_code: (isStudent ? studentPasskey : facultyPasskey).trim(),
      name          : (isStudent ? fullName : facultyName).trim(),
      role,
      roll_number   : isStudent ? rollNumber.trim() : undefined,
      department    : !isStudent ? department : undefined,
      branch        : !isStudent ? branch : undefined,
      sessionId,
    };
  }

  // ── Register on this device ─────────────────────────────────────────────────
  async function doEnroll(sessionId) {
    setError('');
    setLoading(true);
    try {
      const result = await enrollPasskey(getEnrollData(sessionId));
      if (result.success) {
        if (isFromQR) {
          setPhoneSuccess(true);
        } else {
          login(result.user, result.token, result.user?.role || role);
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Biometric prompt was dismissed. Please try again.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Desktop: generate QR + start polling ────────────────────────────────────
  async function handleGenerateQR(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    try {
      const { sessionId } = await api.qrSessionCreate();

      const d = getEnrollData(sessionId);
      const params = new URLSearchParams({
        qr: '1', role: d.role, name: d.name, email: d.email, cp: d.bootstrap_code, sid: sessionId,
      });
      if (d.roll_number) params.set('rn', d.roll_number);
      if (d.department)  params.set('dept', d.department);
      if (d.branch)      params.set('br', d.branch);

      setQrUrl(`${window.location.origin}/enroll?${params.toString()}`);
      setShowQRModal(true);
      setQrPolling(true);

      // Poll every 2.5 seconds until phone completes
      pollingRef.current = setInterval(async () => {
        try {
          const { status, token, user } = await api.qrSessionStatus(sessionId);
          if (status === 'complete') {
            clearInterval(pollingRef.current);
            setShowQRModal(false);
            setQrPolling(false);
            login(user, token, user?.role || role);
            navigate('/dashboard', { replace: true });
          } else if (status === 'expired') {
            clearInterval(pollingRef.current);
            setShowQRModal(false);
            setQrPolling(false);
            setError('QR code expired. Please generate a new one.');
          }
        } catch { /* network blip, keep polling */ }
      }, 2500);

    } catch (err) {
      setError('Could not create QR session. Please try again.');
    }
  }

  function closeQRModal() {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setShowQRModal(false);
    setQrPolling(false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PHONE LANDING (arrived via QR scan)
  // ════════════════════════════════════════════════════════════════════════════
  if (isFromQR) {
    const sid = searchParams.get('sid');
    const qrRole = searchParams.get('role') || 'student';
    const detailRows = [
      ['Name',  searchParams.get('name')],
      ['Email', searchParams.get('email')],
      ['Role',  qrRole.charAt(0).toUpperCase() + qrRole.slice(1)],
      ...(qrRole === 'student'
        ? [['Roll No', searchParams.get('rn')]]
        : [['Department', searchParams.get('dept')], ['Branch', searchParams.get('br')]]),
    ].filter(([, v]) => v);

    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #eef2ff 0%, #f8fafc 50%, #f0f9ff 100%)',
        overflowX: 'hidden',
      }}>
        <FloatingOrbs />

        {/* ── Top bar ── */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 14px rgba(139,92,246,0.30)',
          }}>
            <ShieldPlus style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Campus<span style={{ color: '#4f46e5' }}>Key</span>
          </span>
        </div>

        {/* ── Main content ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 20px 32px', position: 'relative', zIndex: 10 }}
        >

          {/* ── SUCCESS ── */}
          <AnimatePresence>
            {phoneSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{ background: '#fff', borderRadius: 24, padding: '40px 28px', textAlign: 'center', boxShadow: '0 8px 40px rgba(99,102,241,0.10)', border: '1px solid #e2e8f0' }}
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                  style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', border: '2px solid #86efac', boxShadow: '0 8px 28px rgba(22,163,74,0.18)' }}>
                  <CheckCircle2 style={{ width: 40, height: 40, color: '#16a34a' }} />
                </motion.div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Registration Complete!</h2>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
                  Your biometric passkey has been registered successfully.
                </p>
                <div style={{ background: 'linear-gradient(135deg, #eef2ff, #f0f9ff)', borderRadius: 14, padding: '14px 18px', border: '1.5px solid #c7d2fe', marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5', marginBottom: 4 }}>Your laptop is logging in automatically.</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>You can safely close this tab.</p>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>🔐 FIDO2 secured · Biometric never left this device</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PHONE REGISTER FORM ── */}
          {!phoneSuccess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Hero header */}
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20, margin: '0 auto 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  boxShadow: '0 8px 28px rgba(99,102,241,0.32)',
                }}>
                  <Fingerprint style={{ width: 32, height: 32, color: '#fff' }} />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.3px' }}>
                  Register Your Passkey
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                  Use your phone's <strong style={{ color: '#4f46e5' }}>Face ID or Fingerprint</strong> to create a secure passkey
                </p>
              </div>

              {/* Details card */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '6px 0', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {detailRows.map(([k, v], i) => (
                  <div key={k} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 20px',
                    borderBottom: i < detailRows.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', maxWidth: 200, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', marginTop: 1, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: '#b91c1c', flex: 1 }}>{error}</p>
                    <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <X style={{ width: 14, height: 14, color: '#ef4444' }} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Biometric button */}
              <motion.button
                onClick={() => doEnroll(sid)}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', borderRadius: 18, padding: '18px 24px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#818cf8' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.40)',
                  color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.2px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                {loading
                  ? <><Loader2 style={{ width: 20, height: 20 }} className="animate-spin" /><span>Verifying…</span></>
                  : <><Fingerprint style={{ width: 22, height: 22 }} /><span>Tap to Authenticate</span></>
                }
              </motion.button>

              {/* Trust badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ShieldCheck style={{ width: 13, height: 13, color: '#059669' }} />
                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                  Biometric never leaves this device · FIDO2 / WebAuthn secured
                </p>
              </div>
            </div>
          )}
        </motion.div>
        {WAVE}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DESKTOP REGISTRATION FORM
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #f8fafc 55%, #f0f9ff 100%)' }}>
      <FloatingOrbs />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 mb-8 text-center"
      >
        <div className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 16px rgba(139,92,246,0.30)' }}>
            <ShieldPlus className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            <span style={{ color: '#0f172a' }}>Campus</span>
            <span style={{ color: '#4f46e5' }}>Key</span>
          </span>
        </div>
        <div className="text-xs uppercase tracking-[0.22em] font-medium" style={{ color: '#94a3b8' }}>
          Enroll Your Passkey
        </div>
      </motion.div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Role toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="flex gap-2 p-1 rounded-xl mb-4"
          style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          {[
            { value: 'student', label: 'Student', icon: GraduationCap },
            { value: 'faculty', label: 'Faculty',  icon: BookOpen },
          ].map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => { setRole(value); setError(''); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={role === value
                ? { background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', color: '#4f46e5', border: '1.5px solid #c7d2fe', boxShadow: '0 2px 8px rgba(99,102,241,0.12)' }
                : { color: '#94a3b8', border: '1.5px solid transparent' }
              }
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="glass-card p-8"
        >
          <div className="mb-7 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.18, type: 'spring', stiffness: 220, damping: 18 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1.5px solid #c7d2fe', boxShadow: '0 4px 16px rgba(99,102,241,0.14)' }}>
              <KeyRound className="w-6 h-6" style={{ color: '#4f46e5' }} />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
              {role === 'faculty' ? 'Faculty Registration' : 'Student Registration'}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: '#64748b' }}>
              Fill your details and register your biometric passkey
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-5 rounded-xl px-4 py-3 flex items-start gap-3"
                style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
                <p className="flex-1 text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                <button onClick={() => setError('')}><X className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-4" noValidate>
            <AnimatePresence mode="wait">
              {role === 'student' ? (
                <motion.div key="student" className="space-y-4"
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}>
                  <Field label="Full Name">
                    <input type="text" placeholder="Enter your full name" required
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      onFocus={() => setFocusField('fn')} onBlur={() => setFocusField('')}
                      style={focusStyle('fn')} />
                  </Field>
                  <Field label="Roll Number">
                    <input type="text" placeholder="Enter your roll number" required
                      value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                      onFocus={() => setFocusField('rn')} onBlur={() => setFocusField('')}
                      style={focusStyle('rn')} />
                  </Field>
                  <Field label="College Mail ID">
                    <input type="email" placeholder="Enter your college mail ID" required
                      value={studentEmail} onChange={e => setStudentEmail(e.target.value)}
                      autoComplete="email"
                      onFocus={() => setFocusField('se')} onBlur={() => setFocusField('')}
                      style={focusStyle('se')} />
                  </Field>
                  <Field label="College Passkey">
                    <input type="password" placeholder="Enter your college passkey" required
                      value={studentPasskey} onChange={e => setStudentPasskey(e.target.value)}
                      autoComplete="off"
                      onFocus={() => setFocusField('sp')} onBlur={() => setFocusField('')}
                      style={focusStyle('sp')} />
                  </Field>
                </motion.div>
              ) : (
                <motion.div key="faculty" className="space-y-4"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}>
                  <Field label="Faculty Name">
                    <input type="text" placeholder="Enter your full name" required
                      value={facultyName} onChange={e => setFacultyName(e.target.value)}
                      onFocus={() => setFocusField('fnam')} onBlur={() => setFocusField('')}
                      style={focusStyle('fnam')} />
                  </Field>
                  <Field label="Department">
                    <select required value={department} onChange={e => setDepartment(e.target.value)}
                      onFocus={() => setFocusField('dept')} onBlur={() => setFocusField('')}
                      style={selectStyle('dept', department)}>
                      <option value="" disabled>Select your department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Branch">
                    <select required value={branch} onChange={e => setBranch(e.target.value)}
                      onFocus={() => setFocusField('br')} onBlur={() => setFocusField('')}
                      style={selectStyle('br', branch)}>
                      <option value="" disabled>Select your branch</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Mail ID">
                    <input type="email" placeholder="Enter your mail ID" required
                      value={facultyEmail} onChange={e => setFacultyEmail(e.target.value)}
                      autoComplete="email"
                      onFocus={() => setFocusField('fe')} onBlur={() => setFocusField('')}
                      style={focusStyle('fe')} />
                  </Field>
                  <Field label="College Passkey">
                    <input type="password" placeholder="Enter your college passkey" required
                      value={facultyPasskey} onChange={e => setFacultyPasskey(e.target.value)}
                      autoComplete="off"
                      onFocus={() => setFocusField('fp')} onBlur={() => setFocusField('')}
                      style={focusStyle('fp')} />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 mt-2">
              <motion.button type="button" onClick={() => { if (validate()) doEnroll(null); }}
                disabled={loading}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="glass-btn-primary overflow-hidden" style={{ position: 'relative' }}>
                {loading && (
                  <span className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
                    backgroundSize: '300% 100%', animation: 'shimmer 1.6s linear infinite',
                  }} />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Waiting for passkey…</span></>
                    : <><Monitor className="w-4 h-4" /><span>Register on This Device</span></>
                  }
                </span>
              </motion.button>

              <motion.button type="button" onClick={handleGenerateQR} disabled={loading}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
                className="w-full rounded-xl py-3 px-6 font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: '#ffffff', border: '1.5px solid #c7d2fe',
                  color: '#4f46e5', boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
                  cursor: 'pointer',
                }}>
                <QrCode className="w-4 h-4" />
                Register via QR on Phone
              </motion.button>
            </div>
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="mt-6 text-center text-sm" style={{ color: '#64748b' }}>
            Already enrolled?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#4f46e5' }}>Sign in →</Link>
          </motion.div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-4 text-xs text-center flex items-center justify-center gap-1.5"
          style={{ color: '#94a3b8' }}>
          <Fingerprint className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
          FIDO2 · WebAuthn · Your biometric never leaves your device
        </motion.p>
      </div>

      {WAVE}

      {/* ── QR Modal ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div key="qr-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(15,23,42,0.50)', backdropFilter: 'blur(8px)' }}
            onClick={closeQRModal}
          >
            <motion.div key="qr-card"
              initial={{ scale: 0.87, opacity: 0, y: 18 }}
              animate={{ scale: 1,    opacity: 1, y: 0 }}
              exit={  { scale: 0.87,  opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#ffffff', borderRadius: 20,
                boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(99,102,241,0.12)',
                border: '1px solid #e2e8f0', width: '100%', maxWidth: 360, overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4"
                style={{ background: 'linear-gradient(135deg, #eef2ff, #f0f9ff)', borderBottom: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 10px rgba(99,102,241,0.28)' }}>
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#0f172a' }}>Register on Your Phone</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>Scan to use Face ID / fingerprint</p>
                  </div>
                </div>
                <button onClick={closeQRModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center px-6 py-6">
                <p className="text-xs text-center mb-4 leading-relaxed" style={{ color: '#64748b' }}>
                  Scan this QR with your phone camera. Your details are pre-filled — just tap the biometric button on your phone.
                </p>

                <div className="p-4 rounded-2xl mb-4"
                  style={{ background: '#ffffff', border: '2px solid #e2e8f0', boxShadow: '0 4px 24px rgba(99,102,241,0.10)' }}>
                  <QRCodeSVG value={qrUrl} size={180} bgColor="#ffffff" fgColor="#0f172a" level="M" includeMargin={false} />
                </div>

                {/* Steps */}
                <div className="w-full space-y-2">
                  {[
                    'Open your phone camera and scan the QR',
                    'Your details will be pre-filled automatically',
                    'Tap "Use Face ID / Fingerprint" on your phone',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-xl"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff' }}>
                        {i + 1}
                      </span>
                      <p className="text-xs" style={{ color: '#475569' }}>{step}</p>
                    </div>
                  ))}
                </div>

                {/* Polling indicator */}
                {qrPolling && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl"
                    style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                      <Clock className="w-4 h-4" style={{ color: '#6366f1' }} />
                    </motion.div>
                    <span className="text-xs font-semibold" style={{ color: '#4f46e5' }}>
                      Waiting for phone to complete…
                    </span>
                  </motion.div>
                )}

                <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>
                  QR expires in 10 minutes · FIDO2 secured
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
