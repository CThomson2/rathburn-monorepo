// lib/auth.ts
// Authentication utilities for the barcode scanning API
import { createLogger } from '@/lib/api/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createServerClient } from "@supabase/ssr";
import { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('auth');

// In a real application, these would be stored in a database or environment variables
// For now, we'll keep them in memory as a simple example
const SCANNER_CONFIGS = [
  {
    device_id: '4f096e70-33fd-4913-9df1-8e1fae9591bc',
    model: 'CT47',
    // api_key: 'api_key_for_scanner_001', // In production, use strong, unique keys
  },
  {
    device_id: '8a1af7de-04a7-406a-94f4-64e674ba9fe5',
    model: "CK67"
    // api_key: 'api_key_for_scanner_002',
  },
];

/**
 * Validate API key and return the associated scanner configuration if valid
 * @param apiKey - The API key to validate
 * @returns Scanner configuration or null if invalid
 */
// export function validateApiKey(apiKey: string): ScannerConfig | null {}

/**
 * Validate auth header and extract user information
 * @param authHeader - The authorization header
 * @returns User object and token if valid, or null if invalid
 */
export async function validateAuth(authHeader: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.error('Invalid or missing auth header format');
    return { user: null, token: null };
  }
  
  const token = authHeader.substring(7);
  const supabase = createClient();
  const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
  
  if (tokenError) {
    logger.error('Auth validation error', tokenError);
    return { user: null, token: null };
  }
  
  return { user: tokenUser, token };
}

/**
 * Create an authenticated Supabase client using a bearer token
 * @param token - The JWT token (without 'Bearer ' prefix)
 * @returns Authenticated Supabase client or null if invalid
 */
export function createAuthenticatedClient(token: string): SupabaseClient | null {
  if (!token) {
    logger.error('Missing token for client creation');
    return null;
  }
  
  const cookieStore = cookies();
  
  // Create a server client with the token
  try {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll(cookiesToSet) {
            // Ignore setting cookies in this context
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
  } catch (error) {
    logger.error('Failed to create authenticated client', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Check if a scanner is allowed to use a specific location and scan type
 * @param config - The scanner configuration
 * @param location - The scan location to check
 * @param scanType - The scan type to check
 * @returns True if allowed, false otherwise
 */
// export function validateScannerPermissions
// ( config: ScannerConfig,
//   location?: string,
//   scanType?: string
// ): boolean {
//   // If location is provided, check if it's allowed
//   if (location && !config.allowed_locations.includes(location)) {
//     logger.warn('Scanner location not allowed', {
//       scannerId: config.scanner_id,
//       location,
//       allowedLocations: config.allowed_locations,
//     });
//     return false;
//   }

//   // If scan type is provided, check if it's allowed
//   if (scanType && !config.allowed_scan_types.includes(scanType)) {
//     logger.warn('Scanner scan type not allowed', {
//       scannerId: config.scanner_id,
//       scanType,
//       allowedScanTypes: config.allowed_scan_types,
//     });
//     return false;
//   }

//   return true;
// }