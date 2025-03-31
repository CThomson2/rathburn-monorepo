# Stock Count Page Design

## Overview

The stock count page is a feature that allows users to count the stock of our raw materials inventory.

### Building a Stock Count Entry Page with NextJS and Supabase

1. Set Up the Supabase Table

First, let's create a table in Supabase for stock count entries:

- Go to your Supabase dashboard → Database → Tables
- Click "Create a new table"
- Name it stock_count_entries
- Add these columns:

- `id` (uuid, primary key, default: uuid_generate_v4())
- `material_id` (uuid or int, references your materials table if you have one)
- `material_name` (text, for easier data entry)
- `batch_number` (text, nullable)
- `location` (text)
- `quantity` (numeric)
- `unit_of_measure` (text)
- `counted_by` (uuid, references auth.users)
- `count_date` (timestamp with time zone, default: now())
- `notes` (text, nullable)

2. Create the Supabase Client with Auth

Create a new file in your project:

```ts
// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

3. Enable Row Level Security (RLS)

Add an RLS policy to allow authenticated users to insert and read:

```sql
CREATE POLICY "Allow authenticated users to insert and read" ON stock_count_entries
FOR INSERT TO authenticated WITH CHECK (true);
```

3. Create the NextJS Page

Create a new page in your NextJS app:
