/**
 * Documentation Page Component
 *
 * This component renders markdown documentation from a .md file.
 *
 * How to render markdown from .md files:
 * 1. We use Node.js fs module to read the file from the filesystem
 * 2. We use ReactMarkdown to parse and render the markdown content
 * 3. We enhance ReactMarkdown with plugins for GitHub Flavored Markdown and syntax highlighting
 *
 * Note: You cannot directly import .md files in Next.js by default. Instead, we read them
 * using the fs module at build time (during SSR/SSG).
 *
 * Additional components you might want to add:
 * - DocLayout.tsx: A layout component for all documentation pages with sidebar navigation
 * - TableOfContents.tsx: To extract and display headings from the markdown
 * - SearchBar.tsx: To enable searching within documentation
 * - DocNavigation.tsx: For previous/next page navigation
 */

import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

export const metadata = {
  title: "Database Documentation",
  description: "Documentation for the database schema and models",
};

export default async function DatabaseDocPage() {
  // Read the markdown file at build time
  // You could make this dynamic by passing the filename as a parameter or route segment
  const markdownFilePath = path.join(
    process.cwd(),
    "docs/project-docs/authentication.md" // This should be updated to the correct database documentation path
  );
  const markdownContent = fs.readFileSync(markdownFilePath, "utf8");

  return (
    <div className="container mx-auto py-8">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* 
          ReactMarkdown converts markdown to React components
          - remarkGfm: Adds support for GitHub Flavored Markdown (tables, strikethrough, etc.)
          - rehypeHighlight: Adds syntax highlighting for code blocks
        */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
