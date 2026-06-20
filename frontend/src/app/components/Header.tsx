import { Menu, X, Sun, Moon, Globe, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../../theme/ThemeContext";
import { useI18n } from "../../i18n/I18nContext";
import { useCart } from "../../context/CartContext";
import { useCartUI } from "../../context/CartUIContext";
import { useUserAuth } from "../../context/UserAuthContext";
import { useSiteContent } from "../../context/SiteContentContext";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const { cartCount } = useCart();
  const { openCart } = useCartUI();
  const { user, logout } = useUserAuth();
  const { header } = useSiteContent();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = header.navLinks;

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isActive = (path: string) => {
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
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-md sticky top-0 z-50 border-b border-[#0077BE]/10 dark:border-slate-700 transition-colors duration-300"
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
              <div className="flex items-center gap-2.5">
                <img src={header.logoUrl} alt={`${header.companyName} ${header.companyTagline}`} className="h-10 w-auto" />
                <span className="text-lg font-bold leading-none hidden sm:flex flex-col">
                  <span className="bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent">{header.companyName}</span>
                  <span className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">{header.companyTagline}</span>
                </span>
              </div>
            </motion.button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-6">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 + 0.3 }}
                  className={`transition-all duration-300 font-medium text-sm relative group ${isActive(item.path)
                      ? "text-[#0077BE] dark:text-[#00A8E8]"
                      : "text-gray-600 dark:text-gray-400 hover:text-[#0077BE] dark:hover:text-[#00A8E8]"
                    }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] transition-all duration-300 ${isActive(item.path)
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                      }`}
                  ></span>
                </motion.button>
              ))}
            </div>

            {/* Right side controls - Desktop */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              {/* Cart Button */}
              <motion.button
                onClick={openCart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#0077BE] dark:hover:text-[#00A8E8] hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300"
                title={t("shop.cart")}
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
                className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#0077BE] dark:hover:text-[#00A8E8] hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300"
                title={t("common.language")}
              >
                <Globe className="w-5 h-5" />
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#0077BE] dark:hover:text-[#00A8E8] hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300"
                title={theme === "light" ? t("common.darkMode") : t("common.lightMode")}
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </motion.button>

              {/* Separator */}
              <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1" />
              {/* User / Login */}
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
                  <motion.button
                    onClick={async () => { await logout(); navigate('/'); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-sm"
                  >
                    Déconnexion
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={() => navigate('/login')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white text-sm"
                >
                  Connexion
                </motion.button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Mobile Cart Button */}
              <motion.button
                onClick={openCart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#0077BE] dark:hover:text-[#00A8E8] hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300"
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
                className="text-gray-600 dark:text-gray-400 hover:text-[#0077BE] dark:hover:text-[#00A8E8] transition-colors"
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
              className="fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-slate-800 shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              {/* Sidebar Header */}
              <div className="bg-gradient-to-br from-[#0077BE] to-[#00A8E8] p-5">
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
                        ? "bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white shadow-md relative"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      }`}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* Theme and Language Controls */}
              <div className="p-5 space-y-2 border-t border-gray-200 dark:border-slate-700">
                {/* Language Toggle */}
                <motion.button
                  onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all text-sm font-medium"
                >
                  <Globe className="w-4 h-4" />
                  <span>{language.toUpperCase()}</span>
                </motion.button>

                {/* Theme Toggle */}
                <motion.button
                  onClick={toggleTheme}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all text-sm font-medium"
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
              <div className="p-5 border-t border-gray-200 dark:border-slate-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 text-center space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t("common.needHelp")}
                  </p>
                  <p>+237 XXX XXX XXX</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
