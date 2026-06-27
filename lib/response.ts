import { NextResponse } from 'next/server';

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  error: null;
}

export interface ErrorResponse {
  success: false;
  message: string;
  data: null;
  error: any;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Flexible success helper. Accepts either:
 *   successResponse(data, message?)  or  successResponse(message, data)
 */
export function successResponse<T = any>(
  a?: T | string,
  b?: T | string
): Response {
  let data: any;
  let message = 'Success';
  if (typeof a === 'string' && b !== undefined && typeof b !== 'string') {
    message = a;
    data = b;
  } else if (typeof a === 'string' && b === undefined) {
    message = a;
    data = undefined;
  } else {
    data = a;
    if (typeof b === 'string') message = b;
    else if (b !== undefined) data = { ...(data as any), ...(b as any) };
  }
  return NextResponse.json({ success: true, message, data, error: null }, { status: 200 });
}

/**
 * Flexible error helper. Accepts:
 *   errorResponse(message, status?)  or  errorResponse(message, details)
 */
export function errorResponse(
  message: string,
  statusOrDetails: number | unknown = 500
): Response {
  const status = typeof statusOrDetails === 'number' ? statusOrDetails : 400;
  const error = typeof statusOrDetails === 'number' ? message : statusOrDetails;
  return NextResponse.json({ success: false, message, data: null, error }, { status });
}
