// app/api/inventory/materials/route.ts
import { NextResponse } from 'next/server';
import { createNewClient } from '@/lib/supabase/server';

/**
 * GET /api/inventory/materials
 *
 * Fetches all materials from inventory database and returns them as JSON.
 * Materials are sorted alphabetically by name.
 *
 * @returns {NextResponse} JSON response containing an array of materials
 * @throws {NextResponse} 500 error with JSON response containing error string
 */
export async function GET() {
  try {
    const supabase = createNewClient();
    
    const { data, error } = await supabase
      .schema("inventory")
      .from("materials")
      .select("*")
      .order("name");

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Materials fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}
