import api from "./api";

// ═══════════════════════════════════════════════════
// ZONES DE LIVRAISON
// ═══════════════════════════════════════════════════

export interface ShippingZone {
  id: number;
  name: string;
  description: string | null;
  fee: number;
  free_above: number | null;
  delay: string | null;
  /** Tarif réellement dû pour le panier en cours (0 si franco de port atteint). */
  fee_for_cart?: number;
  is_active?: boolean;
  sort_order?: number;
  orders_count?: number;
}

/** Zones actives, avec le tarif calculé pour un sous-panier donné. */
export async function fetchShippingZones(subtotal = 0): Promise<ShippingZone[]> {
  const res = await api.request("/shipping-zones", { method: "GET", params: { subtotal }, silent: true });
  return res?.data ?? [];
}

export async function fetchAdminShippingZones(): Promise<ShippingZone[]> {
  const res = await api.request("/admin/shipping-zones", { method: "GET" });
  return res?.data ?? [];
}

export async function createShippingZone(payload: Partial<ShippingZone>) {
  return api.request("/admin/shipping-zones", { method: "POST", body: payload, silent: true });
}

export async function updateShippingZone(id: number, payload: Partial<ShippingZone>) {
  return api.request(`/admin/shipping-zones/${id}`, { method: "PUT", body: payload, silent: true });
}

export async function deleteShippingZone(id: number) {
  return api.request(`/admin/shipping-zones/${id}`, { method: "DELETE", silent: true });
}

// ═══════════════════════════════════════════════════
// CODES PROMO
// ═══════════════════════════════════════════════════

export type DiscountType = "percent" | "fixed";
export type DiscountState = "running" | "scheduled" | "expired" | "exhausted" | "inactive";

export interface Discount {
  id: number;
  code: string;
  label: string | null;
  type: DiscountType;
  value: number;
  min_subtotal: number | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  state: DiscountState;
  created_at: string | null;
}

export async function fetchDiscounts(params?: { page?: number; search?: string }) {
  return api.request("/admin/discounts", { method: "GET", params }) as Promise<{
    data: Discount[];
    pagination: { current_page: number; last_page: number; total: number };
  }>;
}

export async function createDiscount(payload: Record<string, any>) {
  return api.request("/admin/discounts", { method: "POST", body: payload, silent: true });
}

export async function updateDiscount(id: number, payload: Record<string, any>) {
  return api.request(`/admin/discounts/${id}`, { method: "PUT", body: payload, silent: true });
}

export async function deleteDiscount(id: number) {
  return api.request(`/admin/discounts/${id}`, { method: "DELETE", silent: true });
}

// ═══════════════════════════════════════════════════
// APERÇU DU PANIER
// ═══════════════════════════════════════════════════

export interface QuoteLine {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  base_price: number;
  discount: number;
}

export interface CartQuote {
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  discount_code: string | null;
  total: number;
  /** Renseigné si le code saisi est refusé : le panier reste valide pour autant. */
  discount_error: string | null;
  shipping_zone: { id: number; name: string } | null;
  lines: QuoteLine[];
}

/**
 * Recalcule le détail du panier côté serveur.
 *
 * C'est le serveur qui fait foi sur les montants : le navigateur ne fait
 * qu'afficher ce qu'il reçoit, et la commande les recalcule une seconde fois.
 */
export async function quoteCart(payload: {
  items: Array<{ product_id: number; quantity: number }>;
  shipping_zone_id?: number | null;
  discount_code?: string | null;
}): Promise<CartQuote> {
  const res = await api.request("/orders/quote", {
    method: "POST",
    body: {
      items: payload.items,
      ...(payload.shipping_zone_id ? { shipping_zone_id: payload.shipping_zone_id } : {}),
      ...(payload.discount_code ? { discount_code: payload.discount_code } : {}),
    },
    silent: true,
  });

  return res.data as CartQuote;
}

export default {
  fetchShippingZones,
  fetchAdminShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  fetchDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  quoteCart,
};
