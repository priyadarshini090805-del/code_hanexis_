'use client'

import { motion } from 'framer-motion'
import { type ReactNode, type FC } from 'react'
import { springs } from '.'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  secondaryAction?: ReactNode
}

export const EmptyState: FC<EmptyStateProps> = ({
  icon, title, description, action, secondaryAction,
}) => (
  <motion.div
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={springs.gentle}
  >
    {icon && (
      <motion.div
        className="mb-5"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, ...springs.bouncy }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(108,36,53,0.06)' }}>
          {icon}
        </div>
      </motion.div>
    )}
    <motion.h3
      className="text-lg font-semibold mb-2"
      style={{ color: 'var(--hx-text)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
    >
      {title}
    </motion.h3>
    <motion.p
      className="text-sm max-w-sm mb-6"
      style={{ color: 'var(--hx-text-secondary)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {description}
    </motion.p>
    {action && (
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, ...springs.gentle }}
      >
        {action}
        {secondaryAction}
      </motion.div>
    )}
  </motion.div>
)
