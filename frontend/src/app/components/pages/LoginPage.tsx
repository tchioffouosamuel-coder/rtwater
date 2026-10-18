import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useSeo } from '../../../lib/seo';
import { useI18n } from '../../../i18n/I18nContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, LogIn, Droplets, Shield, Truck, Award, ArrowLeft } from 'lucide-react';
import { useUserAuth } from '../../../context/UserAuthContext';


const BENEFITS = [
  { icon: Droplets, fr: 'Produits de traitement d\'eau certifiés', en: 'Certified water treatment products' },
  { icon: Shield,   fr: 'Paiement sécurisé et données protégées', en: 'Secure payment and protected data' },
  { icon: Truck,    fr: 'Livraison gratuite à Yaoundé', en: 'Free delivery in Yaoundé' },
  { icon: Award,    fr: 'Garantie qualité sur tous les produits', en: 'Quality guarantee on every product' },
];

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const navState = (location.state ?? {}) as { from?: string; notice?: string; email?: string };
  const [email, setEmail]               = useState(navState.email ?? '');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const { login } = useUserAuth();
  const navigate  = useNavigate();
  const { tx, language } = useI18n();

  useSeo({ title: tx('Connexion', 'Sign in'), path: '/login', noindex: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      // Retour à la page d'origine (ex. /profile, /orders) plutôt qu'à la boutique
      navigate(navState.from && navState.from !== '/login' ? navState.from : '/shop', { replace: true });
    } catch (err: any) {
      // On distingue les causes : sans cela une panne réseau ou une erreur
      // serveur s'affichait comme « mot de passe incorrect » et masquait le vrai problème.
      const status = err?.status as number | undefined;
      if (status === 429) {
        setError(tx('Trop de tentatives. Patientez une minute avant de réessayer.', 'Too many attempts. Please wait a minute and try again.'));
      } else if (status === 401 || status === 422) {
        setError(tx('Email ou mot de passe incorrect. Veuillez réessayer.', 'Incorrect email or password. Please try again.'));
      } else if (status === undefined) {
        setError(tx('Connexion au serveur impossible. Vérifiez votre réseau puis réessayez.', 'Could not reach the server. Check your connection and try again.'));
      } else {
        setError(tx(`Le serveur a répondu une erreur (${status}). Réessayez plus tard.`, `The server returned an error (${status}). Please try again later.`));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-800 flex-col items-center justify-center p-12">
        <div className="absolute bottom-0 right-0 h-1 w-2/3 bg-aqua-500" />

        <div className="relative z-10 max-w-sm text-white">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-12"
          >
            <img src="/logo-transparent.webp" alt="RT Water" className="h-14 w-auto object-contain" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold leading-tight mb-4"
          >
            {tx("L'eau pure,", "Pure water,")}<br />
            <span className="text-white/80">{tx("à votre service", "at your service")}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-white/70 text-base leading-relaxed mb-10"
          >
            {tx("Spécialiste du traitement de l'eau à Yaoundé, Cameroun. Des solutions certifiées pour votre santé et votre confort.", "Water treatment specialist in Yaoundé, Cameroon. Certified solutions for your health and comfort.")}
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-ink-50 dark:bg-ink-950 relative overflow-hidden">
        {/* Subtle background circles */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-aqua-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-600/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo (visible only on small screens) */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src="/logo-transparent.webp" alt="RT Water" className="h-11 w-auto object-contain" />
          </div>

          {/* Back to home */}
          <div className="hidden lg:block mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400 hover:text-brand-600 dark:hover:text-aqua-500 transition-colors group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              {tx("Retour au site", "Back to site")}
            </Link>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-xl shadow-ink-200/60 dark:shadow-black/30 border border-ink-100 dark:border-ink-700 p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white">
                {tx("Bon retour !", "Welcome back!")}
              </h2>
              <p className="text-ink-500 dark:text-ink-400 text-sm mt-1.5">
                {tx("Connectez-vous à votre compte client", "Sign in to your customer account")}
              </p>
            </div>

            {navState.notice && !error && (
              <div role="status" className="mb-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl px-4 py-3 text-sm">
                {navState.notice}
              </div>
            )}

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
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-sm font-semibold text-ink-700 dark:text-ink-200">
                  {tx("Adresse email", "Email address")}
                </label>
                <div className="relative group">
                  <Mail
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 group-focus-within:text-brand-600 transition-colors"
                  />
                  <input
                    id="login-email"
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
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-sm font-semibold text-ink-700 dark:text-ink-200">
                    {tx("Mot de passe", "Password")}
                  </label>
                  <Link to="/forgot-password" className="text-xs font-medium text-brand-600 dark:text-aqua-500 hover:underline">
                    {tx("Mot de passe oublié ?", "Forgot password?")}
                  </Link>
                </div>
                <div className="relative group">
                  <Lock
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 group-focus-within:text-brand-600 transition-colors"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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
                    aria-label={showPassword ? tx('Masquer le mot de passe', 'Hide password') : tx('Afficher le mot de passe', 'Show password')}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
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
                    {tx("Connexion en cours…", "Signing in…")}
                  </>
                ) : (
                  <>
                    <LogIn size={17} />
                    {tx("Se connecter", "Sign in")}
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider + register */}
            <div className="mt-7">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-ink-200 dark:bg-ink-700" />
                <span className="text-xs text-ink-400 dark:text-ink-500 font-medium">{tx("Nouveau client ?", "New customer?")}</span>
                <div className="flex-1 h-px bg-ink-200 dark:bg-ink-700" />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-brand-600 dark:border-aqua-500 text-brand-600 dark:text-aqua-500 text-sm font-semibold hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all"
                >
                  {tx("Créer un compte gratuitement", "Create a free account")}
                </Link>
                <Link
                  to="/shop"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-ink-200 dark:border-ink-600 text-ink-700 dark:text-ink-300 text-sm font-semibold hover:border-brand-600 dark:hover:border-aqua-500 hover:text-brand-600 dark:hover:text-aqua-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all"
                >
                  <Droplets size={16} className="text-brand-600 dark:text-aqua-500" />
                  {tx("Parcourir la boutique sans compte", "Browse the shop without an account")}
                </Link>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-ink-400 dark:text-ink-500 mt-6">
            {tx("En vous connectant, vous acceptez nos", "By signing in, you accept our")}{' '}
            <Link to="/pages/conditions-generales" className="text-brand-600 dark:text-aqua-500 hover:underline">{tx("conditions générales", "terms and conditions")}</Link>
            {' '}{tx("et notre", "and our")}{' '}
            <Link to="/pages/politique-de-confidentialite" className="text-brand-600 dark:text-aqua-500 hover:underline">{tx("politique de confidentialité", "privacy policy")}</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
