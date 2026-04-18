import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldPlus, ShieldCheck, GraduationCap, BookOpen, Fingerprint,
  KeyRound, Loader2, AlertCircle, X, QrCode, Monitor,
  CheckCircle2, Smartphone, Clock, Mail, ArrowRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import FloatingOrbs from '../components/FloatingOrbs';
import VerificationCodeInput from '../components/VerificationCodeInput';
import { useAuth }  from '../context/AuthContext';
import { enrollPasskey } from '../lib/webauthn';
import { api, BASE } from '../lib/api';
import { sendVerificationCode, verifyCode } from '../lib/api';

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

// Step indicator shown above the card
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: 'Details' },
    { n: 2, label: 'Verify'  },
    { n: 3, label: 'Passkey' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
      {steps.map(({ n, label }, i) => {
        const done   = n < current;
        const active = n === current;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <motion.div
                animate={{ scale: active ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13,
                  background: done || active ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#f1f5f9',
                  color: done || active ? '#fff' : '#94a3b8',
                  border: active ? '3px solid rgba(99,102,241,0.25)' : '3px solid transparent',
                  boxShadow: active ? '0 4px 14px rgba(99,102,241,0.30)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {done ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : n}
              </motion.div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                color: active ? '#4f46e5' : done ? '#6366f1' : '#94a3b8',
                transition: 'color 0.3s',
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 52, height: 2, marginBottom: 18, marginLeft: 6, marginRight: 6,
                borderRadius: 2,
                background: done ? 'linear-gradient(90deg, #6366f1, #4f46e5)' : '#e2e8f0',
                transition: 'background 0.4s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Enroll() {
  const navigate       = useNavigate();
  const { login }      = useAuth();
  const [searchParams] = useSearchParams();
  const pollingRef     = useRef(null);

  const isFromQR = searchParams.get('qr') === '1';

  // ── Multi-step state ───────────────────────────────────────────────────────
  const [step,          setStep]          = useState(1);
  const [role,          setRole]          = useState('student');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [focusField,    setFocusField]    = useState('');

  // QR modal
  const [showQRModal,   setShowQRModal]   = useState(false);
  const [qrUrl,         setQrUrl]         = useState('');
  const [qrPolling,     setQrPolling]     = useState(false);
  const [phoneSuccess,  setPhoneSuccess]  = useState(false);

  // Step 1 — Details
  const [fullName,     setFullName]     = useState('');
  const [rollNumber,   setRollNumber]   = useState('');
  const [email,        setEmail]        = useState('');
  const [department,   setDepartment]   = useState('');
  const [branch,       setBranch]       = useState('');

  // Step 2 — Verification
  const [codeLoading,  setCodeLoading]  = useState(false);
  const [codeError,    setCodeError]    = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');

  // Step 3 — Passkey creation
  const [passLoading,  setPassLoading]  = useState(false);

  // Pre-fill from QR URL params (phone landing)
  useEffect(() => {
    if (!isFromQR) return;
    const r = searchParams.get('role') || 'student';
    setRole(r);
    setFullName(searchParams.get('name') || '');
    setEmail(searchParams.get('email') || '');
    setRollNumber(searchParams.get('rn') || '');
    setDepartment(searchParams.get('dept') || '');
    setBranch(searchParams.get('br') || '');
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

  // ── Step 1 validation ──────────────────────────────────────────────────────
  function validateStep1() {
    if (!fullName.trim()) { setError('Please enter your full name.'); return false; }
    if (!email.trim())    { setError('Please enter your campus email.'); return false; }
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return false; }
    if (role === 'student' && !rollNumber.trim()) { setError('Please enter your roll number.'); return false; }
    if (!department)      { setError('Please select your department.'); return false; }
    return true;
  }

  // ── Step 1 submit: send verification code ─────────────────────────────────
  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const result = await sendVerificationCode(email.trim().toLowerCase(), 'registration', fullName.trim(), role);
      if (result.success) {
        setStep(2);
      } else {
        setError(result.error || 'Failed to send verification code. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify the 6-digit code ───────────────────────────────────────
  async function handleVerifyCode(code) {
    setCodeError('');
    setCodeLoading(true);
    try {
      const result = await verifyCode(email.trim().toLowerCase(), code, 'registration');
      if (result.success && result.verifiedToken) {
        setVerifiedToken(result.verifiedToken);
        setStep(3);
      } else {
        setCodeError(result.error || 'Verification failed. Please try again.');
      }
    } catch {
      setCodeError('Network error. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  }

  async function handleResendCode() {
    setCodeError('');
    try {
      await sendVerificationCode(email.trim().toLowerCase(), 'registration', fullName.trim(), role);
    } catch {
      setCodeError('Could not resend code. Please try again.');
    }
  }

  // ── Step 3: create passkey on this device ─────────────────────────────────
  function getEnrollData(sessionId, overrideToken) {
    return {
      email        : email.trim().toLowerCase(),
      verified_token: overrideToken || verifiedToken,
      name         : fullName.trim(),
      role,
      roll_number  : role === 'student' ? rollNumber.trim() : undefined,
      department   : department || undefined,
      branch       : branch || undefined,
      sessionId,
    };
  }

  async function doEnroll(sessionId) {
    setError('');
    setPassLoading(true);
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
      setPassLoading(false);
    }
  }

  // ── Desktop: generate QR + start polling (step 3 only) ───────────────────
  async function handleGenerateQR() {
    setError('');
    try {
      const { sessionId } = await api.qrSessionCreate();
      const d = getEnrollData(sessionId);
      const params = new URLSearchParams({
        qr: '1', role: d.role, name: d.name, email: d.email,
        vt: d.verified_token, sid: sessionId,
      });
      if (d.roll_number) params.set('rn', d.roll_number);
      if (d.department)  params.set('dept', d.department);
      if (d.branch)      params.set('br', d.branch);

      // If running on localhost, swap in the LAN IP so the phone can reach it
      let qrBase = window.location.origin;
      const h = window.location.hostname;
      if (h === 'localhost' || h === '127.0.0.1') {
        try {
          const { ip } = await fetch(`${BASE}/api/lan-ip`).then(r => r.json());
          if (ip) qrBase = `http://${ip}:${window.location.port || 3000}`;
        } catch { /* fall back to localhost — QR won't reach phone but won't crash */ }
      }

      setQrUrl(`${qrBase}/enroll?${params.toString()}`);
      setShowQRModal(true);
      setQrPolling(true);

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
        } catch { /* network blip */ }
      }, 2500);
    } catch {
      setError('Could not create QR session. Please try again.');
    }
  }

  function closeQRModal() {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setShowQRModal(false);
    setQrPolling(false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PHONE LANDING (arrived via QR scan) — unchanged from original
  // ════════════════════════════════════════════════════════════════════════════
  if (isFromQR) {
    const sid = searchParams.get('sid');
    const qrRole = searchParams.get('role') || 'student';
    const vtParam = searchParams.get('vt'); // new verified_token from QR
    const cpParam = searchParams.get('cp'); // legacy bootstrap_code from QR

    const detailRows = [
      ['Name',  searchParams.get('name')],
      ['Email', searchParams.get('email')],
      ['Role',  qrRole.charAt(0).toUpperCase() + qrRole.slice(1)],
      ...(qrRole === 'student'
        ? [['Roll No', searchParams.get('rn')]]
        : [['Department', searchParams.get('dept')], ['Branch', searchParams.get('br')]]),
    ].filter(([, v]) => v);

    async function doQREnroll() {
      setError('');
      setLoading(true);
      try {
        const enrollData = {
          email          : (searchParams.get('email') || '').trim().toLowerCase(),
          verified_token : vtParam || undefined,
          bootstrap_code : !vtParam ? cpParam : undefined,
          name           : searchParams.get('name') || '',
          role           : qrRole,
          roll_number    : searchParams.get('rn') || undefined,
          department     : searchParams.get('dept') || undefined,
          branch         : searchParams.get('br') || undefined,
          sessionId      : sid,
        };
        const result = await enrollPasskey(enrollData);
        if (result.success) setPhoneSuccess(true);
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

    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #eef2ff 0%, #f8fafc 50%, #f0f9ff 100%)',
        overflowX: 'hidden',
      }}>
        <FloatingOrbs />

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

        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 20px 32px', position: 'relative', zIndex: 10 }}
        >
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

          {!phoneSuccess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

              <div style={{ background: '#fff', borderRadius: 20, padding: '4px 0', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {detailRows.map(([k, v], i) => (
                  <div key={k} style={{ padding: '11px 20px', borderBottom: i < detailRows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{k}</span>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{v}</span>
                  </div>
                ))}
              </div>

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

              <motion.button
                onClick={doQREnroll}
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
  //  DESKTOP 3-STEP REGISTRATION
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #f8fafc 55%, #f0f9ff 100%)' }}>
      <FloatingOrbs />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 mb-6 text-center"
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
        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="glass-card p-5 sm:p-8"
        >
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Details ─────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                    style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1.5px solid #c7d2fe', boxShadow: '0 4px 16px rgba(99,102,241,0.14)' }}>
                    <KeyRound className="w-6 h-6" style={{ color: '#4f46e5' }} />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>Create your account</h1>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>Enter your campus details to get started</p>
                </div>

                {/* Role toggle */}
                <div className="flex gap-2 p-1 rounded-xl mb-5"
                  style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
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
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3"
                      style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
                      <p className="flex-1 text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                      <button onClick={() => setError('')}><X className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form className="space-y-4" onSubmit={handleSendCode} noValidate>
                  <Field label="Full Name">
                    <input type="text" placeholder="Enter your full name" required
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      onFocus={() => setFocusField('fn')} onBlur={() => setFocusField('')}
                      style={focusStyle('fn')} />
                  </Field>

                  {role === 'student' && (
                    <Field label="Roll Number">
                      <input type="text" placeholder="e.g. CSE21001" required
                        value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                        onFocus={() => setFocusField('rn')} onBlur={() => setFocusField('')}
                        style={focusStyle('rn')} />
                    </Field>
                  )}

                  <Field label="Campus Email">
                    <input type="email" placeholder="Enter your campus email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      onFocus={() => setFocusField('em')} onBlur={() => setFocusField('')}
                      style={focusStyle('em')} />
                  </Field>

                  <Field label="Department">
                    <select required value={department} onChange={e => setDepartment(e.target.value)}
                      onFocus={() => setFocusField('dept')} onBlur={() => setFocusField('')}
                      style={selectStyle('dept', department)}>
                      <option value="" disabled>Select your department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>

                  {role === 'faculty' && (
                    <Field label="Branch">
                      <select required value={branch} onChange={e => setBranch(e.target.value)}
                        onFocus={() => setFocusField('br')} onBlur={() => setFocusField('')}
                        style={selectStyle('br', branch)}>
                        <option value="" disabled>Select your branch</option>
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </Field>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="glass-btn-primary"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending code…</span></>
                        : <><Mail className="w-4 h-4" /><span>Send verification code</span></>
                      }
                    </span>
                  </motion.button>
                </form>

                <div className="mt-5 text-center text-sm" style={{ color: '#64748b' }}>
                  Already enrolled?{' '}
                  <Link to="/login" className="font-semibold" style={{ color: '#4f46e5' }}>Sign in →</Link>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Verify email ─────────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                    style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1.5px solid #c7d2fe', boxShadow: '0 4px 16px rgba(99,102,241,0.14)' }}>
                    <Mail className="w-6 h-6" style={{ color: '#4f46e5' }} />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>Check your inbox</h1>
                  <p className="text-sm mt-1.5" style={{ color: '#64748b', lineHeight: 1.6 }}>
                    We sent a 6-digit code to<br />
                    <strong style={{ color: '#0f172a' }}>{email}</strong>
                  </p>
                </div>

                <VerificationCodeInput
                  length={6}
                  onComplete={handleVerifyCode}
                  onResend={handleResendCode}
                  isLoading={codeLoading}
                  error={codeError}
                />

                {codeLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-4 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#6366f1' }} />
                    <span className="text-sm" style={{ color: '#64748b' }}>Verifying code…</span>
                  </motion.div>
                )}

                <button type="button" onClick={() => { setStep(1); setCodeError(''); }}
                  className="mt-4 w-full text-center text-sm"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  ← Back to details
                </button>
              </motion.div>
            )}

            {/* ── STEP 3: Create Passkey ───────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="step3"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6 text-center">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 8px 28px rgba(99,102,241,0.32)' }}>
                    <Fingerprint className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>Set up your passkey</h1>
                  <p className="text-sm mt-1.5" style={{ color: '#64748b', lineHeight: 1.6 }}>
                    Your biometric becomes your password.<br />It never leaves your device.
                  </p>
                </div>

                {/* Supported methods */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    { label: 'Touch ID',         emoji: '☝️' },
                    { label: 'Face ID',           emoji: '🤳' },
                    { label: 'Windows Hello',     emoji: '🪟' },
                    { label: 'Android Biometric', emoji: '🔏' },
                  ].map(({ label, emoji }) => (
                    <div key={label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                      <span style={{ fontSize: 16 }}>{emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: '#475569' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3"
                      style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
                      <p className="flex-1 text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                      <button onClick={() => setError('')}><X className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <motion.button
                    type="button"
                    onClick={() => doEnroll(null)}
                    disabled={passLoading}
                    whileTap={{ scale: 0.97 }}
                    className="glass-btn-primary"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {passLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Waiting for passkey…</span></>
                        : <><Monitor className="w-4 h-4" /><span>Create passkey on this device</span></>
                      }
                    </span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleGenerateQR}
                    disabled={passLoading}
                    className="w-full rounded-xl py-3 px-6 font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                    style={{
                      background: '#ffffff', border: '1.5px solid #c7d2fe',
                      color: '#4f46e5', boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
                      cursor: 'pointer',
                    }}>
                    <QrCode className="w-4 h-4" />
                    Register on Phone via QR
                  </motion.button>
                </div>

                <div className="mt-5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                    <span className="text-xs" style={{ color: '#94a3b8' }}>
                      Secured by FIDO2 · No passwords stored
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
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
                  Scan this QR with your phone camera. Your identity is already verified — just tap the biometric button on your phone.
                </p>

                <div className="p-4 rounded-2xl mb-4"
                  style={{ background: '#ffffff', border: '2px solid #e2e8f0', boxShadow: '0 4px 24px rgba(99,102,241,0.10)' }}>
                  <QRCodeSVG value={qrUrl} size={180} bgColor="#ffffff" fgColor="#0f172a" level="M" includeMargin={false} />
                </div>

                <div className="w-full space-y-2">
                  {[
                    'Open your phone camera and scan the QR',
                    'Your verified identity is pre-filled automatically',
                    'Tap "Tap to Authenticate" on your phone',
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

                {qrPolling && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl"
                    style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
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
