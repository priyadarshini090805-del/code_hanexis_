import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (e) {
    checks.database = 'error';
    healthy = false;
    logger.error('Health check: database unreachable', { subsystem: 'health', error: e instanceof Error ? e.message : 'unknown' });
  }

  checks.api = 'ok';

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
