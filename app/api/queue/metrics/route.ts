import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await verifyAuth(request);

    const jobTypes = ['OUTREACH', 'FOLLOWUP', 'CONTENT', 'NOTIFICATION'] as const;

    const metrics = await Promise.all(
      jobTypes.map(async (jobType) => {
        const [pending, processing, completed, failed] = await Promise.all([
          prisma.jobQueue.count({ where: { jobType, status: 'PENDING' } }),
          prisma.jobQueue.count({ where: { jobType, status: 'PROCESSING' } }),
          prisma.jobQueue.count({ where: { jobType, status: 'COMPLETED' } }),
          prisma.jobQueue.count({ where: { jobType, status: 'FAILED' } }),
        ]);
        return {
          name: jobType.toLowerCase(),
          count: pending + processing,
          failed,
          delayed: 0,
          active: processing,
          paused: 0,
          completed,
        };
      })
    );

    return successResponse(metrics);
  } catch (error: any) {
    console.error(error); return errorResponse('An unexpected error occurred', 500);
  }
}
