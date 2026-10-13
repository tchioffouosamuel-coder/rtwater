import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../lib/offline";
import { useI18n } from "../../i18n/I18nContext";

/** Bandeau discret affiché quand la connexion tombe (fréquent en 3G). */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const { tx } = useI18n();
  if (online) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-medium px-4 py-2 shadow"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      {tx(
        "Vous êtes hors ligne. Les pages déjà consultées restent disponibles ; la commande reprendra au retour du réseau.",
        "You are offline. Pages you already visited stay available; checkout resumes when you're back online."
      )}
    </div>
  );
}
