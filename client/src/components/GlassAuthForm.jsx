import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, KeyRound, X, AlertCircle, Smartphone } from 'lucide-react';

/**
 * GlassAuthForm — glassmorphism auth card with:
 *   • Shimmer sweep animation on the submit button while loading
 *   • Floating glass error toast with dismiss + "try phone QR" hint
 *   • Staggered field entrance
 *
 * Props:
 *   title, subtitle, fields, submitLabel, onSubmit, loading
 *   error        string | null  — triggers toast
 *   onClearError () => void     — toast X button callback
 *   onTryQR      () => void     — "use phone QR" action from toast
 *   footer       ReactNode
 */
export default function GlassAuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  onSubmit,
  loading,
  error,
  onClearError,
  onTryQR,
  footer,
}) {
  const [fieldFocus, setFieldFocus] = useState(null);

  // Detect errors where a phone QR might help
  const isPasskeyError = error && (
    /no biometric|no passkey|not supported|not allowed|cancelled|dismissed/i.test(error)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-8 w-full max-w-md mx-auto"
    >
      {/* ── Floating error toast ─────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error-toast"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={  { opacity: 0, y: -8,   scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 rounded-xl px-4 py-3"
            style={{
              background: 'rgba(239,68,68,0.09)',
              border    : '1px solid rgba(239,68,68,0.22)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'rgba(252,165,165,0.85)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'rgba(252,165,165,0.9)' }}>{error}</p>
                {isPasskeyError && onTryQR && (
                  <button
                    type="button"
                    onClick={onTryQR}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: '#a0c0e0' }}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    No biometric? Use phone QR instead →
                  </button>
                )}
              </div>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="shrink-0 transition-opacity hover:opacity-70"
                  style={{ color: 'rgba(252,165,165,0.6)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-7 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 220, damping: 18 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{
            background: 'rgba(160,192,224,0.10)',
            border    : '1px solid rgba(160,192,224,0.22)',
            boxShadow : '0 0 24px rgba(160,192,224,0.12)',
          }}
        >
          <KeyRound className="w-6 h-6" style={{ color: '#a0c0e0' }} />
        </motion.div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#f0f4ff' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'rgba(160,192,224,0.60)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Form ────────────────────────────────────────────────────── */}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {fields.map((field, i) => (
          <motion.div
            key={field.name}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 + i * 0.07, ease: [0.22,1,0.36,1] }}
          >
            <label
              htmlFor={field.name}
              className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
              style={{ color: 'rgba(160,192,224,0.65)' }}
            >
              {field.label}
            </label>
            <div className="relative">
              <input
                id={field.name}
                className="glass-input"
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                onFocus={() => setFieldFocus(field.name)}
                onBlur={() => setFieldFocus(null)}
                autoComplete={field.autoComplete || 'off'}
                required
              />
              {/* focus glow ring */}
              <AnimatePresence>
                {fieldFocus === field.name && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ boxShadow: '0 0 0 2px rgba(160,192,224,0.22)' }}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        {/* ── Submit button with shimmer ───────────────────────────── */}
        <motion.button
          type="submit"
          className="glass-btn-primary mt-2 overflow-hidden"
          disabled={loading}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          style={{ position: 'relative' }}
        >
          {/* Shimmer sweep while loading */}
          {loading && (
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(160,192,224,0.18) 40%, rgba(255,255,255,0.12) 50%, rgba(160,192,224,0.18) 60%, transparent 100%)',
                backgroundSize: '300% 100%',
                animation: 'shimmer 1.6s linear infinite',
              }}
            />
          )}
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for passkey…</span>
              </>
            ) : submitLabel}
          </span>
        </motion.button>
      </form>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      {footer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42 }}
          className="mt-6 text-center text-sm"
          style={{ color: 'rgba(160,192,224,0.48)' }}
        >
          {footer}
        </motion.div>
      )}
    </motion.div>
  );
}
