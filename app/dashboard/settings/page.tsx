'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Shield, LogOut, CheckCircle } from 'lucide-react'
import { PageTransition, springs } from '@/components/motion'
import { SkeletonCard } from '@/components/motion/Skeleton'

interface UserSettings {
  name: string
  email: string
  timezone: string
  emailNotifications?: boolean
  weeklyReports?: boolean
  twoFactorEnabled: boolean
}

type TwoFAStep = 'idle' | 'setup' | 'verify' | 'disabling'

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>({
    name: '', email: '', timezone: 'UTC', emailNotifications: true, weeklyReports: true, twoFactorEnabled: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>('idle')
  const [qrUri, setQrUri] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [totpToken, setTotpToken] = useState('')
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [twoFAError, setTwoFAError] = useState('')

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings', { credentials: 'same-origin' })
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setSettings(data.data)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  async function handleSave() {
    try {
      setSaving(true); setError('')
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setSuccess('Settings saved'); setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      router.push('/login')
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed') }
  }

  async function start2FASetup() {
    setTwoFALoading(true); setTwoFAError('')
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST', credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) { setTwoFAError(data.message || 'Setup failed'); return }
      setQrUri(data.data.uri); setTotpSecret(data.data.secret); setTwoFAStep('setup')
    } finally { setTwoFALoading(false) }
  }

  async function verify2FA() {
    if (!/^\d{6}$/.test(totpToken)) { setTwoFAError('Enter a 6-digit code'); return }
    setTwoFALoading(true); setTwoFAError('')
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', body: JSON.stringify({ token: totpToken, mode: 'setup' }),
      })
      const data = await res.json()
      if (!res.ok) { setTwoFAError(data.message || 'Verification failed'); return }
      setSettings(s => ({ ...s, twoFactorEnabled: true }))
      setTwoFAStep('idle'); setTotpToken(''); setQrUri(''); setTotpSecret('')
      setSuccess('2FA enabled successfully!'); setTimeout(() => setSuccess(''), 4000)
    } finally { setTwoFALoading(false) }
  }

  async function disable2FA() {
    if (!/^\d{6}$/.test(totpToken)) { setTwoFAError('Enter a 6-digit code to confirm'); return }
    setTwoFALoading(true); setTwoFAError('')
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', body: JSON.stringify({ token: totpToken }),
      })
      const data = await res.json()
      if (!res.ok) { setTwoFAError(data.message || 'Failed to disable'); return }
      setSettings(s => ({ ...s, twoFactorEnabled: false }))
      setTwoFAStep('idle'); setTotpToken('')
      setSuccess('2FA disabled'); setTimeout(() => setSuccess(''), 3000)
    } finally { setTwoFALoading(false) }
  }

  if (loading) return <div className="max-w-2xl mx-auto space-y-4 py-8"><SkeletonCard lines={5} /><SkeletonCard lines={3} /></div>

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--hx-text)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--hx-text-secondary)' }}>Manage your account and security preferences</p>
      </div>

      <div className="max-w-2xl space-y-5">
        {error && (
          <motion.div className="p-4 rounded-xl text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: 'rgba(166,60,60,0.06)', color: 'var(--hx-error)', border: '1px solid rgba(166,60,60,0.1)' }}>
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div className="p-4 rounded-xl text-sm flex items-center gap-2" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(47,107,69,0.06)', color: 'var(--hx-success)', border: '1px solid rgba(47,107,69,0.1)' }}>
            <CheckCircle size={16} /> {success}
          </motion.div>
        )}

        {/* Account */}
        <motion.div className="hx-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle}>
          <div className="flex items-center gap-2 mb-5">
            <Settings size={16} style={{ color: 'var(--hx-brand)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--hx-text)' }}>Account</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--hx-text-secondary)' }}>Name</label>
              <input type="text" value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} className="hx-input" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--hx-text-secondary)' }}>Email</label>
              <input type="email" value={settings.email} disabled className="hx-input opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--hx-text-secondary)' }}>Timezone</label>
              <select value={settings.timezone} onChange={e => setSettings({ ...settings, timezone: e.target.value })} className="hx-input">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
              </select>
            </div>
            <button onClick={handleSave} disabled={saving} className="hx-btn-primary text-xs">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>

        {/* 2FA */}
        <motion.div className="hx-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...springs.gentle }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: 'var(--hx-brand)' }} />
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--hx-text)' }}>Two-Factor Authentication</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--hx-text-secondary)' }}>Extra security via authenticator app</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
              style={{ background: settings.twoFactorEnabled ? 'rgba(47,107,69,0.08)' : 'rgba(0,0,0,0.04)', color: settings.twoFactorEnabled ? 'var(--hx-success)' : 'var(--hx-text-secondary)' }}>
              {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {twoFAError && (
            <div className="p-3 rounded-lg text-sm mb-3" style={{ background: 'rgba(166,60,60,0.06)', color: 'var(--hx-error)' }}>{twoFAError}</div>
          )}

          {twoFAStep === 'idle' && !settings.twoFactorEnabled && (
            <button onClick={start2FASetup} disabled={twoFALoading} className="hx-btn-primary text-xs">
              {twoFALoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          )}

          {twoFAStep === 'setup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'var(--hx-surface-secondary)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--hx-text)' }}>Step 1: Scan the QR code</p>
                <p className="text-xs mb-3" style={{ color: 'var(--hx-text-secondary)' }}>Open your authenticator app and scan this code.</p>
                <div className="flex gap-4 items-start">
                  <img src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(qrUri)}`}
                    alt="QR Code" className="w-36 h-36 rounded-lg" style={{ border: '1px solid var(--hx-border)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <div>
                    <p className="text-[11px] mb-1" style={{ color: 'var(--hx-text-secondary)' }}>Manual entry key:</p>
                    <code className="text-xs px-2 py-1 rounded font-mono break-all select-all" style={{ background: 'rgba(108,36,53,0.06)' }}>{totpSecret}</code>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'var(--hx-surface-secondary)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--hx-text)' }}>Step 2: Enter the 6-digit code</p>
                <div className="flex gap-3">
                  <input type="text" value={totpToken} onChange={e => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456" maxLength={6} className="hx-input font-mono tracking-widest text-center flex-1" />
                  <button onClick={verify2FA} disabled={twoFALoading || totpToken.length !== 6} className="hx-btn-primary text-xs">
                    {twoFALoading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                  <button onClick={() => { setTwoFAStep('idle'); setTotpToken(''); setTwoFAError('') }} className="hx-btn-ghost text-xs">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {twoFAStep === 'idle' && settings.twoFactorEnabled && (
            <button onClick={() => setTwoFAStep('disabling')} className="hx-btn-ghost text-xs" style={{ color: 'var(--hx-error)' }}>Disable 2FA</button>
          )}

          {twoFAStep === 'disabling' && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(166,60,60,0.04)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--hx-error)' }}>Confirm 2FA removal</p>
              <div className="flex gap-3">
                <input type="text" value={totpToken} onChange={e => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code" maxLength={6} className="hx-input font-mono tracking-widest text-center flex-1" />
                <button onClick={disable2FA} disabled={twoFALoading || totpToken.length !== 6}
                  className="hx-btn text-xs text-white" style={{ background: 'var(--hx-error)' }}>
                  {twoFALoading ? 'Disabling...' : 'Confirm Disable'}
                </button>
                <button onClick={() => { setTwoFAStep('idle'); setTotpToken(''); setTwoFAError('') }} className="hx-btn-ghost text-xs">Cancel</button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Danger zone */}
        <motion.div className="hx-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...springs.gentle }}>
          <div className="flex items-center gap-2 mb-3">
            <LogOut size={16} style={{ color: 'var(--hx-error)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--hx-text)' }}>Session</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--hx-text-secondary)' }}>Sign out of your current session on this device.</p>
          <button onClick={handleLogout} className="hx-btn-ghost text-xs" style={{ color: 'var(--hx-error)' }}>
            <LogOut size={13} /> Sign Out
          </button>
        </motion.div>
      </div>
    </PageTransition>
  )
}
