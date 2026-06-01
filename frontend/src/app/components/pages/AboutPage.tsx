import { motion } from "motion/react";
import { Droplet, Zap, Award, Users, Target, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useTheme } from "../../../theme/ThemeContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../ui/carousel";
import { useRef } from "react";

export function AboutPage() {
  const { t } = useI18n();
  const { theme } = useTheme();

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
      gradient: "from-[#00A8E8] to-[#0095D9]",
    },
    {
      icon: Award,
      titleKey: "about.values.expertise.title",
      descriptionKey: "about.values.expertise.description",
      gradient: "from-[#0077BE] to-[#00A8E8]",
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
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] overflow-hidden">
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
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              {t("about.badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {t("about.title")}{" "}
              <span className="bg-gradient-to-r from-[#00A8E8] to-cyan-300 bg-clip-text text-transparent">
                {t("about.titleHighlight")}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-4xl mx-auto leading-relaxed px-2">
              {t("about.description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                {t("about.mission.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                {t("about.mission.title")}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 leading-relaxed">
                {t("about.mission.description1")}
              </p>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                {t("about.mission.description2")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, boxShadow: theme === 'dark' ? '0 10px 30px rgba(0, 119, 190, 0.2)' : '0 10px 30px rgba(0, 119, 190, 0.15)' }}
                    className="bg-gradient-to-br from-gray-50 dark:from-slate-800 to-white dark:to-slate-700 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-gray-100 dark:border-slate-700 transition-all duration-300"
                  >
                    <Icon className="w-8 sm:w-10 h-8 sm:h-10 text-[#0077BE] dark:text-[#00A8E8] mb-3 sm:mb-4" />
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0077BE] dark:text-[#00A8E8] mb-2">
                      {t(stat.valueKey)}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">{t(stat.labelKey)}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 dark:from-slate-800 to-white dark:to-slate-900 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              {t("about.values.badge")}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              {t("about.values.title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, boxShadow: theme === 'dark' ? '0 20px 40px rgba(0, 119, 190, 0.15)' : '0 20px 40px rgba(0, 119, 190, 0.1)' }}
                  className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-gray-100 dark:border-slate-700 transition-all duration-300"
                >
                  <div className={`w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg`}>
                    <Icon className="w-7 sm:w-8 h-7 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    {t(value.titleKey)}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t(value.descriptionKey)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              {t("about.timeline.badge")}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              {t("about.timeline.title")}
            </h2>
          </motion.div>

          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full px-8 sm:px-12 lg:px-16 py-6"
          >
            <CarouselContent className="gap-4 sm:gap-6">
              {timeline.map((item, index) => (
                <CarouselItem key={index} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -12 }}
                    className="h-full perspective"
                  >
                    <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-slate-700 transition-all duration-300 h-full flex flex-col justify-between"
                    >
                      {/* Gradient edges effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0077BE]/10 via-transparent to-[#00A8E8]/10 pointer-events-none"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-[#0077BE]/5 via-transparent to-[#00A8E8]/5 pointer-events-none"></div>

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-baseline gap-3 mb-6">
                          <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent">
                            {item.year}
                          </div>
                          <div className="h-1 flex-1 max-w-12 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] rounded-full"></div>
                        </div>
                        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                          {t(item.eventKey)}
                        </div>
                      </div>

                      {/* Number indicator */}
                      <div className="relative z-10 mt-6 flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                        <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-[#0077BE]/10 to-[#00A8E8]/10 rounded-lg flex items-center justify-center">
                          <span className="bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation - Hidden on mobile, visible on desktop */}
            <div className="flex justify-center items-center gap-3 sm:gap-4 mt-8 sm:mt-12">
              <CarouselPrevious className="relative static w-12 sm:w-14 h-12 sm:h-14 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-md hover:shadow-lg transition-all duration-300" />
              <div className="flex gap-2">
                {timeline.map((_, index) => (
                  <motion.div
                    key={index}
                    className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full transition-all duration-300"
                    whileHover={{ scale: 1.2, backgroundColor: "#0077BE" }}
                  />
                ))}
              </div>
              <CarouselNext className="relative static w-12 sm:w-14 h-12 sm:h-14 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-md hover:shadow-lg transition-all duration-300" />
            </div>
          </Carousel>
        </div>
      </section>
    </div>
  );
}