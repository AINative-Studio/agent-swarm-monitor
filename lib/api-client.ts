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

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = '/api/v1';
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

    async get<T>(path: string, params?: Record<string, string>): Promise<T> {
        const url = this.buildUrl(path, params);
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return this.handleResponse<T>(response);
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
        const url = this.buildUrl(path);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(camelToSnakeKeys(body)) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async put<T>(path: string, body: unknown): Promise<T> {
        const url = this.buildUrl(path);
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(camelToSnakeKeys(body)),
        });
        return this.handleResponse<T>(response);
    }

    async patch<T>(path: string, body: unknown): Promise<T> {
        const url = this.buildUrl(path);
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(camelToSnakeKeys(body)),
        });
        return this.handleResponse<T>(response);
    }

    async delete(path: string): Promise<void> {
        const url = this.buildUrl(path);
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        await this.handleResponse<void>(response);
    }
}

const apiClient = new ApiClient();
export default apiClient;
