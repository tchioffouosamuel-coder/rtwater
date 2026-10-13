import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as blogService from '../../../services/blog';
import { toast } from 'sonner';
import {
  AlertCircle, Calendar, Edit2, Eye, FileText, Loader2, Plus, Search, Tag, Trash2, X,
} from 'lucide-react';

/**
 * Gestion des articles de blog.
 *
 * L'API (/admin/blog) existait déjà sans aucun écran : le blog était visible
 * côté site mais inalimentable par le client.
 */

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
  tags: string[] | null;
  published_at: string | null;
  author?: { name?: string } | null;
  created_at?: string | null;
}

const STATUS_META: Record<BlogPost['status'], { label: string; tone: string }> = {
  draft:     { label: 'Brouillon', tone: 'bg-amber-100 text-amber-700' },
  published: { label: 'Publié',    tone: 'bg-green-100 text-green-700' },
  archived:  { label: 'Archivé',   tone: 'bg-slate-100 text-slate-500' },
};

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface FormState {
  id: number | null;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  status: BlogPost['status'];
  tags: string;
  published_at: string;
}

const EMPTY_FORM: FormState = {
  id: null, title: '', excerpt: '', content: '', cover_image: '',
  status: 'draft', tags: '', published_at: '',
};

export const BlogAdminPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogPost['status'] | 'all'>('all');

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    blogService.fetchAdminPosts({ per_page: 50 })
      .then((res: any) => setPosts(res?.data ?? []))
      .catch(() => toast('Chargement des articles impossible', { icon: '⚠️' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .filter(p => !term || p.title.toLowerCase().includes(term) || (p.excerpt ?? '').toLowerCase().includes(term));
  }, [posts, search, statusFilter]);

  const counts = useMemo(() => ({
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    published: posts.filter(p => p.status === 'published').length,
    archived: posts.filter(p => p.status === 'archived').length,
  }), [posts]);

  const openForm = (post?: BlogPost) => {
    setForm(post
      ? {
          id: post.id,
          title: post.title,
          excerpt: post.excerpt ?? '',
          content: post.content ?? '',
          cover_image: post.cover_image ?? '',
          status: post.status,
          tags: (post.tags ?? []).join(', '),
          // L'input datetime-local attend « AAAA-MM-JJTHH:MM »
          published_at: post.published_at ? post.published_at.slice(0, 16) : '',
        }
      : EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) { setFormError('Le titre est obligatoire.'); return; }
    if (!content) { setFormError("Le contenu de l'article est obligatoire."); return; }

    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, any> = {
        title,
        content,
        excerpt: form.excerpt.trim() || null,
        cover_image: form.cover_image.trim() || null,
        status: form.status,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      // Publier sans date explicite = publier maintenant
      if (form.published_at) {
        payload.published_at = form.published_at;
      } else if (form.status === 'published') {
        payload.published_at = new Date().toISOString();
      }

      if (form.id) {
        await blogService.updatePost(form.id, payload);
        toast('Article mis à jour', { icon: '✅' });
      } else {
        await blogService.createPost(payload);
        toast('Article créé', { icon: '✅' });
      }

      setShowForm(false);
      load();
    } catch (e: any) {
      setFormError(e?.data?.message ?? "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    setDeleting(null);
    try {
      await blogService.deletePost(post.id);
      toast('Article supprimé', { icon: '✅' });
      load();
    } catch (e: any) {
      toast(e?.data?.message ?? 'Suppression impossible', { icon: '⚠️' });
    }
  };

  if (!hasPermission('manage_blog')) {
    return (
      <AdminLayout title="Blog">
        <div className="py-12 text-center">
          <p className="font-semibold text-red-600">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Blog"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Blog' }]}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-12 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Nouvel article
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ['all', `Tous (${counts.all})`],
          ['published', `Publiés (${counts.published})`],
          ['draft', `Brouillons (${counts.draft})`],
          ['archived', `Archivés (${counts.archived})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key as BlogPost['status'] | 'all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === key ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
            Chargement…
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-900">
              {search || statusFilter !== 'all' ? 'Aucun article dans cette sélection' : 'Aucun article'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Conseils d'entretien, qualité de l'eau, nouveautés : le blog améliore aussi votre référencement.
            </p>
            {!search && statusFilter === 'all' && (
              <button
                onClick={() => openForm()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <Plus size={16} />
                Écrire le premier
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {visible.map(post => {
              const status = STATUS_META[post.status];

              return (
                <li key={post.id} className="flex items-start gap-4 p-4 transition-colors hover:bg-slate-50">
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {post.cover_image ? (
                      <img src={post.cover_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <FileText size={18} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{post.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.tone}`}>
                        {status.label}
                      </span>
                    </div>

                    {post.excerpt && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{post.excerpt}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {post.status === 'published' ? formatDate(post.published_at) : formatDate(post.created_at)}
                      </span>
                      {post.author?.name && <span>par {post.author.name}</span>}
                      {post.tags && post.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag size={12} />
                          {post.tags.slice(0, 3).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 gap-1">
                    {post.status === 'published' && (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Voir « ${post.title} » sur le site`}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                      >
                        <Eye size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => openForm(post)}
                      aria-label={`Modifier ${post.title}`}
                      className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleting(post)}
                      aria-label={`Supprimer ${post.title}`}
                      className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowForm(false)} aria-hidden />

          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                {form.id ? "Modifier l'article" : 'Nouvel article'}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Fermer" className="text-slate-400 hover:text-slate-700">
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
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Titre *</span>
                <input
                  type="text" value={form.title} autoFocus
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Comment choisir son système de filtration"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Chapeau</span>
                <textarea
                  rows={2} value={form.excerpt} maxLength={500}
                  onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Résumé affiché dans la liste des articles et sur les réseaux sociaux."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="mt-1 block text-xs text-slate-400">{form.excerpt.length} / 500 caractères</span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Contenu *</span>
                <textarea
                  rows={12} value={form.content}
                  onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="<p>Votre article…</p>"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  Le HTML simple est accepté : &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;a&gt;, &lt;strong&gt;.
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Image de couverture</span>
                  <input
                    type="url" value={form.cover_image}
                    onChange={(e) => setForm(f => ({ ...f, cover_image: e.target.value }))}
                    placeholder="https://…"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Mots-clés</span>
                  <input
                    type="text" value={form.tags}
                    onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="filtration, entretien, conseils"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="mt-1 block text-xs text-slate-400">Séparés par des virgules.</span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Statut</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as BlogPost['status'] }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Brouillon — invisible sur le site</option>
                    <option value="published">Publié — visible de tous</option>
                    <option value="archived">Archivé — retiré du site</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Date de publication</span>
                  <input
                    type="datetime-local" value={form.published_at}
                    onChange={(e) => setForm(f => ({ ...f, published_at: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    Vide et publié : la date d'aujourd'hui est appliquée.
                  </span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:bg-slate-300"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {form.id ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDeleting(null)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-slate-900">Supprimer cet article ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              « {deleting.title} » sera définitivement supprimé. Pour le retirer du site sans le perdre,
              passez-le en « Archivé ».
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
