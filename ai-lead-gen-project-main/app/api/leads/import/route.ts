import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { LeadManagementService } from '@/lib/services/lead-management.service';

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return errorResponse('Invalid leads data', 400);
    }

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
    return errorResponse(error.message, 500);
  }
}
