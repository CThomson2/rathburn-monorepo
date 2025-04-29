// lib/utils/logger.ts
// Structured logging utility

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  message: string;
  [key: string]: any;
}

/**
 * Simple structured logger for the application
 */
class Logger {
  private context: string;
  
  /**
   * Create a new logger instance
   * @param context - The context for this logger instance
   */
  constructor(context: string) {
    this.context = context;
  }

  /**
   * Format a log entry with timestamp and context
   * @param level - Log level
   * @param data - Log data
   * @returns Formatted log object
   */
  private formatLog(level: LogLevel, data: LogData) {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      ...data,
    };
  }

  /**
   * Log a debug message
   * @param message - Log message
   * @param data - Additional data
   */
  debug(message: string, data: Record<string, any> = {}) {
    // Try to get log level from config, fall back to NODE_ENV check
    try {
      const configModule = require('../config');
      const logLevel = configModule.config?.logLevel || 'info';
      
      if (logLevel === 'debug') {
        console.debug(JSON.stringify(this.formatLog('debug', { message, ...data })));
      }
    } catch (e) {
      // Fall back to simple environment check if config module isn't available
      if (process.env.NODE_ENV === 'development') {
        console.debug(JSON.stringify(this.formatLog('debug', { message, ...data })));
      }
    }
  }

  /**
   * Log an info message
   * @param message - Log message
   * @param data - Additional data
   */
  info(message: string, data: Record<string, any> = {}) {
    console.info(JSON.stringify(this.formatLog('info', { message, ...data })));
  }

  /**
   * Log a warning message
   * @param message - Log message
   * @param data - Additional data
   */
  warn(message: string, data: Record<string, any> = {}) {
    console.warn(JSON.stringify(this.formatLog('warn', { message, ...data })));
  }

  /**
   * Log an error message
   * @param message - Log message
   * @param error - Error object
   * @param data - Additional data
   */
  error(message: string, error?: Error, data: Record<string, any> = {}) {
    console.error(
      JSON.stringify(
        this.formatLog('error', {
          message,
          error: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : undefined,
          ...data,
        })
      )
    );
  }
}

/**
 * Create a new logger instance
 * @param context - The context for the logger
 * @returns Logger instance
 */
export function createLogger(context: string) {
  return new Logger(context);
}