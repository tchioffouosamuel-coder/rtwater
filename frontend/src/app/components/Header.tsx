import { Menu, X, Sun, Moon, Globe, ShoppingCart, UserCircle2, Package, LogIn, LogOut, Truck, Heart } from "lucide-react";
import { useShopMemory } from "../../context/ShopMemoryContext";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../../theme/ThemeContext";
import { useI18n } from "../../i18n/I18nContext";
import { useCart } from "../../context/CartContext";
import { useCartUI } from "../../context/CartUIContext";
import { useUserAuth } from "../../context/UserAuthContext";
import { useSiteContent } from "../../context/SiteContentContext";
import { DEFAULT_HEADER } from "../../types/site-content";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, tx } = useI18n();
  const { cartCount } = useCart();
  const { openCart } = useCartUI();
  const { user, logout } = useUserAuth();
  const { contact } = useSiteContent();
  const { favorites } = useShopMemory();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Le bandeau ne se détache du contenu qu'une fois le défilement amorcé
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep the requested public menu independent from older CMS menu settings.
  const EN_LABELS: Record<string, string> = {
    "/": "Home", "/gallery": "Gallery", "/about": "About", "/devis": "Quote",
    "/shop": "Shop", "/contact": "Contact", "/blog": "Blog",
    "/#nouveautes": "Products", "/#services": "Services",
  };
  const menuItems = DEFAULT_HEADER.navLinks.map((item) =>
    language === "en" && EN_LABELS[item.path] ? { ...item, label: EN_LABELS[item.path] } : item
  );

  // Certaines rubriques du menu (Produits, Services) visent une section de l'accueil
  const scrollToAnchor = (id: string, attempt = 0) => {
    const target = document.getElementById(id);
    if (!target) {
      // Après un changement de page, la section n'est montée qu'au rendu suivant
      if (attempt < 12) window.setTimeout(() => scrollToAnchor(id, attempt + 1), 60);
      return;
    }
    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  const handleNavigation = (path: string) => {
    setMobileMenuOpen(false);
    const [route, anchor] = path.split("#");
    const to = route || "/";
    if (anchor) {
      if (location.pathname !== to) navigate(to);
      scrollToAnchor(anchor);
      return;
    }
    navigate(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isActive = (path: string) => {
    // Une ancre ne désigne pas une page : on ne la souligne pas
    if (path.includes("#")) return false;
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-ink-50 dark:bg-ink-900 shadow-sm border-b border-ink-200 dark:border-white/10"
            : "bg-ink-50 dark:bg-ink-900 border-b border-ink-200/70 dark:border-white/10"
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.button
              onClick={() => handleNavigation("/")}
              className="flex items-center flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <img src="/logo.webp" alt="RT Water Solution"               className="h-12 w-auto" />
            </motion.button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-4 xl:gap-6">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 + 0.3 }}
                  className={`transition-all duration-300 font-medium text-sm whitespace-nowrap relative group ${isActive(item.path)
                      ? "text-brand-600 dark:text-aqua-500"
                      : "text-ink-600 dark:text-ink-400 hover:text-brand-600 dark:hover:text-aqua-500"
                    }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-aqua-500 transition-transform duration-300 origin-left ${isActive(item.path)
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                      }`}
                  ></span>
                </motion.button>
              ))}
            </div>

            {/* Right side controls - Desktop */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              {/* Favoris */}
              <button
                onClick={() => navigate('/favoris')}
                aria-label={tx("Mes favoris", "My favourites")}
                title={tx("Mes favoris", "My favourites")}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-ink-600 dark:text-ink-400 hover:text-red-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-all duration-300"
              >
                <Heart className={`w-5 h-5 ${favorites.length ? "fill-red-500 text-red-500" : ""}`} />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {favorites.length > 9 ? "9+" : favorites.length}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <motion.button
                onClick={openCart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-ink-600 dark:text-ink-400 hover:text-brand-600 dark:hover:text-aqua-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-all duration-300"
                title={t("shop.cart")}
                aria-label={t("shop.cart")}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </motion.button>

              {/* Language Toggle */}
              <motion.button
                onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-ink-600 dark:text-ink-400 hover:text-brand-600 dark:hover:text-aqua-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-all duration-300"
                title={t("common.language")}
              >
                <Globe className="w-5 h-5" />
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-ink-600 dark:text-ink-400 hover:text-brand-600 dark:hover:text-aqua-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-all duration-300"
                title={theme === "light" ? t("common.darkMode") : t("common.lightMode")}
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </motion.button>

              {/* Separator */}
              <div className="h-6 w-px bg-ink-200 dark:bg-ink-700 mx-1" />
              {/* User / Login */}
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-1.5 text-sm font-medium text-ink-700 dark:text-ink-200 hover:text-brand-600 dark:hover:text-aqua-500 transition-colors"
                    title={tx("Mon compte", "My account")}
                  >
                    <UserCircle2 className="w-5 h-5" />
                    {user.name.split(' ')[0]}
                  </button>
                  <motion.button
                    onClick={async () => { await logout(); navigate('/'); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 rounded-lg bg-ink-100 dark:bg-ink-700 text-sm"
                  >
                    {tx("Déconnexion", "Sign out")}
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors"
                >
                  {tx("Connexion", "Sign in")}
                </motion.button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Favoris */}
              <button
                onClick={() => navigate('/favoris')}
                aria-label={tx("Mes favoris", "My favourites")}
                title={tx("Mes favoris", "My favourites")}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-ink-600 dark:text-ink-400 hover:text-red-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-all duration-300"
              >
                <Heart className={`w-5 h-5 ${favorites.length ? "fill-red-500 text-red-500" : ""}`} />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {favorites.length > 9 ? "9+" : favorites.length}
                  </span>
                )}
              </button>

              {/* Mobile Cart Button */}
              <motion.button
                onClick={openCart}
                aria-label={t("shop.cart")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-ink-600 dark:text-ink-400 hover:text-brand-600 dark:hover:text-aqua-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-all duration-300"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </motion.button>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-ink-600 dark:text-ink-400 hover:text-brand-600 dark:hover:text-aqua-500 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-ink-800 shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              {/* Sidebar Header */}
              <div className="bg-brand-800 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-white font-extrabold text-base leading-none">{header.companyName}</span>
                      <span className="text-white/70 font-semibold text-[10px] tracking-widest uppercase leading-none mt-0.5">{header.companyTagline}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Actions in Sidebar */}
                <div className="space-y-2 mt-5">
                  <motion.button
                    onClick={() => {
                      openCart();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/30 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-white/25 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {t("shop.cart")}
                    {cartCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-5 space-y-2">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all ${isActive(item.path)
                        ? "bg-brand-700 text-white relative"
                        : "text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700"
                      }`}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* Compte client */}
              <div className="p-5 space-y-2 border-t border-ink-200 dark:border-ink-700">
                {user ? (
                  <>
                    <button onClick={() => handleNavigation('/profile')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700">
                      <UserCircle2 className="w-4 h-4" /> {tx("Mon compte", "My account")} ({user.name.split(' ')[0]})
                    </button>
                    <button onClick={() => handleNavigation('/orders')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700">
                      <Package className="w-4 h-4" /> {tx("Mes commandes", "My orders")}
                    </button>
                    <button onClick={async () => { await logout(); handleNavigation('/'); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700">
                      <LogOut className="w-4 h-4" /> {tx("Déconnexion", "Sign out")}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleNavigation('/login')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-aqua-500">
                      <LogIn className="w-4 h-4" /> {tx("Connexion / Créer un compte", "Sign in / Create account")}
                    </button>
                    <button onClick={() => handleNavigation('/suivi-commande')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700">
                      <Truck className="w-4 h-4" /> {tx("Suivre une commande", "Track an order")}
                    </button>
                  </>
                )}
                <button onClick={() => handleNavigation('/favoris')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700">
                  <Heart className="w-4 h-4" /> {tx("Mes favoris", "My favourites")}{favorites.length > 0 ? ` (${favorites.length})` : ""}
                </button>
              </div>

              {/* Theme and Language Controls */}
              <div className="p-5 space-y-2 border-t border-ink-200 dark:border-ink-700">
                {/* Language Toggle */}
                <motion.button
                  onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600 transition-all text-sm font-medium"
                >
                  <Globe className="w-4 h-4" />
                  <span>{language.toUpperCase()}</span>
                </motion.button>

                {/* Theme Toggle */}
                <motion.button
                  onClick={toggleTheme}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600 transition-all text-sm font-medium"
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  <span>{theme === "light" ? t("common.darkMode") : t("common.lightMode")}</span>
                </motion.button>
              </div>

              {/* Sidebar Footer */}
              <div className="p-5 border-t border-ink-200 dark:border-ink-700">
                <div className="text-xs text-ink-600 dark:text-ink-400 text-center space-y-1">
                  <p className="font-semibold text-ink-900 dark:text-white">
                    {t("common.needHelp")}
                  </p>
                  {contact.phone && !/x/i.test(contact.phone) ? (
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-brand-600 dark:text-aqua-500 font-medium">
                      {contact.phone}
                    </a>
                  ) : (
                    <button onClick={() => handleNavigation('/contact')} className="text-brand-600 dark:text-aqua-500 font-medium">
                      {tx("Nous contacter", "Contact us")}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
