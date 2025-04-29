// app/api/scanner/lookup/route.ts
// API route for looking up barcode scan details by scan_id

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { ApiResponse, ScanError } from '@rathburn/types';
import { validateAuth } from '@/lib/api/auth';
import { scanService } from '@/lib/api/scan-service';
import { createLogger } from '@/lib/api/utils/logger';
import { healthMonitor } from '@/lib/api/utils/health-monitor';

const logger = createLogger('api/scanner/lookup');

// Schema for validating query parameters
const queryParamsSchema = z.object({
  scan_id: z.string().min(1, 'scan_id is required'),
});

/**
 * Handle GET requests to look up a barcode scan by ID
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  logger.info('Received barcode lookup request');
  const startTime = Date.now();

  try {
    // 1. Authenticate the request
    const authHeader = request.headers.get('authorization') || '';
    const scannerConfig = validateAuth(authHeader);
    
    if (!scannerConfig) {
      logger.warn('Authentication failed for lookup request');
      healthMonitor.recordFailedScan(Date.now() - startTime);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Authentication failed',
        error: ScanError.AUTHORIZATION_ERROR,
      }, { status: 401 });
    }

    // 2. Extract and validate query parameters
    const url = new URL(request.url);
    const scanId = url.searchParams.get('scan_id');
    
    try {
      queryParamsSchema.parse({ scan_id: scanId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error in lookup request', { errors: error.errors });
        healthMonitor.recordFailedScan(Date.now() - startTime);
        
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Invalid query parameters',
          error: ScanError.VALIDATION_ERROR,
          data: error.errors,
        }, { status: 400 });
      }
      throw error;
    }

    // 3. Look up the scan
    const scan = await scanService.getScan(scanId!);
    
    if (!scan) {
      logger.info('Scan not found', { scanId });
      healthMonitor.recordFailedScan(Date.now() - startTime);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `No scan found with ID: ${scanId}`,
      }, { status: 404 });
    }

    // 4. Record success and return the scan data
    healthMonitor.recordSuccessfulScan(Date.now() - startTime);
    
    logger.info('Scan found', { 
      scanId,
      responseTime: Date.now() - startTime
    });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Scan found',
      data: scan,
    });

  } catch (error) {
    // Record failure
    healthMonitor.recordFailedScan(Date.now() - startTime);
    
    logger.error('Error processing scan lookup', error as Error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'An error occurred while looking up the scan',
      error: ScanError.SERVER_ERROR,
    }, { status: 500 });
  }
}