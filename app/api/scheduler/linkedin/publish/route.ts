import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { LinkedInService } from '@/lib/services/linkedin.service';
import { z } from 'zod';

const publishSchema = z.object({
  text: z.string().min(1).max(3000),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const { text } = publishSchema.parse(await request.json());

    const { postUrn } = await LinkedInService.publishPost(auth.id, null, text);

    return NextResponse.json({ success: true, postUrn });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}