import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

// Configuration publique. Les identifiants privés d'envoi restent sur l'API.
const firebaseConfig = {
  apiKey: "AIzaSyAN2bDXjwiMUbpSxeZ7o_AyXD85mI9kJGo",
  authDomain: "rtwater-c3d5e.firebaseapp.com",
  projectId: "rtwater-c3d5e",
  storageBucket: "rtwater-c3d5e.firebasestorage.app",
  messagingSenderId: "459544241404",
  appId: "1:459544241404:web:d71af2b0ce32ff2f8d2379",
};

export async function getFirebaseMessaging() {
  if (!(await isSupported())) throw new Error("push/unsupported");
  return getMessaging(getApps().length ? getApp() : initializeApp(firebaseConfig));
}
