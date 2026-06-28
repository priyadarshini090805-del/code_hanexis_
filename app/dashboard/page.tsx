'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, Megaphone, Workflow, PenLine, ArrowRight, CalendarClock, Sparkles, TrendingUp } from 'lucide-react'
import { PageTransition, StaggerList, StaggerItem, springs } from '@/components/motion'
import { StatCard } from '@/components/motion/StatCard'
import { StatSkeleton } from '@/components/motion/Skeleton'
import { EmptyState } from '@/components/motion/EmptyState'

interface DashboardData {
  totalLeads: number
  totalCampaigns: number
  activeCampaigns: number
  totalWorkflows: number
  recentActivity: Array<{ id: string; description?: string; action?: string; createdAt: string }>
  upcomingScheduled: Array<{ id: string; title: string; platform?: string; scheduledFor: string }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Failed to load dashboard')
      const result = await response.json()
      setData(result.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
        >
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--hx-text)' }}>
            Command Center
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--hx-text-secondary)' }}>
            Your lead generation pipeline at a glance
          </p>
        </motion.div>
      </div>

      {error && (
        <motion.div
          className="p-4 rounded-xl mb-6 text-sm"
          style={{ background: 'rgba(166,60,60,0.06)', color: 'var(--hx-error)', border: '1px solid rgba(166,60,60,0.1)' }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {error}
        </motion.div>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Leads"
              value={data.totalLeads}
              icon={<Users size={16} />}
              trend={{ value: 12, label: 'this month' }}
              delay={0}
            />
            <StatCard
              label="Campaigns"
              value={data.totalCampaigns}
              icon={<Megaphone size={16} />}
              trend={{ value: data.activeCampaigns, label: 'active' }}
              delay={0.06}
            />
            <StatCard
              label="Workflows"
              value={data.totalWorkflows}
              icon={<Workflow size={16} />}
              delay={0.12}
            />
            <StatCard
              label="AI Generations"
              value={0}
              icon={<Sparkles size={16} />}
              delay={0.18}
            />
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming schedule */}
            <motion.div
              className="lg:col-span-2 hx-card overflow-hidden"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ...springs.gentle }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--hx-border-light)' }}>
                <div className="flex items-center gap-2">
                  <CalendarClock size={16} style={{ color: 'var(--hx-brand)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--hx-text)' }}>Upcoming Schedule</h2>
                </div>
                <Link href="/dashboard/scheduler" className="text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: 'var(--hx-brand)' }}>
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="p-5">
                {data.upcomingScheduled && data.upcomingScheduled.length > 0 ? (
                  <StaggerList className="space-y-3">
                    {data.upcomingScheduled.slice(0, 5).map((item, i) => (
                      <StaggerItem key={item.id} index={i}>
                        <div className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-[var(--hx-surface-secondary)]">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: 'rgba(108,36,53,0.06)', color: 'var(--hx-brand)' }}>
                            {item.platform?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--hx-text)' }}>{item.title}</p>
                            <p className="text-xs" style={{ color: 'var(--hx-text-secondary)' }}>
                              {new Date(item.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="hx-badge text-[10px]" style={{ background: 'rgba(212,166,121,0.1)', color: '#8B6914', border: 'none' }}>
                            Scheduled
                          </span>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerList>
                ) : (
                  <EmptyState
                    icon={<CalendarClock size={24} style={{ color: 'var(--hx-brand)' }} />}
                    title="No scheduled content"
                    description="Schedule your first post to start automating your social presence."
                    action={
                      <Link href="/dashboard/scheduler" className="hx-btn-primary text-xs">
                        Schedule a Post
                      </Link>
                    }
                  />
                )}
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              className="hx-card overflow-hidden"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...springs.gentle }}
            >
              <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--hx-border-light)' }}>
                <TrendingUp size={16} style={{ color: 'var(--hx-brand)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--hx-text)' }}>Quick Actions</h2>
              </div>
              <StaggerList className="p-3 space-y-1">
                {[
                  { href: '/dashboard/leads/import', label: 'Import Leads', icon: Users, desc: 'CSV or manual entry' },
                  { href: '/dashboard/campaigns/new', label: 'Create Campaign', icon: Megaphone, desc: 'Outreach sequence' },
                  { href: '/dashboard/workflows/new', label: 'Build Workflow', icon: Workflow, desc: 'Automated pipeline' },
                  { href: '/dashboard/content/editor', label: 'Create Content', icon: PenLine, desc: 'AI-powered writing' },
                  { href: '/dashboard/ai', label: 'AI Generator', icon: Sparkles, desc: 'Generate messages' },
                ].map((action, i) => (
                  <StaggerItem key={action.href} index={i}>
                    <Link
                      href={action.href}
                      className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-[var(--hx-surface-secondary)]"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(108,36,53,0.05)', color: 'var(--hx-brand)' }}>
                        <action.icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium" style={{ color: 'var(--hx-text)' }}>{action.label}</p>
                        <p className="text-[11px]" style={{ color: 'var(--hx-text-secondary)' }}>{action.desc}</p>
                      </div>
                      <ArrowRight size={14} className="opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" style={{ color: 'var(--hx-text-secondary)' }} />
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerList>
            </motion.div>
          </div>
        </>
      )}
    </PageTransition>
  )
}
