/*
 * Service worker RT Water Solution : mode hors ligne léger.
 *
 * - Pages : réseau d'abord, copie locale si la connexion tombe.
 * - Fichiers du site (JS/CSS versionnés) : cache d'abord.
 * - Images : copie locale immédiate, rafraîchie en arrière-plan.
 * - API publique (catalogue, catégories, pages, blog) : réseau d'abord, copie locale en secours.
 * - Jamais de cache pour les requêtes authentifiées ni pour les commandes, paiements, profil.
 */
const VERSION = "rtwater-v3";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const IMAGES = `${VERSION}-images`;
const API = `${VERSION}-api`;
const MAX_IMAGES = 120;
const MAX_API = 80;

const PRECACHE = ["/", "/offline.html", "/manifest.webmanifest", "/icon-192.png", "/logo-transparent.webp"];
const PUBLIC_API = /\/api\/(products|categories|pages|blog|services)(\/|\?|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then(async (cache) => {
      // Keep a working offline fallback mandatory; a blocked manifest or icon
      // must not prevent the rest of the worker from being installed.
      await cache.add("/offline.html");
      await Promise.allSettled(PRECACHE.filter((url) => url !== "/offline.html").map((url) => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function unavailableResponse(isApi = false) {
  return new Response(isApi
    ? JSON.stringify({ message: "Service indisponible. Vérifiez votre connexion et réessayez." })
    : "Ressource indisponible. Vérifiez votre connexion et réessayez.", {
    status: 503,
    headers: {
      "Content-Type": isApi ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function readCache(request, cacheName) {
  try {
    return await (await caches.open(cacheName)).match(request);
  } catch { /* Cache storage may be unavailable in private browsing. */ }
}

async function storeResponse(request, response, cacheName, max) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    if (max) await trim(cacheName, max);
  } catch { /* A full or unavailable cache must not break a network response. */ }
}

async function networkFirst(request, cacheName, max) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await storeResponse(request, response.clone(), cacheName, max);
    }
    return response;
  } catch {
    return (await readCache(request, cacheName)) || unavailableResponse(true);
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await readCache(request, cacheName);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await storeResponse(request, response.clone(), cacheName);
    return response;
  } catch {
    return unavailableResponse();
  }
}

async function staleWhileRevalidate(request, cacheName, max, event) {
  const cached = await readCache(request, cacheName);
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok || response.type === "opaque") {
        await storeResponse(request, response.clone(), cacheName, max);
      }
      return response;
    })
    .catch(() => cached || unavailableResponse());
  event.waitUntil(network.then(() => {}));
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.headers.has("Authorization")) return; // données personnelles : jamais en cache

  const url = new URL(request.url);

  // Navigation : l'application est une SPA, la page d'accueil sert de coquille
  if (request.mode === "navigate") {
    if (url.pathname.startsWith("/admin")) return;
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          // clone() doit etre appele tout de suite : des que la reponse part vers
          // le navigateur son corps est consomme et la copie n'est plus possible.
          if (response.ok) {
            const copy = response.clone();
            await storeResponse("/", copy, SHELL);
          }
          return response;
        })
        .catch(async () => (await readCache("/", SHELL)) || (await readCache("/offline.html", SHELL)) || unavailableResponse())
    );
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }

  if (url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com") {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(request, IMAGES, MAX_IMAGES, event));
    return;
  }

  if (PUBLIC_API.test(url.pathname + url.search)) {
    event.respondWith(networkFirst(request, API, MAX_API));
  }
});

// A network failure loading Firebase must not disable the offline cache.
try {
  importScripts("/firebase-messaging-sw.js");
} catch (error) {
  console.warn("Firebase Messaging unavailable; offline mode remains active.", error);
}
