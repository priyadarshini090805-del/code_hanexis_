import { NextRequest, NextResponse } from 'next/server';
import { processOutreachQueue } from '@/lib/jobs/outreach-worker';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron: consumes outreach & follow-up jobs from the queue and delivers
 * them. Runs every 10 minutes (see vercel.json). Also callable manually.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await processOutreachQueue();
  return NextResponse.json({ processed: results.length, results, at: new Date().toISOString() });
}
