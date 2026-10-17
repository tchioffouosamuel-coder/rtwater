import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as catalog from '../../../services/catalog';
import type { Category, CategoryType } from '../../../services/catalog';
import { toast } from 'sonner';
import {
  AlertCircle, Check, Edit2, FolderTree, Loader2, Package, Plus, Search, Trash2, Wrench, X,
} from 'lucide-react';

/**
 * Gestion des catégories.
 *
 * L'API existait déjà (POST/PUT/DELETE /categories) mais aucun écran ne
 * l'utilisait : une catégorie ne pouvait être créée qu'en appelant l'API à la
 * main, ou indirectement par l'import Excel.
 */

const TYPE_META: Record<CategoryType, { label: string; icon: React.ElementType; tone: string }> = {
  product: { label: 'Produits', icon: Package, tone: 'bg-brand-100 text-brand-700' },
  service: { label: 'Services', icon: Wrench, tone: 'bg-violet-100 text-violet-700' },
};

/** Même règle de slug que côté serveur, pour afficher un aperçu fidèle. */
const slugify = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

interface FormState {
  id: number | null;
  name: string;
  type: CategoryType;
}

const EMPTY_FORM: FormState = { id: null, name: '', type: 'product' };

export const CategoriesPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CategoryType | 'all'>('all');

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    catalog.fetchCategories()
      .then(setCategories)
      .catch(() => toast('Chargement des catégories impossible', { icon: '⚠️' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories
      .filter(c => typeFilter === 'all' || c.type === typeFilter)
      .filter(c => !term || c.name.toLowerCase().includes(term) || c.slug.includes(term))
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'fr'));
  }, [categories, search, typeFilter]);

  const openForm = (category?: Category) => {
    setForm(category ? { id: category.id, name: category.name, type: category.type } : EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      setFormError('Le nom de la catégorie est obligatoire.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (form.id) {
        await catalog.updateCategory(form.id, { name, type: form.type });
        toast('Catégorie mise à jour', { icon: '✅' });
      } else {
        await catalog.createCategory({ name, type: form.type });
        toast('Catégorie créée', { icon: '✅' });
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setFormError(e?.data?.message ?? "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    setDeleting(null);
    try {
      await catalog.deleteCategory(category.id);
      toast('Catégorie supprimée', { icon: '✅' });
      load();
    } catch (e: any) {
      // Le serveur refuse si la catégorie contient encore des articles
      toast(e?.data?.message ?? 'Suppression impossible', { icon: '⚠️' });
    }
  };

  if (!hasPermission('manage_categories')) {
    return (
      <AdminLayout title="Catégories">
        <div className="py-12 text-center">
          <p className="font-semibold text-red-600">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const counts = {
    product: categories.filter(c => c.type === 'product').length,
    service: categories.filter(c => c.type === 'service').length,
  };

  return (
    <AdminLayout
      title="Catégories"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Catégories' }]}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-ink-400" size={18} />
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une catégorie…"
            className="w-full rounded-lg border border-ink-200 bg-white py-2.5 pl-12 pr-4 outline-none transition focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-2">
          {([['all', `Toutes (${categories.length})`], ['product', `Produits (${counts.product})`], ['service', `Services (${counts.service})`]] as const).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key as CategoryType | 'all')}
                className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  typeFilter === key ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>

        <button
          onClick={() => openForm()}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white transition hover:bg-brand-700"
        >
          <Plus size={18} />
          Nouvelle catégorie
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-ink-400">
            <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
            Chargement…
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FolderTree size={32} className="mx-auto text-ink-300" />
            <p className="mt-3 text-sm font-medium text-ink-900">
              {search || typeFilter !== 'all' ? 'Aucune catégorie dans cette sélection' : 'Aucune catégorie'}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              Les catégories organisent la boutique et servent de filtres aux visiteurs.
            </p>
            {!search && typeFilter === 'all' && (
              <button
                onClick={() => openForm()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                <Plus size={16} />
                Créer la première
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50">
                <tr className="border-b border-ink-200 text-left text-sm font-semibold text-ink-900">
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-center">Articles</th>
                  <th className="px-6 py-4">Adresse</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {visible.map(category => {
                  const meta = TYPE_META[category.type];
                  const Icon = meta.icon;
                  const count = category.type === 'product'
                    ? category.products_count ?? 0
                    : category.services_count ?? 0;

                  return (
                    <tr key={category.id} className="transition-colors hover:bg-ink-50">
                      <td className="px-6 py-4 text-sm font-medium text-ink-900">{category.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.tone}`}>
                          <Icon size={12} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          count > 0 ? 'bg-ink-100 text-ink-700' : 'bg-ink-50 text-ink-400'
                        }`}>
                          {count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-500">/{category.slug}</code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openForm(category)}
                            aria-label={`Modifier ${category.name}`}
                            className="rounded-lg p-1.5 text-brand-600 transition hover:bg-brand-50"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleting(category)}
                            aria-label={`Supprimer ${category.name}`}
                            className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
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
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setShowForm(false)} aria-hidden />

          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
              <h2 className="text-base font-semibold text-ink-900">
                {form.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Fermer" className="text-ink-400 hover:text-ink-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                  <p className="text-xs text-red-700">{formError}</p>
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Nom</span>
                <input
                  type="text" value={form.name} autoFocus
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                  placeholder="Bouteilles, Fontaines, Entretien…"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                {form.name.trim() && !form.id && (
                  <span className="mt-1 block text-xs text-ink-400">
                    Adresse : <code className="rounded bg-ink-100 px-1">/{slugify(form.name)}</code>
                  </span>
                )}
              </label>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Type</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['product', 'service'] as CategoryType[]).map(type => {
                    const meta = TYPE_META[type];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setForm(f => ({ ...f, type }))}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                          form.type === type
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                        }`}
                      >
                        <Icon size={16} />
                        {meta.label}
                        {form.type === type && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-ink-400">
                  Une catégorie de produits apparaît dans la boutique, une catégorie de services dans les prestations.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-ink-200 px-6 py-4">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-ink-200 px-5 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:bg-ink-300"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {form.id ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setDeleting(null)} aria-hidden />

          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-ink-900">Supprimer « {deleting.name} » ?</h2>
            <p className="mt-2 text-sm text-ink-600">
              Cette action est définitive. Si la catégorie contient encore des articles, la suppression sera refusée.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleting)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
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
