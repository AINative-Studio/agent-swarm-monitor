/**
 * API Client
 *
 * Reusable fetch wrapper with snake_case/camelCase transformation
 * for communicating with the backend REST API.
 */

import { toast } from '@/hooks/use-toast';

// Same localStorage keys lib/auth-service.ts writes on login (kept as
// literal strings here, not imported, to avoid a circular import -- auth-service.ts
// imports apiClient as its HTTP layer). e2e/chat-history.spec.ts also seeds
// these exact literal keys directly, so don't rename without updating both.
const TOKEN_KEY = 'openclaw_access_token';
const REFRESH_KEY = 'openclaw_refresh_token';
const USER_KEY = 'openclaw_user';

type SessionExpiredListener = () => void;
const sessionExpiredListeners: SessionExpiredListener[] = [];

/**
 * Subscribe to "session is dead, no automatic recovery possible" events --
 * e.g. refresh token missing/expired after a 401. components/providers/auth-provider.tsx
 * uses this to clear its in-memory `user` state so its existing
 * `!user && pathname !== '/login'` redirect guard fires without needing a
 * full page reload. See issue #124.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
    sessionExpiredListeners.push(listener);
    return () => {
        const index = sessionExpiredListeners.indexOf(listener);
        if (index > -1) sessionExpiredListeners.splice(index, 1);
    };
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function transformKeys(obj: unknown, transformer: (key: string) => string): unknown {
    if (Array.isArray(obj)) {
        return obj.map((item) => transformKeys(item, transformer));
    }
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            result[transformer(key)] = transformKeys(value, transformer);
        }
        return result;
    }
    return obj;
}

export function snakeToCamelKeys<T>(obj: unknown): T {
    return transformKeys(obj, snakeToCamel) as T;
}

export function camelToSnakeKeys(obj: unknown): unknown {
    return transformKeys(obj, camelToSnake);
}

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public detail: string,
    ) {
        super(detail);
        this.name = 'ApiError';
    }
}

/**
 * Shape of a single error object inside FastAPI/Pydantic's structured
 * validation error array -- the `detail` field on a 422 response is this
 * array, not a string, whenever a request fails model validation (missing
 * field, wrong type, length/pattern violation, etc.). See issue #144.
 */
interface PydanticErrorDetail {
    type?: string;
    loc?: Array<string | number>;
    msg?: string;
    input?: unknown;
    ctx?: Record<string, unknown>;
}

/**
 * Normalizes a backend error response's `detail` field into a plain, safe
 * to render string. FastAPI's default 422 shape is an array of Pydantic
 * error objects (`{type, loc, msg, input, ctx}`) rather than a string --
 * passing that array through untouched onto `ApiError.detail` means any
 * consumer that renders `error.detail` directly as a React child (e.g.
 * ListErrorState) crashes the whole tree with "Objects are not valid as a
 * React child". Every shape `detail` can take is coerced here, once, before
 * it's ever stored -- this protects every consumer of ApiError, not just one
 * component. Returns null when there's nothing usable to report (caller
 * falls back to its own default).
 */
export function normalizeErrorDetail(detail: unknown): string | null {
    if (detail == null) return null;
    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
        const messages = (detail as PydanticErrorDetail[])
            .map((entry) => {
                if (typeof entry === 'string') return entry;
                if (entry && typeof entry === 'object' && typeof entry.msg === 'string') {
                    const field = Array.isArray(entry.loc) ? entry.loc.at(-1) : undefined;
                    return field ? `${field}: ${entry.msg}` : entry.msg;
                }
                return null;
            })
            .filter((msg): msg is string => Boolean(msg));
        return messages.length > 0 ? messages.join('; ') : null;
    }

    if (typeof detail === 'object') {
        const entry = detail as PydanticErrorDetail;
        if (typeof entry.msg === 'string') return entry.msg;
    }

    return null;
}

export class ApiTimeoutError extends Error {
    constructor(
        public url: string,
        public timeoutMs: number,
    ) {
        super(`Request to ${url} timed out after ${timeoutMs}ms`);
        this.name = 'ApiTimeoutError';
    }
}

