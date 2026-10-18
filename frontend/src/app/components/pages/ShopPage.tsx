import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Star, Truck, Award, Zap, X, Eye, ShoppingCart,
  TrendingUp, Shield, ChevronLeft, ChevronRight, Flame,
  Clock, SlidersHorizontal, Tag, Package, Droplets,
} from "lucide-react";
import { useCart } from "../../../context/CartContext";
import { ProductDetails } from "../ProductDetails";
import { fetchProducts } from "../../../services/products";
import api from "../../../services/api";
import { Link, useSearchParams } from "react-router-dom";
import { useI18n } from "../../../i18n/I18nContext";
import { useShopMemory } from "../../../context/ShopMemoryContext";
import { trackEvent } from "../../../lib/monitoring";
import { FavoriteButton, RecentlyViewed } from "../shop/ShopWidgets";
import { useSeo } from "../../../lib/seo";
import { mapApiProduct, productPath, type ShopProduct } from "../../../lib/product";
import { PageHeroMedia } from "../ui/PageHeroMedia";
import { SHOP_HEADER_PHOTO } from "../../content/photos";

interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  products_count?: number;
}

type Product = ShopProduct;

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-ink-800 rounded-2xl overflow-hidden shadow-md border border-transparent animate-pulse">
      <div className="h-48 sm:h-56 bg-ink-200 dark:bg-ink-700" />
      <div className="p-4 space-y-3">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-ink-200 dark:bg-ink-700" />
          ))}
        </div>
        <div className="h-4 bg-ink-200 dark:bg-ink-700 rounded w-3/4" />
        <div className="h-4 bg-ink-200 dark:bg-ink-700 rounded w-1/2" />
        <div className="h-6 bg-ink-200 dark:bg-ink-700 rounded w-2/3" />
      </div>
    </div>
  );
}

