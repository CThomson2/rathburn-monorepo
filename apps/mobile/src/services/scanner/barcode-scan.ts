"use server";

import { createClient } from '@supabase/supabase-js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ScanActionParams {
  barcode: string;
  jobId: number;
  action: 'scan' | 'cancel' | 'bulk';
  deviceId?: string;
}

// Validation middleware
function validateScanRequest(req: Request, res: Response, next: Function) {
  const { barcode, jobId, action } = req.body;
  
  if (!barcode || !jobId || !action) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: barcode, jobId, or action" 
    });
  }
  
  if (!['scan', 'cancel', 'bulk'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: "Invalid action type. Must be 'scan', 'cancel', or 'bulk'"
    });
  }
  
  next();
}

// Barcode scan processing endpoint
app.post('/api/barcode-scan', validateScanRequest, async (req: Request, res: Response) => {
  try {
    const { barcode, jobId, action, deviceId }: ScanActionParams = req.body;
    
    // Verify user authentication from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized - Missing or invalid token" 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user information
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized - Invalid token" 
      });
    }
    
    const userId = user.id;
    
    // Get device information from request or user agent
    const deviceIdentifier = deviceId || req.headers['user-agent'] || "unknown-device";
    
    // Determine action type for the logs.drum_scan table
    const actionType = action === 'cancel' ? 'cancel' : 'scan';
    
    // Insert into logs.drum_scan table
    const { data: scanData, error: scanError } = await supabase
      .from('drum_scan')
      .insert({
        user_id: userId,
        device_id: deviceIdentifier,
        raw_barcode: barcode,
        detected_drum: barcode, // Assuming barcode matches drum ID directly
        action_type: actionType,
        status: 'success',
        metadata: {
          job_id: jobId,
          scan_method: action === 'bulk' ? 'bulk_registration' : 'single_scan',
          app_version: '1.0.0'
        }
      })
      .select();
    
    if (scanError) {
      console.error("Error inserting scan record:", scanError);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to record scan" 
      });
    }
    
    // If this is a scan (not cancel), update the job progress
    // In a real app, you would update a jobs table in the database
    if (action !== 'cancel') {
      // Update job status logic here
      console.log(`Updated job ${jobId} for drum ${barcode}`);
    }
    
    return res.status(200).json({ 
      success: true, 
      data: scanData[0]
    });
    
  } catch (error) {
    console.error("Error processing scan:", error);
    return res.status(500).json({ 
      success: false, 
      error: "An unexpected error occurred" 
    });
  }
});

// Health check endpoint
app.get('/api/health', (_: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Barcode scan service running on port ${PORT}`);
});

// For testing or importing in other files
export default app;