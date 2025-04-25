// app/api/logs/drum-scan/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { executeDbOperation } from "@/lib/database";
import nextCors from "nextjs-cors";

type ScanAction =
  | "context_get"
  | "context_set"
  | "transport"
  | "location_set"
  | "barcode_scan"
  | "cancel_scan"
  | "fast_forward"
  | "bulk";

type DrumScanBody = {
  barcode: string;           // raw_barcode
  jobId: number;             // for metadata.job_id
  action: ScanAction;  // determines action_type
  deviceId?: string;         // device identifier
};

/**
 * Set CORS headers for cross-domain requests
 * Allows both subdomain and localhost for development
 */
function setCorsHeaders(response: NextResponse) {
  // Allow the specific origin for the mobile app
  const allowedOrigins = [
    "https://mobile.rathburn.app",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:4173",
  ];

  const origin =
    "origin" in response.headers ? response.headers.get("origin") || "" : "";

  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    // Fallback to the mobile subdomain if origin doesn't match
    response.headers.set(
      "Access-Control-Allow-Origin",
      "https://mobile.rathburn.app"
    );
  }

  // Allow credentials (cookies, authorization headers)
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return response;
}

/**
 * OPTIONS handler for CORS preflight requests
 * This must return immediately with CORS headers and not attempt authentication
 */
export async function OPTIONS(req: NextRequest) {
  // Create a simple 200 response without any auth checks
  const response = NextResponse.json({}, { status: 200 });

  // Set CORS headers on the response
  return setCorsHeaders(response);
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
 *   @param {string} req.body.barcode - Raw barcode data from the scan
 *   @param {number} req.body.jobId - Job ID associated with the scan
 *   @param {string} req.body.action - Action type associated with the scan
 *   @param {string} [req.body.deviceId] - Identifier for the scanning device
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
  console.log("POST request received at /api/logs/drum-scan");
  // For POST requests, ensure CORS headers are sent even if authentication fails
  if (req.method === "OPTIONS") {
    return OPTIONS(req);
  }

  const body: DrumScanBody = await req.json();

  try {
    // 1) init supabase server client and authenticate user
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      const response = NextResponse.json(
        { error: "Unauthenticated" },
        { status: 401 }
      );
      return setCorsHeaders(response);
    }

    // 2) Transform the request body to match your DB schema
    const { barcode, jobId, action, deviceId = req.headers.get('user-agent') || "unknown" } = body;

    // 3) Determine the action type for logs.drum_scan
    const actionType = action === 'cancel_scan' ? 'cancel_scan' : 'barcode_scan';

    // 4) Insert data with proper mapping
    const { data, error } = await supabase
      .from("logs.drum_scan")
      .insert({
        user_id: user.id,
        device_id: deviceId,
        raw_barcode: barcode,
        detected_drum: barcode, // Assuming barcode is the drum ID
        action_type: actionType,
        status: "processed",
        metadata: {
          job_id: jobId,
          scan_method: action === 'bulk' ? 'bulk_registration' : 'single_scan',
          app_version: '1.0.0'
        }
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting drum scan:", error);
      const response = NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
      return setCorsHeaders(response);
    }

    // 5) Return the enriched row (with scan_id, timestamps, triggers fired)
    const response = NextResponse.json({ scan: data }, { status: 201 });
    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error in drum-scan endpoint:", error);
    const response = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
    return setCorsHeaders(response);
  }
}
