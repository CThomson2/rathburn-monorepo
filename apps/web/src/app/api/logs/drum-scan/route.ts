// /src/app/api/logs/drum-scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNewClient as createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { processBarcodeScan } from '@/app/actions/mobile/scan';

// Define allowed origins (you can customize this based on your environments)
const allowedOrigins = [
  'http://localhost:4173', // Vite dev server
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
 * Handle POST requests for drum scans
 */
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || '';
    
    // Validate origin for CORS
    if (!allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get authorization token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing or invalid token' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': origin,
          }
        }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Create a Supabase client with the token
    const supabase = createClient();
    
    // Verify the token and get user
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': origin,
          }
        }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { barcode, jobId, action } = body;
    
    // Validate required fields
    if (!barcode || !jobId || !action) {
      return NextResponse.json(
        { success: false, error: 'Bad Request - Missing required fields' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
          }
        }
      );
    }
    
    // Process the scan using the server action
    const result = await processBarcodeScan({
      barcode,
      jobId,
      action,
    });
    
    // Return the result
    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': origin,
      }
    });
    
  } catch (error) {
    console.error('Error processing drum scan:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': request.headers.get('origin') || '',
        }
      }
    );
  }
}