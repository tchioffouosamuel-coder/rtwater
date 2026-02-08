import { Menu, X, Droplets, LogIn, UserPlus, Sun, Moon, Globe } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../../theme/ThemeContext";
import { useI18n } from "../../i18n/I18nContext";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: t("common.home"), path: "/" },
    { label: t("common.gallery"), path: "/gallery" },
    { label: t("common.about"), path: "/about" },
    { label: t("common.quote"), path: "/devis" },
  ];

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
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-[#0077BE]/10 dark:border-slate-700 transition-colors duration-300"
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <motion.button
              onClick={() => handleNavigation("/")}
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] rounded-xl flex items-center justify-center shadow-lg shadow-[#0077BE]/30">
                  <Droplets className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent">
                  RT-Water Solution
                </span>
              </div>
            </motion.button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-8">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className={`transition-all duration-300 font-medium relative group ${
                    isActive(item.path)
                      ? "text-[#0077BE] dark:text-[#00A8E8]"
                      : "text-gray-700 dark:text-gray-300 hover:text-[#0077BE] dark:hover:text-[#00A8E8]"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] transition-all duration-300 ${
                      isActive(item.path)
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </motion.button>
              ))}
            </div>

            {/* Right side controls - Desktop */}
            <div className="hidden lg:flex lg:items-center lg:gap-3">
              {/* Language Toggle */}
              <motion.button
                onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title={t("common.language")}
              >
                <Globe className="w-5 h-5" />
                <span className="font-semibold">{language.toUpperCase()}</span>
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title={theme === "light" ? t("common.darkMode") : t("common.lightMode")}
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </motion.button>

              {/* Authentication Buttons */}
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200 dark:border-slate-700">
                <motion.button
                  onClick={() => handleNavigation("/login")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#0077BE] dark:hover:text-[#00A8E8] transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden xl:inline">{t("common.login")}</span>
                </motion.button>
                <motion.button
                  onClick={() => handleNavigation("/signin")}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 30px rgba(0, 119, 190, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-[#0077BE]/30"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="hidden xl:inline">{t("common.signup")}</span>
                </motion.button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 dark:text-gray-300 hover:text-[#0077BE] dark:hover:text-[#00A8E8] transition-colors"
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
              <div className="bg-gradient-to-br from-[#0077BE] to-[#00A8E8] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Droplets className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-bold text-lg">{t("common.menu")}</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Actions in Sidebar */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleNavigation("/signin")}
                    className="w-full flex items-center gap-3 bg-white text-[#0077BE] px-4 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                  >
                    <UserPlus className="w-5 h-5" />
                    {t("common.signup")}
                  </button>
                  <button
                    onClick={() => handleNavigation("/login")}
                    className="w-full flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-4 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    {t("common.login")}
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-6 space-y-2">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full text-left px-4 py-4 rounded-xl font-semibold transition-all ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white shadow-lg dark:shadow-[#0077BE]/20"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* Theme and Language Controls */}
              <div className="p-6 space-y-3 border-t border-gray-200 dark:border-slate-700">
                {/* Language Toggle */}
                <motion.button
                  onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">{t("common.language")}: {language.toUpperCase()}</span>
                </motion.button>

                {/* Theme Toggle */}
                <motion.button
                  onClick={toggleTheme}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {theme === "light" ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {theme === "light" ? t("common.darkMode") : t("common.lightMode")}
                  </span>
                </motion.button>
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-slate-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t("common.needHelp")}
                  </p>
                  <p>+237 XXX XXX XXX</p>
                  <p>info@rt-water.com</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
