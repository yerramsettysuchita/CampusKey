import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Fingerprint, Shield, Smartphone, Zap, QrCode, Users,
  CheckCircle2, ArrowRight, Lock, Wifi, ShieldCheck, Star,
  GraduationCap, BookOpen, AlertTriangle, KeyRound,
  ChevronRight, Globe, BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

const PROBLEMS = [
  { icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2', border: '#fecaca',
    title: 'Passwords that are easy to guess',
    desc: 'Most students use their date of birth or name as their password. Anyone who knows you can get into your account.' },
  { icon: Wifi, color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    title: 'OTP codes that never arrive',
    desc: 'On a busy campus, the network is often too slow for OTP messages to arrive in time, especially before exams.' },
  { icon: Lock, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    title: 'Shared computers are not safe',
    desc: 'Typing your password on a library computer or lab PC puts your account at risk because others may see or save it.' },
];

const FEATURES = [
  { icon: Fingerprint, color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe',
    title: 'Log in with your fingerprint or face',
    desc: 'Your fingerprint or face is your password. You do not need to remember anything and there is nothing anyone can steal.' },
  { icon: QrCode, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    title: 'Register from a shared computer using your phone',
    desc: 'If you are on a lab PC, just scan a QR code with your phone and register your fingerprint there. No typing on shared computers.' },
  { icon: Shield, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
    title: 'Your fingerprint never leaves your device',
    desc: 'Your biometric data stays on your phone or laptop only. The college server never sees it and cannot store it.' },
  { icon: Users, color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    title: 'Separate logins for students and faculty',
    desc: 'Students and teachers each have their own registration flow. A college-issued code is required so only real members can join.' },
  { icon: Smartphone, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd',
    title: 'Works on any phone or computer',
    desc: 'Use CampusKey on Android, iPhone, Windows or Mac. There is nothing to install and it works right from your browser.' },
  { icon: Zap, color: '#e11d48', bg: '#fff1f2', border: '#fecdd3',
    title: 'Log in with just one tap',
    desc: 'No typing, no waiting for codes. One touch of your finger and you are inside your campus portal in less than a second.' },
];

const STEPS = [
  { n: '01', icon: GraduationCap, color: '#4f46e5', bg: '#eef2ff',
    title: 'Set up your account once',
    desc: 'Enter your college details and use the campus code your college gave you to verify. Your fingerprint is then saved securely on your own device.' },
  { n: '02', icon: Fingerprint, color: '#7c3aed', bg: '#f5f3ff',
    title: 'Touch your fingerprint sensor to log in',
    desc: 'Your phone or laptop reads your fingerprint or face and confirms it is really you. Nothing is sent over the internet during this step.' },
  { n: '03', icon: BookOpen, color: '#059669', bg: '#ecfdf5',
    title: 'Get into your campus portal',
    desc: 'You are now logged in. Access your grades, library books, lab schedules and college notices all from one place.' },
];

