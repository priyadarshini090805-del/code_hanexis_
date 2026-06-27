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

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'csv';
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    if (!dateFrom || !dateTo) {
      return errorResponse('dateFrom and dateTo required', 400);
    }

    const csv = await AnalyticsService.exportAnalytics(
      auth.id,
      new Date(dateFrom),
      new Date(dateTo)
    );

    if (format === 'csv') {
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="analytics.csv"',
        },
      });
    }

    return successResponse('Analytics exported', { data: csv });
  } catch (error: any) {
    console.error('GET /api/analytics/export error:', error);
    return errorResponse(error.message, 500);
  }
}
