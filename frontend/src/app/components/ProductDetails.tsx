import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Star, Check, AlertCircle, Send, Loader2, MessageSquare, Share2, ExternalLink, Truck, ShieldCheck, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { productPath } from "../../lib/product";
import { SITE_URL } from "../../lib/seo";
import { useI18n } from "../../i18n/I18nContext";
import { FavoriteButton } from "./shop/ShopWidgets";
import { useState, useEffect, useCallback } from "react";
import { fetchProduct } from "../../services/products";
import { fetchProductReviews, createReview, type Review, type ReviewStats } from "../../services/reviews";
import { ProductDatasheet } from "./ProductDatasheet";
import { toast } from "sonner";

interface ProductDetailsProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  /** Reçoit la quantité choisie par le client */
  onAddToCart: (quantity: number) => void;
  /** "modal" = aperçu rapide depuis la boutique, "page" = fiche produit complète */
  variant?: "modal" | "page";
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const { tx } = useI18n();
  const labels = ['', tx('Très mauvais', 'Very poor'), tx('Mauvais', 'Poor'), tx('Correct', 'Fair'), tx('Bien', 'Good'), tx('Excellent', 'Excellent')];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          aria-label={`${i}/5`}
          className="focus:outline-none"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              i <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-ink-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-ink-600 dark:text-ink-300">
          {labels[value]}
        </span>
      )}
    </div>
  );
}

function RatingBar({ count, total, label }: { count: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-ink-600 dark:text-ink-400">{label}</span>
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
      <div className="flex-1 h-2 bg-ink-200 dark:bg-ink-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-ink-500 dark:text-ink-400">{count}</span>
    </div>
  );
}

