import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Loader2, QrCode, ListOrdered } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * QRAuthModal — cross-device passkey overlay with two tabs:
 *   QR tab  : rendered QR code (page URL) the user can scan with their phone
 *   Steps tab: numbered instructions for the browser-native QR flow
 *
 * Props:
 *   open     boolean        — show/hide
 *   qrValue  string         — URL/data to encode (defaults to window.location.href)
 *   onClose  fn | null      — if null, modal cannot be dismissed (mid-flow)
 */
export default function QRAuthModal({ open, qrValue, onClose }) {
  const [tab, setTab] = useState('qr');          // 'qr' | 'steps'
  const url = qrValue || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="qr-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(5,7,16,0.78)', backdropFilter: 'blur(7px)' }}
          onClick={onClose || undefined}
        >
          <motion.div
            key="qr-card"
            initial={{ scale: 0.87, opacity: 0, y: 18 }}
            animate={{ scale: 1,    opacity: 1, y: 0 }}
            exit={  { scale: 0.87,  opacity: 0, y: 18 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="glass-card w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Smartphone className="w-5 h-5" style={{ color: '#a0c0e0' }} />
                </motion.div>
                <span className="font-semibold text-sm" style={{ color: '#f0f4ff' }}>
                  Cross-Device Passkey
                </span>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-xs px-2 py-1 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: 'rgba(160,192,224,0.45)' }}
                >
                  Cancel
                </button>
              )}
            </div>

            {/* ── Tab bar ────────────────────────────────────────── */}
            <div
              className="flex mx-6 mb-5 rounded-xl p-0.5 gap-0.5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(160,192,224,0.12)' }}
            >
              {[
                { id: 'qr',    icon: QrCode,       label: 'Scan QR' },
                { id: 'steps', icon: ListOrdered,  label: 'How it works' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium transition-all duration-200"
                  style={tab === id ? {
                    background: 'rgba(160,192,224,0.18)',
                    border    : '1px solid rgba(160,192,224,0.28)',
                    color     : '#f0f4ff',
                  } : {
                    color: 'rgba(160,192,224,0.45)',
                    border: '1px solid transparent',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Tab content ────────────────────────────────────── */}
            <div className="px-6 pb-6">
              <AnimatePresence mode="wait">
                {tab === 'qr' ? (
                  <motion.div
                    key="tab-qr"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={  { opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <p className="text-xs text-center mb-4" style={{ color: 'rgba(160,192,224,0.55)' }}>
                      Scan with your phone camera to open this page on your phone,
                      then authenticate with your phone's biometric.
                    </p>

                    {/* QR code */}
                    <div
                      className="p-4 rounded-2xl mb-4"
                      style={{
                        background: 'rgba(240,244,255,0.96)',
                        boxShadow : '0 0 0 1px rgba(160,192,224,0.25), 0 8px 24px rgba(0,0,0,0.3)',
                      }}
                    >
                      <QRCodeSVG
                        value={url}
                        size={160}
                        bgColor="transparent"
                        fgColor="#0a0e1a"
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    <p
                      className="text-xs font-mono truncate max-w-[240px] text-center"
                      style={{ color: 'rgba(160,192,224,0.35)' }}
                    >
                      {url}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-steps"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={  { opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-xs mb-4" style={{ color: 'rgba(160,192,224,0.55)' }}>
                      Your browser is showing a native QR code. Here's what to do:
                    </p>
                    {[
                      ['Browser shows QR dialog', 'Look for it above this overlay'],
                      ['Scan with your phone',     'Open your camera app and point at the QR'],
                      ['Approve on phone',          'Use Face ID, fingerprint, or PIN'],
                      ['Done — auto-redirect',      'This page redirects automatically'],
                    ].map(([title, sub], i) => (
                      <div key={i} className="flex gap-3 mb-3">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                          style={{
                            background: 'rgba(160,192,224,0.14)',
                            border    : '1px solid rgba(160,192,224,0.25)',
                            color     : '#a0c0e0',
                          }}
                        >
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#f0f4ff' }}>{title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(160,192,224,0.50)' }}>{sub}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Waiting spinner */}
              <div
                className="flex items-center justify-center gap-2 mt-4 pt-4 text-xs"
                style={{
                  color       : 'rgba(160,192,224,0.38)',
                  borderTop   : '1px solid rgba(160,192,224,0.10)',
                }}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Awaiting passkey confirmation…</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
