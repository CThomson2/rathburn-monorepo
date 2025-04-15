import { z } from "zod";
import { createDeviceScanHandler } from "../shared/handler";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Schema for CK67 scanner data
const ck67ScanSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  barcode: z.string().min(1, "Barcode data is required"),
  timestamp: z.string().datetime().optional(),
  scanType: z.enum(["drum", "pallet", "location", "other"]).optional(),
  battery: z.number().min(0).max(100).optional(),
  temperature: z.number().optional(),
  humidity: z.number().min(0).max(100).optional(),
  scanMode: z.enum(["1D", "2D", "Auto"]).optional(),
});

/**
 * POST endpoint for handling scans from Honeywell CK67 barcode scanners
 *
 * This endpoint processes barcode scans from CK67 devices, with device-specific
 * features like temperature/humidity monitoring and enhanced barcode scanning modes.
 *
 * @route POST /api/barcodes/devices/ck67
 */
export const POST = createDeviceScanHandler({
  deviceType: "ck67",
  schema: ck67ScanSchema,
  processExtraData: (validatedData) => ({
    temperature: validatedData.temperature,
    humidity: validatedData.humidity,
    scanMode: validatedData.scanMode,
  }),
});
