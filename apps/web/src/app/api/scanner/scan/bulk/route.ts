// apps/web/src/app/api/scanner/scan/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNewClient as createClient } from '@/lib/supabase/server';
import { processBatchScans } from '@/app/actions/scan';
import { ApiResponse } from '@/types/scanner';
import { createLogger } from '@/lib/api/utils/logger';
import { z } from 'zod';

const logger = createLogger('api/scanner/scan/bulk');

// Define allowed origins (you can customize this based on your environments)
const allowedOrigins = [
  'http://localhost:4173', // Vite dev server
  'http://localhost:5173', // Vite dev server
  'http://localhost:8080', // Vite dev server
  'https://mobile.rathburn.app', // Production mobile app
  // Add any other origins as needed
];

// Schema for validating bulk scan requests
const bulkScanRequestSchema = z.object({
  barcodes: z.array(z.string().min(1)).min(1, "At least one barcode is required"),
  jobId: z.number().optional(),
  action: z.string().optional().default('bulk'),
  deviceId: z.string().optional()
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  
  // Check if the origin is allowed
  if (allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 204, // No content
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }
  
  // Return 403 for disallowed origins
  return new NextResponse(null, { status: 403 });
}

/**
 * Handle POST requests for bulk barcode scans
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  logger.info('Received bulk scan request');

  try {
    const origin = request.headers.get('origin') || '';
    
    // Validate origin for CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
    };
    
    if (!allowedOrigins.includes(origin)) {
      logger.warn('Request from disallowed origin', { origin });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden - Origin not allowed',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 403, headers: corsHeaders }
      );
    }
    
    // Get authorization token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized - Missing or invalid token',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 401, headers: corsHeaders }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Create a Supabase client with the token
    const supabase = createClient();
    
    // Verify the token and get user
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      logger.warn('Invalid authentication token', { error: authError?.message });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized - Invalid token',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 401, headers: corsHeaders }
      );
    }
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn('Failed to parse request body', { error: parseError });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bad Request - Invalid JSON',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate request body
    try {
      // Use Zod to validate the request
      const validationResult = bulkScanRequestSchema.safeParse(body);
      
      if (!validationResult.success) {
        logger.warn('Validation error', { errors: validationResult.error.errors });
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation Error', 
            message: 'Validation Error',
            details: validationResult.error.errors,
            timestamp: new Date().toISOString()
          } as ApiResponse,
          { status: 400, headers: corsHeaders }
        );
      }
      
      const { barcodes, jobId, deviceId } = validationResult.data;
      
      // Get device info from headers if not provided
      const actualDeviceId = deviceId || (() => {
        const userAgent = request.headers.get('user-agent') || '';
        return userAgent.includes('CK67') ? 'CK67-scanner' : 
               userAgent.includes('CT47') ? 'CT47-scanner' : 
               'mobile-client';
      })();
      
      // Process the batch scan using the server action
      const result = await processBatchScans(
        barcodes,
        jobId,
        actualDeviceId
      );
      
      logger.info('Bulk scan processed', { 
        barcodesCount: barcodes.length,
        processed: result.totalProcessed,
        failed: result.totalFailed,
        processingTimeMs: Date.now() - startTime
      });
      
      // Determine the status code based on results
      const statusCode = result.totalFailed === 0 ? 200 : 
                         result.totalProcessed > 0 ? 207 : // Partial success
                         400; // Complete failure
      
      // Return the result
      return NextResponse.json(
        {
          success: result.success,
          message: `Processed ${result.totalProcessed} of ${result.totalSubmitted} barcodes`,
          data: result,
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { 
          status: statusCode, 
          headers: corsHeaders 
        }
      );
      
    } catch (error) {
      logger.error('Error processing bulk scan');
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal Server Error',
          message: 'Internal Server Error',
          errorDetail: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    logger.error('Unhandled error in bulk scan endpoint');
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error',
        message: 'Internal Server Error',
        errorDetail: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      } as ApiResponse,
      { status: 500 }
    );
  }
}