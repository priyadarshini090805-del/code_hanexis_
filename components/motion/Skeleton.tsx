'use client'

import { motion } from 'framer-motion'

export function SkeletonLine({ width = '100%', height = 16 }: { width?: string | number; height?: number }) {
  return (
    <motion.div
      className="hx-skeleton"
      style={{ width, height, borderRadius: 6 }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="hx-card p-5 space-y-3">
      <SkeletonLine width="40%" height={12} />
      <SkeletonLine width="100%" height={28} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} width={`${70 + Math.random() * 30}%`} height={14} />
      ))}
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="hx-card p-5 space-y-2">
      <SkeletonLine width="60%" height={10} />
      <SkeletonLine width="50%" height={28} />
      <SkeletonLine width="80%" height={10} />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="hx-card overflow-hidden">
      <div className="p-4 border-b" style={{ borderColor: 'var(--hx-border-light)' }}>
        <SkeletonLine width="30%" height={14} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b" style={{ borderColor: 'var(--hx-border-light)' }}>
          <SkeletonLine width={32} height={32} />
          <div className="flex-1 space-y-2">
            <SkeletonLine width={`${40 + Math.random() * 30}%`} height={14} />
            <SkeletonLine width={`${20 + Math.random() * 20}%`} height={10} />
          </div>
          <SkeletonLine width={60} height={24} />
        </div>
      ))}
    </div>
  )
}
