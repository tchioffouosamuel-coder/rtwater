import React from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Sidebar } from '../components/Sidebar';
import { ChevronRight, Bell, Settings } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  breadcrumbs,
}) => {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-64 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
              )}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {crumb.path ? (
                        <a href={crumb.path} className="text-slate-600 hover:text-slate-900 transition">
                          {crumb.label}
                        </a>
                      ) : (
                        <span className="text-slate-500">{crumb.label}</span>
                      )}
                      {index < breadcrumbs.length - 1 && (
                        <ChevronRight size={16} className="text-slate-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
            
            {/* Top Bar Actions */}
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
                <Bell size={20} />
              </button>
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
