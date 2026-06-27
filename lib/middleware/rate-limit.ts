import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};
const DEFAULT_LIMIT = 100; // requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute

export function rateLimit(
  options: { limit?: number; window?: number } = {}
) {
  const limit = options.limit || DEFAULT_LIMIT;
  const window = options.window || WINDOW_MS;

  return (handler: Function) => {
    return async (req: NextRequest, context: any) => {
      const key = req.headers.get('x-user-id') || req.ip || 'anonymous';

      if (!store[key]) {
        store[key] = { count: 0, resetTime: Date.now() + window };
      }

      const entry = store[key];

      if (Date.now() > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = Date.now() + window;
      }

      if (entry.count >= limit) {
        return NextResponse.json(
          { success: false, message: 'Rate limit exceeded' },
          { status: 429 }
        );
      }

      entry.count++;

      const response = await handler(req, context);
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', (limit - entry.count).toString());

      return response;
    };
  };
}
