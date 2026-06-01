import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useInventory } from '../../../context/InventoryContext';
import { Plus, AlertCircle, TrendingDown, TrendingUp, ArrowDown, ArrowUp, Search, X, Save, History, Warehouse } from 'lucide-react';

interface MovementRecord {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  time: string;
}

export const InventoryPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const { items, getLowStockItems, getCriticalStockItems, addMovement } = useInventory();
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out' | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Mock movement history
  const [movements, setMovements] = useState<MovementRecord[]>([
    {
      id: '1',
      itemId: '1',
      itemName: 'Filtre aquatique',
      type: 'in',
      quantity: 10,
      reason: 'Réapprovisionnement fournisseur',
      date: '2025-02-08',
      time: '14:30',
    },
    {
      id: '2',
      itemId: '3',
      itemName: 'Traitement chlore 1kg',
      type: 'out',
      quantity: 5,
      reason: 'Vente POS',
      date: '2025-02-08',
      time: '16:45',
    },
    {
      id: '3',
      itemId: '2',
      itemName: 'Pompe aquatique 5000L',
      type: 'in',
      quantity: 2,
      reason: 'Retour client',
      date: '2025-02-07',
      time: '10:15',
    },
  ]);

  if (!hasPermission('manage_inventory')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const lowStockItems = getLowStockItems();
  const criticalItems = getCriticalStockItems();
  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.cost, 0);

  // Filter items by search
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const stats = [
    {
      label: 'Stock total',
      value: items.reduce((sum, item) => sum + item.quantity, 0),
      icon: Warehouse,
      color: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Alerte rupture',
      value: criticalItems.length,
      icon: AlertCircle,
      color: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      label: 'Stock faible',
      value: lowStockItems.length,
      icon: TrendingDown,
      color: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      label: 'Valeur stock',
      value: `${totalValue.toFixed(0)} XAF`,
      icon: TrendingUp,
      color: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAddMovement = () => {
    if (!selectedItem || !movementType || !quantity) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    const item = items.find(i => i.id === selectedItem);
    if (!item) {
      showToast('Article non trouvé', 'error');
      return;
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      showToast('La quantité doit être positive', 'error');
      return;
    }

    // Add movement to context
    addMovement({
      itemId: selectedItem,
      type: movementType,
      quantity: qty,
      reason: reason || (movementType === 'in' ? 'Entrée stock' : 'Sortie stock'),
    });

    // Add to history
    const newMovement: MovementRecord = {
      id: Date.now().toString(),
      itemId: selectedItem,
      itemName: item.name,
      type: movementType,
      quantity: qty,
      reason: reason || (movementType === 'in' ? 'Entrée stock' : 'Sortie stock'),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMovements([newMovement, ...movements]);

    // Reset form
    setSelectedItem(null);
    setMovementType(null);
    setQuantity('');
    setReason('');
    setShowMovementModal(false);

    showToast(`Mouvement enregistré: ${qty} unité(s) de ${item.name}`, 'success');
  };

  return (
    <AdminLayout
      title="Gestion du Stock"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Stock' },
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.color} p-4 rounded-xl border border-slate-200 hover:shadow-md transition`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
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
              <p className="text-sm text-red-700 mt-1">
                {criticalItems.length} article(s) avec stock très faible:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {criticalItems.map(item => (
                  <span key={item.id} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                    {item.name} ({item.quantity} restant)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
          />
        </div>
        <button
          onClick={() => setShowMovementModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
        >
          <Plus size={18} />
          Nouveau mouvement
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 bg-slate-600 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition font-medium whitespace-nowrap"
        >
          <History size={18} />
          Historique
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Article</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">SKU</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Quantité</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Min/Max</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Coût unit.</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Valeur totale</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Emplacement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item) => {
                const isCritical = item.quantity <= item.minQuantity;
                const isLow = item.quantity > item.minQuantity && item.quantity < item.maxQuantity * 0.3;
                const value = item.quantity * item.cost;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.sku}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block font-semibold px-3 py-1 rounded-full text-sm ${
                          isCritical
                            ? 'bg-red-100 text-red-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                      {item.minQuantity} / {item.maxQuantity}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900">{item.cost.toFixed(2)} XAF</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                      {value.toFixed(2)} XAF  
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          <AlertCircle size={14} /> Critique
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
                    <td className="px-6 py-4 text-center text-sm text-slate-600">{item.location || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Warehouse size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Aucun article trouvé</p>
          </div>
        )}
      </div>

      {/* Movement History */}
      {showHistory && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">Historique des mouvements</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date & Heure</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Article</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Quantité</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {movement.date} <span className="text-slate-400">{movement.time}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{movement.itemName}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          movement.type === 'in'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {movement.type === 'in' ? (
                          <>
                            <ArrowDown size={12} /> Entrée
                          </>
                        ) : (
                          <>
                            <ArrowUp size={12} /> Sortie
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      {movement.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{movement.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {movements.length === 0 && (
            <div className="px-6 py-12 text-center">
              <History size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Aucun mouvement enregistré</p>
            </div>
          )}
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Enregistrer un mouvement</h2>
              <button
                onClick={() => {
                  setShowMovementModal(false);
                  setMovementType(null);
                  setSelectedItem(null);
                  setQuantity('');
                  setReason('');
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Article Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Article *</label>
                <select
                  value={selectedItem || ''}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Sélectionner un article</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - Stock: {item.quantity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Type de mouvement *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMovementType('in')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-medium transition ${
                      movementType === 'in'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-green-300'
                    }`}
                  >
                    <ArrowDown size={18} />
                    Entrée
                  </button>
                  <button
                    onClick={() => setMovementType('out')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-medium transition ${
                      movementType === 'out'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-red-300'
                    }`}
                  >
                    <ArrowUp size={18} />
                    Sortie
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Quantité *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Raison (optionnel)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Réapprovisionnement, Vente POS, Retour client..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => {
                  setShowMovementModal(false);
                  setMovementType(null);
                  setSelectedItem(null);
                  setQuantity('');
                  setReason('');
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition text-slate-900 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMovement}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-medium"
              >
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

