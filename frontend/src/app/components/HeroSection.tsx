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
      <div className="absolute inset-0">
        <img
          src={hero.backgroundImage}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-950/75" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="mb-3 text-white/90 text-xs font-bold uppercase tracking-[0.2em]">
            RT WATER SOLUTION
          </p>
          <div className="inline-flex items-center gap-2 border-l-2 border-aqua-400 pl-3 text-aqua-100 text-xs font-semibold uppercase tracking-[0.18em] mb-6">
            {hero.badge}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-semibold text-white leading-[1.08] tracking-tight mb-6 text-balance">
            {hero.title}{" "}
            <span className="text-aqua-200">
              {hero.titleHighlight}
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/85 leading-relaxed max-w-xl mb-8">
            {hero.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleServicesClick}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
            >
              {hero.servicesButtonLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleContactClick}
              className="inline-flex items-center justify-center border border-white/50 px-6 py-3.5 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              {hero.contactButtonLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-20 md:h-24 fill-ink-50 dark:fill-ink-950"
          aria-hidden="true"
        >
          <path d="M0,0 C300,80 600,80 900,40 C1050,10 1150,10 1200,20 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
