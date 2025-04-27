export type OrderStatus = "pending" | "partially_complete" | "complete"

// Response data from view `public.v_goods_in`
export interface OrdersView {
  po_number: string;
  item: string;
  supplier: string;
  quantity: number;
  order_date: string;
  status: OrderStatus;
  eta?: string;
}

export interface StockOrderDetailInput {
  material: string;
  drum_quantity: number;
  drum_weight?: number;
  batch_code?: string;
}

export interface StockOrderFormValues {
  supplier: string;
  po_number: string;
  date_ordered: string;
  order_details: StockOrderDetailInput[];
}
