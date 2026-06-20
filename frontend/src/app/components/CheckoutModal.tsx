import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, CheckCircle, AlertCircle, Smartphone, Loader2, Truck,
  ShoppingBag, MapPin, User, Phone, Mail, ChevronRight,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useCartUI } from "../../context/CartUIContext";
import { useI18n } from "../../i18n/I18nContext";
import { useUserAuth } from "../../context/UserAuthContext";
import { initiatePayment, OPERATORS, type OperatorId } from "../../services/payments";
import { fetchOrder } from "../../services/orders";

type Step = "info" | "payment" | "waiting" | "done";
type DoneResult = "success" | "failed";

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
  const { t } = useI18n();
  const { user } = useUserAuth();

  const [step, setStep]               = useState<Step>("info");
  const [formData, setFormData]       = useState({ name: "", email: "", phone: "", address: "" });

  // Pre-fill name and email from logged-in user when the modal opens
  useEffect(() => {
    if (isCheckoutOpen && user) {
      setFormData(prev => ({
        ...prev,
        name:  prev.name  || user.name  || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [isCheckoutOpen, user]);
  const [payOnDelivery, setPayOnDelivery] = useState(false);
  const [infoError, setInfoError]     = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderId, setOrderId]         = useState<string | null>(null);
  // Capture total before cart is cleared
  const [orderTotal, setOrderTotal]   = useState(0);

  const [selectedOperator, setSelectedOperator] = useState<OperatorId | null>(null);
  const [paymentPhone, setPaymentPhone]         = useState("");
  const [paymentError, setPaymentError]         = useState<string | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

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
    setOrderId(null);
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
        const res   = await fetchOrder(id);
        const order = res?.data ?? res;
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
      setDoneResult("failed");
      setStep("done");
    }, POLL_TIMEOUT_MS);
  };

  useEffect(() => () => stopPolling(), []);

  // ── Step 1 ── info + order creation ──────────────────────────────────────
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      setInfoError("Veuillez remplir les champs obligatoires (*).");
      return;
    }
    setInfoError(null);
    setOrderTotal(cartTotal); // snapshot before cart is cleared
    setCreatingOrder(true);

    const id = await checkout(formData);
    setCreatingOrder(false);

    if (!id) { setInfoError("Impossible de créer la commande. Réessayez."); return; }

    setOrderId(id);
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
    if (!selectedOperator) { setPaymentError("Veuillez sélectionner un opérateur."); return; }
    if (!paymentPhone.trim()) { setPaymentError("Numéro Mobile Money requis."); return; }
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
    { key: "info",    label: "Infos"    },
    { key: "payment", label: "Paiement" },
    { key: "waiting", label: "Attente"  },
    { key: "done",    label: "Terminé"  },
  ];
  const codSteps = [
    { key: "info", label: "Infos"   },
    { key: "done", label: "Terminé" },
  ];
  const activeSteps  = payOnDelivery ? codSteps : onlineSteps;
  const currentIndex = activeSteps.findIndex(s => s.key === step);

  const inputClass = [
    "w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-700",
    "dark:border-slate-600 text-gray-900 dark:text-white text-sm",
    "focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent transition",
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl z-50 flex flex-col"
          >
            {/* Gradient top bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0077BE] via-[#00A8E8] to-[#00d4ff] rounded-t-3xl flex-shrink-0" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {step === "info"    && "Passer la commande"}
                  {step === "payment" && "Paiement Mobile Money"}
                  {step === "waiting" && "En attente de confirmation"}
                  {step === "done"    && (doneResult === "success" ? "Commande confirmée !" : "Paiement échoué")}
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
                          done    ? "bg-[#0077BE] text-white"          : "",
                          current ? "bg-[#0077BE] text-white ring-4 ring-blue-100 dark:ring-blue-900" : "",
                          !done && !current ? "bg-gray-100 dark:bg-slate-700 text-gray-400" : "",
                        ].join(" ")}>
                          {done ? <CheckCircle size={14} /> : i + 1}
                        </div>
                        <span className={`text-xs font-medium hidden sm:block ${current ? "text-[#0077BE]" : "text-gray-400"}`}>
                          {s.label}
                        </span>
                        {i < activeSteps.length - 1 && (
                          <div className={`w-6 h-0.5 rounded-full ${i < currentIndex ? "bg-[#0077BE]" : "bg-gray-200 dark:bg-slate-600"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition mt-0.5"
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
                  <div className="mb-5 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700">
                      <ShoppingBag size={16} className="text-[#0077BE]" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Résumé</span>
                      <span className="ml-auto text-xs text-gray-400">{items.length} article{items.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400 truncate pr-4">
                            {item.name}
                            <span className="ml-1 text-gray-400">× {item.quantity}</span>
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {(item.price * item.quantity).toLocaleString("fr-FR")} XAF
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 bg-gradient-to-r from-[#0077BE]/5 to-[#00A8E8]/5 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                      <span className="font-bold text-gray-900 dark:text-white">Total</span>
                      <span className="text-xl font-bold text-[#0077BE] dark:text-[#00A8E8]">
                        {cartTotal.toLocaleString("fr-FR")} <span className="text-base">XAF</span>
                      </span>
                    </div>
                  </div>

                  {/* Logged-in user banner */}
                  {user && (
                    <div className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-300">
                      <User size={14} className="flex-shrink-0" />
                      <span>Connecté en tant que <strong>{user.name}</strong> — formulaire pré-rempli</span>
                    </div>
                  )}

                  <form onSubmit={handleInfoSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-3 text-gray-400" />
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                        placeholder="Nom complet *"
                        className={inputClass}
                      />
                    </div>
                    {/* Phone */}
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-3 text-gray-400" />
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                        placeholder="Téléphone * (+237 6XX XXX XXX)"
                        className={inputClass}
                      />
                    </div>
                    {/* Email */}
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                        placeholder="Email (optionnel)"
                        className={inputClass}
                      />
                    </div>
                    {/* Address */}
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-3 text-gray-400" />
                      <textarea name="address" value={formData.address} onChange={handleInputChange}
                        placeholder="Adresse de livraison *"
                        rows={2}
                        className={`${inputClass} pl-10 resize-none`}
                      />
                    </div>

                    {/* Payment method */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Mode de paiement
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPayOnDelivery(false)}
                          className={[
                            "flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all",
                            !payOnDelivery
                              ? "border-[#0077BE] bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-slate-600 hover:border-gray-300",
                          ].join(" ")}
                        >
                          <div className={`p-2 rounded-xl ${!payOnDelivery ? "bg-[#0077BE]" : "bg-gray-100 dark:bg-slate-700"}`}>
                            <Smartphone size={18} className={!payOnDelivery ? "text-white" : "text-gray-500"} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${!payOnDelivery ? "text-[#0077BE]" : "text-gray-700 dark:text-gray-300"}`}>
                              Mobile Money
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">Orange · MTN · Moov · Wave</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayOnDelivery(true)}
                          className={[
                            "flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all",
                            payOnDelivery
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                              : "border-gray-200 dark:border-slate-600 hover:border-gray-300",
                          ].join(" ")}
                        >
                          <div className={`p-2 rounded-xl ${payOnDelivery ? "bg-amber-500" : "bg-gray-100 dark:bg-slate-700"}`}>
                            <Truck size={18} className={payOnDelivery ? "text-white" : "text-gray-500"} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${payOnDelivery ? "text-amber-700" : "text-gray-700 dark:text-gray-300"}`}>
                              À la livraison
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">Espèces à la réception</p>
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
                            Paiement de <strong>{cartTotal.toLocaleString("fr-FR")} XAF</strong> en espèces à la livraison.
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
                      className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white py-3.5 rounded-2xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-blue-300/60 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {creatingOrder ? (
                        <><Loader2 className="w-5 h-5 animate-spin" />Traitement en cours...</>
                      ) : payOnDelivery ? (
                        <><Truck size={18} />Confirmer la commande</>
                      ) : (
                        <>Continuer vers le paiement<ChevronRight size={18} /></>
                      )}
                    </motion.button>
                  </form>
                </>
              )}

              {/* ── Step 2 — Operator ─────────────────────────────────────── */}
              {step === "payment" && (
                <form onSubmit={handlePaymentSubmit} className="space-y-5">
                  {/* Amount banner */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0077BE]/10 to-[#00A8E8]/10 border border-[#0077BE]/20 rounded-2xl">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Smartphone size={16} className="text-[#0077BE]" />
                      Confirmation USSD sur votre téléphone
                    </div>
                    <span className="font-bold text-[#0077BE]">{orderTotal.toLocaleString("fr-FR")} XAF</span>
                  </div>

                  {/* Operator grid */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Opérateur *</p>
                    <div className="grid grid-cols-2 gap-3">
                      {OPERATORS.map(op => {
                        const color = OPERATOR_COLORS[op.id] ?? "#0077BE";
                        const selected = selectedOperator === op.id;
                        return (
                          <button
                            key={op.id} type="button"
                            onClick={() => setSelectedOperator(op.id)}
                            className={[
                              "flex items-center gap-3 p-3.5 rounded-2xl border-2 font-medium transition-all text-left",
                              selected
                                ? "border-current shadow-md"
                                : "border-gray-200 dark:border-slate-600 hover:border-gray-300",
                            ].join(" ")}
                            style={selected ? { borderColor: color, backgroundColor: `${color}10` } : {}}
                          >
                            <span className="text-2xl">{op.logo}</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{op.label}</p>
                              {selected && <p className="text-xs mt-0.5" style={{ color }}>Sélectionné ✓</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Numéro Mobile Money *
                      <span className="ml-2 text-gray-400 normal-case font-normal">(peut différer de votre contact)</span>
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="tel"
                        value={paymentPhone}
                        onChange={e => setPaymentPhone(e.target.value)}
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
                      className="flex-1 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                      Retour
                    </button>
                    <motion.button
                      type="submit" disabled={initiatingPayment}
                      whileHover={{ scale: initiatingPayment ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex-2 flex-1 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white py-3 rounded-2xl font-semibold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                      {initiatingPayment
                        ? <><Loader2 className="w-5 h-5 animate-spin" />Envoi...</>
                        : "Payer maintenant"
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
                      className="absolute inset-0 rounded-full bg-[#0077BE]/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                      className="absolute inset-0 rounded-full bg-[#0077BE]/20"
                    />
                    <div className="w-24 h-24 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] rounded-full flex items-center justify-center shadow-xl">
                      <Smartphone className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Validez sur votre téléphone</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Demande envoyée au <strong className="text-gray-700 dark:text-gray-200">{paymentPhone}</strong>
                    </p>
                    <p className="text-2xl font-bold text-[#0077BE] mt-2">
                      {orderTotal.toLocaleString("fr-FR")} XAF
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-2xl text-sm text-amber-700 dark:text-amber-300 text-left space-y-1.5">
                    <p className="font-semibold">Instructions :</p>
                    <ol className="list-decimal list-inside space-y-1 text-amber-600 dark:text-amber-400">
                      <li>Ouvrez la notification USSD reçue</li>
                      <li>Entrez votre code PIN Mobile Money</li>
                      <li>Confirmez le paiement</li>
                    </ol>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    En attente de confirmation...
                  </div>

                  <button
                    onClick={() => { stopPolling(); setStep("payment"); }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Annuler et réessayer
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
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {payOnDelivery ? "Commande enregistrée !" : "Paiement confirmé !"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {payOnDelivery
                            ? "Notre équipe vous contactera pour la livraison."
                            : "Votre commande est en cours de traitement."}
                        </p>
                      </div>

                      {/* Order total */}
                      <div className="p-4 bg-gradient-to-r from-[#0077BE]/5 to-[#00A8E8]/5 border border-[#0077BE]/15 rounded-2xl">
                        <p className="text-xs text-gray-500 mb-1">Montant de la commande</p>
                        <p className="text-2xl font-bold text-[#0077BE]">
                          {orderTotal.toLocaleString("fr-FR")} <span className="text-lg">XAF</span>
                        </p>
                        {payOnDelivery && (
                          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-amber-700 font-medium">
                            <Truck size={13} />
                            À payer en espèces à la livraison
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                        <p className="text-xs text-gray-500 mb-0.5">Numéro de commande</p>
                        <p className="text-base font-mono font-bold text-gray-900 dark:text-white">#{orderId}</p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white py-3.5 rounded-2xl font-semibold shadow-lg"
                      >
                        Fermer
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Paiement échoué</h3>
                      <p className="text-sm text-gray-500">
                        La confirmation n'a pas été reçue. Réessayez ou optez pour le paiement à la livraison.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setStep("payment")}
                          className="flex-1 py-3 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white rounded-2xl font-semibold"
                        >
                          Réessayer
                        </button>
                        <button
                          onClick={handleClose}
                          className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Fermer
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
