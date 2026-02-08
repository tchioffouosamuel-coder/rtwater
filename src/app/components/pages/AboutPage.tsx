import { motion } from "motion/react";
import { Droplet, Zap, Award, Users, Target, Globe } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";

export function AboutPage() {
  const { t } = useI18n();

  const stats = [
    { labelKey: "about.stats.experience.label", valueKey: "about.stats.experience.value", icon: Award },
    { labelKey: "about.stats.projects.label", valueKey: "about.stats.projects.value", icon: Target },
    { labelKey: "about.stats.clients.label", valueKey: "about.stats.clients.value", icon: Users },
    { labelKey: "about.stats.zones.label", valueKey: "about.stats.zones.value", icon: Globe },
  ];

  const values = [
    {
      icon: Droplet,
      titleKey: "about.values.quality.title",
      descriptionKey: "about.values.quality.description",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      titleKey: "about.values.innovation.title",
      descriptionKey: "about.values.innovation.description",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Award,
      titleKey: "about.values.expertise.title",
      descriptionKey: "about.values.expertise.description",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      titleKey: "about.values.service.title",
      descriptionKey: "about.values.service.description",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const timeline = [
    { year: "2008", eventKey: "about.timeline.events.2008" },
    { year: "2012", eventKey: "about.timeline.events.2012" },
    { year: "2015", eventKey: "about.timeline.events.2015" },
    { year: "2018", eventKey: "about.timeline.events.2018" },
    { year: "2020", eventKey: "about.timeline.events.2020" },
    { year: "2024", eventKey: "about.timeline.events.2024" },
  ];

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
              {t("about.badge")}
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              {t("about.title")}{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
                {t("about.titleHighlight")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 max-w-4xl mx-auto leading-relaxed">
              {t("about.description")}
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
                {t("about.mission.badge")}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {t("about.mission.title")}
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {t("about.mission.description1")}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t("about.mission.description2")}
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
                      {t(stat.valueKey)}
                    </div>
                    <div className="text-gray-600">{t(stat.labelKey)}</div>
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
              {t("about.values.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t("about.values.title")}
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
                    {t(value.titleKey)}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {t(value.descriptionKey)}
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
              {t("about.timeline.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t("about.timeline.title")}
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
                        <div className="text-gray-600">{t(item.eventKey)}</div>
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
                        <div className="text-gray-600">{t(item.eventKey)}</div>
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