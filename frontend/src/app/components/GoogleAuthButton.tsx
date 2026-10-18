import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityApi {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select: boolean;
    cancel_on_tap_outside: boolean;
  }) => void;
  renderButton: (
    element: HTMLElement,
    options: {
      theme: 'outline';
      size: 'large';
      shape: 'rectangular';
      text: 'signin_with' | 'signup_with';
      width: number;
      locale: string;
    },
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    const loaded = () => {
      if (window.google?.accounts.id) {
        if (script) script.dataset.loaded = 'true';
        resolve();
      } else {
        reject(new Error('Google Identity Services did not initialize.'));
      }
    };
    const failed = () => reject(new Error('Google Identity Services could not be loaded.'));

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.addEventListener('load', loaded, { once: true });
      script.addEventListener('error', failed, { once: true });
      document.head.appendChild(script);
    } else if (script.dataset.loaded === 'true' && window.google?.accounts.id) {
      resolve();
    } else {
      script.addEventListener('load', loaded, { once: true });
      script.addEventListener('error', failed, { once: true });
    }
  }).catch(error => {
    googleScriptPromise = null;
    throw error;
  });

  return googleScriptPromise;
}

interface GoogleAuthButtonProps {
  text: 'signin_with' | 'signup_with';
  disabled?: boolean;
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
}

export function GoogleAuthButton({ text, disabled = false, onCredential, onError }: GoogleAuthButtonProps) {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onCredential, onError });
  const [loadError, setLoadError] = useState(false);
  const { language, tx } = useI18n();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    callbacks.current = { onCredential, onError };
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId || !container.current) return;
    let active = true;

    loadGoogleIdentity()
      .then(() => {
        if (!active || !container.current || !window.google?.accounts.id) return;
        container.current.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: response => {
            if (!active) return;
            if (response.credential) callbacks.current.onCredential(response.credential);
            else callbacks.current.onError(tx('Google n’a pas renvoyé de jeton valide.', 'Google did not return a valid credential.'));
          },
        });
        window.google.accounts.id.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          width: Math.min(360, Math.floor(container.current.getBoundingClientRect().width)),
          locale: language,
        });
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
      container.current?.replaceChildren();
    };
  }, [clientId, language, text, tx]);

  return (
    <div>
      <div
        ref={container}
        aria-label={tx('Continuer avec Google', 'Continue with Google')}
        aria-disabled={disabled || !clientId || loadError}
        className={`flex min-h-10 justify-center ${disabled || !clientId || loadError ? 'pointer-events-none opacity-60' : ''}`}
      />
      {!clientId && (
        <p className="mt-2 text-center text-xs text-ink-500">
          {tx('La connexion Google nécessite une configuration.', 'Google sign-in needs to be configured.')}
        </p>
      )}
      {loadError && (
        <p role="status" className="mt-2 text-center text-xs text-red-600">
          {tx('Le service Google est indisponible. Réessayez plus tard.', 'Google sign-in is unavailable. Please try again later.')}
        </p>
      )}
    </div>
  );
}
