import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/crypto'
import { verifyAuth } from '@/lib/auth/verify'
import { successResponse, unauthorizedResponse, internalErrorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-response'
import { ZodError } from 'zod'
import { z } from 'zod'

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid token')
    }

    const tag = await prisma.leadTag.findUnique({
      where: { id: params.id },
    })

    if (!tag || tag.userId !== decoded.id) {
      return notFoundResponse('Tag not found')
    }

    const body = await request.json()

    // Validate input
    let validatedData
    try {
      validatedData = updateTagSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error.flatten().fieldErrors as Record<string, string[]>)
      }
      throw error
    }

    const updatedTag = await prisma.leadTag.update({
      where: { id: params.id },
      data: {
        name: validatedData.name ?? tag.name,
        color: validatedData.color ?? tag.color,
      },
    })

    return successResponse({ tag: updatedTag }, 'Tag updated successfully')
  } catch (error) {
    console.error('Update tag error:', error)
    return internalErrorResponse('Failed to update tag')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid token')
    }

    const tag = await prisma.leadTag.findUnique({
      where: { id: params.id },
    })

    if (!tag || tag.userId !== decoded.id) {
      return notFoundResponse('Tag not found')
    }

    await prisma.leadTag.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Tag deleted successfully')
  } catch (error) {
    console.error('Delete tag error:', error)
    return internalErrorResponse('Failed to delete tag')
  }
}
