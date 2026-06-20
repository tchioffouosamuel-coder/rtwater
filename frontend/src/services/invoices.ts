import api from "./api";
import { API_BASE } from "./api";

export async function fetchInvoices(params?: Record<string, any>) {
  return api.request("/admin/invoices", { method: "GET", params });
}

export async function fetchInvoice(id: string | number) {
  return api.request(`/admin/invoices/${id}`, { method: "GET" });
}

export async function createInvoice(payload: { order_id: string | number; type?: "invoice" | "quote"; tax?: number }) {
  return api.request("/admin/invoices", { method: "POST", body: payload });
}

export async function updateInvoice(id: string | number, payload: Record<string, any>) {
  return api.request(`/admin/invoices/${id}`, { method: "PUT", body: payload });
}

export function getInvoicePdfUrl(id: string | number): string {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("userToken");
  // URL directe — le navigateur gère le téléchargement
  return `${API_BASE}/admin/invoices/${id}/pdf?token=${token}`;
}

export default { fetchInvoices, fetchInvoice, createInvoice, updateInvoice, getInvoicePdfUrl };
