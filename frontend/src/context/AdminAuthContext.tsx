import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as authService from '../services/auth';
import api from '../services/api';

/**
 * Session du backoffice.
 *
 * Les permissions sont désormais **envoyées par le serveur** (App\Support\Permissions)
 * et re-vérifiées à chaque appel d'API par le middleware `permission:`. Elles étaient
 * auparavant déduites d'une carte côté React et conservées dans localStorage : un
 * utilisateur pouvait s'en octroyer, et un rôle absent de la réponse retombait sur
 * « admin ». Ici, l'absence d'information ne donne aucun droit.
 */

/** Rôles définis côté serveur (App\Models\Role). */
export type AdminRole = 'admin' | 'gestionnaire' | 'secretaire' | 'comptable' | 'user';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  /** Rôle principal, pour l'affichage. Les droits passent par `permissions`. */
  role: AdminRole;
  roles: AdminRole[];
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

export const ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Administrateur',
  gestionnaire: 'Gestionnaire',
  secretaire: 'Secrétaire',
  comptable: 'Comptable',
  user: 'Client',
};

const VALID_ROLES: AdminRole[] = ['admin', 'gestionnaire', 'secretaire', 'comptable', 'user'];

/** Normalise la charge utile renvoyée par /login ou /me. */
function toAdminUser(payload: any, fallbackEmail = ''): AdminUser | null {
  if (!payload) return null;

  const roles: AdminRole[] = Array.isArray(payload.roles)
    ? payload.roles.filter((r: any): r is AdminRole => VALID_ROLES.includes(r))
    : [];

  const permissions: string[] = Array.isArray(payload.permissions)
    ? payload.permissions.filter((p: any) => typeof p === 'string')
    : [];

  return {
    id: String(payload.id ?? ''),
    email: payload.email ?? fallbackEmail,
    name: payload.name ?? '',
    // Pas de rôle reconnu → 'user', le moins privilégié. Jamais 'admin' par défaut.
    role: roles[0] ?? 'user',
    roles,
    permissions,
  };
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  // true pendant la lecture de localStorage : évite que ProtectedRoute
  // redirige vers /admin/login avant la réhydratation
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.loginAsAdmin(email, password);
      const newUser = toAdminUser(res?.user, email);

      if (!newUser) {
        throw new Error('Réponse de connexion inattendue.');
      }

      // Un compte sans aucune permission n'a rien à faire dans le backoffice :
      // on refuse ici plutôt que de le laisser buter sur des 403 écran par écran.
      if (newUser.permissions.length === 0) {
        localStorage.removeItem('adminToken');
        throw new Error("Ce compte n'a pas accès au backoffice.");
      }

      setUser(newUser);
      localStorage.setItem('adminUser', JSON.stringify(newUser));
      // adminToken est déjà posé par loginAsAdmin
    } catch (error) {
      setUser(null);
      localStorage.removeItem('adminUser');
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

  const hasPermission = useCallback(
    (permission: string) => !!user && user.permissions.includes(permission),
    [user],
  );

  const hasRole = useCallback(
    (role: AdminRole) => !!user && user.roles.includes(role),
    [user],
  );

  // Réhydratation : on restaure l'affichage, puis on redemande au serveur la
  // liste à jour. C'est la réponse de /me qui fait foi, pas le localStorage —
  // une permission retirée côté serveur disparaît donc au rechargement.
  React.useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    const savedToken = localStorage.getItem('adminToken');

    if (!savedUser || !savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const restored = toAdminUser(JSON.parse(savedUser));
      if (restored && restored.permissions.length > 0) setUser(restored);
    } catch {
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminToken');
      setIsLoading(false);
      return;
    }

    api.request('/me', { method: 'GET', silent: true })
      .then((res: any) => {
        const fresh = toAdminUser(res?.data);

        if (!fresh || fresh.permissions.length === 0) {
          setUser(null);
          localStorage.removeItem('adminUser');
          localStorage.removeItem('adminToken');
          return;
        }

        setUser(fresh);
        localStorage.setItem('adminUser', JSON.stringify(fresh));
      })
      .catch(() => {
        // Jeton révoqué (redémarrage serveur, reconnexion ailleurs) : on nettoie
        setUser(null);
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminToken');
      })
      .finally(() => setIsLoading(false));
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
  if (!context) {
    throw new Error('useAdminAuth doit être utilisé dans un AdminAuthProvider');
  }
  return context;
};
