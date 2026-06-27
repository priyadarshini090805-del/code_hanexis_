/**
 * Pure Node.js TOTP implementation — RFC 6238 / RFC 4226
 * No external packages needed.
 */
import { createHmac, randomBytes } from 'crypto';

// ── Base32 encoder/decoder ────────────────────────────────────────────────────
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let result = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_CHARS[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  while (result.length % 8 !== 0) result += '=';
  return result;
}

export function base32Decode(str: string): Buffer {
  str = str.replace(/=+$/, '').toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of str) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}

// ── HOTP (counter-based) ─────────────────────────────────────────────────────
function hotp(secret: Buffer, counter: bigint): string {
  const buf = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(counter & 0xffn);
    counter >>= 8n;
  }
  const hmac = createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[19] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

// ── TOTP (time-based, 30-second window) ─────────────────────────────────────
export function generateTOTP(secret: string, time?: number): string {
  const t = Math.floor((time ?? Date.now() / 1000) / 30);
  return hotp(base32Decode(secret), BigInt(t));
}

export function verifyTOTP(secret: string, token: string, window = 1): boolean {
  const t = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    if (hotp(base32Decode(secret), BigInt(t + i)) === token) return true;
  }
  return false;
}

// ── Secret generation ────────────────────────────────────────────────────────
export function generateTOTPSecret(): string {
  return base32Encode(randomBytes(20));
}

// ── OTP Auth URI (for QR code) ───────────────────────────────────────────────
export function generateOTPAuthURI(secret: string, email: string, issuer = 'Hanexes'): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?${params}`;
}
