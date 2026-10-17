import api from "./api";

/** Réglages servis au site public. */
export interface PublicSettings {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_phone_2: string;
  company_address: string;
  company_tax_id: string;
  site_description: string;
  currency: string;
  tax_rate: number;
  tax_included: boolean;
  payment_mobile_money: boolean;
  payment_cash: boolean;
  products_per_page: number;
  default_language: string;

  /** Section « Nouveautés » de la page d'accueil. */
  home_new_enabled: boolean;
  home_new_title: string;
  home_new_subtitle: string;
  home_new_count: number;
  home_new_days: number;
}

/** Réglages complets, accessibles au backoffice seulement. */
export interface AdminSettings extends PublicSettings {
  low_stock_alert: number;
  critical_stock_level: number;
  notify_orders: boolean;
  notify_stock: boolean;
  notification_email: string;
}

export async function fetchPublicSettings(): Promise<Partial<PublicSettings>> {
  const res = await api.request("/settings", { method: "GET", silent: true });
  return res?.data ?? {};
}

export async function fetchSettings() {
  return api.request("/admin/settings", { method: "GET" }) as Promise<{
    data: AdminSettings;
    groups: Record<string, Record<string, unknown>>;
  }>;
}

/** Enregistre uniquement les clés fournies. Le serveur ignore les clés inconnues. */
export async function updateSettings(values: Partial<AdminSettings>) {
  const res = await api.request("/admin/settings", { method: "PUT", body: values, silent: true });
  return res?.data as AdminSettings;
}

export default { fetchPublicSettings, fetchSettings, updateSettings };
