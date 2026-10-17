import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { forgotPassword, resetPassword } from "../../../services/auth";
import { useSeo } from "../../../lib/seo";
import { useI18n } from "../../../i18n/I18nContext";

const inputClass =
  "w-full pl-10 pr-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 text-ink-900 dark:text-white placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 transition-all text-sm";
const buttonClass =
  "w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-aqua-500 hover:from-brand-700 hover:to-aqua-600 shadow-lg shadow-brand-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm";

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { tx } = useI18n();
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-br from-ink-50 to-brand-50/40 dark:from-ink-950 dark:to-ink-900">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400 hover:text-brand-600 mb-5"
        >
          <ArrowLeft size={15} /> {tx("Retour à la connexion", "Back to sign in")}
        </Link>
        <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-xl border border-ink-100 dark:border-ink-700 p-8 sm:p-10">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-5">
            <KeyRound className="w-6 h-6 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">{title}</h1>
          <p className="text-ink-500 dark:text-ink-400 text-sm mt-1.5 mb-7">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm">
      {message}
    </div>
  );
}

/** /forgot-password : demande du lien de réinitialisation */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { tx } = useI18n();

  useSeo({ title: tx("Mot de passe oublié", "Forgot password"), noindex: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(
        err?.status === 429
          ? tx("Trop de demandes. Patientez une minute avant de réessayer.", "Too many requests. Please wait a minute and try again.")
          : err?.data?.errors?.email?.[0] || tx("Impossible d'envoyer le lien pour le moment. Réessayez dans un instant.", "We couldn't send the link right now. Please try again shortly.")
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title={tx("Vérifiez votre boîte mail", "Check your inbox")} subtitle={tx(`Si un compte existe pour ${email}, vous allez recevoir un lien valable 60 minutes.`, `If an account exists for ${email}, you will receive a link valid for 60 minutes.`)}>
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-xl p-4 text-sm mb-6">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{tx("Pensez à regarder dans le dossier « Courrier indésirable » si vous ne voyez rien d'ici quelques minutes.", "Check your spam folder if nothing arrives within a few minutes.")}</p>
        </div>
        <button type="button" onClick={() => setSent(false)} className="text-sm text-brand-600 hover:underline">
          {tx("Renvoyer avec une autre adresse", "Use another email address")}
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={tx("Mot de passe oublié ?", "Forgot your password?")} subtitle={tx("Indiquez l'adresse e-mail de votre compte. Nous vous envoyons un lien pour en choisir un nouveau.", "Enter your account email. We'll send you a link to choose a new one.")}>
      {error && <ErrorBox message={error} />}
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="fp-email" className="block text-sm font-semibold text-ink-700 dark:text-ink-200">{tx("Adresse e-mail", "Email address")}</label>
          <div className="relative">
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input id="fp-email" type="email" required autoComplete="email" autoFocus value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className={inputClass} />
          </div>
        </div>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {tx("Envoi…", "Sending…")}</> : tx("Recevoir le lien", "Send me the link")}
        </button>
      </form>
    </AuthCard>
  );
}

/** /reset-password?token=…&email=… : lien reçu par e-mail */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { tx } = useI18n();

  useSeo({ title: tx("Nouveau mot de passe", "New password"), noindex: true });

  if (!token || !email) {
    return (
      <AuthCard title={tx("Lien incomplet", "Incomplete link")} subtitle={tx("Ce lien de réinitialisation est invalide. Ouvrez le lien complet reçu par e-mail ou faites une nouvelle demande.", "This reset link is invalid. Open the full link from your email or request a new one.")}>
        <Link to="/forgot-password" className={buttonClass}>{tx("Faire une nouvelle demande", "Request a new link")}</Link>
      </AuthCard>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError(tx("Le mot de passe doit contenir au moins 8 caractères.", "The password must be at least 8 characters long.")); return; }
    if (password !== confirmation) { setError(tx("Les deux mots de passe ne correspondent pas.", "The two passwords do not match.")); return; }

    setLoading(true);
    try {
      await resetPassword({ token, email, password, password_confirmation: confirmation });
      navigate("/login", { replace: true, state: { notice: tx("Mot de passe modifié. Connectez-vous avec le nouveau.", "Password changed. Sign in with your new password."), email } });
    } catch (err: any) {
      setError(err?.message || tx("Ce lien est invalide ou a expiré. Faites une nouvelle demande.", "This link is invalid or has expired. Please request a new one."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title={tx("Choisissez un nouveau mot de passe", "Choose a new password")} subtitle={tx(`Pour le compte ${email}`, `For the account ${email}`)}>
      {error && (
        <>
          <ErrorBox message={error} />
          <Link to="/forgot-password" className="block -mt-2 mb-5 text-sm text-brand-600 hover:underline">
            {tx("Demander un nouveau lien", "Request a new link")}
          </Link>
        </>
      )}
      <form onSubmit={submit} className="space-y-5">
        {[
          { id: "rp-pass", label: tx("Nouveau mot de passe", "New password"), value: password, set: setPassword, auto: "new-password" },
          { id: "rp-conf", label: tx("Confirmez le mot de passe", "Confirm password"), value: confirmation, set: setConfirmation, auto: "new-password" },
        ].map((f) => (
          <div key={f.id} className="space-y-1.5">
            <label htmlFor={f.id} className="block text-sm font-semibold text-ink-700 dark:text-ink-200">{f.label}</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input id={f.id} type={show ? "text" : "password"} required minLength={8} autoComplete={f.auto}
                value={f.value} onChange={(e) => f.set(e.target.value)} className={inputClass + " pr-11"} />
              {f.id === "rp-pass" && (
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? tx("Masquer le mot de passe", "Hide password") : tx("Afficher le mot de passe", "Show password")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              )}
            </div>
          </div>
        ))}
        <p className="text-xs text-ink-500 dark:text-ink-400">{tx("8 caractères minimum.", "At least 8 characters.")}</p>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {tx("Enregistrement…", "Saving…")}</> : tx("Enregistrer le mot de passe", "Save password")}
        </button>
      </form>
    </AuthCard>
  );
}
