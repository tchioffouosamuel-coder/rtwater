import api from "./api";
import { ensureServiceWorker } from "../lib/offline";
import type { MessagePayload } from "firebase/messaging";

const ENABLED = "rtwater.push.enabled";
const INSTALLATION = "rtwater.push.installation";
export const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY ?? "").trim();

export function supportsPush() {
  return window.isSecureContext && "Notification" in window && "PushManager" in window && "serviceWorker" in navigator;
}

export function isPushEnabled() {
  return localStorage.getItem(ENABLED) === "true";
}

function installationKey() {
  let key = localStorage.getItem(INSTALLATION);
  if (!key) {
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(INSTALLATION, key);
  }
  return key;
}

export function notificationUrl(value?: string) {
  try {
    const url = new URL(value || "/", window.location.origin);
    if (url.origin === window.location.origin && /^https?:$/.test(url.protocol)) return url.href;
  } catch { /* lien invalide : retour à l'accueil */ }
  return window.location.origin + "/";
}

async function messaging() {
  const [{ getFirebaseMessaging }, sdk] = await Promise.all([
    import("../lib/firebase"), import("firebase/messaging"),
  ]);
  return { client: await getFirebaseMessaging(), sdk };
}

/** Après accord du navigateur ; ne déclenche jamais une demande de permission. */
export async function syncPushSubscription() {
  if (!vapidKey || !supportsPush()) throw new Error("push/unsupported");
  if (Notification.permission !== "granted") throw new Error("push/permission");
  const { client, sdk } = await messaging();
  const serviceWorkerRegistration = await ensureServiceWorker();
  const token = await sdk.getToken(client, { vapidKey, serviceWorkerRegistration });
  if (!token) throw new Error("push/no-token");
  await api.request("/push/subscriptions", {
    method: "POST", silent: true, body: { installation_key: installationKey(), token },
  });
  localStorage.setItem(ENABLED, "true");
}

export async function disablePush() {
  const key = localStorage.getItem(INSTALLATION);
  if (key) await api.request("/push/subscriptions", {
    method: "DELETE", silent: true, body: { installation_key: key },
  });
  const { client, sdk } = await messaging();
  await sdk.deleteToken(client);
  localStorage.removeItem(ENABLED);
}

export async function onPushMessage(callback: (payload: MessagePayload) => void) {
  const { client, sdk } = await messaging();
  return sdk.onMessage(client, callback);
}
