import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { LeadManagementService } from '@/lib/services/lead-management.service';
import { z } from 'zod';

const importLeadsSchema = z.object({
  leads: z.array(z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email(),
    company: z.string().optional(),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
    title: z.string().optional(),
  })).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const { leads } = importLeadsSchema.parse(await request.json());

    const result = await LeadManagementService.bulkImportLeads(payload.id, leads);

    const stats = {
      total: leads.length,
      successful: result.count,
      failed: leads.length - result.count,
    };

    return successResponse(
      { stats, importedCount: result.count },
      'Leads imported successfully'
    );
  } catch (error: any) {
    console.error(error); return errorResponse('An unexpected error occurred', 500);
  }
}
