import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function clear() {
  const store = await cookies()
  store.set('accessToken', '', { httpOnly: true, path: '/', maxAge: 0 })
  store.set('refreshToken', '', { httpOnly: true, path: '/', maxAge: 0 })
  return NextResponse.json({ success: true })
}
export async function POST() { return clear() }
export async function GET() { return clear() }
