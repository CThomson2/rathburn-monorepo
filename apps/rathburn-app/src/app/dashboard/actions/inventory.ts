"use server"

import { createClient } from "@/lib/supabase/server";

/**
 * Get inventory data from the database
 * This action queries stock_drums and stock_materials tables
 * @returns {Promise<{data: any, error: any}>}
 */
export async function getInventory() {
    const supabase = createClient();
    
    const { data: drums, error: drumsError } = await supabase
        .from("stock_drums")
        .select("*")
        .order("created_at", { ascending: false });

    const { data: materials, error: materialsError } = await supabase
    
}