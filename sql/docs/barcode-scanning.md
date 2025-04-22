# Barcode Scanning System Implementation Plan

## Overview

This implementation plan outlines the development of a comprehensive barcode scanning system for your industrial chemical processing facility. The system will track drums through their lifecycle using barcode scans, maintain an audit trail, and provide real-time updates to users.

## 1. Database Structure

### Enhanced `log_drum_scan` Table

```sql
CREATE TABLE logs.drum_scan (
  scan_id SERIAL NOT NULL,
  scanned_at TIMESTAMPTZ NULL DEFAULT now(),
  drum_id INTEGER NULL,
  user_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,  -- Track which scanner was used
  location_id INTEGER NULL, -- Where the scan occurred
  scan_type TEXT NOT NULL,
  scan_status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT NULL,
  correction_of_scan_id INTEGER NULL, -- For audit trail
  barcode_data TEXT NOT NULL, -- Raw barcode data
  processing_time_ms INTEGER NULL, -- Performance tracking
  metadata JSONB NULL, -- For additional context

  CONSTRAINT drum_scan_pkey PRIMARY KEY (scan_id),
  CONSTRAINT drum_scan_drum_id_fkey FOREIGN KEY (drum_id)
    REFERENCES inventory.drum (drum_id) ON UPDATE CASCADE,
  CONSTRAINT drum_scan_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth_ext.users (user_id),
  CONSTRAINT drum_scan_location_id_fkey FOREIGN KEY (location_id)
    REFERENCES config.locations (location_id),
  CONSTRAINT drum_scan_correction_fkey FOREIGN KEY (correction_of_scan_id)
    REFERENCES logs.drum_scan (scan_id),
  CONSTRAINT drum_scan_scan_status_check CHECK (
    scan_status IN ('success', 'failed', 'corrected')
  ),
  CONSTRAINT drum_scan_scan_type_check CHECK (
    scan_type IN (
      'intake',
      'transport',
      'distillation_loading',
      'distillation_start',
      'error',
      'correction',
      'inspection',
      'disposal'
    )
  )
);

-- Indexes for performance
CREATE INDEX idx_drum_scan_drum_id ON logs.drum_scan(drum_id);
CREATE INDEX idx_drum_scan_user_id ON logs.drum_scan(user_id);
CREATE INDEX idx_drum_scan_scanned_at ON logs.drum_scan(scanned_at);
CREATE INDEX idx_drum_scan_scan_type ON logs.drum_scan(scan_type);
CREATE INDEX idx_drum_scan_location_id ON logs.drum_scan(location_id);
```

### Drum State Table (Current Status)

```sql
CREATE TABLE inventory.drum_state (
  drum_id INTEGER PRIMARY KEY REFERENCES inventory.drum(drum_id),
  current_status TEXT NOT NULL,
  current_location_id INTEGER REFERENCES config.locations(id),
  last_scan_id INTEGER REFERENCES logs.drum_scan(scan_id),
  last_scan_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_updated_by INTEGER REFERENCES auth_ext.users(id),
  metadata JSONB,

  CONSTRAINT current_status_check CHECK (
    current_status IN (
      'en_route',
      'received',
      'in_stock',
      'staged',
      'in_process',
      'processed',
      'rejected',
      'disposed'
    )
  )
);
```

### Trigger Function

```sql
-- Trigger to update drum_state after a successful scan
CREATE OR REPLACE FUNCTION inventory.update_drum_state_on_scan()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process successful scans
  IF NEW.scan_status = 'success' THEN
    -- Determine the new status based on scan_type
    DECLARE
      new_status TEXT;
    BEGIN
      CASE NEW.scan_type
        WHEN 'intake' THEN new_status := 'received';
        WHEN 'transport' THEN new_status := 'in_stock';
        WHEN 'distillation_loading' THEN new_status := 'staged';
        WHEN 'distillation_start' THEN new_status := 'in_process';
        ELSE new_status := NULL;  -- No status change for other scan types
      END CASE;

      -- Update drum state if we have a new status
      IF new_status IS NOT NULL THEN
        INSERT INTO inventory.drum_state (
          drum_id,
          current_status,
          current_location_id,
          last_scan_id,
          last_scan_at,
          last_updated_at,
          last_updated_by
        ) VALUES (
          NEW.drum_id,
          new_status,
          NEW.location_id,
          NEW.scan_id,
          NEW.scanned_at,
          NEW.scanned_at,
          NEW.user_id
        )
        ON CONFLICT (drum_id) DO UPDATE SET
          current_status = EXCLUDED.current_status,
          current_location_id = EXCLUDED.current_location_id,
          last_scan_id = EXCLUDED.last_scan_id,
          last_scan_at = EXCLUDED.last_scan_at,
          last_updated_at = EXCLUDED.last_updated_at,
          last_updated_by = EXCLUDED.last_updated_by;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to log_drum_scan
CREATE TRIGGER update_drum_state_after_scan
AFTER INSERT ON logs.drum_scan
FOR EACH ROW
EXECUTE FUNCTION inventory.update_drum_state_on_scan();
```

