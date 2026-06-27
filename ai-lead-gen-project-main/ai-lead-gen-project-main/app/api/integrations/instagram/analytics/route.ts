import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { InstagramService } from '@/lib/services/instagram.service';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';

    const accessToken = request.headers.get('x-instagram-token');
    if (!accessToken) {
      return errorResponse('Missing Instagram token', 401);
    }

    const analytics = await InstagramService.getAnalytics(payload.id, accessToken, period);
    return successResponse({ metrics: analytics });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
