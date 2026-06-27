import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function logRequest(
  method: string,
  path: string,
  statusCode: number,
  userId?: string,
  duration?: number
) {
  try {
    if (userId && path.includes('/api')) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'API_CALL' as any,
          entityType: 'API',
          entityId: path,
          metadata: JSON.stringify({
            method,
            path,
            statusCode,
            duration,
          }),
        },
      });
    }
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}

export function createRequestLogger(handler: Function) {
  return async (req: NextRequest, context: any) => {
    const startTime = Date.now();
    const userId = req.headers.get('x-user-id');

    try {
      const response = await handler(req, context);
      const duration = Date.now() - startTime;

      await logRequest(
        req.method,
        req.nextUrl.pathname,
        response.status,
        userId || undefined,
        duration
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      await logRequest(
        req.method,
        req.nextUrl.pathname,
        500,
        userId || undefined,
        duration
      );

      throw error;
    }
  };
}
