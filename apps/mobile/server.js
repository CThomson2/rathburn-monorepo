import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

/**
 * This server provides API endpoints for the mobile app to interact with Supabase.
 * It handles authentication, logging scan data, and serves as a middleware between
 * the frontend and the database.
 */

// Initialize dotenv to load environment variables from .env file
dotenv.config();

// Setup for ES modules - convert import.meta.url to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express application
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// In-memory storage for scans when offline
const scans = [];

// Supabase client setup - connects to our Supabase instance
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// CORS configuration - defines which origins can access our API
const corsOptions = {
  origin: [
    "http://localhost:8080",
    "http://localhost:3001",
    "http://localhost:4173",
    "https://mobile.rathburn.app",
  ],
  credentials: true, // Allow cookies and authentication headers
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Serve static files from the dist directory when in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
}

// Simple GET endpoint to check if the API is working
app.get("/api", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Rathburn Mobile API is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST endpoint to log drum scans
 *
 * This endpoint receives barcode scan data from the mobile app,
 * authenticates the user if possible, and stores the scan in Supabase.
 *
 * Request body:
 * - rawBarcode: The scanned barcode data
 * - deviceId: Unique identifier for the scanning device
 * - actionType: What action is being performed (e.g., "transport")
 * - metadata: Additional information about the scan
 */
app.post("/api/logs/drum-scan", async (req, res) => {
  console.log("POST request received at /api/logs/drum-scan");

  try {
    const { rawBarcode, deviceId, actionType, metadata = {} } = req.body;

    // Authenticate user from header if available
    let userId = null;
    const authHeader = req.headers.authorization;

    if (authHeader) {
      // Extract token from Authorization header (Bearer token)
      const token = authHeader.split(" ")[1];
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser(token);

      if (!authErr && user) {
        userId = user.id;
      }
    }

    // If no user found, use a service account or anonymous tracking
    if (!userId) {
      // For development/testing, you might want to use a fixed ID
      // In production, you might want to reject unauthenticated requests
      userId = "anonymous-scan-user";
    }

    console.log(`Processing scan with userId: ${userId}`);

    // Create scan data object
    const scanData = {
      id: Date.now().toString(),
      user_id: userId,
      device_id: deviceId,
      raw_barcode: rawBarcode,
      action_type: actionType,
      metadata: metadata,
      status: "processed",
      created_at: new Date().toISOString(),
    };

    // Try to insert into Supabase if connected
    let supabaseData = null;
    let supabaseError = null;

    try {
      const { data, error } = await supabase
        .from("logs.drum_scan")
        .insert([scanData])
        .select()
        .single();

      supabaseData = data;
      supabaseError = error;
    } catch (error) {
      console.log("Could not connect to Supabase, storing locally only");
      supabaseError = error;
    }

    // Always store locally as backup
    scans.push(scanData);

    // Return the scan data - either from Supabase or the local copy
    return res.status(201).json({
      scan: supabaseData || scanData,
      storedLocally: !supabaseData,
      totalLocalScans: scans.length,
    });
  } catch (error) {
    console.error("Error in drum-scan endpoint:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get all locally stored scans
app.get("/api/logs/drum-scans", (req, res) => {
  return res.status(200).json({ scans });
});

// Export all scans as CSV
app.get("/api/logs/export-csv", (req, res) => {
  if (scans.length === 0) {
    return res.status(404).json({ error: "No scans available to export" });
  }

  // Generate CSV headers
  const headers = [
    "id",
    "user_id",
    "device_id",
    "raw_barcode",
    "action_type",
    "status",
    "created_at",
    "metadata",
  ];

  // Generate CSV content
  let csvContent = headers.join(",") + "\n";

  scans.forEach((scan) => {
    const row = [
      scan.id,
      scan.user_id,
      scan.device_id,
      scan.raw_barcode,
      scan.action_type,
      scan.status,
      scan.created_at,
      JSON.stringify(scan.metadata).replace(/,/g, ";"), // Replace commas in JSON to avoid CSV confusion
    ];
    csvContent += row.join(",") + "\n";
  });

  // Set response headers for CSV download
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=drum_scans_${Date.now()}.csv`
  );

  return res.status(200).send(csvContent);
});

// Save scans to a local JSON file
app.get("/api/logs/save-local", (req, res) => {
  try {
    const filePath = path.join(__dirname, `drum_scans_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(scans, null, 2));
    return res.status(200).json({
      success: true,
      message: `Saved ${scans.length} scans to ${filePath}`,
      filePath,
    });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Unknown error while saving",
    });
  }
});

// In production, serve the SPA for any unmatched routes
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Start server and log connection information
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
  console.log(`Supabase URL: ${supabaseUrl ? "configured" : "missing"}`);
  console.log(`Supabase Key: ${supabaseServiceKey ? "configured" : "missing"}`);
  console.log(`Local storage: initialized with ${scans.length} scans`);
});
