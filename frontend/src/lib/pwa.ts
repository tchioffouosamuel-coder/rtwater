import { useEffect, useState } from "react";

/**
 * Détection du mode « application installée ».
 *
 * L'application installée (icône sur l'écran d'accueil / le bureau) est réservée
 * au back-office : la boutique publique reste accessible depuis le navigateur.
 * Voir la redirection dans App.tsx.
 */

/** Modes d'affichage qui signalent un lancement depuis l'icône installée. */
const INSTALLED_DISPLAY_MODES = [
  "standalone",
  "fullscreen",
  "minimal-ui",
  "window-controls-overlay",
] as const;

export function isInstalledApp(): boolean {
  if (typeof window === "undefined") return false;

  // iOS Safari n'expose pas display-mode : il pose navigator.standalone
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone) {
    return true;
  }

  // Android TWA : la page est ouverte par l'application native
  if (typeof document !== "undefined" && document.referrer.startsWith("android-app://")) {
    return true;
  }

  return INSTALLED_DISPLAY_MODES.some(
    (mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches,
  );
}

/** Même détection, réévaluée si l'utilisateur bascule entre onglet et fenêtre installée. */
export function useIsInstalledApp(): boolean {
  const [installed, setInstalled] = useState(isInstalledApp);

  useEffect(() => {
    if (!window.matchMedia) return;

    const queries = INSTALLED_DISPLAY_MODES.map((mode) =>
      window.matchMedia(`(display-mode: ${mode})`),
    );
    const update = () => setInstalled(isInstalledApp());

    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);

  return installed;
}
