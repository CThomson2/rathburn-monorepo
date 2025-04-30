// app/api/scanner/metrics/route.ts
// API route for system metrics

import { NextRequest, NextResponse } from 'next/server';
import { healthMonitor, SystemMetrics } from '@/lib/api/utils/health-monitor';
import { validateAuth } from '@/lib/api/auth';
import { createLogger } from '@/lib/api/utils/logger';

const logger = createLogger('api/metrics');

interface MetricsResponse {
  success: boolean;
  metrics: SystemMetrics;
  timestamp: string;
}

/**
 * Handle GET requests for system metrics
 */
export async function GET(request: NextRequest): Promise<NextResponse<MetricsResponse | { error: string; message: string } | { success: false; error: string; message: string }>> {
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