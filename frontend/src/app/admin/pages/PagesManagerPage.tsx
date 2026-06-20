import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import pagesService from '../../../services/pages';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, X, Save, Clock, Globe, Loader2 } from 'lucide-react';

interface ApiPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = { title: '', slug: '', content: '', meta_title: '', meta_description: '' };

export const PagesManagerPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const [pages, setPages] = useState<ApiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pagesService.fetchAdminPages();
      setPages(res?.data ?? res ?? []);
    } catch {
      showToast('Erreur lors du chargement des pages', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  const filteredPages = useMemo(() =>
    pages.filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase())
    ), [pages, searchTerm]);

  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const paginatedPages = filteredPages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const generateSlug = (title: string) =>
    title.toLowerCase()
      .replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o').replace(/[ûù]/g, 'u').replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleOpenModal = (page?: ApiPage) => {
    if (page) {
      setEditingId(page.id);
      setFormData({ title: page.title, slug: page.slug, content: page.content, meta_title: page.meta_title ?? '', meta_description: page.meta_description ?? '' });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingId(null); };

  const handleSavePage = async () => {
    if (!formData.title || !formData.slug) { setFormError('Titre et URL sont obligatoires'); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await pagesService.updatePage(editingId, formData);
        showToast('Page mise à jour');
      } else {
        await pagesService.createPage(formData);
        showToast('Page créée');
      }
      handleCloseModal();
      await loadPages();
    } catch (err: any) {
      setFormError(err?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (page: ApiPage) => {
    try {
      await pagesService.updatePage(page.id, { is_published: !page.is_published });
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_published: !p.is_published } : p));
    } catch {
      showToast('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const handleDeletePage = async (id: number) => {
    try {
      await pagesService.deletePage(id);
      setPages(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
      showToast('Page supprimée');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  if (!hasPermission('manage_pages')) {
    return (
      <AdminLayout>
        <div className="text-center py-12"><p className="text-red-600 font-semibold">Accès refusé</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Gestion des pages"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Pages' }]}
    >
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg z-40 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total pages</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{pages.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Publiées</p>
          <p className="text-2xl font-bold text-green-900 mt-2">{pages.filter(p => p.is_published).length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-600 font-medium">Brouillons</p>
          <p className="text-2xl font-bold text-amber-900 mt-2">{pages.filter(p => !p.is_published).length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une page..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
        >
          <Plus size={18} />
          Nouvelle page
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
          <span>Chargement des pages...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {paginatedPages.map(page => (
              <div key={page.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{page.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${page.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {page.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="font-mono text-xs text-slate-500">/{page.slug}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={12} />
                    {new Date(page.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                  {page.meta_description && (
                    <p className="bg-slate-50 p-2 rounded text-xs text-slate-600 line-clamp-2">{page.meta_description}</p>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                  <button onClick={() => handleOpenModal(page)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Edit2 size={14} /> Éditer
                  </button>
                  <button onClick={() => handleTogglePublish(page)} className={`flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg transition ${page.is_published ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                    {page.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => setDeleteConfirm(page.id)} className="flex items-center justify-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPages.length === 0 && (
            <div className="text-center py-12">
              <Globe size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">Aucune page trouvée</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50">Précédent</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setCurrentPage(n)} className={`px-3 py-1 rounded ${currentPage === n ? 'bg-blue-600 text-white' : 'border border-slate-300 hover:bg-slate-100'}`}>{n}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50">Suivant</button>
            </div>
          )}
        </>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{editingId ? 'Modifier la page' : 'Créer une nouvelle page'}</h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-100 rounded-lg transition"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Titre de la page"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-900">URL (slug) *</label>
                  <button onClick={() => setFormData(p => ({ ...p, slug: generateSlug(p.title) }))} className="text-xs text-blue-600 hover:underline">
                    Générer depuis le titre
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))}
                  placeholder="url-de-la-page"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Contenu (HTML)</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                  placeholder="<h1>Titre</h1><p>Contenu de la page...</p>"
                  rows={10}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Titre SEO</label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={e => setFormData(p => ({ ...p, meta_title: e.target.value }))}
                    placeholder="Titre pour les moteurs de recherche"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Description SEO</label>
                  <input
                    type="text"
                    value={formData.meta_description}
                    onChange={e => setFormData(p => ({ ...p, meta_description: e.target.value }))}
                    placeholder="Description pour les moteurs de recherche"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button onClick={handleCloseModal} disabled={saving} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition text-slate-900 font-medium disabled:opacity-50">
                Annuler
              </button>
              <button onClick={handleSavePage} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-medium disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <Trash2 size={36} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Supprimer cette page ?</h3>
            <p className="text-slate-600 text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition font-medium">
                Annuler
              </button>
              <button onClick={() => handleDeletePage(deleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
