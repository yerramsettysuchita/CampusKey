import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, animate } from 'framer-motion';
import {
  Fingerprint, ArrowLeft, Users, TrendingDown,
  Shield, CheckCircle2, AlertTriangle, Info, Calculator,
  Zap, Download,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

// ── Animated currency counter ────────────────────────────────────────────────
function AnimatedNumber({ value, format }) {
  const [current, setCurrent] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = value;
    const controls = animate(from, value, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: (v) => setCurrent(v),
    });
    return controls.stop;
  }, [value]);

  return <>{format ? format(current) : Math.round(current).toLocaleString('en-IN')}</>;
}

function formatINR(amount) {
  const n = Math.round(amount);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Slider component ─────────────────────────────────────────────────────────
function Slider({ label, hint, value, min, max, step = 1, onChange, format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold" style={{ color: '#0f172a' }}>{label}</label>
        <span className="text-sm font-bold px-2.5 py-0.5 rounded-lg"
          style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
          {format ? format(value) : value.toLocaleString('en-IN')}
        </span>
      </div>
      {hint && <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>{hint}</p>}
      <div style={{ position: 'relative', height: 6, borderRadius: 3, background: '#e2e8f0' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${pct}%`, borderRadius: 3,
          background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: '#cbd5e1' }}>
          {format ? format(min) : min.toLocaleString('en-IN')}
        </span>
        <span className="text-xs" style={{ color: '#cbd5e1' }}>
          {format ? format(max) : max.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}

export default function CostCalculator() {
  const [students,      setStudents]      = useState(5000);
  const [faculty,       setFaculty]       = useState(500);
  const [loginsPerDay,  setLoginsPerDay]  = useState(3);
  const [academicDays,  setAcademicDays]  = useState(240);

  // ── Derived calculations ────────────────────────────────────────────────────
  const totalUsers          = students + faculty;
  const totalLoginsPerYear  = totalUsers * loginsPerDay * academicDays;

  // OTP-based costs
  const smsCost             = totalLoginsPerYear * 0.25;
  const helpdeskCost        = Math.round(totalUsers * 0.25) * 12 * 50;
  const breachRiskCost      = 3200000; // ₹3.2 crore (IBM 2024)
  const otpTotal            = smsCost + helpdeskCost + breachRiskCost;

  // CampusKey costs
  const infraCostPerYear    = totalUsers <= 10000 ? 0 : 25200;
  const campusKeyTotal      = infraCostPerYear;

  // Savings
  const annualSavings       = otpTotal - campusKeyTotal;
  const savingsPct          = otpTotal > 0 ? Math.round((annualSavings / otpTotal) * 100) : 0;

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
      <section style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #f8fafc 60%, #f0fdf4 100%)', padding: '60px 20px 68px' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
            style={{ background: '#eef2ff', border: '1.5px solid #c7d2fe', color: '#4f46e5' }}>
            <Calculator className="w-4 h-4" />
            ROI &amp; Cost Analysis Tool
          </motion.div>
          <motion.h1 {...fadeUp(0.08)}
            className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
            style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            How much does your{' '}
            <span style={{ background: 'linear-gradient(135deg, #ef4444, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              password system cost?
            </span>
          </motion.h1>
          <motion.p {...fadeUp(0.14)}
            className="text-lg max-w-2xl mx-auto"
            style={{ color: '#475569', lineHeight: 1.65 }}>
            Adjust the sliders below to match your institution's size. The calculator will show you exactly how much
            your current OTP-based authentication costs — and what CampusKey saves.
          </motion.p>
        </div>
      </section>

      {/* Main Calculator */}
      <section style={{ padding: '60px 20px 80px', background: '#fff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 items-start">

            {/* Inputs panel */}
            <div className="lg:col-span-2">
              <motion.div {...fadeUp(0)}
                className="rounded-2xl p-6 sticky top-20"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                    <Users className="w-4.5 h-4.5" style={{ color: '#4f46e5' }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#0f172a' }}>Institution Parameters</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>Adjust to match your college</p>
                  </div>
                </div>

                <Slider
                  label="Number of Students"
                  hint="Undergraduate + postgraduate enrolled"
                  value={students} min={500} max={50000} step={500}
                  onChange={setStudents}
                />
                <Slider
                  label="Number of Faculty"
                  hint="Teaching and non-teaching staff"
                  value={faculty} min={50} max={5000} step={50}
                  onChange={setFaculty}
                />
                <Slider
                  label="Logins per User per Day"
                  hint="Portal, library, exam, attendance systems"
                  value={loginsPerDay} min={1} max={10}
                  onChange={setLoginsPerDay}
                />
                <Slider
                  label="Academic Days per Year"
                  hint="Including exams and re-tests"
                  value={academicDays} min={150} max={300} step={5}
                  onChange={setAcademicDays}
                />

                <div className="mt-4 rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>Summary</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: 'Total Users',            val: totalUsers.toLocaleString('en-IN') },
                      { label: 'Total Logins / Year',    val: Math.round(totalLoginsPerYear / 1000) + 'K+' },
                      { label: 'Password Resets / Year', val: (Math.round(totalUsers * 0.25) * 12).toLocaleString('en-IN') },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between">
                        <span className="text-xs" style={{ color: '#94a3b8' }}>{r.label}</span>
                        <span className="text-xs font-bold" style={{ color: '#0f172a' }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Results panel */}
            <div className="lg:col-span-3 flex flex-col gap-5">

              {/* OTP card */}
              <motion.div {...fadeUp(0.08)}
                className="rounded-2xl p-6"
                style={{ background: '#fff5f5', border: '1.5px solid #fecaca' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#fee2e2', border: '1px solid #fecaca' }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ color: '#0f172a' }}>OTP-Based Authentication</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>Current industry standard for Indian colleges</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-5">
                  {[
                    {
                      label: 'SMS OTP charges',
                      detail: `₹0.25 × ${totalLoginsPerYear.toLocaleString('en-IN')} logins`,
                      value: smsCost,
                      color: '#dc2626',
                    },
                    {
                      label: 'Helpdesk support calls',
                      detail: `${(Math.round(totalUsers * 0.25) * 12).toLocaleString('en-IN')} resets × ₹50`,
                      value: helpdeskCost,
                      color: '#d97706',
                    },
                    {
                      label: 'Data breach risk exposure',
                      detail: 'Avg. Indian education breach — IBM 2024',
                      value: breachRiskCost,
                      color: '#7c3aed',
                    },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl p-3.5"
                      style={{ background: '#fff', border: '1px solid #fecaca' }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{item.label}</p>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>{item.detail}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: item.color }}>
                        <AnimatedNumber value={item.value} format={formatINR} />
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, #fee2e2, #fff5f5)', border: '1.5px solid #fca5a5' }}>
                  <span className="font-bold text-sm" style={{ color: '#0f172a' }}>Total Annual Cost</span>
                  <span className="text-2xl font-black" style={{ color: '#dc2626' }}>
                    <AnimatedNumber value={otpTotal} format={formatINR} />
                  </span>
                </div>
              </motion.div>

              {/* CampusKey card */}
              <motion.div {...fadeUp(0.16)}
                className="rounded-2xl p-6"
                style={{ background: '#f0fdf4', border: '1.5px solid #a7f3d0' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#dcfce7', border: '1px solid #a7f3d0' }}>
                    <Fingerprint className="w-5 h-5" style={{ color: '#059669' }} />
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ color: '#0f172a' }}>CampusKey Passwordless</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>
                      {totalUsers <= 10000 ? 'Free tier — all infrastructure included' : 'Neon Pro + Render Standard'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-5">
                  {[
                    {
                      label: 'Infrastructure cost',
                      detail: totalUsers <= 10000
                        ? 'Vercel + Neon + Render — all free tiers'
                        : 'Neon Pro ₹1,500/mo + Render Standard ₹600/mo',
                      value: infraCostPerYear,
                      color: '#059669',
                    },
                    {
                      label: 'Password reset support calls',
                      detail: 'No passwords exist — zero resets possible',
                      value: 0,
                      color: '#059669',
                    },
                    {
                      label: 'Credential breach risk',
                      detail: 'No passwords or secrets stored on server',
                      value: 0,
                      color: '#059669',
                    },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl p-3.5"
                      style={{ background: '#fff', border: '1px solid #a7f3d0' }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{item.label}</p>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>{item.detail}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: item.color }}>
                        <AnimatedNumber value={item.value} format={formatINR} />
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, #dcfce7, #f0fdf4)', border: '1.5px solid #86efac' }}>
                  <span className="font-bold text-sm" style={{ color: '#0f172a' }}>Total Annual Cost</span>
                  <span className="text-2xl font-black" style={{ color: '#059669' }}>
                    <AnimatedNumber value={campusKeyTotal} format={formatINR} />
                  </span>
                </div>
              </motion.div>

              {/* Savings banner */}
              <motion.div {...fadeUp(0.24)}
                className="rounded-2xl p-6 text-center"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1, #7c3aed)', boxShadow: '0 8px 32px rgba(99,102,241,0.25)' }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-white" style={{ opacity: 0.85 }} />
                  <p className="text-sm font-semibold text-white" style={{ opacity: 0.85 }}>Annual Savings with CampusKey</p>
                </div>
                <p className="text-5xl font-black text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                  <AnimatedNumber value={annualSavings} format={formatINR} />
                </p>
                <p className="text-sm text-white" style={{ opacity: 0.75 }}>
                  {savingsPct}% reduction in total authentication costs
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  {[
                    { icon: Zap, label: `${(totalLoginsPerYear / 1000).toFixed(0)}K logins secured / year` },
                    { icon: Shield, label: 'Zero credential breach risk' },
                    { icon: CheckCircle2, label: '0 password resets' },
                  ].map(b => (
                    <div key={b.label} className="flex items-center gap-1.5 text-xs font-semibold text-white"
                      style={{ opacity: 0.85 }}>
                      <b.icon className="w-3.5 h-3.5" />
                      {b.label}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* PDF note */}
              <motion.div {...fadeUp(0.28)}
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
                <Download className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                <p className="text-sm" style={{ color: '#92400e' }}>
                  <strong>Share with administration:</strong> Screenshot or print this analysis to present
                  to your college administration for budget approval. The methodology section below
                  documents all data sources.
                </p>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section style={{ padding: '60px 20px 80px', background: 'linear-gradient(145deg, #f8fafc, #eef2ff)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Methodology</p>
            <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>
              Assumptions &amp; Data Sources
            </h2>
            <p className="text-sm" style={{ color: '#64748b' }}>All figures are based on published industry data and conservative estimates.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Info, color: '#4f46e5',
                title: 'SMS OTP Cost — ₹0.25/message',
                desc: 'Indian telecom bulk SMS pricing for transactional messages. Actual rates vary from ₹0.14 to ₹0.35 per message. ₹0.25 is the mid-market estimate for 2024.',
              },
              {
                icon: Info, color: '#7c3aed',
                title: 'Helpdesk Reset Rate — 25% monthly',
                desc: 'Gartner research (2022) found 20–50% of helpdesk calls are password resets. 25% monthly is conservative for a college environment with students who reset seasonally.',
              },
              {
                icon: Info, color: '#d97706',
                title: 'Helpdesk Cost — ₹50 per call',
                desc: 'Average IT support ticket cost in Indian educational institutions. Global average is ~$15 USD; ₹50 reflects Indian labour cost structure and internal IT teams.',
              },
              {
                icon: Info, color: '#dc2626',
                title: 'Data Breach Risk — ₹3.2 Crore',
                desc: 'IBM Cost of a Data Breach Report 2024, India education sector. This is the expected value of breach cost including notification, legal, remediation, and reputational damage.',
              },
              {
                icon: Info, color: '#059669',
                title: 'CampusKey Scale Costs',
                desc: 'Under 10,000 users: Vercel Hobby (free) + Neon Free (free) + Render Free (free) = ₹0/year. Over 10,000: Neon Pro ₹1,500/mo + Render Standard ₹600/mo = ₹25,200/year.',
              },
              {
                icon: Info, color: '#0ea5e9',
                title: 'Breach Risk = ₹0 for CampusKey',
                desc: 'CampusKey stores only cryptographic public keys — there are no passwords or biometric templates to breach. A database compromise yields nothing usable for authentication.',
              },
            ].map((m, i) => (
              <motion.div key={m.title} {...fadeUp(i * 0.06)}
                className="flex gap-3 rounded-xl p-4"
                style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <m.icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: m.color }} />
                <div>
                  <p className="font-bold text-xs mb-1" style={{ color: '#0f172a' }}>{m.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '56px 20px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#0f172a' }}>
              Ready to eliminate authentication costs?
            </h2>
            <p className="text-sm mb-6" style={{ color: '#64748b' }}>
              CampusKey deploys in under 30 minutes and starts saving money on day one.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/deployment-guide"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 6px 20px rgba(99,102,241,0.30)' }}>
                View Deployment Guide →
              </Link>
              <Link to="/compliance"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm"
                style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' }}>
                Security &amp; Compliance
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
            ROI Calculator — Data sources: IBM, Gartner, Indian telecom pricing 2024
          </p>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#64748b' }}>
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </footer>

    </div>
  );
}
