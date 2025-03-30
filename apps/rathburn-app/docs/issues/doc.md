These database operations could be organized in several ways, but here's the recommended approach considering modern React patterns:

1. **Server Actions (Recommended)**

```typescript:app/actions/inventory.ts
'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { type Database } from '@/types/supabase'

interface InventoryItem {
  id: string
  // ... other fields
}

export async function getInventoryItems() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Error fetching items: ${error.message}`)
  }

  return data
}

export async function addInventoryItem(item: Partial<InventoryItem>) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data, error } = await supabase
    .from('inventory_items')
    .insert([item])
    .select()

  if (error) {
    throw new Error(`Error adding item: ${error.message}`)
  }

  return data[0]
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) {
    throw new Error(`Error updating item: ${error.message}`)
  }

  return data[0]
}
```

2. **API Routes Alternative**
   If you need more complex logic or want to expose these endpoints to external services, you could structure them as API routes:

```typescript:app/api/inventory/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  // ... implementation
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const item = await request.json()
  // ... implementation
}
```

3. **Data Layer Pattern**
   For more complex applications, you might want to create a data layer that can be used by both server actions and API routes:

```typescript:lib/db/inventory.ts
import { type Database } from '@/types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

export class InventoryRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getItems() {
    // Implementation
  }

  async addItem(item: Partial<InventoryItem>) {
    // Implementation
  }

  async updateItem(id: string, updates: Partial<InventoryItem>) {
    // Implementation
  }
}
```

Key Improvements I've Made:

1. Added proper TypeScript types
2. Improved error handling by throwing errors instead of just logging
3. Used proper Supabase client initialization for server-side code
4. Added proper return type handling
5. Structured the code to be more maintainable and reusable

Recommendations:

1. Use Server Actions if you're using Next.js 13+ with App Router - they're the most straightforward and efficient approach
2. Implement proper error handling and TypeScript types
3. Consider implementing request validation (you could use Zod for this)
4. Add proper authentication checks
5. Consider implementing rate limiting for these endpoints
6. Use TanStack Query on the client side to manage the state and caching of these operations

Would you like me to expand on any of these aspects or show how to implement any specific part in more detail?
