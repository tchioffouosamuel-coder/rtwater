import { Phone, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";
import { Reveal } from "./Reveal";
import { CTA_PHOTO } from "../content/photos";

export function CTASection() {
  const { home } = useSiteContent();
  const { cta } = home;
  const navigate = useNavigate();

  const handleContactClick = () => {
    navigate("/contact");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleServicesClick = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-20 md:py-28 bg-brand-950 overflow-hidden">
      {/* Photo de contexte sous un voile bleu profond, à la place du dégradé animé */}
      <img
        src={CTA_PHOTO.url}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Un seul voile : assez dense pour le texte blanc, assez clair pour laisser voir la scène */}
      <div className="absolute inset-0 bg-brand-950/80 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-dark opacity-50 pointer-events-none" />
      <div className="aurora-blob absolute top-0 right-0 w-[500px] h-[500px] bg-aqua-500/15 rounded-full pointer-events-none" />
      <div
        className="aurora-blob absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-400/15 rounded-full pointer-events-none"
        style={{ animationDelay: "-7s" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="max-w-2xl mx-auto text-center">
          {/* Pastille */}
          <div className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-aqua-200 text-xs font-semibold mb-6">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-aqua-300 animate-ping opacity-75" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-aqua-400" />
            </span>
            {cta.badge}
          </div>

          <h2 className="text-glass-dark text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
            {cta.title}{" "}
            <span className="relative inline-block">
              <span className="relative z-10">{cta.titleHighlight}</span>
              {/* Surlignage bleu clair, à la place du jaune */}
              <span
                className="absolute bottom-1 left-0 w-full h-2 sm:h-3 bg-gradient-to-r from-aqua-400/40 via-aqua-300/30 to-transparent -z-0 animate-shimmer"
                aria-hidden="true"
              />
            </span>
          </h2>

          <p className="text-white/90 text-base md:text-lg leading-relaxed mb-8">
            {cta.description}
          </p>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleContactClick}
              className="sheen glow-aqua group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-aqua-500 hover:from-brand-400 hover:to-aqua-400 text-white text-sm font-bold shadow-2xl shadow-brand-500/30 transition-all hover:-translate-y-0.5"
            >
              <Phone className="w-4 h-4" />
              {cta.contactButtonLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleServicesClick}
              className="glass-dark sheen inline-flex items-center justify-center px-7 py-3.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition-all hover:-translate-y-0.5"
            >
              {cta.servicesButtonLabel}
            </button>
          </div>

          {/* Gages de confiance */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-8 text-white/90 text-xs">
            {cta.trustIndicators.map((indicator, index) => (
              <div key={index} className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white">
                <Check className="w-4 h-4 text-aqua-300 shrink-0" aria-hidden="true" />
                <span>{indicator}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
