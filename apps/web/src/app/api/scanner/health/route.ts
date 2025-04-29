// app/api/health/route.ts
// API route for system health checks

import { NextResponse } from 'next/server';
import { healthMonitor } from '@/lib/utils/healthMonitor';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api/health');

/**
 * Handle GET requests for health checks
 */
export async function GET() {
  logger.info('Received health check request');
  
  try {
    // Perform health check
    const healthResult = await healthMonitor.checkHealth();
    
    // Determine HTTP status code based on health status
    const statusCode = 
      healthResult.status === 'ok' ? 200 :
      healthResult.status === 'degraded' ? 200 : // Still return 200 for monitoring systems
      503; // Service Unavailable for failed status
    
    logger.info('Health check completed', { status: healthResult.status });
    
    // Return health check results
    return NextResponse.json(healthResult, { status: statusCode });
    
  } catch (error) {
    logger.error('Health check failed with exception', error as Error);
    
    // Return error response
    return NextResponse.json(
      {
        status: 'failed',
        message: 'Health check failed with exception',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}