import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as authService from '../services/auth';
import { toast } from 'sonner';

interface User {
    id: string;
    name: string;
    email: string;
    roles?: string[];
}

interface UserAuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
    logout: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadMe = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await authService.me();
            const data = res?.data;
            if (data) {
                setUser({ id: String(data.id), name: data.name, email: data.email, roles: data.roles });
            }
        } catch (e) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (token) loadMe();
    }, [loadMe]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await authService.loginAsUser(email, password);
            const apiUser = res?.user;
            if (apiUser) {
                setUser({ id: String(apiUser.id), name: apiUser.name, email: apiUser.email, roles: apiUser.roles });
                toast('Connexion réussie', { icon: '✅' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
        setIsLoading(true);
        try {
            const res = await authService.register({ name, email, password, password_confirmation: passwordConfirmation });
            const apiUser = res?.user;
            if (apiUser) {
                setUser({ id: String(apiUser.id), name: apiUser.name, email: apiUser.email, roles: apiUser.roles });
                toast('Compte créé avec succès', { icon: '✅' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        try { await authService.logout(); } catch { };
        toast('Déconnecté', { icon: '✅' });
    };

    return (
        <UserAuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </UserAuthContext.Provider>
    );
};

export const useUserAuth = () => {
    const ctx = useContext(UserAuthContext);
    if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
    return ctx;
};
