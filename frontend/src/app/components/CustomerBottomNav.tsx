import { Heart, Home, Package, ShoppingBag, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useUserAuth } from '../../context/UserAuthContext';

const ITEMS = [
  { path: '/', fr: 'Accueil', en: 'Home', icon: Home },
  { path: '/shop', fr: 'Boutique', en: 'Shop', icon: ShoppingBag },
  { path: '/orders', fr: 'Commandes', en: 'Orders', icon: Package },
  { path: '/favoris', fr: 'Favoris', en: 'Favorites', icon: Heart },
  { path: '/profile', fr: 'Profil', en: 'Profile', icon: UserRound },
];

export function CustomerBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tx } = useI18n();
  const { isAuthenticated, isLoading } = useUserAuth();

  if (!isAuthenticated || isLoading || location.pathname.startsWith('/admin')) return null;

  return (
    <nav
      aria-label={tx('Navigation principale', 'Main navigation')}
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink-200 bg-white/95 px-1 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-lg dark:border-white/10 dark:bg-ink-900/95 lg:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    >
      {ITEMS.map(({ path, fr, en, icon: Icon }) => {
        const active = path === '/'
          ? location.pathname === '/'
          : location.pathname === path || location.pathname.startsWith(`${path}/`);
        const label = tx(fr, en);

        return (
          <button
            key={path}
            type="button"
            onClick={() => {
              navigate(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${
              active ? 'text-brand-700 dark:text-aqua-400' : 'text-ink-500 dark:text-ink-400'
            }`}
          >
            <span className={`flex h-8 w-10 items-center justify-center rounded-xl ${active ? 'bg-brand-50 dark:bg-ink-800' : ''}`}>
              <Icon size={20} />
            </span>
            <span className="max-w-full truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
