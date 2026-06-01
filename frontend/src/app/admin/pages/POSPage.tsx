import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { usePOS, CartItem, PaymentMethod } from '../../../context/POSContext';
import { useReceipt } from '../../../context/ReceiptContext';
import { Trash2, Plus, Printer, X, Search, ShoppingCart, TrendingUp, Clock, DollarSign, Eye, RotateCcw } from 'lucide-react';

export const POSPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const { cart, addToCart, removeFromCart, updateCart, calculateTotal, calculateSubtotal, calculateTax, completeTransaction, transactions } = usePOS();
  const { createReceipt, printReceipt } = useReceipt();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { type: 'cash', amount: 0 },
  ]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  if (!hasPermission('manage_pos')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  // Mock products with categories
  const allProducts: CartItem[] = [
    { id: '1', sku: 'FILT-001', name: 'Filtre à cartouche', quantity: 0, unitPrice: 89.99, category: 'Filtration' },
    { id: '2', sku: 'PUMP-001', name: 'Pompe aquatique 5000L', quantity: 0, unitPrice: 249.99, category: 'Pompes' },
    { id: '3', sku: 'CHEM-001', name: 'Traitement chlore 1kg', quantity: 0, unitPrice: 24.99, category: 'Chimie' },
    { id: '4', sku: 'TEST-001', name: 'Test pH professionnel', quantity: 0, unitPrice: 34.99, category: 'Tests' },
    { id: '5', sku: 'BROM-001', name: 'Brome 1kg', quantity: 0, unitPrice: 19.99, category: 'Chimie' },
    { id: '6', sku: 'BRUSH-001', name: 'Brosse nettoyage', quantity: 0, unitPrice: 12.99, category: 'Outils' },
  ];

  // Filter products
  const products = useMemo(() => {
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotal();

  // Daily stats
  const todayTransactions = transactions.filter(t => {
    const txDate = new Date(t.date).toDateString();
    return txDate === new Date().toDateString();
  });

  const dailyStats = {
    count: todayTransactions.length,
    revenue: todayTransactions.reduce((sum, t) => sum + t.total, 0),
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAddProduct = (product: CartItem) => {
    addToCart({ ...product, quantity: 1 });
    showToast(`${product.name} ajouté au panier`, 'success');
  };

  const handleCompleteTransaction = () => {
    if (cart.length === 0) {
      showToast('Panier vide', 'error');
      return;
    }

    const paidMethods = paymentMethods.filter(p => p.amount > 0);
    if (paidMethods.length === 0) {
      showToast('Veuillez entrer un montant', 'error');
      return;
    }

    const totalPaid = paidMethods.reduce((sum, m) => sum + m.amount, 0);
    if (totalPaid < total) {
      showToast('Montant insuffisant', 'error');
      return;
    }

    const transaction = completeTransaction(paidMethods);
    
    // Créer un reçu
    const receipt = createReceipt({
      transactionId: transaction.id,
      items: transaction.items,
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      total: transaction.total,
      payments: transaction.payments,
      change: transaction.change,
      timestamp: transaction.timestamp,
      storeName: 'RTWater',
      storeAddress: '123 Rue de l\'Eau, 75000 Paris',
      storePhone: '+33 1 23 45 67 89',
      cashierName: 'Admin',
    });

    // Imprimer le reçu
    printReceipt(receipt);
    
    // Réinitialiser
    setPaymentMethods([{ type: 'cash', amount: 0 }]);
    setShowPaymentModal(false);
    showToast('Transaction validée avec succès', 'success');
  };

  const handleClearCart = () => {
    cart.forEach(item => removeFromCart(item.id));
    showToast('Panier vidé', 'success');
  };

  return (
    <AdminLayout
      title="Point de Vente"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Caisse' },
      ]}
    >
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg z-40 animate-slide-in ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Transactions aujourd'hui</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">{dailyStats.count}</p>
            </div>
            <ShoppingCart size={24} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Revenus du jour</p>
              <p className="text-2xl font-bold text-green-900 mt-2">{dailyStats.revenue.toFixed(2)} XAF</p>
            </div>
            <DollarSign size={24} className="text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Articles en panier</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">{cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
            </div>
            <TrendingUp size={24} className="text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Search */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                />
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition font-medium whitespace-nowrap"
              >
                <Eye size={18} />
                Historique
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map(product => (
                <div
                  key={product.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition cursor-pointer bg-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                      {product.category && (
                        <p className="text-xs text-slate-400 mt-1">📁 {product.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-blue-600">{product.unitPrice.toFixed(2)} XAF</p>
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

            {products.length === 0 && (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Aucun produit trouvé</p>
              </div>
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
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-600">{item.unitPrice.toFixed(2)} XAF × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <div className="flex items-center border border-slate-300 rounded bg-white">
                      <button
                        onClick={() => updateCart(item.id, item.quantity - 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        −
                      </button>
                      <span className="px-2 py-1 text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCart(item.id, item.quantity + 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        removeFromCart(item.id);
                        showToast(`${item.name} supprimé`, 'success');
                      }}
                      className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Sous-total</span>
              <span className="font-semibold text-slate-900">{subtotal.toFixed(2)} XAF</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">TVA (20%)</span>
              <span className="font-semibold text-slate-900">{tax.toFixed(2)} XAF</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="font-bold text-slate-900">TOTAL</span>
              <span className="text-2xl font-bold text-blue-600">{total.toFixed(2)} XAF</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleClearCart}
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

      {/* Transactions History */}
      {showHistory && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">Transactions récentes</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Heure</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Articles</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Montant</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-blue-600">{tx.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(tx.date).toLocaleTimeString('fr-FR')}</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-900">{tx.items.length}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{tx.total.toFixed(2)} XAF</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {tx.payments.map(p => p.type).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Clock size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Aucune transaction enregistrée</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Paiement</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Total to pay */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-600 font-medium mb-1">Total à payer</p>
                <p className="text-3xl font-bold text-blue-900">{total.toFixed(2)} XAF</p>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={method.type}
                        onChange={(e) => {
                          const newMethods = [...paymentMethods];
                          newMethods[index].type = e.target.value as PaymentMethod['type'];
                          setPaymentMethods(newMethods);
                        }}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      >
                        <option value="cash">Espèces</option>
                        <option value="card">Carte</option>
                        <option value="check">Chèque</option>
                        <option value="transfer">Virement</option>
                      </select>
                      <input
                        type="number"
                        value={method.amount}
                        onChange={(e) => {
                          const newMethods = [...paymentMethods];
                          newMethods[index].amount = parseFloat(e.target.value) || 0;
                          setPaymentMethods(newMethods);
                        }}
                        placeholder="0.00"
                        step="0.01"
                        className="w-32 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Change Due */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600 font-medium mb-1">Monnaie à rendre</p>
                <p className={`text-2xl font-bold ${
                  Math.max(0, paymentMethods.reduce((sum, m) => sum + m.amount, 0) - total) >= 0
                    ? 'text-green-900'
                    : 'text-red-900'
                }`}>
                  {Math.max(0, paymentMethods.reduce((sum, m) => sum + m.amount, 0) - total).toFixed(2)} XAF
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition text-slate-900 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleCompleteTransaction}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition text-white font-medium"
              >
                <Printer size={16} />
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
