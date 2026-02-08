import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Droplets, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Toaster, toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("errors.firstNameRequired");
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("errors.lastNameRequired");
    }
    
    if (!formData.email) {
      newErrors.email = t("errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("errors.invalidEmail");
    }
    
    if (!formData.password) {
      newErrors.password = t("errors.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("auth.signup.passwordTooShort");
    } else if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      newErrors.password = t("auth.signup.passwordRequirements");
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("errors.confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.signup.passwordMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Simuler une requête d'inscription
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log("Inscription avec:", formData);
      setSuccess(true);
      toast.success(t("messages.signupSuccess"));
      
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      toast.error(t("messages.signupError"));
      console.error("Erreur d'inscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0077BE]/5 via-white to-[#00A8E8]/5"></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative z-10"
          >
            <Card className="p-8 shadow-2xl border border-[#0077BE]/10 bg-white/95 backdrop-blur-sm text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] rounded-full flex items-center justify-center shadow-lg shadow-[#0077BE]/30">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent mb-2">
                {t("auth.signup.successTitle")}
              </h1>
              <p className="text-gray-600 mb-4">
                {t("auth.signup.successMessage", { name: formData.firstName })}
              </p>
              <motion.div
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 2 }}
                className="h-1 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] rounded-full"
              />
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-8">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0077BE]/5 via-white to-[#00A8E8]/5"></div>
        
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
          className="w-full max-w-lg relative z-10"
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
                {t("auth.signup.title")}
              </h1>
              <p className="text-gray-600">{t("auth.signup.subtitle")}</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-semibold text-sm">
                    {t("auth.signup.firstName")}
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full border-[#0077BE]/20 focus:border-[#0077BE] focus:ring-[#0077BE]/20 transition-all ${
                      errors.firstName ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                  {errors.firstName && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-red-600 text-xs"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.firstName}
                    </motion.div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-semibold text-sm">
                    {t("auth.signup.lastName")}
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full border-[#0077BE]/20 focus:border-[#0077BE] focus:ring-[#0077BE]/20 transition-all ${
                      errors.lastName ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                  {errors.lastName && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-red-600 text-xs"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.lastName}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                  {t("auth.signup.email")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border-[#0077BE]/20 focus:border-[#0077BE] focus:ring-[#0077BE]/20 transition-all ${
                    errors.email ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {errors.email && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-red-600 text-xs"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                  {t("auth.signup.password")}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full border-[#0077BE]/20 focus:border-[#0077BE] focus:ring-[#0077BE]/20 transition-all ${
                    errors.password ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {errors.password && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-red-600 text-xs"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold text-sm">
                  {t("auth.signup.confirmPassword")}
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full border-[#0077BE]/20 focus:border-[#0077BE] focus:ring-[#0077BE]/20 transition-all ${
                    errors.confirmPassword ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {errors.confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-red-600 text-xs"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="terms" className="w-4 h-4 rounded border-[#0077BE]/30 text-[#0077BE]" required />
                <Label htmlFor="terms" className="text-gray-600 text-sm cursor-pointer">
                  {t("auth.signup.acceptTerms")}
                </Label>
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
                      {t("auth.signup.creating")}
                    </motion.span>
                  ) : (
                    t("auth.signup.createAccount")
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {t("auth.signup.hasAccount")} {" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-[#0077BE] hover:text-[#00A8E8] font-semibold transition-colors"
                >
                  {t("auth.login.signIn")}
                </button>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
