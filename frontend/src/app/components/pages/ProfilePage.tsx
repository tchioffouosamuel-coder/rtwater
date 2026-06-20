import React from 'react';
import { useUserAuth } from '../../../context/UserAuthContext';

export const ProfilePage: React.FC = () => {
    const { user } = useUserAuth();

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Vous n'êtes pas connecté.</p>
        </div>
    );

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl p-6 shadow">
                <h1 className="text-2xl font-bold mb-4">Mon profil</h1>
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-gray-500">Nom</p>
                        <p className="font-medium text-gray-900">{user.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Rôles</p>
                        <p className="font-medium text-gray-900">{(user.roles || []).join(', ')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
