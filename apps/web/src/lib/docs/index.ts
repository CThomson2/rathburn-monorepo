// Client-side docs module that interfaces with the API

export interface DocFile {
  id: string;
  title: string;
  path: string;
  type: "file" | "directory";
  children?: DocFile[];
}

/**
 * Fetches documentation structure from the API
 */
export async function fetchDocTree(): Promise<DocFile[]> {
  try {
    const response = await fetch(`/api/docs?action=list`);
    if (!response.ok) {
      throw new Error(`Failed to fetch doc structure: ${response.statusText}`);
    }
    const data = await response.json();
    return data.docsTree;
  } catch (error) {
    console.error("Error fetching doc structure:", error);
    return [];
  }
}

/**
 * Fetches content of a specific document from the API
 */
export async function fetchDocContent(filePath: string): Promise<string> {
  try {
    const response = await fetch(`/api/docs?action=content&path=${encodeURIComponent(filePath)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch doc content: ${response.statusText}`);
    }
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Error fetching doc content:", error);
    return "Failed to load document content";
  }
}

/**
 * Simple slugify function to create IDs from titles
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}