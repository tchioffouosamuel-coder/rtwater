import { motion } from "motion/react";
import { Droplet, Zap, Award, Users, Target, Globe } from "lucide-react";
import { useTheme } from "../../../theme/ThemeContext";
import { useSiteContent } from "../../../context/SiteContentContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../ui/carousel";
import { useSeo } from "../../../lib/seo";
import { PageHeroMedia } from "../ui/PageHeroMedia";
import { ABOUT_HEADER_PHOTO } from "../../content/photos";

const ICON_MAP: Record<string, React.ElementType> = {
  droplet: Droplet,
  zap: Zap,
  award: Award,
  users: Users,
  target: Target,
  globe: Globe,
};

const STAT_ICONS: React.ElementType[] = [Award, Target, Users, Globe];

export function AboutPage() {
  useSeo({
    title: "À propos",
    description: "Découvrez RT Water Solution, votre partenaire pour une eau pure et saine au Cameroun : notre mission, nos valeurs et notre histoire.",
    path: "/about",
  });
  const { about } = useSiteContent();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 bg-brand-800 overflow-hidden">
        <PageHeroMedia photo={ABOUT_HEADER_PHOTO} />
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
              {about.heroBadge}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {about.heroTitle}{" "}
              <span className="text-white underline decoration-aqua-200/80 decoration-[6px] underline-offset-[10px]">
                {about.heroTitleHighlight}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-4xl mx-auto leading-relaxed px-2">
              {about.heroDescription}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-ink-900 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block bg-gradient-to-r from-brand-600 to-aqua-500 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                {about.missionBadge}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                {about.missionTitle}
              </h2>
              <p className="text-base sm:text-lg text-ink-600 dark:text-ink-400 mb-4 sm:mb-6 leading-relaxed">
                {about.missionDescription1}
              </p>
              <p className="text-base sm:text-lg text-ink-600 dark:text-ink-400 leading-relaxed">
                {about.missionDescription2}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {about.stats.map((stat, index) => {
                const Icon = STAT_ICONS[index % STAT_ICONS.length];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, boxShadow: theme === 'dark' ? '0 10px 30px rgba(0, 119, 190, 0.2)' : '0 10px 30px rgba(0, 119, 190, 0.15)' }}
                    className="bg-gradient-to-br from-ink-50 dark:from-ink-800 to-white dark:to-ink-700 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-ink-100 dark:border-ink-700 transition-all duration-300"
                  >
                    <Icon className="w-8 sm:w-10 h-8 sm:h-10 text-brand-600 dark:text-aqua-500 mb-3 sm:mb-4" />
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-600 dark:text-aqua-500 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm sm:text-base text-ink-600 dark:text-ink-400 font-medium">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-ink-50 dark:from-ink-800 to-white dark:to-ink-900 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block bg-gradient-to-r from-brand-600 to-aqua-500 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              {about.valuesBadge}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              {about.valuesTitle}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {about.values.map((value, index) => {
              const Icon = ICON_MAP[value.icon] ?? Droplet;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, boxShadow: theme === 'dark' ? '0 20px 40px rgba(0, 119, 190, 0.15)' : '0 20px 40px rgba(0, 119, 190, 0.1)' }}
                  className="bg-white dark:bg-ink-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-ink-100 dark:border-ink-700 transition-all duration-300"
                >
                  <div className={`w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg`}>
                    <Icon className="w-7 sm:w-8 h-7 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-ink-900 dark:text-white mb-3 sm:mb-4">
                    {value.title}
                  </h3>
                  <p className="text-sm sm:text-base text-ink-600 dark:text-ink-400 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-ink-900 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block bg-gradient-to-r from-brand-600 to-aqua-500 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              {about.timelineBadge}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              {about.timelineTitle}
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
              {about.timeline.map((item, index) => (
                <CarouselItem key={index} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -12 }}
                    className="h-full perspective"
                  >
                    <div className="relative overflow-hidden bg-white dark:bg-ink-800 rounded-2xl p-6 sm:p-8 border border-ink-100 dark:border-ink-700 transition-all duration-300 h-full flex flex-col justify-between">
                      {/* Gradient edges effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 via-transparent to-aqua-500/10 pointer-events-none"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-brand-600/5 via-transparent to-aqua-500/5 pointer-events-none"></div>

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-baseline gap-3 mb-6">
                          <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-aqua-500 bg-clip-text text-transparent">
                            {item.year}
                          </div>
                          <div className="h-1 flex-1 max-w-12 bg-gradient-to-r from-brand-600 to-aqua-500 rounded-full"></div>
                        </div>
                        <div className="text-sm sm:text-base text-ink-600 dark:text-ink-300 font-medium leading-relaxed">
                          {item.event}
                        </div>
                      </div>

                      {/* Number indicator */}
                      <div className="relative z-10 mt-6 flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-500 dark:text-ink-400">
                        <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-brand-600/10 to-aqua-500/10 rounded-lg flex items-center justify-center">
                          <span className="bg-gradient-to-r from-brand-600 to-aqua-500 bg-clip-text text-transparent">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation */}
            <div className="flex justify-center items-center gap-3 sm:gap-4 mt-8 sm:mt-12">
              <CarouselPrevious className="relative static w-12 sm:w-14 h-12 sm:h-14 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700 shadow-md hover:shadow-lg transition-all duration-300" />
              <div className="flex gap-2">
                {about.timeline.map((_, index) => (
                  <motion.div
                    key={index}
                    className="w-2 h-2 bg-ink-300 dark:bg-ink-600 rounded-full transition-all duration-300"
                    whileHover={{ scale: 1.2, backgroundColor: "#0077be" }}
                  />
                ))}
              </div>
              <CarouselNext className="relative static w-12 sm:w-14 h-12 sm:h-14 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700 shadow-md hover:shadow-lg transition-all duration-300" />
            </div>
          </Carousel>
        </div>
      </section>
    </div>
  );
}
