import { useState } from "react";
import { motion } from "motion/react";
import { Check, Loader2, Send } from "lucide-react";
import { subscribe } from "../../services/newsletter";
import { useI18n } from "../../i18n/I18nContext";

/**
 * Formulaire d'inscription à la lettre d'information.
 *
 * Le champ du pied de page était purement décoratif : ni état, ni envoi, ni
 * retour. Un visiteur laissait son adresse et rien ne se passait.
 */
export function NewsletterForm() {
  const { tx } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = email.trim();
    if (!value) {
      setStatus("error");
      setMessage(tx("Indiquez votre adresse e-mail.", "Please enter your email address."));
      return;
    }

    setStatus("sending");
    setMessage(null);

    try {
      const confirmation = await subscribe(value, "footer");
      setStatus("done");
      setMessage(confirmation);
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(
        err?.data?.errors?.email?.[0]
          ?? err?.data?.message
          ?? tx("Inscription impossible pour le moment.", "Could not sign you up right now."),
      );
    }
  };

  const isSending = status === "sending";

  return (
    <form onSubmit={handleSubmit} className="mt-6" noValidate>
      <label htmlFor="newsletter-email" className="block text-sm text-gray-400 mb-3">
        {tx("Restez informé de nos nouveautés", "Stay informed about our news")}
      </label>

      <div className="flex gap-2">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") { setStatus("idle"); setMessage(null); }
          }}
          disabled={isSending}
          placeholder={tx("Votre adresse e-mail", "Your email address")}
          aria-invalid={status === "error"}
          aria-describedby={message ? "newsletter-feedback" : undefined}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0077BE] transition-colors disabled:opacity-60"
        />

        <motion.button
          type="submit"
          disabled={isSending}
          whileHover={isSending ? undefined : { scale: 1.05 }}
          whileTap={isSending ? undefined : { scale: 0.95 }}
          aria-label={tx("S'inscrire à la lettre d'information", "Subscribe to the newsletter")}
          className="flex-shrink-0 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] p-2 rounded-lg hover:shadow-lg hover:shadow-[#0077BE]/30 transition-all disabled:opacity-60"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : status === "done" ? (
            <Check className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {message && (
        <p
          id="newsletter-feedback"
          role="status"
          aria-live="polite"
          className={`mt-2 text-xs ${status === "error" ? "text-red-400" : "text-green-400"}`}
        >
          {message}
        </p>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
        {tx(
          "Vous pouvez vous désinscrire à tout moment. Aucune revente de vos données.",
          "You can unsubscribe at any time. We never sell your data.",
        )}
      </p>
    </form>
  );
}
