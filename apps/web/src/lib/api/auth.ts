// lib/auth.ts
// Authentication utilities for the barcode scanning API

import { createLogger } from '@/lib/api/utils/logger';
import { ScannerConfig } from '@rathburn/types';
import { extractApiKey } from '@/lib/api/validation';

const logger = createLogger('auth');

// In a real application, these would be stored in a database or environment variables
// For now, we'll keep them in memory as a simple example
const SCANNER_CONFIGS: ScannerConfig[] = [
  {
    scanner_id: 'HONEYWELL-CT47-001',
    allowed_locations: ['Warehouse-A', 'Shipping-Area'],
    allowed_scan_types: ['inventory_check', 'shipment'],
    api_key: 'api_key_for_scanner_001', // In production, use strong, unique keys
  },
  {
    scanner_id: 'HONEYWELL-CK67-001',
    allowed_locations: ['Warehouse-B', 'Receiving-Area'],
    allowed_scan_types: ['inventory_check', 'receiving'],
    api_key: 'api_key_for_scanner_002',
  },
];

/**
 * Validate API key and return the associated scanner configuration if valid
 * @param apiKey - The API key to validate
 * @returns Scanner configuration or null if invalid
 */
export function validateApiKey(apiKey: string): ScannerConfig | null {
  const config = SCANNER_CONFIGS.find(config => config.api_key === apiKey);
  
  if (!config) {
    logger.warn('Invalid API key attempt', { apiKey: '***' });
    return null;
  }
  
  logger.debug('API key validated', { scannerId: config.scanner_id });
  return config;
}

/**
 * Validate auth header and extract scanner configuration
 * @param authHeader - The authorization header
 * @returns Scanner configuration or null if invalid
 */
export function validateAuth(authHeader: string): ScannerConfig | null {
  try {
    const apiKey = extractApiKey(authHeader);
    return validateApiKey(apiKey);
  } catch (error) {
    logger.error('Auth validation error', error as Error);
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
export function validateScannerPermissions(
  config: ScannerConfig,
  location?: string,
  scanType?: string
): boolean {
  // If location is provided, check if it's allowed
  if (location && !config.allowed_locations.includes(location)) {
    logger.warn('Scanner location not allowed', {
      scannerId: config.scanner_id,
      location,
      allowedLocations: config.allowed_locations,
    });
    return false;
  }

  // If scan type is provided, check if it's allowed
  if (scanType && !config.allowed_scan_types.includes(scanType)) {
    logger.warn('Scanner scan type not allowed', {
      scannerId: config.scanner_id,
      scanType,
      allowedScanTypes: config.allowed_scan_types,
    });
    return false;
  }

  return true;
}