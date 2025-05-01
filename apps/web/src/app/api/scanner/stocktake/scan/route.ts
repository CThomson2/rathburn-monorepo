// app/api/scanner/stocktake/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Use server client for auth & RLS
import { cookies } from 'next/headers';
import { StocktakeScanEvent, broadcastScanEvent } from '@/lib/events/sse';

// Define allowed origins (copy from single scan route or centralize)
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

// Helper function to generate dynamic CORS headers (consider centralizing this)
function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
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

/**
 * Handle CORS preflight requests for the stocktake scan endpoint
 */
export async function OPTIONS(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  console.log(`[API Stocktake Scan] OPTIONS request from origin: ${requestOrigin}`);
  const headers = getCorsHeaders(requestOrigin);
  return new Response(null, {
    status: 204,
    headers: headers
  });
}

/**
 * Handle POST requests for stocktake scans
 */
export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  const headers = getCorsHeaders(requestOrigin);
  const supabase = createClient(cookies()); // Use cookie-based auth client

  try {
    console.log(`[API Stocktake Scan] POST request from origin: ${requestOrigin}`);
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[API Stocktake Scan] Authentication error:', authError);
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401, headers });
    }
    console.log(`[API Stocktake Scan] User authenticated: ${user.id}`);

    // 2. Parse request body
    const body = await request.json();
    const { barcode, sessionId, deviceId } = body;
    console.log('[API Stocktake Scan] Request body:', body);

    if (!barcode || !sessionId) {
      console.log('[API Stocktake Scan] Missing barcode or sessionId');
      return NextResponse.json({ success: false, error: 'Missing barcode or session ID' }, { status: 400, headers });
    }

    // 3. Identify barcode type and related ID (Material or Supplier)
    let barcodeType: 'material' | 'supplier' | 'unknown' | 'error' = 'unknown';
    let materialId: string | null = null;
    let supplierId: string | null = null;
    let identificationError: string | null = null;

    try {
      // Check if it's a material (assuming barcode might be material_id or code)
      // Adjust query based on actual barcode format/content
      const { data: materialData, error: materialError } = await supabase
        .from('materials')
        .select('material_id')
        .or(`material_id.eq.${barcode},code.eq.${barcode}`)
        .limit(1)
        .single(); // Use single to expect zero or one result

      if (materialError && materialError.code !== 'PGRST116') { // Ignore 'No rows found' error
          throw new Error(`Material lookup failed: ${materialError.message}`);
      }

      if (materialData) {
        barcodeType = 'material';
        materialId = materialData.material_id;
        console.log(`[API Stocktake Scan] Identified as Material: ${materialId}`);
      } else {
        // Check if it's a supplier (assuming barcode might be supplier_id or code)
        const { data: supplierData, error: supplierError } = await supabase
          .from('suppliers')
          .select('supplier_id')
          .or(`supplier_id.eq.${barcode},code.eq.${barcode}`) // Adjust if supplier code is used
          .limit(1)
          .single();

        if (supplierError && supplierError.code !== 'PGRST116') { // Ignore 'No rows found' error
            throw new Error(`Supplier lookup failed: ${supplierError.message}`);
        }
        
        if (supplierData) {
          barcodeType = 'supplier';
          supplierId = supplierData.supplier_id;
          console.log(`[API Stocktake Scan] Identified as Supplier: ${supplierId}`);
        }
      }

      if(barcodeType === 'unknown') {
          console.log(`[API Stocktake Scan] Barcode ${barcode} not identified.`);
      }

    } catch (lookupError: any) {
      console.error('[API Stocktake Scan] Error identifying barcode:', lookupError);
      identificationError = lookupError.message || 'Barcode identification failed';
      barcodeType = 'error'; // Mark as error type due to lookup failure
    }
    
    // 4. Insert scan record into logs.stocktake_scans
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

    try {
        const { data, error } = await supabase
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
    if (insertedScanData && insertedScanData.status === 'success') {
      try {
        const eventPayload: StocktakeScanEvent = {
          type: 'STOCKTAKE_SCAN',
          payload: {
            scanId: insertedScanData.id,
            sessionId: insertedScanData.stocktake_session_id,
            rawBarcode: insertedScanData.raw_barcode,
            barcodeType: insertedScanData.barcode_type,
            materialId: insertedScanData.material_id,
            supplierId: insertedScanData.supplier_id,
            status: insertedScanData.status,
            scannedAt: insertedScanData.scanned_at, // Use DB timestamp
            userId: insertedScanData.user_id,
            deviceId: insertedScanData.device_id,
          },
        };
        await broadcastScanEvent(eventPayload);
        console.log(`[API Stocktake Scan] Broadcasted SSE event for scan ${insertedScanData.id}`);
      } catch (broadcastError) {
        console.error('[API Stocktake Scan] Failed to broadcast SSE event:', broadcastError);
        // Log error but don't fail the request
      }
    }

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
