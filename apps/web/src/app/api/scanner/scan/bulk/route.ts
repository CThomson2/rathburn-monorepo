// app/api/scanner/scan/bulk/route.ts
// API route for batch processing multiple barcode scans

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { ScanInput, ScanResult, ScanError, ScanMode } from '@rathburn/types';
import { drumBarcodeSchema } from '@/lib/validation/drum-barcode';
import { validateAuth } from '@/lib/api/auth';
import { processBarcodeScan } from '@/app/actions/scan';
import { createLogger } from '@/lib/api/utils/logger';
import { healthMonitor } from '@/lib/api/utils/health-monitor';
import { notificationService } from '@/lib/api/services/notification-service';

const logger = createLogger('api/scanner/batch');

// Define allowed origins (consistent with single route)
const allowedOrigins = [
  'http://localhost:4173', // Vite dev server
  'http://localhost:8080',
  'https://mobile.rathburn.app', // Production mobile app
];

// Define Zod schema for individual scan items within the batch
const singleScanSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  jobId: z.number().optional(),
  deviceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Define schema for the batch request body
const batchRequestSchema = z.object({
  scans: z.array(singleScanSchema).min(1, "At least one scan is required"),
});

// Define the structure for the batch response data
interface BatchResponseData {
  processed: ScanResult[];
  failed: ScanResult[];
  totalSubmitted: number;
  totalProcessed: number;
  totalFailed: number;
}

// Define the overall batch API response structure (simplified)
interface BatchApiResponse {
  success: boolean;
  message: string;
  data?: BatchResponseData;
  error?: ScanError | string;
}

/**
 * Handle CORS preflight requests for the bulk endpoint
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  if (allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return new NextResponse(null, { status: 403 });
}

/**
 * Handle POST requests for batch barcode scanning
 */
export async function POST(request: NextRequest): Promise<NextResponse<BatchApiResponse>> {
  logger.info('Received batch barcode scan request');
  const startTime = Date.now();
  const origin = request.headers.get('origin') || '';
  const corsHeaders = { 'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '' };

  try {
    // 1. Check CORS Origin
    if (!allowedOrigins.includes(origin)) {
        logger.warn('Forbidden origin for batch request', { origin });
        return NextResponse.json(
            { success: false, message: 'Forbidden', error: ScanError.AUTHORIZATION_ERROR },
            { status: 403, headers: corsHeaders }
        );
    }

    // 2. Authenticate the request (using Authorization header)
    const authHeader = request.headers.get('authorization') || '';
    // Assuming validateAuth checks the bearer token and returns user/device info or throws/returns null
    const authResult = validateAuth(authHeader); // This needs proper implementation
    if (!authResult) { // Adjust based on validateAuth's return type
      logger.warn('Authentication failed for batch request');
      healthMonitor?.recordFailedScan(Date.now() - startTime); // Optional chaining for monitor
      return NextResponse.json(
        { success: false, message: 'Authentication failed', error: ScanError.AUTHORIZATION_ERROR }, 
        { status: 401, headers: corsHeaders }
      );
    }

    // 3. Parse and validate the request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (e) {
        logger.warn('Failed to parse request body as JSON');
        healthMonitor?.recordFailedScan(Date.now() - startTime);
        return NextResponse.json(
            { success: false, message: 'Invalid JSON body', error: ScanError.VALIDATION_ERROR }, 
            { status: 400, headers: corsHeaders }
        );
    }
    
    const validationResult = batchRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      logger.warn('Validation error in batch request', { errors: validationResult.error.flatten() });
      healthMonitor?.recordFailedScan(Date.now() - startTime);
      return NextResponse.json(
        { 
            success: false, 
            message: 'Invalid request data', 
            error: ScanError.VALIDATION_ERROR,
            // data: { errors: validationResult.error.flatten() } // Optionally include details
        }, 
        { status: 400, headers: corsHeaders }
      );
    }

    const scansToProcess = validationResult.data.scans;
    logger.info('Processing batch of scans', { count: scansToProcess.length });

    // 4. Process the batch using the server action for each scan
    const results: ScanResult[] = await Promise.all(
        scansToProcess.map(async (scan) => {
            const actionResult = await processBarcodeScan({
                ...scan,
                scan_mode: "bulk", // Set mode to bulk for each scan
            });
            // Adapt server action result to ScanResult format
            return {
                success: actionResult.success,
                scan_id: actionResult.success ? actionResult.data?.scan_id : `error_${scan.barcode}_${Date.now()}`,
                drum: actionResult.success ? actionResult.data?.detected_drum : undefined,
                error: actionResult.success ? undefined : (actionResult.error || ScanError.UNKNOWN_ERROR),
            };
        })
    );

    const processed = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // 5. Record metrics (aggregate or individual)
    healthMonitor?.recordSuccessfulScan(Date.now() - startTime); // Simplified: record overall success

    // 6. Send batch notification if needed (optional)
    // if (process.env.ENABLE_NOTIFICATIONS === 'true') {
    //   notificationService?.notifyBatchComplete({...});
    // }

    // 7. Prepare response data
    const responseData: BatchResponseData = {
      processed,
      failed,
      totalSubmitted: scansToProcess.length,
      totalProcessed: processed.length,
      totalFailed: failed.length,
    };

    const responseMessage = `Processed ${processed.length} of ${scansToProcess.length} scans`;
    const status = failed.length === 0 ? 201 : 207; // 207 Multi-Status if any failed

    logger.info('Batch processing completed', {
      total: scansToProcess.length,
      processed: processed.length,
      failed: failed.length,
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json(
        { success: status === 201, message: responseMessage, data: responseData }, 
        { status, headers: corsHeaders }
    );

  } catch (error) {
    healthMonitor?.recordFailedScan(Date.now() - startTime);
    logger.error('Unhandled error processing batch scans', error as Error);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred', error: ScanError.SCAN_EXCEPTION }, 
      { status: 500, headers: corsHeaders }
    );
  }
}