import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useCartUI } from "../../context/CartUIContext";
import { useI18n } from "../../i18n/I18nContext";

export function Cart() {
  const { items, removeFromCart, updateQuantity, cartTotal, clearCart, checkout } = useCart();
  const { isOpen, closeCart, openCheckout } = useCartUI();
  const { t } = useI18n();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    // Simulate checkout process
    setTimeout(() => {
      openCheckout();
      setIsCheckingOut(false);
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-96 max-w-sm bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("shop.cart")}
              </h2>
              <button
                onClick={closeCart}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {t("shop.emptyCart")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-600 rounded-lg p-2 w-fit">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500 rounded"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center text-gray-900 dark:text-white font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <p className="text-right text-sm font-semibold text-gray-900 dark:text-white mt-3">
                        {t("shop.total")}: ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 dark:border-slate-700 p-6 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
                  <span>{t("shop.total")}:</span>
                  <span className="text-[#0077BE] dark:text-blue-400">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  <motion.button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    whileHover={{ scale: isCheckingOut ? 1 : 1.02 }}
                    whileTap={{ scale: isCheckingOut ? 1 : 0.98 }}
                    className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        {t("shop.processing")}
                      </>
                    ) : (
                      t("shop.checkout")
                    )}
                  </motion.button>
                  <button
                    onClick={clearCart}
                    className="w-full border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {t("shop.clearCart")}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
