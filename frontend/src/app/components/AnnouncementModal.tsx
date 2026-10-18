import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Megaphone, X } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import {
  alreadySeen,
  loadAnnouncements,
  markSeen,
  trackAnnouncement,
  type Announcement,
  type AnnouncementVariant,
} from "../../services/announcements";

/**
 * Annonces en modale : l'emplacement le plus insistant des trois, réservé à ce
 * qui doit être lu avant de continuer.
 *
 * Une seule à la fois, et jamais d'enchaînement : deux modales d'affilée se
 * ferment sans être lues. Les suivantes attendent la visite d'après.
 * `delay_seconds` laisse au visiteur le temps d'arriver sur la page avant de
 * l'interrompre, `frequency` décide s'il la revoit.
 */

const VARIANTS: Record<AnnouncementVariant, { accent: string; halo: string; chip: string }> = {
  brand:   { accent: "from-brand-600 to-aqua-500",   halo: "bg-brand-400/35",   chip: "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100" },
  aqua:    { accent: "from-aqua-500 to-brand-500",   halo: "bg-aqua-300/35",    chip: "bg-aqua-50 text-aqua-700 dark:bg-aqua-500/20 dark:text-aqua-100" },
  amber:   { accent: "from-amber-500 to-orange-400", halo: "bg-amber-300/35",   chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100" },
  emerald: { accent: "from-emerald-600 to-teal-400", halo: "bg-emerald-300/35", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100" },
  rose:    { accent: "from-rose-600 to-fuchsia-400", halo: "bg-rose-300/35",    chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100" },
};

export function AnnouncementModal() {
  const { tx } = useI18n();
  const [current, setCurrent] = useState<Announcement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // La première modale diffusable, après son délai d'apparition
  useEffect(() => {
    let alive = true;
    let timer = 0;

    loadAnnouncements()
      .then(({ modals }) => {
        const next = modals.find((m) => !alreadySeen(m));
        if (!alive || !next) return;

        timer = window.setTimeout(() => {
          setCurrent(next);
          markSeen(next);
          trackAnnouncement(next.id, "view");
        }, next.delay_seconds * 1000);
      })
      .catch(() => {
        // Pas de modale : la page d'accueil fonctionne telle quelle
      });

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  const close = useCallback(() => setCurrent(null), []);

  // Fermeture automatique : `duration_seconds` à 0 veut dire « reste affichée »
  useEffect(() => {
    if (!current || current.duration_seconds === 0) return;
    const timer = window.setTimeout(close, current.duration_seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [current, close]);

  // Échap ferme, et le focus part sur la croix : une modale qui ouvre sans
  // porte de sortie au clavier bloque la navigation.
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    closeButton.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [current, close]);

  // Le fond ne défile pas derrière la modale
  useEffect(() => {
    if (!current) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [current]);

  const tone = VARIANTS[current?.variant ?? "brand"];

  return (
    <AnimatePresence>
      {current && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            aria-hidden
            className="fixed inset-0 z-[60] bg-ink-950/60 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-[61] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-ink-800"
          >
            {/* Filet de couleur : identifie la campagne d'un coup d'œil */}
            <div aria-hidden className={`h-1.5 w-full bg-gradient-to-r ${tone.accent}`} />

            <button
              ref={closeButton}
              onClick={close}
              aria-label={tx("Fermer l'annonce", "Dismiss announcement")}
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {current.image_url && (
              <img
                src={current.image_url}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-40 w-full object-cover sm:h-48"
              />
            )}

            <div className="relative p-6">
              <div aria-hidden className={`aurora-blob absolute -left-12 -top-16 h-40 w-40 rounded-full ${tone.halo}`} />

              <div className="relative">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${tone.accent} animate-float`}
                >
                  {current.icon ? <span aria-hidden className="text-xl">{current.icon}</span> : <Megaphone className="h-6 w-6" />}
                </div>

                <span className={`mt-4 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.chip}`}>
                  {tx("Annonce", "Announcement")}
                </span>

                <h2 className="mt-2 text-lg font-bold text-ink-900 dark:text-white sm:text-xl">{current.title}</h2>
                {current.message && (
                  <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{current.message}</p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {current.link_url && (
                    <a
                      href={current.link_url}
                      onClick={() => {
                        trackAnnouncement(current.id, "click");
                        close();
                      }}
                      className={`sheen group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-950/20 transition-transform hover:-translate-y-0.5 ${tone.accent}`}
                    >
                      {current.link_label || tx("Découvrir", "Discover")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  )}
                  <button
                    onClick={close}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {tx("Plus tard", "Later")}
                  </button>
                </div>
              </div>
            </div>

            {/* Compte à rebours visible : le visiteur sait que ça va partir seul */}
            {current.duration_seconds > 0 && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: current.duration_seconds, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r ${tone.accent}`}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
