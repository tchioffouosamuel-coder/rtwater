import { motion } from "motion/react";
import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";

export function ContactPage() {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 2500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0077BE] to-[#00A8E8]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 text-center max-w-md shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("contact.form.successTitle")}</h2>
          <p className="text-gray-600 text-lg">{t("contact.form.successMessage")}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative py-24 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            {t("contact.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-lg text-white/90 max-w-3xl mx-auto"
          >
            {t("contact.description")}
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <Mail className="w-5 h-5 text-[#0077BE]" />
                  {t("contact.form.nameRequired")}
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder={t("contact.form.namePlaceholder")}
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                    <Mail className="w-5 h-5 text-[#0077BE]" />
                    {t("contact.form.emailRequired")}
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={t("contact.form.emailPlaceholder")}
                    className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                    <Phone className="w-5 h-5 text-[#0077BE]" />
                    {t("contact.form.phoneRequired")}
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("contact.form.phonePlaceholder")}
                    className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <Mail className="w-5 h-5 text-[#0077BE]" />
                  {t("contact.form.subject")}
                </label>
                <input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t("contact.form.subject")}
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <Mail className="w-5 h-5 text-[#0077BE]" />
                  {t("contact.form.message")}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder={t("contact.form.messagePlaceholder")}
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0077BE] resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-500">{t("contact.form.consent")}</p>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-6 py-3 rounded-2xl font-bold"
                >
                  <Send className="w-5 h-5" />
                  {t("contact.form.submit")}
                </motion.button>
              </div>
            </form>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-2xl shadow border border-gray-100 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-[#0077BE] to-[#00A8E8] flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold mb-1">{t("contact.addressTitle")}</h4>
              <p className="text-gray-600">{t("contact.address")}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow border border-gray-100 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-[#0077BE] to-[#00A8E8] flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold mb-1">{t("contact.phoneTitle")}</h4>
              <p className="text-gray-600">{t("contact.phone")}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow border border-gray-100 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-[#0077BE] to-[#00A8E8] flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold mb-1">{t("contact.hoursTitle")}</h4>
              <p className="text-gray-600">{t("contact.hours")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
