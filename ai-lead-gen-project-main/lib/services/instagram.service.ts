import { prisma } from '@/lib/prisma';
import { CryptoService } from '@/lib/services/crypto.service';

/**
 * Instagram integration via "Instagram API with Instagram Login" (Business accounts).
 * - OAuth: instagram.com/oauth/authorize → api.instagram.com/oauth/access_token
 *   → exchanged for a 60-day long-lived token (graph.instagram.com).
 * - Publishing: POST /{ig-user-id}/media → /{ig-user-id}/media_publish
 *   (requires an image/video URL; Instagram does not allow text-only posts).
 */

const GRAPH = 'https://graph.instagram.com/v21.0';

export class InstagramService {
  // ---------- OAuth ----------
  static getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID || '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/instagram/callback`,
      response_type: 'code',
      scope: 'instagram_business_basic,instagram_business_content_publish',
      state,
    });
    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  static async exchangeCode(code: string): Promise<{ accessToken: string; expiresIn: number; igUserId: string }> {
    const res = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID || '',
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/instagram/callback`,
        code,
      }),
    });
    if (!res.ok) throw new Error(`Instagram token exchange failed: ${await res.text()}`);
    const shortLived = await res.json();

    // Exchange for long-lived (60-day) token
    const llRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${shortLived.access_token}`
    );
    if (!llRes.ok) throw new Error(`Instagram long-lived token exchange failed: ${await llRes.text()}`);
    const longLived = await llRes.json();

    return {
      accessToken: longLived.access_token,
      expiresIn: longLived.expires_in || 5184000,
      igUserId: String(shortLived.user_id),
    };
  }

  static async saveConnection(userId: string, tokens: { accessToken: string; expiresIn: number; igUserId: string }) {
    const profile = await this.fetchProfile(tokens.accessToken);
    const integration = await prisma.integration.upsert({
      where: { userId_provider: { userId, provider: 'INSTAGRAM' } },
      update: {
        status: 'ACTIVE',
        profileName: profile.username,
        profileUrl: `https://instagram.com/${profile.username}`,
        connectedAt: new Date(),
        disconnectedAt: null,
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        provider: 'INSTAGRAM',
        status: 'ACTIVE',
        profileName: profile.username,
        profileUrl: `https://instagram.com/${profile.username}`,
        connectedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });
    await prisma.integrationToken.deleteMany({ where: { integrationId: integration.id } });
    await prisma.integrationToken.create({
      data: {
        integrationId: integration.id,
        accessToken: CryptoService.encrypt(tokens.accessToken),
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scope: `ig_user_id:${tokens.igUserId}`,
      },
    });
    return integration;
  }

  static async getValidAccessToken(userId: string): Promise<{ token: string; igUserId: string }> {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'INSTAGRAM' } },
      include: { tokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!integration || integration.status !== 'ACTIVE' || integration.tokens.length === 0) {
      throw new Error('Instagram is not connected. Go to Integrations and connect Instagram.');
    }
    const row = integration.tokens[0];
    let token = CryptoService.decrypt(row.accessToken);
    const igUserId = row.scope?.replace('ig_user_id:', '') || 'me';

    // Refresh long-lived token if older than 30 days remaining window
    if (row.expiresAt && row.expiresAt.getTime() < Date.now() + 7 * 24 * 3600 * 1000) {
      try {
        const res = await fetch(
          `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
        );
        if (res.ok) {
          const data = await res.json();
          token = data.access_token;
          await prisma.integrationToken.update({
            where: { id: row.id },
            data: {
              accessToken: CryptoService.encrypt(token),
              expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
            },
          });
        }
      } catch { /* keep existing token */ }
    }
    return { token, igUserId };
  }

  // ---------- Profile / media ----------
  static async fetchProfile(accessToken: string): Promise<{ user_id: string; username: string }> {
    const res = await fetch(`${GRAPH}/me?fields=user_id,username,account_type&access_token=${accessToken}`);
    if (!res.ok) throw new Error(`Instagram profile fetch failed: ${await res.text()}`);
    return res.json();
  }

  static async syncProfile(userId: string, _token?: string) {
    const { token } = await this.getValidAccessToken(userId);
    const profile = await this.fetchProfile(token);
    await prisma.integration.update({
      where: { userId_provider: { userId, provider: 'INSTAGRAM' } },
      data: { profileName: profile.username, lastSyncAt: new Date() },
    });
    return profile;
  }

  static async syncMedia(userId: string, _token?: string) {
    const { token } = await this.getValidAccessToken(userId);
    const res = await fetch(`${GRAPH}/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=25&access_token=${token}`);
    if (!res.ok) throw new Error(`Instagram media fetch failed: ${await res.text()}`);
    return res.json();
  }

  static async getAnalytics(userId: string, _token?: string, _period?: string) {
    const media = await this.syncMedia(userId);
    return { mediaCount: media?.data?.length ?? 0, recentMedia: media?.data ?? [] };
  }

  // ---------- Publishing ----------
  /** Publish an image post. Instagram requires a publicly accessible image URL. */
  static async publishPost(
    userId: string,
    _token: string | null,
    caption: string,
    imageUrl?: string,
    hashtags?: string[]
  ): Promise<string> {
    if (!imageUrl) {
      throw new Error('Instagram requires an image. Provide an image URL to publish.');
    }
    const { token, igUserId } = await this.getValidAccessToken(userId);
    const fullCaption = hashtags?.length ? `${caption}\n\n${hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ')}` : caption;

    const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ image_url: imageUrl, caption: fullCaption, access_token: token }),
    });
    if (!createRes.ok) throw new Error(`Instagram media creation failed: ${await createRes.text()}`);
    const container = await createRes.json();

    const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ creation_id: container.id, access_token: token }),
    });
    if (!publishRes.ok) throw new Error(`Instagram publish failed: ${await publishRes.text()}`);
    const published = await publishRes.json();
    return published.id;
  }

  /** Store a scheduled post; the cron publisher picks it up at the scheduled time. */
  static async schedulePost(userId: string, _token: string | null, caption: string, imageUrl: string | undefined, scheduledTime: Date) {
    const scheduled = await prisma.scheduledContent.create({
      data: {
        userId,
        title: caption.slice(0, 80),
        body: JSON.stringify({ caption, imageUrl }),
        platform: 'instagram',
        status: 'SCHEDULED',
        scheduledFor: scheduledTime,
      },
    });
    return scheduled.id;
  }

  static async disconnect(userId: string) {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'INSTAGRAM' } },
    });
    if (!integration) return null;
    await prisma.integrationToken.deleteMany({ where: { integrationId: integration.id } });
    return prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'INACTIVE', disconnectedAt: new Date() },
    });
  }
}
