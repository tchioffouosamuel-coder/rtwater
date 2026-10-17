import { Droplet, Zap, Beaker, Drill, Waves, Wrench, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import { useSiteContent } from "../../context/SiteContentContext";
import { Reveal } from "./Reveal";
import { SectionBadge } from "./ui/section";
import { SERVICES_PHOTO } from "../content/photos";

const ICON_MAP: Record<string, React.ElementType> = {
  droplet: Droplet,
  zap: Zap,
  beaker: Beaker,
  drill: Drill,
  waves: Waves,
  wrench: Wrench,
};

export function ServicesSection() {
  const { home } = useSiteContent();
  const { services } = home;
  const { tx } = useI18n();

  return (
    <section
      id="services"
      className="relative py-20 md:py-28 bg-ink-50/60 dark:bg-ink-950 overflow-hidden transition-colors duration-300"
    >
      {/* Photo de contexte, fortement voilée : elle habille la section sans gêner la lecture */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={services.backgroundImage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-ink-50/94 dark:bg-ink-950/95" />
      </div>

      {/* Trame pointillée et halos bleus */}
      <div className="absolute inset-0 bg-dots dark:bg-dots-dark opacity-40 pointer-events-none" />
      <div className="aurora-blob absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full pointer-events-none" />
      <div
        className="aurora-blob absolute -bottom-40 -left-40 w-96 h-96 bg-aqua-400/10 rounded-full pointer-events-none"
        style={{ animationDelay: "-9s" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        {/* En-tête de section, épaulé par une photo de contexte */}
        <Reveal className="mb-14">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <figure className="order-2 lg:order-1">
              <img
                src={SERVICES_PHOTO.url}
                alt={SERVICES_PHOTO.alt}
                loading="lazy"
                decoding="async"
                className="w-full aspect-[4/3] object-cover rounded-2xl shadow-lg ring-1 ring-white/40"
              />
              {SERVICES_PHOTO.caption ? (
                <figcaption className="mt-3 text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                  {SERVICES_PHOTO.caption}
                </figcaption>
              ) : null}
            </figure>
            <div className="order-1 lg:order-2">
              <SectionBadge className="mb-3">{services.sectionSubtitle}</SectionBadge>
              <h2 className="gradient-text-animated text-3xl md:text-4xl font-bold tracking-tight mb-3">
                {services.sectionTitle}
              </h2>
              <p className="text-glass text-ink-500 dark:text-ink-300 text-base leading-relaxed">
                {services.sectionDescription}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Grille de services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.items.map((service, index) => {
            const Icon = ICON_MAP[service.icon] ?? Droplet;
            return (
              <Reveal key={service.title ?? index} delay={(index % 3) * 80}>
                <article className="glass-card lift sheen group relative h-full p-6 rounded-2xl">
                  <div
                    className={`glow-aqua w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                  >
                    <Icon size={24} strokeWidth={1.8} className="text-white" aria-hidden="true" />
                  </div>

                  <h3 className="text-glass font-bold text-ink-900 dark:text-white mb-2 transition-colors group-hover:text-brand-700 dark:group-hover:text-aqua-300">
                    {service.title}
                  </h3>
                  <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Toute la carte mène au devis, service pré-sélectionné */}
                  <Link
                    to={`/devis?service=${encodeURIComponent(service.title)}`}
                    className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-aqua-400 after:absolute after:inset-[-999px] after:content-['']"
                    aria-label={tx(
                      `Demander un devis : ${service.title}`,
                      `Request a quote: ${service.title}`
                    )}
                  >
                    {tx("Demander un devis", "Request a quote")}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
