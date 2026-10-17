import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AdminLayout } from "../layout/AdminLayout";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { fetchAdminOrders, downloadOrderReceipt } from "../../../services/orders";
import { toast } from "sonner";
import {
  Printer, Download, Eye, Search, FileText, TrendingUp,
  X, ChevronLeft, ChevronRight, RefreshCw,
  ShoppingBag, DollarSign, Users, Clock,
} from "lucide-react";

type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

interface OrderItem { id: number; product: { name: string } | null; quantity: number; price: number; }
interface ApiOrder {
  id: number;
  total: number;
  status: OrderStatus;
  address: string;
  created_at: string;
  user?: { id: number; name: string; email?: string; phone?: string } | null;
  items?: OrderItem[];
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; classes: string }> = {
  pending:   { label: "En attente",  classes: "bg-amber-100 text-amber-800 border border-amber-200" },
  paid:      { label: "Payée",       classes: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  shipped:   { label: "Expédiée",    classes: "bg-brand-100 text-brand-800 border border-brand-200" },
  delivered: { label: "Livrée",      classes: "bg-green-100 text-green-700 border border-green-200" },
  cancelled: { label: "Annulée",     classes: "bg-red-100 text-red-700 border border-red-200" },
};

const getDateRange = (period: string) => {
  const now = new Date();
  if (period === "day") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
  }
  if (period === "week") {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
  }
  if (period === "month") {
    const start = new Date(now); start.setDate(now.getDate() - 30);
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
  }
  return {};
};

