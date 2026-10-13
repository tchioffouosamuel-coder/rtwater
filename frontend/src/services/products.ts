import api from "./api";

export async function fetchProducts(params?: Record<string, any>) {
  const res = await api.request("/products", { method: "GET", params });
  // res => { data: [...], pagination: {...} }
  return res;
}

export async function fetchProduct(id: string) {
  const res = await api.request(`/products/${id}`, { method: "GET" });
  return res;
}

export async function createProduct(payload: Record<string, any>) {
  // support file upload
  if (payload instanceof FormData) {
    return api.request("/products", { method: "POST", body: payload });
  }

  return api.request("/products", { method: "POST", body: payload });
}

export async function updateProduct(id: string, payload: Record<string, any> | FormData) {
  if (payload instanceof FormData) {
    // PHP ne parse pas les corps multipart en PUT : on POSTe avec _method=PUT,
    // que le routeur Laravel interprete comme un PUT. Sans ca la requete part
    // en POST sur une route qui n'accepte que PUT et repond 405.
    payload.append("_method", "PUT");
    return api.request(`/products/${id}`, { method: "POST", body: payload });
  }

  return api.request(`/products/${id}`, { method: "PUT", body: payload });
}

export async function deleteProduct(id: string) {
  return api.request(`/products/${id}`, { method: "DELETE" });
}

export default {
  fetchProducts,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
