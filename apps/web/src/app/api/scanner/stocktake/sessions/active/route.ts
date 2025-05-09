// Example: apps/web/src/app/api/scanner/stocktake/sessions/active/route.ts
import { createClient } from "@/lib/supabase/server";
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createClient();

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: In the future, get deviceId from request (header/body) or user session if linked
    // For now, using the hardcoded one provided for development
    const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID;

    if (!deviceId) {
       return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    // Query for an active session for this device
    const { data: activeSession, error: queryError } = await supabase
      .from('stocktake_sessions')
      .select('id, location') // Select id and location
      .eq('device_id', deviceId)
      .eq('status', 'in_progress')
      .maybeSingle(); // Expect 0 or 1 result

    if (queryError) {
      console.error('Error querying active session:', queryError);
      return NextResponse.json({ error: 'Database error checking for active session' }, { status: 500 });
    }

    if (activeSession) {
      // Active session found
      return NextResponse.json({
        success: true,
        session: {
          id: activeSession.id,
          location: activeSession.location, // Return location
        },
      });
    } else {
      // No active session found
      return NextResponse.json({ success: true, session: null });
    }
  } catch (error) {
    console.error('Unexpected error checking active session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
