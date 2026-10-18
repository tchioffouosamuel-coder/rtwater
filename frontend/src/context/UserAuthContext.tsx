import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as authService from '../services/auth';
import { toast } from 'sonner';

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    roles?: string[];
    createdAt?: string;
}

interface UserAuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
    logout: () => Promise<void>;
    /** Remplace l'utilisateur courant après une mise à jour du profil */
    setUserFromApi: (apiUser: any) => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

function toUser(apiUser: any): User {
    return {
        id: String(apiUser.id),
        name: apiUser.name,
        email: apiUser.email,
        phone: apiUser.phone ?? null,
        address: apiUser.address ?? null,
        roles: apiUser.roles,
        createdAt: apiUser.created_at,
    };
}

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    // Si un jeton existe, on est « en chargement » dès le départ : évite qu'une page
    // protégée redirige vers /login avant que le profil soit récupéré.
    const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('userToken'));

    const loadMe = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await authService.me();
            if (res?.data) setUser(toUser(res.data));
        } catch (e: any) {
            setUser(null);
            // Jeton expiré ou révoqué : on le supprime pour repartir proprement
            if (e?.status === 401) localStorage.removeItem('userToken');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('userToken')) loadMe();
    }, [loadMe]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await authService.loginAsUser(email, password);
            if (res?.user) {
                setUser(toUser(res.user));
                toast('Connexion réussie', { icon: '✅' });
                // Le login renvoie un profil réduit : on complète (téléphone, adresse)
                loadMe();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async (idToken: string) => {
        setIsLoading(true);
        try {
            const res = await authService.loginWithGoogle(idToken);
            if (res?.user) {
                setUser(toUser(res.user));
                toast('Connexion réussie', { icon: '✅' });
                loadMe();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
        setIsLoading(true);
        try {
            const res = await authService.register({ name, email, password, password_confirmation: passwordConfirmation });
            if (res?.user) {
                setUser(toUser(res.user));
                toast('Compte créé avec succès', { icon: '✅' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        try { await authService.logout(); } catch { /* déjà déconnecté côté serveur */ }
        toast('Déconnecté', { icon: '✅' });
    };

    const setUserFromApi = useCallback((apiUser: any) => setUser(toUser(apiUser)), []);

    return (
        <UserAuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginWithGoogle, register, logout, setUserFromApi }}>
            {children}
        </UserAuthContext.Provider>
    );
};

export const useUserAuth = () => {
    const ctx = useContext(UserAuthContext);
    if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
    return ctx;
};
