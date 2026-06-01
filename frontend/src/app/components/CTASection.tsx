import { Phone, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useI18n } from "../../i18n/I18nContext";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigate } from "react-router-dom";

interface CTASectionProps {
  onNavigateToQuote?: () => void;
}

export function CTASection({ onNavigateToQuote }: CTASectionProps) {
  const { t } = useI18n();
  const { theme } = useTheme();

  const navigate = useNavigate();

  const handleContactClick = () => {
    navigate("/contact");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleServicesClick = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div
        animate={{
          background: [
            "linear-gradient(135deg, #0077BE 0%, #00A8E8 100%)",
            "linear-gradient(135deg, #00A8E8 0%, #0077BE 100%)",
            "linear-gradient(135deg, #0077BE 0%, #00A8E8 100%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
      />

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Circles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 40 - 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Water Drops Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <pattern
            id="water-drops"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="3" fill="white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#water-drops)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-4 sm:mb-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-300" />
          </motion.div>
          <span className="text-white/90 font-semibold tracking-wide uppercase text-xs sm:text-sm">
            {t("cta.badge")}
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight px-2"
        >
          {t("cta.title")}{" "}
          <span className="relative inline-block">
            <span className="relative z-10">{t("cta.titleHighlight")}</span>
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute bottom-1 sm:bottom-2 left-0 w-full h-2 sm:h-3 bg-yellow-300/30 -z-0"
            ></motion.span>
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2"
        >
          {t("cta.description")}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-2"
        >
          <motion.button
            onClick={handleContactClick}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="group inline-flex items-center justify-center gap-2 sm:gap-3 bg-white text-[#0077BE] px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-white/50 transition-all duration-300 whitespace-nowrap"
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
            {t("cta.contactButton")}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
          </motion.button>

          <motion.button
            onClick={handleServicesClick}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border-2 border-white/50 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 whitespace-nowrap"
          >
            {t("cta.servicesButton")}
          </motion.button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-8 sm:mt-12 lg:mt-16 flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 text-white/80 text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{t("cta.trustIndicators.available")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{t("cta.trustIndicators.freeQuote")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{t("cta.trustIndicators.fastInstallation")}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}