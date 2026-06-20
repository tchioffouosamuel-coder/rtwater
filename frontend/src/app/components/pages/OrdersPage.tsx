import { motion } from "motion/react";
import { ArrowLeft, Package, Calendar, MapPin, Loader2, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../../i18n/I18nContext";
import { useEffect, useState } from "react";
import * as ordersService from "../../../services/orders";

type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

interface ApiOrder {
  id: string | number;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  address?: string;
  items: { id: number; product: { id: number; name: string } | null; quantity: number; price: number }[];
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  paid: "Payée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export function OrdersPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return;
    setIsLoggedIn(true);

    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await ordersService.fetchOrders();
        if (!mounted) return;
        setOrders(res?.data ?? res ?? []);
      } catch {
        // token invalid or network error — silently fail
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
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
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t("orders.title")}</h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">{t("orders.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Not logged in */}
          {!isLoggedIn && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <LogIn className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connexion requise</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Connectez-vous pour voir vos commandes.</p>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <LogIn size={18} />
                Se connecter
              </button>
            </motion.div>
          )}

          {/* Loading */}
          {isLoggedIn && loading && (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
              <span>Chargement de vos commandes...</span>
            </div>
          )}

          {/* Empty */}
          {isLoggedIn && !loading && orders.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("orders.noOrders")}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{t("orders.noOrdersDescription")}</p>
              <button
                onClick={() => navigate("/shop")}
                className="inline-block bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {t("orders.continueShopping")}
              </button>
            </motion.div>
          )}

          {/* Orders list */}
          {isLoggedIn && !loading && orders.length > 0 && (
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("orders.totalOrders")} {orders.length}
              </p>

              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          {t("orders.orderId")}: #{order.id}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            {new Date(order.created_at).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-xl font-bold text-[#0077BE] dark:text-[#00A8E8]">
                            {order.total_price.toLocaleString("fr-FR")} XAF
                          </div>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  {order.items?.length > 0 && (
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{t("orders.items")}</h4>
                      <div className="space-y-3">
                        {order.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.product?.name ?? "Produit supprimé"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("orders.quantity")}: {item.quantity} × {item.price.toLocaleString("fr-FR")} XAF
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {(item.price * item.quantity).toLocaleString("fr-FR")} XAF
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery address */}
                  {order.address && (
                    <div className="p-6 bg-gray-50 dark:bg-slate-700/50">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t("orders.deliveryInfo")}</h4>
                      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{order.address}</span>
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
  );
}
