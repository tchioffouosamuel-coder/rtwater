import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as authService from '../services/auth';

export type AdminRole = 'admin' | 'manager' | 'cashier';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: AdminRole) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Permissions par rôle
const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  admin: [
    'view_dashboard',
    'manage_products',
    'manage_pages',
    'manage_orders',
    'manage_inventory',
    'manage_pos',
    'manage_receipts',
    'manage_users',
    'manage_settings',
    'view_analytics',
    'manage_reviews',
  ],
  manager: [
    'view_dashboard',
    'manage_products',
    'manage_orders',
    'manage_inventory',
    'manage_pos',
    'view_analytics',
    'manage_reviews',
  ],
  cashier: [
    'manage_pos',
    'manage_receipts',
    'view_inventory',
  ],
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  // true while we're checking localStorage — prevents ProtectedRoute from
  // redirecting to /admin/login before hydration completes
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.loginAsAdmin(email, password);
      const apiUser = res?.user;
      const roleFromApi = apiUser?.roles?.[0] || 'admin';

      const newUser: AdminUser = {
        id: String(apiUser?.id ?? ''),
        email: apiUser?.email ?? email,
        name: apiUser?.name ?? '',
        role: (roleFromApi as AdminRole) || 'admin',
        permissions: ROLE_PERMISSIONS[(roleFromApi as AdminRole) || 'admin'] || [],
      };

      setUser(newUser);
      localStorage.setItem('adminUser', JSON.stringify(newUser));
      // adminToken already set by loginAsAdmin via authService
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    try { authService.logout(); } catch { /* ignore */ }
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const hasRole = useCallback((role: AdminRole) => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  // Rehydrate from localStorage — runs once on mount.
  // Permissions are recomputed from ROLE_PERMISSIONS so any update takes
  // effect without requiring the user to log out and back in.
  React.useEffect(() => {
    try {
      const savedUser = localStorage.getItem('adminUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as AdminUser;
        const freshUser: AdminUser = {
          ...parsed,
          permissions: ROLE_PERMISSIONS[parsed.role] ?? [],
        };
        setUser(freshUser);
        localStorage.setItem('adminUser', JSON.stringify(freshUser));
      }
    } catch {
      localStorage.removeItem('adminUser');
    } finally {
      setIsLoading(false); // unlock ProtectedRoute regardless of outcome
    }
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
