'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface GenerationRequest {
  leadId: string
  messageType: string
  tone: string
  length: string
  productName: string
  valueProposition: string
}

interface GenerationResult {
  message: string
  tokensUsed: number
}

interface Usage {
  dailyGenerationsRemaining: number
  dailyTokensRemaining: number
  monthlyTokensRemaining: number
  generationsToday: number
  tokensUsedToday: number
  tokensUsedThisMonth: number
}

interface HistoryItem {
  id: string
  messageType: string
  tone: string
  length: string
  response: string
  tokensUsed: number
  createdAt: string
  lead: {
    firstName: string
    lastName: string
    company: string | null
  }
}

function AIPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = searchParams.get('leadId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/ai/status', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setAiConfigured(!!d.configured))
      .catch(() => setAiConfigured(null))
  }, [])

  const [formData, setFormData] = useState<GenerationRequest>({
    leadId: leadId || '',
    messageType: 'CONNECTION_MESSAGE',
    tone: 'PROFESSIONAL',
    length: 'MEDIUM',
    productName: '',
    valueProposition: '',
  })

  const messageTypes = [
    { value: 'CONNECTION_MESSAGE', label: 'LinkedIn Connection Message' },
    { value: 'FOLLOWUP_MESSAGE', label: 'Follow-up Message' },
    { value: 'SALES_PITCH', label: 'Sales Pitch' },
    { value: 'COLD_OUTREACH', label: 'Cold Outreach' },
    { value: 'CALL_INVITATION', label: 'Call Invitation' },
    { value: 'REENGAGEMENT', label: 'Re-engagement' },
  ]

  const tones = [
    { value: 'PROFESSIONAL', label: 'Professional' },
    { value: 'FRIENDLY', label: 'Friendly' },
    { value: 'CONSULTATIVE', label: 'Consultative' },
    { value: 'DIRECT', label: 'Direct' },
    { value: 'EXECUTIVE', label: 'Executive' },
  ]

  const lengths = [
    { value: 'SHORT', label: 'Short (50-100 words)' },
    { value: 'MEDIUM', label: 'Medium (150-250 words)' },
    { value: 'LONG', label: 'Long (300+ words)' },
  ]

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchUsage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchUsage() {
    try {
      const token = 'cookie'
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/ai/generate-message', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Failed to fetch usage')

      const data = await response.json()
      setUsage(data.data.usage)
      setHistory(data.data.history)
    } catch (err) {
      console.error('Fetch usage error:', err)
    }
  }

  async function handleGenerateMessage(e: React.FormEvent) {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const token = 'cookie'
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate message')
      }

      setResult(data.data)
      fetchUsage() // Refresh usage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate message')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">AI Message Generator</h1>
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-black"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {aiConfigured === false && (
          <div className="mb-6 rounded-md border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
            <strong>AI provider not configured.</strong> Messages are generated from
            built-in templates, not a live model. Set <code>OPENROUTER_API_KEY</code> to
            enable real AI generation.
          </div>
        )}
        <div className="grid grid-cols-3 gap-8">
          {/* Form */}
          <div className="col-span-2">
            <form onSubmit={handleGenerateMessage} className="space-y-6 bg-gray-50 p-6 rounded-lg">
              {error && (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md">
                  <p className="text-neutral-800">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-black mb-1">Lead ID</label>
                <input
                  type="text"
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  placeholder="Paste lead ID here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-600 mt-1">Or go to a lead page and click &quot;Generate Message&quot;</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Message Type</label>
                <select
                  value={formData.messageType}
                  onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {messageTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {tones.map(tone => (
                      <option key={tone.value} value={tone.value}>{tone.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Length</label>
                  <select
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {lengths.map(length => (
                      <option key={length.value} value={length.value}>{length.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g., HaneXes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Value Proposition</label>
                <textarea
                  value={formData.valueProposition}
                  onChange={(e) => setFormData({ ...formData, valueProposition: e.target.value })}
                  placeholder="What problem does your product solve?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 disabled:opacity-50 transition"
              >
                {loading ? 'Generating...' : 'Generate Message'}
              </button>
            </form>

            {/* Result */}
            {result && (
              <div className="mt-8 bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Generated Message</h3>
                <div className="bg-white p-4 border border-gray-200 rounded mb-4 max-h-64 overflow-y-auto">
                  <p className="text-black whitespace-pre-wrap">{result.message}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(result.message)}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 transition"
                  >
                    Copy to Clipboard
                  </button>
                  <p className="text-sm text-gray-600 self-center">
                    Tokens used: {result.tokensUsed}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-1">
            {/* Usage */}
            {usage && (
              <div className="p-4 border border-gray-200 rounded-lg mb-6">
                <h3 className="font-semibold text-black mb-4">Usage Limits</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Today&apos;s Generations</p>
                    <p className="text-black font-medium">{usage.generationsToday} / 50</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Daily Tokens</p>
                    <p className="text-black font-medium">{usage.tokensUsedToday} / 100,000</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Tokens</p>
                    <p className="text-black font-medium">{usage.tokensUsedThisMonth} / 1,000,000</p>
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-4">Recent Generations</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="text-sm p-2 border border-gray-200 rounded">
                      <p className="font-medium text-black">
                        {item.lead.firstName} {item.lead.lastName}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {item.messageType.replace(/_/g, ' ')} ({item.length})
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <AIPage />
    </Suspense>
  )
}
