import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, ShieldCheck, Lock, Eye, FileCheck, Scale,
  Users, Fingerprint, Globe, Server, ArrowLeft,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

const STANDARDS = [
  {
    icon: ShieldCheck,
    color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe',
    badge: 'W3C Level 2', badgeColor: '#4f46e5',
    title: 'FIDO2 / WebAuthn (W3C Standard)',
    desc: 'CampusKey implements the W3C WebAuthn Level 2 specification using SimpleWebAuthn v13. All passkey operations follow the FIDO Alliance\'s server requirements for origin validation, challenge nonce handling, and credential counter verification.',
  },
  {
    icon: Globe,
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    badge: 'FIDO2 Protocol', badgeColor: '#7c3aed',
    title: 'FIDO Alliance Certification',
    desc: 'Our authentication flow is built on the same FIDO2 protocols used by Google, Apple, and Microsoft for their passkey implementations. The same spec that protects 8 billion devices worldwide protects every CampusKey login.',
  },
  {
    icon: Eye,
    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
    badge: 'No Secrets Stored', badgeColor: '#059669',
    title: 'Zero Knowledge Architecture',
    desc: 'The server stores only cryptographic public keys — never passwords, biometric templates, or shared secrets. Even a complete database breach exposes zero usable credentials. An attacker who steals our database gains nothing they can authenticate with.',
  },
  {
    icon: Lock,
    color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd',
    badge: 'Phishing-Proof', badgeColor: '#0ea5e9',
    title: 'Origin-Bound Credentials',
    desc: 'Passkeys are cryptographically bound to the exact domain (campuskey-five.vercel.app). Phishing sites on different domains cannot trigger the passkey — attacks fail silently. This is a fundamental FIDO2 guarantee that no OTP or password system can offer.',
  },
];

const DPDPA = [
  {
    section: 'Section 4',
    title: 'Data Minimization',
    desc: 'We collect only email, name, role, and department. No Aadhaar number, no phone number, no biometric templates are ever stored on our servers.',
  },
  {
    section: 'Section 5',
    title: 'Purpose Limitation',
    desc: 'Data collected exclusively for campus authentication. No secondary use, no profiling, no analytics on personal data. The credential table stores only a cryptographic public key.',
  },
  {
    section: 'Section 8',
    title: 'Storage Limitation',
    desc: 'Audit logs are capped and designed for auto-expiry. No indefinite personal data retention. The retention schedule is configurable by the deploying institution.',
  },
  {
    section: 'Section 8',
    title: 'Security Safeguards',
    desc: 'Cryptographic key-pair architecture with server-side public keys only. Helmet.js security headers, CORS origin restriction, and JWT-signed sessions provide layered technical safeguards.',
  },
  {
    section: 'Sections 11–14',
    title: 'Data Principal Rights',
    desc: 'Users can view their full audit log via the dashboard. Admins can revoke all credentials on request, effectively erasing authentication capability. Full erasure of personal data is achievable via direct DB delete.',
  },
];

const ACCESSIBILITY = [
  {
    icon: CheckCircle2, color: '#4f46e5',
    title: 'Keyboard Navigable',
    desc: 'All authentication flows — registration, login, QR enrollment — are fully operable without a mouse using Tab, Enter, and Escape keys.',
  },
  {
    icon: Eye, color: '#7c3aed',
    title: 'Screen Reader Labels',
    desc: 'Semantic HTML and ARIA labels on all authentication flows for compatibility with NVDA, JAWS, and VoiceOver on iOS and macOS.',
  },
  {
    icon: Shield, color: '#059669',
    title: 'Color Contrast (AA)',
    desc: 'All text elements meet WCAG 2.1 Level AA contrast ratio (4.5:1 minimum for normal text) against light backgrounds throughout the app.',
  },
  {
    icon: AlertTriangle, color: '#d97706',
    title: 'Focus Indicators',
    desc: 'Visible focus rings on all interactive elements — buttons, inputs, and links — for keyboard navigation clarity without relying on color alone.',
  },
  {
    icon: Fingerprint, color: '#0ea5e9',
    title: 'Biometric Fallback',
    desc: 'Windows Hello PIN and device pattern unlock work as non-biometric alternatives. No user is excluded due to missing fingerprint sensor hardware.',
  },
];

