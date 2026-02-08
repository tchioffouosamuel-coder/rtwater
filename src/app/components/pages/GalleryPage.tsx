import { motion } from "motion/react";
import { useState } from "react";
import { ZoomIn, X } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";

export function GalleryPage() {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-32 bg-gradient-to-br from-[#0077BE] to-[#00A8E8]">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
              {t("gallery.badge")}
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              {t("gallery.title")}{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
                {t("gallery.titleHighlight")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto">
              {t("gallery.description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-12 bg-white sticky top-20 z-40 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedCategory === category.key
                    ? "bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white shadow-lg shadow-[#0077BE]/30"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t(category.labelKey)}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg cursor-pointer"
                onClick={() => setSelectedImage(image.url)}
              >
                <img
                  src={image.url}
                  alt={t(image.titleKey)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block bg-[#0077BE] text-white px-3 py-1 rounded-full text-xs font-semibold mb-2">
                      {t(image.categoryKey)}
                    </span>
                    <h3 className="text-white text-xl font-bold">
                      {t(image.titleKey)}
                    </h3>
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <ZoomIn className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-[#00A8E8] transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-10 h-10" />
          </button>
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            src={selectedImage}
            alt="Selected"
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </div>
  );
}