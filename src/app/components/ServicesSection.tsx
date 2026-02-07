import { Droplet, Zap, Beaker, Drill, Waves, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";

const services = [
  {
    icon: Droplet,
    title: "Purification d'eau",
    description:
      "Systèmes de purification avancés pour une eau potable de qualité supérieure, adaptés à tous vos besoins.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Vente de pompes",
    description:
      "Large gamme de pompes à eau performantes et durables pour tous types d'installations résidentielles et industrielles.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Beaker,
    title: "Désinfectants",
    description:
      "Produits de désinfection professionnels pour garantir la salubrité et la sécurité de votre eau.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Drill,
    title: "Forage",
    description:
      "Services de forage professionnel pour l'accès à des sources d'eau souterraines fiables et durables.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Waves,
    title: "Piscines",
    description:
      "Installation, entretien et traitement complet de piscines pour une eau cristalline toute l'année.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description:
      "Services de maintenance préventive et corrective pour tous vos équipements de traitement d'eau.",
    gradient: "from-red-500 to-rose-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export function ServicesSection() {
  const sectionRef = useRef(null);

  return (
    <section id="services" className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0077BE]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#00A8E8]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-4"
          >
            <span className="bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Ce que nous offrons
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent mb-6">
            Nos Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Des solutions complètes pour tous vos besoins en eau, de la
            purification à l'installation. Excellence et innovation à chaque étape.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 relative overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Icon Container */}
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className={`relative w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#0077BE] transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>

                {/* Decorative Element */}
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.6 }}
                  className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${service.gradient}`}
                ></motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