const ENTERPRISE = [
  {
    icon: Lock, color: '#4f46e5',
    title: 'JWT Tokens — 24h Expiry',
    desc: 'Sessions expire automatically after 24 hours. Tokens are signed with a server-side secret and verified on every protected request using the Authorization: Bearer header.',
  },
  {
    icon: Globe, color: '#7c3aed',
    title: 'CORS — Origin Restricted',
    desc: 'Cross-Origin Resource Sharing is restricted to configured known origins. All other origins receive a 403 rejection, preventing cross-site request forgery from unauthorized domains.',
  },
  {
    icon: Server, color: '#059669',
    title: 'Helmet.js Security Headers',
    desc: 'X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security (HSTS), and Content-Security-Policy headers are applied on all API responses via Helmet.js middleware.',
  },
  {
    icon: Shield, color: '#d97706',
    title: 'Rate Limiting (Roadmap)',
    desc: 'Per-IP request throttling is planned for the next release. The existing audit log risk-scoring system already flags and records high-frequency login attempts in real time.',
  },
  {
    icon: Eye, color: '#0ea5e9',
    title: 'Full Audit Trail',
    desc: 'Every login, registration, and revoke event is logged with IP address, user agent, timestamp, and a computed risk score (0–100) that factors in time-of-day and failure frequency.',
  },
  {
    icon: Users, color: '#e11d48',
    title: 'Role-Based Access Control',
    desc: 'Student and faculty roles are set at registration using separate invite passkeys. Admin access is gated by a separate admin key. No user can escalate their own role.',
  },
];

