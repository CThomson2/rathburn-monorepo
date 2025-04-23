// app/api/logs/drum-scan/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { executeDbOperation } from "@/lib/database";

type DrumScanBody = {
  rawBarcode: string;
  deviceId: string;
  actionType: string;
  metadata?: Record<string, any>;
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

    // 2) Insert directly with the Supabase client instead of using the helper
    // to work around schema-qualified table names
    const { data, error } = await supabase
      .from("logs.drum_scan")
      .insert([
        {
          user_id: user.id,
          device_id: body.deviceId,
          raw_barcode: body.rawBarcode,
          action_type: body.actionType,
          metadata: body.metadata || {},
          status: "processed",
        },
      ])
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

    // 3) Return the enriched row (with scan_id, timestamps, triggers fired)
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
