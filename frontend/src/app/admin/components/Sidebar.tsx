import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { ChevronDown, LogOut, Menu, X, LayoutDashboard, Package, FileText, ShoppingCart, Warehouse, CreditCard, Receipt, BarChart3, Settings, Star } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  requiredPermission?: string;
  submenu?: NavItem[];
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAdminAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

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
          label: 'Pages Web',
          icon: <FileText size={18} />,
          path: '/admin/pages',
          requiredPermission: 'manage_pages',
        },
        {
          label: 'Commandes',
          icon: <ShoppingCart size={18} />,
          path: '/admin/orders',
          requiredPermission: 'manage_orders',
        },
        {
          label: 'Avis Clients',
          icon: <Star size={18} />,
          path: '/admin/reviews',
          requiredPermission: 'manage_reviews',
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
                  expandedMenus.includes(item.label)
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${depth > 0 ? 'ml-0' : ''}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 transition-transform duration-300 ${
                    expandedMenus.includes(item.label) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedMenus.includes(item.label) && (
                <div className="mt-1 space-y-1 pl-2">
                  {renderNavItems(item.submenu, depth + 1)}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                depth > 0 ? 'pl-12 text-xs' : ''
              } text-slate-600 hover:text-slate-900 hover:bg-slate-100`}
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
      {/* Toggle Button Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-700 text-white p-2 rounded-lg hover:bg-slate-800 transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-slate-50 border-r border-slate-200 flex flex-col transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-8 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">RT</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">RTWater</h1>
              <p className="text-xs text-slate-500">Backoffice</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-6 py-4 border-b border-slate-200 bg-white">
            <div className="mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.name.charAt(0)}
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <div className="mt-3">
              <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {user.role === 'admin' ? 'Administrateur' : user.role === 'manager' ? 'Gestionnaire' : 'Caissier'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {renderNavItems(navItems)}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-4 bg-white">
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:text-red-700"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};
