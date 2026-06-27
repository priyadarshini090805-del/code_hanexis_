'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import OAuthButtons from '@/components/OAuthButtons'
import { getCsrfToken } from '@/lib/csrf-client'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true); setError(null); setFieldErrors({})
    const fd = new FormData(e.currentTarget)
    try {
      const csrf = await getCsrfToken()
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({
          firstName: fd.get('firstName'), lastName: fd.get('lastName'),
          email: fd.get('email'), password: fd.get('password'),
          confirmPassword: fd.get('confirmPassword'),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors)
        else setError(data.error || 'Registration failed')
        return
      }
      router.push('/login?registered=true')
    } catch { setError('Something went wrong. Please try again.') }
    finally { setIsLoading(false) }
  }

  const err = (f: string) => fieldErrors[f]?.[0]

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Create your account</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Already have one?{' '}
          <Link href="/login" className="font-semibold text-black hover:underline underline-offset-4">Sign in</Link>
        </p>
      </div>

      <OAuthButtons />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs uppercase tracking-wider text-neutral-400">or email</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      {error && <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-700 animate-scale-in">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">First name</label>
            <input name="firstName" required className="hx-input" placeholder="Jane" suppressHydrationWarning />
            {err('firstName') && <p className="mt-1 text-xs text-neutral-600">{err('firstName')}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">Last name</label>
            <input name="lastName" required className="hx-input" placeholder="Doe" suppressHydrationWarning />
            {err('lastName') && <p className="mt-1 text-xs text-neutral-600">{err('lastName')}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1.5">Email</label>
          <input name="email" type="email" required className="hx-input" placeholder="you@example.com" suppressHydrationWarning />
          {err('email') && <p className="mt-1 text-xs text-neutral-600">{err('email')}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1.5">Password</label>
          <input name="password" type="password" required className="hx-input" placeholder="At least 8 characters" suppressHydrationWarning />
          {err('password') && <p className="mt-1 text-xs text-neutral-600">{err('password')}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1.5">Confirm password</label>
          <input name="confirmPassword" type="password" required className="hx-input" placeholder="Re-enter password" suppressHydrationWarning />
          {err('confirmPassword') && <p className="mt-1 text-xs text-neutral-600">{err('confirmPassword')}</p>}
        </div>
        <button type="submit" disabled={isLoading} className="hx-btn-primary w-full disabled:opacity-50">
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
