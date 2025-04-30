import { NextRequest, NextResponse } from 'next/server';

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',  // Next.js dev
  'http://localhost:4173',  // Vite preview
  'http://localhost:8080',  // Vite dev
  'http://localhost:5173',  // Vite dev alternative
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'https://mobile.rathburn.app',
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
 * Handle GET requests for ping test
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  console.log('API: Ping received from', request.headers.get('user-agent'), 'origin:', origin);
  
  // Return a simple response with CORS headers
  return NextResponse.json(
    { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Scanner API is online'
    },
    { headers: corsHeaders }
  );
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  // Log the request details for debugging
  console.log(`API: OPTIONS request for ping with headers:`, {
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