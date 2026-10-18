import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { firebaseConfigFromEnv, isFirebaseConfigured } from "../../config/firebase.mjs";

// Configuration publique. Les identifiants privés d'envoi restent sur l'API.
const firebaseConfig = firebaseConfigFromEnv(import.meta.env);

export async function getFirebaseMessaging() {
  if (!isFirebaseConfigured(firebaseConfig)) throw new Error("push/not-configured");
  if (!(await isSupported())) throw new Error("push/unsupported");
  return getMessaging(getApps().length ? getApp() : initializeApp(firebaseConfig));
}
