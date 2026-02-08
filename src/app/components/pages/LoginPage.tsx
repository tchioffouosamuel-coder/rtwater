import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Droplets, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Toaster, toast } from "sonner";
import { useTheme } from "../../theme/ThemeContext";
import { useI18n } from "../../../i18n/I18nContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = t("errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("errors.invalidEmail");
    }
    
    if (!password) {
      newErrors.password = t("errors.passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Simuler une requête de connexion
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log("Connexion avec:", { email, password });
      toast.success(t("messages.loginSuccess"));
      
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      toast.error(t("messages.loginError"));
      console.error("Erreur de connexion:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 bg-white dark:bg-slate-950 transition-colors duration-300">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0077BE]/5 via-white dark:via-slate-950 to-[#00A8E8]/5"></div>
        
        {/* Animated Background Shapes */}
        <motion.div
          className="absolute top-10 -left-40 w-80 h-80 bg-gradient-to-br from-[#0077BE]/10 to-[#00A8E8]/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -right-40 w-80 h-80 bg-gradient-to-br from-[#00A8E8]/10 to-[#0077BE]/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="p-8 shadow-2xl border border-[#0077BE]/10 bg-white/95 backdrop-blur-sm">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0077BE]/30"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Droplets className="w-8 h-8 text-white" />
              </motion.div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent mb-2">
                {t("auth.login.title")}
              </h1>
              <p className="text-gray-600">{t("auth.login.subtitle")}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold">
                  {t("auth.login.email")}
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    className={`w-full border-[#0077BE]/20 focus:border-[#0077BE] focus:ring-[#0077BE]/20 transition-all ${
                      errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                  />
                  {errors.email && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 mt-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold">
                  {t("auth.login.password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className={`w-full border-[#0077BE]/20 focus:border-[#0077BE] focus:ring-[#0077BE]/20 transition-all ${
                      errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                  />
                  {errors.password && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 mt-1 text-red-600 text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer hover:text-[#0077BE] transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#0077BE]/30 text-[#0077BE]" />
                  <span>{t("auth.login.rememberMe")}</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[#0077BE] hover:text-[#00A8E8] font-semibold transition-colors"
                >
                  {t("auth.login.forgotPassword")}
                </button>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] hover:shadow-lg hover:shadow-[#0077BE]/30 text-white py-2.5 font-semibold transition-all disabled:opacity-70"
                >
                  {loading ? (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {t("auth.login.signingIn")}
                    </motion.span>
                  ) : (
                    t("auth.login.signIn")
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {t("auth.login.noAccount")}{" "}
                <button
                  onClick={() => navigate("/signin")}
                  className="text-[#0077BE] hover:text-[#00A8E8] font-semibold transition-colors"
                >
                  {t("auth.login.signUp")}
                </button>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
