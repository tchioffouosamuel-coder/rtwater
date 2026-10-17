import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { analyticsNeedsConsent, getConsent, setConsent } from "../../lib/monitoring";
import { useI18n } from "../../i18n/I18nContext";

/**
 * Bandeau de consentement à la mesure d'audience.
 *
 * N'apparaît que si une mesure soumise à consentement est réellement configurée
 * (GA4). Avec Plausible, qui ne pose aucun cookie, il n'y a rien à demander et
 * le bandeau reste masqué — un bandeau inutile est une gêne, pas une conformité.
 *
 * Les cookies techniques (panier, session) ne sont pas concernés : ils sont
 * nécessaires au service et ne relèvent pas du consentement.
 */
export function CookieBanner() {
  const { tx } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (analyticsNeedsConsent() && getConsent() === "unknown") {
      // Léger délai : laisse la page s'afficher avant de solliciter le visiteur
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const decide = (state: "granted" | "denied") => {
    setConsent(state);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-banner-title"
          className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-ink-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-ink-700 dark:bg-ink-900/95 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-brand-600">
                <Cookie size={18} />
              </span>

              <div className="min-w-0 flex-1">
                <h2 id="cookie-banner-title" className="text-sm font-semibold text-ink-900 dark:text-white">
                  {tx("Mesure d'audience", "Analytics")}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                  {tx(
                    "Nous souhaitons mesurer la fréquentation du site pour l'améliorer. Les cookies nécessaires au panier et à votre session restent actifs dans tous les cas.",
                    "We would like to measure site traffic in order to improve it. Cookies required for your cart and session stay active either way.",
                  )}{" "}
                  <Link
                    to="/pages/politique-de-confidentialite"
                    className="font-medium text-brand-600 underline hover:no-underline"
                  >
                    {tx("En savoir plus", "Learn more")}
                  </Link>
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => decide("granted")}
                    className="rounded-lg bg-gradient-to-r from-brand-600 to-aqua-500 px-4 py-2 text-xs font-semibold text-white transition hover:shadow-lg"
                  >
                    {tx("Accepter", "Accept")}
                  </button>
                  <button
                    onClick={() => decide("denied")}
                    className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 transition hover:bg-ink-50 dark:border-ink-600 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
                  >
                    {tx("Refuser", "Decline")}
                  </button>
                </div>
              </div>

              {/* Fermer sans choisir vaut refus : rien n'est chargé tant qu'il n'y a pas d'accord */}
              <button
                onClick={() => decide("denied")}
                aria-label={tx("Fermer et refuser", "Close and decline")}
                className="flex-shrink-0 text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-200"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
