import { NextRequest, NextResponse } from "next/server";
import { drumEvents } from "@/lib/events";
import { z } from "zod";
import { executeDbOperation } from "@/lib/database";
import { createClient as createClient } from "@/lib/supabase/server";
// import { sendOrderCompleteNotification } from "@/lib/email/orderNotifications";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Zod schema for the barcode data format
 * Barcode format: <material_code>-<drum_id>
 * Data may be transmitted with or without a timestamp
 * e.g. "HEX-18342" or "HEX-18342 2024/01/22 08:31:59"
 */
const barcodeSchema = z.object({
  barcode: z
    .string()
    .regex(
      /^(\w{3,6})-(\d{4,5})(?:\s+\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})?$/
    ), // for new drum labels
  timestamp: z.string(),
});

/* Data validation methods */
/**
 * Validates the status of a drum in the database.
 *
 * @param {number} drumId - The ID of the drum to validate.
 * @param {string} expectedStatus - The expected status of the drum.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the drum status matches the expected status.
 */
async function validateDrumStatus(
  drumId: number,
  expectedStatus: string
): Promise<boolean> {
  return executeDbOperation(async (client) => {
    const { data: drum, error: drumError } = await client
      .schema("inventory")
      .from("drums")
      .select("*")
      .eq("drum_id", drumId.toString())
      .maybeSingle();

    if (drumError) {
      console.error(`Error fetching drum: ${drumError.message}`);
    }
    return drum?.status === expectedStatus;
  });
}

