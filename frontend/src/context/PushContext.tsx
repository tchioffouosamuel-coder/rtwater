import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useI18n } from "../i18n/I18nContext";
import { disablePush, isPushEnabled, notificationUrl, onPushMessage, supportsPush, syncPushSubscription, vapidKey } from "../services/push";

type PushStatus = "hidden" | "idle" | "enabled" | "blocked" | "busy";
const PushContext = createContext<{ status: PushStatus; toggle: () => Promise<void> }>({ status: "hidden", toggle: async () => {} });

export function PushProvider({ children }: { children: ReactNode }) {
  const { tx } = useI18n();
  const [status, setStatus] = useState<PushStatus>("hidden");
  const busy = useRef(false);

  useEffect(() => {
    if (!vapidKey || !supportsPush()) return;
    let disposed = false;
    const restore = async () => {
      if (busy.current) return;
      if (Notification.permission === "denied") { setStatus("blocked"); return; }
      if (!isPushEnabled() || Notification.permission !== "granted") { setStatus("idle"); return; }
      busy.current = true;
      setStatus("busy");
      try {
        await syncPushSubscription();
        if (!disposed) setStatus("enabled");
      } catch {
        // L'abonnement existant reste désactivable si son renouvellement échoue.
        if (!disposed) setStatus("enabled");
      } finally { busy.current = false; }
    };
    void restore();
    window.addEventListener("online", restore);
    return () => { disposed = true; window.removeEventListener("online", restore); };
  }, []);

  useEffect(() => {
    if (status !== "enabled") return;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    onPushMessage(payload => {
      const title = payload.notification?.title || payload.data?.title || "RT Water Solution";
      const url = notificationUrl(payload.fcmOptions?.link || payload.data?.url);
      toast(title, {
        id: payload.messageId,
        description: payload.notification?.body || payload.data?.body,
        action: { label: tx("Voir", "View"), onClick: () => window.location.assign(url) },
      });
    }).then(stop => { if (disposed) stop(); else unsubscribe = stop; }).catch(() => {});
    return () => { disposed = true; unsubscribe?.(); };
  }, [status, tx]);

  const toggle = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const previous = status;
    setStatus("busy");
    try {
      if (previous === "enabled") {
        await disablePush();
        setStatus("idle");
        toast(tx("Notifications désactivées sur cet appareil", "Notifications disabled on this device"));
      } else {
        // Demande pendant le geste utilisateur, avant tout import/réseau (Safari).
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { setStatus(permission === "denied" ? "blocked" : "idle"); return; }
        await syncPushSubscription();
        setStatus("enabled");
        toast(tx("Notifications activées sur cet appareil", "Notifications enabled on this device"));
      }
    } catch {
      setStatus(previous);
      toast(tx("Impossible de modifier les notifications. Réessayez dans un instant.", "Could not update notifications. Please try again shortly."));
    } finally { busy.current = false; }
  }, [status, tx]);

  return <PushContext.Provider value={{ status, toggle }}>{children}</PushContext.Provider>;
}

export const usePush = () => useContext(PushContext);
