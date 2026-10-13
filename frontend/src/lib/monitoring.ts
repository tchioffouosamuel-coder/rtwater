import { API_BASE } from "../services/api";

/**
 * Mesure d'audience et remontée d'erreurs, sans dépendance.
 *
 * Audience : activée seulement si une variable d'environnement est définie au build.
 *   VITE_PLAUSIBLE_DOMAIN=rtwater.cm   → Plausible (sans cookie, pas de bandeau RGPD)
 *   VITE_GA4_ID=G-XXXXXXX              → Google Analytics 4
 * Erreurs : envoyées à l'API (POST /client-errors), lisibles dans storage/logs/client-*.log.
 */

const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown>; u?: string }) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function injectScript(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement("script");
  s.async = true;
  s.defer = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

/** Clé de stockage du choix du visiteur : « granted » ou « denied ». */
export const CONSENT_KEY = "rtwater_analytics_consent";

export type ConsentState = "granted" | "denied" | "unknown";

export function getConsent(): ConsentState {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : "unknown";
  } catch {
    // Stockage bloqué (navigation privée) : on considère qu'il n'y a pas d'accord
    return "unknown";
  }
}

export function setConsent(state: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, state);
  } catch { /* stockage bloqué : le choix ne survivra pas au rechargement */ }

  if (state === "granted") initAnalytics();
}

/** Une mesure d'audience sans cookie ne requiert pas de consentement préalable. */
export function analyticsNeedsConsent(): boolean {
  return !!GA4_ID;
}

let analyticsStarted = false;

export function initAnalytics() {
  if (!import.meta.env.PROD || analyticsStarted) return;

  // GA4 pose des cookies : il attend l'accord explicite du visiteur.
  // Plausible n'en pose aucun et démarre donc sans attendre.
  if (GA4_ID && getConsent() !== "granted") {
    if (!PLAUSIBLE_DOMAIN) return;
  }

  analyticsStarted = true;

  if (PLAUSIBLE_DOMAIN) {
    // Les pages vues sont envoyées manuellement à chaque changement de route
    injectScript("https://plausible.io/js/script.manual.js", { "data-domain": PLAUSIBLE_DOMAIN });
    window.plausible = window.plausible || function (...args: unknown[]) {
      ((window.plausible as any).q = (window.plausible as any).q || []).push(args);
    };
  }

  if (GA4_ID && getConsent() === "granted") {
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer!.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID, { send_page_view: false });
  }
}

/** Page vue : appelée à chaque navigation (les pages admin ne sont pas suivies). */
export function trackPageview(path: string) {
  if (path.startsWith("/admin")) return;
  window.plausible?.("pageview", { u: window.location.origin + path });
  window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href });
}

/** Événements métier : ajout au panier, commande, devis… */
export function trackEvent(name: string, props: Record<string, string | number | boolean> = {}) {
  window.plausible?.(name, { props });
  window.gtag?.("event", name, props);
}

// ── Erreurs ────────────────────────────────────────────────────────────────
const sent = new Set<string>();
const MAX_REPORTS_PER_PAGE_LOAD = 10;

export function reportError(
  error: unknown,
  source: "onerror" | "unhandledrejection" | "boundary" | "manual" = "manual",
  component?: string,
) {
  const err = error instanceof Error ? error : new Error(String((error as any)?.message ?? error));
  const key = err.message + (err.stack?.split("\n")[1] ?? "");
  if (sent.has(key) || sent.size >= MAX_REPORTS_PER_PAGE_LOAD) return;
  sent.add(key);

  if (!import.meta.env.PROD) return; // en développement, la console suffit

  const body = JSON.stringify({
    message: err.message.slice(0, 1000),
    stack: err.stack?.slice(0, 4000),
    url: window.location.pathname + window.location.search,
    source,
    component: component?.slice(0, 2000),
  });

  try {
    // keepalive : la requête part même si l'utilisateur quitte la page
    fetch(`${API_BASE}/client-errors`, {
      method: "POST", body, keepalive: true,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    }).catch(() => {});
  } catch {
    // la remontée d'erreur ne doit jamais elle-même casser la page
  }
}

export function initErrorReporting() {
  window.addEventListener("error", (e) => {
    // Ignore les erreurs de chargement de ressources tierces sans détail exploitable
    if (!e.error && /Script error/i.test(e.message)) return;
    reportError(e.error ?? e.message, "onerror");
  });
  window.addEventListener("unhandledrejection", (e) => {
    // Les erreurs d'API sont déjà affichées à l'utilisateur : seules les vraies exceptions remontent
    if ((e.reason as any)?.status) return;
    reportError(e.reason, "unhandledrejection");
  });
}
