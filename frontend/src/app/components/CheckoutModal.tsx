import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useCartUI } from "../../context/CartUIContext";
import { useI18n } from "../../i18n/I18nContext";

export function CheckoutModal() {
  const { isCheckoutOpen, closeCheckout } = useCartUI();
  const { cartTotal, checkout, items } = useCart();
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [orderStatus, setOrderStatus] = useState<{
    status: "idle" | "processing" | "success" | "error";
    message?: string;
    orderId?: string;
  }>({
    status: "idle",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setOrderStatus({
        status: "error",
        message: t("checkout.fieldRequired"),
      });
      return;
    }

    setOrderStatus({ status: "processing" });

    // Simuler l'envoi de la commande
    setTimeout(() => {
      const order = checkout(formData);

      if (order) {
        setOrderStatus({
          status: "success",
          message: t("checkout.orderSuccess"),
          orderId: order.id,
        });

        setTimeout(() => {
          setFormData({ name: "", email: "", phone: "", address: "" });
          setOrderStatus({ status: "idle" });
          closeCheckout();
        }, 3000);
      } else {
        setOrderStatus({
          status: "error",
          message: t("checkout.orderError"),
        });
      }
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCheckout}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 p-6 sm:p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t("checkout.title")}
              </h2>
              <button
                onClick={closeCheckout}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Order Summary */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("checkout.orderSummary")}
              </h3>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {t("checkout.total")}:
                  </span>
                  <span className="text-2xl font-bold text-[#0077BE] dark:text-[#00A8E8]">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            {orderStatus.status !== "success" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("checkout.fullName")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("checkout.fullNamePlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("checkout.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t("checkout.emailPlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("checkout.phone")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t("checkout.phonePlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("checkout.address")}
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t("checkout.addressPlaceholder")}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0077BE] resize-none"
                  />
                </div>

                {/* Error Message */}
                {orderStatus.status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-300">{orderStatus.message}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={orderStatus.status === "processing"}
                  whileHover={{ scale: orderStatus.status === "processing" ? 1 : 1.02 }}
                  whileTap={{ scale: orderStatus.status === "processing" ? 1 : 0.98 }}
                  className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {orderStatus.status === "processing" ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      {t("checkout.processing")}
                    </>
                  ) : (
                    t("checkout.confirmOrder")
                  )}
                </motion.button>
              </form>
            ) : (
              /* Success Message */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t("checkout.orderConfirmed")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{orderStatus.message}</p>
                <p className="text-lg font-semibold text-[#0077BE] dark:text-[#00A8E8]">
                  {t("checkout.orderId")}: {orderStatus.orderId}
                </p>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
