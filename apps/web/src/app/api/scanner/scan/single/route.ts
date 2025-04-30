// /src/app/api/scanner/scan/single/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNewClient as createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Define allowed origins (you can customize this based on your environments)
const allowedOrigins = [
  'http://localhost:3000',  // Next.js dev
  'http://localhost:4173',  // Vite preview
  'http://192.168.9.47:8080/',
  'http://192.168.9.47:4173/',
  'http://localhost:8080',  // Vite dev
  'http://localhost:5173',  // Vite dev alternative
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'https://mobile.rathburn.app', // Production mobile app
  // Add any other origins as needed
];

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
};

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
  // Log the request details for debugging
  console.log(`API: OPTIONS request for scan/single with headers:`, {
    origin: request.headers.get('origin'),
    method: request.method,
    accessControlRequestMethod: request.headers.get('access-control-request-method'),
    accessControlRequestHeaders: request.headers.get('access-control-request-headers')
  });
  
  // Directly return a 204 response with CORS headers
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * API endpoint to get recent scans (for the test page)
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  console.log('API: GET scans request from origin:', origin);
  
  return NextResponse.json(
    { scans: recentScans },
    { headers: corsHeaders }
  );
}

/**
 * Handle POST requests for single drum scans
 * This is a simplified version for testing API connectivity
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  console.log('API: POST scan request from origin:', origin);

  try {
    console.log('API: Received scan request');
    
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
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`API: Processing barcode: ${barcode}, jobId: ${jobId || 'none'}, deviceId: ${deviceId || 'unknown'}`);
    
    // Record the scan
    const scan = recordScan(barcode, true, deviceId);
    
    // For testing, just return success with the barcode
    return NextResponse.json(
      { 
        success: true, 
        scan_id: `scan_${Date.now()}`,
        message: 'Scan received successfully',
        barcode: barcode,
        timestamp: scan.timestamp
      },
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('API: Error processing scan:', error);
    recordScan('error', false);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}