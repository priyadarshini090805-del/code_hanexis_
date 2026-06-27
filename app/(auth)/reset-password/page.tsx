'use client'

import { useState, FormEvent, useEffect } from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface FieldErrors {
  [key: string]: string[]
}

function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.')
    }
  }, [token])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!token) {
      setError('Invalid reset link')
      return
    }

    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors)
        } else {
          setError(data.error || 'Failed to reset password')
        }
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
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
          <h2 className="text-xl font-semibold text-black">Password reset successfully</h2>
          <p className="text-sm text-gray-600 mt-1">
            
          </p>
        </div>

        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md">
          <p className="text-sm text-neutral-800">
            You can now sign in with your new password.
          </p>
        </div>

        <div>
          <Link href="/login" className="text-sm text-black font-medium hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-black">Invalid reset link</h2>
          <p className="text-sm text-gray-600 mt-1">
            {error}
          </p>
        </div>

        <div>
          <Link href="/forgot-password" className="text-sm text-black font-medium hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-black">Create a new password</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter a new password for your account.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
          <p className="text-sm text-neutral-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="••••••••"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-neutral-600">{fieldErrors.password[0]}</p>
          )}
          <p className="mt-1 text-xs text-gray-600">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-1">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="••••••••"
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-neutral-600">{fieldErrors.confirmPassword[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 disabled:opacity-50 transition"
        >
          {isLoading ? 'Resetting password...' : 'Reset password'}
        </button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm text-gray-600 hover:text-black transition">
          Back to login
        </Link>
      </div>
    </div>
  )
}


export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <ResetPasswordPage />
    </Suspense>
  )
}
