import { NextRequest, NextResponse } from 'next/server';

// Central list of allowed origins
export const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4173',
  'http://192.168.9.47:8080', // Specific local IPs if needed
  'http://192.168.9.47:4173',
  'http://localhost:8080',   // Common mobile dev server port
  'http://localhost:5173',   // Vite default
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'https://mobile.rathburn.app', // Production mobile app origin
  // Add other origins as needed
];

/**
 * Generates CORS headers based on the request origin.
 * @param requestOrigin - The 'origin' header from the incoming request.
 * @param allowedMethods - HTTP methods allowed (e.g., 'GET, POST, OPTIONS'). Defaults to 'GET, POST, PATCH, OPTIONS'.
 * @returns A record containing the appropriate CORS headers.
 */
export function getCorsHeaders(
  requestOrigin: string | null,
  allowedMethods: string = 'GET, POST, PATCH, OPTIONS' // Default includes common methods
): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-Device-ID', // Include common headers + X-Device-ID
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // Cache preflight for 1 day
  };

  // Dynamically set Allow-Origin based on request
  let originToAllow = '';
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    originToAllow = requestOrigin;
  } else if (!requestOrigin && process.env.NODE_ENV !== 'production') {
    // Allow requests with no origin in non-production environments (e.g., Postman)
    // Be cautious with this in production
    originToAllow = '*'; // Or a specific default dev origin
  } else {
    // Fallback or reject if origin not allowed in production
    originToAllow = allowedOrigins[0] || ''; // Fallback to first allowed origin, ensure it's set
  }
  
  if(originToAllow) {
    headers['Access-Control-Allow-Origin'] = originToAllow;
  }

  return headers;
}

/**
 * Handles CORS preflight (OPTIONS) requests.
 * @param request - The incoming NextRequest.
 * @param allowedMethods - The allowed HTTP methods for this specific endpoint.
 * @returns A NextResponse configured for the OPTIONS preflight response.
 */
export function handleOptionsRequest(
    request: NextRequest,
    allowedMethods: string = 'GET, POST, PATCH, OPTIONS' // Match default in getCorsHeaders
): NextResponse {
    const requestOrigin = request.headers.get('origin');
    console.log(`[CORS Util] OPTIONS request from origin: ${requestOrigin} for methods: ${allowedMethods}`);
    const headers = getCorsHeaders(requestOrigin, allowedMethods);
    return new NextResponse(null, {
        status: 204, // No Content
        headers: headers,
    });
} 