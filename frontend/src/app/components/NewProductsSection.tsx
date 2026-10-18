import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Check, Droplets, ShoppingCart, Sparkles, Star } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useI18n } from "../../i18n/I18nContext";
import { fetchProducts } from "../../services/products";
import { fetchPublicSettings } from "../../services/settings";
import { mapApiProduct, productPath, type ShopProduct } from "../../lib/product";
import { Reveal } from "./Reveal";
import { SectionBadge } from "./ui/section";
import { FavoriteButton } from "./shop/ShopWidgets";

/**
 * Section « Nouveautés » de la page d'accueil.
 *
 * Le titre, l'accroche et le nombre de produits viennent des réglages du
 * backoffice : la vitrine doit pouvoir changer de discours à chaque arrivage
 * sans qu'on redéploie. Les produits, eux, sont les derniers entrés en
 * boutique — pas une sélection à maintenir à la main, qui vieillirait seule.
 */

interface NewProductsConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  count: number;
}

const FALLBACK: NewProductsConfig = {
  enabled: true,
  title: "Nouveaux produits",
  subtitle: "Les derniers équipements entrés en boutique.",
  count: 8,
};

export function NewProductsSection() {
  const { tx, locale } = useI18n();
  const [config, setConfig] = useState<NewProductsConfig>(FALLBACK);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const settings = await fetchPublicSettings();
        const resolved: NewProductsConfig = {
          enabled: settings.home_new_enabled ?? FALLBACK.enabled,
          title: settings.home_new_title || FALLBACK.title,
          subtitle: settings.home_new_subtitle ?? FALLBACK.subtitle,
          count: Number(settings.home_new_count ?? FALLBACK.count),
        };
        if (!alive) return;
        setConfig(resolved);

        if (!resolved.enabled) {
          setLoading(false);
          return;
        }

        const res = await fetchProducts({ sort: "newest", per_page: resolved.count });
        if (!alive) return;
        setProducts((res?.data ?? []).map(mapApiProduct));
      } catch {
        // Section décorative : en cas d'échec elle disparaît, la page reste entière
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!config.enabled) return null;
  if (!loading && products.length === 0) return null;

  return (
    <section
      id="nouveautes"
      aria-labelledby="nouveautes-titre"
      className="relative overflow-hidden py-20 transition-colors duration-300 md:py-28"
    >
      {/* Fond : dégradé maillé, trame et halos qui dérivent lentement */}
      <div aria-hidden className="mesh-gradient dark:mesh-gradient-dark absolute inset-0" />
      <div aria-hidden className="bg-dots dark:bg-dots-dark absolute inset-0 opacity-40" />
      <div aria-hidden className="aurora-blob absolute -left-32 top-10 h-80 w-80 rounded-full bg-brand-400/20" />
      <div
        aria-hidden
        className="aurora-blob absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-aqua-400/20"
        style={{ animationDelay: "-6s" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="mb-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <SectionBadge tone="aqua" className="mb-3 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {tx("Arrivages", "Just in")}
              </SectionBadge>
              <h2
                id="nouveautes-titre"
                className="gradient-text-animated mb-3 text-3xl font-bold tracking-tight md:text-4xl"
              >
                {config.title}
              </h2>
              {config.subtitle && (
                <p className="text-glass text-base leading-relaxed text-ink-600 dark:text-ink-300">
                  {config.subtitle}
                </p>
              )}
            </div>

            <Link
              to="/shop?sort=newest"
              className="glass-card sheen group inline-flex shrink-0 items-center gap-2 self-start rounded-xl px-5 py-3 text-sm font-semibold text-brand-700 transition-transform hover:-translate-y-0.5 dark:text-aqua-200 sm:self-auto"
            >
              {tx("Voir toute la boutique", "Browse the shop")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-72 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={i * 70}>
                <NewProductCard product={product} locale={locale} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NewProductCard({ product, locale }: { product: ShopProduct; locale: string }) {
  const { addToCart } = useCart();
  const { tx } = useI18n();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.finalPrice,
      image: product.image,
      description: product.description,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const price = `${Math.round(product.finalPrice).toLocaleString(locale)} XAF`;

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl"
    >
      <Link to={productPath(product)} className="relative block aspect-square overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-aqua-50 dark:from-ink-800 dark:to-ink-900">
            <Droplets className="h-10 w-10 text-brand-300" />
          </div>
        )}

        {/* Voile de verre au survol : le titre reste lisible sur toute photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <span className="glass-pill absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:text-aqua-200">
          <Sparkles className="h-3 w-3" />
          {tx("Nouveau", "New")}
        </span>

        {product.discount > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
            −{product.discount}%
          </span>
        )}
      </Link>

      <FavoriteButton
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          discount: product.discount,
        }}
        size="sm"
        className="absolute right-2 top-10"
      />

      <div className="flex flex-1 flex-col p-3.5">
        <Link to={productPath(product)}>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-aqua-300">
            {product.name}
          </h3>
        </Link>

        {product.rating > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs text-ink-500 dark:text-ink-400">
              {product.rating.toFixed(1)}
              {product.reviews > 0 && ` (${product.reviews})`}
            </span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-base font-bold text-brand-700 dark:text-aqua-300">{price}</p>
            {product.discount > 0 && (
              <p className="text-xs text-ink-500 dark:text-ink-400 line-through">
                {Math.round(product.price).toLocaleString(locale)} XAF
              </p>
            )}
          </div>

          <motion.button
            onClick={handleAdd}
            disabled={!product.inStock}
            whileTap={{ scale: 0.92 }}
            aria-label={tx(`Ajouter ${product.name} au panier`, `Add ${product.name} to cart`)}
            className={`sheen rounded-xl p-2.5 text-white shadow-lg transition-colors ${
              added
                ? "bg-emerald-500"
                : product.inStock
                  ? "bg-gradient-to-br from-brand-600 to-aqua-500 hover:from-brand-700 hover:to-aqua-600"
                  : "cursor-not-allowed bg-ink-300 dark:bg-ink-700"
            }`}
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          </motion.button>
        </div>

        {!product.inStock && (
          <p className="mt-2 text-[11px] font-medium text-rose-600 dark:text-rose-400">
            {tx("Rupture de stock", "Out of stock")}
          </p>
        )}
      </div>
    </motion.article>
  );
}
