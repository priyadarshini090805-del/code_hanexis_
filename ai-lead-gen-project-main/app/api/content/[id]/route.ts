import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { ContentManagementService } from '@/lib/services/content-management.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const content = await ContentManagementService.getContentById(payload.id, id);
    return successResponse(content);
  } catch (error: any) {
    return errorResponse(error.message, 404);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const body = await request.json();

    const content = await ContentManagementService.updateContent(payload.id, id, body, payload.id);
    return successResponse(content, 'Content updated');
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

    await ContentManagementService.deleteContent(payload.id, id);
    return successResponse(null, 'Content deleted');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
