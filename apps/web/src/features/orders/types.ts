/**
 * Possible order statuses
 */
export type OrderStatus = "pending" | "partially_received" | "complete";

/**
 * Order view from the v_goods_in SQL view
 */
export interface OrdersView {
  po_number: string;
  pol_id: string;
  material: string;
  supplier: string;
  quantity: number;
  date_ordered: string;
  status: OrderStatus;
  eta_date?: string;
  eta?: string; // Formatted eta_date (populated by fetchOrders)
} 