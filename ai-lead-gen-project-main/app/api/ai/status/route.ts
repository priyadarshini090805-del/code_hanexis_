import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Reports whether a real AI provider key is configured (vs template fallback). */
export async function GET() {
  const key = process.env.OPENROUTER_API_KEY;
  const configured = !!key && key !== 'your-openrouter-api-key' && !key.startsWith('YOUR_');
  return NextResponse.json({
    configured,
    provider: configured ? 'openrouter' : 'template',
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct',
  });
}
