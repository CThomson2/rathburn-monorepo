// lib/cors.ts
const ALLOWED_ORIGINS = [
  'https://rathburn.app',
  'https://mobile.rathburn.app',
]

const ALLOWED_ORIGINS_DEV = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:4173',
]

export function corsHeaders(origin: string | null = null) {
  /**
   * CORS Headers
   * 
   * Allow-Credentials:
   * Allows cookies and authentication headers to be sent with cross-origin requests. This is necessary when using authentication like Bearer tokens.
   * 
   * Allow-Origin:
   * Allows the specified origin to access the resource.
   * 
   * Allow-Headers:
   * Allows the specified headers to be sent with the request.
   * 
   * @param origin - The origin of the request
   * @returns The headers for CORS
   */
  const headers: Record<string,string> = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    // "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

