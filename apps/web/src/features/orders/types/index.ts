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