## 2. API Routes

### Barcode Scan API

Create a route to handle incoming barcode scans from scanners:

```typescript
// /app/api/barcodes/scan/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ScanEvent } from "@/types/events";
import { publishScanEvent } from "@/lib/events/publishers";

export async function POST(request: Request) {
  try {
    // Get supabase client
    const supabase = createClient();

    // Parse request body
    const body = await request.json();
    const {
      barcode_data,
      scan_type,
      user_id,
      device_id,
      location_id = null,
    } = body;

    // Validate required fields
    if (!barcode_data || !scan_type || !user_id || !device_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Extract drum_id from barcode (implement parsing logic)
    const drum_id = parseBarcodeForDrumId(barcode_data);

    // Validate drum exists in database
    if (drum_id) {
      const { data: drum, error: drumError } = await supabase
        .from("stock_drum")
        .select("drum_id")
        .eq("drum_id", drum_id)
        .single();

      if (drumError || !drum) {
        // Log invalid drum scan
        const { data: scan, error: scanError } = await supabase
          .from("log_drum_scan")
          .insert({
            drum_id: null,
            barcode_data,
            user_id,
            device_id,
            location_id,
            scan_type,
            scan_status: "failed",
            error_message: "Drum not found in database",
          })
          .select()
          .single();

        // Publish failure event
        if (scan) {
          const event: ScanEvent = {
            type: "SCAN_FAILED",
            scanId: scan.scan_id,
            message: "Drum not found in database",
            timestamp: new Date().toISOString(),
            data: { barcode_data },
          };

          await publishScanEvent(event);
        }

        return NextResponse.json(
          { error: "Invalid drum barcode", scan_id: scan?.scan_id },
          { status: 400 }
        );
      }
    } else {
      // Log barcode parsing failure
      const { data: scan, error: scanError } = await supabase
        .from("log_drum_scan")
        .insert({
          drum_id: null,
          barcode_data,
          user_id,
          device_id,
          location_id,
          scan_type,
          scan_status: "failed",
          error_message: "Unable to parse drum ID from barcode",
        })
        .select()
        .single();

      // Publish failure event
      // Event publication code...

      return NextResponse.json(
        {
          error: "Unable to parse drum ID from barcode",
          scan_id: scan?.scan_id,
        },
        { status: 400 }
      );
    }

    // Process valid scan
    const startTime = Date.now();

    // Insert scan record
    const { data: scan, error: scanError } = await supabase
      .from("log_drum_scan")
      .insert({
        drum_id,
        barcode_data,
        user_id,
        device_id,
        location_id,
        scan_type,
        scan_status: "success",
        processing_time_ms: Date.now() - startTime,
      })
      .select()
      .single();

    // Rest of processing logic...

    // Return success response
    return NextResponse.json({
      success: true,
      scan_id: scan.scan_id,
      drum: drumDetails,
      status: updatedStatus?.current_status,
    });
  } catch (error) {
    console.error("Unhandled error in barcode scan API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to parse drum ID from barcode
function parseBarcodeForDrumId(barcode: string): number | null {
  // Implement your barcode parsing logic here
  const match = barcode.match(/DRUM-(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}
```

### Server-Sent Events (SSE) Implementation

