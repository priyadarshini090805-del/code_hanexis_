import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/crypto'
import { verifyAuth } from '@/lib/auth/verify'
import { successResponse, unauthorizedResponse, internalErrorResponse, validationErrorResponse } from '@/lib/api-response'
import { ZodError } from 'zod'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().default('#000000'),
})

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid token')
    }

    const tags = await prisma.leadTag.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({ tags })
  } catch (error) {
    console.error('Get tags error:', error)
    return internalErrorResponse('Failed to fetch tags')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid token')
    }

    const body = await request.json()

    // Validate input
    let validatedData
    try {
      validatedData = createTagSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error.flatten().fieldErrors as Record<string, string[]>)
      }
      throw error
    }

    const tag = await prisma.leadTag.create({
      data: {
        userId: decoded.id,
        name: validatedData.name,
        color: validatedData.color,
      },
    })

    return successResponse({ tag }, 'Tag created successfully', 201)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return validationErrorResponse({ name: ['Tag with this name already exists'] })
    }
    console.error('Create tag error:', error)
    return internalErrorResponse('Failed to create tag')
  }
}
