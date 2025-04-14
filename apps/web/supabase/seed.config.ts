import { defineConfig } from "@snaplet/seed/config";
import { Client } from "pg";
import { SeedPg } from "@snaplet/seed/adapter-pg";

export default defineConfig({
  adapter: async () => {
    const client = new Client({
      connectionString:
        process.env.SUPABASE_DATABASE_URL ||
        "postgresql://postgres:51sA8WHVxFebPv1d@db.oizldvrjdjzhywkrnlvq.supabase.co:5432/postgres",
    });
    await client.connect();
    return new SeedPg(client);
  },
  // We only want to generate data for the public schema
  select: ["!*", "public.*", "!migrations"],
});
