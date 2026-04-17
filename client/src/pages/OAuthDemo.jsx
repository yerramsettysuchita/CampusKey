import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, CheckCircle2, Circle, ChevronRight,
  Globe, BookOpen, Library, Wifi, FlaskConical, GraduationCap,
  Shield, Key, User, Server, ArrowRight, Zap,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

// ── OAuth Flow Steps ──────────────────────────────────────────────────────────
const FLOW_STEPS = [
  {
    id: 1,
    from: 'Campus ERP',
    to: 'CampusKey',
    arrow: '→',
    label: 'Authorization Request',
    color: '#6366f1',
    bgColor: '#eef2ff',
    payload: {
      GET: '/oauth/authorize',
      client_id: 'campus-erp-prod',
      redirect_uri: 'https://erp.college.edu/callback',
      response_type: 'code',
      scope: 'openid profile',
      state: 'xK9mP2rT',
    },
    description: 'ERP redirects the student to CampusKey for authentication',
  },
  {
    id: 2,
    from: 'CampusKey',
    to: 'Student Device',
    arrow: '→',
    label: 'Biometric Challenge',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    payload: {
      type: 'webauthn.get',
      challenge: 'a3f8c2d1e9b4...',
      rpId: 'campuskey.edu',
      userVerification: 'required',
      allowCredentials: [{ type: 'public-key', id: 'credId...' }],
    },
    description: "CampusKey challenges the student's registered device fingerprint/Face ID",
  },
  {
    id: 3,
    from: 'Student Device',
    to: 'CampusKey',
    arrow: '→',
    label: 'WebAuthn Assertion',
    color: '#059669',
    bgColor: '#ecfdf5',
    payload: {
      type: 'webauthn.get',
      authenticatorData: 'SZYN5Yo...',
      clientDataJSON: 'eyJ0eXBlIjoic...',
      signature: 'MEYCIQDx...',
      userHandle: 'usr_1234',
    },
    description: 'Device signs the challenge with the private key — no password ever leaves the device',
  },
  {
    id: 4,
    from: 'CampusKey',
    to: 'Campus ERP',
    arrow: '→',
    label: 'Authorization Code',
    color: '#d97706',
    bgColor: '#fffbeb',
    payload: {
      redirect: 'https://erp.college.edu/callback',
      code: 'f3a9c1b2d4e5...',
      state: 'xK9mP2rT',
      expires_in: '300s',
    },
    description: 'CampusKey issues a one-time short-lived authorization code to the ERP',
  },
  {
    id: 5,
    from: 'Campus ERP',
    to: 'CampusKey',
    arrow: '→',
    label: 'Token Exchange',
    color: '#0891b2',
    bgColor: '#ecfeff',
    payload: {
      POST: '/oauth/token',
      grant_type: 'authorization_code',
      code: 'f3a9c1b2d4e5...',
      redirect_uri: 'https://erp.college.edu/callback',
    },
    description: 'ERP server-side exchanges the code for tokens (never exposed to browser)',
  },
  {
    id: 6,
    from: 'CampusKey',
    to: 'Campus ERP',
    arrow: '→',
    label: 'Identity Tokens',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    payload: {
      access_token: 'eyJhbGciOiJIUzI1NiJ9...',
      id_token: 'eyJzdWIiOiJ1c3JfMTIzNCIsIm5hbWUi...',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile',
    },
    description: 'CampusKey returns JWT access & ID tokens. ERP can call /oauth/userinfo anytime.',
  },
];

const CAMPUS_SYSTEMS = [
  { icon: Server, name: 'College ERP', desc: 'Attendance, grades, fees — one login', color: '#6366f1' },
  { icon: BookOpen, name: 'LMS / Moodle', desc: 'Course materials and assignments', color: '#7c3aed' },
  { icon: Library, name: 'Digital Library', desc: 'E-books, journals, reservations', color: '#0891b2' },
  { icon: FlaskConical, name: 'Lab Booking', desc: 'Reserve equipment and time slots', color: '#059669' },
  { icon: Wifi, name: 'Campus Wi-Fi', desc: 'Automatic network authentication', color: '#d97706' },
  { icon: GraduationCap, name: 'Placement Portal', desc: 'Job listings and applications', color: '#dc2626' },
];

