import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as productsService from '../../../services/products';
import api from '../../../services/api';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, X, Save, AlertCircle, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';

interface ProductForm {
  name: string;
  description: string;
  price: number;
  /** Remise en pourcentage, 0 a 100. Alimente les badges « -X % » de la boutique. */
  discount: number;
  /** Fin de promotion, format « AAAA-MM-JJTHH:MM ». Vide = sans fin. */
  discount_ends_at: string;
  /** Forme de la fiche technique. '' = aucune fiche. */
  datasheet_type: '' | 'text' | 'image' | 'pdf';
  datasheet_text: string;
  stock: number;
  is_available: boolean;
  category_id: string;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: 0,
  discount: 0,
  discount_ends_at: '',
  datasheet_type: '',
  datasheet_text: '',
  stock: 0,
  is_available: true,
  category_id: '',
};

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAdminAuth();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
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
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  // Fiche deja enregistree, affichee tant que l'admin n'en televerse pas une autre
  const [datasheetExisting, setDatasheetExisting] = useState<{ type: string; url: string | null; filename: string | null } | null>(null);

  const mapApiItem = (d: any) => ({
    id: d.id,
    name: d.name,
    description: d.description || '',
    price: d.price ?? 0,
    discount: d.discount ?? 0,
    final_price: d.final_price ?? d.price ?? 0,
    discount_ends_at: d.discount_ends_at ?? null,
    datasheet: d.datasheet ?? null,
    stock: d.stock ?? 0,
    is_available: d.is_available ?? true,
    image_url: d.image_url ?? null,
    awaiting_image: d.awaiting_image ?? null,
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

  useEffect(() => {
    api.request('/categories', { method: 'GET' })
      .then((res: any) => setCategories(res?.data ?? []))
      .catch(() => {});
  }, []);

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
        discount: product.discount ?? 0,
        discount_ends_at: product.discount_ends_at ? String(product.discount_ends_at).slice(0, 16) : '',
        datasheet_type: product.datasheet?.type ?? '',
        datasheet_text: product.datasheet?.text ?? '',
        stock: product.stock,
        is_available: product.is_available,
        category_id: product.category?.id ? String(product.category.id) : '',
      });
      setImagePreview(product.image_url ?? null);
      setDatasheetExisting(product.datasheet ?? null);
    } else {
      setEditingId(null);
      setFormData(EMPTY_FORM);
      setImagePreview(null);
      setDatasheetExisting(null);
    }
    setImageFile(null);
    setDatasheetFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setDatasheetFile(null);
    setDatasheetExisting(null);
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

        // Un fichier impose multipart, que ce soit le visuel ou la fiche technique
        if (imageFile || datasheetFile) {
          payload = new FormData();
          payload.append('name', formData.name);
          payload.append('description', formData.description);
          payload.append('price', String(formData.price));
          payload.append('discount', String(formData.discount));
          if (formData.discount_ends_at) payload.append('discount_ends_at', formData.discount_ends_at);
          payload.append('stock', String(formData.stock));
          payload.append('is_available', formData.is_available ? '1' : '0');
          if (formData.category_id) payload.append('category_id', formData.category_id);
          if (imageFile) payload.append('image_url', imageFile);

          // Chaine vide : FormData ne transporte pas null, le serveur lit '' et
          // retire la fiche technique.
          payload.append('datasheet_type', formData.datasheet_type || 'none');
          if (formData.datasheet_type === 'text') payload.append('datasheet_text', formData.datasheet_text);
          if (datasheetFile) payload.append('datasheet_file', datasheetFile);
        } else {
          payload = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            discount: formData.discount,
            discount_ends_at: formData.discount_ends_at || null,
            stock: formData.stock,
            is_available: formData.is_available,
            datasheet_type: formData.datasheet_type || 'none',
            ...(formData.datasheet_type === 'text' ? { datasheet_text: formData.datasheet_text } : {}),
            ...(formData.category_id ? { category_id: Number(formData.category_id) } : {}),
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
        <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl border border-brand-200 p-4">
          <p className="text-sm text-brand-600 font-medium">Total produits</p>
          <p className="text-2xl font-bold text-brand-900 mt-2">{stats.total}</p>
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
          <Search className="absolute left-4 top-3 text-ink-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-2.5 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition bg-white"
          />
        </div>
        <button
          onClick={() => navigate('/admin/products/import')}
          className="flex items-center gap-2 border border-ink-200 bg-white text-ink-700 px-6 py-2.5 rounded-lg hover:bg-ink-50 transition font-medium whitespace-nowrap"
          title="Importer un catalogue Excel avec rattachement automatique des images"
        >
          <FileSpreadsheet size={18} />
          Import Excel
        </button>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 transition font-medium whitespace-nowrap"
        >
          <Plus size={18} />
          Ajouter produit
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-ink-400 text-sm">Chargement...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50 border-b border-ink-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-ink-900">Produit</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-900">Prix de vente</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-ink-900">Stock</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-900">Valeur stock</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-ink-900">Statut</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-ink-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {paginatedProducts.map((product) => {
                  const isCritical = product.stock === 0;
                  const isLow = product.stock > 0 && product.stock <= 5;

                  return (
                    <tr key={product.id} className={`hover:bg-ink-50 transition-colors ${isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded-lg border border-ink-200" />
                          ) : product.awaiting_image ? (
                            <span
                              title={`Photo attendue : ${product.awaiting_image}`}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50 text-amber-600"
                            >
                              <ImageIcon size={16} />
                            </span>
                          ) : null}
                          <div>
                            <p className="text-sm font-medium text-ink-900">{product.name}</p>
                            {product.awaiting_image && (
                              <p className="text-xs text-amber-600">
                                Photo attendue : <code>{product.awaiting_image}</code>
                              </p>
                            )}
                            {product.category && (
                              <p className="text-xs text-ink-400">{product.category.name ?? product.category}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-ink-900 text-right">
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
                      <td className="px-6 py-4 text-sm font-semibold text-ink-900 text-right">
                        {(product.price * product.stock).toLocaleString('fr-FR')} XAF
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.is_available ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'
                        }`}>
                          {product.is_available ? 'Disponible' : 'Indisponible'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition"
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
            <p className="text-ink-500 font-medium">Aucun produit trouvé</p>
          </div>
        )}

        {/* Table Footer */}
        <div className="px-6 py-4 bg-ink-50 border-t border-ink-200 flex items-center justify-between text-sm text-ink-600">
          <p>Total : {pagination ? pagination.total : filteredProducts.length} produits</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-ink-300 hover:bg-ink-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                      currentPage === page ? 'bg-brand-600 text-white' : 'border border-ink-300 hover:bg-ink-100'
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
              className="px-3 py-1 rounded border border-ink-300 hover:bg-ink-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="sticky top-0 px-6 py-4 border-b border-ink-200 bg-white flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink-900">
                {editingId ? 'Modifier le produit' : 'Ajouter un produit'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-ink-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Catégorie</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(p => ({ ...p, category_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white text-ink-900"
                >
                  <option value="">— Sans catégorie —</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Nom du produit *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nom du produit"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-ink-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Prix de vente (XAF) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  step="1"
                  min="0"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Promotion — alimente les badges « -X % » et la section
                  « Offres du moment » de la boutique */}
              <div className="rounded-lg border border-ink-200 p-4 space-y-3">
                <p className="text-sm font-medium text-ink-900">Promotion</p>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs font-medium text-ink-600 mb-1">Remise (%)</span>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        discount: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                      }))}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-ink-600 mb-1">Fin de promotion</span>
                    <input
                      type="datetime-local"
                      value={formData.discount_ends_at}
                      onChange={(e) => setFormData(p => ({ ...p, discount_ends_at: e.target.value }))}
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                    />
                  </label>
                </div>

                {formData.discount > 0 ? (
                  <p className="text-xs text-green-700">
                    Prix affiche au client :{' '}
                    <strong>
                      {Math.round(formData.price * (100 - formData.discount) / 100).toLocaleString('fr-FR')} XAF
                    </strong>{' '}
                    au lieu de {Math.round(formData.price).toLocaleString('fr-FR')} XAF
                    {formData.discount_ends_at
                      ? `, jusqu'au ${new Date(formData.discount_ends_at).toLocaleDateString('fr-FR')}.`
                      : ', sans date de fin.'}
                  </p>
                ) : (
                  <p className="text-xs text-ink-400">
                    0 % : aucune promotion. Le produit se vend au prix de vente.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description du produit"
                  rows={3}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Fiche technique — texte, image ou PDF */}
              <div className="rounded-lg border border-ink-200 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">Fiche technique</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Caractéristiques détaillées, affichées sous la description sur la fiche produit.
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {([
                    ['', 'Aucune'],
                    ['text', 'Texte'],
                    ['image', 'Image'],
                    ['pdf', 'PDF'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value || 'none'}
                      type="button"
                      onClick={() => {
                        setFormData(p => ({ ...p, datasheet_type: value }));
                        // Changer de type invalide le fichier choisi pour l'autre
                        if (value !== 'image' && value !== 'pdf') setDatasheetFile(null);
                      }}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                        formData.datasheet_type === value
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {formData.datasheet_type === 'text' && (
                  <label className="block">
                    <span className="block text-xs font-medium text-ink-600 mb-1">Caractéristiques</span>
                    <textarea
                      value={formData.datasheet_text}
                      onChange={(e) => setFormData(p => ({ ...p, datasheet_text: e.target.value }))}
                      rows={6}
                      maxLength={20000}
                      placeholder={'Débit : 10 L/min\nPression : 2 à 6 bar\nFiltration : 5 µm\nGarantie : 2 ans'}
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm leading-relaxed"
                    />
                    <span className="mt-1 block text-xs text-ink-400">
                      Une caractéristique par ligne. {formData.datasheet_text.length} / 20 000 caractères.
                    </span>
                  </label>
                )}

                {(formData.datasheet_type === 'image' || formData.datasheet_type === 'pdf') && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept={formData.datasheet_type === 'pdf' ? 'application/pdf' : 'image/jpeg,image/png,image/webp'}
                      onChange={(e) => setDatasheetFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink-700"
                    />

                    {datasheetFile ? (
                      <p className="text-xs text-green-700">
                        Nouveau fichier : {datasheetFile.name} ({(datasheetFile.size / 1024 / 1024).toFixed(1)} Mo)
                      </p>
                    ) : datasheetExisting?.url ? (
                      <p className="text-xs text-ink-500">
                        Fiche actuelle :{' '}
                        <a
                          href={datasheetExisting.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 underline hover:no-underline"
                        >
                          {datasheetExisting.filename || 'voir le fichier'}
                        </a>
                        {' '}— conservée si vous n'en téléversez pas d'autre.
                      </p>
                    ) : (
                      <p className="text-xs text-ink-400">
                        {formData.datasheet_type === 'pdf'
                          ? 'PDF du fabricant, 10 Mo maximum.'
                          : 'JPG, PNG ou WebP — 10 Mo maximum. Le tableau reste lisible : la réduction est moins forte que pour un visuel produit.'}
                      </p>
                    )}
                  </div>
                )}

                {formData.datasheet_type === '' && datasheetExisting && (
                  <p className="text-xs text-amber-600">
                    La fiche technique enregistrée sera retirée à l'enregistrement.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Quantité en stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData(p => ({ ...p, is_available: e.target.checked }))}
                  className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="is_available" className="text-sm font-medium text-ink-900">
                  Produit disponible à la vente
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Image produit</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (file) setImagePreview(URL.createObjectURL(file));
                  }}
                  className="w-full text-sm text-ink-700"
                />
                {imagePreview && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-ink-200">
                    <img src={imagePreview} alt="Prévisualisation" className="w-full h-40 object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 px-6 py-4 border-t border-ink-200 bg-ink-50 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-ink-300 rounded-lg hover:bg-ink-100 transition text-ink-900 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saveLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg transition text-white font-medium disabled:cursor-not-allowed disabled:opacity-60"
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
            <div className="px-6 py-4 border-b border-ink-200">
              <h3 className="text-lg font-semibold text-ink-900">Confirmer la suppression</h3>
            </div>

            <div className="p-6">
              <p className="text-ink-600 mb-4">
                Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">⚠️ Les données associées seront perdues</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-ink-200 bg-ink-50 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-ink-300 rounded-lg hover:bg-ink-100 transition text-ink-900 font-medium"
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
