import { useEffect, useState } from "react";

let serviceWorker: Promise<ServiceWorkerRegistration> | undefined;

/** Inscription partagée par le mode hors ligne et FCM. */
export function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!serviceWorker) {
    serviceWorker = navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(registration => registration.active ? registration : navigator.serviceWorker.ready)
      .catch(error => { serviceWorker = undefined; throw error; });
  }
  return serviceWorker;
}

/** Active le mode hors ligne (service worker), en production uniquement. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    ensureServiceWorker().catch(() => {
      // navigateur ou hébergement sans support : le site fonctionne normalement
    });
  });
}

/** true quand l'appareil a perdu la connexion. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}
