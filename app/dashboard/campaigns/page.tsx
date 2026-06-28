'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Megaphone, Plus, Play, Pause, Square, RotateCcw, Users, ArrowRight } from 'lucide-react'
import { PageTransition, StaggerList, StaggerItem, springs } from '@/components/motion'
import { SkeletonCard } from '@/components/motion/Skeleton'
import { EmptyState } from '@/components/motion/EmptyState'

interface Campaign {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
  startedAt?: string
  leads: Array<{ id: string }>
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  DRAFT: { bg: 'rgba(108,36,53,0.06)', text: '#6C2435', dot: '#6C2435', label: 'Draft' },
  ACTIVE: { bg: 'rgba(47,107,69,0.08)', text: '#2F6B45', dot: '#2F6B45', label: 'Active' },
  PAUSED: { bg: 'rgba(196,139,42,0.1)', text: '#8B6914', dot: '#C48B2A', label: 'Paused' },
  COMPLETED: { bg: 'rgba(108,36,53,0.04)', text: '#6B6560', dot: '#9B918A', label: 'Completed' },
  ARCHIVED: { bg: 'rgba(0,0,0,0.04)', text: '#9B918A', dot: '#BDB3AA', label: 'Archived' },
}

const FILTERS = ['ALL', 'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchCampaigns()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns${filter !== 'ALL' ? `?status=${filter}` : ''}`)
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      const data = await response.json()
      setCampaigns(data.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (campaignId: string, action: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!response.ok) throw new Error(`Failed to ${action} campaign`)
      fetchCampaigns()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const sc = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--hx-text)' }}>Campaigns</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--hx-text-secondary)' }}>
            {campaigns.length > 0 ? `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}` : 'Automate your outreach'}
          </p>
        </div>
        <Link href="/dashboard/campaigns/new" className="hx-btn-primary text-xs gap-1.5">
          <Plus size={14} /> New Campaign
        </Link>
      </div>

      {error && (
        <motion.div className="p-4 rounded-xl mb-6 text-sm"
          style={{ background: 'rgba(166,60,60,0.06)', color: 'var(--hx-error)', border: '1px solid rgba(166,60,60,0.1)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div className="flex gap-1.5 mb-6 flex-wrap"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...springs.gentle }}>
        {FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === s ? 'var(--hx-brand)' : 'transparent',
              color: filter === s ? '#fff' : 'var(--hx-text-secondary)',
              border: filter === s ? 'none' : '1px solid var(--hx-border)',
            }}>
            {s}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : campaigns.length > 0 ? (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c, i) => {
            const s = sc(c.status)
            return (
              <StaggerItem key={c.id} index={i}>
                <Link href={`/dashboard/campaigns/${c.id}`}>
                  <motion.div className="hx-card p-5 group cursor-pointer"
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold truncate" style={{ color: 'var(--hx-text)' }}>{c.name}</h3>
                        {c.description && (
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--hx-text-secondary)' }}>{c.description}</p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ml-3 flex-shrink-0"
                        style={{ background: s.bg, color: s.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                        {s.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--hx-border-light)' }}>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--hx-text-secondary)' }}>
                        <Users size={13} />
                        {c.leads.length} lead{c.leads.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.status === 'DRAFT' && (
                          <button onClick={(e) => handleAction(c.id, 'start', e)}
                            className="hx-btn-ghost text-[11px] py-1 px-2 gap-1" style={{ color: 'var(--hx-success)' }}>
                            <Play size={11} /> Start
                          </button>
                        )}
                        {c.status === 'ACTIVE' && (
                          <>
                            <button onClick={(e) => handleAction(c.id, 'pause', e)}
                              className="hx-btn-ghost text-[11px] py-1 px-2 gap-1" style={{ color: 'var(--hx-warning)' }}>
                              <Pause size={11} /> Pause
                            </button>
                            <button onClick={(e) => handleAction(c.id, 'stop', e)}
                              className="hx-btn-ghost text-[11px] py-1 px-2 gap-1" style={{ color: 'var(--hx-error)' }}>
                              <Square size={11} /> Stop
                            </button>
                          </>
                        )}
                        {c.status === 'PAUSED' && (
                          <button onClick={(e) => handleAction(c.id, 'resume', e)}
                            className="hx-btn-ghost text-[11px] py-1 px-2 gap-1" style={{ color: 'var(--hx-success)' }}>
                            <RotateCcw size={11} /> Resume
                          </button>
                        )}
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity ml-1" style={{ color: 'var(--hx-text-secondary)' }} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </StaggerItem>
            )
          })}
        </StaggerList>
      ) : (
        <motion.div className="hx-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState
            icon={<Megaphone size={24} style={{ color: 'var(--hx-brand)' }} />}
            title="No campaigns yet"
            description="Create your first outreach campaign to start generating leads automatically."
            action={<Link href="/dashboard/campaigns/new" className="hx-btn-primary text-xs">Create Campaign</Link>}
          />
        </motion.div>
      )}
    </PageTransition>
  )
}
