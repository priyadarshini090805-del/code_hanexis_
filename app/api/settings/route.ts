import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { firstName: true, lastName: true, email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      timezone: 'UTC',
      emailNotifications: true,
      weeklyReports: true,
      twoFactorEnabled: user.twoFactorEnabled || false,
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();

    let firstName: string | undefined;
    let lastName: string | undefined;
    if (body.firstName || body.lastName) {
      firstName = body.firstName;
      lastName = body.lastName;
    } else if (body.name) {
      const parts = (body.name as string).trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || undefined;
    }

    const user = await prisma.user.update({
      where: { id: payload.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName !== undefined && { lastName }),
      },
      select: { firstName: true, lastName: true, email: true, twoFactorEnabled: true },
    });

    return successResponse({
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled || false,
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
