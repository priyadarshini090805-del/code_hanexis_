import { prisma } from '@/lib/prisma';

export class ContentManagementService {
  static async getContentById(userId: string, contentId: string) {
    const content = await prisma.content.findFirst({
      where: { id: contentId, userId },
      include: { versions: { orderBy: { createdAt: 'desc' } } },
    });

    if (!content) throw new Error('Content not found');
    return content;
  }

  static async updateContent(
    userId: string,
    contentId: string,
    updates: { title?: string; body?: string; status?: string },
    updatedBy: string
  ) {
    const content = await this.getContentById(userId, contentId);

    const updated = await prisma.content.update({
      where: { id: contentId },
      data: {
        title: updates.title || content.title,
        body: updates.body || content.body,
        status: updates.status || content.status,
      },
    });

    if (updates.body) {
      const count = await prisma.contentVersion.count({ where: { contentId } });
      await prisma.contentVersion.create({
        data: {
          contentId,
          versionNumber: count + 1,
          body: updates.body,
          createdBy: updatedBy,
        },
      });
    }

    return updated;
  }

  static async deleteContent(userId: string, contentId: string) {
    const content = await this.getContentById(userId, contentId);
    
    await prisma.contentVersion.deleteMany({ where: { contentId } });
    await prisma.content.delete({ where: { id: contentId } });

    return { success: true };
  }

  static async approveContent(userId: string, contentId: string, approvedBy: string) {
    const content = await this.getContentById(userId, contentId);

    return await prisma.content.update({
      where: { id: contentId },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  static async publishContent(userId: string, contentId: string, platform: string) {
    const content = await this.getContentById(userId, contentId);

    if (content.status !== 'APPROVED') {
      throw new Error('Content must be approved before publishing');
    }

    return await prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedOn: platform,
      },
    });
  }

  static async rejectContent(userId: string, contentId: string, reason: string, rejectedBy: string) {
    return await prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedBy,
        rejectedAt: new Date(),
      },
    });
  }

  static async getVersionHistory(userId: string, contentId: string) {
    await this.getContentById(userId, contentId);

    return await prisma.contentVersion.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async compareVersions(userId: string, contentId: string, version1Id: string, version2Id: string) {
    await this.getContentById(userId, contentId);

    const [v1, v2] = await Promise.all([
      prisma.contentVersion.findUnique({ where: { id: version1Id } }),
      prisma.contentVersion.findUnique({ where: { id: version2Id } }),
    ]);

    if (!v1 || !v2) throw new Error('Version not found');

    return { version1: v1, version2: v2, diff: this.calculateDiff(v1.body, v2.body) };
  }

  private static calculateDiff(text1: string, text2: string) {
    return {
      added: text2.length > text1.length ? text2.length - text1.length : 0,
      removed: text1.length > text2.length ? text1.length - text2.length : 0,
      changed: text1 !== text2,
    };
  }

  static async getContentByType(userId: string, type: string) {
    return await prisma.content.findMany({
      where: { userId, type },
      include: { versions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async searchContent(userId: string, query: string) {
    return await prisma.content.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { versions: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
