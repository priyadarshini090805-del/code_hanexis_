'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Workflow, Plus, Search, Zap, ArrowRight } from 'lucide-react'
import { PageTransition, StaggerList, StaggerItem, springs } from '@/components/motion'
import { SkeletonCard } from '@/components/motion/Skeleton'
import { EmptyState } from '@/components/motion/EmptyState'

interface WorkflowItem {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  stepsCount: number
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchWorkflows()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workflows')
      if (!response.ok) throw new Error('Failed to fetch workflows')
      const data = await response.json()
      setWorkflows(data.data?.workflows || data.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const filtered = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--hx-text)' }}>Workflows</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--hx-text-secondary)' }}>
            Automate your outreach pipeline
          </p>
        </div>
        <Link href="/dashboard/workflows/new" className="hx-btn-primary text-xs gap-1.5">
          <Plus size={14} /> Create Workflow
        </Link>
      </div>

      {error && (
        <motion.div className="p-4 rounded-xl mb-6 text-sm"
          style={{ background: 'rgba(166,60,60,0.06)', color: 'var(--hx-error)', border: '1px solid rgba(166,60,60,0.1)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.div>
      )}

      {/* Search */}
      <motion.div className="mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...springs.gentle }}>
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--hx-text-secondary)', opacity: 0.5 }} />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="hx-input pl-9"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : filtered.length > 0 ? (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((w, i) => (
            <StaggerItem key={w.id} index={i}>
              <Link href={`/dashboard/workflows/${w.id}`}>
                <motion.div className="hx-card p-5 group cursor-pointer"
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: w.isActive ? 'rgba(47,107,69,0.08)' : 'rgba(108,36,53,0.06)' }}>
                        <Zap size={16} style={{ color: w.isActive ? 'var(--hx-success)' : 'var(--hx-brand)' }} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--hx-text)' }}>{w.name}</h3>
                        {w.description && (
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--hx-text-secondary)' }}>{w.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                      style={{
                        background: w.isActive ? 'rgba(47,107,69,0.08)' : 'rgba(0,0,0,0.04)',
                        color: w.isActive ? 'var(--hx-success)' : 'var(--hx-text-secondary)',
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: w.isActive ? 'var(--hx-success)' : 'var(--hx-text-secondary)' }} />
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--hx-border-light)' }}>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--hx-text-secondary)' }}>
                      <span>{w.stepsCount || 0} steps</span>
                      <span>{new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: 'var(--hx-text-secondary)' }} />
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      ) : (
        <motion.div className="hx-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState
            icon={<Workflow size={24} style={{ color: 'var(--hx-brand)' }} />}
            title="No workflows yet"
            description="Build automated outreach sequences with delays, conditions, and AI-generated messages."
            action={<Link href="/dashboard/workflows/new" className="hx-btn-primary text-xs">Create Workflow</Link>}
          />
        </motion.div>
      )}
    </PageTransition>
  )
}
