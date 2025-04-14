import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  // Log to server console
  console.log("DATABASE_URL at runtime:", process.env.DATABASE_URL);

  let testQueryResult = "Query not executed";
  let connectionSuccess = false;

  try {
    // Test database connection
    try {
      const test = await prisma.$queryRaw<{ test: number }[]>`
        SELECT MAX(product_id) as test
        FROM public.products
    `;
      testQueryResult = `Test query result: ${test[0]?.test ?? "N/A"}`;
      connectionSuccess = true;
      console.log(testQueryResult);
    } catch (error) {
      console.error("Database connection error:", error);
    }
  } catch (error) {
    if (error instanceof Error) {
      testQueryResult = `Error: ${error.message}`;
    } else {
      testQueryResult = "An unknown error occurred";
    }
  }

  // Only include non-sensitive environment variables
  const envVariables = {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    // Redacted password for security
    DB_PASSWORD: process.env.DB_PASSWORD
      ? process.env.DB_PASSWORD.slice(0, process.env.DB_PASSWORD.length / 2) +
        "[REDACTED]"
      : undefined,
    DATABASE_URL: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:(.{0,5})[^:@]+@/, ":$1[REDACTED]@")
      : undefined,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    DATABASE_POOL_SIZE: process.env.DATABASE_POOL_SIZE,
    DATABASE_CONNECTION_TIMEOUT: process.env.DATABASE_CONNECTION_TIMEOUT,
    // Include test results
    testQueryResult,
    connectionSuccess,
  };

  return NextResponse.json(envVariables);
}
