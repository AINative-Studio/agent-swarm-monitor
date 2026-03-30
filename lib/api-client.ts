/**
 * API Client
 *
 * Reusable fetch wrapper with snake_case/camelCase transformation
 * for communicating with the backend REST API.
 */

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

export class ApiTimeoutError extends Error {
    constructor(
        public url: string,
        public timeoutMs: number,
    ) {
        super(`Request to ${url} timed out after ${timeoutMs}ms`);
        this.name = 'ApiTimeoutError';
    }
}

class ApiClient {
    private baseUrl: string;
    private defaultTimeout: number = 30000; // 30 seconds
    private token: string | null = null;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    }

    setToken(token: string | null) {
        this.token = token;
    }

    private get authHeaders(): Record<string, string> {
        return this.token ? { Authorization: `Bearer ${this.token}` } : {};
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
                detail = body.detail || detail;
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
        const response = await this.fetchWithTimeout(
            url,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', ...this.authHeaders },
            },
            timeoutMs
        );
        return this.handleResponse<T>(response);
    }

    async post<T>(path: string, body?: unknown, timeoutMs?: number): Promise<T> {
        const url = this.buildUrl(path);
        const response = await this.fetchWithTimeout(
            url,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                body: body ? JSON.stringify(camelToSnakeKeys(body)) : undefined,
            },
            timeoutMs
        );
        return this.handleResponse<T>(response);
    }

    async put<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
        const url = this.buildUrl(path);
        const response = await this.fetchWithTimeout(
            url,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                body: JSON.stringify(camelToSnakeKeys(body)),
            },
            timeoutMs
        );
        return this.handleResponse<T>(response);
    }

    async patch<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
        const url = this.buildUrl(path);
        const response = await this.fetchWithTimeout(
            url,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                body: JSON.stringify(camelToSnakeKeys(body)),
            },
            timeoutMs
        );
        return this.handleResponse<T>(response);
    }

    async delete(path: string, timeoutMs?: number): Promise<void> {
        const url = this.buildUrl(path);
        const response = await this.fetchWithTimeout(
            url,
            {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...this.authHeaders },
            },
            timeoutMs
        );
        await this.handleResponse<void>(response);
    }

    async deleteWithBody<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
        const url = this.buildUrl(path);
        const response = await this.fetchWithTimeout(
            url,
            {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...this.authHeaders },
                body: JSON.stringify(camelToSnakeKeys(body)),
            },
            timeoutMs
        );
        return this.handleResponse<T>(response);
    }
}

const apiClient = new ApiClient();
export default apiClient;
