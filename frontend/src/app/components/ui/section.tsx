import type { ReactNode } from "react";
import { Reveal } from "../Reveal";

type Tone = "brand" | "aqua" | "neutral";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200",
  aqua: "bg-aqua-50 text-aqua-700 dark:bg-aqua-500/15 dark:text-aqua-200",
  neutral: "bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-200",
};

/** Pastille de rubrique placée au-dessus d'un titre de section. */
export function SectionBadge({
  children,
  tone = "brand",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * En-tête de section : pastille, titre et accroche.
 * `align="center"` pour les sections pleine largeur, `align="left"` quand
 * l'en-tête partage sa ligne avec une illustration.
 */
export function SectionHeading({
  badge,
  title,
  subtitle,
  tone = "brand",
  align = "center",
  className = "",
}: {
  badge?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: Tone;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <Reveal className={className}>
      <div className={centered ? "text-center max-w-3xl mx-auto" : ""}>
        {badge ? (
          <SectionBadge tone={tone} className="mb-3">
            {badge}
          </SectionBadge>
        ) : null}
        <h2 className="text-3xl md:text-4xl font-bold text-ink-900 dark:text-white tracking-tight mb-3">
          {title}
        </h2>
        {subtitle ? (
          <p
            className={`text-ink-500 dark:text-ink-300 text-base leading-relaxed ${
              centered ? "mx-auto" : ""
            }`}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}

/**
 * Carte de contenu standard : coins arrondis, bordure discrète,
 * et léger soulèvement au survol lorsque `interactive` est actif.
 */
export function SurfaceCard({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`h-full rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-white/10 ${
        interactive
          ? "transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-400/40 hover:shadow-xl hover:shadow-brand-500/5"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Tuile d'icône en dégradé, reprise des cartes « fonctionnalités » de la vitrine. */
export function IconTile({
  children,
  gradient = "from-brand-500 to-brand-600",
  className = "",
}: {
  children: ReactNode;
  gradient?: string;
  className?: string;
}) {
  return (
    <div
      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}
