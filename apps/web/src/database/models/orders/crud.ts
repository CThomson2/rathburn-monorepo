import {
  insertIntoTable,
  updateTable,
  deleteFromTable,
  getById,
  getPaginatedData,
  selectFromTable,
  executeDbOperation,
} from "@/lib/database";
import * as t from "@/types/models";
import { UpdateFields } from "@/types/models/orders/crud";
import { OrderStatus } from "@/types/models/orders/constant";

/**
 * Implementation of CRUD operations for the Orders model
 */
export const ordersCrud = {
  /**
   * Create a new order in the database
   */
  create: async (data: t.CreateOrderParams): Promise<t.Stock> => {
    // Create the order with initial status and quantity_received
    return insertIntoTable("stock_order", {
      ...data,
      supplier_id:
        typeof data.supplier === "number" ? data.supplier : undefined,
      supplier_name:
        typeof data.supplier === "string" ? data.supplier : undefined,
      po_number: data.po_number,
      date_ordered: data.date_ordered,
      status: OrderStatus.PENDING,
      quantity_received: 0,
    }) as Promise<t.Stock>;
  },

  /**
   * Update specific fields of an order
   * Uses Partial to allow updating only some fields
   */
  update: async (
    orderId: number,
    data: Partial<Pick<t.OrderBase, UpdateFields>>
  ): Promise<t.Stock> => {
    // Automatically set updated_at
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const result = await updateTable("stock_order", updateData, {
      order_id: orderId,
    });
    return result?.[0] as t.Stock;
  },

  /**
   * Delete an order by ID
   */
  delete: async (orderId: number): Promise<void> => {
    await deleteFromTable("stock_order", { order_id: orderId });
  },

  /**
   * Get an order by ID
   */
  get: async (orderId: number): Promise<t.Stock> => {
    const order = await getById("stock_order", orderId, {
      idField: "order_id",
    });
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    return order as t.Stock;
  },

  /**
   * Get orders with filtering and pagination
   */
  getAll: async (params: t.OrderQueryParams): Promise<t.OrdersResponse> => {
    const {
      page = 1,
      limit = 50,
      sortField = "date_ordered",
      sortOrder = "desc",
      status,
    } = params;

    // Build filters
    const filters: Record<string, any> = {};
    if (status?.length) {
      // For complex filters like "in" array, we need to use executeDbOperation directly
      const result = await executeDbOperation(async (client) => {
        let query = client.from("stock_order").select("*");

        if (status.length === 1) {
          query = query.eq("status", status[0]);
        } else {
          query = query.in("status", status);
        }

        // Apply sorting
        query = query.order(sortField as string, {
          ascending: sortOrder === "asc",
        });

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        // Get count in a separate query
        const countQuery = client
          .from("stock_order")
          .select("*", { count: "exact", head: true });
        if (status.length === 1) {
          countQuery.eq("status", status[0]);
        } else {
          countQuery.in("status", status);
        }

        const [data, count] = await Promise.all([query, countQuery]);

        if (data.error) throw data.error;
        if (count.error) throw count.error;

        return {
          orders: data.data,
          total: count.count || 0,
        };
      });

      return result;
    } else {
      // Use getPaginatedData for simple filters
      const result = await getPaginatedData("stock_order", {
        page,
        pageSize: limit,
        sortBy: sortField as string,
        sortOrder: sortOrder as "asc" | "desc",
      });

      return {
        orders: result.data as t.Stock[],
        total: result.total,
      };
    }
  },

  /**
   * Get order with all its deliveries
   */
  getWithDeliveries: async (orderId: number): Promise<t.Stock | null> => {
    return executeDbOperation(async (client) => {
      const { data, error } = await client
        .from("stock_order")
        .select(
          `
          *,
          deliveries:deliveries(*)
        `
        )
        .eq("order_id", orderId)
        .maybeSingle();

      if (error) throw error;
      return data as t.Stock | null;
    });
  },

  /**
   * Get active orders (pending or partial)
   */
  getActive: async (): Promise<t.Stock[]> => {
    const activeOrders = await selectFromTable("stock_order", {
      filters: {
        status: [OrderStatus.PENDING, OrderStatus.PARTIAL],
      },
      orderBy: {
        column: "order_id",
        ascending: false,
      },
    });

    return activeOrders as t.Stock[];
  },
};
