import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, CheckCircle, AlertCircle, Smartphone, Loader2, Truck,
  ShoppingBag, MapPin, User, Phone, Mail, ChevronRight, Tag,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useCartUI } from "../../context/CartUIContext";
import { useI18n } from "../../i18n/I18nContext";
import { useUserAuth } from "../../context/UserAuthContext";
import { initiatePayment, OPERATORS, type OperatorId } from "../../services/payments";
import { fetchOrder } from "../../services/orders";
import { Link } from "react-router-dom";
import { trackEvent } from "../../lib/monitoring";
import { fetchShippingZones, quoteCart, type CartQuote, type ShippingZone } from "../../services/commerce";

type Step = "info" | "payment" | "waiting" | "done";
/** timeout = pas encore de réponse de l'opérateur : le paiement peut encore aboutir */
type DoneResult = "success" | "failed" | "timeout";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 120_000;

const OPERATOR_COLORS: Record<string, string> = {
  orange_money: "#FF6200",
  mtn_money:    "#FFCC00",
  moov_money:   "#0066CC",
  wave:         "#1AC8ED",
};

export function CheckoutModal() {
  const { isCheckoutOpen, closeCheckout } = useCartUI();
  const { cartTotal, checkout, items } = useCart();
  const { t, tx, locale } = useI18n();
  const { user } = useUserAuth();

  const [step, setStep]               = useState<Step>("info");
  const [formData, setFormData]       = useState({ name: "", email: "", phone: "", address: "" });

  // Pre-fill name and email from logged-in user when the modal opens
  useEffect(() => {
    if (isCheckoutOpen && user) {
      setFormData(prev => ({
        ...prev,
        name:    prev.name    || user.name    || "",
        email:   prev.email   || user.email   || "",
        phone:   prev.phone   || user.phone   || "",
        address: prev.address || user.address || "",
      }));
    }
  }, [isCheckoutOpen, user]);
  const [payOnDelivery, setPayOnDelivery] = useState(false);

  // Livraison et code promo. Les montants viennent de /orders/quote : le
  // navigateur n'additionne rien lui-meme, le serveur recalcule tout a la
  // commande de toute facon.
  const [zones, setZones]             = useState<ShippingZone[]>([]);
  const [zoneId, setZoneId]           = useState<number | null>(null);
  const [codeInput, setCodeInput]     = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeError, setCodeError]     = useState<string | null>(null);
  const [quote, setQuote]             = useState<CartQuote | null>(null);
  const [quoting, setQuoting]         = useState(false);
  const [infoError, setInfoError]     = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderId, setOrderId]         = useState<string | null>(null);
  const [orderRef, setOrderRef]       = useState<string | null>(null);
  const [statusUrl, setStatusUrl]     = useState<string | null>(null);
  // Capture total before cart is cleared
  const [orderTotal, setOrderTotal]   = useState(0);

  const [selectedOperator, setSelectedOperator] = useState<OperatorId | null>(null);
  const [paymentPhone, setPaymentPhone]         = useState("");
  const [paymentError, setPaymentError]         = useState<string | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  // Zones proposees, chargees a l'ouverture du tunnel
  useEffect(() => {
    if (!isCheckoutOpen) return;

    let active = true;
    fetchShippingZones(cartTotal)
      .then((list) => {
        if (!active) return;
        setZones(list);
        // Pre-selection de la premiere zone : le client voit tout de suite un
        // total complet au lieu d'un total qui augmente a la derniere etape.
        setZoneId((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => { if (active) setZones([]); });

    return () => { active = false; };
  }, [isCheckoutOpen, cartTotal]);

  // Recalcul serveur a chaque changement de panier, de zone ou de code
  useEffect(() => {
    if (!isCheckoutOpen || items.length === 0) { setQuote(null); return; }

    let active = true;
    setQuoting(true);

    quoteCart({
      items: items.map((i) => ({ product_id: parseInt(i.id, 10), quantity: i.quantity })),
      shipping_zone_id: zoneId,
      discount_code: appliedCode,
    })
      .then((result) => {
        if (!active) return;
        setQuote(result);

        // Un code devenu invalide entre-temps (expire, epuise) est retire
        if (appliedCode && result.discount_error) {
          setCodeError(result.discount_error);
          setAppliedCode(null);
        }
      })
      .catch(() => { if (active) setQuote(null); })
      .finally(() => { if (active) setQuoting(false); });

    return () => { active = false; };
  }, [isCheckoutOpen, items, zoneId, appliedCode]);

  const selectedZone = zones.find((z) => z.id === zoneId) ?? null;
  const shippingFee  = quote?.shipping_fee ?? 0;
  const discountTotal = quote?.discount_total ?? 0;
  const grandTotal   = quote?.total ?? cartTotal;

  const applyCode = async () => {
    const code = codeInput.trim();
    if (!code) return;

    setCodeError(null);
    setQuoting(true);
    try {
      const result = await quoteCart({
        items: items.map((i) => ({ product_id: parseInt(i.id, 10), quantity: i.quantity })),
        shipping_zone_id: zoneId,
        discount_code: code,
      });

      if (result.discount_error) {
        setCodeError(result.discount_error);
        setAppliedCode(null);
      } else {
        setAppliedCode(result.discount_code);
        setQuote(result);
        setCodeInput("");
      }
    } catch {
      setCodeError(tx("Verification impossible pour le moment.", "Could not verify the code right now."));
    } finally {
      setQuoting(false);
    }
  };

  const removeCode = () => {
    setAppliedCode(null);
    setCodeError(null);
    setCodeInput("");
  };

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const [doneResult, setDoneResult] = useState<DoneResult>("success");

  const stopPolling = () => {
    if (pollRef.current)    clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollRef.current    = null;
    timeoutRef.current = null;
  };

  const resetAll = () => {
    stopPolling();
    setStep("info");
    setFormData({ name: "", email: "", phone: "", address: "" });
    setPayOnDelivery(false);
    setInfoError(null);
    setZoneId(null);
    setCodeInput("");
    setAppliedCode(null);
    setCodeError(null);
    setQuote(null);
    setOrderId(null);
    setOrderRef(null);
    setStatusUrl(null);
    setOrderTotal(0);
    setSelectedOperator(null);
    setPaymentPhone("");
    setPaymentError(null);
  };

  const handleClose = () => { resetAll(); closeCheckout(); };

  const startPolling = (id: string) => {
    stopPolling();
    const check = async () => {
      try {
        let order: any;
        if (statusUrl) {
          const r = await fetch(statusUrl, { headers: { Accept: "application/json" } });
          order = r.ok ? (await r.json())?.data : null;
        } else {
          const res = await fetchOrder(id);
          order = res?.data ?? res;
        }
        if (order?.status && order.status !== "pending") {
          stopPolling();
          setDoneResult(order.status === "paid" ? "success" : "failed");
          setStep("done");
        }
      } catch { /* silent */ }
    };
    pollRef.current    = setInterval(check, POLL_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setDoneResult("timeout");
      setStep("done");
    }, POLL_TIMEOUT_MS);
  };

  useEffect(() => () => stopPolling(), []);

  // ── Step 1 ── info + order creation ──────────────────────────────────────
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      setInfoError(tx("Veuillez remplir les champs obligatoires (*).", "Please fill in the required fields (*)."));
      return;
    }
    if (zones.length > 0 && !zoneId) {
      setInfoError(tx("Choisissez une zone de livraison.", "Please choose a delivery zone."));
      return;
    }

    setInfoError(null);
    setCreatingOrder(true);

    let created: Awaited<ReturnType<typeof checkout>>;
    try {
      created = await checkout(formData, {
        shipping_zone_id: zoneId,
        discount_code: appliedCode,
        payment_method: payOnDelivery ? "cash" : "mobile_money",
      });
    } catch (err: any) {
      setCreatingOrder(false);
      // Message du serveur : « Stock insuffisant pour… », « Ce code promo a expire. »
      setInfoError(
        err?.data?.message
          ?? tx("Impossible de créer la commande. Réessayez.", "The order could not be created. Please try again."),
      );
      return;
    }

    setCreatingOrder(false);

    if (!created) { setInfoError(tx("Impossible de créer la commande. Réessayez.", "The order could not be created. Please try again.")); return; }

    // Montant reellement facture, releve apres la creation : le panier est vide
    setOrderTotal(created.total);

    trackEvent("purchase", {
      transaction_id: created.reference,
      value: created.total,
      currency: "XAF",
      payment_method: payOnDelivery ? "cash_on_delivery" : "mobile_money",
    });

    setOrderId(created.id);
    setOrderRef(created.reference);
    setStatusUrl(created.statusUrl);
    if (payOnDelivery) {
      setDoneResult("success");
      setStep("done");
    } else {
      setPaymentPhone(formData.phone);
      setStep("payment");
    }
  };

  // ── Step 2 ── SEBPAY initiation ───────────────────────────────────────────
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) { setPaymentError(tx("Veuillez sélectionner un opérateur.", "Please choose an operator.")); return; }
    if (!paymentPhone.trim()) { setPaymentError(tx("Numéro Mobile Money requis.", "Mobile Money number required.")); return; }
    if (!orderId) return;

    setPaymentError(null);
    setInitiatingPayment(true);
    try {
      await initiatePayment(orderId, { operator: selectedOperator, phone: paymentPhone.trim() });
      setStep("waiting");
      startPolling(orderId);
    } catch (err: any) {
      setPaymentError(err?.message ?? "Erreur lors de l'initialisation du paiement.");
    } finally {
      setInitiatingPayment(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Steps config
  const onlineSteps = [
    { key: "info",    label: tx("Infos", "Details")    },
    { key: "payment", label: tx("Paiement", "Payment") },
    { key: "waiting", label: tx("Attente", "Waiting")  },
    { key: "done",    label: tx("Terminé", "Done")  },
  ];
  const codSteps = [
    { key: "info", label: tx("Infos", "Details")   },
    { key: "done", label: tx("Terminé", "Done") },
  ];
  const activeSteps  = payOnDelivery ? codSteps : onlineSteps;
  const currentIndex = activeSteps.findIndex(s => s.key === step);

  const inputClass = [
    "w-full pl-10 pr-4 py-2.5 border border-ink-200 rounded-xl bg-white dark:bg-ink-700",
    "dark:border-ink-600 text-ink-900 dark:text-white text-sm",
    "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition",
  ].join(" ");

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label={tx("Commande", "Checkout")}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-ink-800 rounded-3xl shadow-2xl z-50 flex flex-col"
          >
            {/* Gradient top bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 via-aqua-500 to-aqua-400 rounded-t-3xl flex-shrink-0" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-ink-100 dark:border-ink-700 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-ink-900 dark:text-white">
                  {step === "info"    && tx("Passer la commande", "Checkout")}
                  {step === "payment" && tx("Paiement Mobile Money", "Mobile Money payment")}
                  {step === "waiting" && tx("En attente de confirmation", "Awaiting confirmation")}
                  {step === "done"    && (doneResult === "success" ? tx("Commande confirmée !", "Order confirmed!") : doneResult === "timeout" ? tx("Paiement en attente", "Payment pending") : tx("Paiement échoué", "Payment failed"))}
                </h2>

                {/* Step indicators */}
                <div className="flex items-center gap-1.5 mt-3">
                  {activeSteps.map((s, i) => {
                    const done    = i < currentIndex;
                    const current = i === currentIndex;
                    return (
                      <div key={s.key} className="flex items-center gap-1.5">
                        <div className={[
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                          done    ? "bg-brand-600 text-white"          : "",
                          current ? "bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900" : "",
                          !done && !current ? "bg-ink-100 dark:bg-ink-700 text-ink-400" : "",
                        ].join(" ")}>
                          {done ? <CheckCircle size={14} /> : i + 1}
                        </div>
                        <span className={`text-xs font-medium hidden sm:block ${current ? "text-brand-600" : "text-ink-400"}`}>
                          {s.label}
                        </span>
                        {i < activeSteps.length - 1 && (
                          <div className={`w-6 h-0.5 rounded-full ${i < currentIndex ? "bg-brand-600" : "bg-ink-200 dark:bg-ink-600"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleClose}
                aria-label={tx("Fermer", "Close")}
                className="p-2 text-ink-400 hover:text-ink-600 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-xl transition mt-0.5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex-1">

              {/* ── Step 1 — Info ────────────────────────────────────────── */}
              {step === "info" && (
                <>
                  {/* Order summary */}
                  <div className="mb-5 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden">
                    <div className="bg-ink-50 dark:bg-ink-700/50 px-4 py-3 flex items-center gap-2 border-b border-ink-100 dark:border-ink-700">
                      <ShoppingBag size={16} className="text-brand-600" />
                      <span className="text-sm font-semibold text-ink-700 dark:text-ink-300">{tx("Résumé", "Summary")}</span>
                      <span className="ml-auto text-xs text-ink-400">{items.length} {tx(items.length > 1 ? "articles" : "article", items.length > 1 ? "items" : "item")}</span>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-ink-600 dark:text-ink-400 truncate pr-4">
                            {item.name}
                            <span className="ml-1 text-ink-400">× {item.quantity}</span>
                          </span>
                          <span className="font-semibold text-ink-900 dark:text-white whitespace-nowrap">
                            {Math.round(item.price * item.quantity).toLocaleString(locale)} XAF
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Detail : sous-total, remise, livraison */}
                    <div className="px-4 py-3 border-t border-ink-100 dark:border-ink-700 space-y-1.5 text-sm">
                      <div className="flex justify-between text-ink-600 dark:text-ink-400">
                        <span>{tx("Sous-total", "Subtotal")}</span>
                        <span>{Math.round(quote?.subtotal ?? cartTotal).toLocaleString(locale)} XAF</span>
                      </div>

                      {discountTotal > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span className="flex items-center gap-1">
                            <Tag size={12} />
                            {tx("Remise", "Discount")} {appliedCode && <code className="text-xs">{appliedCode}</code>}
                          </span>
                          <span>&minus; {Math.round(discountTotal).toLocaleString(locale)} XAF</span>
                        </div>
                      )}

                      {selectedZone && (
                        <div className="flex justify-between text-ink-600 dark:text-ink-400">
                          <span className="flex items-center gap-1">
                            <Truck size={12} />
                            {tx("Livraison", "Delivery")}
                          </span>
                          <span>
                            {shippingFee > 0
                              ? `${Math.round(shippingFee).toLocaleString(locale)} XAF`
                              : tx("Offerte", "Free")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 bg-gradient-to-r from-brand-600/5 to-aqua-500/5 border-t border-ink-100 dark:border-ink-700 flex justify-between items-center">
                      <span className="font-bold text-ink-900 dark:text-white">{tx("Total", "Total")}</span>
                      <span className="text-xl font-bold text-brand-600 dark:text-aqua-500">
                        {quoting ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>{Math.round(grandTotal).toLocaleString(locale)} <span className="text-base">XAF</span></>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Zone de livraison */}
                  {zones.length > 0 && (
                    <div className="mb-5">
                      <p className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-300">
                        {tx("Zone de livraison", "Delivery zone")}
                      </p>
                      <div className="space-y-2">
                        {zones.map((zone) => {
                          const isFree = (zone.fee_for_cart ?? zone.fee) === 0 && zone.fee > 0;

                          return (
                            <label
                              key={zone.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                zoneId === zone.id
                                  ? "border-brand-600 bg-brand-600/5"
                                  : "border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name="shipping_zone"
                                checked={zoneId === zone.id}
                                onChange={() => setZoneId(zone.id)}
                                className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600 focus:ring-brand-600"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium text-ink-900 dark:text-white">{zone.name}</span>
                                  {zone.delay && <span className="text-xs text-ink-400">&middot; {zone.delay}</span>}
                                </span>
                                {zone.description && (
                                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                                    {zone.description}
                                  </span>
                                )}
                                {zone.free_above != null && !isFree && (
                                  <span className="mt-0.5 block text-xs text-brand-600">
                                    {tx("Offerte dès", "Free from")} {Math.round(zone.free_above).toLocaleString(locale)} XAF
                                  </span>
                                )}
                              </span>
                              <span className="flex-shrink-0 text-sm font-semibold text-ink-900 dark:text-white">
                                {(zone.fee_for_cart ?? zone.fee) === 0
                                  ? tx("Offerte", "Free")
                                  : `${Math.round(zone.fee_for_cart ?? zone.fee).toLocaleString(locale)} XAF`}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Code promo */}
                  <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-300">
                      {tx("Code promo", "Promo code")}
                    </p>

                    {appliedCode ? (
                      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800 dark:bg-green-900/20">
                        <Tag size={14} className="flex-shrink-0 text-green-600 dark:text-green-400" />
                        <code className="flex-1 text-sm font-semibold text-green-700 dark:text-green-300">{appliedCode}</code>
                        <span className="text-sm text-green-700 dark:text-green-300">
                          &minus; {Math.round(discountTotal).toLocaleString(locale)} XAF
                        </span>
                        <button
                          type="button"
                          onClick={removeCode}
                          aria-label={tx("Retirer le code promo", "Remove promo code")}
                          className="flex-shrink-0 text-green-600 transition hover:text-green-800 dark:text-green-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={codeInput}
                            onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCode(); } }}
                            placeholder={tx("Votre code", "Your code")}
                            aria-label={tx("Code promo", "Promo code")}
                            aria-invalid={!!codeError}
                            className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm uppercase text-ink-900 outline-none transition focus:border-brand-600 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={applyCode}
                            disabled={!codeInput.trim() || quoting}
                            className="flex-shrink-0 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-700"
                          >
                            {quoting ? <Loader2 size={16} className="animate-spin" /> : tx("Appliquer", "Apply")}
                          </button>
                        </div>
                        {codeError && <p role="status" className="mt-1.5 text-xs text-red-500">{codeError}</p>}
                      </>
                    )}
                  </div>

                  {/* Logged-in user banner */}
                  {user && (
                    <div className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-300">
                      <User size={14} className="flex-shrink-0" />
                      <span>{tx("Connecté en tant que", "Signed in as")} <strong>{user.name}</strong> · {tx("formulaire pré-rempli", "form pre-filled")}</span>
                    </div>
                  )}

                  <form onSubmit={handleInfoSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-3 text-ink-400" />
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                        placeholder={tx("Nom complet *", "Full name *")}
                        aria-label={tx("Nom complet", "Full name")}
                        autoComplete="name" required
                        className={inputClass}
                      />
                    </div>
                    {/* Phone */}
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-3 text-ink-400" />
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                        placeholder={tx("Téléphone * (+237 6XX XXX XXX)", "Phone * (+237 6XX XXX XXX)")}
                        aria-label={tx("Téléphone", "Phone")}
                        autoComplete="tel" required
                        className={inputClass}
                      />
                    </div>
                    {/* Email */}
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-3 text-ink-400" />
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                        placeholder={tx("Email (optionnel, pour la confirmation)", "Email (optional, for confirmation)")}
                        aria-label="Email"
                        autoComplete="email"
                        className={inputClass}
                      />
                    </div>
                    {/* Address */}
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-3 text-ink-400" />
                      <textarea name="address" value={formData.address} onChange={handleInputChange}
                        placeholder={tx("Adresse de livraison * (quartier, repère)", "Delivery address * (area, landmark)")}
                        aria-label={tx("Adresse de livraison", "Delivery address")}
                        autoComplete="street-address" required
                        rows={2}
                        className={`${inputClass} pl-10 resize-none`}
                      />
                    </div>

                    {/* Payment method */}
                    <div>
                      <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-3">
                        {tx("Mode de paiement", "Payment method")}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPayOnDelivery(false)}
                          className={[
                            "flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all",
                            !payOnDelivery
                              ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20"
                              : "border-ink-200 dark:border-ink-600 hover:border-ink-300",
                          ].join(" ")}
                        >
                          <div className={`p-2 rounded-xl ${!payOnDelivery ? "bg-brand-600" : "bg-ink-100 dark:bg-ink-700"}`}>
                            <Smartphone size={18} className={!payOnDelivery ? "text-white" : "text-ink-500"} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${!payOnDelivery ? "text-brand-600" : "text-ink-700 dark:text-ink-300"}`}>
                              Mobile Money
                            </p>
                            <p className="text-xs text-ink-500 mt-0.5">Orange · MTN · Moov · Wave</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayOnDelivery(true)}
                          className={[
                            "flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all",
                            payOnDelivery
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                              : "border-ink-200 dark:border-ink-600 hover:border-ink-300",
                          ].join(" ")}
                        >
                          <div className={`p-2 rounded-xl ${payOnDelivery ? "bg-amber-500" : "bg-ink-100 dark:bg-ink-700"}`}>
                            <Truck size={18} className={payOnDelivery ? "text-white" : "text-ink-500"} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${payOnDelivery ? "text-amber-700" : "text-ink-700 dark:text-ink-300"}`}>
                              {tx("À la livraison", "On delivery")}
                            </p>
                            <p className="text-xs text-ink-500 mt-0.5">{tx("Espèces à la réception", "Cash on receipt")}</p>
                          </div>
                        </button>
                      </div>

                      {payOnDelivery && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2"
                        >
                          <Truck size={15} className="flex-shrink-0 mt-0.5" />
                          <span>
                            {tx("Paiement de", "Payment of")} <strong>{Math.round(grandTotal).toLocaleString(locale)} XAF</strong> {tx("en espèces à la livraison.", "in cash on delivery.")}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {infoError && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl">
                        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-300">{infoError}</p>
                      </div>
                    )}

                    <motion.button
                      type="submit" disabled={creatingOrder}
                      whileHover={{ scale: creatingOrder ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-brand-600 to-aqua-500 text-white py-3.5 rounded-2xl font-semibold shadow-lg shadow-brand-200/50 hover:shadow-brand-300/60 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {creatingOrder ? (
                        <><Loader2 className="w-5 h-5 animate-spin" />{tx("Traitement en cours...", "Processing...")}</>
                      ) : payOnDelivery ? (
                        <><Truck size={18} />{tx("Confirmer la commande", "Confirm order")}</>
                      ) : (
                        <>{tx("Continuer vers le paiement", "Continue to payment")}<ChevronRight size={18} /></>
                      )}
                    </motion.button>
                  </form>
                </>
              )}

              {/* ── Step 2 — Operator ─────────────────────────────────────── */}
              {step === "payment" && (
                <form onSubmit={handlePaymentSubmit} className="space-y-5">
                  {/* Amount banner */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-600/10 to-aqua-500/10 border border-brand-600/20 rounded-2xl">
                    <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
                      <Smartphone size={16} className="text-brand-600" />
                      {tx("Confirmation USSD sur votre téléphone", "USSD confirmation on your phone")}
                    </div>
                    <span className="font-bold text-brand-600">{Math.round(orderTotal).toLocaleString(locale)} XAF</span>
                  </div>

                  {/* Operator grid */}
                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">{tx("Opérateur", "Operator")} *</p>
                    <div className="grid grid-cols-2 gap-3">
                      {OPERATORS.map(op => {
                        const color = OPERATOR_COLORS[op.id] ?? "#285f60";
                        const selected = selectedOperator === op.id;
                        return (
                          <button
                            key={op.id} type="button"
                            aria-pressed={selected}
                            onClick={() => setSelectedOperator(op.id)}
                            className={[
                              "flex items-center gap-3 p-3.5 rounded-2xl border-2 font-medium transition-all text-left",
                              selected
                                ? "border-current shadow-md"
                                : "border-ink-200 dark:border-ink-600 hover:border-ink-300",
                            ].join(" ")}
                            style={selected ? { borderColor: color, backgroundColor: `${color}10` } : {}}
                          >
                            <span className="text-2xl">{op.logo}</span>
                            <div>
                              <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">{op.label}</p>
                              {selected && <p className="text-xs mt-0.5" style={{ color }}>{tx("Sélectionné", "Selected")} ✓</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment phone */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
                      {tx("Numéro Mobile Money", "Mobile Money number")} *
                      <span className="ml-2 text-ink-400 normal-case font-normal">{tx("(peut différer de votre contact)", "(may differ from your contact)")}</span>
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-3 text-ink-400" />
                      <input
                        type="tel"
                        value={paymentPhone}
                        onChange={e => setPaymentPhone(e.target.value)}
                        aria-label={tx("Numéro Mobile Money", "Mobile Money number")}
                        autoComplete="tel"
                        placeholder="+237 6XX XXX XXX"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {paymentError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">{paymentError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button" onClick={() => setStep("info")}
                      className="flex-1 py-3 border-2 border-ink-200 dark:border-ink-600 rounded-2xl font-semibold text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-700 transition"
                    >
                      {tx("Retour", "Back")}
                    </button>
                    <motion.button
                      type="submit" disabled={initiatingPayment}
                      whileHover={{ scale: initiatingPayment ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex-2 flex-1 bg-gradient-to-r from-brand-600 to-aqua-500 text-white py-3 rounded-2xl font-semibold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                      {initiatingPayment
                        ? <><Loader2 className="w-5 h-5 animate-spin" />{tx("Envoi...", "Sending...")}</>
                        : tx("Payer maintenant", "Pay now")
                      }
                    </motion.button>
                  </div>
                </form>
              )}

              {/* ── Step 3 — Waiting ─────────────────────────────────────── */}
              {step === "waiting" && (
                <div className="text-center py-6 space-y-5">
                  {/* Pulse ring animation */}
                  <div className="relative w-24 h-24 mx-auto">
                    <motion.div
                      animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full bg-brand-600/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                      className="absolute inset-0 rounded-full bg-brand-600/20"
                    />
                    <div className="w-24 h-24 bg-gradient-to-br from-brand-600 to-aqua-500 rounded-full flex items-center justify-center shadow-xl">
                      <Smartphone className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-ink-900 dark:text-white">{tx("Validez sur votre téléphone", "Confirm on your phone")}</h3>
                    <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                      {tx("Demande envoyée au", "Request sent to")} <strong className="text-ink-700 dark:text-ink-200">{paymentPhone}</strong>
                    </p>
                    <p className="text-2xl font-bold text-brand-600 mt-2">
                      {Math.round(orderTotal).toLocaleString(locale)} XAF
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-2xl text-sm text-amber-700 dark:text-amber-300 text-left space-y-1.5">
                    <p className="font-semibold">{tx("Instructions :", "Instructions:")}</p>
                    <ol className="list-decimal list-inside space-y-1 text-amber-600 dark:text-amber-400">
                      <li>{tx("Ouvrez la notification USSD reçue", "Open the USSD prompt you received")}</li>
                      <li>{tx("Entrez votre code PIN Mobile Money", "Enter your Mobile Money PIN")}</li>
                      <li>{tx("Confirmez le paiement", "Confirm the payment")}</li>
                    </ol>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-ink-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {tx("En attente de confirmation...", "Waiting for confirmation...")}
                  </div>

                  <button
                    onClick={() => { stopPolling(); setStep("payment"); }}
                    className="text-xs text-ink-400 hover:text-ink-600 underline"
                  >
                    {tx("Annuler et réessayer", "Cancel and retry")}
                  </button>
                </div>
              )}

              {/* ── Step 4 — Done ────────────────────────────────────────── */}
              {step === "done" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-4"
                >
                  {doneResult === "success" ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 250, delay: 0.05 }}
                        className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-200/50"
                      >
                        <CheckCircle className="w-10 h-10 text-white" />
                      </motion.div>

                      <div>
                        <h3 className="text-xl font-bold text-ink-900 dark:text-white">
                          {payOnDelivery ? tx("Commande enregistrée !", "Order placed!") : tx("Paiement confirmé !", "Payment confirmed!")}
                        </h3>
                        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                          {payOnDelivery
                            ? tx("Notre équipe vous contactera pour la livraison.", "Our team will contact you to arrange delivery.")
                            : tx("Votre commande est en cours de traitement.", "Your order is being processed.")}
                        </p>
                      </div>

                      {/* Order total */}
                      <div className="p-4 bg-gradient-to-r from-brand-600/5 to-aqua-500/5 border border-brand-600/15 rounded-2xl">
                        <p className="text-xs text-ink-500 mb-1">{tx("Montant de la commande", "Order amount")}</p>
                        <p className="text-2xl font-bold text-brand-600">
                          {Math.round(orderTotal).toLocaleString(locale)} <span className="text-lg">XAF</span>
                        </p>
                        {payOnDelivery && (
                          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-amber-700 font-medium">
                            <Truck size={13} />
                            {tx("À payer en espèces à la livraison", "To be paid in cash on delivery")}
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-ink-50 dark:bg-ink-700 rounded-xl">
                        <p className="text-xs text-ink-500 mb-0.5">{tx("Référence de commande", "Order reference")}</p>
                        <p className="text-base font-mono font-bold text-ink-900 dark:text-white">{orderRef ?? `#${orderId}`}</p>
                        <p className="text-xs text-ink-500 mt-1">
                          {tx("Conservez-la pour suivre votre commande. Une confirmation vous est envoyée par e-mail si vous l'avez indiqué.", "Keep it to track your order. A confirmation is emailed to you if you provided an address.")}
                        </p>
                      </div>

                      <Link
                        to={`/suivi-commande?ref=${orderRef ?? orderId}`}
                        onClick={handleClose}
                        className="block text-sm font-semibold text-brand-600 dark:text-aqua-500 hover:underline"
                      >
                        {tx("Suivre ma commande", "Track my order")}
                      </Link>

                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-brand-600 to-aqua-500 text-white py-3.5 rounded-2xl font-semibold shadow-lg"
                      >
                        {tx("Fermer", "Close")}
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-ink-900 dark:text-white">
                        {doneResult === "timeout" ? tx("Confirmation pas encore reçue", "Confirmation not received yet") : tx("Paiement échoué", "Payment failed")}
                      </h3>
                      <p className="text-sm text-ink-500">
                        {doneResult === "timeout"
                          ? tx(`Si vous avez validé sur votre téléphone, la commande ${orderRef ?? ""} sera mise à jour automatiquement. Ne payez pas une deuxième fois : vérifiez d'abord son statut.`, `If you confirmed on your phone, order ${orderRef ?? ""} will update automatically. Do not pay twice: check its status first.`)
                          : tx("Le paiement a été refusé ou annulé. Réessayez ou optez pour le paiement à la livraison.", "The payment was declined or cancelled. Try again or choose cash on delivery.")}
                      </p>
                      {doneResult === "timeout" && (
                        <Link
                          to={`/suivi-commande?ref=${orderRef ?? orderId}`}
                          onClick={handleClose}
                          className="block text-sm font-semibold text-brand-600 hover:underline"
                        >
                          {tx("Vérifier le statut de ma commande", "Check my order status")}
                        </Link>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setStep("payment")}
                          className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-aqua-500 text-white rounded-2xl font-semibold"
                        >
                          {tx("Réessayer", "Try again")}
                        </button>
                        <button
                          onClick={handleClose}
                          className="flex-1 py-3 border-2 border-ink-200 rounded-2xl font-medium text-ink-600 hover:bg-ink-50"
                        >
                          {tx("Fermer", "Close")}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
