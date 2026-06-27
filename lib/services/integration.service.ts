import { prisma } from '@/lib/prisma';

export class IntegrationService {
  static async connectLinkedIn(
    userId: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ) {
    let integration = await prisma.integration.findFirst({
      where: { userId, provider: 'LINKEDIN' },
    });

    if (!integration) {
      integration = await prisma.integration.create({
        data: {
          userId,
          provider: 'LINKEDIN',
          status: 'ACTIVE',
        },
      });
    } else {
      integration = await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'ACTIVE' },
      });
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : new Date(Date.now() + 3600000);

    await prisma.integrationToken.create({
      data: {
        integrationId: integration.id,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });

    return integration;
  }

  static async connectInstagram(
    userId: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ) {
    let integration = await prisma.integration.findFirst({
      where: { userId, provider: 'INSTAGRAM' },
    });

    if (!integration) {
      integration = await prisma.integration.create({
        data: {
          userId,
          provider: 'INSTAGRAM',
          status: 'ACTIVE',
        },
      });
    } else {
      integration = await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'ACTIVE' },
      });
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : new Date(Date.now() + 3600000);

    await prisma.integrationToken.create({
      data: {
        integrationId: integration.id,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });

    return integration;
  }

  static async disconnectIntegration(integrationId: string) {
    const integration = await prisma.integration.update({
      where: { id: integrationId },
      data: { status: 'INACTIVE' },
    });

    return integration;
  }

  static async getIntegrations(userId: string) {
    const integrations = await prisma.integration.findMany({
      where: { userId },
      include: {
        tokens: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return integrations;
  }

  static async getIntegrationStatus(integrationId: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        tokens: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    const token = integration.tokens[0];
    const isExpired = token && token.expiresAt && token.expiresAt < new Date();

    return {
      ...integration,
      isValid: integration.status === 'ACTIVE' && !isExpired,
    };
  }

  static async refreshToken(integrationId: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        tokens: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!integration || !integration.tokens[0]) {
      throw new Error('Integration or token not found');
    }

    const token = integration.tokens[0];
    if (token.expiresAt && token.expiresAt > new Date()) {
      return token;
    }

    return token;
  }

  static async publishToLinkedIn(integrationId: string, _content: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        tokens: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!integration || integration.status !== 'ACTIVE') {
      throw new Error('LinkedIn integration not active');
    }

    return { success: true, postId: `linkedin_${Date.now()}` };
  }

  static async publishToInstagram(integrationId: string, _imageUrl: string, _caption: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        tokens: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!integration || integration.status !== 'ACTIVE') {
      throw new Error('Instagram integration not active');
    }

    return { success: true, postId: `instagram_${Date.now()}` };
  }
}