export function ShopPage() {
  const { addToCart } = useCart();
  const { tx, locale } = useI18n();
  const { rememberViewed } = useShopMemory();

  // Les filtres vivent dans l'adresse : partageables, et conservés au retour d'une fiche produit
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => params.get("q") ?? "");
  const [searchTerm, setSearchTerm] = useState(() => params.get("q") ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(() => Number(params.get("cat")) || null);

  useSeo({
    title: tx("Boutique : filtres, osmoseurs et traitement de l'eau", "Shop: filters, reverse osmosis and water treatment"),
    description: tx(
      "Achetez en ligne vos filtres à eau, osmoseurs, adoucisseurs et accessoires. Paiement Orange Money, MTN MoMo ou à la livraison à Yaoundé.",
      "Buy water filters, reverse osmosis systems, softeners and accessories online. Pay with Orange Money, MTN MoMo or cash on delivery in Yaoundé."
    ),
    path: "/shop",
  });
  const [sortBy, setSortBy] = useState(() => params.get("sort") ?? "newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, Number(params.get("page")) || 1));
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [flashIndex, setFlashIndex] = useState(0);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLElement>(null);
  const firstPageRender = useRef(true);

  useEffect(() => {
    if (firstPageRender.current) { firstPageRender.current = false; return; }
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  useEffect(() => {
    const next: Record<string, string> = {};
    if (searchTerm) next.q = searchTerm;
    if (selectedCategoryId !== null) next.cat = String(selectedCategoryId);
    if (sortBy !== "newest") next.sort = sortBy;
    if (currentPage > 1) next.page = String(currentPage);
    setParams(next, { replace: true });
  }, [searchTerm, selectedCategoryId, sortBy, currentPage, setParams]);

  // Aperçu rapide ouvert : mémorisé dans « Récemment consultés »
  useEffect(() => {
    if (selectedProduct) {
      rememberViewed(selectedProduct);
      trackEvent("view_item", { item_id: selectedProduct.id, item_name: selectedProduct.name });
    }
  }, [selectedProduct, rememberViewed]);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchTerm(val);
      setCurrentPage(1);
    }, 400);
  };

  // Close sort menu on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Fetch categories once
  useEffect(() => {
    setLoadingCategories(true);
    api.request("/categories", { method: "GET", params: { type: "product" } })
      .then((res: any) => setCategories(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  // Fetch products
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        // per_page non transmis : le reglage « produits par page » du
        // backoffice decide (Setting::get('products_per_page'))
        sort: sortBy,
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategoryId !== null) params.category_id = selectedCategoryId;

      const res = await fetchProducts(params);
      const mapped: Product[] = (res?.data ?? []).map(mapApiProduct);
      setProducts(mapped);
      setPagination(res?.pagination ?? null);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentPage, searchTerm, selectedCategoryId, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Offres du moment : requete dediee (on_sale=1), independante de la page
  // affichee et des filtres. Auparavant on filtrait la page courante sur un
  // champ « discount » que l'API n'envoyait jamais : la section ne s'affichait
  // donc jamais.
  const [flashDeals, setFlashDeals] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;

    fetchProducts({ on_sale: 1, sort: "discount", per_page: 8 })
      .then((res) => {
        if (active) setFlashDeals((res?.data ?? []).map(mapApiProduct));
      })
      .catch(() => { if (active) setFlashDeals([]); });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (flashDeals.length < 2) return;
    const id = setInterval(() => setFlashIndex((i) => (i + 1) % flashDeals.length), 5000);
    return () => clearInterval(id);
  }, [flashDeals.length]);

  const discounted = (price: number, pct: number) =>
    pct > 0 ? price - (price * pct) / 100 : price;

  const SORT_OPTIONS = [
    { value: "newest", label: tx("Plus récents", "Newest") },
    { value: "price-low", label: tx("Prix croissant", "Price: low to high") },
    { value: "price-high", label: tx("Prix décroissant", "Price: high to low") },
    { value: "rating", label: tx("Mieux notés", "Top rated") },
  ];

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? tx("Trier", "Sort");
  const total = pagination?.total ?? products.length;

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 transition-colors duration-300">

      {/* ── Hero ── */}
      <section className="relative pt-20 sm:pt-28 pb-10 overflow-hidden bg-brand-800">
        <PageHeroMedia photo={SHOP_HEADER_PHOTO} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          {/* Watermark logo */}
          <img
            src="/logo-transparent.webp"
            alt=""
            aria-hidden="true"
            className="absolute right-[-6%] top-1/2 -translate-y-1/2 w-[320px] sm:w-[460px] lg:w-[580px] select-none opacity-[0.18]"
            style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 30px rgba(255,255,255,0.35))" }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-5"
          >
            <Truck className="w-4 h-4" />
            {tx("Livraison gratuite à Yaoundé", "Free delivery in Yaoundé")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-3 leading-tight"
          >
            {tx("Boutique RT-WATER SOLUTION SARL", "RT-WATER SOLUTION Shop")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-base sm:text-lg mb-8"
          >
            {tx("Produits certifiés pour le traitement et la purification de l'eau", "Certified products for water treatment and purification")}
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-2xl mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 w-5 h-5 z-10" aria-hidden="true" />
            <input
              type="search"
              aria-label={tx("Rechercher un produit", "Search products")}
              placeholder={tx("Rechercher un produit...", "Search products...")}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-0 bg-white dark:bg-ink-800 text-ink-900 dark:text-white placeholder-ink-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-2xl text-sm sm:text-base transition-all"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearchTerm(""); setCurrentPage(1); }}
                aria-label={tx("Effacer la recherche", "Clear search")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 sm:gap-12 py-3 overflow-x-auto scrollbar-hide">
            {[
              { icon: Truck, label: tx("Livraison gratuite à Yaoundé", "Free delivery in Yaoundé") },
              { icon: Shield, label: tx("Paiement Mobile Money sécurisé", "Secure Mobile Money payment") },
              { icon: Award, label: tx("Garantie qualité", "Quality guarantee") },
              { icon: Zap, label: tx("Conseil d'experts", "Expert advice") },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs sm:text-sm text-ink-600 dark:text-ink-400 whitespace-nowrap flex-shrink-0">
                <Icon className="w-4 h-4 text-brand-600" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Flash deals ── */}
      {flashDeals.length > 0 && (
        <section className="bg-gradient-to-r from-brand-600 to-aqua-500 py-5 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 animate-pulse" />
                {tx("Promotions", "Deals")}
              </h2>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {flashDeals.length} {tx(flashDeals.length > 1 ? "offres en cours" : "offre en cours", flashDeals.length > 1 ? "deals running" : "deal running")}
                </div>
                {flashDeals.length > 1 && (
                  <div className="flex gap-1.5">
                    <button aria-label={tx("Offre précédente", "Previous deal")} onClick={() => setFlashIndex((i) => (i - 1 + flashDeals.length) % flashDeals.length)} className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button aria-label={tx("Offre suivante", "Next deal")} onClick={() => setFlashIndex((i) => (i + 1) % flashDeals.length)} className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={flashIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
                className="bg-white dark:bg-ink-800 rounded-2xl p-4 sm:p-6 shadow-2xl"
              >
                {flashDeals[flashIndex] && (() => {
                  const deal = flashDeals[flashIndex];
                  const finalPrice = discounted(deal.price, deal.discount);
                  return (
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center">
                      <div className="relative w-full sm:w-64 h-48 sm:h-56 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-brand-50 to-aqua-50 dark:from-ink-800 dark:to-ink-900">
                        {deal.image ? (
                          <img src={deal.image} alt={deal.name} decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-brand-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg animate-pulse">
                          -{deal.discount}%
                        </div>
                      </div>
                      <div className="flex-1 w-full">
                        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">{deal.category}</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white mb-2">{deal.name}</h3>
                        {deal.description && <p className="text-sm text-ink-500 dark:text-ink-400 mb-4 line-clamp-2">{deal.description}</p>}
                        <div className="flex items-baseline gap-3 mb-5">
                          <span className="text-3xl font-bold text-brand-600 dark:text-aqua-500">{Math.round(finalPrice).toLocaleString(locale)} XAF</span>
                          <span className="text-lg line-through text-ink-400">{deal.price.toLocaleString(locale)} XAF</span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => addToCart({ id: deal.id, name: deal.name, price: finalPrice, image: deal.image, description: deal.description })}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-aqua-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
                          >
                            <ShoppingCart className="w-5 h-5" />
                            {tx("Ajouter au panier", "Add to cart")}
                          </button>
                          <button
                            onClick={() => { setSelectedProduct(deal); setIsDetailsOpen(true); }}
                            className="flex items-center gap-2 px-5 py-3 bg-ink-100 dark:bg-ink-700 text-ink-900 dark:text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">{tx("Voir détails", "View details")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── Category tabs (sticky) ── */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-ink-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {/* "Tous" pill */}
            <button
              onClick={() => { setSelectedCategoryId(null); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold whitespace-nowrap text-sm transition-all flex-shrink-0 ${
                selectedCategoryId === null
                  ? "bg-gradient-to-r from-brand-600 to-aqua-500 text-white shadow-md"
                  : "bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700"
              }`}
            >
              <Droplets className="w-4 h-4" />
              {tx("Tous les produits", "All products")}
            </button>

            {loadingCategories
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="h-9 w-28 rounded-full bg-ink-200 dark:bg-ink-700 animate-pulse flex-shrink-0" />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategoryId(cat.id); setCurrentPage(1); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold whitespace-nowrap text-sm transition-all flex-shrink-0 ${
                      selectedCategoryId === cat.id
                        ? "bg-gradient-to-r from-brand-600 to-aqua-500 text-white shadow-md"
                        : "bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700"
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {cat.name}
                    {cat.products_count !== undefined && cat.products_count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        selectedCategoryId === cat.id ? "bg-white/25" : "bg-ink-200 dark:bg-ink-600 text-ink-600 dark:text-ink-300"
                      }`}>
                        {cat.products_count}
                      </span>
                    )}
                  </button>
                ))}
          </div>
        </div>
      </div>

      {/* ── Products grid ── */}
      <section ref={gridRef} className="scroll-mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            {loadingProducts ? (
              <span className="h-4 w-24 bg-ink-200 dark:bg-ink-700 rounded animate-pulse inline-block" />
            ) : (
              <span>
                <span className="font-bold text-ink-900 dark:text-white">{total}</span> {tx(total > 1 ? "produits" : "produit", total === 1 ? "product" : "products")}
                {searchTerm && <span className="ml-1">{tx("pour", "for")} «&nbsp;{searchTerm}&nbsp;»</span>}
              </span>
            )}
          </div>

          {/* Sort */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setShowSortMenu((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={showSortMenu}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl text-sm font-semibold text-ink-700 dark:text-ink-300 hover:border-brand-600 transition-all shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {currentSortLabel}
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl shadow-xl overflow-hidden z-50 min-w-44"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setCurrentPage(1); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === opt.value
                          ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-aqua-500 font-semibold"
                          : "text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-brand-600/40" />
            </div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-2">{tx("Aucun produit trouvé", "No products found")}</h3>
            <p className="text-ink-500 dark:text-ink-400 text-sm mb-6">
              {searchTerm ? tx(`Aucun résultat pour "${searchTerm}"`, `No results for "${searchTerm}"`) : tx("Aucun produit dans cette catégorie", "No products in this category")}
            </p>
            <button
              onClick={() => { setSearchInput(""); setSearchTerm(""); setSelectedCategoryId(null); setCurrentPage(1); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-aqua-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
            >
              <X className="w-4 h-4" />
              {tx("Effacer les filtres", "Clear filters")}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`${selectedCategoryId}-${searchTerm}-${sortBy}-${currentPage}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
          >
            {products.map((product, idx) => {
              const finalPrice = discounted(product.price, product.discount);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="group bg-white dark:bg-ink-900 rounded-2xl overflow-hidden border border-ink-200 dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-400/40 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-40 sm:h-52 overflow-hidden bg-gradient-to-br from-brand-50 to-ink-100 dark:from-ink-700 dark:to-ink-600 flex-shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Droplets className="w-12 h-12 text-brand-200 dark:text-ink-500" />
                      </div>
                    )}

                    <FavoriteButton
                      product={{ id: product.id, name: product.name, price: product.price, discount: product.discount, image: product.image }}
                      size="sm"
                      className="absolute top-2 left-2 z-10"
                    />

                    {/* Badges */}
                    {product.discount > 0 && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-xs shadow">
                        -{product.discount}%
                      </div>
                    )}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white text-ink-800 font-bold text-xs px-3 py-1 rounded-full">{tx("Épuisé", "Sold out")}</span>
                      </div>
                    )}

                    {/* Hover overlay (desktop) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-end p-3 gap-2">
                      <button
                        onClick={() => { setSelectedProduct(product); setIsDetailsOpen(true); }}
                        className="flex-1 bg-white text-brand-600 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> {tx("Aperçu", "Quick view")}
                      </button>
                      <button
                        onClick={() => addToCart({ id: product.id, name: product.name, price: finalPrice, image: product.image, description: product.description })}
                        disabled={!product.inStock}
                        className="flex-1 bg-gradient-to-r from-brand-600 to-aqua-500 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> {tx("Ajouter", "Add")}
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    {product.category && (
                      <span className="text-[10px] sm:text-xs font-semibold text-brand-600/70 dark:text-aqua-500/70 uppercase tracking-wider mb-1">{product.category}</span>
                    )}

                    <h3 className="font-semibold text-ink-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-tight mb-2 group-hover:text-brand-600 dark:group-hover:text-aqua-500 transition-colors">
                      <Link to={productPath(product)} className="hover:underline focus-visible:underline outline-none">
                        {product.name}
                      </Link>
                    </h3>

                    {product.reviews > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-ink-300"}`} />
                        ))}
                        <span className="text-[10px] text-ink-500 dark:text-ink-400 ml-0.5">({product.reviews})</span>
                      </div>
                    )}

                    <div className="mt-auto">
                      <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 mb-2">
                        <span className="text-sm sm:text-lg font-bold text-brand-600 dark:text-aqua-500">
                          {Math.round(finalPrice).toLocaleString(locale)} <span className="text-[10px] sm:text-xs font-medium">XAF</span>
                        </span>
                        {product.discount > 0 && (
                          <span className="text-[10px] sm:text-xs line-through text-ink-400">{product.price.toLocaleString(locale)} XAF</span>
                        )}
                      </div>

                      <div className="hidden sm:flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium mb-2">
                        <Truck className="w-3 h-3" /> {tx("Livraison gratuite", "Free delivery")}
                      </div>

                      {/* Mobile buttons */}
                      <div className="flex gap-1.5 sm:hidden">
                        <button
                          onClick={() => { setSelectedProduct(product); setIsDetailsOpen(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-700 text-brand-600 dark:text-aqua-500 flex-shrink-0"
                          aria-label={tx(`Aperçu de ${product.name}`, `Quick view of ${product.name}`)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => addToCart({ id: product.id, name: product.name, price: finalPrice, image: product.image, description: product.description })}
                          disabled={!product.inStock}
                          className="flex-1 h-8 flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-brand-600 to-aqua-500 text-white text-[10px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          {product.inStock ? tx("Ajouter", "Add") : tx("Épuisé", "Sold out")}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current_page === 1}
              aria-label={tx("Page précédente", "Previous page")}
              className="p-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:border-brand-600 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-ink-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    aria-current={p === pagination.current_page ? "page" : undefined}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      p === pagination.current_page
                        ? "bg-gradient-to-r from-brand-600 to-aqua-500 text-white shadow-md"
                        : "bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300 hover:border-brand-600 hover:text-brand-600 shadow-sm"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
              disabled={pagination.current_page === pagination.last_page}
              aria-label={tx("Page suivante", "Next page")}
              className="p-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:border-brand-600 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        {pagination && (
          <p className="text-center text-xs text-ink-400 dark:text-ink-600 mt-3">
            {tx("Page", "Page")} {pagination.current_page} {tx("sur", "of")} {pagination.last_page} · {pagination.total} {tx(pagination.total > 1 ? "produits" : "produit", pagination.total === 1 ? "product" : "products")}
          </p>
        )}
        <RecentlyViewed />
      </section>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetails
            product={selectedProduct}
            isOpen={isDetailsOpen}
            onClose={() => { setIsDetailsOpen(false); setSelectedProduct(null); }}
            onAddToCart={(quantity) => {
              addToCart({
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: discounted(selectedProduct.price, selectedProduct.discount ?? 0),
                image: selectedProduct.image,
                description: selectedProduct.description,
              }, quantity);
              setIsDetailsOpen(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
