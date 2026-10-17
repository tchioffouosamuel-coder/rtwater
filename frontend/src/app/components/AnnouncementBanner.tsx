import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Megaphone, Pause, Play, X } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import {
  loadAnnouncements,
  trackAnnouncement,
  type Announcement,
  type AnnouncementVariant,
} from "../../services/announcements";

/**
 * Bandeau d'annonces de l'accueil.
 *
 * Les annonces défilent une à une plutôt que de s'empiler : un bandeau qui
 * grandit avec le nombre d'annonces repousse la page et finit par être ignoré.
 * Une fermeture est retenue par identifiant, donc une nouvelle annonce
 * réapparaît même si la précédente a été écartée.
 */

const DISMISS_PREFIX = "rtw.banner.dismissed.";
const ROTATION_MS = 7000;

const VARIANTS: Record<AnnouncementVariant, { gradient: string; ring: string; glow: string }> = {
  brand:   { gradient: "from-brand-600/90 via-brand-500/80 to-aqua-500/80",    ring: "ring-brand-300/40",   glow: "bg-brand-400/40" },
  aqua:    { gradient: "from-aqua-500/90 via-aqua-400/80 to-brand-500/80",     ring: "ring-aqua-300/40",    glow: "bg-aqua-300/40" },
  amber:   { gradient: "from-amber-500/90 via-amber-400/80 to-orange-400/80",  ring: "ring-amber-200/40",   glow: "bg-amber-300/40" },
  emerald: { gradient: "from-emerald-600/90 via-emerald-500/80 to-teal-400/80", ring: "ring-emerald-200/40", glow: "bg-emerald-300/40" },
  rose:    { gradient: "from-rose-600/90 via-rose-500/80 to-fuchsia-400/80",   ring: "ring-rose-200/40",    glow: "bg-rose-300/40" },
};

function isDismissed(id: number): boolean {
  try {
    return localStorage.getItem(DISMISS_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

function rememberDismissal(id: number): void {
  try {
    localStorage.setItem(DISMISS_PREFIX + id, "1");
  } catch {
    // Stockage bloqué : l'annonce reviendra au prochain chargement, sans casse
  }
}

export function AnnouncementBanner() {
  const { tx } = useI18n();
  const [items, setItems] = useState<Announcement[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    loadAnnouncements()
      .then(({ banners }) => {
        if (alive) setItems(banners.filter((b) => !b.dismissible || !isDismissed(b.id)));
      })
      .catch(() => {
        // Un bandeau absent n'est pas une panne : la page reste complète
      });
    return () => {
      alive = false;
    };
  }, []);

  const current = items.length ? items[index % items.length] : undefined;

  // Rotation automatique, suspendue au survol et quand il n'y a qu'une annonce
  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATION_MS);
    return () => clearInterval(timer);
  }, [paused, items.length]);

  // Un affichage compté par annonce réellement vue
  const currentId = current?.id;
  useEffect(() => {
    if (currentId) trackAnnouncement(currentId, "view");
  }, [currentId]);

  const dismiss = useCallback((announcement: Announcement) => {
    rememberDismissal(announcement.id);
    setItems((list) => {
      const next = list.filter((a) => a.id !== announcement.id);
      setIndex((i) => (next.length ? i % next.length : 0));
      return next;
    });
  }, []);

  const tone = useMemo(() => VARIANTS[current?.variant ?? "brand"], [current?.variant]);

  if (!current) return null;

  return (
    <section
      aria-label={tx("Annonces", "Announcements")}
      className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 sm:-mt-14 md:px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`relative overflow-hidden rounded-2xl ring-1 ${tone.ring} animate-banner-in`}>
        {/* Fond en verre teinté : le dégradé passe derrière le flou */}
        <div className={`absolute inset-0 bg-gradient-to-r ${tone.gradient}`} />
        <div className="glass-dark absolute inset-0" />
        <div aria-hidden className={`aurora-blob absolute -right-20 -top-24 h-56 w-56 rounded-full ${tone.glow}`} />

        <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
          {/* Pictogramme : l'emoji choisi au backoffice, sinon le mégaphone */}
          <div className="glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-white animate-float">
            {current.icon ? <span aria-hidden>{current.icon}</span> : <Megaphone className="h-5 w-5" />}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0 flex-1"
            >
              <p className="text-glass-dark text-sm font-semibold text-white sm:text-base">{current.title}</p>
              {current.message && (
                <p className="mt-0.5 text-xs leading-relaxed text-white/85 sm:text-sm">{current.message}</p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2">
            {current.link_url && (
              <a
                href={current.link_url}
                onClick={() => trackAnnouncement(current.id, "click")}
                className="sheen group inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-4 py-2 text-xs font-semibold text-brand-700 shadow-lg shadow-brand-950/20 transition-transform hover:-translate-y-0.5 sm:text-sm"
              >
                {current.link_label || tx("Découvrir", "Discover")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            )}

            {items.length > 1 && (
              <>
                {/* Puces : on voit tout de suite combien d'annonces tournent */}
                <div className="hidden items-center gap-1.5 px-1 sm:flex">
                  {items.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => setIndex(i)}
                      aria-label={tx(`Annonce ${i + 1}`, `Announcement ${i + 1}`)}
                      aria-current={i === index}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? "w-6 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setPaused((p) => !p)}
                  aria-label={
                    paused
                      ? tx("Reprendre le défilement", "Resume rotation")
                      : tx("Suspendre le défilement", "Pause rotation")
                  }
                  className="hidden rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white sm:block"
                >
                  {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                </button>
              </>
            )}

            {current.dismissible && (
              <button
                onClick={() => dismiss(current)}
                aria-label={tx("Fermer l'annonce", "Dismiss announcement")}
                className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Jauge : rend la rotation prévisible plutôt que surprenante */}
        {items.length > 1 && !paused && (
          <motion.div
            key={`progress-${current.id}-${index}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: ROTATION_MS / 1000, ease: "linear" }}
            className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-white/70"
          />
        )}
      </div>
    </section>
  );
}
