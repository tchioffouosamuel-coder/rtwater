import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Megaphone, Pause, Play, X } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import {
  loadAnnouncements,
  trackAnnouncement,
  type Announcement,
  type AnnouncementPosition,
  type AnnouncementVariant,
} from "../../services/announcements";

/**
 * Bandeaux d'annonces, collés en haut ou en bas de la fenêtre.
 *
 * Fixés plutôt qu'insérés dans la page : un bandeau posé entre deux sections
 * repousse le contenu, se lit comme une section de plus et disparaît dès le
 * premier défilement. Celui du haut se range sous l'en-tête collant, celui du
 * bas au ras de la fenêtre.
 *
 * Les annonces d'un même bord défilent une à une : un bandeau qui grandit avec
 * le nombre d'annonces finit par manger l'écran. Une fermeture est retenue par
 * identifiant, donc une nouvelle annonce réapparaît même si la précédente a
 * été écartée.
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

/**
 * Hauteur de l'en-tête collant : le bandeau du haut se glisse dessous plutôt
 * que de le recouvrir. L'en-tête se compacte au défilement, d'où une mesure
 * continue et non une constante.
 */
function useHeaderHeight(active: boolean): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!active) return;
    const header = document.querySelector("header");
    if (!header) return;

    const measure = () => setHeight(header.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(header);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [active]);

  return height;
}

export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);

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

  const dismiss = useCallback((announcement: Announcement) => {
    rememberDismissal(announcement.id);
    setItems((list) => list.filter((a) => a.id !== announcement.id));
  }, []);

  const top = useMemo(() => items.filter((a) => a.position !== "bottom"), [items]);
  const bottom = useMemo(() => items.filter((a) => a.position === "bottom"), [items]);

  return (
    <>
      <BannerRail position="top" items={top} onDismiss={dismiss} />
      <BannerRail position="bottom" items={bottom} onDismiss={dismiss} />
    </>
  );
}

function BannerRail({
  position,
  items,
  onDismiss,
}: {
  position: AnnouncementPosition;
  items: Announcement[];
  onDismiss: (announcement: Announcement) => void;
}) {
  const { tx } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const headerHeight = useHeaderHeight(position === "top" && items.length > 0);

  const safeIndex = items.length ? index % items.length : 0;
  const current = items.length ? items[safeIndex] : undefined;

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

  const tone = useMemo(() => VARIANTS[current?.variant ?? "brand"], [current?.variant]);

  if (!current) return null;

  const atTop = position === "top";

  return (
    <section
      aria-label={tx("Annonces", "Announcements")}
      style={atTop ? { top: headerHeight } : undefined}
      className={`pointer-events-none fixed inset-x-0 z-40 px-3 sm:px-4 ${
        atTop
          ? "pt-2 sm:pt-3"
          // Gouttière à droite : le bouton WhatsApp et le retour en haut vivent
          // dans ce coin et doivent rester cliquables sous le bandeau.
          : "bottom-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pr-20 sm:pb-3 sm:pr-24"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: atTop ? -24 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className={`pointer-events-auto relative mx-auto max-w-7xl overflow-hidden rounded-2xl shadow-xl shadow-brand-950/25 ring-1 ${tone.ring}`}
      >
        {/* Fond en verre teinté : le dégradé passe derrière le flou */}
        <div className={`absolute inset-0 bg-gradient-to-r ${tone.gradient}`} />
        <div className="glass-dark absolute inset-0" />
        <div aria-hidden className={`aurora-blob absolute -right-20 -top-24 h-56 w-56 rounded-full ${tone.glow}`} />

        <div className="relative flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-5 sm:p-4">
          {/* Pictogramme : l'emoji choisi au backoffice, sinon le mégaphone */}
          <div className="glass-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-white animate-float">
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
                      aria-current={i === safeIndex}
                      className={`h-1.5 rounded-full transition-all ${
                        i === safeIndex ? "w-6 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
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
                onClick={() => onDismiss(current)}
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
            key={`progress-${current.id}-${safeIndex}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: ROTATION_MS / 1000, ease: "linear" }}
            className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-white/70"
          />
        )}
      </motion.div>
    </section>
  );
}
