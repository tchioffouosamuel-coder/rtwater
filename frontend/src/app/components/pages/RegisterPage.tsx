import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, UserPlus, Droplets, Shield, Truck, Award, ArrowLeft, User } from 'lucide-react';
import { useUserAuth } from '../../../context/UserAuthContext';
import { useI18n } from '../../../i18n/I18nContext';
import { useSeo } from "../../../lib/seo";


const BENEFITS = [
  { icon: Droplets, fr: 'Produits de traitement d\'eau certifiés', en: 'Certified water treatment products' },
  { icon: Shield,   fr: 'Paiement sécurisé et données protégées', en: 'Secure payment and protected data' },
  { icon: Truck,    fr: 'Livraison gratuite à Yaoundé', en: 'Free delivery in Yaoundé' },
  { icon: Award,    fr: 'Garantie qualité sur tous les produits', en: 'Quality guarantee on every product' },
];

function Bubble({ delay, size, x, duration }: { delay: number; size: number; x: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/10 backdrop-blur-sm"
      style={{ width: size, height: size, left: `${x}%`, bottom: -size }}
      animate={{ y: [0, -(600 + size)], opacity: [0, 0.6, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
}

export const RegisterPage: React.FC = () => {
  const { tx, language } = useI18n();
  useSeo({ title: tx("Créer un compte", "Create an account"), path: "/register", noindex: true });
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [error, setError]                 = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const { register } = useUserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(tx('Les mots de passe ne correspondent pas.', 'The passwords do not match.'));
      return;
    }
    if (password.length < 8) {
      setError(tx('Le mot de passe doit contenir au moins 8 caractères.', 'The password must be at least 8 characters long.'));
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, confirmPassword);
      navigate('/shop');
    } catch (err: any) {
      // err.data is the raw Laravel JSON body; err.message is the top-level "message" field
      const data = err?.data ?? {};
      const fieldErrors: string[] = Object.values(data?.errors ?? {}).flat() as string[];
      const firstFieldError = fieldErrors[0] ?? '';
      const topMsg = err?.message ?? '';

      if (firstFieldError) {
        setError(firstFieldError);
      } else if (topMsg.toLowerCase().includes('email') || topMsg.toLowerCase().includes('already')) {
        setError(tx('Cette adresse email est déjà utilisée.', 'This email address is already in use.'));
      } else if (topMsg) {
        setError(topMsg);
      } else {
        setError(tx('Une erreur est survenue. Veuillez réessayer.', 'Something went wrong. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const bubbles = [
    { delay: 0,   size: 14, x: 10, duration: 8  },
    { delay: 2,   size: 22, x: 25, duration: 11 },
    { delay: 1.5, size: 10, x: 40, duration: 7  },
    { delay: 3,   size: 18, x: 55, duration: 10 },
    { delay: 0.5, size: 26, x: 70, duration: 13 },
    { delay: 4,   size: 12, x: 82, duration: 9  },
    { delay: 2.5, size: 20, x: 90, duration: 12 },
  ];

  const passwordStrength = (() => {
    if (!password) return null;
    if (password.length < 8) return { level: 0, label: tx('Trop court', 'Too short'), color: 'bg-red-400' };
    let score = 0;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score === 0) return { level: 1, label: tx('Faible', 'Weak'), color: 'bg-orange-400' };
    if (score === 1) return { level: 2, label: tx('Moyen', 'Medium'), color: 'bg-yellow-400' };
    return { level: 3, label: tx('Fort', 'Strong'), color: 'bg-green-400' };
  })();

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-aqua-500 flex-col items-center justify-center p-12">
        {bubbles.map((b, i) => <Bubble key={i} {...b} />)}

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5"
            animate={{ scale: [1, 1.15, 1], rotate: [0, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5"
            animate={{ scale: [1.1, 1, 1.1], rotate: [0, -15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 max-w-sm text-white">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-12"
          >
            <img src="/logo.webp" alt="RT Water" className="h-14 w-auto object-contain" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold leading-tight mb-4"
          >
            {tx("Rejoignez-nous,", "Join us,")}<br />
            <span className="text-white/80">{tx("c'est gratuit", "it's free")}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-white/70 text-base leading-relaxed mb-10"
          >
            {tx("Créez votre compte et accédez à nos produits de traitement d'eau certifiés, livrés directement chez vous à Yaoundé.", "Create your account to order certified water treatment products, delivered to your door in Yaoundé.")}
          </motion.p>

          <div className="space-y-4">
            {BENEFITS.map(({ icon: Icon, fr, en }, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + idx * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-white/85 text-sm">{language === 'en' ? en : fr}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-ink-50 to-brand-50/40 dark:from-ink-950 dark:to-ink-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-aqua-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-600/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src="/logo.webp" alt="RT Water" className="h-11 w-auto object-contain" />
          </div>

          {/* Back to login */}
          <div className="hidden lg:block mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400 hover:text-brand-600 dark:hover:text-aqua-500 transition-colors group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              {tx("Déjà un compte ? Se connecter", "Already have an account? Sign in")}
            </Link>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-xl shadow-ink-200/60 dark:shadow-black/30 border border-ink-100 dark:border-ink-700 p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white">
                {tx("Créer un compte", "Create an account")}
              </h2>
              <p className="text-ink-500 dark:text-ink-400 text-sm mt-1.5">
                {tx("Rejoignez RT Water Solution en quelques secondes", "Join RT Water Solution in seconds")}
              </p>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm">
                    <span className="text-red-500 mt-0.5">⚠</span>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink-700 dark:text-ink-200">
                  {tx("Nom complet", "Full name")}
                </label>
                <div className="relative group">
                  <User
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 group-focus-within:text-brand-600 transition-colors"
                  />
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 dark:focus:border-aqua-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink-700 dark:text-ink-200">
                  {tx("Adresse email", "Email address")}
                </label>
                <div className="relative group">
                  <Mail
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 group-focus-within:text-brand-600 transition-colors"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={tx("votre@email.com", "you@email.com")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 dark:focus:border-aqua-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink-700 dark:text-ink-200">
                  {tx("Mot de passe", "Password")}
                </label>
                <div className="relative group">
                  <Lock
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 group-focus-within:text-brand-600 transition-colors"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 dark:focus:border-aqua-500 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {passwordStrength && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength.level ? passwordStrength.color : 'bg-ink-200 dark:bg-ink-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-ink-400 dark:text-ink-500">{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink-700 dark:text-ink-200">
                  {tx("Confirmer le mot de passe", "Confirm password")}
                </label>
                <div className="relative group">
                  <Lock
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 group-focus-within:text-brand-600 transition-colors"
                  />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border bg-ink-50 dark:bg-ink-700 text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-300 dark:border-red-700 focus:ring-red-200/40 focus:border-red-400'
                        : 'border-ink-200 dark:border-ink-600 focus:ring-brand-600/25 focus:border-brand-600 dark:focus:border-aqua-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors p-0.5"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.015 }}
                whileTap={{ scale: isLoading ? 1 : 0.985 }}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-aqua-500 hover:from-brand-700 hover:to-aqua-600 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm mt-2"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                    />
                    {tx("Création du compte…", "Creating account…")}
                  </>
                ) : (
                  <>
                    <UserPlus size={17} />
                    {tx("Créer mon compte", "Create my account")}
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider + login */}
            <div className="mt-7">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-ink-200 dark:bg-ink-700" />
                <span className="text-xs text-ink-400 dark:text-ink-500 font-medium">{tx("Déjà inscrit ?", "Already registered?")}</span>
                <div className="flex-1 h-px bg-ink-200 dark:bg-ink-700" />
              </div>

              <div className="mt-5">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-ink-200 dark:border-ink-600 text-ink-700 dark:text-ink-300 text-sm font-semibold hover:border-brand-600 dark:hover:border-aqua-500 hover:text-brand-600 dark:hover:text-aqua-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all"
                >
                  {tx("Se connecter à mon compte", "Sign in to my account")}
                </Link>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-ink-400 dark:text-ink-500 mt-6">
            {tx("En créant un compte, vous acceptez nos", "By creating an account, you accept our")}{' '}
            <Link to="/pages/conditions-generales" className="text-brand-600 dark:text-aqua-500 hover:underline">{tx("conditions générales", "terms and conditions")}</Link>
            {' '}{tx("et notre", "and our")}{' '}
            <Link to="/pages/politique-de-confidentialite" className="text-brand-600 dark:text-aqua-500 hover:underline">{tx("politique de confidentialité", "privacy policy")}</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
