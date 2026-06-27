import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/services/notification.service';

/**
 * Google Ads Lead Form webhook.
 * Configure in Google Ads: Lead form asset → "Webhook integration".
 * URL: https://<your-app>/api/webhooks/google-ads
 * Key: set the same value as GOOGLE_ADS_WEBHOOK_KEY env var.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const expectedKey = process.env.GOOGLE_ADS_WEBHOOK_KEY || process.env.INSTAGRAM_WEBHOOK_TOKEN;
    if (expectedKey && body.google_key !== expectedKey) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
    }

    const integration = await prisma.integration.findFirst({
      where: { provider: 'GOOGLE', status: 'ACTIVE' },
    });
    const fallbackUser = integration?.userId
      || (await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } }))?.id;
    if (!fallbackUser) return NextResponse.json({ ok: true });

    const fields: Record<string, string> = {};
    for (const col of body.user_column_data || []) {
      fields[(col.column_id || col.column_name || '').toLowerCase()] = col.string_value || '';
    }

    const email = fields['email'] || '';
    const fullName = fields['full_name'] || [fields['first_name'], fields['last_name']].filter(Boolean).join(' ') || 'Google Lead';
    const [firstName, ...rest] = fullName.split(/\s+/);
    const externalId = body.lead_id ? `googleads:${body.lead_id}` : undefined;

    const existing = externalId
      ? await prisma.lead.findFirst({ where: { userId: fallbackUser, externalId } })
      : null;
    if (existing) return NextResponse.json({ ok: true, duplicate: true });

    const lead = await prisma.lead.create({
      data: {
        userId: fallbackUser,
        firstName: firstName || 'Google',
        lastName: rest.join(' ') || 'Lead',
        email: email || `unknown+${Date.now()}@googleads.lead`,
        phone: fields['phone_number'],
        company: fields['company_name'],
        jobTitle: fields['job_title'],
        source: 'GOOGLE_ADS',
        externalId,
        status: 'NEW',
        notes: `Campaign: ${body.campaign_id || 'n/a'} | Form: ${body.form_id || 'n/a'}`,
      },
    });

    await NotificationService.create(fallbackUser, {
      type: 'NEW_LEAD',
      title: `New Google Ads lead: ${fullName}`,
      body: email,
      link: '/dashboard/leads',
      metadata: { leadId: lead.id, source: 'GOOGLE_ADS' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Google Ads webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
