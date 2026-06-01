import { ShoppingCart, Star, Check } from "lucide-react";
import { motion } from "motion/react";
import { useCart } from "../../context/CartContext";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  rating?: number;
  reviews?: number;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Product Image */}
      <div className="relative w-full h-64 bg-gradient-to-b from-blue-100 to-blue-50 dark:from-slate-700 dark:to-slate-600 overflow-hidden group">
        <div className="w-full h-full flex items-center justify-center text-6xl">
          {product.image}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={`${
                    i < Math.round(product.rating!)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            {product.reviews && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({product.reviews})
              </span>
            )}
          </div>
        )}

        {/* Price and Button */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[#0077BE] dark:text-blue-400">
            ${product.price.toFixed(2)}
          </span>
          <motion.button
            onClick={handleAddToCart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg transition-all duration-300 ${
              isAdded
                ? "bg-green-500 text-white"
                : "bg-[#0077BE] text-white hover:bg-[#005a8d]"
            }`}
          >
            {isAdded ? <Check size={20} /> : <ShoppingCart size={20} />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
