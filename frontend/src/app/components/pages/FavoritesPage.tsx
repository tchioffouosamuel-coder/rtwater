import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { useShopMemory } from "../../../context/ShopMemoryContext";
import { useCart } from "../../../context/CartContext";
import { useI18n } from "../../../i18n/I18nContext";
import { useSeo } from "../../../lib/seo";
import { discountedPrice } from "../../../lib/product";
import { ProductMiniCard, RecentlyViewed } from "../shop/ShopWidgets";

/** /favoris : produits mis de côté par le visiteur. */
export function FavoritesPage() {
  const { favorites } = useShopMemory();
  const { addToCart } = useCart();
  const { tx } = useI18n();

  useSeo({ title: tx("Mes favoris", "My favourites"), path: "/favoris", noindex: true });

  const addAll = () => {
    favorites.forEach((p) =>
      addToCart({ id: p.id, name: p.name, price: discountedPrice(p.price, p.discount), image: p.image, description: "" })
    );
  };

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white flex items-center gap-3">
              <Heart className="w-7 h-7 fill-red-500 text-red-500" />
              {tx("Mes favoris", "My favourites")}
            </h1>
            <p className="mt-2 text-ink-500 dark:text-ink-400">
              {tx(
                "Vos produits mis de côté, conservés sur cet appareil.",
                "Products you saved, kept on this device."
              )}
            </p>
          </div>
          {favorites.length > 1 && (
            <button
              onClick={addAll}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-aqua-500 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              {tx("Tout ajouter au panier", "Add all to cart")}
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="text-center bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 py-16 px-4">
            <Heart className="w-14 h-14 mx-auto text-ink-300 dark:text-ink-600 mb-4" />
            <h2 className="text-xl font-bold text-ink-900 dark:text-white">{tx("Aucun favori pour l'instant", "No favourites yet")}</h2>
            <p className="mt-2 mb-6 text-ink-500 dark:text-ink-400">
              {tx(
                "Touchez le cœur d'un produit pour le retrouver ici plus tard.",
                "Tap the heart on a product to find it here later."
              )}
            </p>
            <Link to="/shop" className="inline-flex px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-aqua-500">
              {tx("Découvrir la boutique", "Browse the shop")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((p) => <ProductMiniCard key={p.id} product={p} />)}
          </div>
        )}

        <RecentlyViewed />
      </div>
    </div>
  );
}
