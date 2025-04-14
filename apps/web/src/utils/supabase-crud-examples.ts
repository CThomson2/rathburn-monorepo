/**
 * This file contains examples of how to use the SupabaseCRUD utility class.
 * These examples are for demonstration purposes and are not meant to be run directly.
 */

import { createCRUD } from "./crud";
import { Tables } from "@/types/models/database.types";

// Example 1: Basic CRUD operations on raw_materials table
export async function rawMaterialsExample() {
  // Create a typed CRUD instance for raw_materials table with material_id as the primary key
  const rawMaterialsCrud = createCRUD("raw_materials", "material_id");

  // Fetch all raw materials
  const allMaterials = await rawMaterialsCrud.fetchAll();
  console.log("All materials:", allMaterials.data);

  // Fetch a single raw material by ID
  const materialId = 1;
  const singleMaterial = await rawMaterialsCrud.fetchById(materialId);
  console.log("Single material:", singleMaterial.data);

  // Create a new raw material
  const newMaterial = {
    material_name: "New Test Material",
    cas_number: "123-45-6",
    drum_volume: 200,
    material_code: "TEST-001",
  };

  const createdMaterial = await rawMaterialsCrud.create(newMaterial);
  console.log("Created material:", createdMaterial.data);

  // Update a raw material
  const updatedData = {
    material_name: "Updated Material Name",
    description: "Updated description",
  };

  const updatedMaterial = await rawMaterialsCrud.update(
    createdMaterial.data!.material_id,
    updatedData
  );
  console.log("Updated material:", updatedMaterial.data);

  // Delete a raw material
  const deleteResult = await rawMaterialsCrud.delete(
    createdMaterial.data!.material_id
  );
  console.log("Delete result:", deleteResult);
}

// Example 2: Advanced queries and joins
export async function advancedQueriesExample() {
  // Create typed CRUD instances
  const ordersCrud = createCRUD("stock_order", "order_id");
  const drumsCrud = createCRUD("stock_drum", "drum_id");

  // Select orders with related information using joins
  const recentOrders = await ordersCrud.select({
    columns: ["order_id", "po_number", "date_ordered"],
    joins: {
      // Join to order_detail table
      order_detail: ["detail_id", "material_name", "drum_quantity"],
      // Join to ref_suppliers table using foreignTable option
      supplier: {
        foreignTable: "ref_suppliers",
        columns: ["supplier_name"],
        table: "ref_suppliers",
      },
    },
    filters: [
      // Filter for recent orders from the last 30 days
      {
        column: "date_ordered",
        operator: "gte",
        value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    orderBy: [{ column: "date_ordered", ascending: false }],
    limit: 10,
  });

  console.log("Recent orders with details:", recentOrders.data);

  // Count drums by status
  const activeDrumCount = await drumsCrud.count([
    { column: "status", operator: "eq", value: "in_stock" },
  ]);

  console.log("Active drums count:", activeDrumCount.data);

  // Select drums with complex filters
  const specificDrums = await drumsCrud.select({
    columns: ["drum_id", "material", "status", "fill_level"],
    filters: [
      { column: "status", operator: "in", value: ["in_stock", "allocated"] },
      { column: "fill_level", operator: "gt", value: 50 },
    ],
    orderBy: [{ column: "status" }, { column: "fill_level", ascending: false }],
  });

  console.log("Specific drums:", specificDrums.data);
}

// Example 3: RPC function calls
export async function rpcFunctionsExample() {
  // Create a generic CRUD instance for RPC calls
  const anyTableCrud = createCRUD("raw_materials");

  // Call the mass_to_volume function
  const volumeResult = await anyTableCrud.rpc<number>("mass_to_volume", {
    material_id: 1,
    weight: 100,
  });

  console.log("Calculated volume:", volumeResult.data);

  // Call the get_drum_inventory function
  const drumInventory = await anyTableCrud.rpc<Tables<"vw_goods_inwards">[]>(
    "get_drum_inventory",
    { material: "Acetone" }
  );

  console.log("Drum inventory:", drumInventory.data);
}

// Example 4: Batch operations
export async function batchOperationsExample() {
  const drumsCrud = createCRUD("stock_drum", "drum_id");

  // Update multiple drums at once
  const updateManyResult = await drumsCrud.updateMany({ status: "allocated" }, [
    { column: "status", operator: "eq", value: "in_stock" },
    { column: "order_detail_id", operator: "eq", value: 123 },
  ]);

  console.log("Updated drums:", updateManyResult.data);

  // Delete multiple drums (with safety filter)
  const deleteManyResult = await drumsCrud.deleteMany([
    { column: "status", operator: "eq", value: "decommissioned" },
    { column: "fill_level", operator: "eq", value: 0 },
  ]);

  console.log("Delete result:", deleteManyResult);
}

// Example 5: Error handling
export async function errorHandlingExample() {
  const suppliersCrud = createCRUD("ref_suppliers", "supplier_id");

  try {
    // Attempt to create a supplier with missing required fields
    const invalidSupplier = {
      // Missing supplier_name which is required
      city: "Test City",
    };

    const result = await suppliersCrud.create(invalidSupplier);

    if (result.error) {
      console.error("Error creating supplier:", result.error);
      // Handle the error appropriately
      return;
    }

    console.log("Created supplier:", result.data);
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

// Example 6: Using TypeScript types with the CRUD utility
export async function typedExampleWithProducts() {
  // Create a typed CRUD instance
  const productsCrud = createCRUD("products", "product_id");

  // TypeScript knows the exact shape of the data
  const products = await productsCrud.fetchAll();

  if (products.data) {
    // TypeScript knows products.data is Array<Tables<'products'>>
    products.data.forEach((product) => {
      // Autocomplete works for all product properties
      console.log(
        `Product: ${product.name}, SKU: ${product.sku}, Grade: ${product.grade}`
      );
    });
  }

  // TypeScript helps with creating records too
  const newProduct = {
    name: "New Product",
    sku: "NP-001",
    grade: "A",
    // If you uncomment this line, TypeScript will show an error because 'invalid_field' doesn't exist
    // invalid_field: 'this would cause a type error'
  };

  await productsCrud.create(newProduct);
}
