import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { Database } from '@/types/supabase'; // Adjust path if needed
import { validateAuth, createAuthenticatedClient } from '@/lib/api/auth'; // <-- Import validateAuth and createAuthenticatedClient
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
  const headers = getCorsHeaders(requestOrigin, 'GET, POST, OPTIONS');
  let supabase = createClient();

  try {
    console.log(`[API Sessions GET] Request from origin: ${requestOrigin}`);
    
    const authHeader = request.headers.get('authorization');
    let user = null;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const authResult = await validateAuth(authHeader);
        user = authResult.user;
        token = authResult.token;
        if (!user) {
            return NextResponse.json({ error: 'Invalid token provided' }, { status: 401, headers });
        }
    } else {
        return NextResponse.json({ error: 'Authorization header missing or invalid' }, { status: 401, headers });
    }

    if (token) {
        const authClient = createAuthenticatedClient(token);
        if (authClient) {
            supabase = authClient;
            console.log('[API Sessions GET] Using authenticated Supabase client');
        } else {
            console.warn('[API Sessions GET] Failed to create authenticated client, using default');
        }
    }

    const clientDeviceId = request.headers.get('X-Device-ID');

    if (!clientDeviceId) {
       console.warn('[API Sessions GET] Device ID missing (X-Device-ID header).');
       return NextResponse.json({ error: 'Device ID is required (X-Device-ID header)' }, { status: 400, headers });
    }
    console.log(`[API Sessions GET] Checking active session for User: ${user.id}, Device: ${clientDeviceId}`);

    const { data: activeSession, error: queryError } = await supabase
      .from('sessions')
      .select('id, name, device_id, metadata, location, started_at, status, created_by') // Ensure all needed fields are selected
      .eq('device_id', clientDeviceId) // Match the device ID from header
      .eq('created_by', user.id)      // Match the authenticated user ID
      .eq('status', 'in_progress')
      .maybeSingle();

    if (queryError) {
      console.error('[API Sessions GET] Error querying active session:', queryError);
      return NextResponse.json({ error: 'Database error checking for active session' }, { status: 500, headers });
    }

    if (activeSession) {
      console.log(`[API Sessions GET] Active session found: ${activeSession.id} for device ${activeSession.device_id}`);
      // Ensure the returned session object structure matches CheckActiveSessionResponse in session-store.ts
      return NextResponse.json({ 
        success: true, 
        session: {
            id: activeSession.id,
            name: activeSession.name,
            location: activeSession.location, // Assuming location is directly on the session table
            metadata: activeSession.metadata,
            started_at: activeSession.started_at,
            device_id: activeSession.device_id // Explicitly include device_id
        }
      }, { status: 200, headers });
    } else {
      console.log('[API Sessions GET] No active session found for this user and device.');
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
  let supabase = createClient(); // Default client, will be replaced if auth successful

  try {
    console.log(`[API Sessions POST] Request from origin: ${requestOrigin}`);
    
    // --- Authenticate User using validateAuth ---
    const authHeader = request.headers.get('authorization');
    let user = null;
    let authError = null;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const authResult = await validateAuth(authHeader);
        user = authResult.user;
        token = authResult.token;
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

    // Create an authenticated client that will pass the token with each request
    if (token) {
        const authClient = createAuthenticatedClient(token);
        if (authClient) {
            supabase = authClient; // Replace the default client with the authenticated one
            console.log('[API Sessions POST] Using authenticated Supabase client');
        } else {
            console.warn('[API Sessions POST] Failed to create authenticated client, using default');
        }
    }

    // --- Device ID Handling ---
    // TODO: Link device ID to user properly in the future
    const deviceId = request.headers.get('X-Device-ID') || process.env.NEXT_PUBLIC_DEVICE_ID; // Get from header or fallback
     if (!deviceId) {
       console.warn('[API Sessions POST] Device ID missing.');
       // Decide if this is an error or if a session can be started without it
       return NextResponse.json({ success: false, error: 'Device ID is required (X-Device-ID header)' }, { status: 400, headers });
    }
    console.log(`[API Sessions POST] Using Device ID: ${deviceId}`);
    // --- End Device ID Handling ---

     // Check for existing active session for this device BEFORE creating a new one
     const { data: existingSession, error: checkError } = await supabase
       .from('sessions')
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
        .from('sessions')
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