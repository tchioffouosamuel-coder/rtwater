import { Award, Users, CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSiteContent } from "../../context/SiteContentContext";
import { Reveal } from "./Reveal";
import { SectionBadge } from "./ui/section";
import { TRUST_PHOTO } from "../content/photos";

/**
 * Compteur qui s'incrémente lorsqu'il devient visible.
 * Respecte « prefers-reduced-motion » en affichant directement la valeur finale.
 */
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCount(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started.current) return;
          started.current = true;
          observer.unobserve(entry.target);

          const duration = 1600;
          const start = performance.now();
          const tick = (now: number) => {
            // Décélération en fin de course, plus naturelle qu'un pas constant
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold gradient-text-animated tabular-nums">
      {count}
      {suffix}
    </div>
  );
}

const STAT_ICONS = [Award, Users, CheckCircle];
const STAT_GRADIENTS = [
  "from-brand-500 to-brand-600",
  "from-aqua-500 to-aqua-600",
  "from-brand-600 to-aqua-500",
];

export function TrustSection() {
  const { home } = useSiteContent();
  const { trust } = home;

  return (
    <section className="relative py-20 md:py-28 bg-white dark:bg-ink-900 overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-dots dark:bg-dots-dark opacity-30 pointer-events-none" />
      <div className="aurora-blob absolute -left-28 top-24 h-72 w-72 rounded-full bg-aqua-400/10 pointer-events-none" />
      <div
        className="aurora-blob absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-brand-500/10 pointer-events-none"
        style={{ animationDelay: "-11s" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        {/* En-tête de section, photo en vis-à-vis (disposition inversée par rapport aux services) */}
        <Reveal className="mb-14">
          <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-12 items-center">
            <div>
              <SectionBadge tone="aqua" className="mb-3">
                {trust.sectionSubtitle}
              </SectionBadge>
              <h2 className="text-glass text-3xl md:text-4xl font-bold text-ink-900 dark:text-white tracking-tight mb-3">
                {trust.sectionTitle}{" "}
                <span className="gradient-text-animated">{trust.sectionTitleHighlight}</span>
              </h2>
              <p className="text-glass text-ink-500 dark:text-ink-300 text-base leading-relaxed">
                {trust.sectionDescription}
              </p>
            </div>
            <figure>
              <img
                src={TRUST_PHOTO.url}
                alt={TRUST_PHOTO.alt}
                loading="lazy"
                decoding="async"
                className="w-full aspect-[16/10] object-cover rounded-2xl shadow-lg ring-1 ring-white/40"
              />
              {TRUST_PHOTO.caption ? (
                <figcaption className="mt-3 text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                  {TRUST_PHOTO.caption}
                </figcaption>
              ) : null}
            </figure>
          </div>
        </Reveal>

        {/* Chiffres clés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trust.stats.map((stat, index) => {
            const Icon = STAT_ICONS[index % STAT_ICONS.length];
            const gradient = STAT_GRADIENTS[index % STAT_GRADIENTS.length];
            const value = parseInt(stat.value, 10) || 0;

            return (
              <Reveal key={stat.label ?? index} delay={(index % 3) * 80}>
                <div className="glass-card lift sheen group h-full p-6 md:p-8 rounded-2xl">
                  <div
                    className={`glow-aqua w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6`}
                  >
                    <Icon size={24} strokeWidth={1.8} className="text-white" aria-hidden="true" />
                  </div>

                  <Counter value={value} suffix={stat.suffix} />

                  <div className="text-glass font-bold text-ink-900 dark:text-white mt-3 mb-1.5">
                    {stat.label}
                  </div>
                  <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
