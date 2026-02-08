import { motion } from "motion/react";
import { useState } from "react";
import { User, Mail, Phone, MapPin, Home, Droplet, MessageSquare, Send, CheckCircle } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";

export function QuotePage() {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        serviceType: "",
        message: "",
      });
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("quote.successTitle")}
          </h2>
          <p className="text-gray-600 text-lg">
            {t("quote.successMessage")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-32 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] overflow-hidden">
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
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
              {t("quote.freeAndNoCommitment")}
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              {t("quote.requestYourQuote")}{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
                {t("quote.freeQuoteText")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto">
              {t("quote.fillFormBelow")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <User className="w-5 h-5 text-[#0077BE]" />
                  {t("quote.fullNameRequired")}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent transition-all"
                  placeholder={t("quote.yourFullName")}
                />
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                    <Mail className="w-5 h-5 text-[#0077BE]" />
                    {t("quote.emailRequired")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent transition-all"
                    placeholder={t("quote.yourEmail")}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                    <Phone className="w-5 h-5 text-[#0077BE]" />
                    {t("quote.phoneRequired")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent transition-all"
                    placeholder={t("quote.phoneNumber")}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <MapPin className="w-5 h-5 text-[#0077BE]" />
                  {t("quote.address")}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent transition-all"
                  placeholder={t("quote.yourAddressYaonde")}
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <Droplet className="w-5 h-5 text-[#0077BE]" />
                  {t("quote.serviceTypeRequired")}
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent transition-all"
                >
                  <option value="">{t("quote.selectService")}</option>
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <MessageSquare className="w-5 h-5 text-[#0077BE]" />
                  {t("quote.projectDetails")}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent transition-all resize-none"
                  placeholder={t("quote.describeYourNeed")}
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-8 py-5 rounded-xl font-bold text-lg shadow-xl shadow-[#0077BE]/30 hover:shadow-2xl hover:shadow-[#0077BE]/40 transition-all flex items-center justify-center gap-3"
              >
                <Send className="w-6 h-6" />
                {t("quote.sendRequest")}
              </motion.button>

              <p className="text-center text-gray-500 text-sm">
                {t("quote.formConsent")}
              </p>
            </form>
          </motion.div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
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
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}