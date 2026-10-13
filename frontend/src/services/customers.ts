import api, { API_BASE } from "./api";

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  /** Commande passée sans création de compte : pas d'adresse e-mail exploitable. */
  is_guest: boolean;
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string | null;
}

export interface CustomerOrder {
  id: number;
  reference: string;
  status: string;
  total: number;
  created_at: string | null;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface CustomerDetail extends Customer {
  average_cart: number;
  orders: CustomerOrder[];
}

export interface CustomerStats {
  total: number;
  new_30d: number;
  buyers: number;
  revenue: number;
  average_cart: number;
}

export type CustomerSegment = "all" | "with_orders" | "without_orders" | "guests";
export type CustomerSort = "recent" | "spent" | "orders" | "created";

export async function fetchCustomers(params?: {
  page?: number;
  search?: string;
  segment?: CustomerSegment;
  sort?: CustomerSort;
}) {
  const query: Record<string, any> = { page: params?.page };
  if (params?.search) query.search = params.search;
  if (params?.segment && params.segment !== "all") query.segment = params.segment;
  if (params?.sort) query.sort = params.sort;

  return api.request("/admin/customers", { method: "GET", params: query }) as Promise<{
    data: Customer[];
    pagination: { current_page: number; last_page: number; per_page: number; total: number };
    stats: CustomerStats;
  }>;
}

export async function fetchCustomer(id: number): Promise<CustomerDetail> {
  const res = await api.request(`/admin/customers/${id}`, { method: "GET" });
  return res.data as CustomerDetail;
}

/**
 * Télécharge l'export CSV. Le téléchargement passe par un blob : un lien nu
 * ne transporterait pas le jeton d'authentification.
 */
export async function downloadCustomersCsv(): Promise<void> {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("userToken");

  const res = await fetch(`${API_BASE}/admin/customers/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Export impossible");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default { fetchCustomers, fetchCustomer, downloadCustomersCsv };
