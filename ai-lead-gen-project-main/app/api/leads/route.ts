import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { LeadManagementService } from '@/lib/services/lead-management.service';

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();

    if (!body.email) {
      return errorResponse('Email is required', 400);
    }

    const lead = await LeadManagementService.createLead(payload.id, body);
    return successResponse(lead, 'Lead created');
  } catch (error: any) {
    return errorResponse(error.message, 500);
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
    return errorResponse(error.message, 500);
  }
}
