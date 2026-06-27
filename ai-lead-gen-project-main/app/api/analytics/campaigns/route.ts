import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { AnalyticsService } from '@/lib/services/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const metrics = await AnalyticsService.getCampaignMetrics(auth.id);

    return successResponse('Campaign metrics retrieved', metrics);
  } catch (error: any) {
    console.error('GET /api/analytics/campaigns error:', error);
    return errorResponse(error.message, 500);
  }
}
