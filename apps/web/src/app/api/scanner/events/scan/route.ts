// /src/app/api/events/scan/route.ts
import { NextRequest } from 'next/server';
import { createNewClient as createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Map of job IDs to arrays of stream writers
const eventClients = new Map<string, WritableStreamDefaultWriter<Uint8Array>[]>();

// Function to create an SSE response
function createSSEResponse() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  
  // Function to send events to this client
  const sendEvent = async (data: any) => {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };
  
  // Send an initial connection established event
  sendEvent({ type: 'connected', timestamp: new Date().toISOString() });
  
  // Return the response and writer for later use
  return {
    response: new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }),
    writer,
    sendEvent,
  };
}

/**
 * Send an event to all clients listening for a specific job
 * 
 * @param jobId The ID of the job
 * @param data The event data to send
 */
export async function sendScanEvent(jobId: string, data: any) {
  const writers = eventClients.get(jobId) || [];
  
  // Send to all connected clients for this job
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encodedMessage = encoder.encode(message);
  
  const failedWriters: number[] = [];
  
  // Try to write to each client
  await Promise.all(
    writers.map(async (writer, index) => {
      try {
        await writer.write(encodedMessage);
      } catch (error) {
        console.error(`Error sending event to client ${index}:`, error);
        failedWriters.push(index);
      }
    })
  );
  
  // Remove any failed writers
  if (failedWriters.length > 0) {
    const newWriters = writers.filter((_, index) => !failedWriters.includes(index));
    
    if (newWriters.length === 0) {
      eventClients.delete(jobId);
    } else {
      eventClients.set(jobId, newWriters);
    }
  }
}

/**
 * GET handler for SSE connections
 */
export async function GET(request: NextRequest) {
  try {
    // Get the job ID from query parameters
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    // Check if job ID is provided
    if (!jobId) {
      return new Response(JSON.stringify({ error: 'Missing jobId parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Get authorization token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Missing or invalid token' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Create a Supabase client with the token
    const supabase = createClient();
    
    // Verify the token and get user
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Create the SSE response
    const { response, writer } = createSSEResponse();
    
    // Add the writer to the clients map
    const writers = eventClients.get(jobId) || [];
    writers.push(writer);
    eventClients.set(jobId, writers);
    
    // Set up cleanup when the client disconnects
    request.signal.addEventListener('abort', () => {
      const writers = eventClients.get(jobId) || [];
      const index = writers.indexOf(writer);
      
      if (index !== -1) {
        writers.splice(index, 1);
        
        if (writers.length === 0) {
          eventClients.delete(jobId);
        } else {
          eventClients.set(jobId, writers);
        }
      }
      
      writer.close();
    });
    
    return response;
    
  } catch (error) {
    console.error('Error setting up SSE connection:', error);
    
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}