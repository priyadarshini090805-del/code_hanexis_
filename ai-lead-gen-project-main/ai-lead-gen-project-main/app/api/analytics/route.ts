import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { AnalyticsService } from '@/lib/services/analytics.service';

// GET /api/analytics
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const url = new URL(request.url);
    const view = url.searchParams.get('view') || 'summary';
    const dateFromStr = url.searchParams.get('dateFrom');
    const dateToStr = url.searchParams.get('dateTo');

    // Default to last 30 days
    const dateTo = dateToStr ? new Date(dateToStr) : new Date();
    const dateFrom = dateFromStr
      ? new Date(dateFromStr)
      : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Ensure today's analytics are calculated
    await AnalyticsService.calculateDailyAnalytics(auth.id);

    let result: any;

    switch (view) {
      case 'kpi':
        result = await AnalyticsService.getKPISummary(auth.id);
        break;

      case 'campaigns':
        result = await AnalyticsService.getCampaignMetrics(auth.id);
        break;

      case 'funnel':
        result = await AnalyticsService.getLeadFunnel(auth.id);
        break;

      case 'range':
      default:
        result = await AnalyticsService.getAnalyticsRange(
          auth.id,
          dateFrom,
          dateTo
        );
        break;
    }

    return successResponse('Analytics retrieved', result);
  } catch (error: any) {
    console.error('GET /api/analytics error:', error);
    return errorResponse(error.message, 500);
  }
}

