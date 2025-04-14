import { executeDbOperation } from "@/lib/database";
import type { DrumQueryParams, DrumsResponse, DrumBatch } from "@/types/models";
import type { DrumStatus, DrumLocation } from "@/types/models/drums/constant";
import { SupabaseClient } from "@supabase/supabase-js";

export const queries = {
  /**
   * Fetches drums from the database with pagination, sorting, and filtering options.
   *
   * This function supports both Supabase and Prisma clients, selecting the correct implementation
   * based on the client type. It retrieves drums from the "stock_drum" table, applying pagination,
   * sorting, and filtering based on the provided parameters.
   *
   * @param {DrumQueryParams} params - Query parameters including:
   *   - page: Page number for pagination (default is 1).
   *   - limit: Number of items per page (default is 50).
   *   - sortField: Database field to sort the results by (default is "drum_id").
   *   - sortOrder: Order direction, either "asc" or "desc" (default is "asc").
   *   - status: Array of drum statuses to filter the results.
   *
   * @returns {Promise<DrumsResponse>} A promise that resolves to an object containing:
   *   - drums: An array of DrumBatch objects, each representing a drum and its associated order details.
   *   - total: Total number of records matching the filter criteria.
   *
   * Throws an error if the database operation fails.
   */

  getDrums: async ({
    page = 1,
    limit = 50,
    sortField = "drum_id",
    sortOrder = "asc",
    status,
  }: DrumQueryParams): Promise<DrumsResponse> => {
    const offset = (page - 1) * limit;

    return executeDbOperation(async (client: SupabaseClient) => {
      let total: number;
      let rows: any[];

      // The implementation depends on the client type
      if ("from" in client) {
        // Supabase implementation
        // Count total records
        const { count, error: countError } = await client
          .from("stock_drum")
          .select("*", { count: "exact", head: true })
          .in("status", status || []);

        if (countError) throw countError;
        total = count || 0;

        // Get the actual data with pagination
        const { data, error } = await client
          .from("stock_drum")
          .select(
            `
            drum_id, 
            material_code,
            status,
            location,
            date_processed,
            created_at,
            updated_at,
            orders:stock_order(order_id, supplier, date_ordered)
          `
          )
          .in("status", status || [])
          .order(sortField as string, { ascending: sortOrder === "asc" })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        rows = data;
      } else {
        // Prisma fallback implementation
        // Safer approach using type casting to handle schema differences
        const prismaClient = client as any;

        // Count total
        total = await prismaClient.stock_drum.count({
          where: {
            status: { in: status },
          },
        });

        // Fetch data with basic filtering
        try {
          // First try with relationships if they exist
          rows = await prismaClient.stock_drum.findMany({
            where: {
              status: { in: status },
            },
            include: {
              orders: true,
            },
            orderBy: {
              [sortField]: sortOrder,
            },
            skip: offset,
            take: limit,
          });
        } catch (error) {
          // Fallback to basic query without relationships
          console.error("Error with relationships query:", error);
          rows = await prismaClient.stock_drum.findMany({
            where: {
              status: { in: status },
            },
            orderBy: {
              [sortField]: sortOrder,
            },
            skip: offset,
            take: limit,
          });
        }
      }

      // Process the results into the expected format
      // This processing works for both Prisma and Supabase results
      const drums = rows.map(
        (row: any) =>
          ({
            drum_id: row.drum_id,
            material: row.material_code || row.material,
            status: row.status as DrumStatus.Type,
            location: row.location as DrumLocation.Type | null,
            order_id: row.orders?.order_id || row.orders?.[0]?.order_id,
            supplier: row.orders?.supplier || row.orders?.[0]?.supplier,
            date_ordered:
              row.orders?.date_ordered || row.orders?.[0]?.date_ordered,
            date_processed: row.date_processed,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }) as DrumBatch
      );

      return { drums, total };
    });
  },
};
