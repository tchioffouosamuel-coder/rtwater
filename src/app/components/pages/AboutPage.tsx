import { motion } from "motion/react";
import { Droplet, Zap, Award, Users, Target, Globe } from "lucide-react";

const stats = [
  { label: "Années d'expérience", value: "15+", icon: Award },
  { label: "Projets réalisés", value: "1000+", icon: Target },
  { label: "Clients satisfaits", value: "500+", icon: Users },
  { label: "Zones couvertes", value: "20+", icon: Globe },
];

const values = [
  {
    icon: Droplet,
    title: "Qualité supérieure",
    description: "Nous utilisons uniquement des équipements et produits de qualité certifiée pour garantir l'excellence de nos services.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Nous adoptons les technologies les plus récentes pour offrir des solutions modernes et efficaces.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Award,
    title: "Expertise",
    description: "Notre équipe de professionnels certifiés possède plus de 15 ans d'expérience dans le domaine.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Service client",
    description: "Nous sommes disponibles 24/7 pour répondre à vos besoins et assurer votre satisfaction.",
    gradient: "from-green-500 to-emerald-500",
  },
];

const timeline = [
  { year: "2008", event: "Création de RT-Water Solution à Yaoundé" },
  { year: "2012", event: "Expansion des services de forage" },
  { year: "2015", event: "Lancement des services de piscines" },
  { year: "2018", event: "500+ clients satisfaits" },
  { year: "2020", event: "Certification ISO obtenue" },
  { year: "2024", event: "Leader du marché camerounais" },
];

export function AboutPage() {
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
              Notre histoire
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              À propos de{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
                RT-Water
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 max-w-4xl mx-auto leading-relaxed">
              Depuis 2008, nous sommes le partenaire de confiance pour toutes vos solutions en eau au Cameroun.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
                Notre mission
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Fournir de l'eau pure pour tous
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Notre mission est de garantir l'accès à une eau propre, saine et fiable pour tous nos clients. Nous croyons que l'eau de qualité est un droit fondamental et nous travaillons chaque jour pour le rendre accessible.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Avec une équipe de professionnels hautement qualifiés et des équipements de pointe, nous offrons des solutions complètes adaptées à chaque besoin, qu'il s'agisse de purification, de forage, ou de maintenance.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg border border-gray-100"
                  >
                    <Icon className="w-10 h-10 text-[#0077BE] mb-4" />
                    <div className="text-4xl font-bold text-[#0077BE] mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-600">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
              Nos valeurs
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ce qui nous définit
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
              Notre parcours
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              15 ans d'excellence
            </h2>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-[#0077BE] to-[#00A8E8] hidden lg:block"></div>

            <div className="space-y-12">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col lg:flex-row items-center gap-8 ${
                    index % 2 === 0 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex-1 text-center lg:text-right">
                    {index % 2 === 0 && (
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <div className="text-3xl font-bold text-[#0077BE] mb-2">
                          {item.year}
                        </div>
                        <div className="text-gray-600">{item.event}</div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex-1 text-center lg:text-left">
                    {index % 2 !== 0 && (
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <div className="text-3xl font-bold text-[#0077BE] mb-2">
                          {item.year}
                        </div>
                        <div className="text-gray-600">{item.event}</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
