import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import ParticlesBg from 'particles-bg';

/**
 * FloatingOrbs — performance-optimized ambient background.
 *
 * • Uses React.memo to prevent re-renders from parent state changes
 * • Reduces particle count on narrow viewports (mobile perf)
 * • Orbs use will-change:transform for GPU compositing hint
 * • Particles disabled entirely on reduced-motion preference
 */

const ORB_CONFIGS = [
  { w: 680, h: 680, left: '-14%', top: '-22%', color: 'rgba(80,120,200,0.13)',  dur: 9,  dx:  28, dy: -24 },
  { w: 420, h: 420, left:  '62%', top:  '48%', color: 'rgba(60,100,180,0.10)',  dur: 11, dx: -20, dy:  26 },
  { w: 300, h: 300, left:  '36%', top: '-12%', color: 'rgba(120,160,220,0.08)', dur: 7,  dx:  16, dy: -18 },
  { w: 520, h: 520, left: '-22%', top:  '58%', color: 'rgba(50,80,160,0.07)',   dur: 13, dx: -24, dy:  20 },
];

function FloatingOrbs() {
  // Detect reduced motion preference
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fewer particles on small screens
  const particleCount = useMemo(
    () => (typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 24),
    []
  );

  return (
    <>
      {/* Cobweb particle network — disabled for reduced-motion users */}
      {!prefersReduced && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{ opacity: 0.15 }}
          aria-hidden="true"
        >
          <ParticlesBg type="cobweb" color="#a0c0e0" num={particleCount} bg={false} />
        </div>
      )}

      {/* Gaussian blur orbs */}
      <div
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {ORB_CONFIGS.map((orb, i) => (
          <motion.div
            key={i}
            style={{
              position  : 'absolute',
              width     : orb.w,
              height    : orb.h,
              left      : orb.left,
              top       : orb.top,
              background: orb.color,
              filter    : 'blur(70px)',
              borderRadius: '50%',
              willChange: 'transform',
            }}
            animate={prefersReduced ? {} : {
              x    : [0, orb.dx, 0],
              y    : [0, orb.dy, 0],
              scale: [1, 1 + i * 0.012, 1],
            }}
            transition={{
              duration: orb.dur,
              repeat  : Infinity,
              ease    : 'easeInOut',
              delay   : i * 1.4,
            }}
          />
        ))}
      </div>
    </>
  );
}

export default memo(FloatingOrbs);
