import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getDocFiles, getDocContent } from "@/lib/server/docs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  // Handle different API actions
  if (action === "list") {
    // Get the doc file structure
    const docsDirectory = path.join(process.cwd(), "docs");
    const docsTree = getDocFiles(docsDirectory);
    
    return NextResponse.json({ docsTree });
  } 
  else if (action === "content") {
    // Get a specific file's content
    const filePath = searchParams.get("path");
    
    if (!filePath) {
      return NextResponse.json(
        { error: "No file path provided" },
        { status: 400 }
      );
    }
    
    try {
      const content = getDocContent(filePath);
      return NextResponse.json({ content });
    } catch (error) {
      console.error("Error reading file:", error);
      return NextResponse.json(
        { error: "Failed to read file" },
        { status: 500 }
      );
    }
  }
  
  // Default response for invalid requests
  return NextResponse.json(
    { error: "Invalid action. Use 'list' or 'content'" },
    { status: 400 }
  );
}