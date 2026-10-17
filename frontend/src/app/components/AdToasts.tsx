import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import {
  loadAnnouncements,
  trackAnnouncement,
  type Announcement,
  type AnnouncementVariant,
} from "../../services/announcements";

/**
 * Pubs flottantes de la page d'accueil.
 *
 * Elles arrivent une par une, décalées par `delay_seconds`, et jamais deux à
 * l'écran : une pile de pubs se lit comme une fenêtre surgissante et se ferme
 * sans être lue. `frequency` décide si un visiteur la revoit — une fois pour
 * toutes, une fois par visite, ou à chaque passage.
 */

const SEEN_PREFIX = "rtw.ad.seen.";
/** Décalage entre deux pubs, pour qu'elles ne se chassent pas l'une l'autre. */
const STAGGER_MS = 2500;

const VARIANTS: Record<AnnouncementVariant, { accent: string; halo: string; chip: string }> = {
  brand:   { accent: "from-brand-600 to-aqua-500",     halo: "bg-brand-400/35",   chip: "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100" },
  aqua:    { accent: "from-aqua-500 to-brand-500",     halo: "bg-aqua-300/35",    chip: "bg-aqua-50 text-aqua-700 dark:bg-aqua-500/20 dark:text-aqua-100" },
  amber:   { accent: "from-amber-500 to-orange-400",   halo: "bg-amber-300/35",   chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100" },
  emerald: { accent: "from-emerald-600 to-teal-400",   halo: "bg-emerald-300/35", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100" },
  rose:    { accent: "from-rose-600 to-fuchsia-400",   halo: "bg-rose-300/35",    chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100" },
};

/** Le stockage dépend de la fréquence : « once » survit à la fermeture du navigateur. */
function storageFor(frequency: Announcement["frequency"]): Storage | null {
  try {
    if (frequency === "once") return window.localStorage;
    if (frequency === "session") return window.sessionStorage;
  } catch {
    // Stockage bloqué : la pub repassera, ce qui vaut mieux que de ne jamais s'afficher
  }
  return null;
}

function alreadySeen(ad: Announcement): boolean {
  return storageFor(ad.frequency)?.getItem(SEEN_PREFIX + ad.id) === "1";
}

function markSeen(ad: Announcement): void {
  try {
    storageFor(ad.frequency)?.setItem(SEEN_PREFIX + ad.id, "1");
  } catch {
    // ignoré volontairement
  }
}

export function AdToasts() {
  const { tx } = useI18n();
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState<Announcement | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    let alive = true;
    loadAnnouncements()
      .then(({ toasts }) => {
        if (alive) setQueue(toasts.filter((ad) => !alreadySeen(ad)));
      })
      .catch(() => {
        // Pas de pub : la page d'accueil fonctionne telle quelle
      });
    return () => {
      alive = false;
      clearTimers();
    };
  }, []);

  // Programme la file : chaque pub attend son délai, puis celui des précédentes
  useEffect(() => {
    if (!queue.length) return;
    clearTimers();

    let offset = 0;
    queue.forEach((ad) => {
      offset += ad.delay_seconds * 1000;
      const id = window.setTimeout(() => {
        setCurrent(ad);
        markSeen(ad);
        trackAnnouncement(ad.id, "view");
      }, offset);
      timers.current.push(id);
      // La suivante attend la fin de celle-ci plutôt que de la recouvrir
      offset += (ad.duration_seconds || 10) * 1000 + STAGGER_MS;
    });

    return clearTimers;
  }, [queue]);

  const close = useCallback(() => setCurrent(null), []);

  // Fermeture automatique : `duration_seconds` à 0 veut dire « reste affichée »
  useEffect(() => {
    if (!current || current.duration_seconds === 0) return;
    const id = window.setTimeout(close, current.duration_seconds * 1000);
    return () => window.clearTimeout(id);
  }, [current, close]);

  const tone = VARIANTS[current?.variant ?? "brand"];

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-24 left-4 z-40 w-[min(22rem,calc(100vw-2rem))] sm:bottom-6"
    >
      <AnimatePresence>
        {current && (
          <motion.aside
            key={current.id}
            initial={{ opacity: 0, y: 32, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1.2, 0.36, 1] }}
            className="glass-card lift pointer-events-auto relative overflow-hidden rounded-2xl"
          >
            {/* Halo coloré derrière le verre */}
            <div aria-hidden className={`aurora-blob absolute -left-10 -top-12 h-32 w-32 rounded-full ${tone.halo}`} />
            {/* Filet de couleur : identifie la campagne d'un coup d'œil */}
            <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.accent}`} />

            <div className="relative flex gap-3 p-4">
              {current.image_url ? (
                <img
                  src={current.image_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/60"
                />
              ) : (
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${tone.accent} animate-float`}
                >
                  {current.icon ? <span aria-hidden className="text-lg">{current.icon}</span> : <Sparkles className="h-5 w-5" />}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.chip}`}>
                  {tx("Offre", "Offer")}
                </span>
                <p className="text-glass mt-1 text-sm font-semibold text-ink-900 dark:text-white">
                  {current.title}
                </p>
                {current.message && (
                  <p className="mt-1 text-xs leading-relaxed text-ink-600 dark:text-ink-300">{current.message}</p>
                )}
                {current.link_url && (
                  <a
                    href={current.link_url}
                    onClick={() => trackAnnouncement(current.id, "click")}
                    className="group mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-aqua-300"
                  >
                    {current.link_label || tx("En profiter", "Grab it")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </a>
                )}
              </div>

              <button
                onClick={close}
                aria-label={tx("Fermer la pub", "Dismiss ad")}
                className="h-6 w-6 shrink-0 rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="mx-auto h-4 w-4" />
              </button>
            </div>

            {/* Compte à rebours visible : le visiteur sait que ça va partir seul */}
            {current.duration_seconds > 0 && (
              <motion.div
                key={`timer-${current.id}`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: current.duration_seconds, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r ${tone.accent}`}
              />
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
