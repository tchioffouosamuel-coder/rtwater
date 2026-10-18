/* Imported by /sw.js : FCM shares the existing offline worker and scope. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.stopImmediatePropagation();
  const data = event.notification.data || {};
  const message = data.FCM_MSG || {};
  let target = new URL("/", self.location.origin);
  try {
    const candidate = new URL(data.url || message.data?.url || message.fcmOptions?.link || "/", self.location.origin);
    if (candidate.origin === self.location.origin && /^https?:$/.test(candidate.protocol)) target = candidate;
  } catch { /* invalid link: home */ }
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === target.origin) {
        await client.navigate(target.href);
        return client.focus();
      }
    }
    return self.clients.openWindow(target.href);
  })());
});

importScripts("https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js");

// Keep in sync with src/lib/firebase.ts (public Firebase project configuration).
firebase.initializeApp({
  apiKey: "AIzaSyAN2bDXjwiMUbpSxeZ7o_AyXD85mI9kJGo",
  authDomain: "rtwater-c3d5e.firebaseapp.com",
  projectId: "rtwater-c3d5e",
  storageBucket: "rtwater-c3d5e.firebasestorage.app",
  messagingSenderId: "459544241404",
  appId: "1:459544241404:web:d71af2b0ce32ff2f8d2379",
});

firebase.messaging().onBackgroundMessage((payload) => {
  // Firebase already displays notification payloads. Display only data messages here.
  if (payload.notification) return;
  const data = payload.data || {};
  return self.registration.showNotification(data.title || "RT Water Solution", {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/favicon-48.png",
    tag: data.tag || payload.messageId,
    data: { url: data.url || "/" },
  });
});
