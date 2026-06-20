import api from "./api";

export interface QuoteRequestPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  solution_type?: string;
  volume_m3?: number;
  description?: string;
}

export async function submitQuoteRequest(payload: QuoteRequestPayload) {
  return api.request("/quotes", { method: "POST", body: payload });
}

export async function fetchAdminQuotes(params?: Record<string, any>) {
  return api.request("/admin/quotes", { method: "GET", params });
}

export async function fetchAdminQuote(id: string | number) {
  return api.request(`/admin/quotes/${id}`, { method: "GET" });
}

export async function updateAdminQuote(id: string | number, payload: Record<string, any>) {
  return api.request(`/admin/quotes/${id}`, { method: "PUT", body: payload });
}

export default { submitQuoteRequest, fetchAdminQuotes, fetchAdminQuote, updateAdminQuote };
