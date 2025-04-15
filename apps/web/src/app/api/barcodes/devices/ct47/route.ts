import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDeviceScanHandler } from "../shared/handler";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Schema for CT47 scanner data
const ct47ScanSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  barcode: z.string().min(1, "Barcode data is required"),
  timestamp: z.string().datetime().optional(),
  scanType: z.enum(["drum", "pallet", "location", "other"]).optional(),
  battery: z.number().min(0).max(100).optional(),
  signalStrength: z.number().min(0).max(100).optional(),
  location: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      accuracy: z.number().optional(),
    })
    .optional(),
});

/**
 * POST endpoint for handling scans from Honeywell CT47 barcode scanners
 *
 * This endpoint processes barcode scans from CT47 devices, with device-specific
 * features like battery level reporting and location data.
 *
 * @route POST /api/barcodes/devices/ct47
 *
 * @param {NextRequest} req - The request object containing:
 *   @param {Object} req.body - Request body
 *   @param {string} req.body.deviceId - Unique identifier for the CT47 device
 *   @param {string} req.body.barcode - The scanned barcode data
 *   @param {string} req.body.timestamp - Optional timestamp of the scan
 *   @param {string} req.body.scanType - Optional type of scan (drum, pallet, location, other)
 *   @param {number} req.body.battery - Optional battery level of the device (0-100)
 *   @param {number} req.body.signalStrength - Optional signal strength (0-100)
 *   @param {Object} req.body.location - Optional location data
 *
 * @returns {Promise<NextResponse>} Response object with:
 *   - 200: Successfully processed scan
 *     - success: true
 *     - data: Object containing processing results
 *   - 400: Invalid request data
 *     - message: Error description
 *   - 401: Unauthorized
 *     - message: Error description
 *   - 500: Internal server error
 *     - message: "Internal server error"
 *     - error: Error details
 */
export const POST = createDeviceScanHandler({
  deviceType: "ct47",
  schema: ct47ScanSchema,
  processExtraData: (validatedData) => ({
    signalStrength: validatedData.signalStrength,
    location: validatedData.location,
  }),
});
