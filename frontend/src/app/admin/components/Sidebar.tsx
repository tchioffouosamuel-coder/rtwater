import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth, ROLE_LABELS } from '../../../context/AdminAuthContext';
import { ChevronDown, LogOut, Plus, X, LayoutDashboard, Package, FileText, FileSpreadsheet, FolderTree, Newspaper, Tag, Users, Wrench, ShoppingCart, Warehouse, CreditCard, Receipt, BarChart3, Settings, Star, FileQuestion } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  requiredPermission?: string;
  submenu?: NavItem[];
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAdminAuth();
  const [showMore, setShowMore] = useState(false);
  const gestionPaths = [
    '/admin/products',
    '/admin/categories',
    '/admin/services',
    '/admin/pages',
    '/admin/blog',
    '/admin/orders',
    '/admin/customers',
    '/admin/reviews',
    '/admin/quotes',
  ];
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() =>
    gestionPaths.some(path => location.pathname.startsWith(path)) ? ['Gestion'] : []
  );
  const isGestionExpanded = expandedMenus.includes('Gestion');

  React.useEffect(() => setShowMore(false), [location.pathname]);
  React.useEffect(() => {
    if (!showMore) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowMore(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showMore]);

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      path: '/admin/dashboard',
      requiredPermission: 'view_dashboard',
    },
    {
      label: 'Gestion',
      icon: <Package size={20} />,
      path: '#',
      submenu: [
        {
          label: 'Produits',
          icon: <Package size={18} />,
          path: '/admin/products',
          requiredPermission: 'manage_products',
        },
        {
          label: 'Catégories',
          icon: <FolderTree size={18} />,
          path: '/admin/categories',
          requiredPermission: 'manage_categories',
        },
        {
          label: 'Prestations',
          icon: <Wrench size={18} />,
          path: '/admin/services',
          requiredPermission: 'manage_services',
        },
        {
          label: 'Import Excel',
          icon: <FileSpreadsheet size={18} />,
          path: '/admin/products/import',
          requiredPermission: 'manage_products',
        },
        {
          label: 'Pages Web',
          icon: <FileText size={18} />,
          path: '/admin/pages',
          requiredPermission: 'manage_pages',
        },
        {
          label: 'Blog',
          icon: <Newspaper size={18} />,
          path: '/admin/blog',
          requiredPermission: 'manage_blog',
        },
        {
          label: 'Commandes',
          icon: <ShoppingCart size={18} />,
          path: '/admin/orders',
          requiredPermission: 'manage_orders',
        },
        {
          label: 'Clients',
          icon: <Users size={18} />,
          path: '/admin/customers',
          requiredPermission: 'manage_customers',
        },
        {
          label: 'Avis Clients',
          icon: <Star size={18} />,
          path: '/admin/reviews',
          requiredPermission: 'manage_reviews',
        },
        {
          label: 'Demandes de devis',
          icon: <FileQuestion size={18} />,
          path: '/admin/quotes',
          requiredPermission: 'manage_orders',
        },
      ],
    },
    {
      label: 'Inventaire',
      icon: <Warehouse size={20} />,
      path: '/admin/inventory',
      requiredPermission: 'manage_inventory',
    },
    {
      label: 'Commercial',
      icon: <Tag size={20} />,
      path: '/admin/marketing',
      requiredPermission: 'manage_discounts',
    },
    {
      label: 'Point de Vente',
      icon: <CreditCard size={20} />,
      path: '/admin/pos',
      requiredPermission: 'manage_pos',
    },
    {
      label: 'Transactions',
      icon: <Receipt size={20} />,
      path: '/admin/receipts',
      requiredPermission: 'manage_receipts',
    },
    {
      label: 'Analytiques',
      icon: <BarChart3 size={20} />,
      path: '/admin/analytics',
      requiredPermission: 'view_analytics',
    },
    {
      label: 'Paramètres',
      icon: <Settings size={20} />,
      path: '/admin/settings',
      requiredPermission: 'manage_settings',
    },
  ];

  const accessibleItems = navItems
    .filter(item => !item.requiredPermission || hasPermission(item.requiredPermission))
    .flatMap(item => item.submenu
      ? item.submenu.filter(child => !child.requiredPermission || hasPermission(child.requiredPermission))
      : [item]);
  const preferredMobileItems = ['Dashboard', 'Commandes', 'Inventaire']
    .map(label => accessibleItems.find(item => item.label === label))
    .filter((item): item is NavItem => Boolean(item));
  const primaryMobileItems = [
    ...preferredMobileItems,
    ...accessibleItems.filter(item => !preferredMobileItems.some(primary => primary.path === item.path)),
  ].slice(0, 3);

  const renderNavItems = (items: NavItem[], depth = 0) => {
    return items
      .filter(item => !item.requiredPermission || hasPermission(item.requiredPermission))
      .map(item => (
        <div key={item.label}>
          {item.submenu ? (
            <>
              <button
                onClick={() => toggleMenu(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  (item.label === 'Gestion' ? isGestionExpanded : expandedMenus.includes(item.label))
                    ? 'bg-ink-200 text-ink-900'
                    : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100'
                } ${depth > 0 ? 'ml-0' : ''}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 transition-transform duration-300 ${
                    (item.label === 'Gestion' ? isGestionExpanded : expandedMenus.includes(item.label)) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {(item.label === 'Gestion' ? isGestionExpanded : expandedMenus.includes(item.label)) && (
                <div className="mt-1 space-y-1 pl-2">
                  {renderNavItems(item.submenu, depth + 1)}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => {
                navigate(item.path);
                setShowMore(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                depth > 0 ? 'pl-12 text-xs' : ''
              } ${
                location.pathname === item.path
                  ? 'bg-brand-100 text-brand-800'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )}
        </div>
      ));
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-ink-200 bg-ink-50 lg:flex"
      >
        {/* User Info */}
        {user && (
          <div className="border-b border-ink-200 bg-white px-6 py-4">
            <div className="mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.name.charAt(0)}
              </div>
            </div>
            <p className="text-sm font-semibold text-ink-900">{user.name}</p>
            <p className="text-xs text-ink-500 truncate">{user.email}</p>
            <div className="mt-3">
              <span className="inline-block px-2.5 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {renderNavItems(navItems)}
        </nav>

        {/* Logout */}
        <div className="border-t border-ink-200 p-4 bg-white">
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
              setShowMore(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:text-red-700"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-ink-200 bg-white/95 px-2 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-lg lg:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      >
        {primaryMobileItems.map(item => {
          const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${
                active ? 'text-brand-700' : 'text-ink-500'
              }`}
            >
              <span className={`flex h-8 w-10 items-center justify-center rounded-xl ${active ? 'bg-brand-50' : ''}`}>
                {item.icon}
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowMore(true)}
          aria-expanded={showMore}
          aria-haspopup="dialog"
          className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${
            showMore ? 'text-brand-700' : 'text-ink-500'
          }`}
        >
          <span className={`flex h-8 w-10 items-center justify-center rounded-xl ${showMore ? 'bg-brand-50' : ''}`}>
            <Plus size={22} />
          </span>
          Plus
        </button>
      </nav>

      {showMore && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink-950/45 backdrop-blur-[2px] lg:hidden" onClick={() => setShowMore(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-admin-menu-title"
            className="max-h-[82dvh] w-full overflow-y-auto rounded-t-3xl border-t border-ink-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-300" />
            <div className="mb-3 flex items-center justify-between">
              <h2 id="mobile-admin-menu-title" className="text-lg font-bold text-ink-900">Menu</h2>
              <button type="button" onClick={() => setShowMore(false)} aria-label="Fermer le menu" className="rounded-full p-2 text-ink-500 hover:bg-ink-100">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {accessibleItems.map(item => {
                const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      setShowMore(false);
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 text-left text-sm font-medium transition ${
                      active ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-ink-100 text-ink-700 hover:bg-ink-50'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="min-w-0 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 border-t border-ink-100 pt-3">
              <div className="mb-3">
                <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
                <p className="text-xs text-ink-500">{user && (ROLE_LABELS[user.role] ?? user.role)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/admin/login');
                  setShowMore(false);
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};
