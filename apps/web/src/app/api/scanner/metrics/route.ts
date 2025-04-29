// app/api/scanner/metrics/route.ts
// API route for system metrics

import { NextRequest, NextResponse } from 'next/server';
import { healthMonitor } from '@/lib/utils/healthMonitor';
import { validateAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api/metrics');

/**
 * Handle GET requests for system metrics
 */
export async function GET(request: NextRequest) {
  logger.info('Received metrics request');
  
  try {
    // Require authentication for metrics endpoint
    const authHeader = request.headers.get('authorization') || '';
    const scannerConfig = validateAuth(authHeader);
    
    if (!scannerConfig) {
      logger.warn('Unauthorized metrics request');
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required for metrics access',
        },
        { status: 401 }
      );
    }
    
    // Get metrics
    const metrics = healthMonitor.getMetrics();
    
    // Return metrics
    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    logger.error('Metrics request failed', error as Error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}