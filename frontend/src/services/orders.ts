import api from "./api";

export async function createOrder(payload: any) {
  return api.request("/orders", { method: "POST", body: payload });
}

export async function fetchOrders(params?: Record<string, any>) {
  return api.request("/orders", { method: "GET", params });
}

export async function fetchOrder(id: string | number) {
  return api.request(`/orders/${id}`, { method: "GET" });
}

// POS — admin-only, crée une commande directement en statut "paid"
export async function createPosOrder(items: { product_id: number; quantity: number }[]) {
  return api.request("/admin/pos-order", { method: "POST", body: { items } });
}

// Admin
export async function fetchAdminOrders(params?: Record<string, any>) {
  return api.request("/admin/orders", { method: "GET", params });
}

export async function updateOrderStatus(id: string | number, status: string) {
  return api.request(`/admin/orders/${id}`, { method: "PUT", body: { status } });
}

export default { createOrder, fetchOrders, fetchOrder, fetchAdminOrders, updateOrderStatus };
