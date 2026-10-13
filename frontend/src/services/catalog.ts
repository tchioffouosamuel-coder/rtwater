import api from "./api";

// ═══════════════════════════════════════════════════
// CATÉGORIES
// ═══════════════════════════════════════════════════

export type CategoryType = "product" | "service";

export interface Category {
  id: number;
  name: string;
  slug: string;
  type: CategoryType;
  products_count?: number;
  services_count?: number;
  created_at?: string;
}

export async function fetchCategories(type?: CategoryType): Promise<Category[]> {
  const res = await api.request("/categories", {
    method: "GET",
    params: type ? { type } : undefined,
  });
  return res?.data ?? [];
}

/** Le slug est dérivé du nom côté serveur quand il n'est pas fourni. */
export async function createCategory(payload: { name: string; type: CategoryType; slug?: string }) {
  return api.request("/categories", { method: "POST", body: payload, silent: true });
}

export async function updateCategory(id: number, payload: Partial<Category>) {
  return api.request(`/categories/${id}`, { method: "PUT", body: payload, silent: true });
}

export async function deleteCategory(id: number) {
  return api.request(`/categories/${id}`, { method: "DELETE", silent: true });
}

// ═══════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
  is_available: boolean;
  category?: { id: number; name: string } | null;
}

export async function fetchServices(params?: Record<string, any>) {
  const res = await api.request("/services", { method: "GET", params });
  return res;
}

export async function createService(payload: Record<string, any> | FormData) {
  return api.request("/services", { method: "POST", body: payload, silent: true });
}

export async function updateService(id: number, payload: Record<string, any> | FormData) {
  // FormData implique un envoi de fichier : Laravel ne lit pas les fichiers
  // en PUT, on passe donc par POST comme pour les produits.
  const method = payload instanceof FormData ? "POST" : "PUT";
  return api.request(`/services/${id}`, { method, body: payload, silent: true });
}

export async function deleteService(id: number) {
  return api.request(`/services/${id}`, { method: "DELETE", silent: true });
}

export default {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchServices,
  createService,
  updateService,
  deleteService,
};
