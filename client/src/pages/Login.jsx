import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fingerprint, GraduationCap, BookOpen, ShieldCheck,
  AlertCircle, X, Loader2, ScanFace, Scan, CheckCircle2, MapPin, Clock as ClockIcon, Monitor as MonitorIcon, Smartphone as SmartphoneIcon,
} from 'lucide-react';
import FloatingOrbs from '../components/FloatingOrbs';
import QRAuthModal  from '../components/QRAuthModal';
import { useAuth }  from '../context/AuthContext';
import { loginWithPasskey } from '../lib/webauthn';

const WAVE = (
  <div className="wave-footer">
    <svg viewBox="0 0 1440 90" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 45 Q360 5 720 45 Q1080 85 1440 45 L1440 90 L0 90 Z" fill="rgba(99,102,241,0.06)" />
      <path d="M0 60 Q360 20 720 60 Q1080 100 1440 60 L1440 90 L0 90 Z" fill="rgba(99,102,241,0.035)" />
    </svg>
  </div>
);

// Animated biometric scanner rings
function BiometricScanner({ scanning }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      {/* Outer pulse rings — only when scanning */}
      {scanning && [1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ border: '2px solid rgba(99,102,241,0.35)', width: 120 + i * 28, height: 120 + i * 28 }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        />
      ))}

      {/* Idle soft rings */}
      {!scanning && [1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ border: '1.5px solid rgba(99,102,241,0.15)', width: 120 + i * 24, height: 120 + i * 24 }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
        />
      ))}

      {/* Center circle */}
      <motion.div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 96, height: 96,
          background: scanning
            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
            : 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
          border: '2px solid',
          borderColor: scanning ? '#818cf8' : '#c7d2fe',
          boxShadow: scanning
            ? '0 0 32px rgba(99,102,241,0.50), 0 8px 24px rgba(99,102,241,0.30)'
            : '0 4px 20px rgba(99,102,241,0.14)',
        }}
        animate={scanning ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Fingerprint
          className="w-12 h-12"
          style={{ color: scanning ? '#ffffff' : '#6366f1' }}
        />
        {/* Scan line */}
        {scanning && (
          <motion.div
            className="absolute left-3 right-3 rounded-full"
            style={{ height: 2, background: 'rgba(255,255,255,0.7)', top: '20%' }}
            animate={{ top: ['20%', '75%', '20%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email,      setEmail]      = useState('');
  const [role,       setRole]       = useState(sessionStorage.getItem('ck_role') || 'student');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showQR,     setShowQR]     = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [verified,   setVerified]   = useState(null); // contextual push auth confirmation

  function getDeviceLabel() {
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua))       return { label: 'Android Phone',  Icon: SmartphoneIcon };
    if (/iPhone|iPad/i.test(ua))   return { label: 'iPhone / iPad',  Icon: SmartphoneIcon };
    if (/Windows/i.test(ua))       return { label: 'Windows PC',     Icon: MonitorIcon    };
    if (/Macintosh/i.test(ua))     return { label: 'Mac',            Icon: MonitorIcon    };
    return { label: 'Your Device', Icon: MonitorIcon };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your campus email.'); return; }
    setError('');
    setLoading(true);

    try {
      const result = await loginWithPasskey(email.trim().toLowerCase());
      if (result.success) {
        const device = getDeviceLabel();
        setVerified({ user: result.user, token: result.token, device, time: new Date() });
        setLoading(false);
        setTimeout(() => {
          login(result.user, result.token, result.user?.role || role);
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    } catch (err) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Biometric prompt was dismissed. Please try again.'
          : err.message
      );
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #f8fafc 55%, #f0f9ff 100%)' }}
    >
      <FloatingOrbs />

      {/* ── Contextual Push Auth Confirmation ── */}
      <AnimatePresence>
        {verified && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative z-20 w-full max-w-sm mx-auto"
            style={{ background: '#fff', borderRadius: 24, padding: '36px 28px', boxShadow: '0 16px 56px rgba(99,102,241,0.16)', border: '1.5px solid #c7d2fe', textAlign: 'center' }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.15 }}
              style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '2px solid #86efac', boxShadow: '0 8px 24px rgba(22,163,74,0.20)' }}>
              <CheckCircle2 style={{ width: 36, height: 36, color: '#16a34a' }} />
            </motion.div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Login Verified</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
              Your biometric was verified successfully. You are being signed in now.
            </p>
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 16px', marginBottom: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { Icon: verified.device.Icon, label: 'Device',   value: verified.device.label },
                { Icon: ClockIcon,            label: 'Time',     value: verified.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST' },
                { Icon: MapPin,               label: 'Location', value: 'MSRUAS Campus Network' },
                { Icon: ShieldCheck,          label: 'Method',   value: 'FIDO2 Biometric Passkey' },
              ].map(({ Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon style={{ width: 14, height: 14, color: '#4f46e5', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#94a3b8', width: 60, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Loader2 style={{ width: 14, height: 14, color: '#4f46e5' }} className="animate-spin" />
              <span style={{ fontSize: 12, color: '#64748b' }}>Taking you to your dashboard…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo + full form — hidden while showing contextual verification screen */}
      {!verified && <>
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 mb-8 text-center"
      >
        <div className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 16px rgba(99,102,241,0.30)' }}>
            <Fingerprint className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            <span style={{ color: '#0f172a' }}>Campus</span>
            <span style={{ color: '#4f46e5' }}>Key</span>
          </span>
        </div>
        <div className="text-xs uppercase tracking-[0.22em] font-medium" style={{ color: '#94a3b8' }}>
          Passwordless Campus Auth
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

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="glass-card p-5 sm:p-8"
        >
          {/* Biometric scanner visual */}
          <div className="flex flex-col items-center mb-6">
            <BiometricScanner scanning={loading} />

            <motion.div className="mt-5 text-center"
              animate={loading ? { opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}>
              <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>
                {loading ? 'Scanning Biometric…' : 'Biometric Login'}
              </h1>
              <p className="text-sm mt-1.5" style={{ color: '#64748b' }}>
                {loading
                  ? 'Place your finger or look at the camera'
                  : 'Enter your email — authenticate with Face ID or fingerprint'}
              </p>
            </motion.div>
          </div>

          {/* Supported biometric methods */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[
              { icon: Fingerprint, label: 'Fingerprint' },
              { icon: ScanFace,    label: 'Face ID'     },
              { icon: Scan,        label: 'Windows Hello' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl flex-1"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', minWidth: 0 }}>
                <Icon className="w-5 h-5" style={{ color: '#6366f1' }} />
                <span className="text-xs font-semibold text-center" style={{ color: '#475569', lineHeight: 1.2 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>ENTER YOUR EMAIL</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3"
                style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
                <p className="flex-1 text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                <button onClick={() => setError('')}><X className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 6 }}>
                {role === 'faculty' ? 'Faculty Mail ID' : 'Campus Email'}
              </label>
              <input
                type="email"
                placeholder="Enter your campus email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                autoComplete="email webauthn"
                required
                style={{
                  width: '100%', borderRadius: 12, padding: '12px 16px',
                  background: emailFocus ? '#ffffff' : '#f8fafc',
                  border: emailFocus ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
                  boxShadow: emailFocus ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                  color: '#0f172a', fontSize: 14, outline: 'none',
                  transition: 'all 0.2s',
                }}
              />
            </div>

            {/* Biometric authenticate button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              className="w-full rounded-xl py-3.5 font-bold text-white flex items-center justify-center gap-2.5 relative overflow-hidden"
              style={{
                background: loading
                  ? 'linear-gradient(135deg, #818cf8, #6366f1)'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                boxShadow: '0 6px 22px rgba(99,102,241,0.36)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15,
              }}
            >
              {/* Shimmer while scanning */}
              {loading && (
                <span className="absolute inset-0 pointer-events-none" style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.20) 50%, transparent 100%)',
                  backgroundSize: '300% 100%', animation: 'shimmer 1.4s linear infinite',
                }} />
              )}
              <span className="relative flex items-center gap-2.5">
                {loading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Scanning Biometric…</span></>
                  : <><Fingerprint className="w-5 h-5" /><span>Authenticate with Biometric</span></>
                }
              </span>
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm" style={{ color: '#64748b' }}>
            First time?{' '}
            <Link to="/enroll" className="font-semibold" style={{ color: '#4f46e5' }}>
              Register your passkey →
            </Link>
          </div>
        </motion.div>

        {/* Security badges */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-5 flex items-center gap-2 flex-wrap justify-center"
        >
          {['FIDO2', 'WebAuthn', 'RBI Compliant', 'No passwords stored'].map(badge => (
            <span key={badge} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <ShieldCheck className="w-3 h-3" style={{ color: '#6366f1' }} />
              {badge}
            </span>
          ))}
        </motion.div>
      </div>
      </>}

      {WAVE}

      <QRAuthModal
        open={showQR}
        qrValue={typeof window !== 'undefined' ? window.location.href : ''}
        onClose={loading ? null : () => setShowQR(false)}
      />
    </div>
  );
}
