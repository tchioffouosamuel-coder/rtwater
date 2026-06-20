import api from "./api";

export async function fetchStockMovements(params?: Record<string, any>) {
  return api.request("/admin/stock-movements", { method: "GET", params });
}

export async function createStockMovement(payload: {
  product_id: string | number;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
  notes?: string;
}) {
  return api.request("/admin/stock-movements", { method: "POST", body: payload });
}

export default { fetchStockMovements, createStockMovement };
