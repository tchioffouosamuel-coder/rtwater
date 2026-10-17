import { Droplet, Zap, Beaker, Drill, Waves, Wrench, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import { useSiteContent } from "../../context/SiteContentContext";
import { Reveal } from "./Reveal";
import { SectionBadge } from "./ui/section";

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
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-aqua-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        {/* En-tête de section */}
        <Reveal className="mb-14">
          <div className="text-center max-w-3xl mx-auto">
            <SectionBadge className="mb-3">{services.sectionSubtitle}</SectionBadge>
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 dark:text-white tracking-tight mb-3">
              {services.sectionTitle}
            </h2>
            <p className="text-ink-500 dark:text-ink-300 text-base leading-relaxed">
              {services.sectionDescription}
            </p>
          </div>
        </Reveal>

        {/* Grille de services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.items.map((service, index) => {
            const Icon = ICON_MAP[service.icon] ?? Droplet;
            return (
              <Reveal key={service.title ?? index} delay={(index % 3) * 80}>
                <article className="group relative h-full p-6 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-400/40 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 hover:-translate-y-1">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon size={24} strokeWidth={1.8} className="text-white" aria-hidden="true" />
                  </div>

                  <h3 className="font-bold text-ink-900 dark:text-white mb-2">{service.title}</h3>
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
