# Barcode Scanning Integration Guide

This document explains how the barcode scanning mobile app integrates with the main web application, including API architecture, deployment strategy, and data flow.

## Architecture Overview

### Application Components

1. **NextJS Web App** (`apps/web`)
   - Main application running on `rathburn.app`
   - Contains existing API routes at `/api/barcodes/{devices,scan}`
   - Uses server-sent events to update UI when new scan data appears

2. **Vite Mobile App** (`apps/mobile`)
   - Progressive Web App (PWA) optimized for barcode scanning
   - Captures barcode data from keyboard wedge scanners
   - Needs to send scan data to the database

3. **Supabase Database**
   - Central data store accessible by both applications
   - Contains `log_drum_scan` table for all barcode scans

## Deployment Strategy

### Subdomain Approach

For a clear separation of concerns, deploy the mobile app on a subdomain:

```
Web app: https://rathburn.app
Mobile app: https://scan.rathburn.app
```

This can be achieved by:

1. Setting up a subdomain record in your DNS configuration
2. Configuring your EC2 instance with Nginx/Apache virtual hosts to route traffic

Example Nginx configuration:
```nginx
server {
    server_name rathburn.app;
    
    location / {
        proxy_pass http://localhost:3000;  # NextJS app port
        # Other proxy settings...
    }
}

server {
    server_name scan.rathburn.app;
    
    location / {
        root /path/to/mobile/app/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## API Integration Options

### Option 1: Use NextJS API Routes (Recommended)

In this approach, the mobile app calls the existing NextJS API routes:

**Advantages:**
- Centralizes business logic in one place
- Reuses existing authentication and validation
- Maintains a single source of truth for API endpoints

**Implementation:**

1. Add cross-origin resource sharing (CORS) to the NextJS API routes:

```javascript
// In apps/web/api/barcodes/scan.js
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://scan.rathburn.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Existing API logic...
}
```

2. In the mobile app, modify the barcode scanning hook to send data to the API:

```typescript
// In apps/mobile/src/hooks/use-barcode-scanner.ts
export function useBarcodeScannerHistory(): UseBarcodeScanner {
  // Existing code...

  const addScan = useCallback(async (barcode: string) => {
    if (!barcode || barcode.trim() === '') return;
    
    // Add to local history
    setScans(prevScans => {
      // Avoid duplicate consecutive scans
      if (prevScans.length > 0 && prevScans[0] === barcode) {
        return prevScans;
      }
      
      // Add new scan to the beginning and limit number of stored scans
      const newScans = [barcode, ...prevScans.slice(0, MAX_SCANS - 1)];
      return newScans;
    });
    
    // Send to API
    try {
      const response = await fetch('https://rathburn.app/api/barcodes/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode,
          deviceId: 'mobile-app',  // Or retrieve from device/user settings
          timestamp: new Date().toISOString(),
        }),
        credentials: 'include',  // Include cookies for authentication if needed
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Handle response if needed
      const data = await response.json();
      console.log('Scan saved:', data);
    } catch (error) {
      console.error('Error saving scan:', error);
      // Implement retry logic or offline queue here
    }
  }, []);

  // Rest of the hook...
}
```

### Option 2: Direct Supabase Integration

If you prefer the mobile app to communicate directly with Supabase:

```typescript
// In apps/mobile/src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveBarcodeScan(barcode: string, deviceId: string) {
  const { data, error } = await supabase
    .from('log_drum_scan')
    .insert([
      {
        barcode,
        device_id: deviceId,
        scanned_at: new Date().toISOString(),
        // Add other required fields based on your schema
      }
    ]);
    
  if (error) throw error;
  return data;
}
```

## Authentication Strategy

For secure communication between apps:

1. **JWT-based authentication:**
   - Share authentication between apps using JWT tokens
   - Store tokens in localStorage or secure cookies
   - Add authorization headers to API requests

2. **API Key for mobile app:**
   - For simpler setup, create a specific API key for the mobile app
   - Add this key to all requests from the mobile app to the web API

```typescript
// Example of API key usage in mobile app
fetch('https://rathburn.app/api/barcodes/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY,
  },
  body: JSON.stringify({ /* scan data */ }),
});
```

## Server-Sent Events Integration

The web app already has server-sent events set up to detect new records in `log_drum_scan`. This will automatically work when new data is added to the table, regardless of whether it comes from:

1. Direct Supabase insertion from the mobile app
2. Insertion through the NextJS API routes

To ensure optimal real-time updates, consider adding a unique source identifier:

```typescript
// When sending scan data, include a source field
const scanData = {
  barcode: '123456789',
  device_id: 'mobile-scanner-1',
  source: 'mobile_app',  // Helps identify the source of the scan
  // Other data...
};
```

## Recommended Workflow

Based on the considerations above, here's the recommended workflow:

1. **Mobile App Scans Barcode:**
   - User scans barcode with keyboard wedge scanner
   - Mobile app captures scan via hidden input
   - App displays scan in local history

2. **Data Transmission:**
   - Mobile app sends scan data to NextJS API (`/api/barcodes/scan`)
   - API validates and processes the barcode
   - API inserts record into `log_drum_scan` table in Supabase

3. **Real-time Updates:**
   - Server-sent events in web app detect new database record
   - Web app UI updates to show the new scan
   - Any business logic triggered by the scan (e.g., inventory updates) executes

4. **Offline Handling:**
   - Mobile app stores scans locally when offline
   - When connection restores, queued scans are sent to API
   - API handles potential duplicates

## Conclusion

Using the existing NextJS API routes from the mobile app provides the most cohesive solution, leveraging your existing backend code while allowing the mobile app to focus on its core responsibility: capturing barcode scans effectively.

This approach ensures:
- Centralized business logic
- Consistent data processing
- Simplified maintenance (one API to update)
- Clear separation of concerns between scanning (mobile) and data processing (web)

The Server-Sent Events setup will seamlessly integrate with this workflow, providing real-time updates to the web UI regardless of how the data enters the system.