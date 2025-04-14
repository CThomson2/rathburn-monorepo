import { NextResponse } from "next/server";
import { StockOrderFormValues } from "@/features/orders/types";
import {
  executeDbOperation,
  getPaginatedData,
  selectFromTable,
  insertIntoTable,
  updateTable,
  deleteFromTable,
  getById,
} from "@/lib/database";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET handler for fetching orders data
 *
 * @param req - The incoming request
 * @returns JSON response with orders data or error
 */
export async function GET(req: Request) {
  // Extract search params from the request URL
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");

  console.log(
    `[API] Fetching orders with page=${page}, limit=${limit}, URL=${req.url}`
  );

  try {
    // Convert status string to array if provided
    const statusFilter = status ? status.split(",") : undefined;

    // Use the paginated data helper to fetch orders
    const result = await getPaginatedData("stock_order", {
      page,
      pageSize: limit,
      sortBy: "date_ordered",
      sortOrder: "desc",
    });

    // Format the response
    const formattedOrders = result.data.map((order) => ({
      ...order,
      date_ordered:
        order.date_ordered && new Date(order.date_ordered).toISOString(),
      created_at: order.created_at && new Date(order.created_at).toISOString(),
      updated_at: order.updated_at && new Date(order.updated_at).toISOString(),
      // eta_start: order.eta_start && new Date(order.eta_start).toISOString(),
      // eta_end: order.eta_end && new Date(order.eta_end).toISOString(),
    }));

    const orders = {
      orders: formattedOrders,
      total: result.total,
    };

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

    return executeDbOperation(async (client) => {
      // First, find the supplier_id
      const { data: supplierRecord, error: supplierError } = await client
        .from("ref_suppliers")
        .select("supplier_id, supplier_name")
        .eq("supplier_name", supplier)
        .maybeSingle();

      if (supplierError) {
        throw supplierError;
      }

      if (!supplierRecord) {
        throw new Error(`Supplier "${supplier}" not found`);
      }

      // Create the stock_order record
      const { data: stockOrder, error: orderError } = await client
        .from("stock_order")
        .insert({
          po_number,
          date_ordered: new Date(date_ordered).toISOString(),
          supplier_id: supplierRecord.supplier_id,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order details records for each material
      const orderDetailsPromises = order_details.map(async (detail) => {
        // Find material record
        console.log(
          `[API] Processing order detail for material: "${detail.material}"`
        );

        const { data: materialRecord, error: materialError } = await client
          .from("ref_materials")
          .select("code, value")
          .eq("value", detail.material)
          .maybeSingle();

        if (materialError) {
          throw materialError;
        }

        if (!materialRecord) {
          console.log(
            `[API] ERROR: Material "${detail.material}" not found in database`
          );
          throw new Error(`Material "${detail.material}" not found`);
        }

        // Log the values we're about to insert
        console.log(`[API] Inserting order_detail with values:`, {
          order_id: stockOrder.order_id,
          material_name: detail.material,
          material_code: materialRecord.code,
          drum_quantity: detail.drum_quantity,
          drum_weight: detail.drum_weight,
        });

        // Create order_detail record
        const { data: orderDetail, error: detailError } = await client
          .from("order_detail")
          .insert({
            order_id: stockOrder.order_id,
            material_name: materialRecord.value,
            material_code: materialRecord.code,
            drum_quantity: detail.drum_quantity,
            drum_weight: detail.drum_weight || null,
            status: "en_route",
          })
          .select()
          .single();

        if (detailError) {
          throw detailError;
        }

        // Fetch any stock_drums that were automatically created by database triggers
        const { data: stockDrums, error: stockDrumsError } = await client
          .from("stock_drum")
          .select("*")
          .eq("order_detail_id", orderDetail.detail_id);

        if (stockDrumsError) {
          throw stockDrumsError;
        }

        console.log(
          `[API] Found ${stockDrums.length} auto-generated stock_drum records for detail_id ${orderDetail.detail_id}`
        );

        return {
          detail: orderDetail,
          material: detail.material,
          drum_quantity: detail.drum_quantity,
          drums: stockDrums || [],
        };
      });

      // Wait for all order details to be created
      const createdOrderDetails = await Promise.all(orderDetailsPromises);

      const result = {
        order: stockOrder,
        orderDetails: createdOrderDetails,
        supplier: supplierRecord,
      };

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
    });
  } catch (error) {
    console.error("[API] Error creating order:", error);

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

/**
 * PUT handler for updating an existing order
 *
 * @param req - The incoming request
 * @returns JSON response with the updated order or error
 */
export async function PUT(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { order_id, supplier, po_number, date_ordered, ...otherData } = body;

    // Check if the order exists
    const order = await getById("stock_order", Number(order_id), {
      idField: "order_id",
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update the order
    const updatedOrder = await updateTable(
      "stock_order",
      {
        po_number,
        date_ordered: date_ordered
          ? new Date(date_ordered).toISOString()
          : undefined,
        ...otherData,
        updated_at: new Date().toISOString(),
      },
      { order_id: Number(order_id) }
    );

    return NextResponse.json(
      {
        message: "Order updated successfully",
        order: updatedOrder?.[0] || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Error updating order:", error);
    return NextResponse.json(
      {
        error: "Failed to update order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing an order
 *
 * @param req - The incoming request
 * @returns JSON response with deletion confirmation or error
 */
export async function DELETE(req: Request) {
  try {
    // Get order_id from URL params
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get("order_id");

    if (!order_id) {
      return NextResponse.json(
        { error: "Missing order_id parameter" },
        { status: 400 }
      );
    }

    // Verify the order exists
    const order = await getById("stock_order", Number(order_id), {
      idField: "order_id",
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Delete the order (with returning option to get the deleted record)
    const result = await deleteFromTable(
      "stock_order",
      { order_id: Number(order_id) },
      { returning: true }
    );

    return NextResponse.json(
      {
        message: "Order deleted successfully",
        order: result?.[0] || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Error deleting order:", error);
    return NextResponse.json(
      {
        error: "Failed to delete order",
        details: error instanceof Error ? error.message : String(error),
      },
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
