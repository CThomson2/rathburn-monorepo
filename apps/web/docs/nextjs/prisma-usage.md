# Prisma ORM Usage in Rathburn Dashboard

This document outlines how Prisma ORM is implemented and used throughout the Rathburn Dashboard application, along with best practices and important considerations.

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Prisma Implementation](#prisma-implementation)
3. [Usage Throughout Codebase](#usage-throughout-codebase)
4. [Dynamic vs Static Routes](#dynamic-vs-static-routes)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Database Architecture

The Rathburn Dashboard uses Prisma ORM to interact with a PostgreSQL database. The database schema is defined in Prisma schema files located in the `database/prisma` directory.

## Prisma Implementation

### Historical Context

Previously, the application used a direct approach to initialize Prisma in `database/client.ts`:

```typescript
import { PrismaClient } from "/prisma/generated/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Log the actual DATABASE_URL for debugging
console.log("Initializing Prisma with DATABASE_URL:", process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Current Implementation

The current implementation in `database/index.ts` provides a more robust approach:

```typescript
import { PrismaClient } from "./prisma/generated/client";

// This type allows us to add prisma to the global scope
declare global {
  var prisma: PrismaClient;
}

function createPrismaClient() {
  return new PrismaClient({
    log: ["query", "info", "warn", "error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// In development, we want to use a single instance across hot reloads
// In production, we want to create a new instance for each request
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Export a function to get the client that's safe for both static and dynamic contexts
export function getPrismaClient() {
  if (process.env.NODE_ENV === "production") {
    // In production, create a new client for each request
    return createPrismaClient();
  }
  // In development, reuse the global instance
  return prisma;
}

// Utility function to check if we're in a static context
export function isStaticContext() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

// Export a helper for route configuration
export const DATABASE_ROUTE_CONFIG = {
  dynamic: "force-dynamic" as const,
  fetchCache: "force-no-store" as const,
};

// Helper function to safely execute database operations
export async function withDatabase<T>(
  operation: (db: PrismaClient) => Promise<T>
): Promise<T> {
  const db = getPrismaClient();
  try {
    return await operation(db);
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  }
}
```

### Key Differences and Improvements

1. **Type Definition**:

   - The old approach used `global as unknown as { prisma: PrismaClient }`
   - The new approach uses a proper TypeScript declaration with `declare global { var prisma: PrismaClient; }`

2. **Environment Handling**:

   - Both implementations reuse a single Prisma instance in development
   - The new implementation offers a dedicated function `getPrismaClient()` that creates new instances in production

3. **Error Handling**:

   - The new implementation includes a `withDatabase` helper that wraps database operations in try/catch blocks

4. **Route Configuration**:
   - The new implementation provides standardized configuration for dynamic routes via `DATABASE_ROUTE_CONFIG`

## Usage Throughout Codebase

### In API Routes

API routes should use the `withDatabase` helper and the `DATABASE_ROUTE_CONFIG` exports:

```typescript
import { withDatabase, DATABASE_ROUTE_CONFIG } from "@/database";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

export async function GET(req: Request) {
  return await withDatabase(async (db) => {
    // Use db instead of prisma
    const results = await db.someTable.findMany();
    return Response.json({ results });
  });
}
```

### In Components and Server Actions

For server components and server actions, you can use the `prisma` export directly:

```typescript
import { prisma } from "@/database";

export async function MyServerComponent() {
  const data = await prisma.someTable.findMany();
  return <div>{/* Render data */}</div>;
}
```

## Dynamic vs Static Routes

Next.js tries to statically optimize routes at build time. Routes that use database queries may fail during this optimization process.

### Why `undefined` Union Type May Be Necessary

In the new implementation, you might want to add `undefined` to the global Prisma type:

```typescript
declare global {
  var prisma: PrismaClient | undefined;
}
```

This is potentially beneficial because:

1. **Build-time safety**: During the build process, global.prisma might not be initialized yet
2. **Type safety**: It makes the code more explicit about the need to check for undefined values
3. **Error prevention**: It forces explicit null checks when accessing the global.prisma variable

The older approach using `global as unknown as { prisma: PrismaClient }` asserted that the property always exists without type checking, which could lead to runtime errors if the property is accessed before initialization.

## Best Practices

1. **Always use the `withDatabase` helper in API routes**:

   ```typescript
   return await withDatabase(async (db) => {
     // Database operations
   });
   ```

2. **Include dynamic directives in all database-dependent routes**:

   ```typescript
   export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
   export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;
   ```

3. **Use proper transaction handling for multiple operations**:

   ```typescript
   return await withDatabase(async (db) => {
     return await db.$transaction(async (tx) => {
       // Multiple operations using tx instead of db
     });
   });
   ```

4. **Use select to limit returned fields**:

   ```typescript
   const users = await db.users.findMany({
     select: {
       id: true,
       name: true,
       // Only fields you need
     },
   });
   ```

5. **Use appropriate error handling**:
   ```typescript
   try {
     return await withDatabase(async (db) => {
       // Database operations
     });
   } catch (error) {
     console.error("Operation failed:", error);
     return Response.json(
       { error: "Database operation failed" },
       { status: 500 }
     );
   }
   ```

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**:

   - Ensure all imports are using the correct paths
   - For API routes, prefer relative imports (e.g., `../../../../../database`) over path aliases (e.g., `@/database`)

2. **Build Errors**:

   - Use the `build-workaround.sh` script to temporarily disable problematic routes during build
   - Add `dynamic = "force-dynamic"` to all database-accessing routes

3. **Connection Pool Exhaustion**:

   - Consider setting max connections in Prisma configuration
   - Ensure connections are properly closed in edge cases

4. **TypeScript Errors**:
   - Ensure the global declaration includes `undefined` if appropriate
   - Use strict null checking to catch potential undefined access

### Quick Fixes

If you encounter database-related build errors:

1. Add the dynamic directive to the problematic route:

   ```typescript
   export const dynamic = "force-dynamic";
   ```

2. Run the build-workaround script:

   ```bash
   ./scripts/build-workaround.sh
   ```

3. Check environment variables:

   ```bash
   echo $DATABASE_URL
   ```

4. Verify Prisma schema and migration status:
   ```bash
   npx prisma migrate status
   ```

In development, a single client instance is reused to avoid exhausting database connections due to hot-reloading, which can create multiple instances. In production, creating a new client per request ensures:
Concurrency: Multiple requests can be handled simultaneously without blocking.
Isolation: Each request has its own client, reducing the risk of data leakage between requests.
Resource Management: Ensures proper connection pooling and cleanup, preventing resource exhaustion.
It's not about a single client handling one query at a time, but about managing connections efficiently and securely.
