/**
 * Tests for useTaskUpdates Hook
 * Refs #141 - Task Management Frontend UI
 *
 * Tests cover:
 * - WebSocket connection management
 * - Real-time task status updates
 * - Automatic reconnection on failure
 * - Event subscription and unsubscription
 * - Update deduplication
 * - Error handling and fallback to polling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTaskUpdates } from '@/hooks/useTaskUpdates';
import type { Task } from '@/types/tasks';

// Mock WebSocket
class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    url: string;
    readyState: number;
    onopen: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        this.readyState = MockWebSocket.CONNECTING;
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) {
                this.onopen(new Event('open'));
            }
        }, 0);
    }

    send(data: string) {
        // Mock implementation
    }

    close() {
        this.readyState = MockWebSocket.CLOSING;
        setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED;
            if (this.onclose) {
                this.onclose(new CloseEvent('close'));
            }
        }, 0);
    }
}

global.WebSocket = MockWebSocket as any;

const mockTask: Task = {
    id: 'task-123',
    taskId: 'task-123',
    taskType: 'code_generation',
    status: 'QUEUED',
    priority: 'NORMAL',
    payload: {},
    requiredCapabilities: null,
    assignedPeerId: null,
    result: null,
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
};

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('useTaskUpdates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe('WebSocket Connection', () => {
        it('should establish WebSocket connection on mount', async () => {
            const { result } = renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });
        });

        it('should include authentication token in connection', async () => {
            const mockToken = 'test-token-123';
            localStorage.setItem('auth_token', mockToken);

            renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(global.WebSocket).toHaveBeenCalledWith(
                    expect.stringContaining(`token=${mockToken}`)
                );
            });

            localStorage.removeItem('auth_token');
        });

        it('should subscribe to task IDs on connection', async () => {
            const taskIds = ['task-1', 'task-2', 'task-3'];
            let sentMessages: string[] = [];

            vi.spyOn(MockWebSocket.prototype, 'send').mockImplementation(function (data: string) {
                sentMessages.push(data);
            });

            renderHook(() => useTaskUpdates(taskIds), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                const subscribeMessage = sentMessages.find((msg) => {
                    const parsed = JSON.parse(msg);
                    return parsed.type === 'subscribe' && parsed.taskIds;
                });
                expect(subscribeMessage).toBeTruthy();
                const parsed = JSON.parse(subscribeMessage!);
                expect(parsed.taskIds).toEqual(taskIds);
            });
        });

        it('should close connection on unmount', async () => {
            const closeSpy = vi.spyOn(MockWebSocket.prototype, 'close');

            const { unmount } = renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(closeSpy).not.toHaveBeenCalled();
            });

            unmount();

            await waitFor(() => {
                expect(closeSpy).toHaveBeenCalled();
            });
        });
    });

    describe('Real-time Updates', () => {
        it('should receive and process task status updates', async () => {
            let messageHandler: ((event: MessageEvent) => void) | null = null;

            vi.spyOn(MockWebSocket.prototype, 'onmessage', 'set').mockImplementation(
                function (handler) {
                    messageHandler = handler;
                }
            );

            const { result } = renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            // Simulate receiving an update
            act(() => {
                if (messageHandler) {
                    const updateEvent = new MessageEvent('message', {
                        data: JSON.stringify({
                            type: 'task_update',
                            taskId: mockTask.id,
                            status: 'RUNNING',
                            timestamp: new Date().toISOString(),
                        }),
                    });
                    messageHandler(updateEvent);
                }
            });

            await waitFor(() => {
                expect(result.current.updates).toHaveLength(1);
                expect(result.current.updates[0]).toMatchObject({
                    taskId: mockTask.id,
                    status: 'RUNNING',
                });
            });
        });

        it('should handle multiple updates for same task', async () => {
            let messageHandler: ((event: MessageEvent) => void) | null = null;

            vi.spyOn(MockWebSocket.prototype, 'onmessage', 'set').mockImplementation(
                function (handler) {
                    messageHandler = handler;
                }
            );

            const { result } = renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            // Send multiple updates
            const statuses = ['LEASED', 'RUNNING', 'COMPLETED'];
            statuses.forEach((status) => {
                act(() => {
                    if (messageHandler) {
                        const updateEvent = new MessageEvent('message', {
                            data: JSON.stringify({
                                type: 'task_update',
                                taskId: mockTask.id,
                                status,
                                timestamp: new Date().toISOString(),
                            }),
                        });
                        messageHandler(updateEvent);
                    }
                });
            });

            await waitFor(() => {
                expect(result.current.updates).toHaveLength(3);
                expect(result.current.updates[2].status).toBe('COMPLETED');
            });
        });

        it('should deduplicate rapid consecutive updates', async () => {
            let messageHandler: ((event: MessageEvent) => void) | null = null;

            vi.spyOn(MockWebSocket.prototype, 'onmessage', 'set').mockImplementation(
                function (handler) {
                    messageHandler = handler;
                }
            );

            const { result } = renderHook(
                () => useTaskUpdates([mockTask.id], { deduplicateWindow: 100 }),
                {
                    wrapper: createWrapper(),
                }
            );

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            // Send duplicate updates rapidly
            act(() => {
                if (messageHandler) {
                    for (let i = 0; i < 5; i++) {
                        const updateEvent = new MessageEvent('message', {
                            data: JSON.stringify({
                                type: 'task_update',
                                taskId: mockTask.id,
                                status: 'RUNNING',
                                timestamp: new Date().toISOString(),
                            }),
                        });
                        messageHandler(updateEvent);
                    }
                }
            });

            await waitFor(() => {
                // Should only have 1 update due to deduplication
                expect(result.current.updates).toHaveLength(1);
            });
        });

        it('should invoke callback on task update', async () => {
            const onUpdate = vi.fn();
            let messageHandler: ((event: MessageEvent) => void) | null = null;

            vi.spyOn(MockWebSocket.prototype, 'onmessage', 'set').mockImplementation(
                function (handler) {
                    messageHandler = handler;
                }
            );

            renderHook(() => useTaskUpdates([mockTask.id], { onUpdate }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(messageHandler).toBeTruthy();
            });

            act(() => {
                if (messageHandler) {
                    const updateEvent = new MessageEvent('message', {
                        data: JSON.stringify({
                            type: 'task_update',
                            taskId: mockTask.id,
                            status: 'COMPLETED',
                            timestamp: new Date().toISOString(),
                        }),
                    });
                    messageHandler(updateEvent);
                }
            });

            await waitFor(() => {
                expect(onUpdate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        taskId: mockTask.id,
                        status: 'COMPLETED',
                    })
                );
            });
        });
    });

    describe('Connection Resilience', () => {
        it('should automatically reconnect on connection loss', async () => {
            vi.useFakeTimers();
            let closeHandler: ((event: CloseEvent) => void) | null = null;

            vi.spyOn(MockWebSocket.prototype, 'onclose', 'set').mockImplementation(
                function (handler) {
                    closeHandler = handler;
                }
            );

            const { result } = renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            // Simulate connection loss
            act(() => {
                if (closeHandler) {
                    closeHandler(new CloseEvent('close', { code: 1006 }));
                }
            });

            expect(result.current.isConnected).toBe(false);

            // Fast-forward past reconnect delay
            act(() => {
                vi.advanceTimersByTime(2000);
            });

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            vi.useRealTimers();
        });

        it('should use exponential backoff for reconnection attempts', async () => {
            vi.useFakeTimers();
            const connectionAttempts: number[] = [];
            let attemptCount = 0;

            vi.spyOn(global, 'WebSocket').mockImplementation((url: string) => {
                attemptCount++;
                connectionAttempts.push(Date.now());

                const ws = new MockWebSocket(url) as any;
                // Simulate immediate failure
                setTimeout(() => {
                    if (ws.onclose) {
                        ws.onclose(new CloseEvent('close', { code: 1006 }));
                    }
                }, 0);
                return ws;
            });

            renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            // Allow multiple reconnection attempts
            for (let i = 0; i < 4; i++) {
                act(() => {
                    vi.advanceTimersByTime(10000); // Advance timers
                });
                await waitFor(() => {
                    expect(attemptCount).toBeGreaterThan(i);
                });
            }

            // Verify exponential backoff (delays should increase)
            const delays = connectionAttempts.slice(1).map((time, i) => {
                return time - connectionAttempts[i];
            });

            expect(delays[1]).toBeGreaterThan(delays[0]);
            expect(delays[2]).toBeGreaterThan(delays[1]);

            vi.useRealTimers();
        });

        it('should handle connection errors gracefully', async () => {
            let errorHandler: ((event: Event) => void) | null = null;

            vi.spyOn(MockWebSocket.prototype, 'onerror', 'set').mockImplementation(
                function (handler) {
                    errorHandler = handler;
                }
            );

            const { result } = renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            // Simulate error
            act(() => {
                if (errorHandler) {
                    errorHandler(new Event('error'));
                }
            });

            expect(result.current.error).toBeTruthy();
            expect(result.current.isConnected).toBe(false);
        });
    });

    describe('Polling Fallback', () => {
        it('should fall back to polling after max reconnection attempts', async () => {
            vi.useFakeTimers();

            vi.spyOn(global, 'WebSocket').mockImplementation(() => {
                throw new Error('WebSocket unavailable');
            });

            const { result } = renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            // Allow reconnection attempts to exhaust
            act(() => {
                vi.advanceTimersByTime(60000);
            });

            await waitFor(() => {
                expect(result.current.useFallbackPolling).toBe(true);
            });

            vi.useRealTimers();
        });

        it('should poll at specified interval when using fallback', async () => {
            vi.useFakeTimers();
            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ tasks: [mockTask] }))
            );

            vi.spyOn(global, 'WebSocket').mockImplementation(() => {
                throw new Error('WebSocket unavailable');
            });

            renderHook(() => useTaskUpdates([mockTask.id], { pollingInterval: 5000 }), {
                wrapper: createWrapper(),
            });

            // Allow fallback to engage
            act(() => {
                vi.advanceTimersByTime(60000);
            });

            await waitFor(() => {
                expect(fetchSpy).toHaveBeenCalled();
            });

            const initialCallCount = fetchSpy.mock.calls.length;

            // Advance by polling interval
            act(() => {
                vi.advanceTimersByTime(5000);
            });

            await waitFor(() => {
                expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
            });

            vi.useRealTimers();
        });
    });

    describe('Subscription Management', () => {
        it('should update subscription when task IDs change', async () => {
            let sentMessages: string[] = [];

            vi.spyOn(MockWebSocket.prototype, 'send').mockImplementation(function (data: string) {
                sentMessages.push(data);
            });

            const { rerender } = renderHook(
                ({ taskIds }) => useTaskUpdates(taskIds),
                {
                    wrapper: createWrapper(),
                    initialProps: { taskIds: ['task-1'] },
                }
            );

            await waitFor(() => {
                expect(sentMessages.some((msg) => msg.includes('subscribe'))).toBe(true);
            });

            sentMessages = [];

            // Update task IDs
            rerender({ taskIds: ['task-1', 'task-2'] });

            await waitFor(() => {
                const updateMessage = sentMessages.find((msg) => {
                    const parsed = JSON.parse(msg);
                    return parsed.type === 'subscribe' && parsed.taskIds.length === 2;
                });
                expect(updateMessage).toBeTruthy();
            });
        });

        it('should handle empty task ID list', () => {
            const { result } = renderHook(() => useTaskUpdates([]), {
                wrapper: createWrapper(),
            });

            // Should not establish connection for empty list
            expect(result.current.isConnected).toBe(false);
        });
    });

    describe('Performance', () => {
        it('should batch rapid subscription changes', async () => {
            vi.useFakeTimers();
            let sentMessages: string[] = [];

            vi.spyOn(MockWebSocket.prototype, 'send').mockImplementation(function (data: string) {
                sentMessages.push(data);
            });

            const { rerender } = renderHook(
                ({ taskIds }) => useTaskUpdates(taskIds, { batchDelay: 100 }),
                {
                    wrapper: createWrapper(),
                    initialProps: { taskIds: ['task-1'] },
                }
            );

            await waitFor(() => {
                expect(sentMessages.length).toBeGreaterThan(0);
            });

            sentMessages = [];

            // Rapid changes
            rerender({ taskIds: ['task-1', 'task-2'] });
            rerender({ taskIds: ['task-1', 'task-2', 'task-3'] });
            rerender({ taskIds: ['task-1', 'task-2', 'task-3', 'task-4'] });

            act(() => {
                vi.advanceTimersByTime(50); // Less than batch delay
            });

            // Should not have sent yet
            expect(sentMessages.length).toBe(0);

            act(() => {
                vi.advanceTimersByTime(100); // Complete batch delay
            });

            await waitFor(() => {
                // Should have sent only one batched message
                expect(sentMessages.length).toBe(1);
            });

            vi.useRealTimers();
        });
    });
});
