import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as ordersService from '../../../services/orders';
import { toast } from 'sonner';
import { Search, Eye, Printer, TrendingUp, Clock, CheckCircle, AlertCircle, Package, Truck, X } from 'lucide-react';

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
  paid:      { label: 'Payée',       bg: 'bg-blue-50',   text: 'text-blue-700',   icon: CheckCircle },
  shipped:   { label: 'Expédiée',    bg: 'bg-sky-50',    text: 'text-sky-700',    icon: Truck },
  delivered: { label: 'Livrée',      bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
  cancelled: { label: 'Annulée',     bg: 'bg-red-50',    text: 'text-red-700',    icon: AlertCircle },
};

export const OrdersAdminPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApiOrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-50 border-blue-200', text: 'text-blue-900' },
          { label: 'En attente', value: stats.pending, color: 'bg-amber-50 border-amber-200', text: 'text-amber-900' },
          { label: 'Payées', value: stats.paid, color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-900' },
          { label: 'Expédiées', value: stats.shipped, color: 'bg-sky-50 border-sky-200', text: 'text-sky-900' },
          { label: 'Livrées', value: stats.delivered, color: 'bg-green-50 border-green-200', text: 'text-green-900' },
          { label: 'Annulées', value: stats.cancelled, color: 'bg-red-50 border-red-200', text: 'text-red-900' },
          { label: 'Revenus', value: `${stats.revenue.toFixed(0)} XOF`, color: 'bg-purple-50 border-purple-200', text: 'text-purple-900' },
        ].map(s => (
          <div key={s.label} className={`${s.color} border rounded-xl p-3`}>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher par ID, nom, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
          className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-medium"
        >
          <option value="all">Tous les statuts</option>
          {(Object.entries(STATUS_CONFIG) as [ApiOrderStatus, typeof STATUS_CONFIG[ApiOrderStatus]][]).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <button onClick={loadOrders} className="px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2">
          <TrendingUp size={15} /> Actualiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Client</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Articles</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Montant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Statut</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">Chargement...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Package size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">Aucune commande</p>
                  </td>
                </tr>
              ) : filteredOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status];
                const Icon = cfg.icon;
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-blue-600">#{order.id}</td>
                    <td className="px-5 py-3 text-sm">
                      <div className="font-medium text-slate-900">{order.user?.name ?? '—'}</div>
                      <div className="text-xs text-slate-400">{order.user?.email}</div>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-slate-600">{order.items?.length ?? 0}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-slate-900">
                      {parseFloat(order.total).toFixed(0)} XOF
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        <Icon size={12} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Détails">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => window.print()} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition" title="Imprimer">
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
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>Page {pagination.current_page} / {pagination.last_page} — {pagination.total} commandes</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40">Précédent</button>
              <button onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))} disabled={currentPage === pagination.last_page}
                className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40">Suivant</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal détail commande */}
      {selectedOrder && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Commande #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Statut actuel + transitions */}
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Statut</p>
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
                            : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700'
                        } disabled:opacity-60`}
                      >
                        {isCurrent ? `✓ ${cfg.label}` : `→ ${cfg.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Client */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Client</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-400">Nom</p><p className="font-medium">{selectedOrder.user?.name ?? '—'}</p></div>
                  <div><p className="text-slate-400">Email</p><p className="font-medium">{selectedOrder.user?.email ?? '—'}</p></div>
                  <div className="col-span-2"><p className="text-slate-400">Adresse</p><p className="font-medium">{selectedOrder.address}</p></div>
                </div>
              </div>

              {/* Articles */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Articles</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium">{item.product?.name ?? 'Produit supprimé'}</p>
                        <p className="text-slate-400">Qté {item.quantity} × {parseFloat(item.price).toFixed(0)} XOF</p>
                      </div>
                      <p className="font-semibold">{(item.quantity * parseFloat(item.price)).toFixed(0)} XOF</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center font-bold text-base mt-3 pt-3 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-blue-600">{parseFloat(selectedOrder.total).toFixed(0)} XOF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
