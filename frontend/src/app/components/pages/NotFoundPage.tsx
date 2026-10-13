import { Link } from "react-router-dom";
import { Droplets, FileText, Home, ShoppingBag } from "lucide-react";
import { useSeo } from "../../../lib/seo";
import { useI18n } from "../../../i18n/I18nContext";

/** Page 404 : propose des chemins utiles au lieu de renvoyer en silence vers l'accueil. */
export function NotFoundPage() {
  const { tx } = useI18n();
  useSeo({ title: tx("Page introuvable", "Page not found"), noindex: true });

  const links = [
    { to: "/", label: tx("Accueil", "Home"), icon: Home },
    { to: "/shop", label: tx("Boutique", "Shop"), icon: ShoppingBag },
    { to: "/devis", label: tx("Demander un devis", "Request a quote"), icon: FileText },
  ];

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <Droplets className="w-14 h-14 mx-auto text-[#00A8E8] mb-4" aria-hidden="true" />
        <p className="text-sm font-semibold text-[#0077BE] tracking-widest">{tx("ERREUR 404", "ERROR 404")}</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{tx("Cette page s'est évaporée", "This page has evaporated")}</h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          {tx("Le lien est peut-être ancien ou mal saisi. Voici où vous pouvez aller :", "The link may be old or mistyped. Here is where you can go:")}
        </p>
        <div className="mt-8 grid sm:grid-cols-3 gap-3">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-[#0077BE] hover:text-[#0077BE] text-gray-700 dark:text-gray-200 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
