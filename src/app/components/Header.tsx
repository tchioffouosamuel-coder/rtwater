import { Menu, X, Droplets, ShoppingBag, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Page } from "../App";

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

export function Header({ currentPage, setCurrentPage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: "Accueil", page: "accueil" as Page },
    { label: "Galerie", page: "galerie" as Page },
    { label: "À propos", page: "apropos" as Page },
    { label: "Devis gratuit", page: "devis" as Page },
  ];

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-[#0077BE]/10"
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <motion.button
              onClick={() => handleNavigation("accueil")}
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
            <div className="hidden lg:flex lg:items-center lg:gap-6">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavigation(item.page)}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className={`transition-all duration-300 font-medium relative group ${
                    currentPage === item.page
                      ? "text-[#0077BE]"
                      : "text-gray-700 hover:text-[#0077BE]"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] transition-all duration-300 ${
                      currentPage === item.page
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </motion.button>
              ))}

              {/* Shop Buttons */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#0077BE] transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden xl:inline">Connexion</span>
                </motion.button>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 30px rgba(0, 119, 190, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-[#0077BE]/30"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="hidden xl:inline">Inscription</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 text-gray-700 hover:text-[#0077BE] transition-colors"
                >
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    0
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-[#0077BE] transition-colors"
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
              className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              {/* Sidebar Header */}
              <div className="bg-gradient-to-br from-[#0077BE] to-[#00A8E8] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Droplets className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-bold text-lg">Menu</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Shop Actions in Sidebar */}
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 bg-white text-[#0077BE] px-4 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors">
                    <UserPlus className="w-5 h-5" />
                    Inscription boutique
                  </button>
                  <button className="w-full flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-4 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors">
                    <LogIn className="w-5 h-5" />
                    Connexion boutique
                  </button>
                  <button className="w-full flex items-center justify-between bg-white/10 backdrop-blur-sm border border-white/30 text-white px-4 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors">
                    <span className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5" />
                      Mon panier
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      0
                    </span>
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
                    onClick={() => handleNavigation(item.page)}
                    className={`w-full text-left px-4 py-4 rounded-xl font-semibold transition-all ${
                      currentPage === item.page
                        ? "bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 text-center">
                  <p className="font-semibold text-gray-900 mb-2">
                    Besoin d'aide ?
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
