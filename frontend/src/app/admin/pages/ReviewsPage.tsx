import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { Star, CheckCircle, XCircle, Clock, Trash2, Search, MessageSquare, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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
  const [expanded, setExpanded] = useState<number | null>(null);
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              const isOpen = expanded === review.id;
              const busy   = actionLoading === review.id;
              return (
                <div key={review.id} className="p-4 hover:bg-ink-50 transition-colors">
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
                        <span className="text-xs text-ink-400">{review.created_at}</span>
                      </div>

                      {review.title && (
                        <p className="text-sm font-semibold text-ink-800 mb-1">{review.title}</p>
                      )}

                      <p className={`text-sm text-ink-600 leading-relaxed ${!isOpen ? 'line-clamp-2' : ''}`}>
                        {review.content}
                      </p>
                      {review.content.length > 120 && (
                        <button
                          onClick={() => setExpanded(isOpen ? null : review.id)}
                          className="text-xs text-brand-600 hover:underline mt-1"
                        >
                          {isOpen ? 'Réduire' : 'Lire la suite'}
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {review.status !== 'approved' && (
                        <button
                          onClick={() => handleStatus(review, 'approved')}
                          disabled={busy}
                          title="Approuver"
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition disabled:opacity-40"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button
                          onClick={() => handleStatus(review, 'rejected')}
                          disabled={busy}
                          title="Rejeter"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      {review.status !== 'pending' && (
                        <button
                          onClick={() => handleStatus(review, 'pending')}
                          disabled={busy}
                          title="Remettre en attente"
                          className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition disabled:opacity-40"
                        >
                          <Clock size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review)}
                        disabled={busy}
                        title="Supprimer"
                        className="p-1.5 rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
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
    </AdminLayout>
  );
}
