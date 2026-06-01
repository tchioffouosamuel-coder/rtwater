import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Star, Check, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
}

interface ProductDetailsProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
}

export function ProductDetails({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Generate multiple viewing angles
  const productImages = [
    product.image, // Front view
    product.image.replace(/w=500/, "w=501"), // Slight variation for angle 2
    product.image.replace(/fit=crop/, "fit=crop&q=80"), // Angle 3
    product.image.replace(/w=500/, "w=502"), // Angle 4
  ];

  // Sample customer reviews
  const reviews: Review[] = [
    {
      id: "1",
      author: "Jean Dupont",
      rating: 5,
      date: "2024-02-01",
      title: "Excellente qualité !",
      content:
        "Produit conforme à la description. Installation facile et fonctionne parfaitement. Je recommande vivement ce produit pour la qualité et le service.",
      verified: true,
    },
    {
      id: "2",
      author: "Marie Martin",
      rating: 5,
      date: "2024-01-28",
      title: "Très satisfaite",
      content:
        "Livraison rapide et produit de très bonne qualité. Le service client est réactif et professionnel. Je suis très satisfaite de mon achat.",
      verified: true,
    },
    {
      id: "3",
      author: "Pierre Leclerc",
      rating: 4,
      date: "2024-01-20",
      title: "Bon produit, bon prix",
      content:
        "Très bon rapport qualité/prix. Un peu compliqué à installer au début mais finalement rien de bien méchant. Ça fonctionne très bien.",
      verified: true,
    },
    {
      id: "4",
      author: "Sophie Bernard",
      rating: 5,
      date: "2024-01-15",
      title: "Dépassé mes attentes",
      content:
        "J'ai été agréablement surprise par la qualité de ce produit. Il fonctionne mieux que prévu et la durabilité semble excellente.",
      verified: true,
    },
  ];

  const discountedPrice =
    product.price - (product.price * (product.discount || 0)) / 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl">
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="sticky top-4 right-4 z-10 float-right p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-6 h-6 text-gray-900 dark:text-white" />
              </motion.button>

              <div className="p-6 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  {/* Image Gallery */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="space-y-4">
                      {/* Main Image */}
                      <div className="relative h-96 md:h-[500px] bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden group">
                        <motion.img
                          key={selectedImageIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          src={productImages[selectedImageIndex]}
                          alt={`${product.name} - Vue ${selectedImageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Navigation Arrows */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() =>
                            setSelectedImageIndex(
                              (selectedImageIndex - 1 + productImages.length) %
                                productImages.length
                            )
                          }
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-slate-800/80 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() =>
                            setSelectedImageIndex(
                              (selectedImageIndex + 1) % productImages.length
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-slate-800/80 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
                        </motion.button>

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                          {selectedImageIndex + 1} / {productImages.length}
                        </div>
                      </div>

                      {/* Thumbnail Gallery */}
                      <div className="grid grid-cols-4 gap-3">
                        {productImages.map((img, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageIndex === idx
                                ? "border-[#0077BE] dark:border-[#00A8E8] ring-2 ring-[#0077BE]"
                                : "border-gray-200 dark:border-slate-700"
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Vue ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Product Info */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                  >
                    {/* Title & Rating */}
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {product.name}
                      </h1>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(product.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {product.rating}/5 ({product.reviews} avis)
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="border-t border-b border-gray-200 dark:border-slate-700 py-6">
                      <div className="flex items-baseline gap-4 mb-4">
                        <span className="text-4xl font-bold text-[#0077BE] dark:text-[#00A8E8]">
                          {discountedPrice.toFixed(2)} XAF
                        </span>
                        {product.discount && (
                          <>
                            <span className="text-xl line-through text-gray-400">
                              {product.price.toFixed(2)} XAF
                            </span>
                            <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 px-3 py-1 rounded-full font-bold text-sm">
                              -{product.discount}%
                            </span>
                          </>
                        )}
                      </div>
                      {product.discount && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                          Économies: XAF
                          {(product.price - discountedPrice).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div
                      className={`p-4 rounded-lg flex items-center gap-3 ${
                        product.stock > 0
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-red-50 dark:bg-red-900/20"
                      }`}
                    >
                      {product.stock > 0 ? (
                        <>
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="font-semibold text-green-700 dark:text-green-100">
                              En stock
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-200">
                              {product.stock} unité(s) disponible(s)
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <p className="font-semibold text-red-700 dark:text-red-100">
                            Rupture de stock
                          </p>
                        </>
                      )}
                    </div>

                    {/* Quantity & Add to Cart */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Quantité
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() =>
                              setQuantity(Math.max(1, quantity - 1))
                            }
                            className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-12 text-center font-bold text-lg">
                            {quantity}
                          </span>
                          <button
                            onClick={() =>
                              setQuantity(
                                Math.min(product.stock || 10, quantity + 1)
                              )
                            }
                            className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAddToCart}
                        disabled={product.stock === 0}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                          product.stock === 0
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white hover:shadow-lg"
                        }`}
                      >
                        {product.stock === 0
                          ? "Rupture de stock"
                          : "Ajouter au panier"}
                      </motion.button>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Garantie:
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {product.warranty}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                          Livraison gratuite:
                        </span>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          À partir de XAF50 d'achat
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-12 pt-12 border-t border-gray-200 dark:border-slate-700"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Description Complète
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                    {product.description}
                  </p>

                  {/* Specs */}
                  {product.specifications.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Spécifications Techniques
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.specifications.map(
                          (spec: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                            >
                              <Check className="w-5 h-5 text-[#0077BE] dark:text-[#00A8E8] flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {spec}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {product.features.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Caractéristiques Principales
                      </h3>
                      <div className="space-y-3">
                        {product.features.map((feature: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                          >
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Customer Reviews */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 pt-12 border-t border-gray-200 dark:border-slate-700"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Avis Clients ({reviews.length})
                  </h2>

                  <div className="space-y-6">
                    {reviews.map((review, idx) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="p-6 bg-gray-50 dark:bg-slate-700 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900 dark:text-white">
                                {review.author}
                              </span>
                              {review.verified && (
                                <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 text-xs px-2 py-1 rounded-full">
                                  <Check className="w-3 h-3" />
                                  Achat vérifié
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(review.date).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                          {review.title}
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {review.content}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
