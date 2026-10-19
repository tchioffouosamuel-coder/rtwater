import api, { API_BASE } from "./api";

/** Par quelle clé un fichier a été rattaché à un produit. */
export type MatchedBy = "filename" | "sku" | "name";

export interface ImageMatch {
  product_id: number;
  name: string;
  sku: string | null;
  file: string;
  matched_by: MatchedBy;
  /** true : le produit a déjà une image, qui sera remplacée. */
  replaces: boolean;
}

export interface PendingProduct {
  product_id: number;
  name: string;
  sku: string | null;
  /** Nom de fichier déclaré dans l'Excel et pas encore téléversé. */
  expects: string | null;
}

export interface ImageImportPreview {
  token: string;
  matches: ImageMatch[];
  /** Fichiers téléversés qui ne correspondent à aucun produit. */
  unmatched: string[];
  pending: PendingProduct[];
  summary: {
    uploaded: number;
    matched: number;
    replacing: number;
    unmatched: number;
    pending: number;
  };
  warnings: string[];
}

export interface ImageImportResult {
  attached: number;
  replaced: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface ImageSummary {
  awaiting: number;
  without_image: number;
  with_image: number;
}

export interface DeleteImagesResult {
  products_updated: number;
  files_deleted: number;
  products_failed: number;
  errors: string[];
}

/** Produits qui attendent une image, avec le nom de fichier à préparer. */
export async function fetchPendingImages() {
  return api.request("/admin/products/images/pending", { method: "GET" }) as Promise<{
    data: PendingProduct[];
    summary: ImageSummary;
  }>;
}

/** Télécharge l'inventaire CSV avec l'authentification de l'administration. */
export async function exportImages(): Promise<void> {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("userToken");
  const response = await fetch(`${API_BASE}/admin/products/images/export`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Export de la liste des images impossible.");
  }

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "images-produits.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function deleteAllImages(): Promise<DeleteImagesResult> {
  const response = await api.request("/admin/products/images", {
    method: "DELETE",
    body: { confirm: true },
    silent: true,
  });

  return response.data as DeleteImagesResult;
}

/** Étape 1 — dépose les photos et renvoie l'aperçu des rattachements. */
export async function analyzeImages(
  files: { archive?: File | null; loose?: File[] } = {},
): Promise<ImageImportPreview> {
  const body = new FormData();
  if (files.archive) body.append("archive", files.archive);
  (files.loose ?? []).forEach(f => body.append("images[]", f));

  const res = await api.request("/admin/products/images/analyze", {
    method: "POST",
    body,
    silent: true,
  });

  return res.data as ImageImportPreview;
}

/** Étape 2 — rattache réellement les images de l'aperçu. */
export async function commitImages(
  token: string,
  options: { replace_existing?: boolean } = {},
): Promise<ImageImportResult> {
  const res = await api.request("/admin/products/images/commit", {
    method: "POST",
    body: { token, ...options },
    silent: true,
  });

  return res.data as ImageImportResult;
}

export async function discardImages(token: string): Promise<void> {
  await api.request("/admin/products/images/discard", {
    method: "POST",
    body: { token },
    silent: true,
  });
}

export default { fetchPendingImages, exportImages, deleteAllImages, analyzeImages, commitImages, discardImages };
