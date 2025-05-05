import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { Database } from '@/types/models/supabase'; // Adjust path if needed
import { validateAuth } from '@/lib/api/auth'; // <-- Import validateAuth
import { getCorsHeaders, handleOptionsRequest } from '@/lib/api/utils/cors'; // <-- Import CORS utils
// Import the specific type for cookie options expected by Next.js cookies().set
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

// --- OPTIONS Handler (for CORS preflight) ---
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
    // Use the shared OPTIONS handler
    return handleOptionsRequest(request, 'GET, POST, OPTIONS'); // Specify allowed methods for GET and POST
}

// --- GET Handler (Check for Active Session) ---
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestOrigin = request.headers.get('origin');
  // Use the shared CORS header generator
  const headers = getCorsHeaders(requestOrigin, 'GET, POST, OPTIONS');
  const supabase = createClient();

  try {
    console.log(`[API Sessions GET] Request from origin: ${requestOrigin}`);
    
    // --- Authenticate User using validateAuth ---
    const authHeader = request.headers.get('authorization');
    let user = null;
    let authError = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        user = await validateAuth(authHeader);
        if (!user) {
            authError = { message: 'Invalid token provided' };
        }
    } else {
        authError = { message: 'Authorization header missing or invalid' };
    }

    if (authError || !user) {
      console.error('[API Sessions GET] Auth error:', authError?.message || 'No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    // --- End Authentication ---

    // Get device ID - Prefer header, fall back to hardcoded for dev
    // TODO: Remove hardcoded fallback eventually
    const deviceId = request.headers.get('X-Device-ID') || '4f096e70-33fd-4913-9df1-8e1fae9591bc';

    if (!deviceId) {
       console.warn('[API Sessions GET] Device ID missing.');
       return NextResponse.json({ error: 'Device ID is required (X-Device-ID header)' }, { status: 400, headers });
    }
    console.log(`[API Sessions GET] Checking active session for User: ${user.id}, Device: ${deviceId}`);

    const { data: activeSession, error: queryError } = await supabase
      .from('stocktake_sessions')
      .select('id')
      .eq('device_id', deviceId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (queryError) {
      console.error('[API Sessions GET] Error querying active session:', queryError);
      return NextResponse.json({ error: 'Database error checking for active session' }, { status: 500, headers });
    }

    if (activeSession) {
      console.log(`[API Sessions GET] Active session found: ${activeSession.id}`);
      return NextResponse.json({ success: true, session: { id: activeSession.id } }, { status: 200, headers });
    } else {
      console.log('[API Sessions GET] No active session found.');
      return NextResponse.json({ success: true, session: null }, { status: 200, headers });
    }
  } catch (error) {
    console.error('[API Sessions GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers });
  }
}

// --- POST Handler (Start New Session) ---
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestOrigin = request.headers.get('origin');
  // Use the shared CORS header generator
  const headers = getCorsHeaders(requestOrigin, 'GET, POST, OPTIONS');
  const supabase = createClient();

  try {
    console.log(`[API Sessions POST] Request from origin: ${requestOrigin}`);
    
    // --- Authenticate User using validateAuth ---
    const authHeader = request.headers.get('authorization');
    let user = null;
    let authError = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        user = await validateAuth(authHeader);
        if (!user) {
            authError = { message: 'Invalid token provided' };
        }
    } else {
        authError = { message: 'Authorization header missing or invalid' };
    }

    if (authError || !user) {
       console.error('[API Sessions POST] Auth error:', authError?.message || 'No user found');
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401, headers });
    }
    const userId = user.id; // Use user.id from validateAuth result
    console.log(`[API Sessions POST] User authenticated: ${userId}`);
    // --- End Authentication ---

    // --- Device ID Handling ---
    // TODO: Link device ID to user properly in the future
    const deviceId = request.headers.get('X-Device-ID') || '4f096e70-33fd-4913-9df1-8e1fae9591bc'; // Get from header or fallback
     if (!deviceId) {
       console.warn('[API Sessions POST] Device ID missing.');
       // Decide if this is an error or if a session can be started without it
       return NextResponse.json({ success: false, error: 'Device ID is required (X-Device-ID header)' }, { status: 400, headers });
    }
    console.log(`[API Sessions POST] Using Device ID: ${deviceId}`);
    // --- End Device ID Handling ---

     // Check for existing active session for this device BEFORE creating a new one
     const { data: existingSession, error: checkError } = await supabase
       .from('stocktake_sessions')
       .select('id')
       .eq('device_id', deviceId)
       .eq('status', 'in_progress')
       .maybeSingle();

     if (checkError) {
         console.error('[API Sessions POST] Error checking existing session:', checkError);
         return NextResponse.json({ success: false, error: 'Database error checking existing session' }, { status: 500, headers });
     }

     if (existingSession) {
         console.warn(`[API Sessions POST] User ${userId} on device ${deviceId} already has an active session: ${existingSession.id}`);
         // Return the existing session instead of creating a new one? Or return an error?
         // For now, let's return an error to prevent duplicate active sessions per device.
          return NextResponse.json({ success: false, error: 'An active session already exists for this device.' }, { status: 409, headers }); // 409 Conflict
     }


    // Create session record
    const sessionName = `Stocktake - ${new Date().toISOString().split('T')[0]} - Device ${deviceId.substring(0, 5)}`; // More descriptive name
    const sessionRecord = {
        name: sessionName,
        created_by: userId,
        device_id: deviceId, // Store the device ID
        // status defaults to 'in_progress' in DB
        // started_at defaults to now() in DB
    };

    console.log('[API Sessions POST] Inserting new session:', sessionRecord);

    const { data: newSession, error: insertError } = await supabase
        .from('stocktake_sessions')
        .insert(sessionRecord)
        .select('id, name') // Remove location from select
        .single();

    if (insertError) {
        console.error('[API Sessions POST] Error inserting session:', insertError);
        return NextResponse.json({ success: false, error: `Failed to create session: ${insertError.message}` }, { status: 500, headers });
    }

    console.log(`[API Sessions POST] Session created successfully: ID ${newSession.id}`);

    return NextResponse.json(
        { success: true, session: newSession },
        { status: 201, headers } // 201 Created
    );

  } catch (error) {
    console.error('[API Sessions POST] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers });
  }
} 