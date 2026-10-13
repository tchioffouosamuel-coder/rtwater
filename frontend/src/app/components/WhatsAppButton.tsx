import { useLocation } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";
import { useI18n } from "../../i18n/I18nContext";

/** Numéro au format international sans « + » ni espaces (wa.me/2376XXXXXXXX). */
function toWaNumber(raw: string | undefined): string | null {
  if (!raw || /x/i.test(raw)) return null; // numéro factice du contenu par défaut
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 9) digits = "237" + digits; // numéro camerounais saisi sans indicatif
  return digits.length >= 11 ? digits : null;
}

/**
 * Bouton WhatsApp flottant : premier canal de contact au Cameroun.
 * Le message est pré-rempli avec la page consultée (produit, devis…).
 * Le numéro se règle dans le back-office : Pages > Contact > Numéro WhatsApp.
 */
export function WhatsAppButton() {
  const { contact } = useSiteContent();
  const { pathname } = useLocation();
  const { tx } = useI18n();
  const number = toWaNumber(contact.whatsapp || contact.phone);

  if (!number || pathname.startsWith("/admin")) return null;

  const product = `${document.title.split(" | ")[0]} (${window.location.href})`;
  const message = pathname.startsWith("/shop/")
    ? tx(`Bonjour RT Water, je souhaite des informations sur ce produit : ${product}.`, `Hello RT Water, I would like information about this product: ${product}.`)
    : pathname.startsWith("/devis")
      ? tx("Bonjour RT Water, je souhaite un devis de traitement d'eau.", "Hello RT Water, I would like a water treatment quote.")
      : tx("Bonjour RT Water, je souhaite des informations sur vos solutions de traitement de l'eau.", "Hello RT Water, I would like information about your water treatment solutions.");
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={tx("Discuter avec nous sur WhatsApp", "Chat with us on WhatsApp")}
      className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 hover:shadow-xl hover:scale-105 transition-all p-3.5 sm:pr-5"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-current" aria-hidden="true">
        <path d="M16.04 3C9.4 3 4 8.36 4 14.96c0 2.11.56 4.17 1.62 5.99L4 29l8.27-1.58a12.1 12.1 0 0 0 3.77.6C22.68 28.02 28 22.66 28 16.06 28 9.46 22.68 3 16.04 3Zm0 22.83c-1.2 0-2.38-.2-3.5-.6l-.25-.09-4.9.94.96-4.72-.17-.27a9.8 9.8 0 0 1-1.51-5.13c0-5.4 4.42-9.79 9.86-9.79 5.43 0 9.85 4.6 9.85 10 0 5.38-4.42 9.66-9.84 9.66Zm5.4-7.32c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.15-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.46a8.9 8.9 0 0 1-1.65-2.04c-.17-.3-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.57-.48-.5-.67-.5h-.57c-.2 0-.52.08-.79.37-.27.3-1.03 1-1.03 2.45s1.06 2.84 1.2 3.04c.15.2 2.08 3.17 5.04 4.45.7.3 1.25.48 1.68.62.7.22 1.35.19 1.85.12.57-.09 1.75-.71 2-1.4.24-.69.24-1.28.17-1.4-.08-.13-.27-.2-.57-.35Z" />
      </svg>
      <span className="hidden sm:inline text-sm font-semibold">{tx("Une question ?", "Questions?")}</span>
    </a>
  );
}
