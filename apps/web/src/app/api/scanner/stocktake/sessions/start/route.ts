import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';


// --- Add CORS Helper Function --- 
// Define allowed origins 
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4173',
  'http://192.168.9.47:8080',
  'http://192.168.9.47:4173',
  'http://localhost:8080', 
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'https://mobile.rathburn.app', 
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', 
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
// --- End CORS Helper Function --- 

export async function OPTIONS(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  console.log(`[API Start Session] OPTIONS request from origin: ${requestOrigin}`);
  const headers = getCorsHeaders(requestOrigin);
  return new Response(null, {
    status: 204,
    headers: headers
  });
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  const headers = getCorsHeaders(requestOrigin);
  const supabase = createServiceClient();

  try {
    console.log(`[API Start Session] POST request from origin: ${requestOrigin}`);

    // 1. Authenticate user via Bearer token
    const authHeader = request.headers.get('authorization');
    let user = null;
    let authError: any = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
        if (tokenError) { authError = tokenError; }
        else if (!tokenUser) { authError = { message: 'Invalid token' }; }
        else { user = tokenUser; }
    } else { authError = { message: 'Missing token' }; }

    if (authError || !user) {
      console.error('[API Start Session] Authentication failed:', authError?.message);
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401, headers });
    }
    console.log(`[API Start Session] User authenticated: ${user.id}`);

    // 2. Create session record
    const sessionName = `Stocktake - ${new Date().toISOString()}`;
    const sessionRecord = {
        name: sessionName,
        created_by: user.id,
        // status defaults to 'in_progress' in DB
        // started_at defaults to now() in DB
    };

    console.log('[API Start Session] Inserting new session:', sessionRecord);

    const { data: newSession, error: insertError } = await supabase
        .from('stocktake_sessions') // Inserting into public schema table
        .insert(sessionRecord)
        .select('id, name') // Select fields needed by frontend
        .single();

    if (insertError) {
        console.error('[API Start Session] Error inserting session:', insertError);
        return NextResponse.json({ success: false, error: `Failed to create session: ${insertError.message}` }, { status: 500, headers });
    }

    console.log(`[API Start Session] Session created successfully: ID ${newSession.id}`);

    // 3. Return success response with new session details
    return NextResponse.json(
        { success: true, session: newSession }, 
        { status: 201, headers } // 201 Created status
    );

  } catch (error: any) {
    console.error('[API Start Session] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers });
  }
} 