'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, type FC, type ReactNode } from 'react'
import { springs } from '.'

interface StatCardProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  icon?: ReactNode
  trend?: { value: number; label: string }
  delay?: number
}

function AnimCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`)

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    })
    return controls.stop
  }, [value, count])

  return <motion.span>{rounded}</motion.span>
}

export const StatCard: FC<StatCardProps> = ({
  label, value, prefix, suffix, icon, trend, delay = 0,
}) => (
  <motion.div
    className="hx-card p-5 group"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, ...springs.gentle }}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    style={{ cursor: 'default' }}
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--hx-text-secondary)' }}>
        {label}
      </span>
      {icon && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ background: 'rgba(108,36,53,0.06)', color: 'var(--hx-brand)' }}>
          {icon}
        </div>
      )}
    </div>
    <div className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--hx-text)', lineHeight: 1.1 }}>
      <AnimCounter value={value} prefix={prefix} suffix={suffix} />
    </div>
    {trend && (
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`text-xs font-semibold ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
        </span>
        <span className="text-[11px]" style={{ color: 'var(--hx-text-secondary)' }}>{trend.label}</span>
      </div>
    )}
  </motion.div>
)
