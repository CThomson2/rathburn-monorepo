import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

// This file redirects /inventory to /inventory/dashboard
export function GET() {
  return NextResponse.redirect(
    new URL(
      "/inventory/drums",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    )
  );
}
