import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { User, Mail, Phone, MapPin, Home, Droplet, MessageSquare, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useTheme } from "../../../theme/ThemeContext";
import { submitQuoteRequest } from "../../../services/quotes";
import { useSeo } from "../../../lib/seo";
import { trackEvent } from "../../../lib/monitoring";
import { PageHeroMedia } from "../ui/PageHeroMedia";
import { QUOTE_HEADER_PHOTO } from "../../content/photos";

export function QuotePage() {
  useSeo({
    title: "Devis gratuit",
    description: "Demandez un devis gratuit pour votre installation de traitement de l'eau : particuliers, entreprises, forages. Réponse sous 24 h.",
    path: "/devis",
  });
  const { t } = useI18n();
  const { theme } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    serviceType: "",
    message: "",
  });

  const services = [
    t("services.purification.title"),
    t("services.pumps.title"),
    t("services.disinfectants.title"),
    t("services.drilling.title"),
    t("services.pools.title"),
    t("services.maintenance.title"),
  ];

  // Arrivée depuis une carte de service de l'accueil : /devis?service=Forage
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get("service");
  useEffect(() => {
    if (!requestedService) return;
    // Comparaison sans accents ni majuscules : « Purification d'eau » = « purification d'eau »
    const norm = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const match = services.find((sv) => norm(sv) === norm(requestedService));
    setFormData((f) => match
      ? { ...f, serviceType: match }
      : { ...f, message: f.message || `Service souhaité : ${requestedService}\n` });
  }, [requestedService]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = t("quote.nameRequired");
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = t("quote.validEmailRequired");
    if (!formData.phone.trim()) errors.phone = t("quote.phoneRequired");
    if (!formData.serviceType) errors.serviceType = t("quote.selectService");

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitQuoteRequest({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.address,
        solution_type: formData.serviceType,
        description: formData.message,
      });
      trackEvent("generate_lead", { solution_type: formData.serviceType || "non précisé" });
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", address: "", serviceType: "", message: "" });
    } catch {
      setSubmitError(t("quote.submitError") || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white dark:from-ink-950 to-ink-50 dark:to-ink-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-white dark:bg-ink-800 rounded-3xl p-8 sm:p-12 text-center max-w-md shadow-2xl border border-ink-100 dark:border-ink-700"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <CheckCircle className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white mb-3 sm:mb-4"
          >
            {t("quote.successTitle")}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-ink-600 dark:text-ink-300 text-base sm:text-lg leading-relaxed"
          >
            {t("quote.successMessage")}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 bg-gradient-to-br from-brand-600 to-aqua-500 overflow-hidden">
        <PageHeroMedia photo={QUOTE_HEADER_PHOTO} veil="dense" />
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                y: Math.random() * 400,
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.span 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-white/30"
            >
              {t("quote.freeAndNoCommitment")}
            </motion.span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {t("quote.requestYourQuote")}{" "}
              <span className="text-white underline decoration-aqua-200/80 decoration-[6px] underline-offset-[10px]">
                {t("quote.freeQuoteText")}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed px-2">
              {t("quote.fillFormBelow")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-ink-50 dark:from-ink-900 via-white dark:via-ink-800 to-ink-50 dark:to-ink-900 transition-colors duration-300">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white dark:bg-ink-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border border-ink-100 dark:border-ink-700 transition-colors duration-300"
          >
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                  <User className="w-5 h-5 text-brand-600" />
                  {t("quote.fullNameRequired")}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 ${
                    fieldErrors.name 
                      ? "border-red-500 dark:border-red-500" 
                      : focusedField === "name"
                      ? "border-brand-600 dark:border-aqua-500"
                      : "border-ink-200 dark:border-ink-600"
                  } focus:outline-none`}
                  placeholder={t("quote.yourFullName")}
                />
                {fieldErrors.name && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 text-red-500 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.name}
                  </motion.div>
                )}
              </motion.div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                    <Mail className="w-5 h-5 text-brand-600" />
                    {t("quote.emailRequired")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 ${
                      fieldErrors.email 
                        ? "border-red-500 dark:border-red-500" 
                        : focusedField === "email"
                        ? "border-brand-600 dark:border-aqua-500"
                        : "border-ink-200 dark:border-ink-600"
                    } focus:outline-none`}
                    placeholder={t("quote.yourEmail")}
                  />
                  {fieldErrors.email && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-2 text-red-500 text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.email}
                    </motion.div>
                  )}
                </motion.div>

                {/* Phone */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                    <Phone className="w-5 h-5 text-brand-600" />
                    {t("quote.phoneRequired")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 ${
                      fieldErrors.phone 
                        ? "border-red-500 dark:border-red-500" 
                        : focusedField === "phone"
                        ? "border-brand-600 dark:border-aqua-500"
                        : "border-ink-200 dark:border-ink-600"
                    } focus:outline-none`}
                    placeholder={t("quote.phoneNumber")}
                  />
                  {fieldErrors.phone && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-2 text-red-500 text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.phone}
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
              >
                <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  {t("quote.address")}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("address")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 ${
                    focusedField === "address"
                      ? "border-brand-600 dark:border-aqua-500"
                      : "border-ink-200 dark:border-ink-600"
                  } focus:outline-none`}
                  placeholder={t("quote.yourAddressYaonde")}
                />
              </motion.div>

              {/* Service Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                  <Droplet className="w-5 h-5 text-brand-600" />
                  {t("quote.serviceTypeRequired")}
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("serviceType")}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl transition-all duration-300 text-ink-900 dark:text-white cursor-pointer ${
                    fieldErrors.serviceType 
                      ? "border-red-500 dark:border-red-500" 
                      : focusedField === "serviceType"
                      ? "border-brand-600 dark:border-aqua-500"
                      : "border-ink-200 dark:border-ink-600"
                  } focus:outline-none`}
                >
                  <option value="">{t("quote.selectService")}</option>
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                {fieldErrors.serviceType && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 text-red-500 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.serviceType}
                  </motion.div>
                )}
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
              >
                <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                  <MessageSquare className="w-5 h-5 text-brand-600" />
                  {t("quote.projectDetails")}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  rows={5}
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl focus:outline-none transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 resize-none ${
                    focusedField === "message"
                      ? "border-brand-600 dark:border-aqua-500"
                      : "border-ink-200 dark:border-ink-600"
                  }`}
                  placeholder={t("quote.describeYourNeed")}
                />
              </motion.div>

              {/* API error */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {submitError}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.02, y: submitting ? 0 : -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="w-full bg-gradient-to-r from-brand-600 to-aqua-500 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg shadow-xl shadow-brand-600/30 hover:shadow-2xl hover:shadow-brand-600/40 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                {submitting ? "Envoi en cours..." : t("quote.sendRequest")}
              </motion.button>

              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-center text-ink-500 dark:text-ink-400 text-xs sm:text-sm"
              >
                {t("quote.formConsent")}
              </motion.p>
            </form>
          </motion.div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-12 sm:mt-16">
            {[
              { 
                icon: CheckCircle, 
                title: t("quote.quickResponse"), 
                text: t("quote.under24h") 
              },
              { 
                icon: Home, 
                title: t("quote.freeDisplacement"), 
                text: t("quote.inYaonde") 
              },
              { 
                icon: Droplet, 
                title: t("quote.expertAdvice"), 
                text: t("quote.personalized") 
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-ink-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-ink-100 dark:border-ink-700 transition-all duration-300 text-center"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 sm:w-14 h-12 sm:h-14 bg-gradient-to-br from-brand-600 to-aqua-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                  >
                    <Icon className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
                  </motion.div>
                  <h3 className="font-bold text-ink-900 dark:text-white mb-2 text-sm sm:text-base">{item.title}</h3>
                  <p className="text-ink-600 dark:text-ink-400 text-xs sm:text-sm">{item.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}