/**
 * POST endpoint for processing barcode scans of drums
 *
 * This endpoint handles barcode scanning events for drums in the inventory system.
 * It validates the barcode format, looks up the drum record, and processes status
 * transitions based on the current drum state.
 *
 * @route POST /api/scanners/scan
 *
 * @param {NextRequest} req - The request object containing:
 *   @param {Object} req.body - Request body
 *   @param {string} req.body.barcode - Barcode string in format "XX-HXXXX" or "XX-HXXXX YYYY/MM/DD HH:mm:ss"
 *   @param {string} req.body.timestamp - Timestamp of the scan
 *
 * @returns {Promise<NextResponse>} Response object with:
 *   - 200: Successful scan processing
 *     - success: true
 *     - data: Object containing drum_id, status changes, and result message
 *   - 400: Invalid request data or unhandled drum status
 *     - message: Error description
 *   - 404: Drum not found
 *     - message: Error description
 *   - 500: Internal server error
 *     - message: "Internal server error"
 *     - error: Error details
 *
 * @throws {Error} When database operations fail or unexpected errors occur
 *
 * @example Request body:
 * {
 *   "barcode": "52-H1024",
 *   "timestamp": "2024-01-22T08:31:59Z"
 * }
 *
 * @example Success Response (Pending -> in_stock):
 * {
 *   "success": true,
 *   "data": {
 *     "drum_id": 1024,
 *     "old_status": "pending",
 *     "message": "Import transaction created; DB triggers will finalize updates."
 *   }
 * }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("=== Starting barcode scan processing ===");
    console.log("\nRaw request:", {
      method: req.method,
      url: req.url,
      headers: {
        "content-length": req.headers.get("content-length"),
        "x-forwarded-for": req.headers.get("x-forwarded-for"),
      },
    });

    // Get user from Supabase server-side authentication
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { message: "Authentication required to process scans" },
        { status: 401 }
      );
    }

    // We need to use user.id as a string for the database
    const userId = user.id;

    // Parse and validate incoming data
    const data = await req.json();
    console.log("\nParsed request data:", JSON.stringify(data, null, 2));

    return executeDbOperation(async (client) => {
      // Validate against schema
      const validationResult = barcodeSchema.safeParse(data);
      if (!validationResult.success) {
        console.log("\n\n !!~~ Schema validation failed: ~~!!", validationResult.error);
        return NextResponse.json(
          { message: "Invalid request data format" },
          { status: 400 }
        );
      }

      // Extract material_code and drum_id from the barcode string
      const match = data.barcode.match(/^(\w{3,6})-(\d{4,5})$/);
      console.log("\nBarcode regex match result:", match);
      if (!match) {
        console.error("Invalid barcode format:", data.barcode);
        return NextResponse.json(
          { message: "Invalid barcode format" },
          { status: 400 }
        );
      }
      const [, materialCode, drumIdStr] = match;
      const drumId = parseInt(drumIdStr, 10);

      console.log("\nExtracted data:", { materialCode, drumId });

      // Check the last scan time
      const { data: scanData, error: scanError } = await client
        .schema("logs")
        .from("drum_scan")
        .select("*")
        .eq("detected_drum", drumId.toString())
        .order("scanned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scanError) {
        console.error("Error fetching last scan:", scanError);
        return NextResponse.json(
          { message: "Database error when checking scan history" },
          { status: 500 }
        );
      }

      const now = new Date();
      if (scanData && scanData.scanned_at) {
        const timeSinceLastScan = Math.floor(
          (now.getTime() - new Date(scanData.scanned_at).getTime()) / 60000
        );

        if (timeSinceLastScan < 60) {
          // Insert a "cancelled" transaction
          const { error: insertError } = await client
            .schema("logs")
            .from("drum_scan")
            .insert({
              detected_drum: drumId.toString(),
              user_id: userId,
              action_type: "barcode_scan",
              status: "failed",
              error_code: `Scanned ${timeSinceLastScan} minutes after most recent scan`,
              scanned_at: now.toISOString(),
              raw_barcode: data.barcode,
              device_id: "API", // Since this is an API route, we use a default device ID
              metadata: { materialCode }
            });

          if (insertError) {
            console.error("Error creating cancelled transaction:", insertError);
            return NextResponse.json(
              { message: "Database error when creating transaction" },
              { status: 500 }
            );
          }

          return NextResponse.json(
            {
              message: `Drum has been scanned recently. Transaction cancelled.`,
            },
            { status: 429 }
          );
        }
      }

      // Look up the existing drum record
      console.log("\nQuerying drum record for drum_id:", drumId);
      const { data: existingDrum, error: drumError } = await client
        .schema("inventory")
        .from("drums")
        .select("*")
        .eq("drum_id", drumId.toString())
        .maybeSingle();

      if (drumError) {
        console.error("Error fetching drum:", drumError);
        return NextResponse.json(
          { message: "Database error when checking drum" },
          { status: 500 }
        );
      }

      console.log("\nFound drum record:", JSON.stringify(existingDrum, null, 2));

      if (!existingDrum) {
        console.error("No drum found with ID:", drumId);

        // Log the failed scan attempt
        const { error: insertError } = await client
          .schema("logs")
          .from("drum_scan")
          .insert({
            detected_drum: drumId.toString(),
            user_id: userId,
            action_type: "barcode_scan",
            status: "failed",
            error_code: `Drum ID ${drumId} not found in database`,
            scanned_at: now.toISOString(),
            raw_barcode: data.barcode,
            device_id: "API",
            metadata: { materialCode }
          });

        if (insertError) {
          console.error("Error logging failed scan:", insertError);
        }

        return NextResponse.json(
          { message: `Drum ID ${drumId} not found in database` },
          { status: 404 }
        );
      }

      console.log("\nCurrent inventory status:", existingDrum.status.toUpperCase());

      // Branch logic by current drum status
      switch (existingDrum.status) {
        /* Scanning into inventory */
        case "pending":
          console.log("Creating import transaction for drum:", drumId);

          // Validate drum status is still pending
          const isPending = await validateDrumStatus(drumId, "en_route");
          if (!isPending) {
            console.error("Drum status has changed since validation");
            return NextResponse.json(
              { message: "Drum status has changed since validation" },
              { status: 409 }
            );
          }

          const { error: intakeError } = await client
            .schema("logs")
            .from("drum_scan")
            .insert({
              detected_drum: drumId.toString(),
              user_id: userId,
              action_type: "barcode_scan",
              status: "success",
              scanned_at: now.toISOString(),
              raw_barcode: data.barcode,
              device_id: "API",
              metadata: { materialCode, action: "intake" }
            });

          if (intakeError) {
            console.error("Error creating intake transaction:", intakeError);
            return NextResponse.json(
              { message: "Database error when creating transaction" },
              { status: 500 }
            );
          }

          console.log("Created import transaction");

          // Update the drum status
          // TODO: This would typically be handled by a trigger
          const { error: updateError } = await client
            .schema("inventory")
            .from("drums")
            .update({ status: "in_stock" })
            .eq("drum_id", drumId.toString());

          if (updateError) {
            console.error("Error updating drum status:", updateError);
            return NextResponse.json(
              { message: "Database error when updating drum status" },
              { status: 500 }
            );
          }

          // Check if status was updated
          console.log("Verifying drum status update...");

          const { data: updatedDrum, error: verifyError } = await client
            .schema("inventory")
            .from("drums")
            .select("status")
            .eq("drum_id", drumId.toString())
            .maybeSingle();

          if (verifyError) {
            console.error("Error verifying drum status:", verifyError);
            return NextResponse.json(
              { message: "Database error when verifying drum status" },
              { status: 500 }
            );
          }

          if (updatedDrum?.status !== "in_stock") {
            console.error("Failed to update drum status to 'in_stock'");
            return NextResponse.json(
              {
                success: false,
                data: {
                  drum_id: drumId,
                  old_status: "pending",
                  message: "Failed to update drum status",
                },
              },
              { status: 500 }
            );
          }

          // Emit status change event
          console.log("Emitting drumStatus event for drum:", drumId);
          drumEvents.emit("drumStatus", drumId, "in_stock");

          console.log("Events emitted successfully");

          return NextResponse.json(
            {
              success: true,
              data: {
                drum_id: drumId,
                old_status: "pending",
                new_status: "in_stock",
                message:
                  "Import transaction created and drum status updated to in_stock.",
              },
            },
            { status: 200 }
          );

        /* Scanning out of inventory */
        case "in_stock":
          console.log("Creating processing transaction for drum:", drumId);

          // Validate drum status is still in_stock
          const isInStock = await validateDrumStatus(drumId, "in_stock");
          if (!isInStock) {
            console.error("Drum status has changed since validation");
            return NextResponse.json(
              { message: "Drum status has changed since validation" },
              { status: 409 }
            );
          }

          const { error: processError } = await client
            .schema("logs")
            .from("drum_scan")
            .insert({
              detected_drum: drumId.toString(),
              user_id: userId,
              action_type: "barcode_scan",
              status: "success",
              scanned_at: now.toISOString(),
              raw_barcode: data.barcode,
              device_id: "API",
              metadata: { materialCode, action: "processing" }
            });

          if (processError) {
            console.error(
              "Error creating processing transaction:",
              processError
            );
            return NextResponse.json(
              { message: "Database error when creating transaction" },
              { status: 500 }
            );
          }

          console.log("Created processing transaction");

          // Update the drum status (this would typically be handled by a trigger)
          const { error: processingUpdateError } = await client
            .schema("inventory")
            .from("drums")
            .update({ status: "processed" })
            .eq("drum_id", drumId.toString());

          if (processingUpdateError) {
            console.error("Error updating drum status:", processingUpdateError);
            return NextResponse.json(
              { message: "Database error when updating drum status" },
              { status: 500 }
            );
          }

          // Check if status was updated
          console.log("Verifying drum status update...");

          const { data: processedDrum, error: processVerifyError } =
            await client
              .schema("inventory")
              .from("drums")
              .select("status")
              .eq("drum_id", drumId.toString())
              .maybeSingle();

          if (processVerifyError) {
            console.error("Error verifying drum status:", processVerifyError);
            return NextResponse.json(
              { message: "Database error when verifying drum status" },
              { status: 500 }
            );
          }

          if (processedDrum?.status !== "processed") {
            console.error("Failed to update drum status to 'processed'");
            return NextResponse.json(
              {
                success: false,
                data: {
                  drum_id: drumId,
                  old_status: "in_stock",
                  message: "Failed to update drum status",
                },
              },
              { status: 500 }
            );
          }

          // Emit status change event for in_stock -> processed transition
          console.log("Emitting drumStatus event for drum:", "#" + drumId);
          drumEvents.emit("drumStatus", drumId, "processed");

          return NextResponse.json(
            {
              success: true,
              data: {
                drum_id: drumId,
                old_status: "in_stock",
                new_status: "processed",
                message: "Drum status updated to 'processed'",
              },
            },
            { status: 200 }
          );

        default:
          console.error("Unexpected drum status:", existingDrum.status);

          // Log the scan attempt for an unhandled status
          const { error: insertError } = await client
            .schema("logs")
            .from("drum_scan")
            .insert({
              detected_drum: drumId.toString(),
              user_id: userId,
              action_type: "barcode_scan",
              status: "failed",
              error_code: `Invalid or unhandled drum status for scanning: ${existingDrum.status}`,
              scanned_at: now.toISOString(),
              raw_barcode: data.barcode,
              device_id: "API",
              metadata: { materialCode }
            });

          if (insertError) {
            console.error("Error logging failed scan:", insertError);
          }

          return NextResponse.json(
            {
              message: `Invalid or unhandled drum status for scanning: ${existingDrum.status}`,
            },
            { status: 400 }
          );
      }
    });
  } catch (error: any) {
    console.error("Error processing barcode:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// Suggested refactoring points:
// 1. Extract the logic for validating incoming data into a separate function.
// 2. Extract the logic for extracting order_id and drum_id from the barcode string into a separate function.
// 3. Extract the logic for checking the last scan time into a separate function.
// 4. Extract the logic for looking up the existing drum record into a separate function.
// 5. Extract the logic for handling the "pending" status into a separate function.
// 6. Extract the logic for handling the "in_stock" status into a separate function.
// 7. Extract the logic for emitting events into a separate function.
// 8. Extract the logic for checking if the order is complete into a separate function.