const TECH = [
  { label: 'FIDO2 and WebAuthn', desc: 'The global standard for password-free login, used by Apple and Google' },
  { label: 'Passkeys', desc: 'Your login is saved on your device and tied to your fingerprint or face' },
  { label: 'Session Tokens', desc: 'You stay logged in for 24 hours without needing to sign in again' },
  { label: 'PostgreSQL with Neon', desc: 'Only a security key is stored on the server, never your password or biometric data' },
  { label: 'React and Vite', desc: 'A fast and modern web app that feels like a native app on any device' },
  { label: 'Render and Vercel', desc: 'Hosted on reliable cloud platforms so the app is always up and running' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', fontFamily: 'inherit' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <Fingerprint className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">
              <span style={{ color: '#0f172a' }}>Campus</span><span style={{ color: '#4f46e5' }}>Key</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:inline-flex"
              style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
              Srijan 2026
            </span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
                Dashboard <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: '#475569', border: '1px solid #e2e8f0', background: '#fff' }}>
                  Sign In
                </Link>
                <Link to="/enroll"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.30)' }}>
                  Register <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #f8fafc 60%, #f0f9ff 100%)', padding: '80px 20px 90px' }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
            style={{ background: '#eef2ff', border: '1.5px solid #c7d2fe', color: '#4f46e5' }}>
            <BadgeCheck className="w-4 h-4" />
            Built for Srijan 2026 · Atos Global IT Solutions & Services
          </motion.div>

          <motion.h1 {...fadeUp(0.08)}
            className="text-4xl sm:text-6xl font-extrabold mb-5 leading-tight"
            style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Campus login,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              without passwords
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.14)}
            className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto"
            style={{ color: '#475569', lineHeight: 1.65 }}>
            CampusKey lets you log into your college portal without typing any password.
            Just use your <strong style={{ color: '#4f46e5' }}>fingerprint or face</strong> and you are in.
            No more forgetting passwords. No more waiting for OTP codes that never arrive.
          </motion.p>

          <motion.div {...fadeUp(0.2)} className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {user ? (
              <Link to="/dashboard"
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-base"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 8px 28px rgba(99,102,241,0.38)' }}>
                <Fingerprint className="w-5 h-5" /> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/enroll"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-base"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 8px 28px rgba(99,102,241,0.38)' }}>
                  <Fingerprint className="w-5 h-5" /> Register Your Passkey
                </Link>
                <Link to="/login"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base"
                  style={{ background: '#fff', border: '1.5px solid #c7d2fe', color: '#4f46e5', boxShadow: '0 4px 14px rgba(99,102,241,0.10)' }}>
                  Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </motion.div>

          {/* Trust badges */}
          <motion.div {...fadeUp(0.26)} className="flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: ShieldCheck, label: 'FIDO2 Certified Security', color: '#059669' },
              { icon: Lock, label: 'No passwords stored anywhere', color: '#4f46e5' },
              { icon: Smartphone, label: 'Works on any device', color: '#7c3aed' },
              { icon: Globe, label: 'No app installation needed', color: '#0ea5e9' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: '#64748b' }}>
                <b.icon className="w-3.5 h-3.5" style={{ color: b.color }} />
                {b.label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section style={{ padding: '80px 20px', background: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>The problem</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Logging into your college portal is <span style={{ color: '#ef4444' }}>more risky than you think</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Every day, students struggle with passwords they forget, OTP codes that never arrive, and shared computers that are not safe to type passwords on.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-5">
            {PROBLEMS.map((p, i) => (
              <motion.div key={p.title} {...fadeUp(i * 0.08)}
                className="rounded-2xl p-6"
                style={{ background: p.bg, border: `1.5px solid ${p.border}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: '#fff', border: `1px solid ${p.border}` }}>
                  <p.icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#0f172a' }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What CampusKey Does ── */}
      <section style={{ padding: '80px 20px', background: 'linear-gradient(145deg, #eef2ff 0%, #f8fafc 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>The solution</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Your fingerprint <span style={{ color: '#4f46e5' }}>replaces the password</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              CampusKey uses the same login technology that Apple and Google use for their passkeys, but built specifically for Indian college portals. It is simple to use, fast, and much more secure than a regular password.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} {...fadeUp(i * 0.07)}
                className="rounded-2xl p-5"
                style={{ background: '#fff', border: `1.5px solid ${f.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: f.bg, border: `1px solid ${f.border}` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-sm mb-1.5" style={{ color: '#0f172a' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '80px 20px', background: '#fff' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              It only takes <span style={{ color: '#4f46e5' }}>three simple steps</span>
            </h2>
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-6 relative">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fadeUp(i * 0.1)}
                className="flex-1 rounded-2xl p-6 relative"
                style={{ background: s.bg, border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black" style={{ color: `${s.color}22` }}>{s.n}</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#fff', border: `1.5px solid ${s.color}30` }}>
                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#0f172a' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What Makes It Unique ── */}
      <section style={{ padding: '80px 20px', background: 'linear-gradient(145deg, #f5f3ff 0%, #f8fafc 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>What makes us different</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Made <span style={{ color: '#7c3aed' }}>with Indian college students</span> in mind
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Most login systems are built for big companies and do not understand how Indian colleges work. CampusKey was built from the ground up for students and teachers in Indian campuses.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: Star, color: '#7c3aed',
                title: 'Only college members can register',
                desc: 'You need a special code from your college to create an account. This means no one from outside can make a fake student or teacher profile.' },
              { icon: QrCode, color: '#4f46e5',
                title: 'Register your phone from any shared computer',
                desc: 'This is something only CampusKey offers. If you are on a library or lab computer, just scan a QR code with your phone to complete the setup safely.' },
              { icon: BadgeCheck, color: '#059669',
                title: 'Students and teachers see different things',
                desc: 'Once you log in, the dashboard shows information that is relevant to your role. Students see their grades and attendance while teachers see their classes and students.' },
              { icon: Zap, color: '#d97706',
                title: 'Ready for India\'s new digital security rules',
                desc: 'India is moving towards fingerprint-based login for all digital systems. CampusKey is already built to meet these upcoming requirements, so your college is ahead of the curve.' },
            ].map((u, i) => (
              <motion.div key={u.title} {...fadeUp(i * 0.08)}
                className="flex gap-4 rounded-2xl p-5"
                style={{ background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${u.color}12`, border: `1px solid ${u.color}30` }}>
                  <u.icon className="w-5 h-5" style={{ color: u.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: '#0f172a' }}>{u.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{u.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section style={{ padding: '60px 20px', background: '#fff' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Technology</p>
            <h2 className="text-2xl font-extrabold" style={{ color: '#0f172a' }}>
              Built with trusted and reliable technology
            </h2>
          </motion.div>
          <motion.div {...fadeUp(0.08)} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TECH.map(t => (
              <div key={t.label} className="rounded-xl px-4 py-3"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="font-bold text-sm" style={{ color: '#0f172a' }}>{t.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{t.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #4f46e5, #6366f1, #7c3aed)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4" style={{ letterSpacing: '-0.01em' }}>
              Ready to never type a password again?
            </h2>
            <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Setting up your account takes less than a minute. After that, just touch your finger to log in every single time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link to="/dashboard"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base"
                  style={{ background: '#fff', color: '#4f46e5', boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
                  <Fingerprint className="w-5 h-5" /> Open Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/enroll"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base"
                    style={{ background: '#fff', color: '#4f46e5', boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
                    <Fingerprint className="w-5 h-5" /> Get Started Free
                  </Link>
                  <Link to="/login"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base"
                    style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.30)' }}>
                    Already have an account? Sign in <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── About Srijan 2026 ── */}
      <section style={{ padding: '60px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>About the challenge</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Srijan 2026 — <span style={{ color: '#4f46e5' }}>Bigger & Better</span>
            </h2>
            <p className="text-sm max-w-2xl mx-auto" style={{ color: '#64748b', lineHeight: 1.7 }}>
              Srijan 2026 is an online challenge by{' '}
              <strong style={{ color: '#0f172a' }}>Atos Global IT Solutions and Services</strong>{' '}
              where participants solve real problems that companies actually face. It is designed to show how well students can think, build and present practical solutions.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: GraduationCap, color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe',
                title: 'Design Your Solution',
                desc: 'You start by writing up how you understand the problem, what you plan to build, what technology you will use, and what difference it will make.' },
              { icon: KeyRound, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
                title: 'Build and Show It Working',
                desc: 'You then build a working version of your idea and demonstrate that it actually solves the problem you picked.' },
              { icon: Users, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
                title: 'Present to the Judges',
                desc: 'Finally, you present your work to a panel of judges who ask questions and evaluate how well your solution works in real life.' },
            ].map((s, i) => (
              <motion.div key={s.title} {...fadeUp(i * 0.08)}
                className="rounded-2xl p-5"
                style={{ background: '#fff', border: `1.5px solid ${s.border}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <h3 className="font-bold text-sm mb-1.5" style={{ color: '#0f172a' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.1)}
            className="rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-5"
            style={{ background: 'linear-gradient(135deg, #eef2ff, #f0f9ff)', border: '1.5px solid #c7d2fe' }}>
            <div className="shrink-0">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.30)' }}>
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="font-bold text-base mb-2" style={{ color: '#0f172a' }}>Prizes and Opportunities</p>
              <div className="flex flex-col gap-1.5">
                {[
                  'Cash prizes are given to the top performing teams as decided by the jury',
                  'Multiple strong-performing teams get a chance to do an internship at Atos',
                  'Final year students who do well may be offered a direct interview for placement',
                  'Rewards are not limited to just the top three teams. Any team that performs well has a chance to be recognised',
                ].map(r => (
                  <div key={r} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#4f46e5' }} />
                    <p className="text-sm" style={{ color: '#475569' }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0f172a', padding: '32px 20px' }}>
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
            Built for Srijan 2026 by Atos Global IT Solutions and Services. A fingerprint-based login system for Indian college campuses.
          </p>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
            <span className="text-xs font-medium" style={{ color: '#64748b' }}>FIDO2 Compliant</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