```typescript
// /app/api/activity/scans/sse/route.ts
import { NextRequest } from "next/server";
import { ScanEvent, EventSubscriber } from "@/types/events";

// In-memory store for active event subscribers
const subscribers = new Map<string, EventSubscriber>();

// Function to publish a scan event to all subscribers
export async function publishScanEvent(event: ScanEvent) {
  const eventData = `data: ${JSON.stringify(event)}\n\n`;

  // Send to all subscribers
  subscribers.forEach((subscriber) => {
    try {
      subscriber.controller.enqueue(eventData);
    } catch (error) {
      console.error("Error sending event to subscriber:", error);
    }
  });
}

export async function GET(request: NextRequest) {
  const subscriberId = crypto.randomUUID();

  // Create a new TransformStream for this subscriber
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Store the subscriber
  subscribers.set(subscriberId, {
    id: subscriberId,
    controller: stream.readable.getController(),
    createdAt: new Date(),
  });

  // Clean up on disconnect
  request.signal.addEventListener("abort", () => {
    subscribers.delete(subscriberId);
    writer.close();
  });

  // Send headers for SSE
  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// Clean up old subscribers periodically
setInterval(
  () => {
    const now = new Date();
    subscribers.forEach((subscriber, id) => {
      const ageInMinutes =
        (now.getTime() - subscriber.createdAt.getTime()) / (1000 * 60);
      if (ageInMinutes > 60) {
        // Remove subscribers older than 1 hour
        subscribers.delete(id);
      }
    });
  },
  5 * 60 * 1000
); // Run every 5 minutes
```

## 3. TypeScript Type Definitions

```typescript
// /types/events.ts
export interface ScanEvent {
  type: "SCAN_SUCCESS" | "SCAN_FAILED" | "SCAN_CORRECTED";
  scanId: number;
  message: string;
  timestamp: string;
  data: any;
}

export interface EventSubscriber {
  id: string;
  controller: ReadableStreamDefaultController;
  createdAt: Date;
}

// /types/database.ts
export interface DrumScan {
  scan_id: number;
  scanned_at: string;
  drum_id: number | null;
  user_id: number;
  device_id: string;
  location_id: number | null;
  scan_type: string;
  scan_status: "success" | "failed" | "corrected";
  error_message: string | null;
  correction_of_scan_id: number | null;
  barcode_data: string;
  processing_time_ms: number | null;
  metadata: Record<string, any> | null;
}

export interface DrumState {
  drum_id: number;
  current_status: string;
  current_location_id: number | null;
  last_scan_id: number | null;
  last_scan_at: string | null;
  last_updated_at: string;
  last_updated_by: number | null;
  metadata: Record<string, any> | null;
}
```

## 4. React Hook for SSE Consumption

```typescript
// /hooks/useScanEvents.ts
import { useState, useEffect } from "react";
import { ScanEvent } from "@/types/events";

interface UseScanEventsOptions {
  onEvent?: (event: ScanEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useScanEvents(options: UseScanEventsOptions = {}) {
  const {
    onEvent,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let eventSource: EventSource;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      // Close existing connection if any
      if (eventSource) {
        eventSource.close();
      }

      // Create new connection
      eventSource = new EventSource("/api/activity/scans/sse");

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);

        if (onConnect) {
          onConnect();
        }
      };

      eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as ScanEvent;

          // Add to events list
          setEvents((prev) => [event, ...prev].slice(0, 100)); // Keep last 100 events

          // Call event callback if provided
          if (onEvent) {
            onEvent(event);
          }
        } catch (err) {
          console.error("Error parsing event data:", err);
        }
      };

      eventSource.onerror = (err) => {
        setIsConnected(false);
        setError(
          err instanceof Error ? err : new Error("SSE connection error")
        );

        // Close the connection
        eventSource.close();

        if (onDisconnect) {
          onDisconnect();
        }

        // Attempt to reconnect if enabled
        if (autoReconnect) {
          reconnectTimer = setTimeout(connect, reconnectInterval);
        }
      };
    };

    // Initial connection
    connect();

    // Cleanup
    return () => {
      if (eventSource) {
        eventSource.close();
      }

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [onEvent, onConnect, onDisconnect, autoReconnect, reconnectInterval]);

  return {
    events,
    isConnected,
    error,
  };
}
```

