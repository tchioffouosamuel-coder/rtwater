import api from "./api";

export interface NewsletterSubscriber {
  id: number;
  email: string;
  source: string;
  unsubscribed_at: string | null;
  created_at: string | null;
}

/** Inscription depuis le site. Renvoie le message à afficher au visiteur. */
export async function subscribe(email: string, source = "footer"): Promise<string> {
  const res = await api.request("/newsletter", {
    method: "POST",
    body: { email, source },
    // silent : le formulaire affiche l'erreur à côté du champ, pas en toast global
    silent: true,
  });

  return res?.message ?? "Inscription confirmée.";
}

export async function unsubscribe(email: string): Promise<string> {
  const res = await api.request("/newsletter", {
    method: "DELETE",
    body: { email },
    silent: true,
  });

  return res?.message ?? "Désinscription enregistrée.";
}

export async function fetchSubscribers(params?: { page?: number; search?: string; status?: string }) {
  return api.request("/admin/newsletter", { method: "GET", params }) as Promise<{
    data: NewsletterSubscriber[];
    pagination: { current_page: number; last_page: number; total: number };
    stats: { active: number; unsubscribed: number };
  }>;
}

export default { subscribe, unsubscribe, fetchSubscribers };
