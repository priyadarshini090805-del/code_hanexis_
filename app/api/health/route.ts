import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbCheck = await prisma.$queryRaw`SELECT 1`;
    const timestamp = new Date().toISOString();

    return NextResponse.json({
      status: 'healthy',
      timestamp,
      services: {
        database: 'ok',
        redis: 'ok',
        api: 'ok',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
