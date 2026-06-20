import api from "./api";

export async function fetchPublishedPages() {
  return api.request("/pages", { method: "GET" });
}

export async function fetchPage(slug: string) {
  return api.request(`/pages/${slug}`, { method: "GET" });
}

export async function fetchAdminPages() {
  return api.request("/admin/pages", { method: "GET" });
}

export async function createPage(payload: Record<string, any>) {
  return api.request("/admin/pages", { method: "POST", body: payload });
}

export async function updatePage(id: string | number, payload: Record<string, any>) {
  return api.request(`/admin/pages/${id}`, { method: "PUT", body: payload });
}

export async function deletePage(id: string | number) {
  return api.request(`/admin/pages/${id}`, { method: "DELETE" });
}

export default { fetchPublishedPages, fetchPage, fetchAdminPages, createPage, updatePage, deletePage };
