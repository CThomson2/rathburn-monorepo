# Supabase Integration for Barcode Scanner

This document provides implementation details for integrating the barcode scanner mobile app with Supabase.

## Setup Instructions

### 1. Create Supabase Client

Create a Supabase client file in the mobile app:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 2. Create Environment Variables

Add Supabase environment variables to your `.env` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For production, create a `.env.production` file with the same variables.

## API Functions

### Barcode Scanning Functions

```typescript
// src/lib/api.ts
import { supabase } from './supabase';

// Save a barcode scan to the database
export async function saveScan(scanData: {
  barcode: string;
  deviceId?: string;
  userId?: string;
  location?: string;
}) {
  const { barcode, deviceId = 'mobile-app', userId, location } = scanData;
  
  try {
    const { data, error } = await supabase
      .from('log_drum_scan')
      .insert([
        {
          barcode,
          device_id: deviceId,
          user_id: userId,
          location,
          scanned_at: new Date().toISOString(),
        }
      ]);
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving scan:', error);
    return { success: false, error };
  }
}

// Get recent scans
export async function getRecentScans(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('log_drum_scan')
      .select('*')
      .order('scanned_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching scans:', error);
    return { success: false, error };
  }
}
```

## Integration with Barcode Scanner

Modify the barcode scanner hook to use the API functions:

```typescript
// src/hooks/use-barcode-scanner.ts
import { useState, useEffect, useCallback } from 'react';
import { saveScan } from '../lib/api';

// ... existing hook code

const addScan = useCallback(async (barcode: string) => {
  if (!barcode || barcode.trim() === '') return;
  
  // Add to local history first (for immediate feedback)
  setScans(prevScans => {
    // Avoid duplicate consecutive scans
    if (prevScans.length > 0 && prevScans[0] === barcode) {
      return prevScans;
    }
    
    // Add new scan to the beginning
    const newScans = [barcode, ...prevScans.slice(0, MAX_SCANS - 1)];
    return newScans;
  });
  
  // Then save to Supabase
  const result = await saveScan({ 
    barcode,
    // You can add additional context data here
    deviceId: localStorage.getItem('deviceId') || 'mobile-app',
    location: localStorage.getItem('location') || undefined,
  });
  
  if (!result.success) {
    // Handle error - could add to a retry queue
    console.error('Failed to save scan to database');
  }
}, []);

// ... rest of hook
```

## Offline Support

For offline capabilities, implement a queue system:

```typescript
// src/hooks/use-offline-queue.ts
import { useEffect, useState } from 'react';
import { saveScan } from '../lib/api';

const QUEUE_STORAGE_KEY = 'offline-scan-queue';

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<any[]>([]);
  
  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (savedQueue) {
        setQueue(JSON.parse(savedQueue));
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
    
    // Set up online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);
  
  // Process queue when online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, queue]);
  
  // Add item to queue
  const addToQueue = (item: any) => {
    setQueue(prev => [...prev, { ...item, queuedAt: new Date().toISOString() }]);
  };
  
  // Process queue items
  const processQueue = async () => {
    if (queue.length === 0) return;
    
    const currentQueue = [...queue];
    setQueue([]); // Clear queue optimistically
    
    const failedItems = [];
    
    for (const item of currentQueue) {
      try {
        const result = await saveScan(item);
        if (!result.success) {
          failedItems.push(item);
        }
      } catch (error) {
        failedItems.push(item);
      }
    }
    
    // Add back any failed items
    if (failedItems.length > 0) {
      setQueue(prev => [...prev, ...failedItems]);
    }
  };
  
  return {
    isOnline,
    queueLength: queue.length,
    addToQueue,
    processQueue
  };
}
```

## Usage in Components

Integrate with your barcode scanner component:

```typescript
// In your scanning component
import { useBarcodeScannerHistory } from '../hooks/use-barcode-scanner';
import { useOfflineQueue } from '../hooks/use-offline-queue';
import { saveScan } from '../lib/api';

function ScannerComponent() {
  const { scans, addScan } = useBarcodeScannerHistory();
  const { isOnline, addToQueue } = useOfflineQueue();
  
  const handleScan = async (barcode: string) => {
    // Always add to local history
    addScan(barcode);
    
    // If online, try to save directly
    if (isOnline) {
      try {
        await saveScan({ barcode });
      } catch (error) {
        // If saving fails, add to offline queue
        addToQueue({ barcode });
      }
    } else {
      // If offline, add to queue for later
      addToQueue({ barcode });
    }
  };
  
  // Rest of component
}
```

## Authentication (Optional)

If you need user authentication:

```typescript
// src/lib/auth.ts
import { supabase } from './supabase';

// Simple passcode authentication
export async function authenticateWithPasscode(passcode: string) {
  // This assumes you have a 'device_auth' table with passcode and device_id columns
  const { data, error } = await supabase
    .from('device_auth')
    .select('device_id, name')
    .eq('passcode', passcode)
    .single();
    
  if (error || !data) {
    return { success: false, error: error || new Error('Invalid passcode') };
  }
  
  // Store device info in localStorage
  localStorage.setItem('deviceId', data.device_id);
  localStorage.setItem('deviceName', data.name);
  
  return { 
    success: true, 
    data: { 
      deviceId: data.device_id,
      name: data.name 
    } 
  };
}
```