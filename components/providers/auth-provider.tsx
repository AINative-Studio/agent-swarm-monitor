'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService, { type AuthUser } from '@/lib/auth-service';

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    isLoading: true,
    login: async () => {},
    logout: () => {},
});

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const restored = authService.restoreSession();
        setUser(restored);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isLoading && !user && pathname !== '/login') {
            router.replace('/login');
        }
    }, [isLoading, user, pathname, router]);

    const login = useCallback(async (email: string, password: string) => {
        const response = await authService.login(email, password);
        setUser({
            userId: response.userId,
            email: response.email,
            fullName: response.fullName,
            workspaceId: response.workspaceId,
        });
        router.replace('/');
    }, [router]);

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
        router.replace('/login');
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
            </div>
        );
    }

    if (!user && pathname !== '/login') {
        return null;
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
