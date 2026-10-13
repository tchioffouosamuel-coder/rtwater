import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

export type Language = "fr" | "en";
type TranslationKey = string;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, defaultValue?: string) => string;
  /** Texte bilingue écrit sur place : tx("Panier", "Cart") */
  tx: (fr: string, en: string) => string;
  /** Locale pour les nombres et dates : fr-FR ou en-GB */
  locale: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations = { fr, en };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      // ?lang=en dans l'adresse : lien partageable dans une langue précise
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (fromUrl === "en" || fromUrl === "fr") {
        try { localStorage.setItem("language", fromUrl); } catch { /* stockage bloqué */ }
        return fromUrl;
      }
      let savedLang: Language | null = null;
      try { savedLang = localStorage.getItem("language") as Language | null; } catch { /* stockage bloqué */ }
      return savedLang === "en" ? "en" : "fr";
    }
    return "fr";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem("language", lang); } catch { /* stockage bloqué */ }
  };

  // Langue du document : lecteurs d'écran, traduction automatique, Google
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const tx = (fr: string, en: string): string => (language === "en" ? en : fr);
  const locale = language === "en" ? "en-GB" : "fr-FR";

  const t = (key: TranslationKey, defaultValue?: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || defaultValue || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, tx, locale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
