/**
 * Lightweight structured logger (JSON in production, pretty in dev).
 * Respects LOG_LEVEL (error | warn | info | debug; default info).
 *
 * captureError() is the single hook point for an error-monitoring SDK
 * (e.g. Sentry). To enable Sentry: install @sentry/nextjs, set SENTRY_DSN,
 * and call Sentry.captureException(err) inside captureError below.
 */
type Level = 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Record<Level, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const THRESHOLD = LEVELS[(process.env.LOG_LEVEL as Level) || 'info'] ?? LEVELS.info;
const isProd = process.env.NODE_ENV === 'production';

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] > THRESHOLD) return;
  const entry = { level, message, ...(meta || {}), ts: new Date().toISOString() };
  const line = isProd ? JSON.stringify(entry) : `[${level}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`;
  // eslint-disable-next-line no-console
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
}

export const logger = {
  error: (msg: string, meta?: Record<string, unknown>) => emit('error', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit('warn', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit('info', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => emit('debug', msg, meta),
};

/** Central error capture — log structured + (optionally) forward to Sentry. */
export function captureError(err: unknown, context?: Record<string, unknown>) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  emit('error', message, { ...context, stack });
  // Sentry hook (no-op until @sentry/nextjs + SENTRY_DSN are configured):
  // import * as Sentry from '@sentry/nextjs'; Sentry.captureException(err, { extra: context })
}
