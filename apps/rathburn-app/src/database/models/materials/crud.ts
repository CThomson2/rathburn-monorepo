import { withDatabase } from "../../index";
import * as t from "@/types/models";
import { UpdateFields } from "@/types/models/materials/crud";

/**
 * Implementation of CRUD operations for the Materials model
 */
export const materialsCrud = {
  /**
   * Create a new material in the database
   */
  create: async (data: t.MaterialPostParams): Promise<t.Material> => {
    return withDatabase((db) =>
      db.raw_materials.create({
        data: {
          ...data,
          chemical_props: data.chemical_props || undefined,
        },
      })
    );
  },

  /**
   * Update specific fields of a material
   * Uses Partial to allow updating only some fields
   */
  update: async (
    id: number,
    data: Partial<Pick<t.MaterialBase, UpdateFields>>
  ): Promise<t.Material> => {
    return withDatabase((db) =>
      db.raw_materials.update({
        where: { material_id: id },
        data,
      })
    );
  },

  /**
   * Delete a material by ID
   */
  delete: async (id: number): Promise<void> => {
    await withDatabase((db) =>
      db.raw_materials.delete({
        where: { material_id: id },
      })
    );
  },

  /**
   * Get a material by ID
   */
  get: async (id: number): Promise<t.Material> => {
    const material = await withDatabase((db) =>
      db.raw_materials.findUniqueOrThrow({
        where: { material_id: id },
      })
    );

    // Add computed fields
    return {
      ...material,
      chemical_group_name: material.chemical_group || "Unknown",
    };
  },

  /**
   * Get materials with filtering and pagination
   */
  getAll: async (
    params: t.MaterialQueryParams
  ): Promise<t.MaterialsResponse> => {
    const {
      page = 1,
      limit = 50,
      sortField = "material_id",
      sortOrder = "asc",
      chemicalGroup,
    } = params;

    const offset = (page - 1) * limit;

    return withDatabase(async (db) => {
      // Build where clause
      const where = chemicalGroup?.length
        ? { chemical_group: { in: chemicalGroup } }
        : {};

      // Get the total count
      const total = await db.raw_materials.count({ where });

      // Get paginated data
      const rows = await db.raw_materials.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: offset,
        take: limit,
      });

      // Transform and add computed fields
      const materials = rows.map((row) => ({
        ...row,
        chemical_group_name: row.chemical_group || "Unknown",
      }));

      return { materials, total };
    });
  },

  /**
   * Get materials grouped by chemical group
   */
  getByChemicalGroup: async (): Promise<{
    groups: string[];
    count: number;
  }> => {
    return withDatabase(async (db) => {
      const results = await db.raw_materials.groupBy({
        by: ["chemical_group"],
        _count: true,
      });

      // Extract group names, filtering out nulls
      const groups = results
        .filter((r) => r.chemical_group !== null)
        .map((r) => r.chemical_group || "Unknown");

      return {
        groups,
        count: groups.length,
      };
    });
  },
};
