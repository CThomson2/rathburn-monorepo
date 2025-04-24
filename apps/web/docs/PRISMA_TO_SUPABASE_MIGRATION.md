# Prisma to Supabase Migration Guide

This document outlines our strategy for migrating from Prisma to Supabase for database access in our application.

## Background

We are transitioning our database layer from Prisma to Supabase. This migration will be done gradually to ensure stability while we update the codebase.

## Migration Strategy

Our approach is to maintain backward compatibility while gradually migrating to Supabase:

1. Keep existing Prisma types as legacy
2. Introduce new Supabase-based types
3. Provide a unified database access layer that works with both systems
4. Gradually update components to use the new types and utilities

## New Type System

We've updated our model types to support both Prisma and Supabase:

### Legacy Prisma Types

These are still available for backward compatibility:

```typescript
import { PrismaNewDrums, PrismaOrders } from "@/types/models/base";

// Use old Prisma types
const orders: PrismaOrders = {
  /* ... */
};
```

### New Supabase Types

For new development, use these types instead:

```typescript
import { Drum, Order, NewStock } from "@/types/models/base";

// Use new Supabase-based types
const drum: Drum = {
  /* ... */
};
```

For custom tables, use the `TableType` helper:

```typescript
import { TableType } from "@/types/models/base";
import { Database } from "@/types/models/supabase"

// Get type for any table
type User = TableType<"users">;
```

## Database Access Layer

We've created a unified database access layer in `src/lib/database.ts` that supports both Prisma and Supabase operations:

### Basic Usage with New Helpers

For most operations, use these type-safe helpers:

```typescript
import {
  selectFromTable,
  insertIntoTable,
  updateTable,
  deleteFromTable,
} from "@/lib/database";

// Select all drums
const drums = await selectFromTable("stock_drum");

// Select with filters and pagination
const activeDrums = await selectFromTable("stock_drum", {
  filters: { status: "active" },
  limit: 20,
  offset: 0,
  orderBy: { column: "created_at", ascending: false },
});

// Insert
const newDrum = await insertIntoTable("stock_drum", {
  material: "Test",
  status: "active",
});

// Update
const updatedDrums = await updateTable(
  "stock_drum",
  { status: "inactive" },
  { id: 123 }
);

// Delete
await deleteFromTable("stock_drum", { id: 123 });
```

### Advanced Usage with Raw Queries

For more complex operations, use `executeDbOperation`:

```typescript
import { executeDbOperation } from "@/lib/database";

// Default provider (Supabase)
const result = await executeDbOperation(async (client) => {
  const { data } = await client
    .from("stock_drum")
    .select("*, ref_materials(name)")
    .eq("status", "active");
  return data;
});

// Explicitly use Prisma (legacy)
const result = await executeDbOperation(
  async (client) => {
    return client.stock_drum.findMany({
      where: { status: "active" },
      include: { ref_materials: true },
    });
  },
  { provider: "prisma" }
);
```

## Migration Steps for Existing Components

1. Import the new types from `@/types/models/base` instead of using Prisma types directly
2. Replace direct Prisma client usage with the new database helpers
3. Update type annotations to use the new Supabase-based types

### Before:

```typescript
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function getDrums() {
  const drums = await prisma.stock_drum.findMany({
    where: { status: "active" },
  });
  return drums;
}

type DrumWithMaterial = Prisma.stock_drumGetPayload<{
  include: { ref_materials: true };
}>;
```

### After:

```typescript
import { selectFromTable } from "@/lib/database";
import { Drum, TableType } from "@/types/models/base";

async function getDrums() {
  const drums = await selectFromTable("stock_drum", {
    filters: { status: "active" },
  });
  return drums;
}

type DrumWithMaterial = Drum & {
  ref_materials: TableType<"ref_materials">;
};
```

## Testing the Migration

When updating components:

1. Start with non-critical features
2. Verify that data is correctly fetched and displayed
3. Check that all type safety is maintained
4. Gradually expand to more critical parts of the application

## Timeline

- Phase 1: Introduce compatibility layer and new types (current)
- Phase 2: Update non-critical components to use new helpers
- Phase 3: Update critical components
- Phase 4: Remove Prisma dependency entirely

## Questions and Support

If you have questions about the migration process, please reach out to the development team.
