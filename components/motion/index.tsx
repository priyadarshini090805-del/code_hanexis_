'use client'

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion'
import { type ReactNode, type FC } from 'react'

// ── Spring presets ────────────────────────────────────────────────────────
export const springs = {
  gentle: { type: 'spring' as const, stiffness: 120, damping: 20 },
  snappy: { type: 'spring' as const, stiffness: 300, damping: 30 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  smooth: { type: 'spring' as const, stiffness: 100, damping: 15 },
}

// ── Fade up (stagger-ready) ──────────────────────────────────────────────
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, ...springs.gentle },
  }),
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

// ── Reusable animated wrappers ───────────────────────────────────────────
export const FadeIn: FC<{ children: ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, ...springs.gentle }}
    className={className}
  >
    {children}
  </motion.div>
)

export const ScaleIn: FC<{ children: ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, ...springs.snappy }}
    className={className}
  >
    {children}
  </motion.div>
)

export const StaggerList: FC<{ children: ReactNode; className?: string }> = ({
  children, className,
}) => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
    className={className}
  >
    {children}
  </motion.div>
)

export const StaggerItem: FC<HTMLMotionProps<'div'> & { index?: number }> = ({
  children, index = 0, ...props
}) => (
  <motion.div
    variants={fadeUpVariants}
    custom={index}
    {...props}
  >
    {children}
  </motion.div>
)

// ── Animated counter ─────────────────────────────────────────────────────
export const AnimatedNumber: FC<{ value: number; className?: string; duration?: number }> = ({
  value, className, duration: _duration = 1,
}) => (
  <motion.span
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    key={value}
  >
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.gentle }}
    >
      {typeof value === 'number' ? value.toLocaleString() : value}
    </motion.span>
  </motion.span>
)

// ── Card with hover tilt ─────────────────────────────────────────────────
export const TiltCard: FC<HTMLMotionProps<'div'>> = ({ children, className, ...props }) => (
  <motion.div
    className={className}
    whileHover={{ y: -4, transition: springs.gentle }}
    whileTap={{ scale: 0.99 }}
    {...props}
  >
    {children}
  </motion.div>
)

// ── Magnetic button ──────────────────────────────────────────────────────
export const MagneticButton: FC<HTMLMotionProps<'button'>> = ({ children, className, ...props }) => (
  <motion.button
    className={className}
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.98 }}
    transition={springs.snappy}
    {...props}
  >
    {children}
  </motion.button>
)

// ── Page wrapper ─────────────────────────────────────────────────────────
export const PageTransition: FC<{ children: ReactNode; className?: string }> = ({
  children, className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)
