'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import OAuthButtons from '@/components/OAuthButtons'
import { getCsrfToken } from '@/lib/csrf-client'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true); setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      const csrf = await getCsrfToken()
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password'), rememberMe }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      router.push('/dashboard'); router.refresh()
    } catch { setError('Something went wrong. Please try again.') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Welcome back</h1>
        <p className="text-sm text-neutral-500 mt-1">
          New here?{' '}
          <Link href="/register" className="font-semibold text-black hover:underline underline-offset-4">Create an account</Link>
        </p>
      </div>

      <OAuthButtons />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs uppercase tracking-wider text-neutral-400">or email</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      {error && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-700 animate-scale-in">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black mb-1.5">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="hx-input" placeholder="you@example.com" suppressHydrationWarning />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-black">Password</label>
            <Link href="/forgot-password" className="text-xs text-neutral-500 hover:text-black">Forgot?</Link>
          </div>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="hx-input" placeholder="........" suppressHydrationWarning />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-600 select-none">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 accent-black" suppressHydrationWarning />
          Remember me for 7 days
        </label>
        <button type="submit" disabled={isLoading} className="hx-btn-primary w-full disabled:opacity-50">
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
