import api from "./api";

export async function getCart() {
  return api.request("/cart", { method: "GET" });
}

export async function addCartItem(product_id: string, quantity = 1) {
  return api.request("/cart", {
    method: "POST",
    body: { product_id, quantity },
  });
}

export async function updateCartItem(cartItemId: string, quantity: number) {
  return api.request(`/cart/${cartItemId}`, {
    method: "PUT",
    body: { quantity },
  });
}

export async function deleteCartItem(cartItemId: string) {
  return api.request(`/cart/${cartItemId}`, { method: "DELETE" });
}

export default { getCart, addCartItem, updateCartItem, deleteCartItem };
