import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

export function HeroSection() {
  const { home } = useSiteContent();
  const { hero } = home;
  const navigate = useNavigate();

  const handleServicesClick = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleContactClick = () => {
    navigate("/contact");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section
      id="accueil"
      className="relative min-h-[600px] sm:min-h-[700px] flex items-center overflow-hidden"
    >
      {/* Arrière-plan */}
      <div className="absolute inset-0">
        {/* Photo de contexte : installations de traitement de l'eau */}
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
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
          className="w-full h-full object-cover"
        />
        {/* Voile dégradé pour la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/90 via-brand-600/80 to-aqua-500/60" />
        {/* Vignettage */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        {/* Trame quadrillée, comme sur les sections claires */}
        <div className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none" />

        {/* Logo en filigrane */}
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

        {/* Bulles montantes */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
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

      {/* Contenu */}
      <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-16 sm:py-20">
        <div className="max-w-3xl">
          {/* Pastille en verre dépoli avec point pulsant */}
          <div className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-aqua-100 text-xs font-semibold mb-5 animate-fade-down">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-aqua-300 animate-ping opacity-75" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-aqua-400" />
            </span>
            {hero.badge}
          </div>

          <h1 className="text-glass-dark text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-5 animate-fade-up text-balance">
            {hero.title}{" "}
            <span
              className="bg-gradient-to-r from-aqua-300 via-white to-aqua-100 bg-clip-text text-transparent"
              style={{ backgroundSize: "220% 100%", animation: "gradientShift 8s ease infinite" }}
            >
              {hero.titleHighlight}
            </span>
          </h1>

          <p
            className="text-glass-dark text-base md:text-lg text-white/90 leading-relaxed max-w-xl mb-7 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            {hero.description}
          </p>

          {/* Boutons d'action */}
          <div
            className="flex flex-col sm:flex-row gap-3 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            <button
              onClick={handleServicesClick}
              className="sheen group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-aqua-50 text-brand-700 text-sm font-semibold shadow-xl shadow-brand-950/25 transition-all hover:-translate-y-0.5"
            >
              {hero.servicesButtonLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleContactClick}
              className="glass-dark sheen inline-flex items-center justify-center px-6 py-3.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition-all hover:-translate-y-0.5"
            >
              {hero.contactButtonLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Vague décorative */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          // Même couleur que la section suivante, en mode clair comme en mode sombre
          className="w-full h-20 md:h-24 fill-ink-50 dark:fill-ink-950"
          aria-hidden="true"
        >
          <path d="M0,0 C300,80 600,80 900,40 C1050,10 1150,10 1200,20 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
