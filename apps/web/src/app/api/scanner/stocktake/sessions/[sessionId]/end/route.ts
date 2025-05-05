// apps/web/src/app/api/stocktake/sessions/[sessionId]/end/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { validateAuth } from '@/lib/api/auth';
import { getCorsHeaders, handleOptionsRequest } from '@/lib/api/utils/cors'; // <-- Import CORS utils

// Removed allowedOrigins and local getCorsHeaders function

/**
 * Handle CORS preflight requests for ending a stocktake session
 */
export async function OPTIONS(request: NextRequest) {
  // Use the shared OPTIONS handler
  return handleOptionsRequest(request, 'PATCH, OPTIONS'); // Specify allowed methods for this endpoint
}

/**
 * Handle PATCH requests to end (complete) a stocktake session
 */
export async function PATCH(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const requestOrigin = request.headers.get('origin');
  // Use the shared CORS header generator
  const headers = getCorsHeaders(requestOrigin, 'PATCH, OPTIONS');
  const supabaseService = createServiceClient(); // Use service client to ensure update permission
  const { sessionId } = params;

  try {
    console.log(`[API Stocktake Session End] PATCH request for session: ${sessionId} from origin: ${requestOrigin}`);

    // 1. Authenticate user using validateAuth utility
    const authHeader = request.headers.get('authorization');
    let user = null;
    let authError = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        user = await validateAuth(authHeader); // validateAuth handles null check internally now
        if (!user) {
            authError = { message: 'Invalid token provided' };
        }
    } else {
        authError = { message: 'Authorization header missing or invalid' };
    }

    if (authError || !user) {
      console.error('[API Stocktake Session End] Authentication failed:', authError?.message || 'No user found');
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401, headers });
    }
    console.log(`[API Stocktake Session End] User authenticated: ${user.id}`);

    // 2. Validate sessionId
    if (!sessionId) {
      console.log('[API Stocktake Session End] Missing sessionId parameter');
      return NextResponse.json({ success: false, error: 'Missing session ID' }, { status: 400, headers });
    }

    // 3. Update the session status in the database
    console.log(`[API Stocktake Session End] Attempting to update session ${sessionId} status to 'completed'`);
    const { data, error } = await supabaseService
      .from('stocktake_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(), // Set completion timestamp
      })
      .eq('id', sessionId)
      .eq('created_by', user.id) // Ensure user can only end their own sessions
      .eq('status', 'in_progress') // Optionally, only allow ending sessions that are currently in progress
      .select()
      .single(); // Get the updated record back

    if (error) {
      console.error(`[API Stocktake Session End] Error updating session ${sessionId}:`, error);
      // Check for specific errors, e.g., session not found or not belonging to user
      if (error.code === 'PGRST116') { // PostgREST error for no rows found
         return NextResponse.json({ success: false, error: 'Session not found, already completed/cancelled, or not owned by user' }, { status: 404, headers });
      }
      return NextResponse.json({ success: false, error: `Failed to end session: ${error.message}` }, { status: 500, headers });
    }

    if (!data) {
        // Should be caught by PGRST116, but handle defensively
        console.warn(`[API Stocktake Session End] Update successful but no data returned for session ${sessionId}`);
        return NextResponse.json({ success: false, error: 'Session not found or could not be updated' }, { status: 404, headers });
    }

    console.log(`[API Stocktake Session End] Successfully marked session ${sessionId} as completed`);
    return NextResponse.json({ success: true, message: 'Stocktake session completed', session: data }, { status: 200, headers });

  } catch (error: any) {
    console.error('[API Stocktake Session End] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers });
  }
}
