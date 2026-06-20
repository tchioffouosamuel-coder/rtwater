import api from "./api";

export async function fetchPosts(params?: Record<string, any>) {
  return api.request("/blog", { method: "GET", params });
}

export async function fetchPost(slug: string) {
  return api.request(`/blog/${slug}`, { method: "GET" });
}

export async function fetchAdminPosts(params?: Record<string, any>) {
  return api.request("/admin/blog", { method: "GET", params });
}

export async function createPost(payload: Record<string, any>) {
  return api.request("/admin/blog", { method: "POST", body: payload });
}

export async function updatePost(id: string | number, payload: Record<string, any>) {
  return api.request(`/admin/blog/${id}`, { method: "PUT", body: payload });
}

export async function deletePost(id: string | number) {
  return api.request(`/admin/blog/${id}`, { method: "DELETE" });
}

export default { fetchPosts, fetchPost, fetchAdminPosts, createPost, updatePost, deletePost };
