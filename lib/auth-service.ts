import apiClient from './api-client';

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    userId: string;
    email: string;
    fullName: string;
    workspaceId: string;
}

export interface AuthUser {
    userId: string;
    email: string;
    fullName: string;
    workspaceId: string;
}

const TOKEN_KEY = 'openclaw_access_token';
const REFRESH_KEY = 'openclaw_refresh_token';
const USER_KEY = 'openclaw_user';

class AuthService {
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
        this.setSession(response);
        return response;
    }

    setSession(data: LoginResponse) {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        localStorage.setItem(REFRESH_KEY, data.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify({
            userId: data.userId,
            email: data.email,
            fullName: data.fullName,
            workspaceId: data.workspaceId,
        }));
        apiClient.setToken(data.accessToken);
    }

    restoreSession(): AuthUser | null {
        if (typeof window === 'undefined') return null;
        const token = localStorage.getItem(TOKEN_KEY);
        const userJson = localStorage.getItem(USER_KEY);
        if (!token || !userJson) return null;
        apiClient.setToken(token);
        try {
            return JSON.parse(userJson) as AuthUser;
        } catch {
            return null;
        }
    }

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        apiClient.setToken(null);
    }

    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TOKEN_KEY);
    }
}

const authService = new AuthService();
export default authService;
