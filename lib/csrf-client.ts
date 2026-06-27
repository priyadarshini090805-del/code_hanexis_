/** Fetch a CSRF token (also sets the double-submit cookie) for login/register/etc. */
export async function getCsrfToken(): Promise<string> {
  try {
    const res = await fetch('/api/auth/csrf-token', { credentials: 'same-origin' })
    const data = await res.json()
    return data?.csrfToken || ''
  } catch { return '' }
}
