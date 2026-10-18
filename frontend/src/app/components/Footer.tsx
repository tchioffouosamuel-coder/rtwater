import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useTheme } from "../../theme/ThemeContext";
import { useI18n } from "../../i18n/I18nContext";
import { useSiteContent } from "../../context/SiteContentContext";
import { NewsletterForm } from "./NewsletterForm";

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
};

const SOCIAL_COLORS: Record<string, string> = {
  facebook: "hover:bg-brand-600",
  twitter: "hover:bg-aqua-500",
  linkedin: "hover:bg-brand-700",
  instagram: "hover:bg-pink-600",
};

export function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const { t, language } = useI18n();
  const { footer } = useSiteContent();

  const quickLinks = [
    { label: t("common.home"), path: "/" },
    { label: t("common.gallery"), path: "/gallery" },
    { label: t("common.about"), path: "/about" },
    { label: t("common.quote"), path: "/devis" },
    { label: language === "en" ? "Track my order" : "Suivre ma commande", path: "/suivi-commande" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-brand-900 text-white overflow-hidden transition-colors duration-300">
      <div className="h-1 bg-aqua-500" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <img src="/logo.webp" alt="RT Water Solution" className="h-12 w-auto" />
            </div>
            <p className="text-ink-400 mb-6 leading-relaxed">
              {footer.tagline}
            </p>

            {/* Lettre d'information — formulaire reellement branche sur /api/newsletter */}
            <NewsletterForm />
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-white">
              {t("footer.services")}
            </h3>
            <ul className="space-y-3">
              {footer.serviceLinks.map((service, index) => (
                <motion.li
                  key={service}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => handleNavigation("accueil")}
                    className="text-ink-400 hover:text-aqua-500 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-brand-600 rounded-full group-hover:bg-aqua-500 transition-colors"></span>
                    {service}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-white">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => handleNavigation(link.path)}
                    className="text-ink-400 hover:text-aqua-500 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-brand-600 rounded-full group-hover:bg-aqua-500 transition-colors"></span>
                    {link.label}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-white">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-600/20 transition-colors">
                  <MapPin className="w-5 h-5 text-aqua-500" />
                </div>
                <div>
                  <p className="text-ink-400 leading-relaxed">
                    {footer.address}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-600/20 transition-colors">
                  <Phone className="w-5 h-5 text-aqua-500" />
                </div>
                <div>
                  <a
                    href={`tel:${footer.phone}`}
                    className="text-ink-400 hover:text-aqua-500 transition-colors"
                  >
                    {footer.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-600/20 transition-colors">
                  <Mail className="w-5 h-5 text-aqua-500" />
                </div>
                <div>
                  <a
                    href={`mailto:${footer.email}`}
                    className="text-ink-400 hover:text-aqua-500 transition-colors"
                  >
                    {footer.email}
                  </a>
                </div>
              </li>
            </ul>

            {/* Social Media */}
            <div className="mt-8">
              <p className="text-sm text-ink-400 mb-4">{t("footer.followUs")}</p>
              <div className="flex gap-3">
                {footer.socialLinks.map((social) => {
                  const Icon = SOCIAL_ICONS[social.platform] ?? Facebook;
                  const colorClass = SOCIAL_COLORS[social.platform] ?? "hover:bg-ink-600";
                  return (
                    <motion.a
                      key={social.platform}
                      href={social.url}
                      whileHover={{ y: -3, scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center ${colorClass} transition-all duration-300 border border-white/10 hover:border-transparent`}
                      aria-label={social.platform}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="border-t border-white/10 dark:border-white/5 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-ink-400 text-sm">
              © {currentYear} {footer.companyName} {footer.companyTagline}. {t("footer.allRightsReserved")}
            </p>
            <div className="flex gap-6 text-sm">
              <a
                href="#"
                className="text-ink-400 hover:text-aqua-500 transition-colors duration-300"
              >
                {t("footer.privacy")}
              </a>
              <a
                href="#"
                className="text-ink-400 hover:text-aqua-500 transition-colors duration-300"
              >
                {t("footer.terms")}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
