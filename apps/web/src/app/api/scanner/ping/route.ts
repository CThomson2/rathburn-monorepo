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

// Helper function to generate dynamic CORS headers
function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
  
  let allowedOrigin = '';
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowedOrigin = requestOrigin;
  } else {
    allowedOrigin = allowedOrigins.find(origin => origin.includes('localhost:8080')) || allowedOrigins[0] || '';
  }
  
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }
  
  return headers;
}

/**
 * Handle GET requests for ping test
 */
export async function GET(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  console.log('API: Ping received from', request.headers.get('user-agent'), 'origin:', requestOrigin);
  const headers = getCorsHeaders(requestOrigin);
  
  // Return a simple response with CORS headers
  return NextResponse.json(
    { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Scanner API is online'
    },
    { headers: headers }
  );
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  console.log(`API: OPTIONS request for ping from origin: ${requestOrigin}`);
  const headers = getCorsHeaders(requestOrigin);
  
  // Directly return a 204 response with CORS headers
  return new Response(null, {
    status: 204,
    headers: headers
  });
} 