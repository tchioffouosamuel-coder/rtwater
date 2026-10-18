import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { firebaseConfigFromEnv, firebaseWorkerConfigPlugin, firebaseWorkerConfigSource } from "../config/firebase.mjs";

const worker = readFileSync(new URL("../public/firebase-messaging-sw.js", import.meta.url), "utf8");
const testEnv = {
  VITE_FIREBASE_API_KEY: 'test-browser-key',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '12345',
  VITE_FIREBASE_APP_ID: 'test-app',
};

function harness(windows = []) {
  const notifications = [];
  const opened = [];
  const listeners = {};
  let background;
  const sandbox = {
    URL, importScripts(url) {
      if (url === '/firebase-config.js') vm.runInNewContext(firebaseWorkerConfigSource(firebaseConfigFromEnv(testEnv)), sandbox);
    },
    self: {
      location: { origin: "https://rt-watersolution.com" },
      addEventListener(name, handler) { listeners[name] = handler; },
      registration: { showNotification: async (...args) => notifications.push(args) },
      clients: { matchAll: async () => windows, openWindow: async url => opened.push(url) },
    },
    firebase: { initializeApp() {}, messaging: () => ({ onBackgroundMessage(fn) { background = fn; } }) },
  };
  vm.runInNewContext(worker, sandbox);
  return {
    notifications, opened, background: payload => background(payload),
    click: async data => {
      let work;
      let closed = false;
      let stopped = false;
      listeners.notificationclick({
        notification: { data, close() { closed = true; } },
        stopImmediatePropagation() { stopped = true; }, waitUntil(promise) { work = promise; },
      });
      await work;
      assert.ok(closed && stopped);
    },
  };
}

test("data-only background messages display exactly one notification", async () => {
  const h = harness();
  await h.background({ messageId: "message-1", data: { title: "Arrivage", body: "Voir les produits", url: "/shop" } });
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0][0], "Arrivage");
  assert.equal(h.notifications[0][1].data.url, "/shop");
});

test("the build supplies the worker with the same Firebase configuration as the client", () => {
  const plugin = firebaseWorkerConfigPlugin(testEnv);
  let asset;
  plugin.generateBundle.call({ emitFile(value) { asset = value; } });
  assert.equal(asset.fileName, 'firebase-config.js');
  const context = { self: {} };
  vm.runInNewContext(asset.source, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.self.__RTW_FIREBASE_CONFIG__)), firebaseConfigFromEnv(testEnv));
});

test("a configured VAPID key without Firebase credentials fails the build", () => {
  assert.throws(() => firebaseWorkerConfigPlugin({ VITE_FIREBASE_VAPID_KEY: 'test-vapid-key' }), /VITE_FIREBASE_API_KEY/);
});

test("worker configuration serializes quoted values as data", () => {
  const value = 'test-key\"; throw new Error("injected"); // <script>';
  const context = { self: {} };
  vm.runInNewContext(firebaseWorkerConfigSource({ apiKey: value }), context);
  assert.equal(context.self.__RTW_FIREBASE_CONFIG__.apiKey, value);
});

test("notification payloads are not displayed a second time", async () => {
  const h = harness();
  await h.background({ notification: { title: "Firebase displays this" } });
  assert.equal(h.notifications.length, 0);
});

test("click focuses an existing window and navigates to the message link", async () => {
  const navigated = [];
  let focused = false;
  const h = harness([{ url: "https://rt-watersolution.com/", navigate: async url => navigated.push(url), focus: async () => { focused = true; } }]);
  await h.click({ FCM_MSG: { fcmOptions: { link: "https://rt-watersolution.com/shop" } } });
  assert.deepEqual(navigated, ["https://rt-watersolution.com/shop"]);
  assert.ok(focused);
  assert.equal(h.opened.length, 0);
});

test("external, script and malformed links fall back to the site's home", async () => {
  for (const url of ["https://example.com/phishing", "//example.com", "javascript:alert(1)", "http://["]) {
    const h = harness();
    await h.click({ url });
    assert.deepEqual(h.opened, ["https://rt-watersolution.com/"]);
  }
});

test("a new window opens when no existing window is available", async () => {
  const h = harness();
  await h.click({ url: "/shop?sort=newest" });
  assert.deepEqual(h.opened, ["https://rt-watersolution.com/shop?sort=newest"]);
});

test("offline worker remains installed when Firebase scripts are unavailable", () => {
  const registered = [];
  const offline = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  vm.runInNewContext(offline, {
    self: { addEventListener: name => registered.push(name) },
    importScripts() { throw new Error("offline"); }, console: { warn() {} },
  });
  assert.deepEqual(registered, ["install", "activate", "fetch"]);
});
