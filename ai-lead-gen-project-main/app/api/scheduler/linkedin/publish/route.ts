import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { LinkedInService } from '@/lib/services/linkedin.service';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const { postUrn } = await LinkedInService.publishPost(auth.id, null, text);

    return NextResponse.json({ success: true, postUrn });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}