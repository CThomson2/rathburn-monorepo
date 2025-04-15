#!/usr/bin/env node

// This is a fallback server.js template in case Next.js doesn't generate one
// It's designed to work with the standalone output

const path = require("path");
const { createServer } = require("http");
const { existsSync, readFileSync } = require("fs");

// Determine if we're running from the monorepo or standalone structure
console.log("Current directory:", process.cwd());

// Set up environment variables
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

try {
  console.log(`Starting server on ${HOSTNAME}:${PORT}`);

  // First, check if Next.js left a standalone handler we can use
  const serverPath = path.join(process.cwd(), "apps", "web", ".next", "server");

  if (existsSync(serverPath)) {
    console.log("Using Next.js generated server handler");
    // If Next.js standalone works, use it directly
    const app = require("./apps/web/.next/server");

    if (app && app.default) {
      const server = createServer(app.default);
      server.listen(PORT, HOSTNAME, () => {
        console.log(`Server listening on http://${HOSTNAME}:${PORT}`);
      });
    } else {
      throw new Error("Invalid Next.js server handler");
    }
  } else {
    // Otherwise, serve a simple message
    console.log("No Next.js server handler found, serving static response");
    const server = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Next.js Standalone</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; max-width: 650px; margin: 0 auto; }
            h1 { color: #0070f3; }
            p { line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>Next.js Standalone Server</h1>
          <p>The server is running, but the Next.js application couldn't be loaded.</p>
          <p>This could be because:</p>
          <ul>
            <li>The Next.js server files weren't correctly generated</li>
            <li>The server.js file is running from an incorrect location</li>
          </ul>
          <p>Check your Next.js configuration and build process.</p>
        </body>
        </html>
      `);
    });

    server.listen(PORT, HOSTNAME, () => {
      console.log(`Simple server listening on http://${HOSTNAME}:${PORT}`);
    });
  }
} catch (error) {
  console.error("Error starting server:", error);
  process.exit(1);
}
