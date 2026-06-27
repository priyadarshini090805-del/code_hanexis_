import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/services/notification.service';

/**
 * LinkedIn webhook — receives Lead Gen Form notifications and engagement events.
 * GET handles LinkedIn's challenge verification.
 */
export async function GET(request: NextRequest) {
  const challengeCode = request.nextUrl.searchParams.get('challengeCode');
  if (challengeCode) {
    const secret = process.env.LINKEDIN_CLIENT_SECRET || '';
    const challengeResponse = crypto.createHmac('sha256', secret).update(challengeCode).digest('hex');
    return NextResponse.json({ challengeCode, challengeResponse });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // HMAC signature verification
    const webhookSecret = process.env.LINKEDIN_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-li-signature') || request.headers.get('x-hub-signature-256');
      const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
      const sigValue = (signature || '').replace(/^sha256=/, '');
      const sigBuf = Buffer.from(sigValue);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('LINKEDIN_WEBHOOK_SECRET not set — rejecting webhook in production');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const event = JSON.parse(body || '{}');

    // Tenant resolution: extract the organization/owner ID from the event and
    // match against stored integration metadata. Fall back to storing the raw
    // event without creating a lead if we cannot identify the owner.
    const orgUrn = extractOrganizationUrn(event);
    let integration = null;

    if (orgUrn) {
      // Try to match via profileUrl which may contain the org identifier
      integration = await prisma.integration.findFirst({
        where: {
          provider: 'LINKEDIN',
          status: 'ACTIVE',
          OR: [
            { profileUrl: { contains: orgUrn } },
            { profileName: orgUrn },
          ],
        },
      });
    }

    if (!integration) {
      // Count active integrations — if exactly one, it's unambiguous
      const activeIntegrations = await prisma.integration.findMany({
        where: { provider: 'LINKEDIN', status: 'ACTIVE' },
        take: 2,
      });

      if (activeIntegrations.length === 1) {
        integration = activeIntegrations[0];
      } else if (activeIntegrations.length === 0) {
        return NextResponse.json({ ok: true, note: 'no active linkedin integration' });
      } else {
        // Multiple active integrations and we can't disambiguate — store the
        // raw event on the first one for manual review but do NOT create leads.
        console.warn('LinkedIn webhook: multiple active integrations, cannot resolve tenant. Storing raw event only.');
        await prisma.webhookEvent.create({
          data: {
            integrationId: activeIntegrations[0].id,
            eventType: event.type || event.eventType || 'LINKEDIN_EVENT_UNRESOLVED',
            payload: body.slice(0, 60000),
          },
        });
        return NextResponse.json({ success: true, note: 'event stored, tenant ambiguous' });
      }
    }

    await prisma.webhookEvent.create({
      data: {
        integrationId: integration.id,
        eventType: event.type || event.eventType || 'LINKEDIN_EVENT',
        payload: body.slice(0, 60000),
      },
    });

    // Lead Gen Form response notification
    const leadData = extractLead(event);
    if (leadData?.email || leadData?.name) {
      const [firstName, ...rest] = (leadData.name || 'LinkedIn Lead').split(/\s+/);
      const externalId = leadData.externalId ? `linkedin:${leadData.externalId}` : undefined;

      const existing = externalId
        ? await prisma.lead.findFirst({ where: { userId: integration.userId, externalId } })
        : leadData.email
          ? await prisma.lead.findFirst({ where: { userId: integration.userId, email: leadData.email } })
          : null;

      if (!existing) {
        const lead = await prisma.lead.create({
          data: {
            userId: integration.userId,
            firstName: firstName || 'LinkedIn',
            lastName: rest.join(' ') || 'Lead',
            email: leadData.email || `unknown+${Date.now()}@linkedin.lead`,
            company: leadData.company,
            jobTitle: leadData.jobTitle,
            source: 'LINKEDIN',
            externalId,
            status: 'NEW',
            notes: leadData.notes,
          },
        });
        await NotificationService.create(integration.userId, {
          type: 'NEW_LEAD',
          title: `New LinkedIn lead: ${leadData.name || leadData.email}`,
          body: leadData.notes || 'Captured from LinkedIn',
          link: '/dashboard/leads',
          metadata: { leadId: lead.id, source: 'LINKEDIN' },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('LinkedIn webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

function extractOrganizationUrn(event: any): string | null {
  // LinkedIn events often include an organization URN like "urn:li:organization:12345"
  const urn = event.organizationUrn || event.ownerUrn || event.organization?.id;
  if (urn) {
    const match = String(urn).match(/(\d+)$/);
    return match ? match[1] : String(urn);
  }
  return null;
}

function extractLead(event: any): { name?: string; email?: string; company?: string; jobTitle?: string; notes?: string; externalId?: string } | null {
  if (event?.leadGenFormResponse || event?.formResponse) {
    const r = event.leadGenFormResponse || event.formResponse;
    const answers: Record<string, string> = {};
    for (const a of r.answers || []) {
      answers[(a.question || a.name || '').toLowerCase()] = a.answer || a.value || '';
    }
    return {
      name: answers['full name'] || [answers['first name'], answers['last name']].filter(Boolean).join(' '),
      email: answers['email'] || answers['email address'],
      company: answers['company'] || answers['company name'],
      jobTitle: answers['job title'],
      notes: JSON.stringify(answers).slice(0, 1000),
      externalId: r.id || r.responseId,
    };
  }
  if (event?.type === 'SOCIAL_ACTION' || event?.comment || event?.reaction) {
    const actor = event.actor || event.comment?.actor || {};
    return {
      name: actor.name || 'LinkedIn engagement',
      email: undefined,
      notes: `Engaged with your post: ${event.comment?.message || event.reaction?.type || 'interaction'}`,
      externalId: event.id,
    };
  }
  if (event?.lead) {
    return {
      name: event.lead.name,
      email: event.lead.email,
      company: event.lead.company,
      notes: event.lead.message,
      externalId: event.lead.id,
    };
  }
  return null;
}
