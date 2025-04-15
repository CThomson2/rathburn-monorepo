#!/usr/bin/env node

/**
 * Script to prepare deployment package for EC2
 * 
 * This script creates a zip file containing the standalone Next.js application
 * and all necessary files for deployment.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure we're running from the app directory
const appDir = process.cwd();
console.log(`Running from ${appDir}`);

// Create a timestamp for the deployment package
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const deployDir = path.join(appDir, 'deploy');
const packageName = `deploy-${timestamp}.zip`;

console.log('🚀 Preparing deployment package...');

// Ensure deploy directory exists
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir, { recursive: true });
}

try {
  // First, build the application with the standalone output
  console.log('📦 Building application with standalone output...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Create a run script for EC2
  console.log('✏️ Creating EC2 run script...');
  const startScript = `#!/bin/bash
# Run the Next.js standalone server
cd "\$(dirname "\$0")"
NODE_ENV=production PORT=3000 node server.js
`;

  fs.writeFileSync(path.join(appDir, '.next/standalone/run.sh'), startScript);
  execSync('chmod +x .next/standalone/run.sh', { stdio: 'inherit' });
  
  // Create package.json with production dependencies
  console.log('📄 Creating production package.json...');
  const packageJson = {
    name: "nextjs-standalone",
    version: "1.0.0",
    private: true,
    scripts: {
      start: "NODE_ENV=production node server.js"
    }
  };
  
  fs.writeFileSync(
    path.join(appDir, '.next/standalone/package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create the deployment zip
  console.log(`📦 Creating deployment package ${packageName}...`);
  execSync(`cd .next/standalone && zip -r ../../deploy/${packageName} .`, { stdio: 'inherit' });
  
  console.log('✅ Deployment package created successfully!');
  console.log(`Package location: ${path.join(deployDir, packageName)}`);
} catch (error) {
  console.error('❌ Error preparing deployment package:', error);
  process.exit(1);
}