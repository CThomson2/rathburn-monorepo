"use client";

import React from "react";
import { ScrollArea } from "@/components/core/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

interface DocContentProps {
  title: string;
  content: string;
}

export default function DocContent({ title, content }: DocContentProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b p-4">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <ScrollArea className="flex-1 p-6">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Custom rendering for code blocks with language highlighting
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <div className="not-prose relative mt-4">
                    <div className="absolute top-0 right-0 bg-muted text-muted-foreground px-2 py-1 text-xs font-mono rounded-bl">
                      {match[1]}
                    </div>
                    <pre className={className} {...props}>
                      {children}
                    </pre>
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              // Add padding and styling to tables
              table({ node, className, children, ...props }) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="border-collapse border border-border w-full" {...props}>
                      {children}
                    </table>
                  </div>
                );
              },
              // Style table headers
              th({ node, className, children, ...props }) {
                return (
                  <th className="border border-border bg-muted p-2 text-left font-semibold" {...props}>
                    {children}
                  </th>
                );
              },
              // Style table cells
              td({ node, className, children, ...props }) {
                return (
                  <td className="border border-border p-2" {...props}>
                    {children}
                  </td>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </ScrollArea>
    </div>
  );
}