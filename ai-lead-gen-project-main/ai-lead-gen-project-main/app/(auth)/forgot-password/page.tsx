'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email')
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-black">Check your email</h2>
          <p className="text-sm text-gray-600 mt-1">
            We&apos;ve sent a password reset link to your email address.
          </p>
        </div>

        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md">
          <p className="text-sm text-neutral-800">
            If you don&apos;t see the email, check your spam folder or try again in a few minutes.
          </p>
        </div>

        <div>
          <Link href="/login" className="text-sm text-black font-medium hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-black">Reset your password</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
          <p className="text-sm text-neutral-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 disabled:opacity-50 transition"
        >
          {isLoading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm text-gray-600 hover:text-black transition">
          Back to login
        </Link>
      </div>
      </div>
  );
}
