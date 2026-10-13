import api, { API_BASE } from "./api";

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

export async function downloadOrderReceipt(orderId: string | number): Promise<void> {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  const isAdmin = !!localStorage.getItem('adminToken');
  const url = `${API_BASE}/${isAdmin ? 'admin/' : ''}orders/${orderId}/receipt`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('Erreur téléchargement reçu');

  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `recu-commande-${orderId}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default { createOrder, fetchOrders, fetchOrder, fetchAdminOrders, updateOrderStatus, downloadOrderReceipt };

/** Suivi public sans compte : référence (CMD-000042) + téléphone ou e-mail */
export async function trackOrder(reference: string, contact: string) {
  return api.request("/orders/track", { method: "GET", params: { reference, contact }, silent: true });
}
