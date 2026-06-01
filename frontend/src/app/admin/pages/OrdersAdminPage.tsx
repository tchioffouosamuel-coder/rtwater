import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { usePOS } from '../../../context/POSContext';
import { Plus, Search, Eye, Trash2, X, Printer, TrendingUp, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

export const OrdersAdminPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const { transactions } = usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Mock orders combined with POS transactions
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-001',
      customerId: 'CUST-001',
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      customerPhone: '+33 6 12 34 56 78',
      items: [
        {
          productId: '1',
          productName: 'Filtre aquatique',
          quantity: 2,
          price: 89.99,
          subtotal: 179.98,
        },
        {
          productId: '3',
          productName: 'Traitement chlore 1kg',
          quantity: 1,
          price: 24.99,
          subtotal: 24.99,
        },
      ],
      subtotal: 204.97,
      tax: 40.99,
      total: 245.96,
      status: 'completed',
      paymentMethod: 'card',
      notes: 'Livraison express demandée',
      createdAt: '2025-02-05',
      updatedAt: '2025-02-06',
      trackingNumber: 'TRK123456789',
    },
    {
      id: 'ORD-002',
      customerId: 'CUST-002',
      customerName: 'Marie Martin',
      customerEmail: 'marie@example.com',
      customerPhone: '+33 7 98 76 54 32',
      items: [
        {
          productId: '2',
          productName: 'Pompe aquatique 5000L',
          quantity: 1,
          price: 249.99,
          subtotal: 249.99,
        },
      ],
      subtotal: 249.99,
      tax: 50.00,
      total: 299.99,
      status: 'processing',
      paymentMethod: 'transfer',
      notes: '',
      createdAt: '2025-02-07',
      updatedAt: '2025-02-08',
    },
    {
      id: 'ORD-003',
      customerId: 'CUST-003',
      customerName: 'Pierre Bernard',
      customerEmail: 'pierre@example.com',
      customerPhone: '+33 6 87 65 43 21',
      items: [
        {
          productId: '1',
          productName: 'Filtre aquatique',
          quantity: 1,
          price: 89.99,
          subtotal: 89.99,
        },
      ],
      subtotal: 89.99,
      tax: 18.00,
      total: 107.99,
      status: 'pending',
      paymentMethod: 'cash',
      notes: 'À retirer en magasin',
      createdAt: '2025-02-08',
      updatedAt: '2025-02-08',
    },
    {
      id: 'ORD-004',
      customerId: 'CUST-004',
      customerName: 'Sophie Laurent',
      customerEmail: 'sophie@example.com',
      customerPhone: '+33 6 55 44 33 22',
      items: [
        {
          productId: '3',
          productName: 'Traitement chlore 1kg',
          quantity: 5,
          price: 24.99,
          subtotal: 124.95,
        },
      ],
      subtotal: 124.95,
      tax: 25.00,
      total: 149.95,
      status: 'cancelled',
      paymentMethod: 'card',
      notes: 'Annulation client',
      createdAt: '2025-02-04',
      updatedAt: '2025-02-04',
    },
  ]);

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0),
  };

  // Filter and search
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  if (!hasPermission('manage_orders')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const handleChangeStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(orders.map(o =>
      o.id === orderId
        ? { ...o, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
        : o
    ));
    setSelectedOrder(null);
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
    setDeleteConfirm(null);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertCircle };
      case 'processing':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: Clock };
      case 'completed':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle };
      case 'cancelled':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertCircle };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: Package };
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En cours';
      case 'completed':
        return 'Complétée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'card':
        return 'Carte bancaire';
      case 'cash':
        return 'Espèces';
      case 'check':
        return 'Chèque';
      case 'transfer':
        return 'Virement';
      default:
        return method;
    }
  };

  return (
    <AdminLayout
      title="Gestion des commandes"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Commandes' },
      ]}
    >
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-600 font-medium">En attente</p>
          <p className="text-2xl font-bold text-amber-900 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <p className="text-sm text-sky-600 font-medium">En cours</p>
          <p className="text-2xl font-bold text-sky-900 mt-2">{stats.processing}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Complétées</p>
          <p className="text-2xl font-bold text-green-900 mt-2">{stats.completed}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">Annulées</p>
          <p className="text-2xl font-bold text-red-900 mt-2">{stats.cancelled}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-600 font-medium">Revenus</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">{stats.revenue.toFixed(0)} XAF</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as OrderStatus | 'all');
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white font-medium"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="completed">Complétées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Commande</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Client</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Articles</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Montant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedOrders.map((order) => {
                const statusColor = getStatusColor(order.status);
                const StatusIcon = statusColor.icon;

                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">{order.id}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-slate-900">{order.customerName}</div>
                      <div className="text-xs text-slate-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600 font-medium">
                      {order.items.length}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">
                      {order.total.toFixed(2)} XAF
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                        <StatusIcon size={14} />
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.createdAt}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Voir détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Imprimer"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(order.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Aucune commande trouvée</p>
          </div>
        )}

        {/* Table Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
          <p>Affichage de {paginatedOrders.length} sur {filteredOrders.length} commandes</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = currentPage > 3 ? currentPage - 2 + i : i + 1;
                return page <= totalPages ? (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 hover:bg-slate-100'
                    } transition`}
                  >
                    {page}
                  </button>
                ) : null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Détails de la commande</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="border-b border-slate-200 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Numéro</p>
                    <p className="text-lg font-bold text-blue-600">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Date</p>
                    <p className="text-lg font-bold text-slate-900">{selectedOrder.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Statut</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status).bg} ${getStatusColor(selectedOrder.status).text}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Paiement</p>
                    <p className="text-lg font-bold text-slate-900">{getPaymentLabel(selectedOrder.paymentMethod)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-b border-slate-200 pb-6">
                <h4 className="font-semibold text-slate-900 mb-3">Informations client</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Nom</p>
                    <p className="font-medium text-slate-900">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{selectedOrder.customerEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Téléphone</p>
                    <p className="font-medium text-slate-900">{selectedOrder.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border-b border-slate-200 pb-6">
                <h4 className="font-semibold text-slate-900 mb-3">Articles</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.productName}</p>
                        <p className="text-sm text-slate-600">Qté: {item.quantity} × {item.price.toFixed(2)} XAF</p>
                      </div>
                      <p className="font-semibold text-slate-900">{item.subtotal.toFixed(2)} XAF</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600">Sous-total</p>
                  <p className="font-medium text-slate-900">{selectedOrder.subtotal.toFixed(2)} XAF</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600">TVA (20%)</p>
                  <p className="font-medium text-slate-900">{selectedOrder.tax.toFixed(2)} XAF</p>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Total</p>
                  <p className="text-lg font-bold text-blue-600">{selectedOrder.total.toFixed(2)} XAF</p>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Notes</h4>
                  <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Tracking */}
              {selectedOrder.trackingNumber && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Numéro de suivi</h4>
                  <p className="text-sm font-mono text-slate-900 p-3 bg-slate-50 rounded-lg">{selectedOrder.trackingNumber}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3 flex-wrap">
              <select
                value={selectedOrder.status}
                onChange={(e) => handleChangeStatus(selectedOrder.id, e.target.value as OrderStatus)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium"
              >
                <option value="pending">En attente</option>
                <option value="processing">En cours</option>
                <option value="completed">Complétée</option>
                <option value="cancelled">Annulée</option>
              </select>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition text-slate-900 font-medium"
              >
                <Printer size={16} />
                Imprimer
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-medium ml-auto"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Confirmer la suppression</h3>
            </div>

            <div className="p-6">
              <p className="text-slate-600 mb-4">
                Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <p className="text-sm text-amber-800">⚠️ Cette action ne peut pas être annulée</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition text-slate-900 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-white font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
