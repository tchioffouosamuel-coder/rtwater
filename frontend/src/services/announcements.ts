import api from "./api";

/**
 * Annonces de la page d'accueil : bandeaux fixés en haut ou en bas de l'écran,
 * pubs flottantes et modales. Aucune ne s'insère dans le flux de la page.
 * Les trois arrivent du même appel, l'accueil les affiche au même moment.
 */

export type AnnouncementPlacement = "banner" | "toast" | "modal";
export type AnnouncementPosition = "top" | "bottom";
export type AnnouncementVariant = "brand" | "aqua" | "amber" | "emerald" | "rose";
export type AnnouncementFrequency = "always" | "session" | "once";
export type AnnouncementState = "running" | "scheduled" | "expired" | "inactive";

/** Ce que reçoit le site public. */
export interface Announcement {
  id: number;
  placement: AnnouncementPlacement;
  /** Bandeau seulement : bord de l'écran auquel il se colle. */
  position: AnnouncementPosition;
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

export interface AnnouncementFeed {
  banners: Announcement[];
  toasts: Announcement[];
  modals: Announcement[];
}

export async function fetchAnnouncements(): Promise<AnnouncementFeed> {
  const res = await api.request("/announcements", { method: "GET", silent: true });
  return {
    banners: res?.data?.banners ?? [],
    toasts: res?.data?.toasts ?? [],
    modals: res?.data?.modals ?? [],
  };
}

/** Compteur d'affichage ou de clic. Sans effet visible : on ignore l'échec. */
export function trackAnnouncement(id: number, type: "view" | "click"): void {
  api.request(`/announcements/${id}/hit`, { method: "POST", body: { type }, silent: true }).catch(() => {});
}

/**
 * Même réponse pour les bandeaux, les pubs et les modales : la page d'accueil
 * monte les trois composants en même temps, un seul appel suffit. Un échec vide
 * le cache pour que la navigation suivante retente.
 */
let pending: Promise<AnnouncementFeed> | null = null;

export function loadAnnouncements(): Promise<AnnouncementFeed> {
  if (!pending) {
    pending = fetchAnnouncements().catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

/**
 * Mémoire d'affichage, partagée par les pubs et les modales : `once` survit à
 * la fermeture du navigateur, `session` à la seule visite, `always` ne retient
 * rien. Un stockage bloqué fait réapparaître l'annonce — préférable à une
 * annonce qui ne s'affiche jamais.
 */
const SEEN_PREFIX = "rtw.announcement.seen.";

function seenStorage(frequency: AnnouncementFrequency): Storage | null {
  try {
    if (frequency === "once") return window.localStorage;
    if (frequency === "session") return window.sessionStorage;
  } catch {
    // ignoré volontairement
  }
  return null;
}

export function alreadySeen(announcement: Announcement): boolean {
  try {
    return seenStorage(announcement.frequency)?.getItem(SEEN_PREFIX + announcement.id) === "1";
  } catch {
    return false;
  }
}

export function markSeen(announcement: Announcement): void {
  try {
    seenStorage(announcement.frequency)?.setItem(SEEN_PREFIX + announcement.id, "1");
  } catch {
    // ignoré volontairement
  }
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
  alreadySeen,
  markSeen,
  fetchAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  uploadAnnouncementImage,
};
