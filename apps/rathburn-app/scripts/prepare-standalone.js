#!/usr/bin/env node

/**
 * This script prepares the standalone build for deployment
 * It enhances the Next.js-generated standalone build with additional
 * files and configurations needed for deployment.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const appDir = process.cwd();
const nextDir = path.join(appDir, '.next');
const standaloneDir = path.join(nextDir, 'standalone');
const standaloneNodeModulesDir = path.join(standaloneDir, 'node_modules');

console.log('Preparing standalone build for deployment...');

// Check if standalone directory exists
if (!fs.existsSync(standaloneDir)) {
  console.error('Standalone directory not found. Make sure you build with "output: standalone" in next.config.js');
  process.exit(1);
}

// Check if server.js exists
if (!fs.existsSync(path.join(standaloneDir, 'server.js'))) {
  console.error('server.js not found in standalone directory. Build may have failed.');
  process.exit(1);
}

console.log('Next.js standalone build found. Enhancing for deployment...');

// Create necessary directories if they don't exist
const dirs = [
  path.join(standaloneDir, '.next', 'static'),
  path.join(standaloneDir, 'public'),
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy static files if needed
const staticSrcDir = path.join(nextDir, 'static');
const staticDestDir = path.join(standaloneDir, '.next', 'static');
if (fs.existsSync(staticSrcDir) && fs.readdirSync(staticSrcDir).length > 0) {
  console.log('Copying static files...');
  try {
    execSync(`cp -r ${staticSrcDir}/* ${staticDestDir}/`);
  } catch (error) {
    console.log('Static files already exist in destination, skipping...');
  }
}

// Copy public directory if it exists and is not empty
const publicDir = path.join(appDir, 'public');
const standalonePublicDir = path.join(standaloneDir, 'public');
if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  if (files.length > 0) {
    console.log('Copying public directory...');
    try {
      execSync(`cp -r ${publicDir}/* ${standalonePublicDir}/`);
    } catch (error) {
      console.log('Error copying public directory, it may already exist: ', error.message);
    }
  } else {
    console.log('Public directory exists but is empty, skipping...');
  }
}

// Copy environment files
console.log('Copying environment files...');
try {
  execSync(`cp ${path.join(appDir, '.env')}* ${standaloneDir}/ 2>/dev/null || true`);
} catch (error) {
  console.log('No .env files found, skipping...');
}

// Check required dependencies (but don't try to copy them)
const requiredDependencies = [
  'sharp',
  'next',
  'react',
  'react-dom',
  '@supabase/supabase-js',
  '@supabase/ssr',
];

console.log('Checking for required dependencies...');
requiredDependencies.forEach(dep => {
  const destDir = path.join(standaloneNodeModulesDir, dep);
  if (fs.existsSync(destDir)) {
    const isSymlink = fs.lstatSync(destDir).isSymbolicLink();
    console.log(`✓ ${dep} is ${isSymlink ? 'linked' : 'copied'}`);
  } else {
    console.warn(`⚠️ Warning: ${dep} not found in standalone build`);
  }
});

// For dependencies not properly included by Next.js, manually copy them
// Example with @supabase modules which might not be automatically included
const supabaseDeps = ['@supabase/supabase-js', '@supabase/ssr'];
supabaseDeps.forEach(dep => {
  const destDir = path.join(standaloneNodeModulesDir, dep);
  if (!fs.existsSync(destDir)) {
    console.log(`Manually adding ${dep}...`);
    try {
      // Find the dependency in the pnpm structure
      const pnpmRoot = path.join(appDir, 'node_modules', '.pnpm');
      // Use find to locate the actual directory regardless of version
      const findCmd = `find ${pnpmRoot} -name "${dep.replace('@', '')}" -type d | grep -v "node_modules/${dep.replace('@', '')}/node_modules"`;
      const foundDir = execSync(findCmd).toString().trim().split('\n')[0];
      
      if (foundDir) {
        fs.mkdirSync(path.dirname(destDir), { recursive: true });
        execSync(`cp -r ${foundDir} ${path.dirname(destDir)}/`);
        console.log(`✓ Successfully added ${dep}`);
      } else {
        console.warn(`⚠️ Could not find ${dep} in pnpm structure`);
      }
    } catch (error) {
      console.warn(`⚠️ Error adding ${dep}: ${error.message}`);
    }
  }
});

console.log('Standalone build preparation complete!');
console.log(`Standalone server is ready at: ${path.join(standaloneDir, 'server.js')}`);
console.log('You can start the server with: node .next/standalone/server.js');