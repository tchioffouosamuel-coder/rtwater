/** Utilitaires produit partagés entre la boutique, la fiche produit et le panier. */

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  categoryId: number | null;
  description: string;
  rating: number;
  reviews: number;
  discount: number;
  /** Prix remise calcule par le serveur : c'est lui qui fait foi. */
  finalPrice: number;
  stock: number;
  inStock: boolean;
  /** Fiche technique : texte saisi, image ou PDF. null quand le produit n'en a pas. */
  datasheet: ProductDatasheet | null;
}

export interface ProductDatasheet {
  type: "text" | "image" | "pdf";
  /** Renseigne pour type === "text" uniquement. */
  text: string | null;
  /** Renseigne pour les types "image" et "pdf". */
  url: string | null;
  /** Nom d'origine du fichier, pour le libelle du lien de telechargement. */
  filename: string | null;
}

export function hasProductDatasheet(datasheet: ProductDatasheet | null | undefined): datasheet is ProductDatasheet {
  if (!datasheet) return false;
  if (datasheet.type === "text") return Boolean(datasheet.text?.trim());
  return (datasheet.type === "image" || datasheet.type === "pdf") && Boolean(datasheet.url?.trim());
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Adresse publique d'un produit : /shop/12-filtre-osmose-5-etages */
export function productPath(p: { id: string | number; name: string }): string {
  return `/shop/${p.id}-${slugify(p.name)}`;
}

/** "12-filtre-osmose" → "12" */
export function productIdFromSlug(slug: string | undefined): string | null {
  const match = slug?.match(/^(\d+)/);
  return match ? match[1] : null;
}

export function discountedPrice(price: number, discount = 0): number {
  return Math.round(price - (price * discount) / 100);
}

export function formatXAF(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} XAF`;
}

/** Normalise un produit renvoyé par l'API (ProductResource). */
export function mapApiProduct(p: any): ShopProduct {
  return {
    id: String(p.id),
    name: p.name,
    price: Number(p.price),
    image: p.image_url || "",
    category: p.category?.name ?? "",
    categoryId: p.category?.id ?? null,
    description: p.description || "",
    rating: Number(p.avg_rating ?? p.reviews_avg_rating ?? 0),
    reviews: Number(p.review_count ?? p.reviews_count ?? 0),
    discount: Number(p.discount ?? 0),
    // final_price vient de l'API ; le calcul local ne sert que de repli
    finalPrice: Number(p.final_price ?? discountedPrice(Number(p.price), Number(p.discount ?? 0))),
    datasheet: p.datasheet ?? null,
    stock: Number(p.stock ?? 0),
    inStock: !!p.is_available && Number(p.stock ?? 0) > 0,
  };
}
