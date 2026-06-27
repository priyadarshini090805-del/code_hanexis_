import { NextRequest, NextResponse } from 'next/server';
import { processOutreachQueue } from '@/lib/jobs/outreach-worker';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * Manually-triggerable outreach worker (also run from /api/cron/process-scheduled
 * so it stays within the Hobby plan's cron-job limit). Consumes outreach &
 * follow-up jobs from the queue and delivers them.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await processOutreachQueue();
  return NextResponse.json({ processed: results.length, results, at: new Date().toISOString() });
}
