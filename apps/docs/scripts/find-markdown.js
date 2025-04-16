/**
 * This script finds all markdown files in the monorepo and organizes them
 * for the documentation site.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const rootDir = path.resolve(__dirname, "../../..");
const docsDir = path.resolve(__dirname, "../docs");
const categories = {
  "user-guides": ["README.md", "TASK.md"],
  development: ["src/components", "src/hooks", "src/lib", "src/features"],
  architecture: ["PLANNING", "PROJECT"],
  deployment: ["deployment", "nginx", "production"],
};

// Create directory structure
function createDirectories() {
  console.log("Creating directory structure...");

  // Create category directories
  Object.keys(categories).forEach((category) => {
    const categoryDir = path.join(docsDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`Created directory: ${categoryDir}`);
    }
  });
}

// Find markdown files in the monorepo
function findMarkdownFiles() {
  console.log("Finding markdown files...");

  // Use find command to get all markdown files
  const command = `find ${rootDir} -name "*.md" -not -path "*/node_modules/*" -not -path "${docsDir}/*" -not -path "*/docs-old/*" -not -path "*/docs-backup/*"`;
  const result = execSync(command).toString().trim();
  const files = result.split("\n");

  console.log(`Found ${files.length} markdown files.`);
  return files;
}

// Categorize markdown files
function categorizeFiles(files) {
  console.log("Categorizing files...");

  const categorized = {
    "user-guides": [],
    development: [],
    architecture: [],
    deployment: [],
    uncategorized: [],
  };

  files.forEach((file) => {
    let matched = false;

    // Check each category
    for (const [category, patterns] of Object.entries(categories)) {
      // Check if file matches any pattern for this category
      if (patterns.some((pattern) => file.includes(pattern))) {
        categorized[category].push(file);
        matched = true;
        break;
      }
    }

    // If no category matched, add to uncategorized
    if (!matched) {
      categorized.uncategorized.push(file);
    }
  });

  // Print summary
  for (const [category, files] of Object.entries(categorized)) {
    console.log(`${category}: ${files.length} files`);
  }

  return categorized;
}

// Generate index files for each category
function generateIndexFiles(categorized) {
  console.log("Generating index files...");

  for (const [category, files] of Object.entries(categorized)) {
    if (files.length === 0) continue;

    const indexPath = path.join(docsDir, category, "_category_.json");
    const indexContent = {
      label:
        category.charAt(0).toUpperCase() + category.slice(1).replace("-", " "),
      position: getCategoryPosition(category),
      link: {
        type: "generated-index",
      },
    };

    fs.writeFileSync(indexPath, JSON.stringify(indexContent, null, 2));
    console.log(`Generated index file: ${indexPath}`);
  }
}

function getCategoryPosition(category) {
  const positions = {
    "user-guides": 1,
    development: 2,
    architecture: 3,
    deployment: 4,
    uncategorized: 5,
  };

  return positions[category] || 999;
}

// Copy markdown files to their appropriate directories
function copyFiles(categorized) {
  console.log("Copying files to docs directory...");

  for (const [category, files] of Object.entries(categorized)) {
    files.forEach((file) => {
      const fileName = path.basename(file);
      const relativePath = path.relative(rootDir, file).replace(/\//g, "-");
      const targetPath = path.join(docsDir, category, relativePath);

      // Read file content
      const content = fs.readFileSync(file, "utf8");

      // Add front matter
      const frontMatter = `---
title: ${getTitle(fileName, content)}
sidebar_label: ${getSidebarLabel(fileName)}
---

`;

      // Write file with front matter
      fs.writeFileSync(targetPath, frontMatter + content);
      console.log(`Copied: ${file} -> ${targetPath}`);
    });
  }
}

// Extract title from markdown content or filename
function getTitle(fileName, content) {
  // Try to extract first heading from content
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1];
  }

  // Fall back to filename without extension
  return fileName.replace(".md", "");
}

// Get sidebar label from filename
function getSidebarLabel(fileName) {
  return fileName.replace(".md", "").replace(/-/g, " ");
}

// Main function
function main() {
  try {
    createDirectories();
    const files = findMarkdownFiles();
    const categorized = categorizeFiles(files);
    generateIndexFiles(categorized);
    // copyFiles(categorized); // Uncomment to actually copy files

    console.log("\nScript completed successfully!");
    console.log(
      "To copy the files, uncomment the copyFiles line in the main function."
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
