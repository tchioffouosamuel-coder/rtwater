import api from "./api";

/**
 * Annonces de la page d'accueil : bandeaux défilants et pubs flottantes.
 * Les deux arrivent du même appel, l'accueil les affiche au même moment.
 */

export type AnnouncementPlacement = "banner" | "toast";
export type AnnouncementVariant = "brand" | "aqua" | "amber" | "emerald" | "rose";
export type AnnouncementFrequency = "always" | "session" | "once";
export type AnnouncementState = "running" | "scheduled" | "expired" | "inactive";

/** Ce que reçoit le site public. */
export interface Announcement {
  id: number;
  title: string;
  message: string | null;
  link_url: string | null;
  link_label: string | null;
  image_url: string | null;
  icon: string | null;
  variant: AnnouncementVariant;
  delay_seconds: number;
  duration_seconds: number;
  frequency: AnnouncementFrequency;
  dismissible: boolean;
}

/** Vue backoffice : fenêtre de diffusion et compteurs en plus. */
export interface AdminAnnouncement extends Announcement {
  placement: AnnouncementPlacement;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  views: number;
  clicks: number;
  state: AnnouncementState;
  /** Chemin relatif stocké en base, à renvoyer tel quel à l'enregistrement. */
  image_path: string | null;
  created_at: string | null;
}

export async function fetchAnnouncements(): Promise<{ banners: Announcement[]; toasts: Announcement[] }> {
  const res = await api.request("/announcements", { method: "GET", silent: true });
  return { banners: res?.data?.banners ?? [], toasts: res?.data?.toasts ?? [] };
}

/** Compteur d'affichage ou de clic. Sans effet visible : on ignore l'échec. */
export function trackAnnouncement(id: number, type: "view" | "click"): void {
  api.request(`/announcements/${id}/hit`, { method: "POST", body: { type }, silent: true }).catch(() => {});
}

/**
 * Même réponse pour le bandeau et les pubs : la page d'accueil monte les deux
 * composants en même temps, un seul appel suffit. Un échec vide le cache pour
 * que la navigation suivante retente.
 */
let pending: Promise<{ banners: Announcement[]; toasts: Announcement[] }> | null = null;

export function loadAnnouncements(): Promise<{ banners: Announcement[]; toasts: Announcement[] }> {
  if (!pending) {
    pending = fetchAnnouncements().catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

// ═══════════════════════════════════════════════════
// BACKOFFICE
// ═══════════════════════════════════════════════════

export async function fetchAdminAnnouncements(placement?: AnnouncementPlacement): Promise<AdminAnnouncement[]> {
  const res = await api.request("/admin/announcements", { method: "GET", params: placement ? { placement } : undefined });
  return res?.data ?? [];
}

export async function createAnnouncement(payload: Record<string, any>) {
  return api.request("/admin/announcements", { method: "POST", body: payload, silent: true });
}

export async function updateAnnouncement(id: number, payload: Record<string, any>) {
  return api.request(`/admin/announcements/${id}`, { method: "PUT", body: payload, silent: true });
}

export async function deleteAnnouncement(id: number) {
  return api.request(`/admin/announcements/${id}`, { method: "DELETE", silent: true });
}

/** Téléverse un visuel d'annonce et renvoie le chemin relatif à stocker. */
export async function uploadAnnouncementImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("image", file);
  body.append("folder", "announcements");
  const res = await api.request("/upload/image", { method: "POST", body, silent: true });
  return res?.path as string;
}

export default {
  fetchAnnouncements,
  loadAnnouncements,
  trackAnnouncement,
  fetchAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  uploadAnnouncementImage,
};
