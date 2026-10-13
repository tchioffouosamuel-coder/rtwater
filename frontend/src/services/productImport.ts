import api, { API_BASE } from "./api";

/** Un champ produit reconnu dans l'en-tête du fichier. */
export type ImportField =
  | "name" | "sku" | "description" | "price" | "cost" | "stock"
  | "min_quantity" | "max_quantity" | "location" | "category"
  | "image" | "is_available";

export interface ImportRow {
  line: number;
  action: "create" | "update" | "error";
  product: {
    name: string | null;
    sku: string | null;
    description: string | null;
    price: number | null;
    cost: number | null;
    stock: number | null;
    min_quantity: number | null;
    max_quantity: number | null;
    location: string | null;
    category: string | null;
    image: string | null;
    is_available: boolean | null;
  };
  existing: { id: number; name: string; stock: number } | null;
  category: { status: "none" | "known" | "new"; name: string | null; id: number | null };
  /** `source` dit d'où vient l'image : archive ZIP, URL distante, fichier déjà en storage, ou aucune */
  image: { source: "archive" | "url" | "existing" | "none"; ref: string | null };
  errors: string[];
}

export interface ImportPreview {
  token: string;
  filename: string;
  mapping: Partial<Record<ImportField, number>>;
  unmapped: string[];
  rows: ImportRow[];
  summary: {
    total: number;
    create: number;
    update: number;
    error: number;
    images: number;
    new_categories: string[];
  };
  images: { available: number; matched: number; unused: number; uploaded?: number };
  warnings: string[];
}

export interface ImportOptions {
  update_existing: boolean;
  create_categories: boolean;
  allow_remote_images: boolean;
}

export interface ImportRecord {
  id: number;
  filename: string;
  user: string | null;
  rows_total: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  images_count: number;
  options: ImportOptions | null;
  errors: Array<{ line: number; name: string | null; messages: string[] }>;
  created_at: string | null;
}

/**
 * Télécharge le modèle XLSX. Le fichier passe par une requête authentifiée
 * puis par un blob : un simple lien ne transporterait pas le token admin.
 */
export async function downloadTemplate(): Promise<void> {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("userToken");

  const res = await fetch(`${API_BASE}/admin/products/import/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Téléchargement du modèle impossible");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modele-import-produits.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Étape 1 — envoie le fichier (et les images) et récupère l'aperçu. Rien n'est enregistré. */
export async function analyzeImport(
  file: File,
  images: { archive?: File | null; loose?: File[] } = {},
): Promise<ImportPreview> {
  const body = new FormData();
  body.append("file", file);
  if (images.archive) body.append("archive", images.archive);
  (images.loose ?? []).forEach(img => body.append("images[]", img));

  const res = await api.request("/admin/products/import/analyze", {
    method: "POST",
    body,
    silent: true,
  });

  return res.data as ImportPreview;
}

/** Étape 2 — enregistre les produits de l'aperçu identifié par `token`. */
export async function commitImport(
  token: string,
  options: Partial<ImportOptions> = {},
): Promise<ImportRecord> {
  const res = await api.request("/admin/products/import/commit", {
    method: "POST",
    body: { token, ...options },
    silent: true,
  });

  return res.data as ImportRecord;
}

/** Abandon de l'assistant : purge les fichiers temporaires côté serveur. */
export async function discardImport(token: string): Promise<void> {
  await api.request("/admin/products/import/discard", {
    method: "POST",
    body: { token },
    silent: true,
  });
}

export async function fetchImportHistory(page = 1) {
  const res = await api.request("/admin/products/imports", {
    method: "GET",
    params: { page },
  });

  return res as { data: ImportRecord[]; pagination: { current_page: number; last_page: number; total: number } };
}

export default {
  downloadTemplate,
  analyzeImport,
  commitImport,
  discardImport,
  fetchImportHistory,
};