## 5. UI Component for Real-time Scan Monitoring

```tsx
// /components/ScanActivityPanel.tsx
import { useState, useEffect } from "react";
import { useScanEvents } from "@/hooks/useScanEvents";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Activity, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export function ScanActivityPanel() {
  const { events, isConnected, error } = useScanEvents({
    onEvent: (event) => {
      // Play sound for scan events if desired
      if (event.type === "SCAN_SUCCESS") {
        playSuccessSound();
      } else if (event.type === "SCAN_FAILED") {
        playErrorSound();
      }
    },
  });

  // State for recent scan statistics
  const [stats, setStats] = useState({
    totalScans: 0,
    successCount: 0,
    failureCount: 0,
    lastScanTime: null as Date | null,
  });

  // Update stats when events change
  useEffect(() => {
    if (events.length > 0) {
      const successes = events.filter((e) => e.type === "SCAN_SUCCESS").length;
      const failures = events.filter((e) => e.type === "SCAN_FAILED").length;

      setStats({
        totalScans: events.length,
        successCount: successes,
        failureCount: failures,
        lastScanTime: new Date(events[0].timestamp),
      });
    }
  }, [events]);

  // Function to play success sound
  const playSuccessSound = () => {
    // Implement sound playing logic here
  };

  // Function to play error sound
  const playErrorSound = () => {
    // Implement sound playing logic here
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Real-time Scan Activity</CardTitle>
          <ConnectionStatus isConnected={isConnected} />
        </div>
        <CardDescription>
          Monitor barcode scanning activities across the facility
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Scans"
            value={stats.totalScans}
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Successful"
            value={stats.successCount}
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          />
          <StatCard
            title="Failed"
            value={stats.failureCount}
            icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          />
        </div>

        {/* Recent Scans List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Recent Scans</h3>

          {events.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No scan activity yet. Scans will appear here in real-time.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto pr-2">
              {events.slice(0, 10).map((event) => (
                <ScanEventCard key={event.scanId} event={event} />
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          {stats.lastScanTime ? (
            <>Last scan {formatDistanceToNow(stats.lastScanTime)} ago</>
          ) : (
            <>No recent scans</>
          )}
        </div>

        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper components here...
```

## 6. Implementation Plan and Timeline

### Phase 1: Database Schema (1-2 days)

- [ ] Create the enhanced `log_drum_scan` table structure
- [ ] Add the `drum_state` table for tracking current status
- [ ] Implement and test database triggers
- [ ] Set up necessary indexes

### Phase 2: API Routes (2-3 days)

- [ ] Develop the barcode scan API endpoint
- [ ] Implement the SSE infrastructure for real-time updates
- [ ] Create the scan event publisher
- [ ] Add barcode parsing and validation

### Phase 3: Front-end Components (2-3 days)

- [ ] Implement the `useScanEvents` React hook
- [ ] Create the `ScanActivityPanel` UI component
- [ ] Add visual feedback for scan events
- [ ] Implement real-time updates

### Phase 4: Integration and Testing (1-2 days)

- [ ] Connect the CT47 scanner to the API
- [ ] Test the complete flow from scanning to UI updates
- [ ] Verify database triggers update the state correctly
- [ ] Ensure real-time events are delivered promptly

### Phase 5: Refinement and Deployment (1-2 days)

- [ ] Address any issues found during testing
- [ ] Optimize performance
- [ ] Document the system
- [ ] Deploy to production

## 7. Schema Migration Plan

As part of your schema reorganization strategy, the `log_drum_scan` table should be moved to the `logs` schema and the `drum_state` table to the `inventory` schema. Here's a migration strategy:

1. Create the new schemas
2. Create the tables in their new schemas with all enhancements
3. Write migration scripts to copy data from old to new tables
4. Set up backward compatibility views if needed
5. Update application code to reference new schema locations
6. Eventually remove old tables once all code is updated

## 8. Success Criteria

- All barcode scans are recorded accurately in the database
- Real-time updates appear in the UI within 1 second of scanning
- Drum status changes are correctly applied based on scan type
- Error handling gracefully manages invalid barcodes
- The system can handle high-volume scanning during busy periods
- Audit trail fully preserved for all drum movements
