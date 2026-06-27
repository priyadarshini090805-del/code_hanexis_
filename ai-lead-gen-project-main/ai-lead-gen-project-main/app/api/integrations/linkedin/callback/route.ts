import { NextRequest, NextResponse } from 'next/server';
import { LinkedInService } from '@/lib/services/linkedin.service';
import { verifyOAuthState } from '@/lib/oauth/state';
import { NotificationService } from '@/lib/services/notification.service';

export async function GET(request: NextRequest) {
  const app = process.env.NEXT_PUBLIC_APP_URL!;
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  if (error || !code || !state) {
    return NextResponse.redirect(new URL(`/dashboard/integrations?error=${error || 'missing_code'}`, app));
  }
  const userId = verifyOAuthState(state);
  if (!userId) {
    return NextResponse.redirect(new URL('/dashboard/integrations?error=invalid_state', app));
  }
  try {
    const tokens = await LinkedInService.exchangeCode(code);
    await LinkedInService.saveConnection(userId, tokens);
    await NotificationService.create(userId, {
      type: 'INTEGRATION',
      title: 'LinkedIn connected',
      body: 'Your LinkedIn account is connected. Scheduled posts will publish automatically.',
      link: '/dashboard/integrations',
    });
    return NextResponse.redirect(new URL('/dashboard/integrations?connected=linkedin', app));
  } catch (e: any) {
    console.error('LinkedIn callback error:', e);
    return NextResponse.redirect(new URL(`/dashboard/integrations?error=${encodeURIComponent(e.message)}`, app));
  }
}
