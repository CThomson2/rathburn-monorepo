import path from "path";
import { DocsBrowser } from "@/components/docs/docs-browser";
import { fetchDocTree } from "@/lib/docs";
import { getDocFiles, getDocContent } from "@/lib/server/docs";

export const metadata = {
  title: "Documentation",
  description: "Documentation for the Rathburn platform",
};

export default async function DocsPage() {
  // Get documentation file structure - using server-side functions directly since this is a Server Component
  const docsDirectory = path.join(process.cwd(), "docs");
  const docsTree = getDocFiles(docsDirectory);

  // Add our barcode integration markdown files
  const mobileDocsDir = path.join(process.cwd(), "apps/mobile/docs");
  const barcodeIntegrationPath = path.join(mobileDocsDir, "barcode-integration.md");
  const supabaseIntegrationPath = path.join(mobileDocsDir, "notes/supabase-integration.md");
  
  // Sample content from the attached markdown files - with fallbacks if files don't exist
  let barcodeIntegrationContent = getDocContent(barcodeIntegrationPath);
  if (barcodeIntegrationContent === "File not found") {
    barcodeIntegrationContent = `# Barcode Scanning Integration Guide

This document explains how the barcode scanning mobile app integrates with the main web application.

## Architecture Overview

- **NextJS Web App** runs on main domain
- **Vite Mobile App** optimized for barcode scanning
- **Supabase Database** as the central data store
- **API Integration** ensures data synchronization

## Deployment Strategy

The mobile app is deployed on a subdomain with proper CORS configuration.

## API Integration

The mobile app uses the NextJS API routes for data transmission, with proper authentication and offline capability.
`;
  }
  
  let supabaseIntegrationContent = getDocContent(supabaseIntegrationPath);
  if (supabaseIntegrationContent === "File not found") {
    supabaseIntegrationContent = `# Supabase Integration for Barcode Scanner

## Setup Instructions

### Create Supabase Client

\`\`\`typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
\`\`\`

## API Functions

- saveScan(scanData)
- getRecentScans(limit)

## Offline Support

Implements a queue system for offline operations that sync when connection is restored.
`;
  }

  // Special files to highlight
  const specialFiles = [
    { id: "barcode-integration", title: "Barcode Integration Guide", content: barcodeIntegrationContent },
    { id: "supabase-integration", title: "Supabase Integration for Barcode Scanner", content: supabaseIntegrationContent }
  ];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-primary">
        Documentation
      </h1>
      <DocsBrowser docsTree={docsTree} specialFiles={specialFiles} />
    </div>
  );
}