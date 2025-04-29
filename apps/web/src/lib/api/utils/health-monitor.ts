// utils/health-monitor.ts
// Utility for monitoring system health and reporting metrics

import { createLogger } from './logger';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const logger = createLogger('healthMonitor');

/**
 * Health check result
 */
interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'failed';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * System metrics
 */
interface SystemMetrics {
  requestsProcessed: number;
  successfulScans: number;
  failedScans: number;
  averageResponseTime: number;
  lastChecked: string;
}

/**
 * Health monitor service
 */
export class HealthMonitor {
  private static instance: HealthMonitor;
  private metrics: SystemMetrics;
  private supabase: ReturnType<typeof createClient>;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.metrics = {
      requestsProcessed: 0,
      successfulScans: 0,
      failedScans: 0,
      averageResponseTime: 0,
      lastChecked: new Date().toISOString(),
    };
    
    // Create Supabase client
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });
    
    // Initialize metrics from database if needed
    this.initializeMetrics();
  }
  
  /**
   * Get the singleton instance
   * @returns HealthMonitor instance
   */
  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    
    return HealthMonitor.instance;
  }
  
  /**
   * Initialize metrics from database
   */
  private async initializeMetrics(): Promise<void> {
    try {
      // In a real application, this would load persisted metrics
      // For this example, we'll just use the default values
      logger.info('Initialized health metrics');
    } catch (error) {
      logger.error('Failed to initialize metrics', error as Error);
    }
  }
  
  /**
   * Run a health check on the system
   * @returns Health check result
   */
  public async checkHealth(): Promise<HealthCheckResult> {
    try {
      // 1. Check database connectivity
      const dbResult = await this.checkDatabaseHealth();
      
      // 2. Check API endpoint health
      const apiResult = await this.checkApiHealth();
      
      // 3. Determine overall status
      let overallStatus: 'ok' | 'degraded' | 'failed' = 'ok';
      let statusMessage = 'All systems operational';
      
      if (dbResult.status === 'failed' || apiResult.status === 'failed') {
        overallStatus = 'failed';
        statusMessage = 'Critical system failure';
      } else if (dbResult.status === 'degraded' || apiResult.status === 'degraded') {
        overallStatus = 'degraded';
        statusMessage = 'System performance degraded';
      }
      
      // 4. Update metrics
      this.metrics.lastChecked = new Date().toISOString();
      
      // 5. Return result
      return {
        status: overallStatus,
        message: statusMessage,
        details: {
          database: dbResult,
          api: apiResult,
          metrics: this.metrics,
        },
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      logger.error('Health check failed', error as Error);
      
      return {
        status: 'failed',
        message: 'Health check failed: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  /**
   * Check database health
   * @returns Health check result
   */
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    try {
      // Simple query to check database connectivity
      const startTime = Date.now();
      const { data, error } = await this.supabase.from('log_drum_scan').select('count(*)', { count: 'exact', head: true });
      const responseTime = Date.now() - startTime;
      
      if (error) {
        logger.error('Database health check failed', { error: error.message });
        
        return {
          status: 'failed',
          message: 'Database connection failed: ' + error.message,
          timestamp: new Date().toISOString(),
        };
      }
      
      // Check response time for degradation
      let status: 'ok' | 'degraded' = 'ok';
      let message = 'Database connection successful';
      
      if (responseTime > 1000) {
        status = 'degraded';
        message = 'Database connection slow: ' + responseTime + 'ms';
      }
      
      return {
        status,
        message,
        details: {
          responseTime,
        },
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      logger.error('Database health check error', error as Error);
      
      return {
        status: 'failed',
        message: 'Database health check error: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  /**
   * Check API health
   * @returns Health check result
   */
  private async checkApiHealth(): Promise<HealthCheckResult> {
    // In a real application, this would check API endpoints
    // For this example, we'll just assume the API is healthy
    return {
      status: 'ok',
      message: 'API endpoints operational',
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Record a successful scan
   * @param responseTime - Response time in milliseconds
   */
  public recordSuccessfulScan(responseTime: number): void {
    // Update metrics
    this.metrics.requestsProcessed++;
    this.metrics.successfulScans++;
    
    // Update average response time
    const totalProcessed = this.metrics.successfulScans + this.metrics.failedScans;
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * (totalProcessed - 1)) + responseTime) / totalProcessed;
    
    // Log for monitoring
    logger.debug('Recorded successful scan', {
      metrics: this.metrics,
    });
  }
  
  /**
   * Record a failed scan
   * @param responseTime - Response time in milliseconds
   */
  public recordFailedScan(responseTime: number): void {
    // Update metrics
    this.metrics.requestsProcessed++;
    this.metrics.failedScans++;
    
    // Update average response time
    const totalProcessed = this.metrics.successfulScans + this.metrics.failedScans;
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * (totalProcessed - 1)) + responseTime) / totalProcessed;
    
    // Log for monitoring
    logger.debug('Recorded failed scan', {
      metrics: this.metrics,
    });
  }
  
  /**
   * Get current system metrics
   * @returns System metrics
   */
  public getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }
}

// Export a singleton instance
export const healthMonitor = HealthMonitor.getInstance();