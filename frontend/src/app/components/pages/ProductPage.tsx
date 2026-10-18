import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, PackageX } from "lucide-react";
import { ProductDetails } from "../ProductDetails";
import { fetchProduct, fetchProducts } from "../../../services/products";
import { useCart } from "../../../context/CartContext";
import { useCartUI } from "../../../context/CartUIContext";
import { useShopMemory } from "../../../context/ShopMemoryContext";
import { useI18n } from "../../../i18n/I18nContext";
import { SITE_URL, truncate, useSeo } from "../../../lib/seo";
import { trackEvent } from "../../../lib/monitoring";
import {
  discountedPrice, formatXAF, mapApiProduct, productIdFromSlug, productPath, type ShopProduct,
} from "../../../lib/product";
import { ProductMiniCard, RecentlyViewed } from "../shop/ShopWidgets";

/** Fiche produit complète, partageable et indexable : /shop/12-filtre-osmose */
export function ProductPage() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const id = productIdFromSlug(slug);
  const { addToCart } = useCart();
  const { openCart } = useCartUI();
  const { rememberViewed } = useShopMemory();
  const { tx } = useI18n();

  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [related, setRelated] = useState<ShopProduct[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  // A product replaces a potentially long list: do not retain its footer position.
  // "instant" also overrides the site's global smooth scrolling before paint.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [id]);

  useLayoutEffect(() => {
    if (status !== "ready" || product?.id !== id || hash !== "#fiche-technique") return;
    const section = document.getElementById("fiche-technique");
    section?.scrollIntoView({ block: "start", behavior: "instant" });
    section?.focus({ preventScroll: true });
  }, [id, product?.id, status, hash]);

  useEffect(() => {
    if (!id) { setStatus("notfound"); return; }
    let cancelled = false;
    setStatus("loading");
    fetchProduct(id)
      .then((res: any) => {
        if (cancelled) return;
        if (!res?.data) { setStatus("notfound"); return; }
        const p = mapApiProduct(res.data);
        setProduct(p);
        setStatus("ready");
        rememberViewed(p);
        trackEvent("view_item", { item_id: p.id, item_name: p.name });
        // Corrige une adresse ancienne ou mal saisie vers l'adresse canonique
        const canonical = productPath(p);
        if (window.location.pathname !== canonical) navigate(canonical + window.location.search + window.location.hash, { replace: true });
      })
      .catch(() => { if (!cancelled) setStatus("notfound"); });
    return () => { cancelled = true; };
  }, [id, navigate, rememberViewed]);

  // Produits similaires (même catégorie)
  useEffect(() => {
    if (!product?.categoryId) { setRelated([]); return; }
    fetchProducts({ category_id: product.categoryId, per_page: 5 })
      .then((res: any) => setRelated(
        (res?.data ?? []).map(mapApiProduct).filter((p: ShopProduct) => p.id !== product.id).slice(0, 4)
      ))
      .catch(() => setRelated([]));
  }, [product?.id, product?.categoryId]);

  const price = product ? discountedPrice(product.price, product.discount) : 0;

  useSeo({
    title: product?.name ?? (status === "notfound" ? tx("Produit introuvable", "Product not found") : tx("Produit", "Product")),
    description: product
      ? truncate(product.description || `${product.name} : ${formatXAF(price)}. ${tx("Livraison à Yaoundé.", "Delivery in Yaoundé.")}`)
      : undefined,
    image: product?.image || null,
    path: product ? productPath(product) : undefined,
    type: "product",
    noindex: status === "notfound",
    jsonLd: product ? [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        image: product.image || undefined,
        sku: product.id,
        category: product.category || undefined,
        brand: { "@type": "Brand", name: "RT Water Solution" },
        offers: {
          "@type": "Offer",
          url: SITE_URL + productPath(product),
          priceCurrency: "XAF",
          price,
          availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        ...(product.reviews > 0 && {
          aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviews },
        }),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: tx("Accueil", "Home"), item: SITE_URL + "/" },
          { "@type": "ListItem", position: 2, name: tx("Boutique", "Shop"), item: SITE_URL + "/shop" },
          { "@type": "ListItem", position: 3, name: product.name, item: SITE_URL + productPath(product) },
        ],
      },
    ] : null,
  });

  if (status === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10" aria-busy="true" aria-live="polite">
        <div className="h-4 w-56 bg-ink-200 dark:bg-ink-700 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-ink-800 rounded-2xl p-6 sm:p-10">
          <div className="h-72 sm:h-96 bg-ink-200 dark:bg-ink-700 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-ink-200 dark:bg-ink-700 rounded animate-pulse" />
            <div className="h-6 w-1/3 bg-ink-200 dark:bg-ink-700 rounded animate-pulse" />
            <div className="h-20 bg-ink-200 dark:bg-ink-700 rounded animate-pulse" />
            <div className="h-12 bg-ink-200 dark:bg-ink-700 rounded-xl animate-pulse" />
          </div>
        </div>
        <span className="sr-only">{tx("Chargement du produit…", "Loading product…")}</span>
      </div>
    );
  }

  if (status === "notfound" || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <PackageX className="w-14 h-14 mx-auto text-ink-300 dark:text-ink-600 mb-4" />
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">
          {tx("Ce produit n'est plus disponible", "This product is no longer available")}
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mb-8">
          {tx(
            "Il a peut-être été retiré du catalogue. Découvrez nos autres solutions de traitement de l'eau.",
            "It may have been removed from the catalogue. Discover our other water treatment solutions."
          )}
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-aqua-500 text-white font-semibold"
        >
          {tx("Voir la boutique", "Browse the shop")}
        </Link>
        <div className="text-left"><RecentlyViewed /></div>
      </div>
    );
  }

  return (
    <div className="bg-ink-50 dark:bg-ink-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <nav aria-label={tx("Fil d'Ariane", "Breadcrumb")} className="mb-5 text-sm text-ink-500 dark:text-ink-400">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand-600">{tx("Accueil", "Home")}</Link></li>
            <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li><Link to="/shop" className="hover:text-brand-600">{tx("Boutique", "Shop")}</Link></li>
            {product.category && (
              <>
                <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
                <li>{product.category}</li>
              </>
            )}
            <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li aria-current="page" className="text-ink-800 dark:text-ink-200 font-medium line-clamp-1">{product.name}</li>
          </ol>
        </nav>

        <ProductDetails
          variant="page"
          product={product}
          isOpen
          onClose={() => navigate("/shop")}
          onAddToCart={(quantity) => {
            addToCart({ id: product.id, name: product.name, price, image: product.image, description: product.description }, quantity);
            openCart();
          }}
        />

        {related.length > 0 && (
          <section className="mt-12" aria-labelledby="related-title">
            <h2 id="related-title" className="text-xl font-bold text-ink-900 dark:text-white mb-5">
              {tx("Vous aimerez aussi", "You may also like")}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => <ProductMiniCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        <RecentlyViewed excludeId={product.id} />
      </div>
    </div>
  );
}
