import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: payload.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        lead: true,
      },
    });

    if (!conversation) {
      return errorResponse('Conversation not found', 404);
    }

    return successResponse(conversation);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const body = await request.json();

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: payload.id },
    });

    if (!conversation) {
      return errorResponse('Conversation not found', 404);
    }

    const message = await prisma.conversationMessage.create({
      data: {
        conversationId: id,
        sender: body.sender,
        content: body.content,
        isAiSuggested: body.isAiSuggested || false,
      },
    });

    // Keep conversation ordering fresh; bump unread when the lead replies.
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        ...(body.sender === 'lead' ? { unreadCount: { increment: 1 } } : {}),
      },
    });

    return successResponse(message, 'Message sent');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const messageId = request.nextUrl.searchParams.get('messageId');

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: payload.id },
    });
    if (!conversation) return errorResponse('Conversation not found', 404);

    if (messageId) {
      await prisma.conversationMessage.deleteMany({ where: { id: messageId, conversationId: id } });
      return successResponse({ deleted: messageId }, 'Message deleted');
    }
    await prisma.conversationMessage.deleteMany({ where: { conversationId: id } });
    return successResponse({ cleared: true }, 'Conversation messages cleared');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
