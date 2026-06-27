import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { ExportService } from '@/lib/services/export.service';
import { z } from 'zod';

const exportParamsSchema = z.object({
  format: z.enum(['csv', 'json']).optional().default('csv'),
  status: z.string().optional(),
  tag: z.string().optional(),
});

const LEAD_HEADERS = [
  'firstName', 'lastName', 'email', 'phone', 'company',
  'jobTitle', 'status', 'source', 'score', 'notes',
  'createdAt',
];

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);

    const params = exportParamsSchema.parse({
      format: request.nextUrl.searchParams.get('format') || undefined,
      status: request.nextUrl.searchParams.get('status') || undefined,
      tag: request.nextUrl.searchParams.get('tag') || undefined,
    });

    const leads = await prisma.lead.findMany({
      where: {
        userId: payload.id,
        ...(params.status ? { status: params.status as any } : {}),
        ...(params.tag ? { tags: { some: { name: params.tag } } } : {}),
      },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });

    if (params.format === 'json') {
      return NextResponse.json({
        success: true,
        data: leads,
        count: leads.length,
      });
    }

    const rows = leads.map((lead) => ({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      jobTitle: lead.jobTitle || '',
      status: lead.status,
      source: lead.source || '',
      score: String(lead.score || 0),
      notes: (lead.notes || '').replace(/[\n\r]/g, ' '),
      createdAt: ExportService.formatDate(lead.createdAt),
    }));

    const csv = ExportService.generateCSV(rows, LEAD_HEADERS);
    const filename = `leads-export-${ExportService.formatDate(new Date())}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return errorResponse('An unexpected error occurred', 500);
  }
}
