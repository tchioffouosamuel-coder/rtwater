import React, { useState } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Identifiants invalides. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-10"></div>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/logo.webp" alt="RT Water" className="h-14 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Connexion</h2>
          <p className="text-slate-400">Accédez à votre tableau de bord</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></div>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-[#00A8E8] focus:ring-2 focus:ring-[#00A8E8]/20 outline-none transition"
                placeholder="votre@email.com"
                autoComplete="username"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-[#00A8E8] focus:ring-2 focus:ring-[#00A8E8]/20 outline-none transition pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0077BE] to-[#00A8E8] hover:from-[#005f9e] hover:to-[#0095D9] disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>RT Water Solution © {new Date().getFullYear()}. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};