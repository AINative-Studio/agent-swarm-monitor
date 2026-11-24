'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService, { type AuthUser } from '@/lib/auth-service';
import apiClient, { onSessionExpired } from '@/lib/api-client';

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

    // lib/api-client.ts forces a dead session's tokens out of localStorage
    // (e.g. a failed token refresh -- issue #124) but has no React state of
    // its own to update. Clear `user` here so the redirect guard below fires
    // immediately instead of waiting for a future render/reload to notice
    // the tokens are gone.
    useEffect(() => {
        return onSessionExpired(() => {
            setUser(null);
        });
    }, []);

    // Propagate logout across tabs. authService.logout() only clears this
    // tab's own localStorage and in-memory apiClient token -- a different,
    // already-open tab never notices on its own (JS memory and the `user`
    // React state aren't shared across tabs/windows). The browser's `storage`
    // event fires in every OTHER tab (never the one that made the change)
    // whenever a localStorage key actually changes, so listening for the
    // access token key being removed lets every other open tab clear its own
    // session and redirect immediately, without requiring a manual reload.
    // See issue #135.
    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'openclaw_access_token' && event.newValue === null) {
                apiClient.setToken(null);
                setUser(null);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
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
