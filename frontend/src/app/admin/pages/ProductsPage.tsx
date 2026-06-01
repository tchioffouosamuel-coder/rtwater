import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useInventory } from '../../../context/InventoryContext';
import { Plus, Search, Edit2, Trash2, X, Save, AlertCircle, TrendingUp } from 'lucide-react';

interface ProductForm {
  sku: string;
  name: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  cost: number;
  location: string;
}

export const ProductsPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const { items, updateItemQuantity, addMovement } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductForm>({
    sku: '',
    name: '',
    quantity: 0,
    minQuantity: 5,
    maxQuantity: 100,
    cost: 0,
    location: '',
  });

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    return items.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const stats = {
    total: items.length,
    critical: items.filter(p => p.quantity <= p.minQuantity).length,
    low: items.filter(p => p.quantity > p.minQuantity && p.quantity < p.maxQuantity * 0.3).length,
    totalValue: items.reduce((sum, p) => sum + (p.cost * p.quantity), 0),
  };

  if (!hasPermission('manage_products')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        sku: product.sku,
        name: product.name,
        quantity: product.quantity,
        minQuantity: product.minQuantity,
        maxQuantity: product.maxQuantity,
        cost: product.cost,
        location: product.location,
      });
    } else {
      setEditingId(null);
      setFormData({
        sku: '',
        name: '',
        quantity: 0,
        minQuantity: 5,
        maxQuantity: 100,
        cost: 0,
        location: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.sku || formData.cost < 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (editingId) {
      // Update existing product
      const product = items.find(p => p.id === editingId);
      if (product) {
        const quantityDiff = formData.quantity - product.quantity;
        if (quantityDiff !== 0) {
          addMovement({
            itemId: editingId,
            type: quantityDiff > 0 ? 'in' : 'out',
            quantity: Math.abs(quantityDiff),
            reason: 'Ajustement manuel'
          });
        }
        // In a real app, update other fields like cost, location, etc.
      }
    } else {
      // Add new product - would need to implement in context
      console.log('Nouveau produit:', formData);
    }

    handleCloseModal();
  };

  const handleDeleteProduct = (id: string) => {
    setDeleteConfirm(null);
    // In a real app, implement deletion in context
    console.log('Supprimer produit:', id);
  };

  return (
    <AdminLayout
      title="Gestion des produits"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Produits' },
      ]}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4">
          <p className="text-sm text-blue-600 font-medium">Total produits</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-4">
          <p className="text-sm text-red-600 font-medium">Stock critique</p>
          <p className="text-2xl font-bold text-red-900 mt-2">{stats.critical}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-4">
          <p className="text-sm text-amber-600 font-medium">Stock faible</p>
          <p className="text-2xl font-bold text-amber-900 mt-2">{stats.low}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-4">
          <p className="text-sm text-green-600 font-medium">Valeur stock</p>
          <p className="text-2xl font-bold text-green-900 mt-2">{stats.totalValue.toFixed(0)} XAF</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
        >
          <Plus size={18} />
          Ajouter produit
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Produit</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">SKU</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Localisation</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Coût unitaire</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Stock</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Min/Max</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Valeur</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedProducts.map((product) => {
                const isCritical = product.quantity <= product.minQuantity;
                const isLow = product.quantity > product.minQuantity && product.quantity < product.maxQuantity * 0.3;
                const value = product.cost * product.quantity;

                return (
                  <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : ''}`}>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{product.sku}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.location}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">{product.cost.toFixed(2)} XAF</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                        isCritical ? 'bg-red-100 text-red-700' : 
                        isLow ? 'bg-amber-100 text-amber-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {isCritical && <AlertCircle size={14} />}
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                      {product.minQuantity} / {product.maxQuantity}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">{value.toFixed(2)} XAF</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
        {filteredProducts.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 font-medium">Aucun produit trouvé</p>
          </div>
        )}

        {/* Table Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
          <p>Affichage de {paginatedProducts.length} sur {filteredProducts.length} produits</p>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Modifier le produit' : 'Ajouter un produit'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                  placeholder="Ex: PROD-001"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Nom du produit *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nom du produit"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Coût unitaire (XAF) *</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Localisation</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                  placeholder="Entrepôt A, Étagère 1"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Quantité en stock</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Min</label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData(p => ({ ...p, minQuantity: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Max</label>
                  <input
                    type="number"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData(p => ({ ...p, maxQuantity: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button 
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition text-slate-900 font-medium"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveProduct}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-medium"
              >
                <Save size={16} />
                Enregistrer
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
                Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <p className="text-sm text-amber-800">⚠️ Les données d'inventaire seront perdues</p>
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
                onClick={() => handleDeleteProduct(deleteConfirm)}
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
