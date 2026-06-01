import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
  ],
  manager: [
    'view_dashboard',
    'manage_products',
    'manage_orders',
    'manage_inventory',
    'manage_pos',
    'view_analytics',
  ],
  cashier: [
    'manage_pos',
    'manage_receipts',
    'view_inventory',
  ],
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Appel API au backend pour authentifier
      // Pour maintenant, simulation avec admin par défaut
      const mockUser: AdminUser = {
        id: '1',
        email: email,
        name: 'Admin RTWater',
        role: 'admin',
        permissions: ROLE_PERMISSIONS.admin,
      };
      
      // Simuler délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(mockUser);
      // Sauvegarder en localStorage pour persistence
      localStorage.setItem('adminUser', JSON.stringify(mockUser));
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
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const hasRole = useCallback((role: AdminRole) => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  // Charger user depuis localStorage au montage
  React.useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('adminUser');
      }
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
