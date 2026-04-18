import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function VerificationCodeInput({ length = 6, onComplete, onResend, isLoading, error }) {
  const [digits, setDigits] = useState(Array(length).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleResend() {
    if (cooldown > 0 || isLoading) return;
    setDigits(Array(length).fill(''));
    inputRefs.current[0]?.focus();
    onResend?.();
    setCooldown(30);
  }

  function handleChange(idx, val) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (next.every(d => d !== '')) {
      onComplete?.(next.join(''));
    }
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      } else if (idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        setDigits(next);
        inputRefs.current[idx - 1]?.focus();
      }
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    const next = Array(length).fill('');
    [...text].forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(text.length, length - 1);
    inputRefs.current[focusIdx]?.focus();
    if (next.filter(d => d !== '').length === length) {
      onComplete?.(next.join(''));
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Digit inputs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            style={{
              width: 46, height: 58, borderRadius: 12,
              border: d ? '2px solid #6366f1' : '2px solid #e2e8f0',
              background: d ? '#eef2ff' : '#f8fafc',
              fontSize: 26, fontWeight: 700, fontFamily: 'monospace',
              textAlign: 'center', outline: 'none', color: '#0f172a',
              cursor: isLoading ? 'not-allowed' : 'text',
              transition: 'all 0.15s',
              boxShadow: d ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
            }}
          >
            <AlertCircle style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#b91c1c' }}>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resend */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isLoading}
          style={{
            background: 'none', border: 'none', padding: '4px 8px',
            cursor: cooldown > 0 || isLoading ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600,
            color: cooldown > 0 || isLoading ? '#94a3b8' : '#4f46e5',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
        >
          <RefreshCw style={{ width: 12, height: 12 }} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </motion.div>
  );
}
