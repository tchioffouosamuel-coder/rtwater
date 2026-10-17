import { motion } from "motion/react";
import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle, User, Tag, MessageSquare } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useTheme } from "../../../theme/ThemeContext";
import { useSiteContent } from "../../../context/SiteContentContext";
import { useSeo } from "../../../lib/seo";

export function ContactPage() {
  useSeo({
    title: "Contact",
    description: "Contactez RT Water Solution à Yaoundé : téléphone, e-mail, horaires et formulaire de contact. Réponse rapide de nos techniciens.",
    path: "/contact",
  });
  const { t, tx } = useI18n();
  const { theme } = useTheme();
  const { contact } = useSiteContent();
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = tx("Indiquez votre nom.", "Please enter your name.");
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = tx("Indiquez une adresse e-mail valide.", "Please enter a valid email address.");
    if (!formData.subject.trim()) errors.subject = tx("Indiquez le sujet de votre message.", "Please enter a subject.");
    if (!formData.message.trim()) errors.message = tx("Écrivez votre message.", "Please write your message.");

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 2500);
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
            {t("contact.form.successTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-ink-600 dark:text-ink-300 text-base sm:text-lg leading-relaxed"
          >
            {t("contact.form.successMessage")}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950 transition-colors duration-300">
      <section className="relative py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-brand-600 to-aqua-500 overflow-hidden">
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

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight"
          >
            {t("contact.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-base sm:text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed px-2"
          >
            {t("contact.description")}
          </motion.p>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-ink-50 dark:from-ink-900 via-white dark:via-ink-800 to-ink-50 dark:to-ink-900 transition-colors duration-300">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-ink-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border border-ink-100 dark:border-ink-700 transition-colors duration-300"
          >
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                  <User className="w-5 h-5 text-brand-600" />
                  {t("contact.form.nameRequired")}
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder={t("contact.form.namePlaceholder")}
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 ${
                    fieldErrors.name
                      ? "border-red-500 dark:border-red-500"
                      : focusedField === "name"
                      ? "border-brand-600 dark:border-aqua-500"
                      : "border-ink-200 dark:border-ink-600"
                  } focus:outline-none`}
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
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                    <Mail className="w-5 h-5 text-brand-600" />
                    {t("contact.form.emailRequired")}
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder={t("contact.form.emailPlaceholder")}
                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 ${
                      fieldErrors.email
                        ? "border-red-500 dark:border-red-500"
                        : focusedField === "email"
                        ? "border-brand-600 dark:border-aqua-500"
                        : "border-ink-200 dark:border-ink-600"
                    } focus:outline-none`}
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
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                    <Phone className="w-5 h-5 text-brand-600" />
                    {t("contact.form.phoneRequired")}
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t("contact.form.phonePlaceholder")}
                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 ${
                      focusedField === "phone"
                        ? "border-brand-600 dark:border-aqua-500"
                        : "border-ink-200 dark:border-ink-600"
                    } focus:outline-none`}
                  />
                </motion.div>
              </div>

              {/* Subject */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                  <Tag className="w-5 h-5 text-brand-600" />
                  {t("contact.form.subject")}
                </label>
                <input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("subject")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t("contact.form.subject")}
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 ${
                    fieldErrors.subject
                      ? "border-red-500 dark:border-red-500"
                      : focusedField === "subject"
                      ? "border-brand-600 dark:border-aqua-500"
                      : "border-ink-200 dark:border-ink-600"
                    } focus:outline-none`}
                />
                {fieldErrors.subject && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 text-red-500 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.subject}
                  </motion.div>
                )}
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="flex items-center gap-2 text-ink-700 dark:text-ink-200 font-semibold mb-3">
                  <MessageSquare className="w-5 h-5 text-brand-600" />
                  {t("contact.form.message")}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  rows={5}
                  placeholder={t("contact.form.messagePlaceholder")}
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-ink-50 dark:bg-ink-700 border-2 rounded-xl focus:outline-none transition-all duration-300 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 resize-none ${
                    fieldErrors.message
                      ? "border-red-500 dark:border-red-500"
                      : focusedField === "message"
                      ? "border-brand-600 dark:border-aqua-500"
                      : "border-ink-200 dark:border-ink-600"
                  }`}
                />
                {fieldErrors.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 text-red-500 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.message}
                  </motion.div>
                )}
              </motion.div>

              {/* Submit Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4"
              >
                <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400">{t("contact.form.consent")}</p>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-aqua-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Send className="w-5 h-5" />
                  {t("contact.form.submit")}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>

          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-8 sm:mt-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-ink-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-ink-100 dark:border-ink-700 transition-all duration-300 text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 sm:w-14 h-12 sm:h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-brand-600 to-aqua-500 flex items-center justify-center shadow-lg"
              >
                <MapPin className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
              </motion.div>
              <h4 className="font-bold text-ink-900 dark:text-white mb-2">{t("contact.addressTitle")}</h4>
              <p className="text-sm sm:text-base text-ink-600 dark:text-ink-400">{contact.address}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-ink-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-ink-100 dark:border-ink-700 transition-all duration-300 text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 sm:w-14 h-12 sm:h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-brand-600 to-aqua-500 flex items-center justify-center shadow-lg"
              >
                <Phone className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
              </motion.div>
              <h4 className="font-bold text-ink-900 dark:text-white mb-2">{t("contact.phoneTitle")}</h4>
              <p className="text-sm sm:text-base text-ink-600 dark:text-ink-400">{contact.phone}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-ink-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-ink-100 dark:border-ink-700 transition-all duration-300 text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 sm:w-14 h-12 sm:h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-brand-600 to-aqua-500 flex items-center justify-center shadow-lg"
              >
                <Clock className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
              </motion.div>
              <h4 className="font-bold text-ink-900 dark:text-white mb-2">{t("contact.hoursTitle")}</h4>
              <p className="text-sm sm:text-base text-ink-600 dark:text-ink-400">{contact.hours}</p>
            </motion.div>
          </div>

          {/* Google Maps */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mt-10 sm:mt-16 rounded-3xl overflow-hidden shadow-2xl border border-ink-100 dark:border-ink-700"
          >
            {/* Map header */}
            <div className="bg-gradient-to-r from-brand-600 to-aqua-500 px-6 py-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-white flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm sm:text-base">RT-Water Solution Sarl</p>
                <p className="text-white/80 text-xs sm:text-sm">{contact.address}</p>
              </div>
              <a
                href="https://maps.app.goo.gl/qdfrQ59oKVt2eQS18"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-white/90 hover:text-white text-xs sm:text-sm font-medium underline underline-offset-2 transition-colors"
              >
                Ouvrir dans Maps →
              </a>
            </div>
            <div className="relative w-full" style={{ paddingBottom: "42%" }}>
              <iframe
                src={contact.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3980.7179297804787!2d11.485430774747213!3d3.8705587961032246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcfca3f203107%3A0x47c27e91df3d7381!2sRT-Water%20Solution%20sarl!5e0!3m2!1sfr!2scm!4v1781939886136!5m2!1sfr!2scm"}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="RT Water Solution — Localisation Yaoundé"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
