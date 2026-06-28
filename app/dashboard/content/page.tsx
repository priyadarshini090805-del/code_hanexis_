'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PenLine, Plus, FileText, ArrowRight } from 'lucide-react'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion'
import { SkeletonCard } from '@/components/motion/Skeleton'
import { EmptyState } from '@/components/motion/EmptyState'

interface ContentItem {
  id: string
  title: string
  type: string
  status: string
  createdAt: string
  publishedAt?: string
}

const TYPE_LABELS: Record<string, string> = {
  LINKEDIN_POST: 'LinkedIn Post',
  INSTAGRAM_CAPTION: 'Instagram',
  VIDEO_SCRIPT: 'Video Script',
  JOB_POST: 'Job Post',
  COMPANY_ANNOUNCEMENT: 'Announcement',
  POSTER: 'Poster',
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'rgba(108,36,53,0.06)', text: '#6C2435' },
  APPROVED: { bg: 'rgba(47,107,69,0.08)', text: '#2F6B45' },
  PUBLISHED: { bg: 'rgba(47,107,69,0.12)', text: '#1B5E20' },
  REJECTED: { bg: 'rgba(166,60,60,0.08)', text: '#A63C3C' },
}

export default function ContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchContents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchContents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/content')
      if (!response.ok) throw new Error('Failed to fetch content')
      const data = await response.json()
      setContents(data.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--hx-text)' }}>Content</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--hx-text-secondary)' }}>Create and manage your content library</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/content/new" className="hx-btn-secondary text-xs gap-1.5"><Plus size={14} /> AI Generate</Link>
          <Link href="/dashboard/content/editor" className="hx-btn-primary text-xs gap-1.5"><PenLine size={14} /> New Content</Link>
        </div>
      </div>

      {error && (
        <motion.div className="p-4 rounded-xl mb-6 text-sm"
          style={{ background: 'rgba(166,60,60,0.06)', color: 'var(--hx-error)', border: '1px solid rgba(166,60,60,0.1)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : contents.length > 0 ? (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contents.map((item, i) => {
            const ss = STATUS_STYLES[item.status] || STATUS_STYLES.DRAFT
            return (
              <StaggerItem key={item.id} index={i}>
                <Link href={`/dashboard/content/${item.id}`}>
                  <motion.div className="hx-card p-5 group cursor-pointer" whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(108,36,53,0.06)' }}>
                        <FileText size={16} style={{ color: 'var(--hx-brand)' }} />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: ss.bg, color: ss.text }}>
                        {item.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold mb-1 line-clamp-2" style={{ color: 'var(--hx-text)' }}>{item.title}</h3>
                    <div className="flex items-center justify-between text-[11px] mt-3" style={{ color: 'var(--hx-text-secondary)' }}>
                      <span>{TYPE_LABELS[item.type] || item.type}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity mt-2" style={{ color: 'var(--hx-text-secondary)' }} />
                  </motion.div>
                </Link>
              </StaggerItem>
            )
          })}
        </StaggerList>
      ) : (
        <motion.div className="hx-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState
            icon={<PenLine size={24} style={{ color: 'var(--hx-brand)' }} />}
            title="No content yet"
            description="Create AI-powered LinkedIn posts, Instagram captions, video scripts, and more."
            action={<Link href="/dashboard/content/editor" className="hx-btn-primary text-xs">Create Content</Link>}
            secondaryAction={<Link href="/dashboard/content/new" className="hx-btn-secondary text-xs">AI Generate</Link>}
          />
        </motion.div>
      )}
    </PageTransition>
  )
}
