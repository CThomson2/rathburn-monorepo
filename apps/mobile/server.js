import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Initialize dotenv
dotenv.config();

// Setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Supabase client setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(bodyParser.json());

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:4173",
    "https://mobile.rathburn.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Routes
app.post("/api/logs/drum-scan", async (req, res) => {
  console.log("POST request received at /api/logs/drum-scan");

  try {
    const { rawBarcode, deviceId, actionType, metadata = {} } = req.body;

    // Authenticate user from header if available
    let userId = null;
    const authHeader = req.headers.authorization;

    if (authHeader) {
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

    // Insert scan data
    const { data, error } = await supabase
      .from("logs.drum_scan")
      .insert([
        {
          user_id: userId,
          device_id: deviceId,
          raw_barcode: rawBarcode,
          action_type: actionType,
          metadata: metadata,
          status: "processed",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting drum scan:", error);
      return res.status(500).json({ error: error.message });
    }

    // Return the scan data
    return res.status(201).json({ scan: data });
  } catch (error) {
    console.error("Error in drum-scan endpoint:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase URL: ${supabaseUrl ? "configured" : "missing"}`);
  console.log(`Supabase Key: ${supabaseServiceKey ? "configured" : "missing"}`);
});
