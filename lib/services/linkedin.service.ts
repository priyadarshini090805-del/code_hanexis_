import { prisma } from '@/lib/prisma';
import { CryptoService } from '@/lib/services/crypto.service';

/**
 * LinkedIn integration (modern APIs):
 * - OAuth 2.0 (OpenID Connect): profile via /v2/userinfo
 * - Posting via /v2/ugcPosts (requires "Share on LinkedIn" product, scope w_member_social)
 */

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API = 'https://api.linkedin.com';

export class LinkedInService {
  // ---------- OAuth ----------
  static getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linkedin/callback`,
      state,
      scope: 'openid profile email w_member_social',
    });
    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
  }

  static async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    scope?: string;
  }> {
    const res = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID || '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linkedin/callback`,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`LinkedIn token exchange failed: ${t}`);
    }
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  /** Store tokens (encrypted) and activate the integration. */
  static async saveConnection(userId: string, tokens: {
    accessToken: string; refreshToken?: string; expiresIn: number; scope?: string;
  }) {
    const profile = await this.fetchUserInfo(tokens.accessToken);
    const integration = await prisma.integration.upsert({
      where: { userId_provider: { userId, provider: 'LINKEDIN' } },
      update: {
        status: 'ACTIVE',
        profileName: profile.name,
        profileUrl: profile.sub ? `urn:li:person:${profile.sub}` : null,
        connectedAt: new Date(),
        disconnectedAt: null,
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        provider: 'LINKEDIN',
        status: 'ACTIVE',
        profileName: profile.name,
        profileUrl: profile.sub ? `urn:li:person:${profile.sub}` : null,
        connectedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });

    await prisma.integrationToken.deleteMany({ where: { integrationId: integration.id } });
    await prisma.integrationToken.create({
      data: {
        integrationId: integration.id,
        accessToken: CryptoService.encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? CryptoService.encrypt(tokens.refreshToken) : null,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scope: tokens.scope,
      },
    });
    return { integration, personUrn: `urn:li:person:${profile.sub}` };
  }

  /** Get a decrypted, valid access token for a user (refreshing if possible). */
  static async getValidAccessToken(userId: string): Promise<{ token: string; personUrn: string | null }> {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'LINKEDIN' } },
      include: { tokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!integration || integration.status !== 'ACTIVE' || integration.tokens.length === 0) {
      throw new Error('LinkedIn is not connected. Go to Integrations and connect LinkedIn.');
    }
    const row = integration.tokens[0];
    let accessToken = CryptoService.decrypt(row.accessToken);

    if (row.expiresAt && row.expiresAt.getTime() < Date.now() + 60_000) {
      if (row.refreshToken) {
        const refreshed = await this.refreshAccessToken(CryptoService.decrypt(row.refreshToken));
        accessToken = refreshed.accessToken;
        await prisma.integrationToken.update({
          where: { id: row.id },
          data: {
            accessToken: CryptoService.encrypt(refreshed.accessToken),
            refreshToken: refreshed.refreshToken
              ? CryptoService.encrypt(refreshed.refreshToken)
              : row.refreshToken,
            expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
          },
        });
      } else {
        await prisma.integration.update({ where: { id: integration.id }, data: { status: 'EXPIRED' } });
        throw new Error('LinkedIn token expired. Please reconnect LinkedIn in Integrations.');
      }
    }
    return { token: accessToken, personUrn: integration.profileUrl };
  }

  static async refreshAccessToken(refreshToken: string) {
    const res = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID || '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
      }),
    });
    if (!res.ok) throw new Error('LinkedIn token refresh failed');
    const data = await res.json();
    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string | undefined,
      expiresIn: data.expires_in as number,
    };
  }

  // ---------- Profile ----------
  static async fetchUserInfo(accessToken: string): Promise<{ sub: string; name: string; email?: string; picture?: string }> {
    const res = await fetch(`${API}/v2/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`LinkedIn userinfo failed: ${res.statusText}`);
    return res.json();
  }

  static async syncProfile(userId: string, accessToken?: string): Promise<any> {
    const token = accessToken || (await this.getValidAccessToken(userId)).token;
    const profile = await this.fetchUserInfo(token);
    await prisma.integration.update({
      where: { userId_provider: { userId, provider: 'LINKEDIN' } },
      data: {
        profileName: profile.name,
        profileUrl: profile.sub ? `urn:li:person:${profile.sub}` : undefined,
        lastSyncAt: new Date(),
      },
    });
    return profile;
  }

  // ---------- Posting ----------
  /** Publish a text post to the member's LinkedIn feed. Returns the post URN. */
  static async publishPost(userId: string, _token: string | null, text: string): Promise<{ postUrn: string }> {
    const { token, personUrn } = await this.getValidAccessToken(userId);
    let author = personUrn;
    if (!author || !author.startsWith('urn:li:person:')) {
      const profile = await this.fetchUserInfo(token);
      author = `urn:li:person:${profile.sub}`;
    }

    const res = await fetch(`${API}/v2/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LinkedIn publish failed (${res.status}): ${errText}`);
    }
    const postUrn = res.headers.get('x-restli-id') || (await res.json().catch(() => ({})))?.id || '';
    return { postUrn };
  }

  // ---------- Legacy/limited APIs ----------
  /**
   * LinkedIn removed the public Connections API. Importing connections requires
   * LinkedIn partner access. We surface a clear message instead of failing silently.
   */
  static async importConnections(_userId: string, _accessToken?: string): Promise<never> {
    throw new Error(
      'LinkedIn no longer offers a public Connections API. Import leads via CSV (Leads → Import) or capture leads from post engagement / Lead Gen Forms.'
    );
  }

  static async syncConversations(_userId: string, _accessToken?: string): Promise<never> {
    throw new Error(
      'LinkedIn messaging API requires partner-level access. Track conversations manually in the Conversations module.'
    );
  }

  static async sendMessage(_userId: string, _token: string, _recipient: string, _message: string): Promise<never> {
    throw new Error(
      'LinkedIn messaging API requires partner-level access. Copy the AI-generated message and send it on LinkedIn directly.'
    );
  }

  static async disconnect(userId: string) {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'LINKEDIN' } },
    });
    if (!integration) return null;
    await prisma.integrationToken.deleteMany({ where: { integrationId: integration.id } });
    return prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'INACTIVE', disconnectedAt: new Date() },
    });
  }
}
