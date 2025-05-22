/**
 * Data structure for the Distillation Record (QRD) stored in the details JSONB field
 * of the production.distillation_details table
 */
export interface QRDData {
    // Setup data
    setupTime: string; // ISO timestamp when setup was completed
    setupBy: string; // Operator ID or name
    initialTemperature: number; // Initial temperature in °C
    initialPressure: number; // Initial pressure in mbar
    heatSetting: number; // Heat setting percentage
  
    // Process timeline (readings throughout distillation)
    readings: Array<{
      timestamp: string; // ISO timestamp
      temperature: number; // Temperature in °C
      pressure: number; // Pressure in mbar
      notes: string; // Any observations at this time
    }>;
  
    // Collection data
    fractions: Array<{
      number: number; // Fraction number (1, 2, 3...)
      startTime: string; // ISO timestamp when collection started
      endTime: string; // ISO timestamp when collection ended
      volume: number; // Volume collected in L
      temperature: number; // Temperature when collected in °C
      appearance: string; // Visual description
      density?: number; // Optional density measurement
      contaminants?: string; // Optional contaminants observed
    }>;
  
    // Final data
    totalTimeHours: number; // Total time for distillation in hours
    totalYieldVolume: number; // Total yield in L
    yieldPercentage: number; // Yield as percentage of input volume
    finalNotes: string; // Final notes and observations
    completedBy: string; // Operator who completed the process
    qualityCheck: {
      performed: boolean;
      passedQC: boolean;
      qcNotes: string;
      qcPerformedBy: string;
    };
  
    // Approvals
    supervisorApproval: {
      approved: boolean;
      approvedBy: string;
      approvedAt: string; // ISO timestamp
      notes: string;
    };
  }
  
  /**
   * QRD data including metadata from the job, operation, and distillation details
   */
  export interface QRDFormData extends Partial<QRDData> {
    // Job metadata
    jobId: string;
    jobName: string;
    materialName: string;
    batchCode: string;
    supplierName: string;
    
    // Operation metadata
    operationId: string;
    scheduledStart: string;
    startedAt: string | null;
    endedAt: string | null;
    status: string;
    
    // Distillation details
    stillId: number;
    stillCode: string;
    rawVolume: number;
    expectedYield: number | null;
  }
  
  /**
   * Default empty QRD data for new records
   */
  export const emptyQRDData: Partial<QRDData> = {
    readings: [],
    fractions: [],
    qualityCheck: {
      performed: false,
      passedQC: false,
      qcNotes: '',
      qcPerformedBy: '',
    },
    supervisorApproval: {
      approved: false,
      approvedBy: '',
      approvedAt: '',
      notes: '',
    }
  };
  