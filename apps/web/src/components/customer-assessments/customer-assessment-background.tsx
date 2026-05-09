'use client';

import { motion } from 'motion/react';

export function CustomerAssessmentBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={{ opacity: [0.18, 0.28, 0.18], y: [0, -8, 0] }}
        className="absolute right-[-8rem] top-[-12rem] h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl"
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        animate={{ opacity: [0.16, 0.24, 0.16], x: [0, 10, 0] }}
        className="absolute left-[-10rem] top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_32rem),linear-gradient(to_bottom,transparent,rgba(255,255,255,0.72))]" />
    </div>
  );
}
