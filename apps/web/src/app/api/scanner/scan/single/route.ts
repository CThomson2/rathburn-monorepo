// /src/app/api/scanner/scan/single/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNewClient as createClient } from '@/lib/supabase/server';
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
  
  // Directly return a 204 response with CORS headers
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
 * This is a simplified version for testing API connectivity
 */
export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  console.log('API: POST scan request from origin:', requestOrigin);
  const headers = getCorsHeaders(requestOrigin);

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
        { status: 400, headers: headers }
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
      { headers: headers }
    );
    
  } catch (error) {
    console.error('API: Error processing scan:', error);
    recordScan('error', false);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: headers }
    );
  }
}