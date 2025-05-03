// /src/app/api/scanner/scan/single/route.ts
import { NextRequest, NextResponse } from 'next/server';
// Revert import: Use existing clients
import { createClient, createServiceClient } from '@/lib/supabase/server'; 
import { cookies } from 'next/headers';

// Define allowed origins (you can customize this based on your environments)
const allowedOrigins = [
  'http://localhost:3000',  // Next.js dev
  'http://localhost:4173',  // Vite preview
  'http://192.168.9.47:8080',
  'http://192.168.9.47:4173',
  'http://localhost:8080',  // Vite dev
  'http://localhost:5173',  // Vite dev alternative
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'https://mobile.rathburn.app', // Production mobile app
  // Add any other origins as needed
];

// Helper function to generate dynamic CORS headers
function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
  
  let allowedOrigin = '';
  // If the origin is allowed, reflect it back
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowedOrigin = requestOrigin;
  } else {
    // Fallback for development: Find a localhost origin or use the first one
    allowedOrigin = allowedOrigins.find(origin => origin.includes('localhost:8080')) || allowedOrigins[0] || ''; 
  }
  
  // Only set the header if we have a valid allowed origin
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }
  
  return headers;
}

/**
 * Store scans in memory for the test page to retrieve
 * This is just for testing - in production you'd use a database
 */
const recentScans: {
  barcode: string;
  timestamp: string;
  success: boolean;
  deviceId?: string;
}[] = [];

// Function to add a scan to the recent scans list
function recordScan(barcode: string, success: boolean, deviceId?: string) {
  const scan = {
    barcode,
    timestamp: new Date().toISOString(),
    success,
    deviceId
  };
  
  // Add to the beginning of the array
  recentScans.unshift(scan);
  
  // Keep only the last 20 scans
  if (recentScans.length > 20) {
    recentScans.pop();
  }
  
  return scan;
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  console.log(`API: OPTIONS request for scan/single from origin: ${requestOrigin}`);
  const headers = getCorsHeaders(requestOrigin);
  
  return new Response(null, {
    status: 204,
    headers: headers
  });
}

/**
 * API endpoint to get recent scans (for the test page)
 */
export async function GET(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  console.log('API: GET scans request from origin:', requestOrigin);
  const headers = getCorsHeaders(requestOrigin);
  
  return NextResponse.json(
    { scans: recentScans },
    { headers: headers }
  );
}

/**
 * Handle POST requests for single drum scans
 */
export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  const headers = getCorsHeaders(requestOrigin);
  console.log(`API: POST scan request from origin: ${requestOrigin}`);

  let supabase;
  let userId = null;
  let sessionError = null;
  let authMethod = 'unknown';

  try {
    // Prioritize Authorization header for API clients (like mobile app)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authMethod = 'token';
      console.log('API: Attempting authentication via Bearer token.');
      const token = authHeader.substring(7); // Remove 'Bearer '
      supabase = createClient(); // Use the client suitable for programmatic access
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error) {
        console.error('API: Token authentication error:', error);
        sessionError = error;
      } else if (user) {
        userId = user.id;
        console.log('API: Token authentication successful. User ID:', userId);
      } else {
        console.log('API: Token provided but no user found.');
        sessionError = new Error('Invalid token or user not found');
      }
    } else {
      // Fallback to cookie-based auth for web clients
      authMethod = 'cookie';
      console.log('API: No Bearer token found, attempting cookie authentication.');
      // createClient might implicitly handle cookies, or you might need a specific server client
      // Let's stick with createClient for now, assuming it can handle cookies if needed, or createServerClient if available/necessary
      supabase = createClient(); 
      const { data: { session }, error } = await supabase.auth.getSession(); // Standard session check
      
      if (error) {
        console.error('API: Cookie session error:', error);
        sessionError = error;
      } else if (session) {
        userId = session.user.id;
        console.log('API: Cookie authentication successful. User ID:', userId);
      } else {
         console.log('API: No active cookie session found.');
      }
    }

    // Check if authentication succeeded by either method
    if (sessionError || !userId) {
      console.log(`API: Authentication failed (Method: ${authMethod}). Error:`, sessionError);
      recordScan('unknown', false, 'unknown');
      const errorMsg = sessionError ? sessionError.message : 'Authentication required';
      const status = sessionError && (sessionError as any).status === 401 ? 401 : 401; // Default to 401
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: status, headers: headers } 
      );
    }
    
    console.log(`API: User authenticated (ID: ${userId}, Method: ${authMethod}). Proceeding...`);

    // --- Proceed with processing the scan --- 
    // Parse request body
    const body = await request.json();
    console.log('API: Request body:', body);
    
    // Get the barcode from the request
    const { barcode, jobId, deviceId } = body;
    
    if (!barcode) {
      console.log('API: Missing barcode in request');
      recordScan('unknown', false, deviceId);
      return NextResponse.json(
        { success: false, error: 'Missing barcode' },
        { status: 400, headers: headers }
      );
    }
    
    console.log(`API: Processing barcode: ${barcode}, jobId: ${jobId || 'none'}, deviceId: ${deviceId || 'unknown'}`);
    
    // Record the scan in memory (for the test page)
    const scanInMemory = recordScan(barcode, true, deviceId);

    // --- Insert into database using the authenticated client --- 
    // Ensure supabase client is valid (it should be if userId is set)
    if (!supabase) {
        console.error('API: Supabase client not initialized despite successful auth check!');
        return NextResponse.json({ success: false, error: 'Internal server error: Client init failed' }, { status: 500, headers: headers });
    }
    
    try {
      const insertData = {
        barcode_scanned: barcode,
        device_id: deviceId,
        job_id: jobId ? String(jobId) : null,
        purchase_order_drum_serial: barcode,
        user_id: userId // Include the authenticated user ID
      };
      console.log('API: Preparing to insert scan log using RPC');
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'insert_temp_scan_log',
        {
          p_barcode_scanned: insertData.barcode_scanned,
          p_device_id: insertData.device_id,
          p_job_id: insertData.job_id,
          p_purchase_order_drum_serial: insertData.purchase_order_drum_serial,
          p_user_id: insertData.user_id // Pass user ID to RPC
        }
      );
      
      console.log('API: RPC function call completed');

      if (rpcError) {
        console.error('API: Error calling insert_temp_scan_log RPC:', rpcError);
        return NextResponse.json(
          { success: false, error: 'Database error during scan log insertion.', details: rpcError.message },
          { status: 500, headers: headers }
        );
      } else {
        console.log(`API: Successfully inserted scan for ${barcode} using RPC:`, rpcResult);
      }
    } catch (dbError) {
      console.error('API: Unexpected error during DB insertion block:', dbError);
      return NextResponse.json(
        { success: false, error: 'Internal server error during database operation.' },
        { status: 500, headers: headers }
      );
    }
    // --- End of database insertion ---
    
    // Return success
    return NextResponse.json(
      { 
        success: true, 
        scan_id: `scan_${Date.now()}`,
        message: 'Scan received successfully',
        barcode: barcode,
        timestamp: scanInMemory.timestamp
      },
      { headers: headers }
    );
    
  } catch (error) {
    console.error('API: General error processing scan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    recordScan('error', false);
    
    // Check if it looks like an auth error based on message content if needed
    const status = errorMessage.includes('Auth') || errorMessage.includes('authentic') ? 401 : 500;

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: status, headers: headers } 
    );
  }
}