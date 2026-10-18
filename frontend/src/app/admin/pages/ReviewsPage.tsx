import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { Star, CheckCircle, XCircle, Clock, Trash2, Search, MessageSquare, ChevronLeft, ChevronRight, Filter, ArrowLeft, X } from 'lucide-react';
import { fetchAdminReviews, updateReviewStatus, deleteReview, type Review } from '../../../services/reviews';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  pending:  'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-ink-300'}
        />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [counts, setCounts]     = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading]   = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminReviews({ status: statusFilter || undefined, page });
      setReviews(res?.data ?? []);
      if (res?.counts) setCounts(res.counts);
      if (res?.pagination) setPagination(res.pagination);
    } catch {
      toast('Erreur lors du chargement des avis', { icon: '⚠️' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (review: Review, status: 'approved' | 'rejected' | 'pending') => {
    setActionLoading(review.id);
    try {
      await updateReviewStatus(review.id, status);
      setSelectedReview(current => current?.id === review.id ? { ...current, status } : current);
      toast(status === 'approved' ? 'Avis approuvé' : status === 'rejected' ? 'Avis rejeté' : 'Remis en attente', { icon: status === 'approved' ? '✅' : '🚫' });
      load();
    } catch {
      toast('Erreur lors de la mise à jour', { icon: '⚠️' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!confirm(`Supprimer l'avis de ${review.author} ?`)) return;
    setActionLoading(review.id);
    try {
      await deleteReview(review.id);
      setSelectedReview(current => current?.id === review.id ? null : current);
      toast('Avis supprimé');
      load();
    } catch {
      toast('Erreur lors de la suppression', { icon: '⚠️' });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = search.trim()
    ? reviews.filter(r =>
        r.author.toLowerCase().includes(search.toLowerCase()) ||
        r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.content.toLowerCase().includes(search.toLowerCase())
      )
    : reviews;

  const statCards = [
    { label: 'Total',       value: counts.total,    color: 'text-ink-700',  bg: 'bg-ink-50',   icon: MessageSquare },
    { label: 'En attente',  value: counts.pending,  color: 'text-yellow-700', bg: 'bg-yellow-50',  icon: Clock },
    { label: 'Approuvés',   value: counts.approved, color: 'text-green-700',  bg: 'bg-green-50',   icon: CheckCircle },
    { label: 'Rejetés',     value: counts.rejected, color: 'text-red-700',    bg: 'bg-red-50',     icon: XCircle },
  ];

  return (
    <AdminLayout
      title="Avis Clients"
      breadcrumbs={[{ label: 'Backoffice', path: '/admin/dashboard' }, { label: 'Avis Clients' }]}
    >
      {/* Stats */}
      <div className="admin-summary-grid grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <Icon size={20} className={color} />
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-ink-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-ink-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Rechercher auteur, produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-ink-400" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-ink-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-ink-400">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-ink-400">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucun avis trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {filtered.map(review => {
              const busy   = actionLoading === review.id;
              return (
                <article
                  key={review.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedReview(review)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedReview(review);
                    }
                  }}
                  className="cursor-pointer p-4 transition-colors hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {review.author.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-ink-900 text-sm">{review.author}</span>
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                            <CheckCircle size={10} /> Achat vérifié
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[review.status]}`}>
                          {STATUS_LABELS[review.status]}
                        </span>
                      </div>

                      {review.product && (
                        <p className="text-xs text-ink-500 mb-1.5">
                          Produit : <span className="font-medium text-ink-700">{review.product.name}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <StarRow rating={review.rating} />
                      </div>

                      {review.title && (
                        <p className="text-sm font-semibold text-ink-800 mb-1">{review.title}</p>
                      )}
                      <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600">Ouvrir les détails</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {review.status !== 'approved' && (
                        <button
                          onClick={event => {
                            event.stopPropagation();
                            handleStatus(review, 'approved');
                          }}
                          disabled={busy}
                          title="Approuver"
                          aria-label={`Approuver l'avis de ${review.author}`}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition disabled:opacity-40"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button
                          onClick={event => {
                            event.stopPropagation();
                            handleStatus(review, 'rejected');
                          }}
                          disabled={busy}
                          title="Rejeter"
                          aria-label={`Rejeter l'avis de ${review.author}`}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      {review.status !== 'pending' && (
                        <button
                          onClick={event => {
                            event.stopPropagation();
                            handleStatus(review, 'pending');
                          }}
                          disabled={busy}
                          title="Remettre en attente"
                          aria-label={`Remettre en attente l'avis de ${review.author}`}
                          className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition disabled:opacity-40"
                        >
                          <Clock size={16} />
                        </button>
                      )}
                      <button
                        onClick={event => {
                          event.stopPropagation();
                          handleDelete(review);
                        }}
                        disabled={busy}
                        title="Supprimer"
                        aria-label={`Supprimer l'avis de ${review.author}`}
                        className="p-1.5 rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-4 py-3 border-t border-ink-100 flex items-center justify-between">
            <span className="text-xs text-ink-500">
              Page {pagination.current_page} / {pagination.last_page} — {pagination.total} avis
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.current_page === 1}
                className="p-1.5 rounded border border-ink-200 hover:bg-ink-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page === pagination.last_page}
                className="p-1.5 rounded border border-ink-200 hover:bg-ink-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedReview && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setSelectedReview(null)} aria-hidden />
          <section role="dialog" aria-modal="true" aria-labelledby="review-sheet-title" className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center gap-3 border-b border-ink-200 bg-white px-6 py-4">
              <button onClick={() => setSelectedReview(null)} aria-label="Fermer la fiche avis" className="text-ink-400 transition hover:text-ink-700">
                <ArrowLeft size={20} />
              </button>
              <h2 id="review-sheet-title" className="flex-1 text-base font-semibold text-ink-900">Avis de {selectedReview.author}</h2>
              <button onClick={() => setSelectedReview(null)} aria-label="Fermer" className="text-ink-400 transition hover:text-ink-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <StarRow rating={selectedReview.rating} size={18} />
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[selectedReview.status]}`}>
                  {STATUS_LABELS[selectedReview.status]}
                </span>
                {selectedReview.is_verified_purchase && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    <CheckCircle size={12} /> Achat vérifié
                  </span>
                )}
              </div>
              {selectedReview.product && (
                <div className="rounded-lg bg-ink-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-ink-500">Produit</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{selectedReview.product.name}</p>
                </div>
              )}
              <div className="rounded-xl border border-ink-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Titre</p>
                <p className="mt-2 text-sm font-semibold text-ink-900">{selectedReview.title || 'Sans titre'}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-500">Commentaire</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{selectedReview.content}</p>
              </div>
              <p className="text-xs text-ink-500">Publié le {selectedReview.created_at}</p>
              <div className="flex flex-wrap gap-2">
                {selectedReview.status !== 'approved' && (
                  <button onClick={() => handleStatus(selectedReview, 'approved')} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100">
                    <CheckCircle size={16} /> Approuver
                  </button>
                )}
                {selectedReview.status !== 'rejected' && (
                  <button onClick={() => handleStatus(selectedReview, 'rejected')} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
                    <XCircle size={16} /> Rejeter
                  </button>
                )}
                {selectedReview.status !== 'pending' && (
                  <button onClick={() => handleStatus(selectedReview, 'pending')} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">
                    <Clock size={16} /> En attente
                  </button>
                )}
                <button onClick={() => handleDelete(selectedReview)} className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm font-medium text-ink-600 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
