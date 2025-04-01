const path = require('path');
const depTree = require("dependency-tree");

// Get absolute paths
const rootDir = path.resolve(__dirname, '../');
const targetFile = path.resolve(rootDir, 'app/(components)/(contentlayout)/dashboards/personal/page.tsx');

// Create the dependency tree with more options
const tree = depTree({
  filename: targetFile,
  directory: rootDir,
  filter: path => !path.includes('node_modules'), // Exclude node_modules
  requireConfig: null, // Load closest package.json for module resolution
  detective: {
    es6: {
      mixedImports: true,
    },
  },
});

// Helper to clean paths for readability
function cleanPaths(tree, rootDir) {
  const result = {};
  
  for (const key in tree) {
    const relPath = path.relative(rootDir, key);
    result[relPath] = cleanPaths(tree[key], rootDir);
  }
  
  return result;
}

const cleanedTree = cleanPaths(tree, rootDir);
console.log(JSON.stringify(cleanedTree, null, 2)); 