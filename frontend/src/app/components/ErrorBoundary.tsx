import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "../../lib/monitoring";

interface Props {
  children: ReactNode;
  /** Change quand la page change : on retente l'affichage après une navigation */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/**
 * Filet de sécurité : une erreur JavaScript dans une page affiche un message clair
 * au lieu d'un écran blanc, et le reste du site (menu, panier) reste utilisable.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erreur d'affichage", error, info.componentStack);
    reportError(error, "boundary", info.componentStack ?? undefined);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const en = document.documentElement.lang === "en";

    return (
      <div role="alert" className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl">
            !
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{en ? "Something went wrong on this page" : "Cette page a rencontré un problème"}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {en
              ? "Your cart is safe. Reload the page or go back home. If the problem persists, contact us."
              : "Votre panier est conservé. Rechargez la page ou revenez à l'accueil. Si le problème persiste, contactez-nous."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#0077BE] to-[#00A8E8]"
            >
              {en ? "Reload page" : "Recharger la page"}
            </button>
            <a href="/" className="px-6 py-3 rounded-xl font-semibold border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200">
              {en ? "Back to home" : "Retour à l'accueil"}
            </a>
          </div>
        </div>
      </div>
    );
  }
}
