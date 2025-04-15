#!/usr/bin/env node

// This is a fallback server.js template in case Next.js doesn't generate one
// It's designed to work with the standalone output

const path = require("path");
const { createServer } = require("http");
const { existsSync, readFileSync } = require("fs");

// Determine if we're running from the monorepo or standalone structure
const cwd = process.cwd();
console.log("Current directory:", cwd);

// Set up environment variables
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

try {
  console.log(`Starting server on ${HOSTNAME}:${PORT}`);

  // Check multiple possible locations for the Next.js server handler
  const possibleServerPaths = [
    // Try from standalone root
    path.join(cwd, "apps", "web", ".next", "standalone", "server.js"),
    // Try from standalone root with different structure
    path.join(cwd, "apps", "web", ".next", "standalone", "server", "index.js"),
    // Try from app folder
    path.join(cwd, ".next", "standalone", "server.js"),
    // Try from app folder with different structure
    path.join(cwd, ".next", "standalone", "server", "index.js"),
    // Try relative path that Next.js 14+ sometimes uses
    path.join(cwd, ".next", "standalone", "server.js"),
  ];

  console.log("Checking these paths for Next.js server handler:");
  possibleServerPaths.forEach((p) => console.log(`- ${p}`));

  // Find the first path that exists
  let serverPath = null;
  for (const p of possibleServerPaths) {
    if (existsSync(p)) {
      serverPath = p;
      console.log(`✓ Found Next.js server handler at: ${p}`);
      break;
    }
  }

  if (serverPath) {
    // If we found a server path, require the parent directory to get the exported handler
    console.log("Using Next.js generated server handler");
    const serverDir = path.dirname(serverPath);

    // Try with direct require or with index.js
    try {
      const app = require(serverDir);
      if (app && typeof app === "function") {
        const server = createServer(app);
        server.listen(PORT, HOSTNAME, () => {
          console.log(`Server listening on http://${HOSTNAME}:${PORT}`);
        });
        return;
      } else if (app && app.default && typeof app.default === "function") {
        const server = createServer(app.default);
        server.listen(PORT, HOSTNAME, () => {
          console.log(`Server listening on http://${HOSTNAME}:${PORT}`);
        });
        return;
      }
    } catch (error) {
      console.error(`Error loading server module: ${error.message}`);
    }
  }

  // If we get here, either no server path was found or loading it failed
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
        <p>Checked the following paths:</p>
        <ul>
          ${possibleServerPaths.map((p) => `<li>${p}</li>`).join("")}
        </ul>
      </body>
      </html>
    `);
  });

  server.listen(PORT, HOSTNAME, () => {
    console.log(`Simple server listening on http://${HOSTNAME}:${PORT}`);
  });
} catch (error) {
  console.error("Error starting server:", error);
  process.exit(1);
}
