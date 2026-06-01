import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, X, Save, Clock, Copy, Globe } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author: string;
  views: number;
  seoTitle: string;
  seoDescription: string;
}

export const PagesManagerPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [pages, setPages] = useState<Page[]>([
    {
      id: '1',
      title: 'Accueil',
      slug: 'accueil',
      content: '<h1>Bienvenue chez RTWater</h1><p>Solutions aquatiques professionnelles...</p>',
      published: true,
      createdAt: '2025-01-15',
      updatedAt: '2025-02-08',
      author: 'Admin',
      views: 1547,
      seoTitle: 'RTWater - Solutions Aquatiques',
      seoDescription: 'Découvrez nos solutions aquatiques professionnelles.',
    },
    {
      id: '2',
      title: 'À propos',
      slug: 'a-propos',
      content: '<h1>À propos de RTWater</h1><p>Depuis plus de 10 ans...</p>',
      published: true,
      createdAt: '2025-01-16',
      updatedAt: '2025-02-05',
      author: 'Admin',
      views: 342,
      seoTitle: 'À propos - RTWater',
      seoDescription: 'Découvrez l\'histoire et les valeurs de RTWater.',
    },
    {
      id: '3',
      title: 'Conditions d\'utilisation',
      slug: 'conditions-utilisation',
      content: '<h1>Conditions d\'utilisation</h1><p>Les présentes conditions...</p>',
      published: true,
      createdAt: '2025-01-20',
      updatedAt: '2025-02-01',
      author: 'Admin',
      views: 89,
      seoTitle: 'Conditions d\'utilisation',
      seoDescription: 'Conditions d\'utilisation du site RTWater.',
    },
    {
      id: '4',
      title: 'Politique de confidentialité',
      slug: 'politique-confidentialite',
      content: '<h1>Politique de confidentialité</h1><p>Vos données sont protégées...</p>',
      published: true,
      createdAt: '2025-01-21',
      updatedAt: '2025-02-02',
      author: 'Admin',
      views: 124,
      seoTitle: 'Politique de confidentialité',
      seoDescription: 'Découvrez comment nous protégeons vos données.',
    },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
  });

  // Filter
  const filteredPages = useMemo(() => {
    return pages.filter(page =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pages, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPages = filteredPages.slice(startIndex, startIndex + itemsPerPage);

  if (!hasPermission('manage_pages')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const handleOpenModal = (page?: Page) => {
    if (page) {
      setEditingId(page.id);
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        seoTitle: '',
        seoDescription: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setShowPreview(false);
  };

  const handleSavePage = () => {
    if (!formData.title || !formData.slug) {
      alert('Titre et URL sont obligatoires');
      return;
    }

    if (editingId) {
      setPages(pages.map(p =>
        p.id === editingId
          ? { ...p, ...formData, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      ));
    } else {
      setPages([
        ...pages,
        {
          id: Date.now().toString(),
          ...formData,
          published: false,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          author: 'Admin',
          views: 0,
        },
      ]);
    }

    handleCloseModal();
  };

  const handleTogglePublish = (id: string) => {
    setPages(pages.map(p =>
      p.id === id ? { ...p, published: !p.published } : p
    ));
  };

  const handleDeletePage = (id: string) => {
    setPages(pages.filter(p => p.id !== id));
    setDeleteConfirm(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[éèê]/g, 'e')
      .replace(/[àâ]/g, 'a')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ûù]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  return (
    <AdminLayout
      title="Gestion des pages"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Pages' },
      ]}
    >
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total pages</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{pages.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Publiées</p>
          <p className="text-2xl font-bold text-green-900 mt-2">{pages.filter(p => p.published).length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-600 font-medium">Brouillons</p>
          <p className="text-2xl font-bold text-amber-900 mt-2">{pages.filter(p => !p.published).length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-600 font-medium">Vues totales</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">{pages.reduce((sum, p) => sum + p.views, 0)}</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une page..."
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
          Nouvelle page
        </button>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {paginatedPages.map((page) => (
          <div
            key={page.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Page Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{page.title}</h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${
                  page.published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {page.published ? 'Publié' : 'Brouillon'}
              </span>
            </div>

            {/* Page Info */}
            <div className="p-4 space-y-3">
              <div className="text-xs text-slate-600">
                <p className="font-mono text-slate-500">/{page.slug}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  {page.views} vues
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {page.updatedAt}
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 line-clamp-2">
                {page.seoDescription || 'Pas de description SEO'}
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex gap-2">
              <button
                onClick={() => handleOpenModal(page)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <Edit2 size={14} />
                Éditer
              </button>
              <button
                onClick={() => handleTogglePublish(page.id)}
                className={`flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  page.published
                    ? 'text-amber-600 hover:bg-amber-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {page.published ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => setDeleteConfirm(page.id)}
                className="flex items-center justify-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPages.length === 0 && (
        <div className="text-center py-12">
          <Globe size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">Aucune page trouvée</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 transition disabled:opacity-50"
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 transition disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Modifier la page' : 'Créer une nouvelle page'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(p => ({ ...p, title: e.target.value }));
                  }}
                  placeholder="Titre de la page"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-900">URL (slug) *</label>
                  <button
                    onClick={() => setFormData(p => ({ ...p, slug: generateSlug(p.title) }))}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Copy size={12} />
                    Auto-générer
                  </button>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-sm text-slate-600">/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
                    placeholder="page-url"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* SEO Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Titre SEO
                  <span className="text-xs text-slate-500 ml-2">{formData.seoTitle.length}/60</span>
                </label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(p => ({ ...p, seoTitle: e.target.value.slice(0, 60) }))}
                  placeholder="Titre pour les moteurs de recherche"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* SEO Description */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Description SEO
                  <span className="text-xs text-slate-500 ml-2">{formData.seoDescription.length}/160</span>
                </label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(p => ({ ...p, seoDescription: e.target.value.slice(0, 160) }))}
                  placeholder="Description pour les moteurs de recherche"
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                />
              </div>

              {/* Content Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-900">Contenu *</label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded ${
                      showPreview
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye size={12} />
                    {showPreview ? 'Masquer aperçu' : 'Aperçu'}
                  </button>
                </div>

                {showPreview ? (
                  <div className="min-h-64 p-4 border border-slate-200 rounded-lg bg-white prose max-w-none text-sm">
                    <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                  </div>
                ) : (
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                    placeholder="Contenu HTML de la page..."
                    rows={12}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm resize-none"
                  />
                )}

                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  💡 Vous pouvez utiliser du HTML pour formater le contenu (div style, h1-h6, p, ul, ol, etc.)
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition text-slate-900 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-medium"
              >
                <Save size={16} />
                Enregistrer la page
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
                Êtes-vous sûr de vouloir supprimer cette page ? Cette action est irréversible.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <p className="text-sm text-amber-800">⚠️ Toutes les données seront supprimées</p>
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
                onClick={() => handleDeletePage(deleteConfirm)}
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
