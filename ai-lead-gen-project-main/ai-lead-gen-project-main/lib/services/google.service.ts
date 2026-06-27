import { prisma } from '@/lib/prisma';
import { CryptoService } from '@/lib/services/crypto.service';
import { NotificationService } from '@/lib/services/notification.service';

/**
 * Google integration:
 * - OAuth (offline) for Gmail read access
 * - Gmail inbox polling: inquiry-looking emails become Leads + notifications
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';

const INQUIRY_HINTS = [
  'interested', 'inquiry', 'enquiry', 'quote', 'pricing', 'demo',
  'service', 'partnership', 'collaborat', 'proposal', 'hire', 'project',
  'lead', 'consultation', 'meeting', 'opportunity',
];

export class GoogleService {
  static getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.readonly openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  static async exchangeCode(code: string) {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
    return res.json();
  }

  static async saveConnection(userId: string, tokens: any) {
    // fetch profile email
    let profileName = 'Google account';
    try {
      const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (r.ok) {
        const p = await r.json();
        profileName = p.email || p.name || profileName;
      }
    } catch { /* ignore */ }

    const integration = await prisma.integration.upsert({
      where: { userId_provider: { userId, provider: 'GOOGLE' } },
      update: { status: 'ACTIVE', profileName, connectedAt: new Date(), disconnectedAt: null, lastSyncAt: new Date() },
      create: { userId, provider: 'GOOGLE', status: 'ACTIVE', profileName, connectedAt: new Date(), lastSyncAt: new Date() },
    });
    await prisma.integrationToken.deleteMany({ where: { integrationId: integration.id } });
    await prisma.integrationToken.create({
      data: {
        integrationId: integration.id,
        accessToken: CryptoService.encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? CryptoService.encrypt(tokens.refresh_token) : null,
        expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
        scope: tokens.scope,
      },
    });
    return integration;
  }

  static async getValidAccessToken(userId: string): Promise<string> {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'GOOGLE' } },
      include: { tokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!integration || integration.status !== 'ACTIVE' || integration.tokens.length === 0) {
      throw new Error('Google is not connected.');
    }
    const row = integration.tokens[0];
    let token = CryptoService.decrypt(row.accessToken);

    if (row.expiresAt && row.expiresAt.getTime() < Date.now() + 60_000) {
      if (!row.refreshToken) throw new Error('Google token expired; reconnect Google.');
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: CryptoService.decrypt(row.refreshToken),
          grant_type: 'refresh_token',
        }),
      });
      if (!res.ok) throw new Error('Google token refresh failed; reconnect Google.');
      const data = await res.json();
      token = data.access_token;
      await prisma.integrationToken.update({
        where: { id: row.id },
        data: {
          accessToken: CryptoService.encrypt(token),
          expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
        },
      });
    }
    return token;
  }

  /** Poll Gmail for recent inquiry emails and convert them into leads. */
  static async pollGmailForLeads(userId: string): Promise<{ created: number }> {
    const token = await this.getValidAccessToken(userId);
    const query = encodeURIComponent('in:inbox newer_than:1d -category:promotions -category:social');
    const listRes = await fetch(`${GMAIL}/messages?q=${query}&maxResults=25`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!listRes.ok) throw new Error(`Gmail list failed: ${await listRes.text()}`);
    const list = await listRes.json();
    let created = 0;

    for (const m of list.messages || []) {
      const msgRes = await fetch(`${GMAIL}/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!msgRes.ok) continue;
      const msg = await msgRes.json();
      const headers: Record<string, string> = {};
      for (const h of msg.payload?.headers || []) headers[h.name.toLowerCase()] = h.value;

      const subject = headers['subject'] || '';
      const snippet = msg.snippet || '';
      const text = `${subject} ${snippet}`.toLowerCase();
      if (!INQUIRY_HINTS.some(k => text.includes(k))) continue;

      const fromRaw = headers['from'] || '';
      const emailMatch = fromRaw.match(/<([^>]+)>/) || [null, fromRaw.trim()];
      const email = (emailMatch[1] || '').toLowerCase();
      if (!email || !email.includes('@')) continue;
      const nameMatch = fromRaw.match(/^"?([^"<]+)"?\s*</);
      const fullName = (nameMatch?.[1] || email.split('@')[0]).trim();
      const [firstName, ...rest] = fullName.split(/\s+/);

      const externalId = `gmail:${m.id}`;
      const existing = await prisma.lead.findFirst({
        where: { userId, OR: [{ externalId }, { email }] },
      });
      if (existing) continue;

      const lead = await prisma.lead.create({
        data: {
          userId,
          firstName: firstName || 'Unknown',
          lastName: rest.join(' ') || '-',
          email,
          source: 'GMAIL',
          externalId,
          status: 'NEW',
          notes: `Subject: ${subject}\n\n${snippet}`,
        },
      });
      created++;
      await NotificationService.create(userId, {
        type: 'NEW_LEAD',
        title: `New lead from Gmail: ${fullName}`,
        body: subject || snippet.slice(0, 140),
        link: `/dashboard/leads`,
        metadata: { leadId: lead.id, source: 'GMAIL' },
      });
    }

    await prisma.integration.update({
      where: { userId_provider: { userId, provider: 'GOOGLE' } },
      data: { lastSyncAt: new Date() },
    });
    return { created };
  }
}
