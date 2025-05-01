// lib/events/sse.ts
import { type ReadableStreamDefaultController } from 'stream/web';

// Define the structure for the scan event payload
export interface StocktakeScanEvent {
  type: 'STOCKTAKE_SCAN'; // Event type discriminator
  payload: {
    scanId: string; // Assuming logs.stocktake_scans.id is UUID -> string
    sessionId: string;
    rawBarcode: string;
    barcodeType: 'material' | 'supplier' | 'unknown' | 'error';
    materialId?: string;
    supplierId?: string;
    status: 'success' | 'error' | 'ignored';
    errorMessage?: string;
    scannedAt: string; // ISO string format
    userId: string;
    deviceId?: string;
  };
}

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
  let clients: Set<ReadableStreamDefaultController> = new Set();
  
  export function addSSEClient(controller: ReadableStreamDefaultController) {
    console.log('[SSE] Adding client');
    clients.add(controller);
    console.log(`[SSE] Total clients: ${clients.size}`);
  }
  
  export function removeSSEClient(controller: ReadableStreamDefaultController) {
    console.log('[SSE] Removing client');
    clients.delete(controller);
    console.log(`[SSE] Total clients: ${clients.size}`);
  }
  
  export async function broadcastScanEvent(scanEvent: StocktakeScanEvent) {
    // Use 'stocktake_scan' as the event name, matching frontend listener
    const message = `event: stocktake_scan\ndata: ${JSON.stringify(scanEvent)}\n\n`;
    const encodedMessage = new TextEncoder().encode(message);

    console.log(`[SSE] Broadcasting event: ${JSON.stringify(scanEvent)} to ${clients.size} clients`);
    
    // Create a copy of the clients set to iterate over, avoiding issues if the set is modified during iteration
    const clientsCopy = new Set(clients);

    clientsCopy.forEach(controller => {
      try {
        controller.enqueue(encodedMessage);
      } catch (error) {
        // Likely client disconnected or stream closed
        console.warn('[SSE] Error sending event to client, removing client:', error);
        // Remove the controller from the original set
        removeSSEClient(controller);
      }
    });
  }