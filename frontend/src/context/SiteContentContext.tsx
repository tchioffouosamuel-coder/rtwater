import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type {
  HomeContent,
  AboutContent,
  ContactContent,
  GalleryContent,
  HeaderContent,
  FooterContent,
} from "../types/site-content";
import {
  DEFAULT_HOME,
  DEFAULT_ABOUT,
  DEFAULT_CONTACT,
  DEFAULT_GALLERY,
  DEFAULT_HEADER,
  DEFAULT_FOOTER,
} from "../types/site-content";
import pagesService from "../services/pages";

interface SiteContentContextType {
  home: HomeContent;
  about: AboutContent;
  contact: ContactContent;
  gallery: GalleryContent;
  header: HeaderContent;
  footer: FooterContent;
  isLoading: boolean;
  reload: () => void;
}

const SiteContentContext = createContext<SiteContentContextType>({
  home: DEFAULT_HOME,
  about: DEFAULT_ABOUT,
  contact: DEFAULT_CONTACT,
  gallery: DEFAULT_GALLERY,
  header: DEFAULT_HEADER,
  footer: DEFAULT_FOOTER,
  isLoading: false,
  reload: () => {},
});

function safeParseContent<T>(raw: unknown, defaults: T): T {
  try {
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { ...defaults, ...parsed } as T;
      }
    } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return { ...defaults, ...(raw as object) } as T;
    }
  } catch {
    // fall through to defaults
  }
  return defaults;
}

function parseHomeContent(raw: unknown): HomeContent {
  const content = safeParseContent(raw, DEFAULT_HOME);
  const backgroundImage = content.hero?.backgroundImage;
  const isPreviousDefault =
    backgroundImage?.includes("1543181077-099f32f30a1c") ||
    backgroundImage?.includes("beautiful-african-women-having-fun-while-fetching-water.jpg");

  if (!isPreviousDefault) return content;

  return {
    ...content,
    hero: {
      ...content.hero,
      backgroundImage: DEFAULT_HOME.hero.backgroundImage,
    },
  };
}

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [home, setHome] = useState<HomeContent>(DEFAULT_HOME);
  const [about, setAbout] = useState<AboutContent>(DEFAULT_ABOUT);
  const [contact, setContact] = useState<ContactContent>(DEFAULT_CONTACT);
  const [gallery, setGallery] = useState<GalleryContent>(DEFAULT_GALLERY);
  const [header, setHeader] = useState<HeaderContent>(DEFAULT_HEADER);
  const [footer, setFooter] = useState<FooterContent>(DEFAULT_FOOTER);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchTick, setFetchTick] = useState(0);

  const reload = useCallback(() => {
    setFetchTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const slugMap = [
      { slug: "accueil", setter: (raw: unknown) => setHome(parseHomeContent(raw)) },
      { slug: "a-propos", setter: (raw: unknown) => setAbout(safeParseContent(raw, DEFAULT_ABOUT)) },
      { slug: "contact", setter: (raw: unknown) => setContact(safeParseContent(raw, DEFAULT_CONTACT)) },
      { slug: "galerie", setter: (raw: unknown) => setGallery(safeParseContent(raw, DEFAULT_GALLERY)) },
      { slug: "site-header", setter: (raw: unknown) => setHeader(safeParseContent(raw, DEFAULT_HEADER)) },
      { slug: "site-footer", setter: (raw: unknown) => setFooter(safeParseContent(raw, DEFAULT_FOOTER)) },
    ];

    const applyAll = (pages: Record<string, any>) => {
      slugMap.forEach(({ slug, setter }) => {
        const content = pages?.[slug]?.content;
        if (content) setter(content);
      });
    };

    // Une seule requête pour les 6 blocs du site ; repli page par page si l'API est ancienne
    pagesService
      .fetchPagesBySlugs(slugMap.map((s) => s.slug))
      .then((res: any) => {
        if (cancelled) return;
        const data = res?.data;
        if (data && typeof data === "object" && !Array.isArray(data)) {
          applyAll(data);
          return;
        }
        return Promise.allSettled(
          slugMap.map(({ slug, setter }) =>
            pagesService.fetchPage(slug).then((r: any) => {
              const content = r?.data?.content ?? r?.content;
              if (!cancelled && content) setter(content);
            })
          )
        );
      })
      .catch(() => {
        // Contenus par défaut conservés
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchTick]);

  return (
    <SiteContentContext.Provider
      value={{ home, about, contact, gallery, header, footer, isLoading, reload }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContentContextType {
  return useContext(SiteContentContext);
}
