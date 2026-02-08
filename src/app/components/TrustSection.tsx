import { Award, Users, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";

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

export function TrustSection() {
  const { t } = useI18n();

  const stats = [
    {
      icon: Award,
      valueKey: "trust.experience.value",
      suffixKey: "trust.experience.suffix",
      labelKey: "trust.experience.label",
      descriptionKey: "trust.experience.description",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Users,
      valueKey: "trust.clients.value",
      suffixKey: "trust.clients.suffix",
      labelKey: "trust.clients.label",
      descriptionKey: "trust.clients.description",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: CheckCircle,
      valueKey: "trust.projects.value",
      suffixKey: "trust.projects.suffix",
      labelKey: "trust.projects.label",
      descriptionKey: "trust.projects.description",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
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
              {t("trust.sectionSubtitle")}
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {t("trust.sectionTitle")}{" "}
            <span className="bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent">
              {t("trust.sectionTitleHighlight")}
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("trust.sectionDescription")}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const value = parseInt(t(stat.valueKey));
            const suffix = t(stat.suffixKey);
            
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
                <div className="text-center p-10 rounded-3xl bg-gradient-to-br from-gray-50 to-white shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-center mb-6"
                  >
                    <div className={`relative w-20 h-20 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-2xl`}>
                      <Icon className="w-10 h-10 text-white" />
                      
                      {/* Pulse Effect */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-2xl`}
                      ></motion.div>
                    </div>
                  </motion.div>

                  {/* Counter */}
                  <Counter value={value} suffix={suffix} />

                  {/* Label */}
                  <div className="text-2xl font-bold text-gray-900 mb-3 mt-4">
                    {t(stat.labelKey)}
                  </div>
                  <div className="text-gray-600">{t(stat.descriptionKey)}</div>

                  {/* Decorative Line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 0.8 }}
                    className={`mt-6 h-1 w-20 mx-auto bg-gradient-to-r ${stat.color} rounded-full`}
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