import { NextResponse } from "next/server";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// This is a fallback route that returns mock data when the original route is excluded from builds
export async function GET() {
  try {
    // Return mock data that matches the structure of the original response
    return NextResponse.json({
      groups: [
        {
          chemical_group: "Solvents",
          total_stock: 10,
          material_count: 5,
          percentage: "40.0",
          materials: [
            {
              id: 1,
              name: "Acetone",
              stock: 3,
              cas_number: "67-64-1"
            },
            {
              id: 2,
              name: "Methanol",
              stock: 7,
              cas_number: "67-56-1"
            }
          ]
        },
        {
          chemical_group: "Acids",
          total_stock: 15,
          material_count: 3,
          percentage: "60.0",
          materials: [
            {
              id: 3,
              name: "Sulfuric Acid",
              stock: 5,
              cas_number: "7664-93-9"
            },
            {
              id: 4,
              name: "Hydrochloric Acid",
              stock: 10,
              cas_number: "7647-01-0"
            }
          ]
        }
      ],
      totalStock: 25
    });
  } catch (error) {
    console.error("Error in fallback material groups data:", error);
    return NextResponse.json(
      { error: "Failed to fetch material groups data" },
      { status: 500 }
    );
  }
}