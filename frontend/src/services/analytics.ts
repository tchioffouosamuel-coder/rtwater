import api from "./api";

export type AnalyticsPeriod = "week" | "month" | "year";

export interface AnalyticsKpis {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  today_revenue: number;
  total_customers: number;
  products_count: number;
  revenue_change_pct: number | null;
  orders_change_pct: number | null;
  low_stock_count: number;
  critical_stock_count: number;
}

export interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export interface PaymentMethod {
  name: string;
  value: number;
  color: string;
}

export interface RecentOrder {
  id: number;
  customer: string;
  total: number;
  status: string;
  created_at: string;
}

export interface AnalyticsData {
  kpis: AnalyticsKpis;
  revenue_trend: TrendPoint[];
  top_products: TopProduct[];
  payment_methods: PaymentMethod[];
  recent_orders: RecentOrder[];
}

export async function fetchAnalytics(period: AnalyticsPeriod = "week"): Promise<AnalyticsData> {
  return api.request("/admin/analytics", { method: "GET", params: { period } });
}