export const ReceiptsPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<"all" | "day" | "week" | "month">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage, per_page: 15 };
      if (searchTerm) params.search = searchTerm;
      const dateRange = getDateRange(period);
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const res = await fetchAdminOrders(params);
      setOrders(res?.data ?? []);
      if (res?.pagination) setPagination(res.pagination);
    } catch {
      toast.error("Impossible de charger les commandes");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, period]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, period]);

  const stats = useMemo(() => {
    const total = pagination?.total ?? orders.length;
    const revenue = orders.reduce((s, o) => s + parseFloat(String(o.total)), 0);
    const pending = orders.filter(o => o.status === "pending").length;
    const avg = orders.length > 0 ? revenue / orders.length : 0;
    return { total, revenue, pending, avg };
  }, [orders, pagination]);

  const handleDownload = async (order: ApiOrder) => {
    setDownloadingId(order.id);
    try {
      await downloadOrderReceipt(order.id);
      toast.success(`Reçu #${order.id} téléchargé`);
    } catch {
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!hasPermission("manage_receipts") && !hasPermission("manage_orders")) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Reçus & Commandes"
      breadcrumbs={[
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Reçus" },
      ]}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total commandes */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-aqua-500 rounded-2xl p-5 text-white shadow-lg shadow-brand-600/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-white/70 mt-1">Toutes les commandes</p>
        </div>

        {/* Chiffre d'affaires */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">CA</span>
          </div>
          <p className="text-3xl font-bold">{stats.revenue.toLocaleString("fr-FR")} <span className="text-lg font-medium">XAF</span></p>
          <p className="text-sm text-white/70 mt-1">Chiffre d'affaires</p>
        </div>

        {/* En attente */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Attente</span>
          </div>
          <p className="text-3xl font-bold">{stats.pending}</p>
          <p className="text-sm text-white/70 mt-1">En attente</p>
        </div>

        {/* Panier moyen */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Avg</span>
          </div>
          <p className="text-3xl font-bold">{Math.round(stats.avg).toLocaleString("fr-FR")} <span className="text-lg font-medium">XAF</span></p>
          <p className="text-sm text-white/70 mt-1">Panier moyen</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par client, email ou #ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 text-sm"
            />
          </div>
          <select
            value={period}
            onChange={e => { setPeriod(e.target.value as any); setCurrentPage(1); }}
            className="px-4 py-2.5 border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 text-sm bg-white font-medium"
          >
            <option value="all">Tout</option>
            <option value="day">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <button
            onClick={loadOrders}
            className="px-4 py-2.5 border border-ink-200 rounded-xl hover:bg-ink-50 text-sm font-medium flex items-center gap-2 text-ink-600 transition"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600/10 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-brand-600" />
          </div>
          <h3 className="font-semibold text-ink-900">Historique des reçus</h3>
          {pagination && (
            <span className="ml-auto text-xs text-ink-400 bg-ink-50 px-2.5 py-1 rounded-full">
              {pagination.total} commandes
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wide">#ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wide">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-ink-500 uppercase tracking-wide">Montant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wide">Statut</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-ink-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-400">
                    <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Chargement...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <FileText size={36} className="mx-auto text-ink-200 mb-3" />
                    <p className="text-ink-400 font-medium">Aucune commande trouvée</p>
                    <p className="text-ink-300 text-sm mt-1">Essayez de modifier les filtres</p>
                  </td>
                </tr>
              ) : orders.map(order => {
                const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, classes: "bg-ink-100 text-ink-600 border border-ink-200" };
                return (
                  <tr key={order.id} className="hover:bg-ink-50/50 transition-colors group">
                    <td className="px-5 py-3.5 text-sm font-bold text-brand-600">
                      #{String(order.id).padStart(5, "0")}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <div className="font-medium text-ink-900">{order.user?.name ?? "Client invité"}</div>
                      {order.user?.email && (
                        <div className="text-xs text-ink-400 mt-0.5">{order.user.email}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink-500">
                      {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-ink-900 text-right">
                      {parseFloat(String(order.total)).toLocaleString("fr-FR")} XAF
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.classes}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-600/10 rounded-lg transition"
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownload(order)}
                          disabled={downloadingId === order.id}
                          className="p-1.5 text-ink-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                          title="Télécharger PDF"
                        >
                          {downloadingId === order.id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="px-5 py-3.5 border-t border-ink-100 bg-ink-50/50 flex items-center justify-between text-sm text-ink-500">
            <span>Page <strong className="text-ink-700">{pagination.current_page}</strong> / {pagination.last_page} — {pagination.total} commandes</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ink-200 hover:bg-white disabled:opacity-40 transition text-xs font-medium"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={currentPage === pagination.last_page}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ink-200 hover:bg-white disabled:opacity-40 transition text-xs font-medium"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-aqua-500 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-ink-900">
                    Commande #{String(selectedOrder.id).padStart(5, "0")}
                  </h2>
                  <p className="text-xs text-ink-400">
                    {new Date(selectedOrder.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-ink-100 rounded-xl transition text-ink-400 hover:text-ink-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_CONFIG[selectedOrder.status]?.classes ?? ""}`}>
                  {STATUS_CONFIG[selectedOrder.status]?.label ?? selectedOrder.status}
                </span>
              </div>

              {/* Client info */}
              <div className="bg-ink-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Informations client</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Nom</p>
                    <p className="font-semibold text-ink-900">{selectedOrder.user?.name ?? "Client invité"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Email</p>
                    <p className="font-medium text-ink-700">{selectedOrder.user?.email ?? "—"}</p>
                  </div>
                  {selectedOrder.user?.phone && (
                    <div>
                      <p className="text-ink-400 text-xs mb-0.5">Téléphone</p>
                      <p className="font-medium text-ink-700">{selectedOrder.user.phone}</p>
                    </div>
                  )}
                  <div className={selectedOrder.user?.phone ? "" : "col-span-2"}>
                    <p className="text-ink-400 text-xs mb-0.5">Adresse</p>
                    <p className="font-medium text-ink-700">{selectedOrder.address || "Non spécifiée"}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Articles commandés</p>
                  <div className="border border-ink-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-ink-50 border-b border-ink-100">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-ink-500">Article</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-ink-500">Qté</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-ink-500">Prix unit.</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-ink-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-50">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-ink-50/50">
                            <td className="px-4 py-2.5 font-medium text-ink-900">{item.product?.name ?? "Produit supprimé"}</td>
                            <td className="px-4 py-2.5 text-center text-ink-600">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-ink-600">{parseFloat(String(item.price)).toLocaleString("fr-FR")} XAF</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-ink-900">{(item.quantity * parseFloat(String(item.price))).toLocaleString("fr-FR")} XAF</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-gradient-to-r from-brand-600/5 to-aqua-500/5 border border-brand-600/10 rounded-xl p-4 flex items-center justify-between">
                <span className="font-semibold text-ink-700">Total TTC</span>
                <span className="text-2xl font-bold text-brand-600">
                  {parseFloat(String(selectedOrder.total)).toLocaleString("fr-FR")} XAF
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-ink-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 px-4 py-2.5 border border-ink-200 rounded-xl hover:bg-ink-50 transition font-medium text-ink-700 text-sm"
              >
                Fermer
              </button>
              <button
                onClick={() => { handleDownload(selectedOrder); setSelectedOrder(null); }}
                disabled={downloadingId === selectedOrder.id}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-aqua-500 text-white rounded-xl hover:opacity-90 transition font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-600/20 disabled:opacity-60"
              >
                <Download size={16} />
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
