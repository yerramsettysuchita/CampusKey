import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Fingerprint, ArrowLeft, Server, Globe, Lock, CheckCircle2,
  Terminal, Database, Shield, Clock, ExternalLink,
  ChevronRight, Users, Zap, AlertTriangle,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

function CodeBlock({ code, lang = 'bash' }) {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #334155', marginTop: 12 }}>
      <div style={{ background: '#1e293b', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang}</span>
      </div>
      <pre style={{
        background: '#0f172a', color: '#e2e8f0', padding: '16px 18px',
        margin: 0, overflow: 'auto', fontSize: 12.5, lineHeight: 1.75,
        fontFamily: "'Courier New', Courier, monospace",
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Step({ n, icon: Icon, color, bg, border, title, children }) {
  return (
    <motion.div {...fadeUp(0.06)}
      className="rounded-2xl p-6"
      style={{ background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: bg, border: `1.5px solid ${border}` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ background: bg, color, border: `1px solid ${border}` }}>
              Step {n}
            </span>
          </div>
          <h3 className="font-bold text-base" style={{ color: '#0f172a' }}>{title}</h3>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Check({ label, future = false }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3.5"
      style={{ background: future ? '#f8fafc' : '#fff', border: `1px solid ${future ? '#e2e8f0' : '#d1fae5'}` }}>
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: future ? '2px dashed #cbd5e1' : '2px solid #a7f3d0',
        background: future ? 'transparent' : '#f0fdf4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!future && <div style={{ width: 8, height: 8, borderRadius: 2, background: '#059669' }} />}
      </div>
      <span className="text-sm" style={{ color: future ? '#94a3b8' : '#0f172a' }}>{label}</span>
      {future && (
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: '#f1f5f9', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          Future
        </span>
      )}
    </div>
  );
}

const INFRA_TIERS = [
  {
    scale: 'Pilot',      users: '≤ 500',  db: 'Neon Free',         backend: 'Render Free',   frontend: 'Vercel Hobby',  monthly: '₹0',      color: '#059669', bg: '#f0fdf4', border: '#a7f3d0',
    note: 'Perfect for testing with a single department',
  },
  {
    scale: 'Department', users: '~2,000', db: 'Neon Pro',           backend: 'Render Starter', frontend: 'Vercel Hobby',  monthly: '₹2,100',  color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe',
    note: 'One or two departments; ~3,000 logins/day',
  },
  {
    scale: 'Campus',     users: '~10,000',db: 'Neon Pro',           backend: 'Render Standard',frontend: 'Vercel Pro',    monthly: '₹8,000',  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    note: 'Full college rollout; 30,000+ logins/day',
  },
  {
    scale: 'Multi-Campus',users: '50,000+',db: 'Managed PostgreSQL', backend: 'K8s Cluster',   frontend: 'CDN + Vercel',  monthly: '₹35,000', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    note: 'University system across multiple campuses',
  },
];

export default function DeploymentGuide() {
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
      <section style={{ background: 'linear-gradient(145deg, #f0f9ff 0%, #f8fafc 55%, #eef2ff 100%)', padding: '60px 20px 68px' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
            style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', color: '#0284c7' }}>
            <Server className="w-4 h-4" />
            IT Team Deployment Guide
          </motion.div>
          <motion.h1 {...fadeUp(0.08)}
            className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
            style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Deploy CampusKey in{' '}
            <span style={{ background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              30 minutes
            </span>
          </motion.h1>
          <motion.p {...fadeUp(0.14)}
            className="text-lg max-w-2xl mx-auto"
            style={{ color: '#475569', lineHeight: 1.65 }}>
            A step-by-step guide for college IT teams to deploy, configure, and roll out
            passwordless authentication across their campus. No prior WebAuthn experience required.
          </motion.p>
          <motion.div {...fadeUp(0.2)} className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {[
              { icon: Clock,  label: '~30 min setup',     color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
              { icon: Server, label: 'Node.js 18+ only',  color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
              { icon: Lock,   label: 'HTTPS mandatory',   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
              { icon: Zap,    label: 'Free tier capable', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: b.bg, color: b.color, border: `1.5px solid ${b.border}` }}>
                <b.icon className="w-3.5 h-3.5" /> {b.label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section 1: Prerequisites */}
      <section style={{ padding: '64px 20px', background: '#fff' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Before You Begin</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Prerequisites
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Terminal, color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', title: 'Node.js 18+', desc: 'Runtime for the Express backend. Download from nodejs.org — LTS version recommended.' },
              { icon: Database, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', title: 'PostgreSQL Database', desc: 'Neon.tech free tier for pilots. Self-hosted PostgreSQL for production. Tables auto-created on first boot.' },
              { icon: Globe, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', title: 'Domain Name', desc: 'e.g. auth.yourcollege.ac.in — required for HTTPS. WebAuthn does not work without a real domain.' },
              { icon: Lock, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', title: 'SSL Certificate', desc: 'Mandatory — WebAuthn refuses to operate on HTTP. Use Let\'s Encrypt (free) or your institution\'s wildcard cert.' },
              { icon: Clock, color: '#d97706', bg: '#fffbeb', border: '#fde68a', title: '30 Minutes', desc: 'End-to-end deployment including DNS propagation. First pilot test can run in the same session.' },
              { icon: Users, color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', title: '5 Pilot Users', desc: 'Recruit 3 students and 2 faculty for the initial test. Verify both student and faculty flows before wider rollout.' },
            ].map((p, i) => (
              <motion.div key={p.title} {...fadeUp(i * 0.06)}
                className="rounded-2xl p-5"
                style={{ background: p.bg, border: `1.5px solid ${p.border}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: '#fff', border: `1px solid ${p.border}` }}>
                  <p.icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <h3 className="font-bold text-sm mb-1.5" style={{ color: '#0f172a' }}>{p.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Deployment Steps */}
      <section style={{ padding: '64px 20px', background: 'linear-gradient(145deg, #f8fafc, #eef2ff)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Step-by-Step</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Deployment Steps
            </h2>
          </motion.div>

          <div className="flex flex-col gap-5">

            <Step n={1} icon={Terminal} color="#4f46e5" bg="#eef2ff" border="#c7d2fe" title="Clone the Repository">
              <p className="text-sm mb-1" style={{ color: '#475569' }}>Pull the latest source code from GitHub.</p>
              <CodeBlock lang="bash" code={`git clone https://github.com/yerramsettysuchita/CampusKey.git
cd CampusKey
npm install          # install backend dependencies
cd client && npm install && cd ..   # install frontend dependencies`} />
            </Step>

            <Step n={2} icon={Database} color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" title="Configure Environment Variables">
              <p className="text-sm mb-1" style={{ color: '#475569' }}>Create a <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12, color: '#4f46e5' }}>.env</code> file in the project root with these values:</p>
              <CodeBlock lang=".env" code={`# Database — paste your Neon.tech connection string here
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/campuskey?sslmode=require

# JWT — generate a strong 32+ character random string
JWT_SECRET=change-this-to-a-strong-random-secret-minimum-32-chars

# Your frontend URL (exact origin — no trailing slash)
ORIGIN=https://auth.yourcollege.ac.in

# Admin dashboard password
ADMIN_CODE=your-secure-admin-code-here

# College invite codes — distribute via official email only
STUDENT_PASSKEY=StudentCode@2026
FACULTY_PASSKEY=FacultyCode@2026

PORT=3001`} />
              <div className="mt-3 rounded-xl p-3 flex items-start gap-2.5"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                <p className="text-xs" style={{ color: '#92400e' }}>
                  <strong>Security:</strong> Never commit <code>.env</code> to git. Add it to <code>.gitignore</code>.
                  Change STUDENT_PASSKEY and FACULTY_PASSKEY every semester. These are your registration invite codes.
                </p>
              </div>
            </Step>

            <Step n={3} icon={Database} color="#059669" bg="#ecfdf5" border="#a7f3d0" title="Set Up PostgreSQL Database">
              <p className="text-sm mb-1" style={{ color: '#475569' }}>
                Tables are <strong>auto-created on first boot</strong> via <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12, color: '#4f46e5' }}>CREATE TABLE IF NOT EXISTS</code>.
                If you prefer manual setup, run this in the Neon SQL editor:
              </p>
              <CodeBlock lang="sql" code={`CREATE TABLE IF NOT EXISTS users (
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
);`} />
            </Step>

            <Step n={4} icon={Lock} color="#d97706" bg="#fffbeb" border="#fde68a" title="Generate College Passkey Codes">
              <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                The <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>STUDENT_PASSKEY</code> and{' '}
                <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>FACULTY_PASSKEY</code> environment
                variables act as invite codes — only someone who knows the code can register.
                Distribute the student code via your college ERP or official email blast. Keep the faculty code separate
                and share only with verified teaching staff via HOD mailing lists. Rotate every semester.
              </p>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Student Code', hint: 'Share via ERP or official email to enrolled students', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
                  { label: 'Faculty Code', hint: 'Share via HOD mailing list only — never public', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                ].map(c => (
                  <div key={c.label} className="rounded-xl p-3.5"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <p className="text-xs font-bold mb-1" style={{ color: c.color }}>{c.label}</p>
                    <p className="text-xs" style={{ color: '#475569' }}>{c.hint}</p>
                  </div>
                ))}
              </div>
            </Step>

            <Step n={5} icon={Server} color="#0ea5e9" bg="#f0f9ff" border="#bae6fd" title="Deploy the Backend">
              <p className="text-sm mb-1" style={{ color: '#475569' }}>Choose your deployment target:</p>
              <CodeBlock lang="bash" code={`# Option A — Direct on campus server (Node.js installed)
node server.js
# Or with PM2 for process management:
npm install -g pm2
pm2 start server.js --name campuskey-api
pm2 save && pm2 startup

# Option B — Render.com (recommended for pilots)
# 1. Push repo to GitHub
# 2. Create new Web Service on Render, connect your GitHub repo
# 3. Set root directory to "." (project root)
# 4. Build command: npm install
# 5. Start command: node server.js
# 6. Add all .env variables in Render's Environment panel`} />
            </Step>

            <Step n={6} icon={Globe} color="#4f46e5" bg="#eef2ff" border="#c7d2fe" title="Deploy the Frontend">
              <CodeBlock lang="bash" code={`# Option A — Vercel (recommended)
# 1. Push repo to GitHub
# 2. Import project on vercel.com
# 3. Set root directory to "client"
# 4. Add env variable: VITE_API_URL = https://your-render-url.onrender.com
# 5. Deploy — Vercel auto-detects Vite

# Option B — Static build (any web server / Nginx)
cd client
npm run build          # generates client/dist/
# Upload the dist/ folder to your college web server
# Configure Nginx to serve dist/ and proxy /auth to port 3001`} />
            </Step>

            <Step n={7} icon={Globe} color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" title="Configure DNS and SSL">
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#475569' }}>
                WebAuthn is <strong>hardcoded</strong> by browsers to refuse non-HTTPS origins.
                You must configure SSL before any passkey will work.
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { n: '1', text: 'Point auth.yourcollege.ac.in → your server IP (A record) or Vercel/Render (CNAME)' },
                  { n: '2', text: 'Install SSL certificate — Let\'s Encrypt (certbot) is free and renews automatically' },
                  { n: '3', text: 'Update ORIGIN env var on the backend to match the exact HTTPS frontend URL' },
                  { n: '4', text: 'Restart the backend after updating env vars' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>{s.n}</span>
                    <p className="text-sm" style={{ color: '#475569' }}>{s.text}</p>
                  </div>
                ))}
              </div>
            </Step>

            <Step n={8} icon={Users} color="#059669" bg="#ecfdf5" border="#a7f3d0" title="Test with 5 Pilot Users">
              <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                Before campus-wide rollout, validate both flows with a small group. Verify the Admin dashboard
                shows their registrations and audit logs appear correctly.
              </p>
              <div className="mt-3 grid sm:grid-cols-2 gap-2.5">
                {[
                  'Student registers via desktop (Chrome/Edge)',
                  'Student registers via phone QR code flow',
                  'Faculty registers on mobile (Safari or Chrome)',
                  'Login works on Android phone',
                  'Login works on iPhone (Safari)',
                  'Admin can view all users and audit logs',
                ].map(t => (
                  <div key={t} className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#059669' }} />
                    {t}
                  </div>
                ))}
              </div>
            </Step>

            <Step n={9} icon={Zap} color="#4f46e5" bg="#eef2ff" border="#c7d2fe" title="Roll Out Campus-Wide">
              <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                After pilot validation, announce via official college channels. Recommended rollout sequence:
              </p>
              <div className="flex flex-col gap-2 mt-3">
                {[
                  { label: 'Week 1', desc: 'One pilot department (CSE / IT — most tech-savvy)' },
                  { label: 'Week 2', desc: 'Add remaining engineering departments' },
                  { label: 'Week 3', desc: 'Faculty across all departments' },
                  { label: 'Week 4+', desc: 'Full campus rollout + library and lab system integration' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0"
                      style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>{r.label}</span>
                    <p className="text-sm" style={{ color: '#475569' }}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </Step>

          </div>
        </div>
      </section>

      {/* Section 3: Infrastructure Costs */}
      <section style={{ padding: '64px 20px', background: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Infrastructure</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Cost at different <span style={{ color: '#4f46e5' }}>deployment scales</span>
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#64748b' }}>
              CampusKey starts completely free and scales linearly. Most colleges with under 10,000 students never pay a rupee.
            </p>
          </motion.div>

          <div className="overflow-x-auto rounded-2xl" style={{ border: '1.5px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Scale', 'Users', 'Database', 'Backend', 'Frontend', 'Monthly Cost'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INFRA_TIERS.map((t, i) => (
                  <tr key={t.scale} style={{ borderBottom: i < INFRA_TIERS.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="font-bold text-sm px-2.5 py-1 rounded-lg"
                        style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
                        {t.scale}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: 12 }}>{t.users}</td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: 12 }}>{t.db}</td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: 12 }}>{t.backend}</td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: 12 }}>{t.frontend}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="font-black text-base" style={{ color: t.color }}>{t.monthly}</span>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{t.note}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <motion.div {...fadeUp(0.1)} className="mt-4 rounded-xl p-4 flex items-start gap-3"
            style={{ background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#059669' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#166534' }}>
              <strong>Cost comparison:</strong> A comparable SMS OTP system for 5,000 students costs{' '}
              ₹15–20 lakh per year in SMS charges alone (see ROI Calculator). CampusKey at the same scale costs ₹0.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Integration Checklist */}
      <section style={{ padding: '64px 20px', background: 'linear-gradient(145deg, #f5f3ff 0%, #f8fafc 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Checklist</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Integration <span style={{ color: '#7c3aed' }}>checklist</span>
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Tick these off before calling the deployment complete.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Check label="College domain configured and DNS pointing to server" />
            <Check label="SSL certificate installed and auto-renewal configured" />
            <Check label="Student passkey code distributed via official college email" />
            <Check label="Faculty passkey code distributed via HOD mailing list" />
            <Check label="Admin account created and admin key saved securely" />
            <Check label="Pilot tested with at least 3 students and 2 faculty" />
            <Check label="Admin dashboard shows audit logs and risk scores" />
            <Check label="Login tested on both Android and iPhone" />
            <Check label="QR cross-device enrollment tested (desktop → phone)" />
            <Check label="Backend PM2 or systemd process configured for auto-restart" />
            <Check label="ERP / LMS webhook integration" future />
            <Check label="LMS OAuth 2.0 bridge configured" future />
            <Check label="Multi-factor fallback via OTP (emergency)" future />
            <Check label="LDAP / Active Directory sync for existing users" future />
          </div>
        </div>
      </section>

      {/* Section 5: Support */}
      <section style={{ padding: '64px 20px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Support</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Need help?
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: Terminal, color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe',
                title: 'GitHub Issues',
                desc: 'Report bugs, request features, or ask deployment questions directly on the repository.',
                link: 'https://github.com/yerramsettysuchita/CampusKey/issues',
                linkLabel: 'Open an issue',
              },
              {
                icon: Shield, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
                title: 'Security Documentation',
                desc: 'Full compliance documentation — FIDO2 standards, DPDPA alignment, WCAG 2.1 accessibility.',
                link: '/compliance',
                linkLabel: 'View compliance docs',
                internal: true,
              },
              {
                icon: ChevronRight, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
                title: 'ROI Calculator',
                desc: 'Quantify savings versus OTP to present to college administration for budget approval.',
                link: '/cost-calculator',
                linkLabel: 'Open calculator',
                internal: true,
              },
            ].map((s, i) => (
              <motion.div key={s.title} {...fadeUp(i * 0.08)}
                className="rounded-2xl p-5"
                style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: '#fff', border: `1px solid ${s.border}` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: '#0f172a' }}>{s.title}</h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: '#475569' }}>{s.desc}</p>
                {s.internal ? (
                  <Link to={s.link}
                    className="text-xs font-bold flex items-center gap-1"
                    style={{ color: s.color }}>
                    {s.linkLabel} <ChevronRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <a href={s.link} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold flex items-center gap-1"
                    style={{ color: s.color }}>
                    {s.linkLabel} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.2)} className="mt-8 rounded-2xl p-6 text-center"
            style={{ background: 'linear-gradient(145deg, #eef2ff, #f0f9ff)', border: '1.5px solid #c7d2fe' }}>
            <Fingerprint className="w-8 h-8 mx-auto mb-3" style={{ color: '#4f46e5' }} />
            <h3 className="font-bold text-lg mb-2" style={{ color: '#0f172a' }}>
              Built for Srijan 2026 · Atos Global IT Solutions &amp; Services
            </h3>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#64748b', lineHeight: 1.7 }}>
              CampusKey is an open-source project. All deployment code, database schemas, and API documentation
              are available on GitHub. You are free to deploy, modify, and use it for your institution.
            </p>
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
            Deployment Guide — CampusKey, Srijan 2026
          </p>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#64748b' }}>
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </footer>

    </div>
  );
}
