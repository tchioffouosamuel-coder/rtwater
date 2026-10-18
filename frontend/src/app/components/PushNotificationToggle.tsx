import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePush } from "../../context/PushContext";
import { useI18n } from "../../i18n/I18nContext";

export function PushNotificationToggle({ onDark = false }: { onDark?: boolean }) {
  const { status, toggle } = usePush();
  const { tx } = useI18n();
  if (status === "hidden") return null;
  return (
    <div className="mt-5">
      <button type="button" onClick={toggle} disabled={status === "busy" || status === "blocked"}
        aria-pressed={status === "enabled"} aria-busy={status === "busy"}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${onDark ? "border-white/30 text-white hover:bg-white/10" : "border-ink-300 text-ink-700 hover:bg-ink-100 dark:border-ink-600 dark:text-ink-100 dark:hover:bg-ink-700"}`}
      >
        {status === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "enabled" ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {status === "busy" ? tx("Mise à jour…", "Updating…") : status === "enabled" ? tx("Désactiver les notifications", "Disable notifications") : status === "blocked" ? tx("Notifications bloquées", "Notifications blocked") : tx("Activer les notifications", "Enable notifications")}
      </button>
      {status === "blocked" && <p className={`mt-2 text-xs leading-relaxed ${onDark ? "text-ink-300" : "text-ink-600 dark:text-ink-300"}`}>
        {tx("Pour les autoriser, ouvrez les paramètres de ce site dans votre navigateur.", "To allow them, open this site's settings in your browser.")}
      </p>}
    </div>
  );
}
