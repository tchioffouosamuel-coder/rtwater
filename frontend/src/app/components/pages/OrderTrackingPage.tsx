import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Loader2, MapPin, PackageSearch, Search, XCircle } from "lucide-react";
import { trackOrder } from "../../../services/orders";
import { useUserAuth } from "../../../context/UserAuthContext";
import { useI18n } from "../../../i18n/I18nContext";
import { useSeo } from "../../../lib/seo";
import { ORDER_STEPS, orderStepIndex, statusColor, statusLabel } from "../../../lib/orderStatus";
import { PageHeroMedia } from "../ui/PageHeroMedia";
import { TRACKING_HEADER_PHOTO } from "../../content/photos";

interface TrackedOrder {
  reference: string;
  status: string;
  total: number;
  address: string;
  created_at: string;
  updated_at: string;
  payment: { operator: string; status: string } | null;
  items: { name: string; quantity: number; price: number }[];
}

/** /suivi-commande : suivi sans compte, avec la référence et le téléphone ou l'e-mail. */
export function OrderTrackingPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useUserAuth();
  const { tx, language, locale } = useI18n();
  const [reference, setReference] = useState(params.get("ref") ?? "");
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const money = (n: number) => `${Math.round(n).toLocaleString(locale)} XAF`;

  useSeo({
    title: tx("Suivre ma commande", "Track my order"),
    description: tx(
      "Suivez l'avancement de votre commande RT Water Solution avec sa référence et votre numéro de téléphone.",
      "Track your RT Water Solution order with its reference and your phone number."
    ),
    path: "/suivi-commande",
  });

  // Client connecté : son e-mail est pré-rempli
  useEffect(() => {
    if (user?.email && !contact) setContact(user.email);
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      const res = await trackOrder(reference.trim(), contact.trim());
      setOrder(res?.data ?? null);
      setParams({ ref: res?.data?.reference ?? reference.trim() }, { replace: true });
    } catch (err: any) {
      setError(
        err?.status === 429
          ? tx("Trop de recherches. Patientez une minute avant de réessayer.", "Too many searches. Please wait a minute and try again.")
          : err?.status === 404
            ? tx(
                "Aucune commande ne correspond. Vérifiez la référence reçue par e-mail et le téléphone utilisé lors de la commande.",
                "No matching order. Check the reference from your email and the phone number used when ordering."
              )
            : tx("Le suivi est momentanément indisponible. Réessayez dans un instant.", "Tracking is temporarily unavailable. Please try again shortly.")
      );
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = order ? orderStepIndex(order.status) : -1;
  const cancelled = order?.status === "cancelled";
  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 text-sm";

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900">
      <section className="relative overflow-hidden bg-brand-800 py-14 sm:py-20 text-white text-center px-4">
        <PageHeroMedia photo={TRACKING_HEADER_PHOTO} />
        <div className="relative">
          <PackageSearch className="w-12 h-12 mx-auto mb-4 opacity-90" aria-hidden="true" />
          <h1 className="text-3xl sm:text-4xl font-bold">{tx("Suivre ma commande", "Track my order")}</h1>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            {tx(
              "Saisissez la référence reçue par e-mail, par exemple CMD-000042, et le téléphone ou l'e-mail utilisé pour commander.",
              "Enter the reference from your email, for example CMD-000042, and the phone or email used to order."
            )}
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 -mt-8 pb-16">
        <form onSubmit={submit} className="bg-white dark:bg-ink-800 rounded-2xl shadow-xl p-5 sm:p-7 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="trk-ref" className="block text-sm font-semibold text-ink-700 dark:text-ink-200 mb-1.5">{tx("Référence", "Reference")}</label>
            <input id="trk-ref" required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="CMD-000042" className={inputClass} />
          </div>
          <div>
            <label htmlFor="trk-contact" className="block text-sm font-semibold text-ink-700 dark:text-ink-200 mb-1.5">{tx("Téléphone ou e-mail", "Phone or email")}</label>
            <input id="trk-contact" required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="6XX XX XX XX"
              autoComplete="tel" inputMode="email" className={inputClass} />
          </div>
          <button type="submit" disabled={loading}
            className="h-[46px] px-6 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-aqua-500 disabled:opacity-70 flex items-center justify-center gap-2 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {tx("Rechercher", "Search")}
          </button>
        </form>

        {error && (
          <div role="alert" className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {order && (
          <div className="mt-8 bg-white dark:bg-ink-800 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-700 overflow-hidden" aria-live="polite">
            <div className="p-5 sm:p-7 flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 dark:border-ink-700">
              <div>
                <p className="text-sm text-ink-500 dark:text-ink-400">{tx("Commande du", "Ordered on")} {order.created_at}</p>
                <p className="text-xl font-bold text-ink-900 dark:text-white">{order.reference}</p>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold text-sm ${statusColor(order.status)}`}>{statusLabel(order.status, language)}</span>
            </div>

            {/* Frise de suivi */}
            <div className="p-5 sm:p-7">
              {cancelled ? (
                <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
                  <XCircle className="w-6 h-6 flex-shrink-0" />
                  <p>
                    {tx(
                      `Cette commande a été annulée le ${order.updated_at}. Contactez-nous si vous pensez qu'il s'agit d'une erreur.`,
                      `This order was cancelled on ${order.updated_at}. Contact us if you think this is a mistake.`
                    )}
                  </p>
                </div>
              ) : (
                <ol className="grid grid-cols-4 gap-2">
                  {ORDER_STEPS.map((step, i) => {
                    const done = i <= stepIndex;
                    return (
                      <li key={step.key} className="flex flex-col items-center text-center relative" aria-current={i === stepIndex ? "step" : undefined}>
                        {i > 0 && (
                          <span aria-hidden="true" className={`absolute top-4 right-1/2 w-full h-1 z-0 ${i <= stepIndex ? "bg-brand-600" : "bg-ink-200 dark:bg-ink-600"}`} />
                        )}
                        <span className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${done ? "bg-brand-600 text-white" : "bg-ink-200 dark:bg-ink-600 text-ink-500 dark:text-ink-300"}`}>
                          {done ? <Check className="w-4 h-4" /> : i + 1}
                        </span>
                        <span className={`mt-2 text-xs sm:text-sm ${done ? "font-semibold text-ink-900 dark:text-white" : "text-ink-500 dark:text-ink-400"}`}>
                          {language === "en" ? step.labelEn : step.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {order.status === "pending" && order.payment?.status === "failed" && (
                <p className="mt-5 text-sm text-amber-700 dark:text-amber-300">
                  {tx(
                    `Le dernier paiement ${order.payment.operator} n'a pas abouti. Vous pouvez nous contacter pour finaliser la commande.`,
                    `The last ${order.payment.operator} payment did not go through. Contact us to complete the order.`
                  )}
                </p>
              )}
            </div>

            <div className="px-5 sm:px-7 pb-6 space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-ink-700 dark:text-ink-300">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="font-medium">{money(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2 border-t border-ink-100 dark:border-ink-700 font-bold text-ink-900 dark:text-white">
                <span>{tx("Total", "Total")}</span>
                <span>{money(order.total)}</span>
              </div>
              <p className="flex items-start gap-2 pt-3 text-sm text-ink-500 dark:text-ink-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /> {order.address}
              </p>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-ink-500 dark:text-ink-400">
          {tx("Vous avez un compte ?", "Have an account?")}{" "}
          <Link to="/orders" className="text-brand-600 dark:text-aqua-500 font-medium hover:underline">
            {tx("Voir toutes mes commandes", "See all my orders")}
          </Link>
        </p>
      </div>
    </div>
  );
}
