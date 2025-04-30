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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With, Cache-Control',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
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
 * Handle GET requests for EventSource connections
 * This endpoint exists only to prevent errors in the browser console
 * when the mobile app tries to connect to it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const requestOrigin = request.headers.get('origin');
  console.log(`API: Events handler for job ${jobId} from origin ${requestOrigin} - Connection will be closed immediately`);
  const headers = getCorsHeaders(requestOrigin);
  
  // Return an immediate end response with CORS headers
  return new Response(
    "event: close\ndata: {\"message\":\"Event streaming is not supported\"}\n\n", 
    { headers: headers }
  );
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest, 
  { params }: { params: { id: string } }) {
  const jobId = params.id;
  const requestOrigin = request.headers.get('origin');
  
  // Log the request details for debugging
  console.log(`API: OPTIONS request for events/job/${jobId} from origin: ${requestOrigin}`);
  const headers = getCorsHeaders(requestOrigin);
  
  // Directly return a 204 response with CORS headers
  return new Response(null, {
    status: 204,
    headers: headers
  });
} 