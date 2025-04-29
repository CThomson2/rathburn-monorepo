// app/api/scanner/route.ts
// API route for handling barcode scanner requests

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { BarcodeData, ApiResponse, ScanError } from '@rathburn/types';
import { validateBarcodeData, validateAuthHeaders } from '@/lib/api/validation';
import { validateAuth, validateScannerPermissions } from '@/lib/api/auth';
import { createLogger } from '@/lib/api/utils/logger';
import { scanService } from '@/lib/api/services/scan-service';
import { healthMonitor } from '@/lib/api/utils/health-monitor';
import { notificationService } from '@/lib/api/services/notification-service';

const logger = createLogger('api/scanner');

/**
 * Handle POST requests for barcode scanning
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  logger.info('Received barcode scan request');
  const startTime = Date.now();
  
  try {
    // 1. Authenticate the request
    const authHeader = request.headers.get('authorization') || '';
    const scannerConfig = validateAuth(authHeader);
    
    if (!scannerConfig) {
      logger.warn('Authentication failed');
      healthMonitor.recordFailedScan(Date.now() - startTime);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Authentication failed',
        error: ScanError.AUTHORIZATION_ERROR,
      }, { status: 401 });
    }
    
    // 2. Parse and validate the request body
    const requestData = await request.json();
    let validatedData: BarcodeData;
    
    try {
      validatedData = validateBarcodeData(requestData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error', { errors: error.errors });
        healthMonitor.recordFailedScan(Date.now() - startTime);
        
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Invalid request data',
          error: ScanError.VALIDATION_ERROR,
          data: error.errors,
        }, { status: 400 });
      }
      throw error;
    }
    
    // 3. Validate scanner permissions for location and scan type
    if (!validateScannerPermissions(
      scannerConfig,
      validatedData.scan_location,
      validatedData.scan_type
    )) {
      logger.warn('Scanner permissions error', {
        scannerId: scannerConfig.scanner_id,
        location: validatedData.scan_location,
        scanType: validatedData.scan_type,
      });
      
      healthMonitor.recordFailedScan(Date.now() - startTime);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Scanner not authorized for this location or scan type',
        error: ScanError.AUTHORIZATION_ERROR,
      }, { status: 403 });
    }
    
    // 4. Ensure scanner_id is set if not provided in the request
    const scanData: BarcodeData = {
      ...validatedData,
      scanner_id: validatedData.scanner_id || scannerConfig.scanner_id,
    };
    
    // 5. Process the scan based on scan type
    // Use the scan service for business logic
    const result = await scanService.handleScanByType(scanData);
    
    // 6. Record successful scan and send notification
    healthMonitor.recordSuccessfulScan(Date.now() - startTime);
    
    // Send notification if enabled
    if (process.env.ENABLE_NOTIFICATIONS === 'true') {
      notificationService.notifyScanReceived(result.scan || result);
    }
    
    logger.info('Barcode scan processed successfully', {
      scanId: validatedData.scan_id,
      scannerId: scanData.scanner_id,
      responseTime: Date.now() - startTime,
    });
    
    // 7. Return success response
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Barcode scan processed successfully',
      data: result,
    }, { status: 201 });
    
  } catch (error) {
    // Record failed scan
    healthMonitor.recordFailedScan(Date.now() - startTime);
    
    // Handle specific known errors
    if (error instanceof Error) {
      if (error.message.includes('Duplicate scan_id')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: error.message,
          error: ScanError.DUPLICATE_SCAN,
        }, { status: 409 });
      }
      
      if (error.message.includes('Database error')) {
        logger.error('Database error', error);
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Database error occurred',
          error: ScanError.DATABASE_ERROR,
        }, { status: 500 });
      }
    }
    
    // Generic error handler as fallback
    logger.error('Unhandled error processing barcode scan', error as Error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'An unexpected error occurred',
      error: ScanError.SERVER_ERROR,
    }, { status: 500 });
  }
}

/**
 * Handle GET requests - can be used as a simple health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json<ApiResponse>({
    success: true,
    message: 'Barcode scanning API is operational',
  });
}
      responseTime: Date.now() - startTime,
    });
    
    // 7. Return success response
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Barcode scan processed successfully',
      data: result,
    }, { status: 201 });
    
  } catch (error) {
    // Record failed scan
    healthMonitor.recordFailedScan(Date.now() - startTime);
    
    // Handle specific known errors
    if (error instanceof Error) {
      if (error.message.includes('Duplicate scan_id')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: error.message,
          error: ScanError.DUPLICATE_SCAN,
        }, { status: 409 });
      }
      
      if (error.message.includes('Database error')) {
        logger.error('Database error', error);
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Database error occurred',
          error: ScanError.DATABASE_ERROR,
        }, { status: 500 });
      }
    }
    
    // Generic error handler as fallback
    logger.error('Unhandled error processing barcode scan', error as Error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'An unexpected error occurred',
      error: ScanError.SERVER_ERROR,
    }, { status: 500 });
  }
}

/**
 * Handle GET requests - can be used as a simple health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json<ApiResponse>({
    success: true,
    message: 'Barcode scanning API is operational',
  });
}scanner_id,
    });
    
    // 6. Return success response
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Barcode scan processed successfully',
      data: result,
    }, { status: 201 });
    
  } catch (error) {
    // Handle specific known errors
    if (error instanceof Error) {
      if (error.message.includes('Duplicate scan_id')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: error.message,
          error: ScanError.DUPLICATE_SCAN,
        }, { status: 409 });
      }
      
      if (error.message.includes('Database error')) {
        logger.error('Database error', error);
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Database error occurred',
          error: ScanError.DATABASE_ERROR,
        }, { status: 500 });
      }
    }
    
    // Generic error handler as fallback
    logger.error('Unhandled error processing barcode scan', error as Error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'An unexpected error occurred',
      error: ScanError.SERVER_ERROR,
    }, { status: 500 });
  }
}

/**
 * Handle GET requests - can be used as a simple health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json<ApiResponse>({
    success: true,
    message: 'Barcode scanning API is operational',
  });
}