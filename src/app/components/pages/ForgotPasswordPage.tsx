import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Droplets, ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Toaster, toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [step, setStep] = useState<"email" | "code" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (): boolean => {
    if (!email) {
      setErrors({ email: t("errors.emailRequired") });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: t("errors.invalidEmail") });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateCode = (): boolean => {
    if (!code || code.length !== 6) {
      setErrors({ code: t("errors.codeRequired") });
      return false;
    }
    setErrors({});
    return true;
  };

  const validatePassword = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!password) {
      newErrors.password = t("errors.passwordRequired");
    } else if (password.length < 8) {
      newErrors.password = t("auth.signup.passwordTooShort");
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = t("errors.confirmPasswordRequired");
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t("auth.signup.passwordMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t("auth.messages.sending"));
      setStep("code");
      setErrors({});
    } catch (error) {
      toast.error(t("auth.messages.loginError"));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCode()) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t("auth.messages.verifying"));
      setStep("password");
      setErrors({});
    } catch (error) {
      toast.error(t("errors.codeInvalid"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t("auth.messages.resetting"));
      setStep("success");
      setErrors({});
    } catch (error) {
      toast.error(t("auth.messages.loginError"));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4">
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

            {/* Step Indicator */}
            {step !== "success" && (
              <div className="flex justify-between mb-8">
                {["email", "code", "password"].map((s, i) => (
                  <motion.div
                    key={s}
                    className={`flex-1 h-1 mx-1 rounded-full transition-all ${
                      ["email", "code", "password"].indexOf(step) >= i
                        ? "bg-gradient-to-r from-[#0077BE] to-[#00A8E8]"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Email Step */}
            {step === "email" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent mb-2">
                    {t("auth.forgotPassword.title")}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {t("auth.forgotPassword.emailStep")}
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-semibold">
                      {t("auth.login.email")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0077BE]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({});
                        }}
                        className={`w-full pl-10 border-[#0077BE]/20 focus:border-[#0077BE] focus:ring-[#0077BE]/20 transition-all ${
                          errors.email ? "border-red-500 focus:border-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-red-600 text-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </motion.div>
                    )}
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
                      {loading ? t("auth.messages.sending") : t("auth.forgotPassword.sendCode")}
                    </Button>
                  </motion.div>
                </form>
              </>
            )}

            {/* Code Step */}
            {step === "code" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent mb-2">
                    {t("auth.forgotPassword.codeStep")}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {t("auth.forgotPassword.emailStep")}
                  </p>
                </div>

                <form onSubmit={handleCodeSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-gray-700 font-semibold">
                      {t("auth.forgotPassword.codeInput")}
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, ""));
                        if (errors.code) setErrors({});
                      }}
                      className={`w-full text-center tracking-widest border-[#0077BE]/20 focus:border-[#0077BE] focus:ring-[#0077BE]/20 text-2xl font-bold transition-all ${
                        errors.code ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    />
                    {errors.code && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-red-600 text-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.code}
                      </motion.div>
                    )}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading || code.length !== 6}
                      className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] hover:shadow-lg hover:shadow-[#0077BE]/30 text-white py-2.5 font-semibold transition-all disabled:opacity-70"
                    >
                      {loading ? t("auth.messages.verifying") : t("auth.forgotPassword.verifyCode")}
                    </Button>
                  </motion.div>

                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="w-full text-[#0077BE] hover:text-[#00A8E8] font-semibold text-sm transition-colors"
                  >
                    {t("auth.forgotPassword.useOtherEmail")}
                  </button>
                </form>
              </>
            )}

            {/* Password Step */}
            {step === "password" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent mb-2">
                    {t("auth.forgotPassword.passwordStep")}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {t("auth.signup.password")}
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-semibold">
                      {t("auth.signup.password")}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: "" });
                      }}
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
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">
                      {t("auth.signup.confirmPassword")}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                      }}
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

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] hover:shadow-lg hover:shadow-[#0077BE]/30 text-white py-2.5 font-semibold transition-all disabled:opacity-70"
                    >
                      {loading ? t("auth.messages.resetting") : t("auth.forgotPassword.resetPassword")}
                    </Button>
                  </motion.div>
                </form>
              </>
            )}

            {/* Success Step */}
            {step === "success" && (
              <>
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
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A8E8] bg-clip-text text-transparent mb-2">
                    {t("auth.forgotPassword.successTitle")}
                  </h1>
                  <p className="text-gray-600">
                    {t("auth.forgotPassword.successMessage")}
                  </p>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleBackToLogin}
                    className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] hover:shadow-lg hover:shadow-[#0077BE]/30 text-white py-2.5 font-semibold transition-all"
                  >
                    {t("auth.forgotPassword.backToLogin")}
                  </Button>
                </motion.div>
              </>
            )}

            {/* Back Button */}
            {step !== "success" && (
              <button
                onClick={handleBackToLogin}
                className="mt-6 w-full flex items-center justify-center gap-2 text-[#0077BE] hover:text-[#00A8E8] font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("auth.forgotPassword.backToLogin")}
              </button>
            )}
          </Card>
        </motion.div>
      </div>
    </>
  );
}