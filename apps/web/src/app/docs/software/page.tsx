import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

export const metadata = {
  title: "Authentication Documentation",
  description: "Documentation for the authentication systems",
};

export default async function AuthenticationDocPage() {
  // Read the markdown file
  const markdownFilePath = path.join(
    process.cwd(),
    "docs/project-docs/authentication.md"
  );
  const markdownContent = fs.readFileSync(markdownFilePath, "utf8");

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">
        Authentication Documentation
      </h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
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
