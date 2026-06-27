import { prisma } from '@/lib/prisma';
import { toJsonField } from '@/lib/json-field';

export interface CreateNotificationInput {
  type: string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  static async create(userId: string, input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        metadata: toJsonField(input.metadata),
      },
    });
  }

  static async list(userId: string, opts?: { unreadOnly?: boolean; limit?: number; cursor?: string }) {
    return prisma.notification.findMany({
      where: { userId, ...(opts?.unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: opts?.limit || 30,
      ...(opts?.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
    });
  }

  static async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  static async markRead(userId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true, readAt: new Date() },
    });
  }

  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }
}
