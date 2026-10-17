import { motion } from "motion/react";
import { ArrowLeft, Package, Calendar, MapPin, Loader2, LogIn, Download, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useSeo } from "../../../lib/seo";
import { orderReference, statusColor, statusLabel, type OrderStatus } from "../../../lib/orderStatus";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../../i18n/I18nContext";
import { useEffect, useState } from "react";
import * as ordersService from "../../../services/orders";

interface ApiOrder {
  id: string | number;
  reference?: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  address?: string;
  items: { id: number; product: { id: number; name: string } | null; quantity: number; price: number }[];
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { t, tx, language, locale } = useI18n();

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [downloading, setDownloading] = useState<string | number | null>(null);

  useSeo({ title: tx("Mes commandes", "My orders"), path: "/orders", noindex: true });

  const handleReceipt = async (orderId: string | number) => {
    setDownloading(orderId);
    try {
      await ordersService.downloadOrderReceipt(orderId);
    } catch {
      toast(tx("Le reçu n'a pas pu être téléchargé. Réessayez dans un instant.", "The receipt could not be downloaded. Please try again shortly."), { icon: "⚠️" });
    } finally {
      setDownloading(null);
    }
  };

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
    <div className="min-h-screen bg-white dark:bg-ink-950">
      {/* Hero */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-brand-600 to-aqua-500">
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
      <section className="py-12 sm:py-24 bg-gradient-to-b from-white to-ink-50 dark:from-ink-950 dark:to-ink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Not logged in */}
          {!isLoggedIn && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <LogIn className="w-16 h-16 text-ink-400 dark:text-ink-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">Connexion requise</h3>
              <p className="text-ink-600 dark:text-ink-400 mb-6">Connectez-vous pour voir vos commandes.</p>
              <button
                onClick={() => navigate("/login", { state: { from: "/orders" } })}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-aqua-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <LogIn size={18} />
                Se connecter
              </button>
            </motion.div>
          )}

          {/* Loading */}
          {isLoggedIn && loading && (
            <div className="flex items-center justify-center py-16 gap-3 text-ink-400">
              <Loader2 size={24} className="animate-spin" />
              <span>Chargement de vos commandes...</span>
            </div>
          )}

          {/* Empty */}
          {isLoggedIn && !loading && orders.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <Package className="w-16 h-16 text-ink-400 dark:text-ink-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">{t("orders.noOrders")}</h3>
              <p className="text-ink-600 dark:text-ink-400 mb-6">{t("orders.noOrdersDescription")}</p>
              <button
                onClick={() => navigate("/shop")}
                className="inline-block bg-gradient-to-r from-brand-600 to-aqua-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {t("orders.continueShopping")}
              </button>
            </motion.div>
          )}

          {/* Orders list */}
          {isLoggedIn && !loading && orders.length > 0 && (
            <div className="space-y-6">
              <p className="text-ink-600 dark:text-ink-400 mb-6">
                {t("orders.totalOrders")} {orders.length}
              </p>

              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="bg-white dark:bg-ink-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-ink-200 dark:border-ink-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-2">
                          {orderReference(order)}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-ink-600 dark:text-ink-400">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            {order.created_at}
                          </div>
                          <div className="text-xl font-bold text-brand-600 dark:text-aqua-500">
                            {Math.round(Number(order.total ?? 0)).toLocaleString(locale)} XAF
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <span className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap ${statusColor(order.status)}`}>
                          {statusLabel(order.status, language)}
                        </span>
                        <div className="flex gap-3 text-sm">
                          <Link
                            to={`/suivi-commande?ref=${orderReference(order)}`}
                            className="inline-flex items-center gap-1 text-brand-600 dark:text-aqua-500 hover:underline"
                          >
                            <Truck size={14} /> {tx("Suivre", "Track")}
                          </Link>
                          {order.status !== "pending" && order.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => handleReceipt(order.id)}
                              disabled={downloading === order.id}
                              className="inline-flex items-center gap-1 text-brand-600 dark:text-aqua-500 hover:underline disabled:opacity-60"
                            >
                              {downloading === order.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                              {tx("Reçu PDF", "PDF receipt")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {order.items?.length > 0 && (
                    <div className="p-6 border-b border-ink-200 dark:border-ink-700">
                      <h4 className="font-semibold text-ink-900 dark:text-white mb-4">{t("orders.items")}</h4>
                      <div className="space-y-3">
                        {order.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-ink-50 dark:bg-ink-700 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-ink-900 dark:text-white">
                                {item.product?.name ?? tx("Produit supprimé", "Product removed")}
                              </p>
                              <p className="text-sm text-ink-600 dark:text-ink-400">
                                {t("orders.quantity")}: {item.quantity} × {Number(item.price).toLocaleString(locale)} XAF
                              </p>
                            </div>
                            <p className="font-semibold text-ink-900 dark:text-white">
                              {(item.price * item.quantity).toLocaleString(locale)} XAF
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery address */}
                  {order.address && (
                    <div className="p-6 bg-ink-50 dark:bg-ink-700/50">
                      <h4 className="font-semibold text-ink-900 dark:text-white mb-3">{t("orders.deliveryInfo")}</h4>
                      <div className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-400">
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
