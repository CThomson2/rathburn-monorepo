// app/api/scanner/stocktake/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient as createClient } from '@/lib/supabase/server'; // Use server client for auth & RLS
import { cookies } from 'next/headers';
import { StocktakeScanEvent, broadcastScanEvent } from '@/lib/events/sse';
import { validateAuth } from '@/lib/api/auth'; // <-- Import validateAuth
import { getCorsHeaders, handleOptionsRequest } from '@/lib/api/utils/cors'; // <-- Import CORS utils

// Removed allowedOrigins and local getCorsHeaders function

/**
 * Handle CORS preflight requests for the stocktake scan endpoint
 */
export async function OPTIONS(request: NextRequest) {
  // Use the shared OPTIONS handler
  return handleOptionsRequest(request, 'POST, OPTIONS'); // Specify allowed methods
}

/**
 * Handle POST requests for stocktake scans
 */
export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  // Use the shared CORS header generator
  const headers = getCorsHeaders(requestOrigin, 'POST, OPTIONS');
  // We might not need createAuthClient anymore if validateAuth handles it
  // const supabaseAuth = createAuthClient(); 
  const supabaseService = createClient(); // Service client for DB ops (might bypass RLS)

  try {
    console.log(`[API Stocktake Scan] POST request from origin: ${requestOrigin}`);
    
    // 1. Authenticate user via validateAuth utility
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

    // --- Check authentication result ---
    if (authError || !user) {
      console.error('[API Stocktake Scan] Authentication failed:', authError?.message || 'No user found');
      // Return 401 Unauthorized
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401, headers }); 
    }
    // User is authenticated, proceed...
    console.log(`[API Stocktake Scan] User authenticated: ${user.id}`);

    // 2. Parse request body
    const body = await request.json();
    const { barcode, sessionId, deviceId } = body;
    console.log('[API Stocktake Scan] Request body:', body);

    if (!barcode || !sessionId) {
      console.log('[API Stocktake Scan] Missing barcode or sessionId');
      return NextResponse.json({ success: false, error: 'Missing barcode or session ID' }, { status: 400, headers });
    }

    // 3. Identify barcode type and related ID via RPC call
    let barcodeType: 'material' | 'supplier' | 'unknown' | 'error' = 'unknown';
    let materialId: string | null = null;
    let supplierId: string | null = null;
    let identificationError: string | null = null;

    try {
      console.log(`[API Stocktake Scan] Calling RPC find_item_by_barcode_prefix with prefix: ${barcode}`);
      const { data: rpcData, error: rpcError } = await supabaseService.rpc(
        'find_item_by_barcode_prefix',
        { p_barcode_prefix: barcode } // Pass the barcode as the argument
      );

      if (rpcError) {
        console.error('[API Stocktake Scan] RPC Error:', rpcError);
        throw new Error(`Database function error: ${rpcError.message}`);
      }
      
      // The RPC function returns an array, even if only one row matches
      if (rpcData && rpcData.length > 0) {
         const item = rpcData[0]; // Get the first (and only) result
         if (item.item_type === 'material') {
             barcodeType = 'material';
             materialId = item.item_id;
             console.log(`[API Stocktake Scan] RPC identified as Material: ${materialId}`);
         } else if (item.item_type === 'supplier') {
             barcodeType = 'supplier';
             supplierId = item.item_id;
             console.log(`[API Stocktake Scan] RPC identified as Supplier: ${supplierId}`);
         } else {
             // Should not happen based on RPC logic, but handle defensively
             console.warn(`[API Stocktake Scan] RPC returned unknown item type: ${item.item_type}`);
             barcodeType = 'unknown';
         }
      } else {
         // RPC returned empty array, meaning no match found
         console.log(`[API Stocktake Scan] Barcode ${barcode} not identified via RPC.`);
         barcodeType = 'unknown';
      }

    } catch (lookupError: any) {
      console.error('[API Stocktake Scan] Error identifying barcode via RPC:', lookupError);
      identificationError = lookupError.message || 'Barcode identification failed';
      barcodeType = 'error'; 
    }
    
    // 4a. Insert session into logs.stocktake_sessions
    

    const sessionRecord = {
        session_id: sessionId,
        user_id: user.id,
    };

    // 4b. Insert scan record into logs.stocktake_scans
    let insertedScanData: any = null;
    let insertError: any = null;

    const scanRecord = {
        stocktake_session_id: sessionId,
        user_id: user.id,
        device_id: deviceId || null, // deviceId is optional
        raw_barcode: barcode,
        barcode_type: identificationError ? 'error' : barcodeType,
        material_id: materialId,
        supplier_id: supplierId,
        status: identificationError ? 'error' : (barcodeType === 'unknown' ? 'ignored' : 'success'),
        error_message: identificationError,
        metadata: identificationError ? { lookupError: identificationError } : null,
        // scanned_at is default now()
    };

    console.log('[API Stocktake Scan] Scan record:', scanRecord);

    try {
        const { data, error } = await supabaseService
          .schema('logs')
          .from('stocktake_scans') // Assuming RLS allows user inserts or using service client
            .insert(scanRecord)
            .select() // Return the inserted row
            .single(); // Expecting a single row back

        if (error) {
            throw error;
        }
        insertedScanData = data;
        console.log(`[API Stocktake Scan] Successfully inserted scan record: ${insertedScanData.id}`);

    } catch (error: any) {
        insertError = error;
        console.error('[API Stocktake Scan] Error inserting scan record:', error);
        // Optionally attempt to insert an error record if the primary insert fails?
    }

    // 5. Broadcast event (only if insert succeeded and wasn't an ignored unknown)
    // if (insertedScanData && insertedScanData.status === 'success') {
    //   try {
    //     const eventPayload: StocktakeScanEvent = {
    //       type: 'STOCKTAKE_SCAN',
    //       payload: {
    //         scanId: insertedScanData.id,
    //         sessionId: insertedScanData.stocktake_session_id,
    //         rawBarcode: insertedScanData.raw_barcode,
    //         barcodeType: insertedScanData.barcode_type,
    //         materialId: insertedScanData.material_id,
    //         supplierId: insertedScanData.supplier_id,
    //         status: insertedScanData.status,
    //         scannedAt: insertedScanData.scanned_at, // Use DB timestamp
    //         userId: insertedScanData.user_id,
    //         deviceId: insertedScanData.device_id,
    //       },
    //     };
    //     await broadcastScanEvent(eventPayload);
    //     console.log(`[API Stocktake Scan] Broadcasted SSE event for scan ${insertedScanData.id}`);
    //   } catch (broadcastError) {
    //     console.error('[API Stocktake Scan] Failed to broadcast SSE event:', broadcastError);
    //     // Log error but don't fail the request
    //   }
    // }

    // 6. Return response
    if (insertError) {
      return NextResponse.json({ success: false, error: `Failed to record scan: ${insertError.message}` }, { status: 500, headers });
    } else if (identificationError) {
        // Return success=true but indicate identification error message to the client
        return NextResponse.json({ success: true, scanId: insertedScanData?.id, message: `Scan recorded but identification failed: ${identificationError}` }, { status: 200, headers });
    } else if (barcodeType === 'unknown') {
        return NextResponse.json({ success: true, scanId: insertedScanData?.id, message: 'Scan recorded but barcode type is unknown.' }, { status: 200, headers });
    } else {
        return NextResponse.json({ success: true, scanId: insertedScanData.id, message: `Scan recorded successfully (${barcodeType})` }, { status: 200, headers });
    }

  } catch (error: any) {
    console.error('[API Stocktake Scan] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers });
  }
}
