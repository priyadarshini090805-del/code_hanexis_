import crypto from 'crypto';

/** Signed OAuth state: carries userId across the OAuth redirect without a session. */
export function createOAuthState(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  const sig = crypto.createHmac('sha256', process.env.JWT_SECRET || '').update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyOAuthState(state: string, maxAgeMs = 15 * 60 * 1000): string | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    const [userId, ts, sig] = decoded.split('.');
    if (!userId || !ts || !sig) return null;
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET || '').update(`${userId}.${ts}`).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    if (Date.now() - parseInt(ts) > maxAgeMs) return null;
    return userId;
  } catch {
    return null;
  }
}