export function ProductDetails({ product, isOpen, onClose, onAddToCart, variant = "modal" }: ProductDetailsProps) {
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
  const { tx, locale } = useI18n();

  // Échap ferme l'aperçu rapide, et la page derrière ne défile plus
  useEffect(() => {
    if (variant !== "modal" || !isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [variant, isOpen, onClose]);

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
    if (formRating === 0) { toast(tx('Veuillez choisir une note.', 'Please choose a rating.'), { icon: '⭐' }); return; }
    if (formContent.trim().length < 10) { toast(tx('L\'avis doit contenir au moins 10 caractères.', 'Your review must be at least 10 characters long.'), { icon: '⚠️' }); return; }

    setSubmitting(true);
    try {
      await createReview(product.id, { rating: formRating, title: formTitle || undefined, content: formContent });
      setSubmitted(true);
      setShowForm(false);
      toast(tx('Votre avis a été soumis et est en attente de modération.', 'Your review was submitted and is awaiting moderation.'), { icon: '✅' });
    } catch (err: any) {
      toast(err?.message || tx('Erreur lors de la soumission.', 'Submission failed.'), { icon: '⚠️' });
    } finally {
      setSubmitting(false);
    }
  };

  const prod = productData || product || {};
  const productImages = [prod.image || prod.image_url].filter(Boolean);
  const pagePath = prod.id && prod.name ? productPath({ id: prod.id, name: prod.name }) : "";

  const handleShare = async () => {
    const url = SITE_URL + pagePath;
    const text = `${prod.name} ${tx('chez', 'at')} RT Water Solution`;
    try {
      if (navigator.share) {
        await navigator.share({ title: prod.name, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast(tx('Lien du produit copié', 'Product link copied'), { icon: '🔗' });
    } catch {
      // partage annulé par l'utilisateur : rien à faire
    }
  };

  const discountedPrice = (prod.price ?? 0) - ((prod.price ?? 0) * (prod.discount || 0)) / 100;

  if (!isOpen) return null;

  const body = (
              <div className="p-4 sm:p-8 md:p-12">
                {/* Product info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  {/* Image */}
                  <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <div className="relative h-72 sm:h-96 bg-ink-100 dark:bg-ink-700 rounded-xl overflow-hidden group">
                      {productImages.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-ink-400 dark:text-ink-500">
                          <span className="text-sm">{tx("Photo bientôt disponible", "Photo coming soon")}</span>
                        </div>
                      )}
                      {productImages.length > 0 && <motion.img
                        key={selectedImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={productImages[selectedImageIndex]}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                      />}
                      {productImages.length > 1 && <><motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + productImages.length) % productImages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-ink-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5 text-ink-900 dark:text-white" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % productImages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-ink-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ChevronRight className="w-5 h-5 text-ink-900 dark:text-white" />
                      </motion.button></>}
                    </div>
                  </motion.div>

                  {/* Info */}
                  <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-5">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white mb-3">{prod.name}</h1>
                      {stats && stats.count > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-4 h-4 ${i <= Math.round(stats.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-ink-300'}`} />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-ink-600 dark:text-ink-300">
                            {stats.avg_rating}/5 ({stats.count} {tx('avis', stats.count > 1 ? 'reviews' : 'review')})
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-ink-400 dark:text-ink-500">{tx("Aucun avis pour l'instant", "No reviews yet")}</p>
                      )}
                    </div>

                    <div className="border-t border-b border-ink-200 dark:border-ink-700 py-5">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-3xl font-bold text-brand-600 dark:text-aqua-500">
                          {discountedPrice.toLocaleString(locale)} XAF
                        </span>
                        {(prod.discount ?? 0) > 0 && (
                          <>
                            <span className="text-lg line-through text-ink-400">{(prod.price ?? 0).toLocaleString(locale)} XAF</span>
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
                            <p className="font-semibold text-green-700 dark:text-green-100">{tx("En stock", "In stock")}</p>
                            <p className="text-sm text-green-600 dark:text-green-200">{prod.stock} {tx("unité(s) disponible(s)", "unit(s) available")}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <p className="font-semibold text-red-700 dark:text-red-100">{tx("Rupture de stock", "Out of stock")}</p>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300">{tx("Quantité", "Quantity")}</label>
                      <div className="flex items-center gap-3">
                        <button aria-label={tx("Diminuer la quantité", "Decrease quantity")} onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-lg bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors font-bold">−</button>
                        <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                        <button aria-label={tx("Augmenter la quantité", "Increase quantity")} onClick={() => setQuantity(Math.min(prod.stock || 10, quantity + 1))} className="w-9 h-9 rounded-lg bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors font-bold">+</button>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onAddToCart(quantity)}
                        disabled={(prod.stock ?? 0) === 0}
                        className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${(prod.stock ?? 0) === 0 ? 'bg-ink-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-brand-600 to-aqua-500 text-white hover:shadow-lg'}`}
                      >
                        {(prod.stock ?? 0) === 0 ? tx('Rupture de stock', 'Out of stock') : tx('Ajouter au panier', 'Add to cart')}
                      </motion.button>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {prod.id && prod.name && (
                          <FavoriteButton
                            product={{ id: String(prod.id), name: prod.name, price: Number(prod.price) || 0, discount: Number(prod.discount) || 0, image: prod.image || prod.image_url || "" }}
                            className="border border-ink-200 dark:border-ink-600 shadow-none"
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleShare}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-600 text-sm text-ink-700 dark:text-ink-200 hover:border-brand-600 hover:text-brand-600 transition-colors"
                        >
                          <Share2 className="w-4 h-4" /> {tx("Partager", "Share")}
                        </button>
                        {variant === "modal" && pagePath && (
                          <Link
                            to={pagePath}
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-600 text-sm text-ink-700 dark:text-ink-200 hover:border-brand-600 hover:text-brand-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" /> {tx("Fiche complète", "Full details")}
                          </Link>
                        )}
                      </div>

                      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs text-ink-600 dark:text-ink-300">
                        <li className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-brand-600" /> {tx("Livraison à Yaoundé", "Delivery in Yaoundé")}</li>
                        <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600" /> {tx("Paiement sécurisé", "Secure payment")}</li>
                        <li className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-brand-600" /> {tx("Conseil d'un technicien", "Expert advice")}</li>
                      </ul>
                    </div>
                  </motion.div>
                </div>

                {/* Description */}
                {prod.description && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10 pt-8 border-t border-ink-200 dark:border-ink-700">
                    <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">{tx("Description", "Description")}</h2>
                    <p className="text-ink-700 dark:text-ink-300 leading-relaxed">{prod.description}</p>
                  </motion.div>
                )}

                {/* Fiche technique — texte, image ou PDF */}
                <ProductDatasheet datasheet={prod.datasheet ?? null} />

                {/* Reviews Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 pt-8 border-t border-ink-200 dark:border-ink-700">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h2 className="text-xl font-bold text-ink-900 dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-brand-600" />
                      {tx("Avis clients", "Customer reviews")}
                      {stats && stats.count > 0 && (
                        <span className="text-sm font-normal text-ink-500">({stats.count})</span>
                      )}
                    </h2>
                    {!submitted && (
                      isLoggedIn ? (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowForm(v => !v)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          {showForm ? tx('Annuler', 'Cancel') : tx('Laisser un avis', 'Write a review')}
                        </motion.button>
                      ) : (
                        <p className="text-sm text-ink-500 dark:text-ink-400">
                          <Link to="/login" className="text-brand-600 hover:underline font-medium">{tx("Connectez-vous", "Sign in")}</Link> {tx("pour laisser un avis", "to write a review")}
                        </p>
                      )
                    )}
                  </div>

                  {/* Rating summary */}
                  {stats && stats.count > 0 && (
                    <div className="bg-ink-50 dark:bg-ink-700 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="text-center sm:pr-6 sm:border-r border-ink-200 dark:border-ink-600">
                        <p className="text-5xl font-bold text-brand-600 dark:text-aqua-500">{stats.avg_rating}</p>
                        <div className="flex items-center justify-center gap-0.5 my-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`w-4 h-4 ${i <= Math.round(stats.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-ink-300'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-ink-500">{stats.count} {tx("avis", stats.count > 1 ? "reviews" : "review")}</p>
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
                        className="bg-brand-50 dark:bg-ink-700 rounded-xl p-5 mb-6 space-y-4 overflow-hidden"
                      >
                        <h3 className="font-bold text-ink-900 dark:text-white text-sm">{tx("Votre avis", "Your review")}</h3>
                        <div>
                          <label className="block text-xs font-semibold text-ink-600 dark:text-ink-300 mb-2">{tx("Note", "Rating")} *</label>
                          <StarPicker value={formRating} onChange={setFormRating} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-600 dark:text-ink-300 mb-1.5">{tx("Titre (optionnel)", "Title (optional)")}</label>
                          <input
                            type="text"
                            maxLength={120}
                            value={formTitle}
                            onChange={e => setFormTitle(e.target.value)}
                            placeholder={tx("Résumez votre expérience", "Summarise your experience")}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-ink-200 dark:border-ink-600 bg-white dark:bg-ink-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-600 dark:text-ink-300 mb-1.5">{tx("Commentaire", "Comment")} * <span className="text-ink-400 font-normal">({formContent.length}/1000)</span></label>
                          <textarea
                            rows={4}
                            maxLength={1000}
                            required
                            value={formContent}
                            onChange={e => setFormContent(e.target.value)}
                            placeholder={tx("Décrivez votre expérience avec ce produit (min. 10 caractères)", "Describe your experience with this product (min. 10 characters)")}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-ink-200 dark:border-ink-600 bg-white dark:bg-ink-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {submitting ? tx('Envoi…', 'Sending…') : tx('Soumettre l\'avis', 'Submit review')}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {submitted && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6 text-green-700 dark:text-green-300">
                      <Check className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-medium">{tx("Merci ! Votre avis a été soumis et sera publié après modération.", "Thank you! Your review will be published after moderation.")}</p>
                    </div>
                  )}

                  {/* Reviews list */}
                  {loadingReviews ? (
                    <div className="py-8 text-center text-ink-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      {tx("Chargement des avis…", "Loading reviews…")}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="py-10 text-center text-ink-400 dark:text-ink-500">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{tx("Aucun avis approuvé pour l'instant.", "No approved reviews yet.")}</p>
                      {isLoggedIn && !submitted && (
                        <button onClick={() => setShowForm(true)} className="mt-2 text-brand-600 text-sm hover:underline font-medium">
                          {tx("Soyez le premier à laisser un avis", "Be the first to write a review")}
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
                          className="p-5 bg-ink-50 dark:bg-ink-700 rounded-xl"
                        >
                          <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {review.author.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-ink-900 dark:text-white text-sm">{review.author}</span>
                                  {review.is_verified_purchase && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                                      <Check className="w-2.5 h-2.5" /> {tx("Achat vérifié", "Verified purchase")}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-ink-500 dark:text-ink-400">{review.created_at}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-ink-300'}`} />
                              ))}
                            </div>
                          </div>
                          {review.title && (
                            <h4 className="font-bold text-ink-900 dark:text-white text-sm mb-1.5">{review.title}</h4>
                          )}
                          <p className="text-ink-700 dark:text-ink-300 text-sm leading-relaxed">{review.content}</p>
                        </motion.div>
                      ))}

                      {/* Pagination avis */}
                      {reviewPagination && reviewPagination.last_page > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                            disabled={reviewPagination.current_page === 1}
                            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-600 text-sm hover:bg-ink-100 dark:hover:bg-ink-600 disabled:opacity-40"
                          >
                            {tx("Précédent", "Previous")}
                          </button>
                          <span className="text-sm text-ink-500">
                            {reviewPagination.current_page} / {reviewPagination.last_page}
                          </span>
                          <button
                            onClick={() => setReviewPage(p => Math.min(reviewPagination.last_page, p + 1))}
                            disabled={reviewPagination.current_page === reviewPagination.last_page}
                            className="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-600 text-sm hover:bg-ink-100 dark:hover:bg-ink-600 disabled:opacity-40"
                          >
                            {tx("Suivant", "Next")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
  );

  if (variant === "page") {
    return (
      <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-700">
        {body}
      </div>
    );
  }

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
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={prod.name}
              className="w-full max-w-5xl max-h-[95vh] overflow-y-auto bg-white dark:bg-ink-800 rounded-2xl shadow-2xl"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                aria-label={tx("Fermer", "Close")}
                autoFocus
                className="sticky top-3 right-3 z-10 float-right mr-3 mt-3 p-2 bg-ink-100 dark:bg-ink-700 rounded-full hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors"
              >
                <X className="w-5 h-5 text-ink-900 dark:text-white" />
              </motion.button>
              {body}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
