import { useState, useEffect } from "react";
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Star, Truck, Award, Zap, Filter, X, Eye, ShoppingCart, TrendingUp, Sparkles, Clock, Users, Shield, Gift, ArrowRight, ChevronLeft, ChevronRight, Flame, Droplets, Wind, Beaker, BarChart3, Wrench } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useTheme } from "../../../theme/ThemeContext";
import { useCart } from "../../../context/CartContext";
import { ProductDetails } from "../ProductDetails";
import { fetchProducts } from "../../../services/products";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  discount?: number;
  stock: number;
  warranty: string;
  specifications: string[];
  features: string[];
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  soldCount?: number;
}

const CATEGORIES = [
  { id: "all", name: "Tous les produits", icon: "Droplets" },
  { id: "pumps", name: "Pompes", icon: "Wind" },
  { id: "filtration", name: "Filtration", icon: "Filter" },
  { id: "treatment", name: "Traitement", icon: "Beaker" },
  { id: "testing", name: "Tests & Analyses", icon: "BarChart3" },
  { id: "accessories", name: "Accessoires", icon: "Wrench" },
];



export function ShopPage() {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const { addToCart } = useCart();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [flashDealIndex, setFlashDealIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; per_page: number; total: number } | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Derived from products state — must be declared BEFORE the useEffect that references it
  const FLASH_DEALS = products.filter(p => p.discount && p.discount >= 20).slice(0, 4);

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-rotation des flash deals — dep on length so closure stays fresh
  useEffect(() => {
    if (FLASH_DEALS.length === 0) return;
    const interval = setInterval(() => {
      setFlashDealIndex((prev) => (prev + 1) % FLASH_DEALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [FLASH_DEALS.length]);

  // Fetch products from API (server-side pagination & filters)
  useEffect(() => {
    let mounted = true;
    setLoadingProducts(true);
    (async () => {
      try {
        const params: Record<string, any> = { page: currentPage, per_page: perPage };
        if (searchTerm) params.search = searchTerm;
        if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
        if (sortBy) params.sort = sortBy;

        const res = await fetchProducts(params);
        if (!mounted) return;
        const apiProducts = res?.data?.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          price: p.price,
          image: p.image_url || 'https://placehold.co/500x500/0077BE/white?text=Product',
          category: p.category?.name || 'all',
          description: p.description || '',
          rating: p.avg_rating ?? (p.rating ?? 0),
          reviews: p.review_count ?? (p.reviews ?? 0),
          discount: p.discount ?? 0,
          stock: p.stock ?? 0,
          warranty: p.warranty ?? '',
          specifications: p.specifications ?? [],
          features: p.features ?? [],
          inStock: !!p.is_available,
          isNew: false,
          isBestSeller: false,
          isOnSale: !!p.discount,
          soldCount: p.sold_count ?? 0,
        }));

        setProducts(Array.isArray(apiProducts) ? apiProducts : []);
        if (res?.pagination) {
          setPagination(res.pagination);
        } else {
          setPagination(null);
        }
      } catch (e) {
        console.warn('Failed to fetch products', e);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    })();

    return () => { mounted = false; };
  }, [currentPage, perPage, searchTerm, selectedCategory, sortBy]);

  // Get special products
  const newProducts = products.filter((p) => p.isNew).slice(0, 6);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 6);
  const specialOffers = products.filter((p) => p.isOnSale).slice(0, 6);

  const translations: Record<string, Record<string, string>> = {
    en: {
      shop_title: "Online Water Shop",
      shop_subtitle: "Premium water treatment products and equipment",
      search_placeholder: "Search products...",
      filter_category: "Filter by Category",
      sort_newest: "Newest",
      sort_price_low: "Price: Low to High",
      sort_price_high: "Price: High to Low",
      sort_rating: "Top Rated",
      no_results: "No products found",
      in_stock: "In Stock",
      out_stock: "Out of Stock",
      add_to_cart: "Add to Cart",
      free_shipping: "Free Shipping",
      warranty: "Warranty:",
      features: "Key Features:",
      specifications: "Specifications:",
      limited_offer: "Limited Offer",
      new_products: "New Products",
      best_sellers: "Best Sellers",
      special_offers: "Special Offers",
      flash_deals: "Flash Deals",
      ends_in: "Expires dans",
      sold: "vendus",
      trending: "Tendances",
      shop_now: "Acheter",
      view_all: "View All",
      filters: "Filters",
      products_count: "products",
    },
    fr: {
      shop_title: "Boutique d'Eau en Ligne",
      shop_subtitle: "Produits et équipements premium pour le traitement de l'eau",
      search_placeholder: "Rechercher des produits...",
      filter_category: "Filtrer par Catégorie",
      sort_newest: "Plus récents",
      sort_price_low: "Prix: Bas vers Haut",
      sort_price_high: "Prix: Haut vers Bas",
      sort_rating: "Mieux notés",
      no_results: "Aucun produit trouvé",
      in_stock: "En Stock",
      out_stock: "Rupture de Stock",
      add_to_cart: "Ajouter au Panier",
      free_shipping: "Livraison Gratuite",
      warranty: "Garantie:",
      features: "Caractéristiques:",
      specifications: "Spécifications:",
      limited_offer: "Offre Limitée",
      new_products: "Nouveautés",
      best_sellers: "Meilleures Ventes",
      special_offers: "Offres Spéciales",
      flash_deals: "Ventes Flash",
      ends_in: "Se termine dans",
      sold: "vendus",
      trending: "Tendances",
      shop_now: "Acheter",
      view_all: "Voir tout",
      filters: "Filtres",
      products_count: "produits",
    },
  };

  const text = translations[language] || translations.en;

  // Filter and sort products
  // If the API provides pagination we assume filtering/search is handled server-side.
  let filteredProducts: Product[];
  if (pagination) {
    filteredProducts = products;
  } else {
    filteredProducts = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  // Sort products
  filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.price - (a.discount || 0)) - (b.price - (b.discount || 0));
      case "price-high":
        return (b.price - (b.discount || 0)) - (a.price - (a.discount || 0));
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const calculateDiscount = (price: number, discount?: number) => {
    if (!discount) return price;
    return price - (price * discount) / 100;
  };

  // (newProducts, bestSellers, specialOffers derived earlier from products)

  const nextFlashDeal = () => {
    setFlashDealIndex((prev) => (prev + 1) % FLASH_DEALS.length);
  };

  const prevFlashDeal = () => {
    setFlashDealIndex((prev) => (prev - 1 + FLASH_DEALS.length) % FLASH_DEALS.length);
  };

  const renderCategoryIcon = (iconName: string) => {
    const iconProps = "w-5 h-5";
    const iconMap: { [key: string]: React.ReactNode } = {
      Droplets: <Droplets className={iconProps} />,
      Wind: <Wind className={iconProps} />,
      Filter: <Filter className={iconProps} />,
      Beaker: <Beaker className={iconProps} />,
      BarChart3: <BarChart3 className={iconProps} />,
      Wrench: <Wrench className={iconProps} />,
    };
    return iconMap[iconName] || <Droplets className={iconProps} />;
  };

  const renderProductCarousel = (
    products: Product[],
    title: string,
    badgeColor: string
  ) => {
    if (products.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 lg:mb-16"
      >
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <motion.button
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:flex items-center gap-2 text-[#0077BE] dark:text-[#00A8E8] font-semibold group text-sm lg:text-base"
          >
            {text.view_all}
            <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
        <div className="overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 lg:gap-6 w-max">
            {products.map((product, idx) => {
              const discountedPrice = calculateDiscount(
                product.price,
                product.discount
              );
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: isMobile ? 0 : -10, scale: isMobile ? 1 : 1.02 }}
                  className="flex-shrink-0 w-72 sm:w-80 group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#0077BE]"
                >
                  <div className="relative h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                    />
                    <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-start justify-between gap-2">
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-gradient-to-r from-[#0095D9] to-[#0077BE] text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg backdrop-blur-sm"
                      >
                        {title === text.new_products
                          ? "Nouveau"
                          : title === text.best_sellers
                            ? "Top"
                            : product.discount > 0 ? `-${product.discount}%` : "Promo"}
                      </motion.div>
                      {product.soldCount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-black/70 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                        >
                          <Users className="w-3 h-3 inline mr-1" />
                          {product.soldCount > 1000 ? `${(product.soldCount / 1000).toFixed(1)}k` : product.soldCount}
                        </motion.div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3 sm:p-4 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsDetailsOpen(true);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-2 bg-white text-[#0077BE] px-2 sm:px-3 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-xl transition-all text-xs sm:text-sm"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Détails</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: discountedPrice,
                            image: product.image,
                            description: product.description,
                          })
                        }
                        disabled={product.stock === 0}
                        className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 rounded-xl font-semibold transition-all text-xs sm:text-sm bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white hover:shadow-xl hover:from-[#00A8E8] hover:to-[#0077BE]"
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Panier</span>
                      </motion.button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {product.rating} <span className="hidden sm:inline">({product.reviews})</span>
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm sm:text-base group-hover:text-[#0077BE] dark:group-hover:text-[#00A8E8] transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
                      <span className="text-xl sm:text-2xl font-bold text-[#0077BE] dark:text-[#00A8E8]">
                        {discountedPrice.toLocaleString('fr-FR')} XAF
                      </span>
                      {product.discount > 0 && (
                        <span className="text-xs sm:text-sm line-through text-gray-400">
                          {product.price.toLocaleString('fr-FR')} XAF
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      <span>Livraison gratuite</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Hero Section avec animation */}
      <section className="relative pt-20 sm:pt-24 pb-8 sm:pb-12 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-slate-800 dark:via-blue-900 dark:to-slate-900">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#00A8E8]/20 dark:bg-[#00A8E8]/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#0077BE]/20 dark:bg-[#0077BE]/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-3 sm:mb-4"
            >
              <span className="bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2">
                <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Livraison Gratuite sur Toutes les Commandes</span>
                <span className="sm:hidden">Livraison Gratuite</span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0077BE] via-[#00A8E8] to-[#0077BE] mb-3 sm:mb-4 px-4"
            >
              {text.shop_title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4"
            >
              {text.shop_subtitle}
            </motion.p>

            {/* Search Bar améliorée */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-3xl mx-auto px-4"
            >
              <div className="relative group">
                <Search className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6 z-10" />
                <input
                  type="text"
                  placeholder={text.search_placeholder}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl border-2 border-gray-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-[#0077BE] dark:focus:border-[#00A8E8] focus:ring-4 focus:ring-[#0077BE]/20 transition-all shadow-xl text-sm sm:text-base lg:text-lg"
                />
                <motion.div
                  className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#0077BE] to-[#00A8E8] opacity-0 group-hover:opacity-10 transition-opacity -z-10 blur"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Benefits Bar animé */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          >
            {[
              { icon: Truck, text: text.free_shipping, color: "from-green-500 to-emerald-500" },
              { icon: Shield, text: "Paiement Sécurisé", color: "from-blue-500 to-cyan-500" },
              { icon: Award, text: "Garantie Qualité", color: "from-[#0077BE] to-[#00A8E8]" },
              { icon: Zap, text: "Support 24/7", color: "from-[#00A8E8] to-[#0095D9]" },
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: isMobile ? 1 : 1.05, y: isMobile ? 0 : -5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all group"
              >
                <div className={`p-2 sm:p-3 rounded-full bg-gradient-to-r ${benefit.color} group-hover:scale-110 transition-transform`}>
                  <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white text-center">
                  {benefit.text}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Flash Deals Carousel - Responsive */}
      <section className="py-6 sm:py-8 bg-gradient-to-r from-[#0077BE] via-[#00A8E8] to-[#0095D9] relative overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
              {text.flash_deals}
            </h2>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{text.ends_in}:</span>
                23:45:12
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prevFlashDeal}
                  className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  aria-label="Previous deal"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={nextFlashDeal}
                  className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  aria-label="Next deal"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={flashDealIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl"
            >
              {FLASH_DEALS[flashDealIndex] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
                  <div className="relative group order-2 md:order-1">
                    <motion.div
                      whileHover={{ scale: isMobile ? 1 : 1.05 }}
                      className="relative overflow-hidden rounded-xl sm:rounded-2xl"
                    >
                      <img
                        src={FLASH_DEALS[flashDealIndex].image}
                        alt={FLASH_DEALS[flashDealIndex].name}
                        className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                      />
                      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-gradient-to-r from-[#0095D9] to-[#0077BE] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-lg sm:text-xl lg:text-2xl shadow-lg animate-pulse">
                        -{FLASH_DEALS[flashDealIndex].discount}%
                      </div>
                    </motion.div>
                  </div>
                  <div className="order-1 md:order-2">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                      {FLASH_DEALS[flashDealIndex].name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                      {FLASH_DEALS[flashDealIndex].description}
                    </p>
                    <div className="flex items-baseline gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0077BE] dark:text-[#00A8E8]">
                        {calculateDiscount(FLASH_DEALS[flashDealIndex].price, FLASH_DEALS[flashDealIndex].discount).toLocaleString('fr-FR')} XAF
                      </span>
                      <span className="text-lg sm:text-xl lg:text-2xl line-through text-gray-400">
                        {FLASH_DEALS[flashDealIndex].price.toLocaleString('fr-FR')} XAF
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <motion.button
                        whileHover={{ scale: isMobile ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart({
                          id: FLASH_DEALS[flashDealIndex].id,
                          name: FLASH_DEALS[flashDealIndex].name,
                          price: calculateDiscount(FLASH_DEALS[flashDealIndex].price, FLASH_DEALS[flashDealIndex].discount),
                          image: FLASH_DEALS[flashDealIndex].image,
                          description: FLASH_DEALS[flashDealIndex].description,
                        })}
                        className="flex-1 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2 sm:gap-3"
                      >
                        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                        {text.add_to_cart}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: isMobile ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedProduct(FLASH_DEALS[flashDealIndex]);
                          setIsDetailsOpen(true);
                        }}
                        className="sm:flex-none px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="sm:hidden">Détails</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Categories horizontales - Sticky sur desktop */}
      <section className="py-4 sm:py-6 lg:py-8 bg-white dark:bg-slate-900 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: isMobile ? 1 : 1.05, y: isMobile ? 0 : -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold whitespace-nowrap transition-all text-xs sm:text-sm lg:text-base ${selectedCategory === cat.id
                  ? "bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white shadow-lg"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:shadow-md"
                  }`}
              >
                {renderCategoryIcon(cat.icon)}
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Special Products Carousels */}
      <section className="py-8 sm:py-12 lg:py-16 xl:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderProductCarousel(newProducts, text.new_products, "bg-gradient-to-r from-[#0095D9] to-[#0077BE]")}
          {renderProductCarousel(bestSellers, text.best_sellers, "bg-gradient-to-r from-[#00A8E8] to-[#0095D9]")}
          {renderProductCarousel(
            specialOffers,
            text.special_offers,
            "bg-gradient-to-r from-[#0077BE] to-[#0095D9]"
          )}
        </div>
      </section>

      {/* Shop Section - Grid Responsive */}
      <section className="py-8 sm:py-12 lg:py-16 xl:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8 lg:mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3"
            >
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#0077BE]" />
              Tous les Produits
            </motion.h2>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-semibold">
              {filteredProducts.length} {text.products_count}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 sm:py-16"
            >
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                {text.no_results}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
            >
              {filteredProducts.map((product, index) => {
                const discountedPrice = calculateDiscount(product.price, product.discount);

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: isMobile ? 0 : -6 }}
                    className="group bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-transparent hover:border-[#0077BE] flex flex-col"
                  >
                    {/* Image Container */}
                    <div className="relative h-36 sm:h-56 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const t = e.currentTarget;
                          t.style.display = 'none';
                          const parent = t.parentElement;
                          if (parent && !parent.querySelector('.img-fallback')) {
                            const fb = document.createElement('div');
                            fb.className = 'img-fallback absolute inset-0 flex items-center justify-center';
                            fb.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 3H8l-2 4h12l-2-4z"/></svg>';
                            parent.appendChild(fb);
                          }
                        }}
                      />
                      {product.discount > 0 && (
                        <div className="absolute top-1.5 sm:top-3 right-1.5 sm:right-3 bg-gradient-to-r from-[#0095D9] to-[#0077BE] text-white px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold text-[10px] sm:text-sm shadow-lg">
                          -{product.discount}%
                        </div>
                      )}
                      {product.isBestSeller && (
                        <div className="absolute top-1.5 sm:top-3 left-1.5 sm:left-3 bg-gradient-to-r from-[#00A8E8] to-[#0077BE] text-white px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
                          Top
                        </div>
                      )}
                      {product.isNew && (
                        <div className="absolute top-1.5 sm:top-3 left-1.5 sm:left-3 bg-gradient-to-r from-[#00A8E8] to-[#0077BE] text-white px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg animate-pulse">
                          Nouveau
                        </div>
                      )}
                      {/* Desktop-only hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-end p-4 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsDetailsOpen(true);
                          }}
                          className="flex-1 bg-white text-[#0077BE] px-3 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" /> Voir
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addToCart({
                            id: product.id,
                            name: product.name,
                            price: discountedPrice,
                            image: product.image,
                            description: product.description
                          })}
                          disabled={!product.inStock}
                          className="flex-1 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-3 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <ShoppingCart className="w-4 h-4" /> Ajouter
                        </motion.button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 sm:p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-0.5 mb-1 sm:mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                              }`}
                          />
                        ))}
                        {product.reviews > 0 && (
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 ml-0.5">
                            ({product.reviews})
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold sm:font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2 text-xs sm:text-sm group-hover:text-[#0077BE] dark:group-hover:text-[#00A8E8] transition-colors leading-tight">
                        {product.name}
                      </h3>

                      <div className="mt-auto">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 mb-2">
                          <span className="text-sm sm:text-xl font-bold text-[#0077BE] dark:text-[#00A8E8] leading-tight">
                            {discountedPrice.toLocaleString('fr-FR')} <span className="text-xs sm:text-sm font-semibold">XAF</span>
                          </span>
                          {product.discount > 0 && (
                            <span className="text-[10px] sm:text-sm line-through text-gray-400">
                              {product.price.toLocaleString('fr-FR')} XAF
                            </span>
                          )}
                        </div>

                        {product.soldCount > 0 && (
                          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            {product.soldCount > 1000 ? `${(product.soldCount / 1000).toFixed(1)}k` : product.soldCount} {text.sold}
                          </div>
                        )}

                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-semibold mb-0">
                          <Truck className="w-3 h-3" />
                          <span>Livraison gratuite</span>
                        </div>

                        {/* Mobile-only: always-visible action buttons */}
                        <div className="flex gap-1.5 sm:hidden mt-1.5">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDetailsOpen(true);
                            }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-[#0077BE] dark:text-[#00A8E8] flex-shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => addToCart({
                              id: product.id,
                              name: product.name,
                              price: discountedPrice,
                              image: product.image,
                              description: product.description
                            })}
                            disabled={!product.inStock}
                            className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white text-[10px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            {product.inStock ? 'Ajouter' : 'Épuisé'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          {pagination && (
            <div className="mt-6 flex items-center justify-center gap-3 w-full">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page === 1}
                className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>

              <div className="text-sm text-slate-600">
                Page {pagination.current_page} / {pagination.last_page} — {pagination.total} produits
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page === pagination.last_page}
                className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetails
            product={selectedProduct}
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedProduct(null);
            }}
            onAddToCart={() => {
              addToCart({
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: selectedProduct.price - (selectedProduct.price * (selectedProduct.discount || 0)) / 100,
                image: selectedProduct.image,
                description: selectedProduct.description,
              });
              setIsDetailsOpen(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}