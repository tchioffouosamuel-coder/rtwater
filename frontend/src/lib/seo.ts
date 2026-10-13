import { useEffect } from "react";

/**
 * Référencement par page (sans dépendance) : titre, description, Open Graph
 * (aperçus WhatsApp / Facebook), URL canonique et données structurées JSON-LD.
 */

export const SITE_NAME = "RT Water Solution";
export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
const DEFAULT_DESCRIPTION =
  "RT Water Solution : traitement de l'eau à Yaoundé. Filtres, osmoseurs, adoucisseurs, installation et maintenance au Cameroun. Devis gratuit.";
const DEFAULT_IMAGE = `${SITE_URL}/icon-512.png`; // < 300 Ko : accepté par les aperçus WhatsApp

interface SeoOptions {
  title?: string;
  description?: string;
  image?: string | null;
  /** Chemin de la page, ex. "/shop". Par défaut : l'URL courante. */
  path?: string;
  type?: "website" | "product" | "article";
  /** Données structurées schema.org (Product, Organization, BreadcrumbList…) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
  noindex?: boolean;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

export function useSeo({ title, description, image, path, type = "website", jsonLd, noindex }: SeoOptions) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} : traitement de l'eau au Cameroun`;
    const desc = truncate(description || DEFAULT_DESCRIPTION);
    const url = SITE_URL + (path ?? window.location.pathname);
    const img = image || DEFAULT_IMAGE;

    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", img);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", img);
    setCanonical(url);

    let script: HTMLScriptElement | null = null;
    if (jsonLdKey) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seo = "page";
      script.text = jsonLdKey;
      document.head.appendChild(script);
    }
    return () => {
      script?.remove();
    };
  }, [title, description, image, path, type, jsonLdKey, noindex]);
}
