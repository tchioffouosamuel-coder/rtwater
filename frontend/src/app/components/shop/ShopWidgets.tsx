import { Link } from "react-router-dom";
import { Droplets, Heart } from "lucide-react";
import { useShopMemory, type RememberedProduct } from "../../../context/ShopMemoryContext";
import { useI18n } from "../../../i18n/I18nContext";
import { discountedPrice, productPath } from "../../../lib/product";

/** Cœur « ajouter aux favoris », utilisable sur une carte ou une fiche produit. */
export function FavoriteButton({
  product,
  className = "",
  size = "md",
}: {
  product: RememberedProduct;
  className?: string;
  size?: "sm" | "md";
}) {
  const { isFavorite, toggleFavorite } = useShopMemory();
  const { tx } = useI18n();
  const active = isFavorite(product.id);
  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const icon = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product); }}
      aria-pressed={active}
      aria-label={active ? tx(`Retirer ${product.name} des favoris`, `Remove ${product.name} from favourites`) : tx(`Ajouter ${product.name} aux favoris`, `Add ${product.name} to favourites`)}
      title={active ? tx("Retirer des favoris", "Remove from favourites") : tx("Ajouter aux favoris", "Add to favourites")}
      className={`${dim} flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 shadow hover:scale-110 transition-transform ${className}`}
    >
      <Heart className={`${icon} ${active ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}`} />
    </button>
  );
}

/** Petite carte produit : produits similaires, récemment consultés, favoris. */
export function ProductMiniCard({ product, showFavorite = true }: { product: RememberedProduct; showFavorite?: boolean }) {
  const { locale } = useI18n();
  const price = discountedPrice(product.price, product.discount);

  return (
    <Link
      to={productPath(product)}
      className="group relative block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow"
    >
      <div className="h-36 sm:h-44 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <Droplets className="w-10 h-10 text-blue-200" />
        )}
      </div>
      {showFavorite && <FavoriteButton product={product} size="sm" className="absolute top-2 right-2" />}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#0077BE]">{product.name}</p>
        <p className="mt-1 text-sm font-bold text-[#0077BE] dark:text-[#00A8E8]">
          {Math.round(price).toLocaleString(locale)} XAF
          {product.discount > 0 && (
            <span className="ml-2 text-xs font-normal line-through text-gray-400">{Math.round(product.price).toLocaleString(locale)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}

/** Bandeau « Récemment consultés », masqué s'il n'y a rien à montrer. */
export function RecentlyViewed({ excludeId, title }: { excludeId?: string; title?: string }) {
  const { recentlyViewed } = useShopMemory();
  const { tx } = useI18n();
  const items = recentlyViewed.filter((p) => p.id !== excludeId).slice(0, 4);
  if (!items.length) return null;

  return (
    <section className="mt-12" aria-labelledby="recent-title">
      <h2 id="recent-title" className="text-xl font-bold text-gray-900 dark:text-white mb-5">
        {title ?? tx("Récemment consultés", "Recently viewed")}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((p) => <ProductMiniCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
