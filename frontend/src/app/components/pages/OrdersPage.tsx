import { motion } from "motion/react";
import { ArrowLeft, Package, Calendar, MapPin, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { useI18n } from "../../../i18n/I18nContext";
import { useTheme } from "../../../theme/ThemeContext";

export function OrdersPage() {
  const navigate = useNavigate();
  const { orders } = useCart();
  const { t } = useI18n();
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: t("orders.status.pending"),
      confirmed: t("orders.status.confirmed"),
      shipped: t("orders.status.shipped"),
      delivered: t("orders.status.delivered"),
    };
    return labels[status] || status;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`}>
      <div className="bg-white dark:bg-slate-950">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-br from-[#0077BE] to-[#00A8E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft size={20} />
                {t("orders.goBack")}
              </button>

              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                {t("orders.title")}
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                {t("orders.subtitle")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Orders List */}
        <section className="py-12 sm:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-slate-950 dark:to-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {orders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t("orders.noOrders")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t("orders.noOrdersDescription")}
                </p>
                <button
                  onClick={() => navigate("/shop")}
                  className="inline-block bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {t("orders.continueShopping")}
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-600 dark:text-gray-400 mb-6"
                >
                  {t("orders.totalOrders")} {orders.length}
                </motion.div>

                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all"
                  >
                    {/* Order Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {t("orders.orderId")}: {order.id}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} />
                              {new Date(order.date).toLocaleDateString()}
                            </div>
                            <div className="text-2xl font-bold text-[#0077BE] dark:text-[#00A8E8]">
                              ${order.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                        {t("orders.items")}
                      </h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("orders.quantity")}: {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Information */}
                    {order.customerInfo && (
                      <div className="p-6 bg-gray-50 dark:bg-slate-700/50">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                          {t("orders.deliveryInfo")}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t("orders.name")}
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {order.customerInfo.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <Mail size={14} />
                              Email
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {order.customerInfo.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <Phone size={14} />
                              {t("orders.phone")}
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {order.customerInfo.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <MapPin size={14} />
                              {t("orders.address")}
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {order.customerInfo.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
