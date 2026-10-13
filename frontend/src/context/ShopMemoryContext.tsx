import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useI18n } from "../i18n/I18nContext";

/**
 * Favoris et produits récemment consultés.
 * Conservés dans le navigateur du visiteur (sans compte), comme sur les grands sites marchands.
 */

export interface RememberedProduct {
  id: string;
  name: string;
  price: number;
  discount: number;
  image: string;
}

interface ShopMemoryContextType {
  favorites: RememberedProduct[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: RememberedProduct) => void;
  recentlyViewed: RememberedProduct[];
  rememberViewed: (product: RememberedProduct) => void;
}

const FAVORITES_KEY = "rt_favorites";
const RECENT_KEY = "rt_recently_viewed";
const MAX_RECENT = 12;
const MAX_FAVORITES = 100;

const ShopMemoryContext = createContext<ShopMemoryContextType | undefined>(undefined);

function read(key: string): RememberedProduct[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((p) => p && p.id && p.name) : [];
  } catch {
    return []; // navigation privée ou stockage bloqué : la fonction reste utilisable pour la session
  }
}

function write(key: string, value: RememberedProduct[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage plein ou bloqué : on garde l'état en mémoire
  }
}

function snapshot(p: RememberedProduct): RememberedProduct {
  return { id: String(p.id), name: p.name, price: Number(p.price) || 0, discount: Number(p.discount) || 0, image: p.image || "" };
}

export function ShopMemoryProvider({ children }: { children: ReactNode }) {
  const { tx } = useI18n();
  const [favorites, setFavorites] = useState<RememberedProduct[]>(() => read(FAVORITES_KEY));
  const [recentlyViewed, setRecentlyViewed] = useState<RememberedProduct[]>(() => read(RECENT_KEY));

  useEffect(() => write(FAVORITES_KEY, favorites), [favorites]);
  useEffect(() => write(RECENT_KEY, recentlyViewed), [recentlyViewed]);

  // Synchronise les onglets ouverts en même temps
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) setFavorites(read(FAVORITES_KEY));
      if (e.key === RECENT_KEY) setRecentlyViewed(read(RECENT_KEY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const isFavorite = useCallback((id: string) => favoriteIds.has(String(id)), [favoriteIds]);

  const toggleFavorite = useCallback((product: RememberedProduct) => {
    const p = snapshot(product);
    const removing = favoriteIds.has(p.id);
    setFavorites((prev) =>
      removing ? prev.filter((f) => f.id !== p.id) : [p, ...prev.filter((f) => f.id !== p.id)].slice(0, MAX_FAVORITES)
    );
    toast(
      removing ? tx("Retiré des favoris", "Removed from favourites") : tx("Ajouté aux favoris", "Added to favourites"),
      { icon: removing ? "🤍" : "❤️" }
    );
  }, [favoriteIds, tx]);

  const rememberViewed = useCallback((product: RememberedProduct) => {
    const p = snapshot(product);
    setRecentlyViewed((prev) => [p, ...prev.filter((r) => r.id !== p.id)].slice(0, MAX_RECENT));
  }, []);

  return (
    <ShopMemoryContext.Provider value={{ favorites, isFavorite, toggleFavorite, recentlyViewed, rememberViewed }}>
      {children}
    </ShopMemoryContext.Provider>
  );
}

export function useShopMemory() {
  const ctx = useContext(ShopMemoryContext);
  if (!ctx) throw new Error("useShopMemory must be used within ShopMemoryProvider");
  return ctx;
}
