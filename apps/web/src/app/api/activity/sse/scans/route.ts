import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tells Next.js to never cache this route and always fetch fresh data
export const dynamic = "force-dynamic";

// Specifies that this route should run on Node.js runtime instead of Edge runtime
// This is needed for long-lived connections
export const runtime = "nodejs";

/**
 * Handles GET requests for Server-Sent Events (SSE) to stream scan events
 *
 * This function sets up a stream that sends real-time updates about drum scans
 * to connected clients using SSE. It initializes the connection and sets up
 * a subscription to the database for real-time updates.
 *
 * @param req - The incoming Next.js request object.
 * @returns A Response object with the SSE stream and appropriate headers.
 */
export async function GET(req: NextRequest) {
  // TextEncoder converts strings to Uint8Array for streaming
  const encoder = new TextEncoder();
  const connectionId = Math.random().toString(36).substring(7);

  console.log(`[Scans SSE ${connectionId}] New connection established`);

  // Create Supabase client using the centralized function
  const supabase = createClient();

  // ReadableStream is a Web API that allows streaming data to clients
  const stream = new ReadableStream({
    start: (controller) => {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`event: connected\ndata: Connected to scans SSE\n\n`)
      );

      // Set up subscription for real-time scan events
      const subscription = supabase
        .channel("scan_events")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "log_drum_scan",
          },
          (payload: any) => {
            console.log(
              `\n[Scans SSE ${connectionId}] New scan detected:`,
              payload.new.scan_id
            );

            try {
              // Format the data according to SSE specification
              const data = JSON.stringify({
                scanId: payload.new.scan_id,
                drumId: payload.new.drum_id,
                scanType: payload.new.scan_type,
                scanStatus: payload.new.scan_status,
                scannedAt: payload.new.scanned_at,
                userId: payload.new.user_id,
              });

              controller.enqueue(
                encoder.encode(`event: scanEvent\ndata: ${data}\n\n`)
              );
            } catch (error) {
              console.error(
                `[Scans SSE ${connectionId}] Failed to send update:`,
                error
              );
            }
          }
        )
        .subscribe();

      // Enhanced cleanup function to remove event listeners when connection closes
      const cleanup = () => {
        console.log(
          `[Scans SSE ${connectionId}] Connection closed, cleaning up`
        );
        supabase.removeChannel(subscription);
      };

      // The abort event fires when client disconnects (closes browser, navigates away, etc)
      req.signal.addEventListener("abort", cleanup);
      return cleanup;
    },
  });

  // Create and return SSE response with appropriate headers
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream", // Tells browser this is SSE
      "Cache-Control": "no-cache", // Prevents caching of events
      Connection: "keep-alive", // Keeps connection open
    },
  });
}
