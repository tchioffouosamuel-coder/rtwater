import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Star, Check, AlertCircle, Send, Loader2, MessageSquare } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchProduct } from "../../services/products";
import { fetchProductReviews, createReview, type Review, type ReviewStats } from "../../services/reviews";
import { toast } from "sonner";

interface ProductDetailsProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              i <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
          {['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'][value]}
        </span>
      )}
    </div>
  );
}

function RatingBar({ count, total, label }: { count: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-gray-600 dark:text-gray-400">{label}</span>
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
      <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-gray-500 dark:text-gray-400">{count}</span>
    </div>
  );
}

export function ProductDetails({ product, isOpen, onClose, onAddToCart }: ProductDetailsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [productData, setProductData] = useState<any>(product || null);

  const [reviews, setReviews]         = useState<Review[]>([]);
  const [stats, setStats]             = useState<ReviewStats | null>(null);
  const [reviewPage, setReviewPage]   = useState(1);
  const [reviewPagination, setReviewPagination] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Submit form state
  const [showForm, setShowForm]     = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle]   = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const isLoggedIn = !!localStorage.getItem('userToken');

  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;
    (async () => {
      try {
        if (product?.id) {
          const res = await fetchProduct(String(product.id));
          const p = res?.data ?? product;
          if (mounted) setProductData(p);
        } else {
          setProductData(product);
        }
      } catch {
        setProductData(product);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen, product]);

  const loadReviews = useCallback(async () => {
    if (!product?.id || !isOpen) return;
    setLoadingReviews(true);
    try {
      const res = await fetchProductReviews(product.id, reviewPage);
      setReviews(res?.data ?? []);
      if (res?.stats) setStats(res.stats);
      if (res?.pagination) setReviewPagination(res.pagination);
    } catch {
      // silent
    } finally {
      setLoadingReviews(false);
    }
  }, [product?.id, isOpen, reviewPage]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowForm(false);
      setFormRating(0);
      setFormTitle('');
      setFormContent('');
      setSubmitted(false);
      setReviewPage(1);
    }
  }, [isOpen]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRating === 0) { toast('Veuillez choisir une note.', { icon: '⭐' }); return; }
    if (formContent.trim().length < 10) { toast('L\'avis doit contenir au moins 10 caractères.', { icon: '⚠️' }); return; }

    setSubmitting(true);
    try {
      await createReview(product.id, { rating: formRating, title: formTitle || undefined, content: formContent });
      setSubmitted(true);
      setShowForm(false);
      toast('Votre avis a été soumis et est en attente de modération.', { icon: '✅' });
    } catch (err: any) {
      toast(err?.message || 'Erreur lors de la soumission.', { icon: '⚠️' });
    } finally {
      setSubmitting(false);
    }
  };

  const prod = productData || product || {};
  const productImages = [prod.image ?? prod.image_url];

  const discountedPrice = (prod.price ?? 0) - ((prod.price ?? 0) * (prod.discount || 0)) / 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          >
            <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="sticky top-3 right-3 z-10 float-right mr-3 mt-3 p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-5 h-5 text-gray-900 dark:text-white" />
              </motion.button>

              <div className="p-4 sm:p-8 md:p-12">
                {/* Product info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  {/* Image */}
                  <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <div className="relative h-72 sm:h-96 bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden group">
                      <motion.img
                        key={selectedImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={productImages[selectedImageIndex]}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + productImages.length) % productImages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-slate-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % productImages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-slate-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Info */}
                  <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-5">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">{prod.name}</h1>
                      {stats && stats.count > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-4 h-4 ${i <= Math.round(stats.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {stats.avg_rating}/5 ({stats.count} avis)
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500">Aucun avis pour l'instant</p>
                      )}
                    </div>

                    <div className="border-t border-b border-gray-200 dark:border-slate-700 py-5">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-3xl font-bold text-[#0077BE] dark:text-[#00A8E8]">
                          {discountedPrice.toLocaleString('fr-FR')} XAF
                        </span>
                        {(prod.discount ?? 0) > 0 && (
                          <>
                            <span className="text-lg line-through text-gray-400">{(prod.price ?? 0).toLocaleString('fr-FR')} XAF</span>
                            <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 px-2 py-0.5 rounded-full font-bold text-sm">
                              -{prod.discount}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg flex items-center gap-3 ${(prod.stock ?? 0) > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      {(prod.stock ?? 0) > 0 ? (
                        <>
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-green-700 dark:text-green-100">En stock</p>
                            <p className="text-sm text-green-600 dark:text-green-200">{prod.stock} unité(s) disponible(s)</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <p className="font-semibold text-red-700 dark:text-red-100">Rupture de stock</p>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Quantité</label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-bold">−</button>
                        <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                        <button onClick={() => setQuantity(Math.min(prod.stock || 10, quantity + 1))} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-bold">+</button>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onAddToCart}
                        disabled={(prod.stock ?? 0) === 0}
                        className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${(prod.stock ?? 0) === 0 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white hover:shadow-lg'}`}
                      >
                        {(prod.stock ?? 0) === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                      </motion.button>
                    </div>
                  </motion.div>
                </div>

                {/* Description */}
                {prod.description && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10 pt-8 border-t border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Description</h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{prod.description}</p>
                  </motion.div>
                )}

                {/* Reviews Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 pt-8 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#0077BE]" />
                      Avis Clients
                      {stats && stats.count > 0 && (
                        <span className="text-sm font-normal text-gray-500">({stats.count})</span>
                      )}
                    </h2>
                    {!submitted && (
                      isLoggedIn ? (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowForm(v => !v)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077BE] text-white text-sm font-semibold hover:bg-[#005f9e] transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          {showForm ? 'Annuler' : 'Laisser un avis'}
                        </motion.button>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <a href="/login" className="text-[#0077BE] hover:underline font-medium">Connectez-vous</a> pour laisser un avis
                        </p>
                      )
                    )}
                  </div>

                  {/* Rating summary */}
                  {stats && stats.count > 0 && (
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="text-center sm:pr-6 sm:border-r border-gray-200 dark:border-slate-600">
                        <p className="text-5xl font-bold text-[#0077BE] dark:text-[#00A8E8]">{stats.avg_rating}</p>
                        <div className="flex items-center justify-center gap-0.5 my-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`w-4 h-4 ${i <= Math.round(stats.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">{stats.count} avis</p>
                      </div>
                      <div className="flex-1 space-y-1.5 w-full">
                        {[5,4,3,2,1].map((n, idx) => (
                          <RatingBar key={n} label={String(n)} count={stats.breakdown[idx] ?? 0} total={stats.count} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit form */}
                  <AnimatePresence>
                    {showForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmitReview}
                        className="bg-blue-50 dark:bg-slate-700 rounded-xl p-5 mb-6 space-y-4 overflow-hidden"
                      >
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Votre avis</h3>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Note *</label>
                          <StarPicker value={formRating} onChange={setFormRating} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Titre (optionnel)</label>
                          <input
                            type="text"
                            maxLength={120}
                            value={formTitle}
                            onChange={e => setFormTitle(e.target.value)}
                            placeholder="Résumez votre expérience"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0077BE]/30 focus:border-[#0077BE]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Commentaire * <span className="text-gray-400 font-normal">({formContent.length}/1000)</span></label>
                          <textarea
                            rows={4}
                            maxLength={1000}
                            required
                            value={formContent}
                            onChange={e => setFormContent(e.target.value)}
                            placeholder="Décrivez votre expérience avec ce produit (min. 10 caractères)"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0077BE]/30 focus:border-[#0077BE] resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0077BE] text-white text-sm font-semibold hover:bg-[#005f9e] transition-colors disabled:opacity-60"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {submitting ? 'Envoi…' : 'Soumettre l\'avis'}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {submitted && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6 text-green-700 dark:text-green-300">
                      <Check className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-medium">Merci ! Votre avis a été soumis et sera publié après modération.</p>
                    </div>
                  )}

                  {/* Reviews list */}
                  {loadingReviews ? (
                    <div className="py-8 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Chargement des avis…
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 dark:text-gray-500">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucun avis approuvé pour l'instant.</p>
                      {isLoggedIn && !submitted && (
                        <button onClick={() => setShowForm(true)} className="mt-2 text-[#0077BE] text-sm hover:underline font-medium">
                          Soyez le premier à laisser un avis
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review, idx) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="p-5 bg-gray-50 dark:bg-slate-700 rounded-xl"
                        >
                          <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {review.author.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{review.author}</span>
                                  {review.is_verified_purchase && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                                      <Check className="w-2.5 h-2.5" /> Achat vérifié
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{review.created_at}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          {review.title && (
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">{review.title}</h4>
                          )}
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{review.content}</p>
                        </motion.div>
                      ))}

                      {/* Pagination avis */}
                      {reviewPagination && reviewPagination.last_page > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                            disabled={reviewPagination.current_page === 1}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-40"
                          >
                            Précédent
                          </button>
                          <span className="text-sm text-gray-500">
                            {reviewPagination.current_page} / {reviewPagination.last_page}
                          </span>
                          <button
                            onClick={() => setReviewPage(p => Math.min(reviewPagination.last_page, p + 1))}
                            disabled={reviewPagination.current_page === reviewPagination.last_page}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-40"
                          >
                            Suivant
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