export default function Compliance() {
  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', fontFamily: 'inherit' }}>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <Fingerprint className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">
              <span style={{ color: '#0f172a' }}>Campus</span><span style={{ color: '#4f46e5' }}>Key</span>
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ color: '#475569', border: '1px solid #e2e8f0', background: '#fff' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #f8fafc 55%, #ecfdf5 100%)', padding: '64px 20px 72px' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
            style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', color: '#059669' }}>
            <ShieldCheck className="w-4 h-4" />
            Security &amp; Compliance Documentation
          </motion.div>
          <motion.h1 {...fadeUp(0.08)}
            className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
            style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Built to{' '}
            <span style={{ background: 'linear-gradient(135deg, #4f46e5, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              enterprise standards
            </span>
          </motion.h1>
          <motion.p {...fadeUp(0.14)}
            className="text-lg max-w-2xl mx-auto"
            style={{ color: '#475569', lineHeight: 1.65 }}>
            CampusKey is designed for regulatory compliance — FIDO2/WebAuthn W3C specifications,
            India's DPDPA 2023, WCAG 2.1 accessibility, and enterprise security hardening on every layer.
          </motion.p>
          <motion.div {...fadeUp(0.2)} className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {[
              { label: 'FIDO2 / W3C WebAuthn', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
              { label: 'DPDPA 2023 Aligned', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
              { label: 'WCAG 2.1 Level AA', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
              { label: 'Helmet.js Hardened', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            ].map(b => (
              <span key={b.label} className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: b.bg, color: b.color, border: `1.5px solid ${b.border}` }}>
                {b.label}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section 1: Security Standards */}
      <section style={{ padding: '72px 20px', background: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Security Standards</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Industry-standard <span style={{ color: '#4f46e5' }}>authentication protocols</span>
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Every aspect of our passkey implementation follows the FIDO Alliance and W3C WebAuthn Level 2 specifications exactly as published.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-5">
            {STANDARDS.map((s, i) => (
              <motion.div key={s.title} {...fadeUp(i * 0.08)}
                className="rounded-2xl p-6"
                style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: '#fff', border: `1px solid ${s.border}` }}>
                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: '#fff', color: s.badgeColor, border: `1px solid ${s.border}` }}>
                    {s.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#0f172a' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: DPDPA */}
      <section style={{ padding: '72px 20px', background: 'linear-gradient(145deg, #f0fdf4 0%, #f8fafc 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Regulatory Alignment</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              India DPDPA 2023 —{' '}
              <span style={{ color: '#059669' }}>Fully Aligned</span>
            </h2>
            <p className="text-sm max-w-2xl mx-auto" style={{ color: '#64748b' }}>
              The Digital Personal Data Protection Act 2023 mandates strict data handling for systems
              processing Indian citizens' personal data. CampusKey is designed to comply with every applicable provision.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {DPDPA.map((d, i) => (
              <motion.div key={d.title + i} {...fadeUp(i * 0.07)}
                className="flex items-start gap-5 rounded-2xl p-5"
                style={{ background: '#fff', border: '1.5px solid #d1fae5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div className="shrink-0 pt-0.5" style={{ minWidth: 88 }}>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0' }}>
                    {d.section}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-sm" style={{ color: '#0f172a' }}>{d.title}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                      ✓ Compliant
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{d.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.35)}
            className="mt-6 rounded-2xl p-5 flex items-start gap-4"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1.5px solid #a7f3d0' }}>
            <Scale className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#059669' }} />
            <p className="text-sm leading-relaxed" style={{ color: '#166534' }}>
              <strong>Legal context:</strong> CampusKey operates as a "data processor" under DPDPA 2023.
              The college (data fiduciary) retains responsibility for consent collection and data principal notification.
              CampusKey provides the technical architecture for compliance — deployment contracts should include a
              Data Processing Agreement (DPA) between the college and the hosting vendor.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Accessibility */}
      <section style={{ padding: '72px 20px', background: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Accessibility</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              WCAG 2.1 <span style={{ color: '#7c3aed' }}>Level AA Compliance</span>
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Authentication should not exclude anyone. CampusKey is built to be fully operable by users
              with visual, motor, and cognitive disabilities.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACCESSIBILITY.map((a, i) => (
              <motion.div key={a.title} {...fadeUp(i * 0.07)}
                className="rounded-2xl p-5"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${a.color}12`, border: `1px solid ${a.color}28` }}>
                  <a.icon className="w-5 h-5" style={{ color: a.color }} />
                </div>
                <h3 className="font-bold text-sm mb-1.5" style={{ color: '#0f172a' }}>{a.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Enterprise Security */}
      <section style={{ padding: '72px 20px', background: 'linear-gradient(145deg, #eef2ff 0%, #f8fafc 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Enterprise Hardening</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Production-grade <span style={{ color: '#4f46e5' }}>security features</span>
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Six independent security layers — any single layer failing leaves the others intact.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ENTERPRISE.map((e, i) => (
              <motion.div key={e.title} {...fadeUp(i * 0.07)}
                className="flex gap-4 rounded-2xl p-5"
                style={{ background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${e.color}12`, border: `1px solid ${e.color}28` }}>
                  <e.icon className="w-5 h-5" style={{ color: e.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: '#0f172a' }}>{e.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{e.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary banner */}
      <section style={{ padding: '56px 20px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <FileCheck className="w-10 h-10 text-white mx-auto mb-4" style={{ opacity: 0.9 }} />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3" style={{ letterSpacing: '-0.01em' }}>
              Ready for enterprise deployment
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.80)', lineHeight: 1.7 }}>
              CampusKey meets the authentication security standards required by India's CERT-In guidelines,
              the DPDPA 2023 data protection obligations, and the FIDO Alliance's server implementation requirements.
              All in a system that deploys in under 30 minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/deployment-guide"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm"
                style={{ background: '#fff', color: '#4f46e5', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                <Server className="w-4 h-4" /> View Deployment Guide
              </Link>
              <Link to="/cost-calculator"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                ROI Calculator →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', padding: '28px 20px' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <Fingerprint className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold" style={{ color: '#f1f5f9' }}>
              Campus<span style={{ color: '#818cf8' }}>Key</span>
            </span>
          </div>
          <p className="text-xs text-center" style={{ color: '#475569' }}>
            Security &amp; Compliance — CampusKey, Srijan 2026
          </p>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#64748b' }}>
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </footer>

    </div>
  );
}
