import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleService } from '@/lib/services/google.service';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/** Vercel Cron: every 10 min, poll Gmail of all connected users for inquiry emails → leads. */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const integrations = await prisma.integration.findMany({
    where: { provider: 'GOOGLE', status: 'ACTIVE' },
    select: { userId: true },
    take: 50,
  });

  const results: any[] = [];
  for (const { userId } of integrations) {
    try {
      const r = await GoogleService.pollGmailForLeads(userId);
      results.push({ userId, ...r });
    } catch (e: any) {
      results.push({ userId, error: e.message });
    }
  }
  return NextResponse.json({ users: results.length, results });
}
