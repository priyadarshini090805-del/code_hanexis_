import { NextRequest, NextResponse } from 'next/server';
import { InstagramService } from '@/lib/services/instagram.service';
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
    const tokens = await InstagramService.exchangeCode(code);
    await InstagramService.saveConnection(userId, tokens);
    await NotificationService.create(userId, {
      type: 'INTEGRATION',
      title: 'Instagram connected',
      body: 'Your Instagram Business account is connected.',
      link: '/dashboard/integrations',
    });
    return NextResponse.redirect(new URL('/dashboard/integrations?connected=instagram', app));
  } catch (e: any) {
    console.error('Instagram callback error:', e);
    return NextResponse.redirect(new URL(`/dashboard/integrations?error=${encodeURIComponent(e.message)}`, app));
  }
}
