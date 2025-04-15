import fs from "fs";
import path from "path";

export interface DocFile {
  id: string;
  title: string;
  path: string;
  type: "file" | "directory";
  children?: DocFile[];
}

/**
 * Reads the documentation directory structure and contents
 *
 * @param dir - The absolute path to the documentation directory
 * @param parentPath - The relative path from the docs root (used for recursion)
 * @returns An array of DocFile objects representing the directory structure
 *
 * Used by: GET /api/docs?action=list
 *
 * SERVER-ONLY - Uses fs module
 */
export function getDocFiles(dir: string, parentPath: string = ""): DocFile[] {
  console.log(`Reading documentation directory: ${dir}`);

  if (!fs.existsSync(dir)) {
    console.warn(`Documentation directory not found: ${dir}`);
    return [];
  }

  const items = fs.readdirSync(dir);
  console.log(`Found ${items.length} items in ${dir}`);

  try {
    return items
      .filter((item) => !item.startsWith(".")) // Skip hidden files
      .map((item) => {
        try {
          const fullPath = path.join(dir, item);
          const relativePath = path.join(parentPath, item);
          const stats = fs.statSync(fullPath);

          // Generate a title from the filename
          const ext = path.extname(item);
          const rawName = path.basename(item, ext);
          const title = rawName
            .replace(/_/g, " ")
            .replace(/-/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          if (stats.isDirectory()) {
            console.log(`Processing directory: ${relativePath}`);
            return {
              id: relativePath,
              title,
              path: relativePath,
              type: "directory" as const,
              children: getDocFiles(fullPath, relativePath),
            };
          } else {
            // Only include markdown files
            if (ext.toLowerCase() === ".md") {
              console.log(`Found markdown file: ${relativePath}`);
              return {
                id: relativePath,
                title,
                path: fullPath,
                type: "file" as const,
              };
            }
            return null;
          }
        } catch (error) {
          console.error(`Error processing file ${item}:`, error);
          return null;
        }
      })
      .filter(Boolean) as DocFile[];
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

/**
 * Reads the content of a markdown file
 *
 * @param filePath - The absolute path to the markdown file
 * @returns The content of the file as a string, or an error message
 *
 * Used by: GET /api/docs?action=content&path={filePath}
 *
 * SERVER-ONLY - Uses fs module
 */
export function getDocContent(filePath: string): string {
  console.log(`Attempting to read file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return "File not found";
  }

  const content = fs.readFileSync(filePath, "utf8");
  console.log(`Successfully read file (${content.length} bytes): ${filePath}`);
  return content;
}

/**
 * Simple slugify function to create IDs from titles
 *
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}
