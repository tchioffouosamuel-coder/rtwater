import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

interface HeroSectionProps {
  onNavigate?: (page: "accueil" | "galerie" | "devis" | "apropos") => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const { home } = useSiteContent();
  const { hero } = home;
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleServicesClick = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleContactClick = () => {
    navigate("/contact");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section id="accueil" className="relative min-h-[600px] sm:min-h-[700px] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {/* Primary contextual photo — water treatment infrastructure */}
        <motion.img
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: "easeOut" }}
          src={hero.backgroundImage}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          // Image décorative : si elle ne charge pas, le dégradé bleu prend le relais sans texte parasite
          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#003f6e]/90 via-[#0077BE]/80 to-[#00A8E8]/60"></div>
        {/* Vignette edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>

        {/* Watermark logo */}
        <motion.img
          src="/logo.webp"
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.22, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute right-[-8%] top-1/2 -translate-y-1/2 w-[420px] sm:w-[580px] lg:w-[720px] pointer-events-none select-none"
          style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 40px rgba(255,255,255,0.4))" }}
        />

        {/* Animated rising bubbles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(22)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                width: 3 + (i % 5) * 3,
                height: 3 + (i % 5) * 3,
                left: `${(i * 4.7) % 100}%`,
                bottom: 0,
              }}
              animate={{
                y: [0, -(700 + (i % 3) * 200)],
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: 5 + (i % 4),
                repeat: Infinity,
                delay: (i * 0.5) % 7,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex items-center gap-2 mb-4 sm:mb-6"
          >
            <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold tracking-wide uppercase text-xs sm:text-sm">
              {hero.badge}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight text-balance"
          >
            {hero.title}{" "}
            <span className="bg-gradient-to-r from-[#00A8E8] to-cyan-300 bg-clip-text text-transparent">
              {hero.titleHighlight}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-8 sm:mb-10 leading-relaxed"
          >
            {hero.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <motion.button
              onClick={handleServicesClick}
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255, 255, 255, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="group inline-flex items-center justify-center gap-2 bg-white text-[#0077BE] px-8 py-4 rounded-xl font-semibold shadow-2xl hover:shadow-white/50 transition-all duration-300"
            >
              {hero.servicesButtonLabel}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              onClick={handleContactClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
            >
              {hero.contactButtonLabel}
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Decorative Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-20 md:h-24 fill-white dark:fill-slate-900"
          aria-hidden="true"
        >
          {/* Même couleur que la section suivante, en mode clair comme en mode sombre */}
          <path d="M0,0 C300,80 600,80 900,40 C1050,10 1150,10 1200,20 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
