'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessagesSquare, Search } from 'lucide-react'
import { PageTransition, StaggerList, StaggerItem, springs } from '@/components/motion'
import { SkeletonCard } from '@/components/motion/Skeleton'
import { EmptyState } from '@/components/motion/EmptyState'

interface Conversation {
  id: string
  leadId: string
  platform: string
  unreadCount: number
  lastMessageAt: string
  lead: { firstName: string; lastName: string; email: string }
  messages?: Array<{ content: string }>
}

const PLATFORM_ICON: Record<string, string> = { email: '✉️', linkedin: '💼', instagram: '📷' }

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchConversations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversations')
      if (!response.ok) throw new Error('Failed to fetch conversations')
      const data = await response.json()
      setConversations(data.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const filtered = conversations.filter(c =>
    `${c.lead.firstName} ${c.lead.lastName} ${c.lead.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--hx-text)' }}>Conversations</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--hx-text-secondary)' }}>
            {conversations.length > 0 ? `${conversations.filter(c => c.unreadCount > 0).length} unread` : 'Your lead conversations'}
          </p>
        </div>
      </div>

      {error && (
        <motion.div className="p-4 rounded-xl mb-6 text-sm"
          style={{ background: 'rgba(166,60,60,0.06)', color: 'var(--hx-error)', border: '1px solid rgba(166,60,60,0.1)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>
      )}

      <motion.div className="mb-6 max-w-md" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...springs.gentle }}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--hx-text-secondary)', opacity: 0.5 }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..." className="hx-input pl-9" />
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}</div>
      ) : filtered.length > 0 ? (
        <StaggerList className="space-y-2">
          {filtered.map((c, i) => (
            <StaggerItem key={c.id} index={i}>
              <Link href={`/dashboard/conversations/${c.id}`}>
                <motion.div className="hx-card px-5 py-4 group cursor-pointer flex items-center gap-4"
                  whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6C2435, #823145)' }}>
                    {c.lead.firstName[0]}{c.lead.lastName?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--hx-text)' }}>
                        {c.lead.firstName} {c.lead.lastName}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: 'var(--hx-brand)' }}>
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--hx-text-secondary)' }}>
                      {c.messages?.[0]?.content || c.lead.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-lg">{PLATFORM_ICON[c.platform] || '💬'}</span>
                    <span className="text-[11px]" style={{ color: 'var(--hx-text-secondary)' }}>{timeAgo(c.lastMessageAt)}</span>
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      ) : (
        <motion.div className="hx-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState
            icon={<MessagesSquare size={24} style={{ color: 'var(--hx-brand)' }} />}
            title="No conversations yet"
            description="Conversations appear here when leads reply to your outreach or interact on social media."
          />
        </motion.div>
      )}
    </PageTransition>
  )
}
