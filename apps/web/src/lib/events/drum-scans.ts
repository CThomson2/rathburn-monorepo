import { EventEmitter } from "events";

/**
 * DrumScanEvents: A strongly-typed interface for drum scanning events
 */
declare interface DrumScanEvents {
  /**
   * Emitted when a drum is scanned
   * @param drumId The ID of the scanned drum
   * @param status The current status of the drum
   * @param timestamp When the scan occurred
   * @param location Optional location where the scan took place
   */
  drumScanned: (
    drumId: string,
    status: string,
    timestamp: Date,
    location?: string
  ) => void;

  /**
   * Emitted when a scan operation has completed
   * @param success Whether the scan was successful
   * @param message Optional message with details
   */
  scanComplete: (success: boolean, message?: string) => void;

  /**
   * Emitted when a scan operation encounters an error
   * @param error The error that occurred
   * @param drumId Optional ID of the drum being scanned
   */
  scanError: (error: Error, drumId?: string) => void;
}

/**
 * DrumScanEmitter: A strongly-typed singleton class for managing drum scan events
 *
 * This class extends Node's EventEmitter to provide type-safe event handling
 * for drum scanning operations across the application.
 */
class DrumScanEmitter extends EventEmitter {
  // Store the single instance
  private static instance: DrumScanEmitter;

  // Private constructor prevents direct instantiation
  private constructor() {
    super();
  }

  // Public method to access the single instance
  public static getInstance(): DrumScanEmitter {
    if (!DrumScanEmitter.instance) {
      DrumScanEmitter.instance = new DrumScanEmitter();
    }
    return DrumScanEmitter.instance;
  }

  /**
   * Emits a drum scan event with the specified arguments, ensuring type safety through the DrumScanEvents interface.
   * @param event The event name
   * @param args The event arguments
   * @returns Whether the event was emitted successfully
   */
  emit<K extends keyof DrumScanEvents>(
    event: K,
    ...args: Parameters<DrumScanEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof DrumScanEvents>(
    event: K,
    listener: DrumScanEvents[K]
  ): this {
    return super.on(event, listener);
  }

  off<K extends keyof DrumScanEvents>(
    event: K,
    listener: DrumScanEvents[K]
  ): this {
    return super.off(event, listener);
  }
}

// Export the singleton instance
export const drumScanEvents = DrumScanEmitter.getInstance();

// Export a utility function to create a new drum scan event
export function createDrumScanEvent(
  drumId: string,
  status: string,
  location?: string
) {
  const timestamp = new Date();
  drumScanEvents.emit("drumScanned", drumId, status, timestamp, location);
  return { drumId, status, timestamp, location };
}

// Export the events interface for type usage
export type { DrumScanEvents };
