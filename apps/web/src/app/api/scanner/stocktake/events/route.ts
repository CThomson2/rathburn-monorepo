// app/api/scanner/stocktake/events/route.ts
import { NextRequest } from "next/server";
import {
  createEventStreamResponse,
  addSSEClient,
  removeSSEClient,
} from "@/lib/events/sse";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const message = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(message));
      
      // Store the controller for later use by the broadcast function
      addSSEClient(controller);
      console.log('[SSE Route] Client connected');
      
      // Remove the client when the connection is closed by the client or server
      request.signal.addEventListener('abort', () => {
        console.log('[SSE Route] Client disconnected, removing from broadcast list.');
        removeSSEClient(controller);
        // Ensure the stream controller is properly closed on abort
        try {
          controller.close();
        } catch (e) {
          // Ignore errors if already closed
          console.warn('[SSE Route] Error closing controller on abort:', e);
        }
      });
    },
    cancel(reason) {
      // Handle stream cancellation (e.g., server shutting down)
      console.log(`[SSE Route] Stream cancelled: ${reason}`);
      // Ensure client is removed on cancellation too
      // Note: The controller might not be available here depending on the cancellation reason
      // We rely on the 'abort' event listener for client-side disconnects.
    }
  });

  return createEventStreamResponse(stream);
}
