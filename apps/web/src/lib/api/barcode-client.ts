// lib/api/barcode-client.ts
// Client-side API utility for interacting with the barcode scanning API
// NOT IN USE

import { ApiResponse } from '@rathburn/types';

/**
 * API client configuration
 */
interface BarcodeClientConfig {
  baseUrl?: string;
  apiKey: string;
}

/**
 * Client for the barcode scanning API
 */
export class BarcodeClient {
  private config: BarcodeClientConfig;
  
  /**
   * Create a new barcode API client
   * @param config - Client configuration
   */
  constructor(config: BarcodeClientConfig) {
    this.config = {
      baseUrl: config.baseUrl || '/api',
      apiKey: config.apiKey,
    };
  }
  
  /**
   * Process a single barcode scan
   * @param scanData - The scan data to process
   * @returns API response
   */
  async processScan(scanData: any): Promise<ApiResponse> {
    const response = await fetch(`${this.config.baseUrl}/barcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(scanData),
    });
    
    return await response.json();
  }
  
  /**
   * Process multiple barcode scans in batch
   * @param scans - Array of scan data to process
   * @returns API response
   */
  async processBatchScans(scans: any[]): Promise<ApiResponse<{
    processed: any[];
    failed: { data: any; error: string }[];
    totalProcessed: number;
    totalFailed: number;
    totalSubmitted: number;
  }>> {
    const response = await fetch(`${this.config.baseUrl}/barcode/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ scans }),
    });
    
    return await response.json();
  }
  
  /**
   * Look up a scan by its scan_id
   * @param scanId - The scan_id to look up
   * @returns API response
   */
  async lookupScan(scanId: string): Promise<ApiResponse> {
    const response = await fetch(
      `${this.config.baseUrl}/barcode/lookup?scan_id=${encodeURIComponent(scanId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );
    
    return await response.json();
  }
  
  /**
   * Check API health
   * @returns Health check response
   */
  async checkHealth(): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/health`, {
      method: 'GET',
    });
    
    return await response.json();
  }
  
  /**
   * Get system metrics
   * @returns Metrics response
   */
  async getMetrics(): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/metrics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });
    
    return await response.json();
  }
}

/**
 * Create a barcode API client with the given configuration
 * @param config - Client configuration
 * @returns Barcode API client
 */
export function createBarcodeClient(config: BarcodeClientConfig): BarcodeClient {
  return new BarcodeClient(config);
}

/**
 * Create a web scanner client with default configuration
 * @returns Barcode API client for web testing
 */
export function createWebScannerClient(): BarcodeClient {
  return new BarcodeClient({
    apiKey: process.env.NEXT_PUBLIC_WEB_SCANNER_API_KEY || 'web_scanner_key_001',
  });
}