/**
 * React Query `retry` option that skips retries for auth failures (401/403).
 * Retrying an unauthenticated request can't succeed, so without this a list
 * query stays in `isLoading`/`isFetching` through React Query's default 3
 * retries (with exponential backoff) before finally surfacing `isError` --
 * several extra seconds of a misleading loading state for an error that will
 * never resolve on its own. See issue #109.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
        return false;
    }
    return failureCount < 3;
}

class ApiClient {
    private baseUrl: string;
    private defaultTimeout: number = 30000; // 30 seconds
    private token: string | null = null;
    // De-dupes concurrent refresh attempts: multiple requests 401-ing around
    // the same time (e.g. several polling queries) all await this single
    // in-flight refresh call instead of each hitting /auth/refresh themselves.
    private refreshPromise: Promise<string | null> | null = null;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
    }

    setToken(token: string | null) {
        this.token = token;
    }

    private get authHeaders(): Record<string, string> {
        return this.token ? { Authorization: `Bearer ${this.token}` } : {};
    }

    private getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(REFRESH_KEY);
    }

    /**
     * Clear the dead session and tell any listeners (auth-provider.tsx) so
     * the app's existing logged-out redirect guard takes over. Issue #124:
     * once a refresh attempt fails (or there's no refresh token to try),
     * there is no automatic recovery path other than signing in again.
     */
    private forceLogout(message?: string) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            localStorage.removeItem(USER_KEY);
        }
        this.setToken(null);

        if (message) {
            toast({
                title: 'Session expired',
                description: message,
                variant: 'destructive',
            });
        }

        sessionExpiredListeners.forEach((listener) => listener());
    }

    /**
     * Attempt exactly one token refresh, de-duped across concurrent callers.
     * Returns the new access token on success, or null if refresh was not
     * possible/failed (no refresh token, or the backend rejected it -- e.g.
     * the refresh token itself is also expired/invalid).
     */
    private async refreshAccessToken(): Promise<string | null> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return null;
        }

        this.refreshPromise = (async () => {
            try {
                const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${refreshToken}`,
                    },
                });

                if (!response.ok) {
                    return null;
                }

                const data = await response.json();
                const newAccessToken: string | undefined = data?.access_token;
                if (!newAccessToken) {
                    return null;
                }

                if (typeof window !== 'undefined') {
                    localStorage.setItem(TOKEN_KEY, newAccessToken);
                }
                this.setToken(newAccessToken);
                return newAccessToken;
            } catch {
                // Network error, malformed response, etc. -- treat as refresh
                // failure so the caller falls back to forceLogout().
                return null;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    /**
     * Runs one request attempt via `send`. On a 401, tries exactly one
     * refresh-and-retry; if that doesn't recover, forces logout + redirect
     * rather than leaving the caller to 401 forever with no recovery path.
     * `send` is called again (not the raw fetch) on retry so the Authorization
     * header picks up the freshly-refreshed token via `this.authHeaders`.
     */
    private async withAuthRetry<T>(send: () => Promise<Response>): Promise<T> {
        let response = await send();

        if (response.status === 401) {
            // Only worth attempting a refresh if we were actually holding a
            // session (an anonymous 401 -- e.g. hitting a protected route
            // before ever logging in -- has no token to refresh and no
            // session to kill).
            const hadToken = this.token !== null;

            const newToken = await this.refreshAccessToken();
            if (newToken) {
                response = await send();
            } else if (hadToken) {
                // Refresh wasn't possible (no/invalid refresh token) or the
                // backend rejected it -- the session is genuinely dead with
                // no automatic recovery path left. See issue #124.
                this.forceLogout('Your session expired, please sign in again.');
            }
        }

        return this.handleResponse<T>(response);
    }

    private async fetchWithTimeout(
        url: string,
        options: RequestInit,
        timeoutMs: number = this.defaultTimeout
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiTimeoutError(url, timeoutMs);
            }
            throw error;
        }
    }

    private buildUrl(path: string, params?: Record<string, string>): string {
        const url = `${this.baseUrl}${path}`;
        if (!params || Object.keys(params).length === 0) return url;

        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        }
        const qs = searchParams.toString();
        return qs ? `${url}?${qs}` : url;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            let detail = `HTTP ${response.status}`;
            try {
                const body = await response.json();
                detail = normalizeErrorDetail(body.detail) ?? detail;
            } catch {
                // Use default detail
            }
            throw new ApiError(response.status, detail);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        const data = await response.json();
        return snakeToCamelKeys<T>(data);
    }

    async get<T>(path: string, params?: Record<string, string>, timeoutMs?: number): Promise<T> {
        const url = this.buildUrl(path, params);
        return this.withAuthRetry<T>(() =>
            this.fetchWithTimeout(
                url,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                },
                timeoutMs
            )
        );
    }

    async post<T>(path: string, body?: unknown, timeoutMs?: number): Promise<T> {
        const url = this.buildUrl(path);
        return this.withAuthRetry<T>(() =>
            this.fetchWithTimeout(
                url,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                    body: body ? JSON.stringify(camelToSnakeKeys(body)) : undefined,
                },
                timeoutMs
            )
        );
    }

    async put<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
        const url = this.buildUrl(path);
        return this.withAuthRetry<T>(() =>
            this.fetchWithTimeout(
                url,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                    body: JSON.stringify(camelToSnakeKeys(body)),
                },
                timeoutMs
            )
        );
    }

    async patch<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
        const url = this.buildUrl(path);
        return this.withAuthRetry<T>(() =>
            this.fetchWithTimeout(
                url,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                    body: JSON.stringify(camelToSnakeKeys(body)),
                },
                timeoutMs
            )
        );
    }

    async delete(path: string, timeoutMs?: number): Promise<void> {
        const url = this.buildUrl(path);
        await this.withAuthRetry<void>(() =>
            this.fetchWithTimeout(
                url,
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                },
                timeoutMs
            )
        );
    }

    async deleteWithBody<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
        const url = this.buildUrl(path);
        return this.withAuthRetry<T>(() =>
            this.fetchWithTimeout(
                url,
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                    body: JSON.stringify(camelToSnakeKeys(body)),
                },
                timeoutMs
            )
        );
    }
}

const apiClient = new ApiClient();
export default apiClient;
