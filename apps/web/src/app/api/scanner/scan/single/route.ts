// apps/web/src/app/api/scanner/scan/single/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNewClient as createClient } from '@/lib/supabase/server';
import { processBarcodeScan } from '@/app/actions/scan';
import { ApiResponse } from '@/types/scanner';
import { createLogger } from '@/lib/api/utils/logger';
import { validateDrumBarcode } from '@/lib/validation/drum-barcode';
import { z } from 'zod';

const logger = createLogger('api/scanner/scan/single');

// Define allowed origins (you can customize this based on your environments)
const allowedOrigins = [
  'http://localhost:4173', // Vite dev server
  'http://localhost:5173', // Vite dev server
  'http://localhost:8080', // Vite dev server
  'https://mobile.rathburn.app', // Production mobile app
  // Add any other origins as needed
];

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
 * Handle POST requests for single barcode scans
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  logger.info('Received single scan request');

  try {
    const origin = request.headers.get('origin') || '';
    
    // Validate origin for CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
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
      const { barcode, jobId, action = 'barcode_scan', scan_mode = 'single' } = body;
      
      // Validate required fields
      if (!barcode) {
        logger.warn('Missing required field: barcode');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Bad Request - Missing required field: barcode',
            timestamp: new Date().toISOString()
          } as ApiResponse,
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Validate barcode format using Zod schema
      try {
        validateDrumBarcode({
          barcode,
          jobId,
          action,
          scan_mode
        });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          logger.warn('Validation error', { errors: validationError.errors });
          return NextResponse.json(
            { 
              success: false, 
              error: 'Validation Error', 
              message: 'Validation Error',
              details: validationError.errors,
              timestamp: new Date().toISOString()
            } as ApiResponse,
            { status: 400, headers: corsHeaders }
          );
        }
        throw validationError;
      }
      
      // Extract the user ID from auth data
      const userId = authData.user.id;
      
      // Get device info from headers
      const userAgent = request.headers.get('user-agent') || '';
      const deviceId = body.deviceId || 
                       (userAgent.includes('CK67') ? 'CK67-scanner' : 
                       userAgent.includes('CT47') ? 'CT47-scanner' : 
                       'mobile-client');
      
      // Process the scan using the server action
      const result = await processBarcodeScan({
        barcode,
        jobId,
        action,
        scan_mode,
        deviceId,
        userId,
        metadata: body.metadata || {}
      });
      
      logger.info('Scan processed successfully', { 
        barcode, 
        scanId: result.scan_id,
        processingTimeMs: Date.now() - startTime
      });
      
      // Return the result
      return NextResponse.json(result, { headers: corsHeaders });
      
    } catch (error) {
      logger.error('Error processing scan');
      
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
    logger.error('Unhandled error in single scan endpoint');
    
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