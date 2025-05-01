// app/api/scanner/stocktake/events/route.ts
import { NextRequest } from "next/server";
import { createEventStreamResponse } from "@/lib/events/sse";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const message = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(message));
      
      // Store the controller for later use
      request.signal.addEventListener('abort', () => {
        controller.close();
      });
    },
  });

  return createEventStreamResponse(stream);
}
