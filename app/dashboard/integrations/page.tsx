'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion'
import { SkeletonCard } from '@/components/motion/Skeleton'

interface Integration {
  id: string
  provider: 'LINKEDIN' | 'INSTAGRAM' | 'GOOGLE'
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  profileName?: string
  profileUrl?: string
  connectedAt?: string
  lastSyncAt?: string
}

const PROVIDERS = [
  { name: 'LinkedIn', id: 'LINKEDIN', icon: '💼', description: 'Sync leads, publish posts, and track engagement' },
  { name: 'Instagram', id: 'INSTAGRAM', icon: '📷', description: 'Publish content and capture leads from DMs and comments' },
  { name: 'Google', id: 'GOOGLE', icon: '🔍', description: 'Capture Gmail inquiries as leads automatically' },
]

const STATUS_CONFIG = {
  ACTIVE: { icon: CheckCircle, color: 'var(--hx-success)', label: 'Connected', bg: 'rgba(47,107,69,0.08)' },
  INACTIVE: { icon: XCircle, color: 'var(--hx-text-secondary)', label: 'Disconnected', bg: 'rgba(0,0,0,0.04)' },
  EXPIRED: { icon: AlertCircle, color: 'var(--hx-warning)', label: 'Expired', bg: 'rgba(196,139,42,0.08)' },
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState('')

  useEffect(() => {
    fetchIntegrations()
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected')) setBanner(`${params.get('connected')} connected successfully!`)
    if (params.get('error')) setError(decodeURIComponent(params.get('error') || ''))
  }, [])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/integrations')
      if (!response.ok) throw new Error('Failed to fetch integrations')
      const data = await response.json()
      setIntegrations(data.data?.integrations || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const getIntegration = (providerId: string) => integrations.find(i => i.provider === providerId)

  const disconnectIntegration = async (id: string) => {
    if (!confirm('Disconnect this integration?')) return
    try {
      const response = await fetch(`/api/integrations/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to disconnect')
      setIntegrations(integrations.filter(i => i.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  const handleConnect = (providerId: string) => {
    window.location.href = `/api/integrations/${providerId.toLowerCase()}/authorize`
  }

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--hx-text)' }}>Integrations</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--hx-text-secondary)' }}>Connect your platforms to automate lead generation</p>
      </div>

      {banner && (
        <motion.div className="p-4 rounded-xl mb-6 text-sm flex items-center gap-2"
          style={{ background: 'rgba(47,107,69,0.06)', color: 'var(--hx-success)', border: '1px solid rgba(47,107,69,0.1)' }}
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <CheckCircle size={16} /> {banner}
        </motion.div>
      )}

      {error && (
        <motion.div className="p-4 rounded-xl mb-6 text-sm"
          style={{ background: 'rgba(166,60,60,0.06)', color: 'var(--hx-error)', border: '1px solid rgba(166,60,60,0.1)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
        </div>
      ) : (
        <StaggerList className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PROVIDERS.map((provider, i) => {
            const integration = getIntegration(provider.id)
            const sc = integration ? STATUS_CONFIG[integration.status] || STATUS_CONFIG.INACTIVE : null
            return (
              <StaggerItem key={provider.id} index={i}>
                <motion.div className="hx-card p-6 flex flex-col h-full"
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                  <div className="text-3xl mb-4">{provider.icon}</div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--hx-text)' }}>{provider.name}</h3>
                  <p className="text-xs mb-5 flex-1" style={{ color: 'var(--hx-text-secondary)' }}>{provider.description}</p>

                  {integration && sc ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: sc.bg }}>
                        <sc.icon size={14} style={{ color: sc.color }} />
                        <span className="text-xs font-semibold" style={{ color: sc.color }}>{sc.label}</span>
                      </div>
                      {integration.profileName && (
                        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--hx-surface-secondary)' }}>
                          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--hx-text-secondary)' }}>Profile</div>
                          <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--hx-text)' }}>{integration.profileName}</div>
                        </div>
                      )}
                      {integration.connectedAt && (
                        <div className="text-[11px]" style={{ color: 'var(--hx-text-secondary)' }}>
                          Connected {new Date(integration.connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                      <button onClick={() => disconnectIntegration(integration.id)}
                        className="w-full hx-btn-ghost text-xs justify-center" style={{ color: 'var(--hx-error)' }}>
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleConnect(provider.id)} className="w-full hx-btn-primary text-xs justify-center">
                      Connect {provider.name}
                    </button>
                  )}
                </motion.div>
              </StaggerItem>
            )
          })}
        </StaggerList>
      )}
    </PageTransition>
  )
}
