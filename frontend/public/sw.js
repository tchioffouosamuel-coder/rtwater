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
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
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

async function networkFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      if (max) trim(cacheName, max);
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") {
        cache.put(request, response.clone());
        trim(cacheName, max);
      }
      return response;
    })
    .catch(() => cached);
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
        .then((response) => {
          // clone() doit etre appele tout de suite : des que la reponse part vers
          // le navigateur son corps est consomme et la copie n'est plus possible.
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL).then((c) => c.put("/", copy));
          }
          return response;
        })
        .catch(async () => (await caches.match("/")) || caches.match("/offline.html"))
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
    event.respondWith(staleWhileRevalidate(request, IMAGES, MAX_IMAGES));
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
  console.warn("Firebase Messaging unavailable; offline mode remains active.");
}
