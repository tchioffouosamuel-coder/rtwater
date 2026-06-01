import { motion } from "motion/react";
import { useState } from "react";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useTheme } from "../../../theme/ThemeContext";

export function GalleryPage() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const galleryImages = [
    {
      url: "https://images.unsplash.com/photo-1738956312126-01ba60788071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMHdlbGwlMjBkcmlsbGluZyUyMGFmcmljYXxlbnwxfHx8fDE3NzA0Nzc1NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      titleKey: "gallery.items.drilling.title",
      categoryKey: "gallery.categories.drilling",
      category: "drilling",
    },
    {
      url: "https://images.unsplash.com/photo-1708287523092-0543d6803857?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMHB1cmlmaWNhdGlvbiUyMHBsYW50fGVufDF8fHx8MTc3MDQ3NzU1N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      titleKey: "gallery.items.purificationPlant.title",
      categoryKey: "gallery.categories.purification",
      category: "purification",
    },
    {
      url: "https://images.unsplash.com/photo-1758530273222-440d6a8b0eea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2ltbWluZyUyMHBvb2wlMjBtYWludGVuYW5jZXxlbnwxfHx8fDE3NzA0Nzc1NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      titleKey: "gallery.items.poolMaintenance.title",
      categoryKey: "gallery.categories.pools",
      category: "pools",
    },
    {
      url: "https://images.unsplash.com/photo-1712640379137-6d2532f887a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMHB1bXAlMjBpbnN0YWxsYXRpb258ZW58MXx8fHwxNzcwNDc3NTU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      titleKey: "gallery.items.pumpInstallation.title",
      categoryKey: "gallery.categories.pumps",
      category: "pumps",
    },
    {
      url: "https://images.unsplash.com/photo-1680200023508-5289ae3de157?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMHdhdGVyJTIwYWZyaWNhJTIwY29tbXVuaXR5fGVufDF8fHx8MTc3MDQ3NzU1OHww&ixlib=rb-4.1.0&q=80&w=1080",
      titleKey: "gallery.items.cleanWater.title",
      categoryKey: "gallery.categories.projects",
      category: "projects",
    },
    {
      url: "https://images.unsplash.com/photo-1613929906260-c9377d135547?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwd2F0ZXIlMjBwaXBlc3xlbnwxfHx8fDE3NzA0Nzc1NjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
      titleKey: "gallery.items.industrialPipes.title",
      categoryKey: "gallery.categories.installation",
      category: "installation",
    },
    {
      url: "https://images.unsplash.com/photo-1764344815153-3a356c392561?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMHN0b3JhZ2UlMjB0YW5rfGVufDF8fHx8MTc3MDQ3NzU2MHww&ixlib=rb-4.1.0&q=80&w=1080",
      titleKey: "gallery.items.storageTanks.title",
      categoryKey: "gallery.categories.installation",
      category: "installation",
    },
    {
      url: "https://images.unsplash.com/photo-1635221798248-8a3452ad07cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwbHVtYmluZyUyMHdvcmt8ZW58MXx8fHwxNzcwNDc3NTYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      titleKey: "gallery.items.professionalWork.title",
      categoryKey: "gallery.categories.maintenance",
      category: "maintenance",
    },
    {
      url: "https://images.unsplash.com/photo-1570615541379-e6b7ab6d4eb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMHdhdGVyJTIwdHJlYXRtZW50JTIwcHVyaWZpY2F0aW9ufGVufDF8fHx8MTc3MDQ3NjY5Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      titleKey: "gallery.items.advancedTreatment.title",
      categoryKey: "gallery.categories.purification",
      category: "purification",
    },
  ];

  const categories = [
    { key: "all", labelKey: "gallery.categories.all" },
    { key: "drilling", labelKey: "gallery.categories.drilling" },
    { key: "purification", labelKey: "gallery.categories.purification" },
    { key: "pools", labelKey: "gallery.categories.pools" },
    { key: "pumps", labelKey: "gallery.categories.pumps" },
    { key: "installation", labelKey: "gallery.categories.installation" },
    { key: "maintenance", labelKey: "gallery.categories.maintenance" },
    { key: "projects", labelKey: "gallery.categories.projects" },
  ];

  const filteredImages =
    selectedCategory === "all"
      ? galleryImages
      : galleryImages.filter((img) => img.category === selectedCategory);

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
    setSelectedImageIndex(filteredImages.findIndex((img) => img.url === url));
  };

  const handlePrevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(filteredImages[newIndex].url);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < filteredImages.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(filteredImages[newIndex].url);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                y: Math.random() * 400,
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.span 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-white/30"
            >
              {t("gallery.badge")}
            </motion.span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {t("gallery.title")}{" "}
              <span className="bg-gradient-to-r from-[#00A8E8] to-cyan-300 bg-clip-text text-transparent">
                {t("gallery.titleHighlight")}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed px-2">
              {t("gallery.description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-6 sm:py-8 bg-white dark:bg-slate-800 sticky top-20 z-40 shadow-sm dark:shadow-lg dark:shadow-black/20 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((category, index) => (
              <motion.button
                key={category.key}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${
                  selectedCategory === category.key
                    ? "bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white shadow-lg shadow-[#0077BE]/30"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                }`}
              >
                {t(category.labelKey)}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-gray-50 dark:from-slate-900 via-white dark:via-slate-800 to-gray-50 dark:to-slate-900 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          >
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.url}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -10 }}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg dark:shadow-xl dark:shadow-black/20 cursor-pointer transition-all duration-300"
                onClick={() => handleImageClick(image.url)}
              >
                <img
                  src={image.url}
                  alt={t(image.titleKey)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <motion.span 
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="inline-block bg-[#0077BE] text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mb-2"
                    >
                      {t(image.categoryKey)}
                    </motion.span>
                    <h3 className="text-white text-lg sm:text-xl font-bold leading-tight">
                      {t(image.titleKey)}
                    </h3>
                  </div>
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <ZoomIn className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && selectedImageIndex !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white hover:text-[#00A8E8] transition-colors z-10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 sm:w-10 h-8 sm:h-10" />
          </motion.button>

          {/* Image Counter */}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 text-white text-sm sm:text-base font-semibold bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
            {selectedImageIndex + 1} / {filteredImages.length}
          </div>

          {/* Main Image */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center justify-center w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              key={selectedImage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={selectedImage}
              alt="Selected"
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            />
          </motion.div>

          {/* Navigation Buttons */}
          {selectedImageIndex > 0 && (
            <motion.button
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 text-white hover:text-[#00A8E8] transition-colors bg-black/30 hover:bg-black/50 p-2 sm:p-3 rounded-full backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 sm:w-8 h-6 sm:h-8" />
            </motion.button>
          )}

          {selectedImageIndex < filteredImages.length - 1 && (
            <motion.button
              whileHover={{ scale: 1.1, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 text-white hover:text-[#00A8E8] transition-colors bg-black/30 hover:bg-black/50 p-2 sm:p-3 rounded-full backdrop-blur-sm"
            >
              <ChevronRight className="w-6 sm:w-8 h-6 sm:h-8" />
            </motion.button>
          )}

          {/* Image Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 sm:p-8"
          >
            <p className="text-white text-base sm:text-lg font-semibold">
              {t(filteredImages[selectedImageIndex].titleKey)}
            </p>
            <span className="inline-block bg-[#0077BE] text-white px-3 py-1 rounded-full text-sm font-semibold mt-3">
              {t(filteredImages[selectedImageIndex].categoryKey)}
            </span>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}