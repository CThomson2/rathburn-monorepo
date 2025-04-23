// app/api/logs/drum-scan/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { executeDbOperation } from '@/lib/database'

type DrumScanBody = {
  rawBarcode:       string
  deviceId:         string
  actionType:       string
  metadata?:        Record<string,any>
}

/**
 * POST endpoint for logging drum scan events
 *
 * This endpoint authenticates the user through Supabase, then logs
 * the provided drum scan data into the `logs.drum_scan` table.
 *
 * @route POST /api/logs/drum-scan
 *
 * @param {NextRequest} req - The request object containing:
 *   @param {Object} req.body - Request body
 *   @param {string} req.body.rawBarcode - Raw barcode data from the scan
 *   @param {string} req.body.deviceId - Identifier for the scanning device
 *   @param {string} req.body.actionType - Type of action associated with the scan
 *   @param {Object} [req.body.metadata] - Optional additional metadata for the scan
 *
 * @returns {Promise<NextResponse>} Response object with:
 *   - 201: Successfully logged scan
 *     - scan: Object containing inserted scan data
 *   - 401: Unauthenticated
 *     - error: 'Unauthenticated'
 *   - 500: Internal server error
 *     - error: Error message from database operation
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: DrumScanBody = await req.json()
  
  try {
    // 1) init supabase server client and authenticate user
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    // 2) Insert directly with the Supabase client instead of using the helper
    // to work around schema-qualified table names
    const { data, error } = await supabase
      .from('drum_scan')
      .insert([{
        user_id:      user.id,
        device_id:    body.deviceId,
        raw_barcode:  body.rawBarcode,
        action_type:  body.actionType,
        metadata:     body.metadata || {},
        status:       'processed'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error inserting drum scan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3) Return the enriched row (with scan_id, timestamps, triggers fired)
    return NextResponse.json({ scan: data }, { status: 201 })
  } catch (error) {
    console.error('Error in drum-scan endpoint:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
