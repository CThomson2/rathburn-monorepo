import { NextRequest, NextResponse } from 'next/server';

// Define standard CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With, Cache-Control',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
};

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
  const origin = request.headers.get('origin') || '';
  console.log(`API: Events handler for job ${jobId} from origin ${origin} - Connection will be closed immediately`);
  
  // Return an immediate end response with CORS headers
  return new Response(
    "event: close\ndata: {\"message\":\"Event streaming is not supported\"}\n\n", 
    { headers: corsHeaders }
  );
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest, 
  { params }: { params: { id: string } }) {
  const jobId = params.id;
  
  // Log the request details for debugging
  console.log(`API: OPTIONS request for events/job/${jobId} with headers:`, {
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