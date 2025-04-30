// lib/services/notificationService.ts
// Service for sending notifications related to barcode scans

import { BarcodeData, StoredScanData } from '@rathburn/types';
import { createLogger } from '@/lib/api/utils/logger';

const logger = createLogger('services/notificationService');

/**
 * Interface for notification templates
 */
interface NotificationTemplate {
  subject: string;
  body: string;
}

/**
 * Type of notification
 */
export enum NotificationType {
  SCAN_RECEIVED = 'scan_received',
  DUPLICATE_SCAN = 'duplicate_scan',
  ERROR = 'error',
  BATCH_COMPLETE = 'batch_complete',
}

/**
 * Service for handling notifications for barcode scanning events
 */
export class NotificationService {
  private emailEnabled: boolean;
  private smsEnabled: boolean;
  
  /**
   * Create a new notification service
   * @param config - Service configuration
   */
  constructor(config: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
  } = {}) {
    this.emailEnabled = config.emailEnabled ?? false;
    this.smsEnabled = config.smsEnabled ?? false;
  }
  
  /**
   * Send a notification about a successful scan
   * @param scanData - The processed scan data
   */
  async notifyScanReceived(scanData: StoredScanData): Promise<void> {
    logger.info('Sending scan received notification', {
      scanId: scanData.scan_id,
      scannerId: scanData.scanner_id,
    });
    
    const template = this.getScanReceivedTemplate(scanData);
    
    try {
      if (this.emailEnabled) {
        await this.sendEmail(
          ['design@rathburn.co.uk'],
          template.subject,
          template.body
        );
      }
      
      if (this.smsEnabled) {
        await this.sendSms(
          ['+447375298220'], // Example phone number
          `New scan: ${scanData.scan_id} at ${scanData.scan_location || 'unknown location'}`
        );
      }
      
      logger.info('Scan notification sent successfully');
      
    } catch (error) {
      logger.error('Failed to send scan notification', error as Error);
    }
  }
  
  /**
   * Send a notification about batch processing results
   * @param results - Batch processing results
   */
  async notifyBatchComplete(results: {
    processed: StoredScanData[];
    failed: { data: BarcodeData; error: string }[];
    totalProcessed: number;
    totalFailed: number;
    totalSubmitted: number;
  }): Promise<void> {
    logger.info('Sending batch complete notification', {
      processed: results.totalProcessed,
      failed: results.totalFailed,
    });
    
    const template = this.getBatchCompleteTemplate(results);
    
    try {
      if (this.emailEnabled) {
        await this.sendEmail(
          ['warehouse-managers@example.com'],
          template.subject,
          template.body
        );
      }
      
      logger.info('Batch notification sent successfully');
      
    } catch (error) {
      logger.error('Failed to send batch notification', error as Error);
    }
  }
  
  /**
   * Send a notification about an error
   * @param errorType - Type of error
   * @param details - Error details
   */
  async notifyError(errorType: string, details: Record<string, any>): Promise<void> {
    logger.info('Sending error notification', { errorType, ...details });
    
    const template = this.getErrorTemplate(errorType, details);
    
    try {
      if (this.emailEnabled) {
        await this.sendEmail(
          ['tech-support@example.com'],
          template.subject,
          template.body
        );
      }
      
      logger.info('Error notification sent successfully');
      
    } catch (error) {
      logger.error('Failed to send error notification', error as Error);
    }
  }
  
  /**
   * Mock function to send an email
   * In a real application, this would use a proper email service
   * @param recipients - Email recipients
   * @param subject - Email subject
   * @param body - Email body
   */
  private async sendEmail(
    recipients: string[],
    subject: string,
    body: string
  ): Promise<void> {
    // This is a mock implementation
    logger.debug('Sending email', { recipients, subject });
    
    // In a real application, this would use a proper email service
    // e.g., AWS SES, SendGrid, Nodemailer, etc.
    
    // Example implementation with AWS SES:
    // const AWS = require('aws-sdk');
    // const ses = new AWS.SES({ region: 'us-east-1' });
    // await ses.sendEmail({
    //   Source: 'barcode-system@example.com',
    //   Destination: { ToAddresses: recipients },
    //   Message: {
    //     Subject: { Data: subject },
    //     Body: { Text: { Data: body } }
    //   }
    // }).promise();
    
    // For now, just log the email
    logger.debug('Email would be sent', { recipients, subject, body });
  }
  
  /**
   * Mock function to send an SMS
   * In a real application, this would use a proper SMS service
   * @param phoneNumbers - Phone numbers to send to
   * @param message - SMS message
   */
  private async sendSms(
    phoneNumbers: string[],
    message: string
  ): Promise<void> {
    // This is a mock implementation
    logger.debug('Sending SMS', { phoneNumbers, message });
    
    // In a real application, this would use a proper SMS service
    // e.g., Twilio, AWS SNS, etc.
    
    // Example implementation with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // for (const phoneNumber of phoneNumbers) {
    //   await client.messages.create({
    //     body: message,
    //     from: process.env.TWILIO_PHONE_NUMBER,
    //     to: phoneNumber
    //   });
    // }
    
    // For now, just log the SMS
    logger.debug('SMS would be sent', { phoneNumbers, message });
  }
  
  /**
   * Generate a template for scan received notifications
   * @param scanData - The scan data
   * @returns Notification template
   */
  private getScanReceivedTemplate(scanData: StoredScanData): NotificationTemplate {
    const scanDate = new Date(scanData.scan_timestamp).toLocaleString();
    
    return {
      subject: `New Scan Received: ${scanData.scan_id}`,
      body: `
A new barcode scan has been processed:

Scan ID: ${scanData.scan_id}
Scanner: ${scanData.scanner_id || 'Unknown scanner'}
Time: ${scanDate}
Location: ${scanData.scan_location || 'N/A'}
Type: ${scanData.scan_type || 'N/A'}

Additional Information:
${JSON.stringify(scanData.metadata || {}, null, 2)}

This is an automated notification from the Barcode Scanning System.
      `.trim(),
    };
  }
  
  /**
   * Generate a template for batch complete notifications
   * @param results - Batch results
   * @returns Notification template
   */
  private getBatchCompleteTemplate(results: {
    processed: StoredScanData[];
    failed: { data: BarcodeData; error: string }[];
    totalProcessed: number;
    totalFailed: number;
    totalSubmitted: number;
  }): NotificationTemplate {
    const successRate = Math.round((results.totalProcessed / results.totalSubmitted) * 100);
    
    let failedScansText = '';
    if (results.failed.length > 0) {
      failedScansText = `
Failed Scans:
${results.failed.map(f => `- ${f.data.scan_id}: ${f.error}`).join('\n')}
      `.trim();
    }
    
    return {
      subject: `Batch Processing Complete - ${successRate}% Success Rate`,
      body: `
Batch Processing Results:

Total Submitted: ${results.totalSubmitted}
Successfully Processed: ${results.totalProcessed}
Failed: ${results.totalFailed}
Success Rate: ${successRate}%

${failedScansText}

This is an automated notification from the Barcode Scanning System.
      `.trim(),
    };
  }
  
  /**
   * Generate a template for error notifications
   * @param errorType - Type of error
   * @param details - Error details
   * @returns Notification template
   */
  private getErrorTemplate(
    errorType: string,
    details: Record<string, any>
  ): NotificationTemplate {
    return {
      subject: `Error Alert: ${errorType}`,
      body: `
An error occurred in the Barcode Scanning System:

Error Type: ${errorType}
Time: ${new Date().toLocaleString()}

Details:
${JSON.stringify(details, null, 2)}

This is an automated notification from the Barcode Scanning System.
      `.trim(),
    };
  }
}

// Export a singleton instance
export const notificationService = new NotificationService({
  emailEnabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  smsEnabled: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
});