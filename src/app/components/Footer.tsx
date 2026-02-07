import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Droplets, Send } from "lucide-react";
import { motion } from "motion/react";
import type { Page } from "../App";

interface FooterProps {
  setCurrentPage: (page: Page) => void;
}

export function Footer({ setCurrentPage }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const serviceLinks = [
    "Purification d'eau",
    "Vente de pompes",
    "Désinfectants",
    "Forage",
    "Piscines",
    "Maintenance",
  ];

  const quickLinks = [
    { label: "Accueil", page: "accueil" as Page },
    { label: "Galerie", page: "galerie" as Page },
    { label: "À propos", page: "apropos" as Page },
    { label: "Devis gratuit", page: "devis" as Page },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:bg-blue-600" },
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:bg-sky-500" },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:bg-blue-700" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:bg-pink-600" },
  ];

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <pattern
            id="footer-pattern"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="10" cy="10" r="1.5" fill="white" />
          </pattern>
          <rect width="100" height="100" fill="url(#footer-pattern)" />
        </svg>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0077BE] via-[#00A8E8] to-[#0077BE]"></div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] rounded-xl flex items-center justify-center shadow-lg shadow-[#0077BE]/30">
                <Droplets className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                RT-Water
              </span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Votre partenaire de confiance pour des solutions complètes en eau
              à Yaoundé, Cameroun. Excellence et innovation depuis plus de 15 ans.
            </p>
            
            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-3">Restez informé</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0077BE] transition-colors"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#0077BE] to-[#00A8E8] p-2 rounded-lg hover:shadow-lg hover:shadow-[#0077BE]/30 transition-all"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Nos Services
            </h3>
            <ul className="space-y-3">
              {serviceLinks.map((service, index) => (
                <motion.li
                  key={service}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => handleNavigation("accueil")}
                    className="text-gray-400 hover:text-[#00A8E8] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-[#0077BE] rounded-full group-hover:bg-[#00A8E8] transition-colors"></span>
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
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Liens rapides
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
                    onClick={() => handleNavigation(link.page)}
                    className="text-gray-400 hover:text-[#00A8E8] transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-[#0077BE] rounded-full group-hover:bg-[#00A8E8] transition-colors"></span>
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
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#0077BE]/20 transition-colors">
                  <MapPin className="w-5 h-5 text-[#00A8E8]" />
                </div>
                <div>
                  <p className="text-gray-400 leading-relaxed">
                    Yaoundé, Cameroun
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#0077BE]/20 transition-colors">
                  <Phone className="w-5 h-5 text-[#00A8E8]" />
                </div>
                <div>
                  <a
                    href="tel:+237"
                    className="text-gray-400 hover:text-[#00A8E8] transition-colors"
                  >
                    +237 XXX XXX XXX
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#0077BE]/20 transition-colors">
                  <Mail className="w-5 h-5 text-[#00A8E8]" />
                </div>
                <div>
                  <a
                    href="mailto:info@rt-water.com"
                    className="text-gray-400 hover:text-[#00A8E8] transition-colors"
                  >
                    info@rt-water.com
                  </a>
                </div>
              </li>
            </ul>

            {/* Social Media */}
            <div className="mt-8">
              <p className="text-sm text-gray-400 mb-4">Suivez-nous</p>
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      whileHover={{ y: -3, scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center ${social.color} transition-all duration-300 border border-white/10 hover:border-transparent`}
                      aria-label={social.label}
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
          className="border-t border-white/10 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} RT-Water Solution. Tous droits réservés. Conçu avec{" "}
              <span className="text-red-500">♥</span> à Yaoundé.
            </p>
            <div className="flex gap-6 text-sm">
              <a
                href="#"
                className="text-gray-400 hover:text-[#00A8E8] transition-colors duration-300"
              >
                Politique de confidentialité
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-[#00A8E8] transition-colors duration-300"
              >
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
