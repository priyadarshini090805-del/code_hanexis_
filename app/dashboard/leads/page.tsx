'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, Search, Download, Plus, ArrowRight } from 'lucide-react'
import { PageTransition, StaggerList, StaggerItem, springs } from '@/components/motion'
import { TableSkeleton } from '@/components/motion/Skeleton'
import { EmptyState } from '@/components/motion/EmptyState'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  company?: string
  jobTitle?: string
  status: string
  score?: number
  createdAt: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  NEW: { bg: 'rgba(108,36,53,0.06)', text: '#6C2435', dot: '#6C2435' },
  CONTACTED: { bg: 'rgba(212,163,115,0.12)', text: '#8B6914', dot: '#D4A373' },
  QUALIFIED: { bg: 'rgba(47,107,69,0.08)', text: '#2F6B45', dot: '#2F6B45' },
  CONVERTED: { bg: 'rgba(47,107,69,0.12)', text: '#1B5E20', dot: '#1B5E20' },
  LOST: { bg: 'rgba(166,60,60,0.08)', text: '#A63C3C', dot: '#A63C3C' },
}

const STATUSES = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchLeads()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/leads', window.location.origin)
      if (filter !== 'ALL') url.searchParams.set('status', filter)
      if (searchQuery) url.searchParams.set('search', searchQuery)
      const response = await fetch(url.toString())
      if (!response.ok) throw new Error('Failed to fetch leads')
      const data = await response.json()
      setLeads(data.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLeads()
  }

  const statusStyle = (status: string) => STATUS_STYLES[status] || STATUS_STYLES.NEW

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--hx-text)' }}>Leads</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--hx-text-secondary)' }}>
            {leads.length > 0 ? `${leads.length} lead${leads.length !== 1 ? 's' : ''} in your pipeline` : 'Manage your sales pipeline'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/leads/export?format=csv" className="hx-btn-secondary text-xs gap-1.5">
            <Download size={14} /> Export
          </Link>
          <Link href="/dashboard/leads/import" className="hx-btn-secondary text-xs gap-1.5">
            <Plus size={14} /> Import
          </Link>
          <Link href="/dashboard/leads/new" className="hx-btn-primary text-xs gap-1.5">
            <Plus size={14} /> Add Lead
          </Link>
        </div>
      </div>

      {error && (
        <motion.div
          className="p-4 rounded-xl mb-6 text-sm"
          style={{ background: 'rgba(166,60,60,0.06)', color: 'var(--hx-error)', border: '1px solid rgba(166,60,60,0.1)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      {/* Search + Filters */}
      <motion.div
        className="hx-card p-4 mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...springs.gentle }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--hx-text-secondary)', opacity: 0.5 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="hx-input pl-9"
              />
            </div>
            <button type="submit" className="hx-btn-primary text-xs">Search</button>
          </form>
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {STATUSES.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === status ? 'var(--hx-brand)' : 'transparent',
                color: filter === status ? '#fff' : 'var(--hx-text-secondary)',
                border: filter === status ? 'none' : '1px solid var(--hx-border)',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : leads.length > 0 ? (
        <motion.div
          className="hx-card overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...springs.gentle }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hx-border-light)' }}>
                  {['Name', 'Email', 'Company', 'Status', 'Added', ''].map((col, i) => (
                    <th key={i} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider ${col === '' ? 'text-right' : 'text-left'}`}
                      style={{ color: 'var(--hx-text-secondary)' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <StaggerList>
                  {leads.map((lead, i) => {
                    const ss = statusStyle(lead.status)
                    return (
                      <StaggerItem key={lead.id} index={i}>
                        <tr className="group transition-colors" style={{ borderBottom: '1px solid var(--hx-border-light)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hx-surface-secondary)')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #6C2435, #823145)' }}>
                                {lead.firstName[0]}{lead.lastName?.[0] || ''}
                              </div>
                              <div>
                                <Link href={`/dashboard/leads/${lead.id}`}
                                  className="text-sm font-medium hover:underline" style={{ color: 'var(--hx-text)' }}>
                                  {lead.firstName} {lead.lastName}
                                </Link>
                                {lead.jobTitle && (
                                  <p className="text-[11px]" style={{ color: 'var(--hx-text-secondary)' }}>{lead.jobTitle}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--hx-text-secondary)' }}>{lead.email}</td>
                          <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--hx-text-secondary)' }}>{lead.company || '—'}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={{ background: ss.bg, color: ss.text }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ss.dot }} />
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--hx-text-secondary)' }}>
                            {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link href={`/dashboard/leads/${lead.id}`}
                              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs font-medium"
                              style={{ color: 'var(--hx-brand)' }}>
                              View <ArrowRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      </StaggerItem>
                    )
                  })}
                </StaggerList>
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div className="hx-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <EmptyState
            icon={<Users size={24} style={{ color: 'var(--hx-brand)' }} />}
            title="No leads yet"
            description="Start building your pipeline by importing leads or adding them manually."
            action={
              <Link href="/dashboard/leads/import" className="hx-btn-primary text-xs">Import Leads</Link>
            }
            secondaryAction={
              <Link href="/dashboard/leads/new" className="hx-btn-secondary text-xs">Add Manually</Link>
            }
          />
        </motion.div>
      )}
    </PageTransition>
  )
}