const OIDC_CONFIG = `{
  "issuer": "https://campuskey-api.onrender.com",
  "authorization_endpoint": "https://campuskey-api.onrender.com/oauth/authorize",
  "token_endpoint": "https://campuskey-api.onrender.com/oauth/token",
  "userinfo_endpoint": "https://campuskey-api.onrender.com/oauth/userinfo",
  "response_types_supported": ["code"],
  "scopes_supported": ["openid", "profile", "email"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["HS256"],
  "claims_supported": ["sub", "name", "email", "role"]
}`;

// ── Components ─────────────────────────────────────────────────────────────────
function StepCard({ step, active, done, index }) {
  return (
    <motion.div
      layout
      style={{
        background: done ? step.bgColor : active ? '#fff' : '#f8fafc',
        border: `2px solid ${done ? step.color : active ? step.color : '#e2e8f0'}`,
        borderRadius: 16,
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.4s, border-color 0.4s',
      }}
    >
      {/* step number badge */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        width: 28, height: 28, borderRadius: '50%',
        background: done ? step.color : active ? step.color : '#cbd5e1',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.4s',
      }}>
        {done
          ? <CheckCircle2 size={16} color="#fff" />
          : <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{index + 1}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: done || active ? step.color : '#94a3b8', textTransform: 'uppercase',
        }}>
          {step.from} {step.arrow} {step.to}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
        {step.label}
      </div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: (active || done) ? 14 : 0, lineHeight: 1.5 }}>
        {step.description}
      </div>

      <AnimatePresence>
        {(active || done) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{
              background: '#0f172a', borderRadius: 10, padding: '12px 16px',
              fontFamily: 'monospace', fontSize: 12, color: '#94a3b8',
              overflowX: 'auto', lineHeight: 1.6,
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(step.payload, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OAuthDemo() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(-1); // -1 = not started
  const [running, setRunning] = useState(false);

  function runFlow() {
    if (running) return;
    setRunning(true);
    setActiveStep(0);

    FLOW_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setActiveStep(i);
        if (i === FLOW_STEPS.length - 1) {
          setTimeout(() => setRunning(false), 1200);
        }
      }, i * 1400);
    });
  }

  function reset() {
    setActiveStep(-1);
    setRunning(false);
  }

  const allDone = activeStep >= FLOW_STEPS.length - 1 && !running;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: 14, fontWeight: 500,
            padding: '8px 12px', borderRadius: 8,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>CampusKey SSO</span>
        </div>
        <div style={{ width: 120 }} />
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Hero */}
        <motion.div {...fadeUp(0)} style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#eef2ff', border: '1px solid #c7d2fe',
            borderRadius: 999, padding: '6px 16px', marginBottom: 20,
          }}>
            <Key size={14} color="#6366f1" />
            <span style={{ color: '#6366f1', fontSize: 13, fontWeight: 600 }}>
              OAuth 2.0 / OpenID Connect
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800,
            color: '#1e293b', lineHeight: 1.15, marginBottom: 16,
          }}>
            CampusKey as your<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Campus Identity Provider
            </span>
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            One biometric login grants access to every campus system — ERP, LMS, Library, Wi-Fi.
            No more juggling 6 different passwords.
          </p>
        </motion.div>

        {/* Flow Simulator */}
        <motion.div {...fadeUp(0.1)} style={{
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 20, padding: '36px 40px', marginBottom: 48,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                OAuth 2.0 Flow Simulator
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                Watch exactly how a campus ERP authenticates a student via CampusKey
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {activeStep >= 0 && (
                <button
                  onClick={reset}
                  style={{
                    padding: '10px 20px', borderRadius: 10, fontWeight: 600,
                    fontSize: 14, cursor: 'pointer', border: '1.5px solid #e2e8f0',
                    background: '#fff', color: '#64748b',
                  }}
                >
                  Reset
                </button>
              )}
              <button
                onClick={runFlow}
                disabled={running}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 10, fontWeight: 700,
                  fontSize: 14, cursor: running ? 'not-allowed' : 'pointer',
                  border: 'none',
                  background: running
                    ? '#e2e8f0'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: running ? '#94a3b8' : '#fff',
                  transition: 'all 0.2s',
                }}
              >
                <Play size={16} />
                {running ? 'Simulating…' : allDone ? 'Replay Flow' : 'Simulate OAuth Flow'}
              </button>
            </div>
          </div>

          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: '#f0fdf4', border: '1.5px solid #86efac',
                borderRadius: 12, padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 24,
              }}
            >
              <CheckCircle2 size={20} color="#16a34a" />
              <div>
                <span style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>
                  Authentication Complete!
                </span>
                <span style={{ color: '#166534', fontSize: 13, marginLeft: 8 }}>
                  Student is now logged into the ERP — zero passwords used.
                </span>
              </div>
            </motion.div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FLOW_STEPS.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                active={activeStep === i}
                done={activeStep > i}
              />
            ))}
          </div>
        </motion.div>

        {/* Campus Systems Grid */}
        <motion.div {...fadeUp(0.15)} style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
            Supported Campus Systems
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
            Any system that speaks OAuth 2.0 / OpenID Connect can integrate in under 30 minutes.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {CAMPUS_SYSTEMS.map((sys, i) => (
              <motion.div key={sys.name} {...fadeUp(0.05 * i)} style={{
                background: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: 14, padding: '20px 22px',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                transition: 'box-shadow 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 4px 20px ${sys.color}22`;
                  e.currentTarget.style.borderColor = sys.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `${sys.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <sys.icon size={20} color={sys.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15, marginBottom: 3 }}>
                    {sys.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                    {sys.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* OIDC Discovery Document */}
        <motion.div {...fadeUp(0.2)} style={{
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 20, padding: '36px 40px', marginBottom: 48,
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Globe size={20} color="#6366f1" />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              OpenID Connect Discovery
            </h2>
            <span style={{
              fontSize: 11, fontWeight: 700, background: '#eef2ff', color: '#6366f1',
              borderRadius: 6, padding: '3px 8px', letterSpacing: '0.06em',
            }}>LIVE ENDPOINT</span>
          </div>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
            Any OIDC-compatible system can auto-discover CampusKey's endpoints from this standard URL:
          </p>
          <div style={{
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '10px 16px', marginBottom: 20,
            fontFamily: 'monospace', fontSize: 13, color: '#6366f1', fontWeight: 600,
          }}>
            GET /.well-known/openid-configuration
          </div>
          <div style={{
            background: '#0f172a', borderRadius: 12, padding: '20px 24px',
            fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0',
            overflowX: 'auto', lineHeight: 1.7,
          }}>
            <pre style={{ margin: 0 }}>{OIDC_CONFIG}</pre>
          </div>
        </motion.div>

        {/* Why SSO banner */}
        <motion.div {...fadeUp(0.25)} style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: 20, padding: '40px 48px',
          display: 'flex', flexWrap: 'wrap', gap: 32,
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Ready to integrate your campus?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, margin: 0, maxWidth: 420 }}>
              CampusKey acts as a drop-in OpenID Connect provider. Your ERP just needs a client ID
              and two redirect URLs — it takes under 30 minutes to wire up.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/deployment-guide')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#fff', color: '#6366f1',
                border: 'none', borderRadius: 12, padding: '12px 24px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Deployment Guide <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: 12, padding: '12px 24px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Admin Dashboard <Zap size={16} />
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
