// lib/events/sse.ts
export function createEventStreamResponse(stream: ReadableStream) {
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
  
  // Utility function for broadcasting events
  let clients: Set<any> = new Set();
  
  export function addSSEClient(controller: any) {
    clients.add(controller);
  }
  
  export function removeSSEClient(controller: any) {
    clients.delete(controller);
  }
  
  export async function broadcastScanEvent(scanEvent: any) {
    const message = `event: scan\ndata: ${JSON.stringify(scanEvent)}\n\n`;
    
    clients.forEach(controller => {
      try {
        controller.enqueue(new TextEncoder().encode(message));
      } catch (error) {
        // Client disconnected, remove it
        removeSSEClient(controller);
      }
    });
  }