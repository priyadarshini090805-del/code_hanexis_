import { NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFTokenCookie } from '@/lib/security/csrf'

export async function GET() {
  try {
    const token = generateCSRFToken()
    await setCSRFTokenCookie(token)

    return NextResponse.json(
      {
        success: true,
        csrfToken: token,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
