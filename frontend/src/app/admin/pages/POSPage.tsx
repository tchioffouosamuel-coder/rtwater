import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { usePOS, type CartItem, type PaymentMethod } from '../../../context/POSContext';
import { fetchProducts } from '../../../services/products';
import { createPosOrder, fetchAdminOrders } from '../../../services/orders';
import { fetchAnalytics } from '../../../services/analytics';
import {
  Trash2, Plus, Printer, X, Search, ShoppingCart, Clock,
  DollarSign, RotateCcw, Loader2, AlertCircle, CheckCircle,
} from 'lucide-react';


export const POSPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const { cart, addToCart, removeFromCart, updateCart, clearCart, calculateTotal, calculateSubtotal, calculateTax } = usePOS();

  // Products
  const [apiProducts, setApiProducts] = useState<CartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number } | null>(null);

  // Daily stats
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionRevenue, setSessionRevenue] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // History
  const [showHistory, setShowHistory] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([{ type: 'cash', amount: 0 }]);
  const [processing, setProcessing] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  }, []);

  // Load products
  useEffect(() => {
    if (!hasPermission('manage_pos')) return;
    let mounted = true;
    setLoadingProducts(true);
    const params: Record<string, any> = { per_page: 100, page: currentPage };
    if (searchTerm) params.search = searchTerm;
    fetchProducts(params)
      .then(res => {
        if (!mounted) return;
        const data = res?.data || [];
        setApiProducts(data.map((d: any) => ({
          id: String(d.id),
          sku: d.sku ?? '',
          name: d.name,
          quantity: 0,
          // final_price : prix remise. Le serveur facture ce montant (OrderPricing),
          // la caisse doit donc l'afficher et non le prix barre.
          unitPrice: Number(d.final_price ?? d.price ?? 0),
          basePrice: Number(d.price ?? 0),
          discount: Number(d.discount ?? 0),
          category: d.category?.name ?? d.category ?? '',
        })));
        setPagination(res?.pagination ?? null);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingProducts(false); });
    return () => { mounted = false; };
  }, [currentPage, searchTerm, hasPermission]);

  // Load today stats from analytics
  useEffect(() => {
    if (!hasPermission('manage_pos')) return;
    setLoadingStats(true);
    fetchAnalytics('week')
      .then(data => setTodayRevenue(data.kpis.today_revenue ?? 0))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [hasPermission]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetchAdminOrders({ per_page: 30, page: 1 });
      setRecentOrders(res?.data ?? []);
    } catch {
      showToast('Impossible de charger l\'historique', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }, [showToast]);

  const handleToggleHistory = () => {
    setShowHistory(prev => !prev);
    if (!historyLoaded) {
      setHistoryLoaded(true);
      loadHistory();
    }
  };

  if (!hasPermission('manage_pos')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const products = useMemo(() =>
    apiProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [apiProducts, searchTerm]
  );

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotal();
  const totalPaid = paymentMethods.reduce((s, m) => s + m.amount, 0);
  const change = Math.max(0, totalPaid - total);

  const handleAddProduct = (product: CartItem) => {
    addToCart({ ...product, quantity: 1 });
    showToast(`${product.name} ajouté`, 'success');
  };

  const handleCompleteTransaction = async () => {
    if (cart.length === 0) { showToast('Panier vide', 'error'); return; }
    const paidMethods = paymentMethods.filter(p => p.amount > 0);
    if (!paidMethods.length) { showToast('Veuillez entrer un montant', 'error'); return; }
    if (totalPaid < total) { showToast('Montant insuffisant', 'error'); return; }

    setProcessing(true);
    try {
      // Single request: creates order + marks as paid + decrements stock
      const res = await createPosOrder(
        cart.map(item => ({
          product_id: parseInt(item.id, 10),
          quantity: item.quantity,
        }))
      );
      const orderId = res?.data?.id;

      // Update session stats
      setSessionCount(c => c + 1);
      setSessionRevenue(r => r + total);
      setTodayRevenue(r => r + total);

      // 4. Reset UI
      clearCart();
      setPaymentMethods([{ type: 'cash', amount: 0 }]);
      setShowPaymentModal(false);

      // 5. Reload history if open
      if (historyLoaded) loadHistory();

      showToast(`Vente #${orderId} validée — ${total.toLocaleString('fr-FR')} XAF`, 'success');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Erreur lors de la validation';
      showToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const statusColor: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-700',
    paid:      'bg-blue-100 text-blue-700',
    shipped:   'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const statusLabel: Record<string, string> = {
    pending: 'En attente', paid: 'Payée', shipped: 'Expédiée',
    delivered: 'Livrée', cancelled: 'Annulée',
  };

  return (
    <AdminLayout
      title="Point de Vente"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Caisse' }]}
    >
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 flex items-center gap-2 px-5 py-3 rounded-lg text-white font-medium shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Transactions (session)</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">{sessionCount}</p>
            </div>
            <ShoppingCart size={24} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Revenus du jour</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {loadingStats ? '…' : todayRevenue.toLocaleString('fr-FR')} XAF
              </p>
            </div>
            <DollarSign size={24} className="text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Articles en panier</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </p>
            </div>
            <ShoppingCart size={24} className="text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                />
              </div>
              <button
                onClick={handleToggleHistory}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition font-medium whitespace-nowrap"
              >
                <Clock size={18} />
                Historique
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 size={24} className="animate-spin" />
                <span>Chargement des produits...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Aucun produit trouvé</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition cursor-pointer bg-white"
                    >
                      <div className="mb-2">
                        <p className="font-semibold text-slate-900 leading-tight">{product.name}</p>
                        {product.category && (
                          <p className="text-xs text-amber-600 mt-0.5">📁 {product.category}</p>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-bold text-blue-600">
                          {Number(product.unitPrice).toLocaleString('fr-FR')} XAF
                          {!!product.discount && product.basePrice ? (
                            <span className="ml-1.5 text-xs font-normal text-slate-400 line-through">
                              {Number(product.basePrice).toLocaleString('fr-FR')}
                            </span>
                          ) : null}
                        </p>
                        <button
                          onClick={() => handleAddProduct(product)}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                          title="Ajouter au panier"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {pagination && pagination.last_page > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={pagination.current_page === 1}
                      className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-slate-600">
                      Page {pagination.current_page} / {pagination.last_page} — {pagination.total} produits
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                      disabled={pagination.current_page === pagination.last_page}
                      className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 h-fit sticky top-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Panier</h3>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <ShoppingCart size={32} className="mx-auto text-slate-300 mb-2" />
              <p>Panier vide</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {Number(item.unitPrice).toLocaleString('fr-FR')} XAF × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex items-center border border-slate-300 rounded bg-white text-sm">
                      <button
                        onClick={() => updateCart(item.id, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-slate-100 font-bold text-slate-600"
                      >
                        −
                      </button>
                      <span className="px-2 py-1 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCart(item.id, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-slate-100 font-bold text-slate-600"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Sous-total HT</span>
              <span className="font-medium text-slate-900">{subtotal.toLocaleString('fr-FR')} XAF</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">TVA (20%)</span>
              <span className="font-medium text-slate-900">{tax.toLocaleString('fr-FR')} XAF</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">TOTAL TTC</span>
              <span className="text-2xl font-bold text-blue-600">{total.toLocaleString('fr-FR')} XAF</span>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => clearCart()}
              disabled={cart.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} />
              Vider
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              Payer
            </button>
          </div>
        </div>
      </div>

      {/* Order History */}
      {showHistory && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Commandes récentes</h3>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {loadingHistory ? <Loader2 size={14} className="animate-spin" /> : null}
              Actualiser
            </button>
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Clock size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Aucune commande enregistrée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">#</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Client</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-700">Statut</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-700">Montant</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3 font-mono text-blue-600 font-medium">#{order.id}</td>
                      <td className="px-6 py-3 text-slate-700">{order.user?.name ?? 'Client'}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {statusLabel[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-900">
                        {Number(order.total).toLocaleString('fr-FR')} XAF
                      </td>
                      <td className="px-6 py-3 text-slate-500">{order.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Encaissement</h2>
              <button
                onClick={() => !processing && setShowPaymentModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Order summary */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-1.5 text-sm">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-slate-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{(item.unitPrice * item.quantity).toLocaleString('fr-FR')} XAF</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-slate-900 text-base">
                  <span>Total TTC</span>
                  <span className="text-blue-600">{total.toLocaleString('fr-FR')} XAF</span>
                </div>
              </div>

              {/* Payment methods */}
              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">Mode de paiement</p>
                <div className="space-y-2">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={method.type}
                        onChange={e => {
                          const m = [...paymentMethods];
                          m[index] = { ...m[index], type: e.target.value as PaymentMethod['type'] };
                          setPaymentMethods(m);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      >
                        <option value="cash">Espèces</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="mtn_money">MTN Money</option>
                        <option value="card">Carte bancaire</option>
                        <option value="transfer">Virement</option>
                      </select>
                      <input
                        type="number"
                        value={method.amount || ''}
                        onChange={e => {
                          const m = [...paymentMethods];
                          m[index] = { ...m[index], amount: parseFloat(e.target.value) || 0 };
                          setPaymentMethods(m);
                        }}
                        placeholder="Montant"
                        min="0"
                        className="w-36 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                      {paymentMethods.length > 1 && (
                        <button
                          onClick={() => setPaymentMethods(m => m.filter((_, i) => i !== index))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setPaymentMethods(m => [...m, { type: 'cash', amount: 0 }])}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  + Ajouter un mode de paiement
                </button>
              </div>

              {/* Change */}
              <div className={`p-3 rounded-lg border ${change >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between text-sm">
                  <span className={change >= 0 ? 'text-green-700' : 'text-red-700'}>Reçu</span>
                  <span className="font-semibold">{totalPaid.toLocaleString('fr-FR')} XAF</span>
                </div>
                <div className="flex justify-between font-bold mt-1">
                  <span className={change >= 0 ? 'text-green-800' : 'text-red-800'}>Monnaie à rendre</span>
                  <span className={`text-lg ${change >= 0 ? 'text-green-900' : 'text-red-700'}`}>
                    {change.toLocaleString('fr-FR')} XAF
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition text-slate-900 font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCompleteTransaction}
                disabled={processing || totalPaid < total}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                {processing ? 'Enregistrement...' : 'Valider la vente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
