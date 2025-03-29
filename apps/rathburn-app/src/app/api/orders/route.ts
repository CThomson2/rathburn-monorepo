import { NextResponse } from "next/server";
import { queries as q } from "@/database/models/orders/queries";
import { withDatabase, DATABASE_ROUTE_CONFIG } from "@/database";
import { PrismaClientKnownRequestError } from "@prisma-client/runtime/library";
import { StockOrderFormValues } from "@/types/models";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = DATABASE_ROUTE_CONFIG.dynamic;
export const fetchCache = DATABASE_ROUTE_CONFIG.fetchCache;

/**
 * GET handler for fetching orders data
 *
 * @param req - The incoming request
 * @returns JSON response with orders data or error
 */
export async function GET(req: Request) {
  // Extract search params from the request URL
  // For example, from: /api/inventory/activity?page=2&limit=10
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  // Get limit (items per page) from URL params, defaulting to 50
  // This allows requests like ?limit=10 to show 10 items per page
  const limit = parseInt(searchParams.get("limit") || "30");

  console.log(
    `[API] Fetching orders with page=${page}, limit=${limit}, URL=${req.url}`
  );

  try {
    const orders = await q.getOrders({ page, limit });
    console.log(`[API] Successfully fetched ${orders.orders.length} orders`);

    // Return response with CORS and cache control headers
    return new NextResponse(JSON.stringify(orders), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[API] Error fetching orders:", error);

    // Return detailed error for debugging
    return new NextResponse(
      JSON.stringify({
        error: "Failed to fetch orders",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}

/**
 * POST handler for creating a new order
 *
 * @param req - The incoming request
 * @returns JSON response with the created order or error
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body: StockOrderFormValues = await req.json();
    const { supplier, po_number, date_ordered, order_details } = body;

    console.log(
      `[API] Creating new order with ${order_details.length} materials from ${supplier}`
    );

    // Use withDatabase to create a new order
    const result = await withDatabase(async (db) => {
      // First, find the supplier_id
      const supplierRecord = await db.suppliers.findFirst({
        where: {
          supplier_name: supplier,
        },
        select: {
          supplier_id: true,
          supplier_name: true,
        },
      });

      if (!supplierRecord) {
        throw new Error(`Supplier "${supplier}" not found`);
      }

      // Create the stock_order record
      const stockOrder = await db.stock_orders.create({
        data: {
          po_number,
          date_ordered: new Date(date_ordered),
          supplier_id: supplierRecord.supplier_id,
        },
      });

      // Create stock_order_details records for each material
      const orderDetailsPromises = order_details.map(async (detail) => {
        // Find material_id
        console.log(
          `[API] Processing order detail for material: "${detail.material}"`
        );

        const materialRecord = await db.raw_materials.findFirst({
          where: {
            material_name: detail.material,
          },
          select: {
            material_id: true,
          },
        });

        console.log(`[API] Found material record:`, materialRecord);

        if (!materialRecord) {
          console.log(
            `[API] ERROR: Material "${detail.material}" not found in database`
          );
          throw new Error(`Material "${detail.material}" not found`);
        }

        // Log the values we're about to insert
        console.log(`[API] Inserting stock_order_details with values:`, {
          order_id: stockOrder.order_id,
          material_id: materialRecord.material_id,
          material_name: detail.material,
          drum_quantity: detail.drum_quantity,
          drum_weight: detail.drum_weight,
        });

        // Create stock_order_details record using raw SQL
        const orderDetailResult = await db.$queryRaw<
          Array<{
            detail_id: number;
            order_id: number;
            material_id: number;
            material_name: string;
            drum_quantity: number;
            status: string;
          }>
        >`
          INSERT INTO "inventory"."stock_order_details" 
          ("order_id", "material_name", "drum_quantity", "status", "drum_weight")
          VALUES (
            ${stockOrder.order_id}, 
            ${detail.material}, 
            ${detail.drum_quantity}, 
            'en route',
            ${detail.drum_weight || null}
          )
          RETURNING "detail_id", "order_id", "material_id", "material_name", "drum_quantity", "status";
        `;

        console.log(`[API] Created stock_order_detail:`, orderDetailResult[0]);

        // Fetch the stock_drums records that were automatically created by the database trigger
        // Using a relation query since direct filtering by order_detail_id isn't working
        console.log(
          `[API] Looking for stock_drums with order_detail_id = ${orderDetailResult[0].detail_id}`
        );

        try {
          // Try to get stock_drums through the relation
          const relatedStockDrums = await db.stock_order_details
            .findUnique({
              where: {
                detail_id: orderDetailResult[0].detail_id,
              },
              include: {
                stock_drums: true,
              },
            })
            .then((result) => result?.stock_drums || []);

          console.log(
            `[API] Found ${relatedStockDrums.length} auto-generated stock_drums records through relation for detail_id ${orderDetailResult[0].detail_id}`
          );

          return {
            detail: orderDetailResult[0],
            material: detail.material,
            drum_quantity: detail.drum_quantity,
            drums: relatedStockDrums,
          };
        } catch (error) {
          console.error("[API] Error fetching related stock_drums:", error);
          throw error;
        }
      });

      // Wait for all order details to be created
      const createdOrderDetails = await Promise.all(orderDetailsPromises);

      return {
        order: stockOrder,
        orderDetails: createdOrderDetails,
        supplier: supplierRecord,
      };
    });

    console.log(
      `[API] Successfully created order with ID: ${result.order.order_id}`
    );

    // Return the combined data in JSON
    return NextResponse.json(
      {
        success: true,
        order: result.order,
        orderDetails: result.orderDetails,
        supplier: result.supplier,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Error creating order:", error);

    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { order_id, supplier, po_number, date_ordered, ...otherData } = body;

    // Verify the order exists
    const order = await withDatabase(async (db) => {
      const existingOrder = await db.stock_orders.findUnique({
        where: { order_id: Number(order_id) }
      });
      
      if (!existingOrder) {
        return null;
      }

      // Update the order
      return await db.stock_orders.update({
        where: { order_id: Number(order_id) },
        data: {
          po_number,
          date_ordered: date_ordered ? new Date(date_ordered) : undefined,
          ...otherData
        }
      });
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order updated successfully', order }, { status: 200 });
  } catch (error) {
    console.error("[API] Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // Get order_id from URL params
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get("order_id");

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id parameter" }, { status: 400 });
    }

    const result = await withDatabase(async (db) => {
      // Verify the order exists
      const existingOrder = await db.stock_orders.findUnique({
        where: { order_id: Number(order_id) }
      });
      
      if (!existingOrder) {
        return null;
      }

      // Delete the order
      return await db.stock_orders.delete({
        where: { order_id: Number(order_id) }
      });
    });

    if (!result) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Order deleted successfully', order: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
