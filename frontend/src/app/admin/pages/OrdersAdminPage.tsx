import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as ordersService from '../../../services/orders';
import { formatApiDate } from '../../../lib/date';
import { markOrdersRead } from '../../../lib/order-notifications.mjs';
import { toast } from 'sonner';
import { Search, Eye, Printer, TrendingUp, Clock, CheckCircle, AlertCircle, Package, Truck, X, ShoppingBag, DollarSign, RefreshCw } from 'lucide-react';

type ApiOrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

// Transitions valides (miroir du backend)
const ALLOWED_TRANSITIONS: Record<ApiOrderStatus, ApiOrderStatus[]> = {
  pending:   ['paid', 'cancelled'],
  paid:      ['shipped', 'cancelled'],
  shipped:   ['delivered'],
  delivered: [],
  cancelled: [],
};

interface ApiOrder {
  id: number;
  total: string;
  status: ApiOrderStatus;
  address: string;
  created_at: string;
  user: { id: number; name: string; email: string; phone?: string } | null;
  items: Array<{ id: number; quantity: number; price: string; product: { id: number; name: string } | null }>;
}

const STATUS_CONFIG: Record<ApiOrderStatus, { label: string; bg: string; text: string; icon: React.FC<any> }> = {
  pending:   { label: 'En attente',  bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Clock },
  paid:      { label: 'Payée',       bg: 'bg-brand-50',   text: 'text-brand-700',   icon: CheckCircle },
  shipped:   { label: 'Expédiée',    bg: 'bg-aqua-50',    text: 'text-aqua-700',    icon: Truck },
  delivered: { label: 'Livrée',      bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
  cancelled: { label: 'Annulée',     bg: 'bg-red-50',    text: 'text-red-700',    icon: AlertCircle },
};

export const OrdersAdminPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApiOrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const requestedOrderId = searchParams.get('order');

  // Mark only a successfully opened sheet, including direct notification links.
  useEffect(() => {
    if (selectedOrder?.id) markOrdersRead([selectedOrder.id]);
  }, [selectedOrder?.id]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await ordersService.fetchAdminOrders(params);
      setOrders(res?.data ?? []);
      if (res?.pagination) setPagination(res.pagination);
    } catch {
      toast('Impossible de charger les commandes', { icon: '⚠️' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (!requestedOrderId || !/^\d+$/.test(requestedOrderId)) return;
    let cancelled = false;

    ordersService.fetchOrder(requestedOrderId)
      .then((res: any) => {
        if (!cancelled && res?.data) setSelectedOrder(res.data as ApiOrder);
      })
      .catch(() => {
        if (!cancelled) toast('Impossible de charger cette commande', { icon: '⚠️' });
      });

    return () => {
      cancelled = true;
    };
  }, [requestedOrderId]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const s = searchTerm.toLowerCase();
    return orders.filter(o =>
      String(o.id).includes(s) ||
      o.user?.name?.toLowerCase().includes(s) ||
      o.user?.email?.toLowerCase().includes(s)
    );
  }, [orders, searchTerm]);

  const stats = useMemo(() => ({
    total:     pagination?.total ?? orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    paid:      orders.filter(o => o.status === 'paid').length,
    shipped:   orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue:   orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total), 0),
  }), [orders, pagination]);

  const handleChangeStatus = async (order: ApiOrder, newStatus: ApiOrderStatus) => {
    if (!ALLOWED_TRANSITIONS[order.status].includes(newStatus)) {
      toast(`Transition invalide : ${order.status} → ${newStatus}`, { icon: '⚠️' });
      return;
    }
    setUpdatingId(order.id);
    try {
      await ordersService.updateOrderStatus(order.id, newStatus);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === order.id) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : prev);
      toast(`Statut mis à jour → ${STATUS_CONFIG[newStatus].label}`, { icon: '✅' });
    } catch (e: any) {
      toast(e?.message ?? 'Erreur mise à jour statut', { icon: '⚠️' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!hasPermission('manage_orders')) {
    return <AdminLayout><div className="text-center py-12"><p className="text-red-600 font-semibold">Accès refusé</p></div></AdminLayout>;
  }

  return (
    <AdminLayout title="Gestion des commandes" breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Commandes' }]}>

      {/* Stats */}
      <div className="admin-summary-grid mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total commandes */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-aqua-500 rounded-2xl p-5 text-white shadow-lg shadow-brand-600/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-white/70 mt-1">Toutes commandes</p>
        </div>

        {/* Revenus */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">CA</span>
          </div>
          <p className="text-3xl font-bold" title={`${stats.revenue.toLocaleString('fr-FR')} XOF`}>
            <span className="sm:hidden">{new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(stats.revenue)}</span>
            <span className="hidden sm:inline">{stats.revenue.toFixed(0)}</span>{' '}
            <span className="text-xs font-medium sm:text-lg">XOF</span>
          </p>
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

        {/* Livrées */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Livrées</span>
          </div>
          <p className="text-3xl font-bold">{stats.delivered}</p>
          <p className="text-sm text-white/70 mt-1">Livrées avec succès</p>
        </div>
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Payées', value: stats.paid, color: 'bg-brand-50 border-brand-100', text: 'text-brand-900' },
          { label: 'Expédiées', value: stats.shipped, color: 'bg-aqua-50 border-aqua-100', text: 'text-aqua-900' },
          { label: 'Annulées', value: stats.cancelled, color: 'bg-red-50 border-red-100', text: 'text-red-900' },
        ].map(s => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-3`}>
            <p className="text-xs text-ink-500 font-medium">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-ink-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher par ID, nom, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
          className="px-4 py-2.5 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm font-medium"
        >
          <option value="all">Tous les statuts</option>
          {(Object.entries(STATUS_CONFIG) as [ApiOrderStatus, typeof STATUS_CONFIG[ApiOrderStatus]][]).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <button onClick={loadOrders} className="px-4 py-2.5 border border-ink-200 rounded-lg hover:bg-ink-50 text-sm font-medium flex items-center gap-2">
          <TrendingUp size={15} /> Actualiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-ink-100 sm:hidden">
          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-ink-400">Chargement...</p>
          ) : filteredOrders.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Package size={36} className="mx-auto mb-3 text-ink-300" />
              <p className="text-sm text-ink-500">Aucune commande</p>
            </div>
          ) : filteredOrders.map(order => {
            const cfg = STATUS_CONFIG[order.status];
            const Icon = cfg.icon;
            return (
              <article key={order.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-700">Commande #{order.id}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-700">{order.user?.name ?? '—'}</p>
                    <p className="truncate text-xs text-ink-400">{order.user?.email}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                    <Icon size={12} />
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
                  <div>
                    <p className="font-bold text-ink-900">{parseFloat(order.total).toLocaleString('fr-FR')} XOF</p>
                    <p className="text-xs text-ink-500">{order.items?.length ?? 0} article(s) · {formatApiDate(order.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-50 px-3 text-sm font-semibold text-brand-700"
                    >
                      <Eye size={16} />
                      Détails
                    </button>
                    <button
                      onClick={() => window.print()}
                      aria-label={`Imprimer la commande ${order.id}`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-ink-200 text-ink-600"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase">Client</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-ink-500 uppercase">Articles</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-ink-500 uppercase">Montant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase">Statut</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase">Date</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-ink-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-ink-400">Chargement...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Package size={40} className="mx-auto text-ink-300 mb-3" />
                    <p className="text-ink-500">Aucune commande</p>
                  </td>
                </tr>
              ) : filteredOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status];
                const Icon = cfg.icon;
                return (
                  <tr key={order.id} className="hover:bg-ink-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-brand-600">#{order.id}</td>
                    <td className="px-5 py-3 text-sm">
                      <div className="font-medium text-ink-900">{order.user?.name ?? '—'}</div>
                      <div className="text-xs text-ink-400">{order.user?.email}</div>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-ink-600">{order.items?.length ?? 0}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-ink-900">
                      {parseFloat(order.total).toFixed(0)} XOF
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        <Icon size={12} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-ink-500">
                      {formatApiDate(order.created_at)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition" title="Détails">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => window.print()} className="p-1.5 text-ink-500 hover:bg-ink-100 rounded-lg transition" title="Imprimer">
                          <Printer size={15} />
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
          <div className="px-5 py-3 bg-ink-50 border-t border-ink-200 flex items-center justify-between text-sm text-ink-500">
            <span>Page {pagination.current_page} / {pagination.last_page} — {pagination.total} commandes</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-ink-200 hover:bg-ink-100 disabled:opacity-40">Précédent</button>
              <button onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))} disabled={currentPage === pagination.last_page}
                className="px-3 py-1 rounded border border-ink-200 hover:bg-ink-100 disabled:opacity-40">Suivant</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal détail commande */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="order-sheet-title" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl sm:max-h-[90vh] sm:rounded-xl sm:pb-0">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
              <h3 id="order-sheet-title" className="text-base font-semibold text-ink-900 sm:text-lg">Commande #{selectedOrder.id}</h3>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  if (requestedOrderId) {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete('order');
                    setSearchParams(nextParams, { replace: true });
                  }
                }}
                className="rounded-lg p-2.5 hover:bg-ink-100"
                aria-label="Fermer le détail de la commande"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-4 text-sm sm:space-y-5 sm:p-6">
              {/* Statut actuel + transitions */}
              <div>
                <p className="text-xs text-ink-500 uppercase font-semibold mb-2">Statut</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_CONFIG) as ApiOrderStatus[]).map(s => {
                    const isCurrent = s === selectedOrder.status;
                    const canTransition = ALLOWED_TRANSITIONS[selectedOrder.status].includes(s);
                    if (!isCurrent && !canTransition) return null;
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        disabled={isCurrent || updatingId === selectedOrder.id}
                        onClick={() => handleChangeStatus(selectedOrder, s)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                          isCurrent
                            ? `${cfg.bg} ${cfg.text} border-transparent font-bold`
                            : 'border-ink-200 hover:border-brand-400 hover:bg-brand-50 text-ink-700'
                        } disabled:opacity-60`}
                      >
                        {isCurrent ? `✓ ${cfg.label}` : `→ ${cfg.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Client */}
              <div className="border-t border-ink-100 pt-5">
                <p className="text-xs text-ink-500 uppercase font-semibold mb-2">Client</p>
                <div className="grid grid-cols-1 gap-3 text-sm min-[380px]:grid-cols-2">
                  <div className="min-w-0"><p className="text-ink-500">Nom</p><p className="break-words font-medium">{selectedOrder.user?.name ?? '—'}</p></div>
                  <div className="min-w-0"><p className="text-ink-500">Email</p><p className="font-medium [overflow-wrap:anywhere]">{selectedOrder.user?.email ?? '—'}</p></div>
                  <div className="min-w-0 min-[380px]:col-span-2"><p className="text-ink-500">Adresse</p><p className="break-words font-medium">{selectedOrder.address}</p></div>
                </div>
              </div>

              {/* Articles */}
              <div className="border-t border-ink-100 pt-5">
                <p className="text-xs text-ink-500 uppercase font-semibold mb-3">Articles</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-ink-50 p-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium">{item.product?.name ?? 'Produit supprimé'}</p>
                        <p className="text-ink-400">Qté {item.quantity} × {parseFloat(item.price).toFixed(0)} XOF</p>
                      </div>
                      <p className="shrink-0 text-right font-semibold"><span className="block">{(item.quantity * parseFloat(item.price)).toLocaleString('fr-FR')}</span><span className="text-xs font-medium">XOF</span></p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center font-bold text-base mt-3 pt-3 border-t border-ink-200">
                  <span>Total</span>
                  <span className="text-brand-600">{parseFloat(selectedOrder.total).toFixed(0)} XOF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
