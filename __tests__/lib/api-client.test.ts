import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient, { ApiError, snakeToCamelKeys, camelToSnakeKeys, onSessionExpired } from '@/lib/api-client';

describe('ApiClient', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        apiClient.setToken(null);
        localStorage.clear();
    });

    describe('snakeToCamelKeys', () => {
        it('should convert snake_case keys to camelCase', () => {
            const input = { user_id: '1', first_name: 'John', last_name: 'Doe' };
            const result = snakeToCamelKeys<Record<string, string>>(input);
            expect(result).toEqual({ userId: '1', firstName: 'John', lastName: 'Doe' });
        });

        it('should handle nested objects', () => {
            const input = { heartbeat_config: { is_enabled: true, check_interval: '5m' } };
            const result = snakeToCamelKeys<Record<string, unknown>>(input);
            expect(result).toEqual({ heartbeatConfig: { isEnabled: true, checkInterval: '5m' } });
        });

        it('should handle arrays', () => {
            const input = [{ agent_id: '1' }, { agent_id: '2' }];
            const result = snakeToCamelKeys<Array<Record<string, string>>>(input);
            expect(result).toEqual([{ agentId: '1' }, { agentId: '2' }]);
        });

        it('should pass through primitives', () => {
            expect(snakeToCamelKeys<string>('hello')).toBe('hello');
            expect(snakeToCamelKeys<number>(42)).toBe(42);
            expect(snakeToCamelKeys<null>(null)).toBe(null);
        });
    });

    describe('camelToSnakeKeys', () => {
        it('should convert camelCase keys to snake_case', () => {
            const input = { userId: '1', firstName: 'John' };
            const result = camelToSnakeKeys(input);
            expect(result).toEqual({ user_id: '1', first_name: 'John' });
        });

        it('should handle nested objects', () => {
            const input = { heartbeatConfig: { isEnabled: true } };
            const result = camelToSnakeKeys(input);
            expect(result).toEqual({ heartbeat_config: { is_enabled: true } });
        });
    });

    describe('GET requests', () => {
        it('should make GET request and transform response keys', async () => {
            const mockResponse = { agent_id: '123', user_name: 'test' };
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify(mockResponse), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            );

            const result = await apiClient.get<Record<string, string>>('/agents');
            expect(result).toEqual({ agentId: '123', userName: 'test' });
            expect(fetch).toHaveBeenCalledWith('http://localhost:8001/api/v1/agents', expect.objectContaining({ method: 'GET' }));
        });

        it('should append query params', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({}), { status: 200 })
            );

            await apiClient.get('/agents', { status: 'running', limit: '10' });
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/agents?'),
                expect.any(Object)
            );
        });

        it('should throw ApiError on error response', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ detail: 'Not found' }), { status: 404 })
            );

            try {
                await apiClient.get('/agents/missing');
                expect.fail('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(ApiError);
                expect((e as ApiError).statusCode).toBe(404);
                expect((e as ApiError).detail).toBe('Not found');
            }
        });
    });

    describe('POST requests', () => {
        it('should make POST request with snake_case body', async () => {
            const mockResponse = { agent_id: '123', status: 'provisioning' };
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify(mockResponse), { status: 201 })
            );

            const result = await apiClient.post<Record<string, string>>('/agents', {
                agentName: 'test',
                heartbeatEnabled: true,
            });

            expect(result).toEqual({ agentId: '123', status: 'provisioning' });
            const fetchCall = vi.mocked(fetch).mock.calls[0];
            const body = JSON.parse(fetchCall[1]?.body as string);
            expect(body).toEqual({ agent_name: 'test', heartbeat_enabled: true });
        });

        it('should handle POST without body', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
            );

            await apiClient.post('/agents/123/provision');
            const fetchCall = vi.mocked(fetch).mock.calls[0];
            expect(fetchCall[1]?.body).toBeUndefined();
        });
    });

    describe('PATCH requests', () => {
        it('should make PATCH request with snake_case body', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ persona: 'updated' }), { status: 200 })
            );

            await apiClient.patch('/agents/123/settings', { persona: 'new persona' });
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8001/api/v1/agents/123/settings',
                expect.objectContaining({ method: 'PATCH' })
            );
        });
    });

    describe('DELETE requests', () => {
        it('should make DELETE request and handle 204', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(null, { status: 204 })
            );

            await expect(apiClient.delete('/agents/123')).resolves.toBeUndefined();
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8001/api/v1/agents/123',
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    describe('token refresh on 401 (issue #124)', () => {
        afterEach(() => {
            apiClient.setToken(null);
            localStorage.clear();
        });

        it('refreshes the access token and retries the original request once on 401', async () => {
            apiClient.setToken('stale-access-token');
            localStorage.setItem('openclaw_refresh_token', 'valid-refresh-token');

            // First call to the real endpoint 401s; the retried call (made
            // after a successful refresh) should carry the new token and
            // succeed.
            let agentsCallCount = 0;
            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
                const u = String(url);
                if (u.includes('/auth/refresh')) {
                    expect((options as RequestInit)?.headers).toMatchObject({
                        Authorization: 'Bearer valid-refresh-token',
                    });
                    return new Response(JSON.stringify({ access_token: 'new-access-token' }), { status: 200 });
                }
                agentsCallCount += 1;
                if (agentsCallCount === 1) {
                    return new Response(JSON.stringify({ detail: 'expired' }), { status: 401 });
                }
                expect((options as RequestInit)?.headers).toMatchObject({
                    Authorization: 'Bearer new-access-token',
                });
                return new Response(JSON.stringify({ agent_id: '1' }), { status: 200 });
            });

            const result = await apiClient.get<{ agentId: string }>('/agents/1');

            expect(result).toEqual({ agentId: '1' });
            expect(agentsCallCount).toBe(2);
            expect(localStorage.getItem('openclaw_access_token')).toBe('new-access-token');
        });

        it('de-dupes concurrent refresh attempts into a single in-flight call', async () => {
            apiClient.setToken('stale-access-token');
            localStorage.setItem('openclaw_refresh_token', 'valid-refresh-token');

            let refreshCallCount = 0;
            let agentsCallCount = 0;
            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
                const u = String(url);
                if (u.includes('/auth/refresh')) {
                    refreshCallCount += 1;
                    return new Response(JSON.stringify({ access_token: 'new-access-token' }), { status: 200 });
                }
                agentsCallCount += 1;
                // Every first-pass call to any agents endpoint 401s; the
                // retried (second) calls succeed.
                if (agentsCallCount <= 3) {
                    return new Response(JSON.stringify({ detail: 'expired' }), { status: 401 });
                }
                return new Response(JSON.stringify({ ok: true }), { status: 200 });
            });

            await Promise.all([
                apiClient.get('/agents/1'),
                apiClient.get('/agents/2'),
                apiClient.get('/agents/3'),
            ]);

            expect(refreshCallCount).toBe(1);
        });

        it('forces logout and notifies session-expired listeners when refresh fails', async () => {
            apiClient.setToken('stale-access-token');
            localStorage.setItem('openclaw_refresh_token', 'invalid-refresh-token');
            localStorage.setItem('openclaw_user', JSON.stringify({ userId: 'u1' }));

            vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
                const u = String(url);
                if (u.includes('/auth/refresh')) {
                    return new Response(JSON.stringify({ detail: 'Invalid refresh token' }), { status: 401 });
                }
                return new Response(JSON.stringify({ detail: 'expired' }), { status: 401 });
            });

            const listener = vi.fn();
            const unsubscribe = onSessionExpired(listener);

            await expect(apiClient.get('/agents/1')).rejects.toBeInstanceOf(ApiError);

            expect(listener).toHaveBeenCalledTimes(1);
            expect(localStorage.getItem('openclaw_access_token')).toBeNull();
            expect(localStorage.getItem('openclaw_refresh_token')).toBeNull();
            expect(localStorage.getItem('openclaw_user')).toBeNull();

            unsubscribe();
        });

        it('forces logout when there is no refresh token at all to attempt', async () => {
            apiClient.setToken('stale-access-token');
            // No refresh token in localStorage.

            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ detail: 'expired' }), { status: 401 })
            );

            const listener = vi.fn();
            const unsubscribe = onSessionExpired(listener);

            await expect(apiClient.get('/agents/1')).rejects.toBeInstanceOf(ApiError);

            expect(listener).toHaveBeenCalledTimes(1);
            unsubscribe();
        });

        it('does not attempt refresh or logout for an anonymous 401 (no token held)', async () => {
            // apiClient.setToken(null) via beforeEach -- no session at all.
            const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ detail: 'unauthorized' }), { status: 401 })
            );

            const listener = vi.fn();
            const unsubscribe = onSessionExpired(listener);

            await expect(apiClient.get('/agents/1')).rejects.toBeInstanceOf(ApiError);

            // Only the one original call -- no /auth/refresh call attempted.
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(listener).not.toHaveBeenCalled();
            unsubscribe();
        });
    });
});
