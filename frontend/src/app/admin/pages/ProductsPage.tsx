import React, { useState, useMemo, useEffect } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as productsService from '../../../services/products';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';

interface ProductForm {
  name: string;
  description: string;
  price: number;
  stock: number;
  is_available: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  is_available: true,
};

export const ProductsPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; per_page: number; total: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductForm>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const mapApiItem = (d: any) => ({
    id: d.id,
    name: d.name,
    description: d.description || '',
    price: d.price ?? 0,
    stock: d.stock ?? 0,
    is_available: d.is_available ?? true,
    image_url: d.image_url ?? null,
    category: d.category ?? null,
  });

  const filteredProducts = useMemo(() => {
    if (pagination) return items;
    return items.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm, pagination]);

  const totalPages = pagination ? pagination.last_page : Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = pagination
    ? items
    : filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: pagination ? pagination.total : items.length,
    critical: items.filter(p => p.stock === 0).length,
    low: items.filter(p => p.stock > 0 && p.stock <= 5).length,
    totalValue: items.reduce((sum, p) => sum + (p.price * p.stock), 0),
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productsService.fetchProducts({ search: searchTerm, page: currentPage });
      const data = res?.data || [];
      setPagination(res?.pagination ?? null);
      setItems(data.map(mapApiItem));
    } catch (e) {
      console.warn('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    productsService.fetchProducts({ search: searchTerm, page: currentPage })
      .then(res => {
        if (!mounted) return;
        const data = res?.data || [];
        setPagination(res?.pagination ?? null);
        setItems(data.map(mapApiItem));
      })
      .catch(e => console.warn('Failed to load products', e))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [searchTerm, currentPage]);

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
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        is_available: product.is_available,
      });
      setImagePreview(product.image_url ?? null);
    } else {
      setEditingId(null);
      setFormData(EMPTY_FORM);
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSaveProduct = () => {
    if (!formData.name.trim() || formData.price < 0) {
      alert('Veuillez renseigner le nom du produit et un prix valide.');
      return;
    }

    (async () => {
      setSaveLoading(true);
      try {
        let payload: any;
        if (imageFile) {
          payload = new FormData();
          payload.append('name', formData.name);
          payload.append('description', formData.description);
          payload.append('price', String(formData.price));
          payload.append('stock', String(formData.stock));
          payload.append('is_available', formData.is_available ? '1' : '0');
          payload.append('image', imageFile);
        } else {
          payload = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            stock: formData.stock,
            is_available: formData.is_available,
          };
        }

        if (editingId) {
          await productsService.updateProduct(String(editingId), payload);
          toast('Produit mis à jour', { icon: '✅' });
        } else {
          await productsService.createProduct(payload);
          toast('Produit créé', { icon: '✅' });
        }

        handleCloseModal();
        await loadProducts();
      } catch (e) {
        console.error(e);
        toast("Erreur lors de l'enregistrement", { icon: '⚠️' });
      } finally {
        setSaveLoading(false);
      }
    })();
  };

  const handleDeleteProduct = (id: string) => {
    setDeleteConfirm(null);
    (async () => {
      try {
        await productsService.deleteProduct(String(id));
        toast('Produit supprimé', { icon: '✅' });
        await loadProducts();
      } catch (e) {
        console.error(e);
        toast('Erreur suppression', { icon: '⚠️' });
      }
    })();
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
          <p className="text-sm text-red-600 font-medium">Rupture de stock</p>
          <p className="text-2xl font-bold text-red-900 mt-2">{stats.critical}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-4">
          <p className="text-sm text-amber-600 font-medium">Stock faible (≤ 5)</p>
          <p className="text-2xl font-bold text-amber-900 mt-2">{stats.low}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-4">
          <p className="text-sm text-green-600 font-medium">Valeur du stock</p>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {stats.totalValue.toLocaleString('fr-FR')} XAF
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Chargement...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Produit</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Prix de vente</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Stock</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Valeur stock</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Statut</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedProducts.map((product) => {
                  const isCritical = product.stock === 0;
                  const isLow = product.stock > 0 && product.stock <= 5;

                  return (
                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">{product.name}</p>
                            {product.category && (
                              <p className="text-xs text-slate-400">{product.category.name ?? product.category}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">
                        {Number(product.price).toLocaleString('fr-FR')} XAF
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                          isCritical ? 'bg-red-100 text-red-700' :
                          isLow      ? 'bg-amber-100 text-amber-700' :
                                       'bg-green-100 text-green-700'
                        }`}>
                          {isCritical && <AlertCircle size={14} />}
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">
                        {(product.price * product.stock).toLocaleString('fr-FR')} XAF
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.is_available ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {product.is_available ? 'Disponible' : 'Indisponible'}
                        </span>
                      </td>
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
          )}
        </div>

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 font-medium">Aucun produit trouvé</p>
          </div>
        )}

        {/* Table Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
          <p>Total : {pagination ? pagination.total : filteredProducts.length} produits</p>
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
                      currentPage === page ? 'bg-blue-600 text-white' : 'border border-slate-300 hover:bg-slate-100'
                    } transition`}
                  >
                    {page}
                  </button>
                ) : null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
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
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
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
                <label className="block text-sm font-medium text-slate-900 mb-2">Prix de vente (XAF) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  step="1"
                  min="0"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description du produit"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Quantité en stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData(p => ({ ...p, is_available: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_available" className="text-sm font-medium text-slate-900">
                  Produit disponible à la vente
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Image produit</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (file) setImagePreview(URL.createObjectURL(file));
                  }}
                  className="w-full text-sm text-slate-700"
                />
                {imagePreview && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-slate-200">
                    <img src={imagePreview} alt="Prévisualisation" className="w-full h-40 object-cover" />
                  </div>
                )}
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
                disabled={saveLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saveLoading ? 'Enregistrement...' : 'Enregistrer'}
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
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">⚠️ Les données associées seront perdues</p>
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
