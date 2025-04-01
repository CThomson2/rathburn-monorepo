import { Alert } from "@/components/widgets/alerts-widget";

export interface StockLevel {
  name: string;
  quantity: number;
  value: number;
}

export interface Category {
  name: string;
  value: number;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface InventoryData {
  totalValue: number;
  belowSafetyStock: number;
  pendingOrders: number;
  stockAccuracy: number;
  alerts: Alert[];
  stockLevels: StockLevel[];
  categories: Category[];
  trendData: TrendData[];
}

export interface OrderData {
  productId: string;
  quantity: number;
  supplierId?: string;
  expectedDelivery?: Date;
}

export interface MetricCardsProps {
  totalValue: number;
  belowSafetyStock: number;
  pendingOrders: number;
  stockAccuracy: number;
}

export interface InventoryChartsProps {
  stockLevels: StockLevel[];
  categories: Category[];
  trendData: TrendData[];
}

export interface OrderFormWidgetProps {
  onSubmit: (data: OrderData) => void;
}

export interface AlertsWidgetProps {
  alerts: Alert[];
}
