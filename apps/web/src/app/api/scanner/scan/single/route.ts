// /src/app/api/scanner/scan/single/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNewClient as createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { processBarcodeScan } from '@/app/actions/scan';
import { ScanInput, ScanResult, ScanError } from '@rathburn/types'; // Import shared types
import { z } from 'zod'; // Import Zod for validation

// Define allowed origins (you can customize this based on your environments)
const allowedOrigins = [
  'http://localhost:4173', // Vite dev server
  'http://localhost:8080', // Vite dev server
  'https://mobile.rathburn.app', // Production mobile app
  // Add any other origins as needed
];

// Define Zod schema for input validation
const scanInputSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  jobId: z.number().optional(), // Job ID is optional
  deviceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
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
 * Handle POST requests for single drum scans
 */
export async function POST(request: NextRequest): Promise<NextResponse<ScanResult>> { // Use ScanResult for response type
  const origin = request.headers.get('origin') || '';
  const corsHeaders = { 'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '' };

  try {
    // Validate origin for CORS
    if (!allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', scan_id: `error_${Date.now()}` },
        { status: 403, headers: corsHeaders }
      );
    }
    
    // Get authorization token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: ScanError.AUTHORIZATION_ERROR, scan_id: `error_${Date.now()}` }, // Use ScanError enum
        { status: 401, headers: corsHeaders }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Create a Supabase client with the token (for auth check ONLY)
    // The server action will use its own server client for DB operations
    const supabaseAuthClient = createClient(); 
    const { data: authData, error: authError } = await supabaseAuthClient.auth.getUser(token);
    
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: ScanError.AUTHORIZATION_ERROR, scan_id: `error_${Date.now()}` }, // Use ScanError enum
        { status: 401, headers: corsHeaders }
      );
    }
    
    // Parse and validate request body using Zod
    const body = await request.json();
    const validationResult = scanInputSchema.safeParse(body);

    if (!validationResult.success) {
        return NextResponse.json(
            { 
                success: false, 
                error: ScanError.VALIDATION_ERROR, 
                scan_id: `error_${Date.now()}`,
                // Optionally include Zod error details
                // errorDetails: validationResult.error.flatten(), 
            },
            { status: 400, headers: corsHeaders }
        );
    }
    
    const { barcode, jobId, deviceId, metadata } = validationResult.data;
    
    // Process the scan using the server action
    const result = await processBarcodeScan({
      barcode,
      jobId,
      scan_mode: "single", // Explicitly set scan_mode
      deviceId,
      metadata,
    });
    
    // Return the result from the server action
    // The server action now returns { success, data?, error?, errorDetail? }
    if (result.success) {
      return NextResponse.json({
        success: true,
        scan_id: result.data?.scan_id || `scan_${Date.now()}`, // Extract scan_id from data
        drum: result.data?.detected_drum || undefined, // Extract drum from data
      }, { headers: corsHeaders });
    } else {
      return NextResponse.json({
        success: false,
        scan_id: `error_${Date.now()}`,
        error: result.error || ScanError.UNKNOWN_ERROR,
      }, { status: 500, headers: corsHeaders }); // Use 500 for processing errors
    }
    
  } catch (error) {
    console.error('Error processing single scan:', error);
    
    return NextResponse.json(
      { success: false, error: ScanError.SCAN_EXCEPTION, scan_id: `error_${Date.now()}` }, // Use ScanError enum
      { status: 500, headers: corsHeaders }
    );
  }
}