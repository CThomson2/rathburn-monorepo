#!/usr/bin/env node
/**
 * Custom Next.js server that handles the Turborepo structure
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Environment variables
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

// Determine if we're in standalone mode by checking directory structure
const isStandalone = fs.existsSync(path.join(__dirname, '.next/standalone'));

// Configure the Next.js app
const nextConfig = {
  dev,
  dir: __dirname, // Use current directory
  hostname,
  port,
  // In standalone mode, we want to disable the fileWatcher
  useFileSystemPublicRoutes: true
};

console.log(`Starting Next.js server in ${dev ? 'development' : 'production'} mode`);
console.log(`Standalone mode: ${isStandalone ? 'yes' : 'no'}`);

// Create the Next.js app instance
const app = next(nextConfig);
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, hostname, err => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});