import { Award, Users, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useSiteContent } from "../../context/SiteContentContext";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => {
        let start = 0;
        const duration = 2000;
        const increment = value / (duration / 16);

        const timer = setInterval(() => {
          start += increment;
          if (start >= value) {
            setCount(value);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);

        return () => clearInterval(timer);
      }}
      className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent"
    >
      {count}{suffix}
    </motion.div>
  );
}

const STAT_ICONS = [Award, Users, CheckCircle];
const STAT_COLORS = [
  "from-[#00A8E8] to-[#0095D9]",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
];

export function TrustSection() {
  const { home } = useSiteContent();
  const { trust } = home;
  const { theme } = useTheme();

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <pattern
            id="trust-pattern"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="5" cy="5" r="1" fill="#0077BE" />
          </pattern>
          <rect width="100" height="100" fill="url(#trust-pattern)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 sm:mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-4"
          >
            <span className="bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg border border-white/20">
              {trust.sectionSubtitle}
            </span>
          </motion.div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
            {trust.sectionTitle}{" "}
            <span className="bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent">
              {trust.sectionTitleHighlight}
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed px-2">
            {trust.sectionDescription}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {trust.stats.map((stat, index) => {
            const Icon = STAT_ICONS[index % STAT_ICONS.length];
            const color = STAT_COLORS[index % STAT_COLORS.length];
            const value = parseInt(stat.value, 10) || 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                <div className="text-center p-6 sm:p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-gray-50 dark:from-slate-800 to-white dark:to-slate-700 shadow-lg dark:shadow-xl dark:shadow-black/20 hover:shadow-2xl dark:hover:shadow-2xl dark:hover:shadow-black/30 transition-all duration-500 border border-gray-100 dark:border-slate-700 overflow-hidden">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-center mb-6"
                  >
                    <div className={`relative w-20 h-20 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-2xl`}>
                      <Icon className="w-10 h-10 text-white" />

                      {/* Pulse Effect */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl`}
                      ></motion.div>
                    </div>
                  </motion.div>

                  {/* Counter */}
                  <Counter value={value} suffix={stat.suffix} />

                  {/* Label */}
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 mt-4">
                    {stat.label}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{stat.description}</div>

                  {/* Decorative Line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 0.8 }}
                    className={`mt-4 sm:mt-6 h-1 w-16 sm:w-20 mx-auto bg-gradient-to-r ${color} rounded-full`}
                  ></motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
