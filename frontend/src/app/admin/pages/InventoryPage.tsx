import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import productsService from '../../../services/products';
import stockService from '../../../services/stock';
import { Plus, AlertCircle, TrendingDown, TrendingUp, ArrowDown, ArrowUp, Search, X, Save, History, Warehouse, Loader2 } from 'lucide-react';

interface ApiProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  is_available: boolean;
  image_url: string | null;
  category: any;
}

interface ApiMovement {
  id: number;
  product: { id: number; name: string } | null;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string | null;
  created_at: string;
}

export const InventoryPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [movements, setMovements] = useState<ApiMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out' | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await productsService.fetchProducts({ per_page: 200 });
      setProducts(res?.data ?? res ?? []);
    } catch {
      showToast('Erreur lors du chargement des produits', 'error');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const loadMovements = useCallback(async () => {
    setLoadingMovements(true);
    try {
      const res = await stockService.fetchStockMovements({ per_page: 100 });
      setMovements(res?.data ?? res ?? []);
    } catch {
      showToast('Erreur lors du chargement des mouvements', 'error');
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleToggleHistory = () => {
    setShowHistory(prev => !prev);
    if (!historyLoaded) {
      setHistoryLoaded(true);
      loadMovements();
    }
  };

  const resetModal = () => {
    setShowMovementModal(false);
    setMovementType(null);
    setSelectedProductId('');
    setQuantity('');
    setReason('');
  };

  const handleAddMovement = async () => {
    if (!selectedProductId || !movementType || !quantity) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }
    const qty = parseInt(quantity);
    if (qty <= 0) {
      showToast('La quantité doit être positive', 'error');
      return;
    }

    const product = products.find(p => String(p.id) === selectedProductId);
    if (!product) return;

    setSaving(true);
    try {
      await stockService.createStockMovement({
        product_id: product.id,
        type: movementType,
        quantity: qty,
        reason: reason || (movementType === 'in' ? 'Entrée stock' : 'Sortie stock'),
      });
      showToast(`Mouvement enregistré: ${qty} unité(s) de ${product.name}`, 'success');
      resetModal();
      await loadProducts();
      if (historyLoaded) await loadMovements();
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('manage_inventory')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const criticalItems = products.filter(p => p.stock === 0);
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 5);
  const totalValue = products.reduce((sum, p) => sum + p.stock * (p.price ?? 0), 0);

  const filteredProducts = useMemo(() => products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [products, searchTerm]);

  const stats = [
    { label: 'Stock total', value: products.reduce((s, p) => s + p.stock, 0), icon: Warehouse, color: 'bg-brand-50', textColor: 'text-brand-600' },
    { label: 'Alerte rupture', value: criticalItems.length, icon: AlertCircle, color: 'bg-red-50', textColor: 'text-red-600' },
    { label: 'Stock faible', value: lowStockItems.length, icon: TrendingDown, color: 'bg-amber-50', textColor: 'text-amber-600' },
    { label: 'Valeur stock', value: `${totalValue.toLocaleString('fr-FR')} XAF`, icon: TrendingUp, color: 'bg-green-50', textColor: 'text-green-600' },
  ];

  return (
    <AdminLayout
      title="Gestion du Stock"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Stock' },
      ]}
    >
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg z-40 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Stats */}
      <div className="admin-summary-grid mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`${stat.color} p-4 rounded-xl border border-ink-200 hover:shadow-md transition`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-ink-900">{stat.value}</p>
                </div>
                <Icon size={24} className={stat.textColor} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Alerts */}
      {criticalItems.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Alerte stock critique</h3>
              <p className="text-sm text-red-700 mt-1">{criticalItems.length} article(s) avec stock très faible:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {criticalItems.map(p => (
                  <span key={p.id} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                    {p.name} ({p.stock} restant)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-ink-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition bg-white"
          />
        </div>
        <button
          onClick={() => setShowMovementModal(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 transition font-medium whitespace-nowrap"
        >
          <Plus size={18} />
          Nouveau mouvement
        </button>
        <button
          onClick={handleToggleHistory}
          className="flex items-center gap-2 bg-ink-600 text-white px-6 py-2.5 rounded-lg hover:bg-ink-700 transition font-medium whitespace-nowrap"
        >
          <History size={18} />
          Historique
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden mb-6">
        {loadingProducts ? (
          <div className="flex items-center justify-center py-16 gap-3 text-ink-400">
            <Loader2 size={24} className="animate-spin" />
            <span>Chargement du stock...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50 border-b border-ink-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-ink-900">Article</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-900">Prix de vente</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-ink-900">Quantité</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-900">Valeur stock</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-ink-900">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {filteredProducts.map(p => {
                  const isCritical = p.stock === 0;
                  const isLow = p.stock > 0 && p.stock <= 5;
                  const value = p.stock * (p.price ?? 0);
                  return (
                    <tr key={p.id} className={`hover:bg-ink-50 transition-colors ${isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : ''}`}>
                      <td className="px-6 py-4 text-sm font-medium text-ink-900">{p.name}</td>
                      <td className="px-6 py-4 text-right text-sm text-ink-900">
                        {Number(p.price).toLocaleString('fr-FR')} XAF
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block font-semibold px-3 py-1 rounded-full text-sm ${
                          isCritical ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-ink-900">
                        {value.toLocaleString('fr-FR')} XAF
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            <AlertCircle size={14} /> Rupture
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                            <TrendingDown size={14} /> Faible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <TrendingUp size={14} /> OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Warehouse size={48} className="mx-auto text-ink-300 mb-4" />
                <p className="text-ink-500 font-medium">Aucun article trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Movement History */}
      {showHistory && (
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-ink-200 bg-ink-50">
            <h3 className="text-lg font-semibold text-ink-900">Historique des mouvements</h3>
          </div>
          {loadingMovements ? (
            <div className="flex items-center justify-center py-12 gap-3 text-ink-400">
              <Loader2 size={20} className="animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ink-50 border-b border-ink-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-ink-900">Date & Heure</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-ink-900">Article</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-ink-900">Type</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-ink-900">Quantité</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-ink-900">Raison</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {movements.map(m => {
                    const dt = new Date(m.created_at);
                    const dateStr = dt.toLocaleDateString('fr-FR');
                    const timeStr = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr key={m.id} className="hover:bg-ink-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-ink-600">
                          {dateStr} <span className="text-ink-400">{timeStr}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-ink-900">{m.product?.name ?? '—'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            m.type === 'in' ? 'bg-green-100 text-green-700' :
                            m.type === 'out' ? 'bg-red-100 text-red-700' :
                            'bg-brand-100 text-brand-700'
                          }`}>
                            {m.type === 'in' ? <><ArrowDown size={12} /> Entrée</> :
                             m.type === 'out' ? <><ArrowUp size={12} /> Sortie</> :
                             'Ajustement'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-semibold text-ink-900">{m.quantity}</td>
                        <td className="px-6 py-4 text-sm text-ink-600">{m.reason ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {movements.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <History size={48} className="mx-auto text-ink-300 mb-4" />
                  <p className="text-ink-500 font-medium">Aucun mouvement enregistré</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-ink-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-900">Enregistrer un mouvement</h2>
              <button onClick={resetModal} className="p-1 hover:bg-ink-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Article *</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                >
                  <option value="">Sélectionner un article</option>
                  {products.map(p => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} — Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Type de mouvement *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMovementType('in')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-medium transition ${
                      movementType === 'in' ? 'border-green-600 bg-green-50 text-green-700' : 'border-ink-200 bg-ink-50 text-ink-600 hover:border-green-300'
                    }`}
                  >
                    <ArrowDown size={18} /> Entrée
                  </button>
                  <button
                    onClick={() => setMovementType('out')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-medium transition ${
                      movementType === 'out' ? 'border-red-600 bg-red-50 text-red-700' : 'border-ink-200 bg-ink-50 text-ink-600 hover:border-red-300'
                    }`}
                  >
                    <ArrowUp size={18} /> Sortie
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Quantité *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Raison (optionnel)</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex: Réapprovisionnement, Vente POS, Retour client..."
                  rows={3}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-ink-200 bg-ink-50 flex gap-3">
              <button
                onClick={resetModal}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-ink-300 rounded-lg hover:bg-ink-100 transition text-ink-900 font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMovement}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg transition text-white font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
