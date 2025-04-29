// lib/api/config.ts
// Configuration manager for environment variables

import { createLogger } from '@/lib/api/utils/logger';

const logger = createLogger('config');

/**
 * Environment variables configuration
 */
export interface Config {
  // Supabase
  supabaseUrl: string;
  supabaseServiceKey: string;
  
  // API
  corsOrigins: string[];
  nodeEnv: 'development' | 'production' | 'test';
  
  // Scanner
  scannerApiKeys: Record<string, string>;
  webScannerApiKey: string;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Get string environment variable
 * @param key - Environment variable key
 * @param defaultValue - Optional default value
 * @returns Environment variable value
 * @throws Error if variable is required and not defined
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      logger.warn(`Environment variable ${key} not set, using default`, {
        key,
        defaultValue: defaultValue === '' ? '(empty string)' : defaultValue,
      });
      return defaultValue;
    }
    
    logger.error(`Required environment variable ${key} not set`, { key });
    throw new Error(`Required environment variable ${key} not set`);
  }
  
  return value;
}

/**
 * Get array from comma-separated environment variable
 * @param key - Environment variable key
 * @param defaultValue - Optional default value
 * @returns Array of values
 */
function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  try {
    const value = getEnv(key, defaultValue.join(','));
    return value.split(',').map(item => item.trim()).filter(Boolean);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Load and validate environment configuration
 * @returns Config object
 */
export function loadConfig(): Config {
  try {
    // Extract scanner API keys from environment
    const scannerKeys: Record<string, string> = {};
    
    // Look for keys in the pattern SCANNER_API_KEY_XXX
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('SCANNER_API_KEY_')) {
        const scannerId = key.replace('SCANNER_API_KEY_', '');
        scannerKeys[scannerId] = process.env[key] || '';
      }
    });
    
    // Create the config object
    const config: Config = {
      // Supabase
      supabaseUrl: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
      supabaseServiceKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
      
      // API
      corsOrigins: getEnvArray('API_CORS_ORIGINS', ['http://localhost:3000']),
      nodeEnv: getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
      
      // Scanner
      scannerApiKeys: scannerKeys,
      webScannerApiKey: getEnv('WEB_SCANNER_API_KEY', 'web_scanner_key_001'),
      
      // Logging
      logLevel: getEnv('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
    };
    
    return config;
  } catch (error) {
    logger.error('Error loading configuration', error as Error);
    throw error;
  }
}

// Export a singleton instance of the config
export const config = loadConfig();