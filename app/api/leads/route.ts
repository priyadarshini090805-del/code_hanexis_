import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { LeadManagementService } from '@/lib/services/lead-management.service';
import { z } from 'zod';

const createLeadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100),
  email: z.string().email(),
  company: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  jobTitle: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = createLeadSchema.parse(await request.json());

    const lead = await LeadManagementService.createLead(payload.id, body);
    return successResponse(lead, 'Lead created');
  } catch (error: any) {
    console.error(error); return errorResponse('An unexpected error occurred', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    let leads;

    if (search) {
      leads = await LeadManagementService.searchLeads(payload.id, search);
    } else {
      leads = await LeadManagementService.getAllLeads(payload.id, {
        status: status || undefined,
        tag: tag || undefined,
      });
    }

    return successResponse(leads);
  } catch (error: any) {
    console.error(error); return errorResponse('An unexpected error occurred', 500);
  }
}
