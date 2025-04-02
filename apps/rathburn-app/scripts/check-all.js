#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Helper to print colored text
const print = (color, text) => console.log(colors[color] + text + colors.reset);

// Get the app directory
const appDir = path.resolve(__dirname, '..');

// Store errors for final reporting
const errors = [];

// Function to run a command and handle its output
function runCommand(command, name) {
  print('cyan', `\n🔍 Running ${name}...\n`);
  
  try {
    const output = execSync(command, { 
      cwd: appDir,
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    if (output.trim()) {
      print('green', `✅ ${name} completed with output:\n`);
      console.log(output);
    } else {
      print('green', `✅ ${name} completed successfully with no output.\n`);
    }
    return { success: true, output };
  } catch (error) {
    print('red', `❌ ${name} failed with error:`);
    console.error(error.stdout ? error.stdout.toString() : error.message);
    errors.push({ name, error: error.stdout ? error.stdout.toString() : error.message });
    return { success: false, error: error.stdout ? error.stdout.toString() : error.message };
  }
}

// Main function to run all checks
async function runAllChecks() {
  print('magenta', '\n🚀 Starting pre-build checks...\n');
  
  // Check TypeScript types
  runCommand('npx tsc --noEmit --skipLibCheck', 'TypeScript Type Check');
  
  // Run ESLint
  runCommand('npx next lint', 'ESLint Check');
  
  // Run Next.js build analysis without full build
  runCommand('ANALYZE=true pnpm build', 'Next.js Build Analysis');
  
  // Run Prisma validation if we have a schema
  if (fs.existsSync(path.join(appDir, 'prisma', 'schema.prisma'))) {
    runCommand('npx prisma validate', 'Prisma Schema Validation');
  }
  
  // Final report
  if (errors.length > 0) {
    print('red', '\n❌ Pre-build checks failed with the following errors:');
    
    errors.forEach((err, index) => {
      print('yellow', `\n${index + 1}. ${err.name}:`);
      console.error(err.error);
    });
    
    print('red', `\nFound ${errors.length} error(s). Please fix them before building.\n`);
    process.exit(1);
  } else {
    print('green', '\n✅ All pre-build checks passed! You can now safely run the build command.\n');
    execSync('pnpm build');
  }
}

// Run the checks
runAllChecks().catch(err => {
  print('red', 'Error running checks:');
  console.error(err);
  process.exit(1);
}); 