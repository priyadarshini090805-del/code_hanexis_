import { NextRequest, NextResponse } from 'next/server';
import { GoogleService } from '@/lib/services/google.service';
import { createOAuthState } from '@/lib/oauth/state';
import { getRequestUserId } from '@/lib/oauth/get-user';

export async function GET(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.redirect(new URL('/login?error=auth', process.env.NEXT_PUBLIC_APP_URL));
  }
  return NextResponse.redirect(GoogleService.getAuthUrl(createOAuthState(userId)));
}
