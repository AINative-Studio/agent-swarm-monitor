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

    // Real browsers implement onopen/onclose/onerror/onmessage as accessor
    // properties on WebSocket.prototype, not plain instance fields -- tests
    // use vi.spyOn(MockWebSocket.prototype, 'onmessage', 'set') to intercept
    // handler registration, which only works against a real prototype
    // setter. Class-field syntax (`onmessage = null`) creates an own
    // property on each instance instead, so vi.spyOn against the prototype
    // silently had nothing to spy on and threw "onmessage does not exist".
    private _onopen: ((event: Event) => void) | null = null;
    private _onclose: ((event: CloseEvent) => void) | null = null;
    private _onerror: ((event: Event) => void) | null = null;
    private _onmessage: ((event: MessageEvent) => void) | null = null;

    get onopen() { return this._onopen; }
    set onopen(handler) { this._onopen = handler; }
    get onclose() { return this._onclose; }
    set onclose(handler) { this._onclose = handler; }
    get onerror() { return this._onerror; }
    set onerror(handler) { this._onerror = handler; }
    get onmessage() { return this._onmessage; }
    set onmessage(handler) { this._onmessage = handler; }

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

// Wrapped in vi.fn() so tests can assert on construction args (e.g. the
// auth token embedded in the URL) via toHaveBeenCalledWith -- a plain class
// assignment isn't a spy, and "should include authentication token in
// connection" asserted against it unconditionally since this file's
// original version, meaning it never actually passed. Individual tests
// still override this with their own vi.spyOn(global, 'WebSocket')
// .mockImplementation(...) where they need custom connect-failure behavior;
// this is just the default "really connects" case.
//
// The real browser WebSocket class exposes CONNECTING/OPEN/CLOSING/CLOSED
// as static constants, and hooks/useTaskUpdates.ts reads WebSocket.OPEN
// directly (not MockWebSocket.OPEN) when deciding whether to send. A plain
// vi.fn() wrapper has no static properties of its own, so that read was
// silently `undefined` and `ws.readyState === WebSocket.OPEN` was always
// false -- the batched subscribe send() never fired. Copy the statics onto
// the mock function so it satisfies the same interface as the real global.
global.WebSocket = vi.fn((url: string) => new MockWebSocket(url)) as any;
Object.assign(global.WebSocket, {
    CONNECTING: MockWebSocket.CONNECTING,
    OPEN: MockWebSocket.OPEN,
    CLOSING: MockWebSocket.CLOSING,
    CLOSED: MockWebSocket.CLOSED,
});

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
        // vi.clearAllMocks() only resets call history -- it does NOT restore
        // spied implementations, so vi.spyOn(MockWebSocket.prototype, ...,
        // 'set').mockImplementation(...) and vi.spyOn(global,
        // 'WebSocket').mockImplementation(...) from earlier tests stayed
        // active and leaked into later tests (e.g. the exponential-backoff
        // test's global.WebSocket override and Math.random pin were still
        // in effect during the NEXT test, corrupting its reconnect timing).
        // vi.restoreAllMocks() actually un-spies. Also guarantee real timers
        // are restored even if a test that called vi.useFakeTimers()
        // failed/threw before reaching its own vi.useRealTimers() call.
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
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
            let closeHandler: ((event: CloseEvent) => void) | null = null;

            vi.spyOn(MockWebSocket.prototype, 'onclose', 'set').mockImplementation(
                function (handler) {
                    closeHandler = handler;
                }
            );

            const { result } = renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            // Establish the initial connection with real timers -- the
            // MockWebSocket constructor's onopen fires via a real
            // setTimeout(0), so switching to fake timers before this
            // resolves leaves waitFor polling a clock nothing ever
            // advances (it previously hung for the full 30s test timeout).
            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            vi.useFakeTimers();

            // Simulate connection loss
            act(() => {
                if (closeHandler) {
                    closeHandler(new CloseEvent('close', { code: 1006 }));
                }
            });

            expect(result.current.isConnected).toBe(false);

            // Fast-forward past reconnect delay. This is the FIRST close,
            // but reconnectAttemptsRef is incremented to 1 *before*
            // getReconnectDelay() reads it (so the actual formula computes
            // 1000*2^1=2000 base here, not 2^0=1000) -- so the real delay
            // range is 2000-3000ms with jitter, not 0-2000ms. 2000ms was
            // sometimes too short.
            act(() => {
                vi.advanceTimersByTime(3100);
            });

            vi.useRealTimers();

            // The reconnected MockWebSocket's onopen still fires via a real
            // setTimeout(0), so this waitFor needs real timers too.
            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });
        });

        it('should use exponential backoff for reconnection attempts', async () => {
            vi.useFakeTimers();
            // getReconnectDelay() adds up to 1000ms of random jitter on top
            // of the exponential base. At these magnitudes (base delays of
            // ~1-2s, ~2-3s, ~4-5s) two jittered samples from adjacent steps
            // can overlap purely by chance -- e.g. attempt 0 rolling near its
            // 2000ms ceiling and attempt 1 rolling near its 2000ms floor --
            // making a strict delays[i+1] > delays[i] assertion on raw
            // samples genuinely flaky, not just slow. Pin Math.random to 0
            // so this test verifies the real exponential-growth logic
            // deterministically, which is what it's actually named for.
            vi.spyOn(Math, 'random').mockReturnValue(0);
            const connectionAttempts: number[] = [];
            let attemptCount = 0;

            vi.spyOn(global, 'WebSocket').mockImplementation((url: string | URL) => {
                attemptCount++;
                connectionAttempts.push(Date.now());

                const ws = new MockWebSocket(String(url)) as any;
                // Simulate a connection that fails outright. MockWebSocket's
                // own constructor unconditionally schedules onopen via its
                // internal setTimeout(0); the hook's connect() then assigns
                // its own ws.onopen handler (which resets
                // reconnectAttemptsRef to 0 on success) right after this mock
                // returns -- so clearing onopen here gets clobbered by that
                // later assignment, and onopen fires every cycle regardless,
                // keeping getReconnectDelay() stuck reading attempt 0
                // forever (the "backoff" never grew past its first step).
                // Not a bug in the exponential-backoff logic itself -- stub
                // out the whole open/close pairing at the connection level
                // so the hook's onopen handler, whatever it's set to, simply
                // never runs for this failed-attempt simulation.
                Object.defineProperty(ws, 'onopen', {
                    get: () => null,
                    set: () => {},
                    configurable: true,
                });
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

            // getReconnectDelay() is 1000 * 2^attempt + up to 1000ms jitter,
            // so a flat 10s advance per loop iteration let multiple reconnect
            // cycles fire within a single iteration (attempt 0's ~1-2s delay
            // and attempt 1's ~2-3s delay both fit inside one 10s window),
            // breaking the 1:1 mapping this test's indexing assumed between
            // loop iteration and connectionAttempts entry -- advance by just
            // past each step's own worst-case delay instead, one attempt at
            // a time. vi.advanceTimersByTimeAsync also flushes the microtask
            // queue between ticks, which a real-clock waitFor can't do
            // against a frozen fake clock (needed since vi.useFakeTimers()
            // runs before renderHook here).
            for (let i = 0; i < 4; i++) {
                const delayForStep = 1000 * Math.pow(2, i); // jitter pinned to 0 above
                await vi.advanceTimersByTimeAsync(delayForStep + 100);
                expect(attemptCount).toBeGreaterThan(i);
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
            // Worst case over 5 attempts is (1000+2000+4000+8000+16000) +
            // 5*1000 jitter = 36000ms, but real random jitter rolling high
            // across all 5 attempts can exceed a 60000ms advance purely by
            // chance (observed ~62273ms in one run) -- pin it to 0 so this
            // test deterministically reaches the actual max-attempts
            // fallback path it's named for, not a jitter-dependent race.
            vi.spyOn(Math, 'random').mockReturnValue(0);

            vi.spyOn(global, 'WebSocket').mockImplementation(() => {
                throw new Error('WebSocket unavailable');
            });

            const { result } = renderHook(() => useTaskUpdates([mockTask.id]), {
                wrapper: createWrapper(),
            });

            // The WebSocket constructor throws synchronously here, so the
            // whole connect -> catch -> scheduled retry chain runs entirely
            // on fake timers with no real setTimeout(0)s to wait out --
            // waitFor (which polls on a real clock) has nothing to wait
            // for once the fake clock is fully advanced; assert directly.
            await act(async () => {
                await vi.advanceTimersByTimeAsync(60000);
            });

            expect(result.current.useFallbackPolling).toBe(true);
        });

        it('should poll at specified interval when using fallback', async () => {
            vi.useFakeTimers();
            // Same jitter-can-exceed-the-advance-window and
            // waitFor-polls-a-real-clock-against-a-frozen-fake-one issues as
            // "should fall back to polling after max reconnection attempts"
            // above -- pin jitter and advance+assert directly instead of
            // waitFor.
            vi.spyOn(Math, 'random').mockReturnValue(0);
            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ tasks: [mockTask] }))
            );

            vi.spyOn(global, 'WebSocket').mockImplementation(() => {
                throw new Error('WebSocket unavailable');
            });

            const { result } = renderHook(() => useTaskUpdates([mockTask.id], { pollingInterval: 5000 }), {
                wrapper: createWrapper(),
            });

            // Allow fallback to engage -- advance in two steps rather than
            // one 60000ms call. advanceTimersByTimeAsync appears to compute
            // its tick schedule up front: the setInterval that gets created
            // *during* the advance (once useFallbackPolling flips true,
            // partway through) wasn't being picked up by the remainder of
            // that same in-flight advance call, so pollTasks never fired
            // even though plenty of fake-clock time was left afterward.
            // Finishing the reconnect exhaustion first, then starting a
            // fresh advance call once the interval already exists, avoids
            // that race.
            await act(async () => {
                // Delays use 1000 * 2^attempt where attempt is already
                // incremented before the read, so attempt 1..5 give
                // 2000+4000+8000+16000+30000(capped) = 60000ms total with
                // jitter pinned to 0.
                await vi.advanceTimersByTimeAsync(60000);
            });

            expect(result.current.useFallbackPolling).toBe(true);

            await act(async () => {
                await vi.advanceTimersByTimeAsync(5000);
            });

            expect(fetchSpy).toHaveBeenCalled();

            const initialCallCount = fetchSpy.mock.calls.length;

            // Advance by polling interval
            await act(async () => {
                await vi.advanceTimersByTimeAsync(5000);
            });

            expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
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

            // vi.useFakeTimers() runs before renderHook here (needed so the
            // later batchDelay assertions can be exact), which means the
            // initial connection's onopen (a real setTimeout(0) inside
            // MockWebSocket's constructor) and its subsequent batched
            // subscribeToTasks send are themselves fake timers -- waitFor
            // polls on a real clock, which can't observe a frozen fake one.
            // advanceTimersByTimeAsync flushes both the fake clock and the
            // microtask queue between ticks.
            await act(async () => {
                await vi.advanceTimersByTimeAsync(200); // onopen (0ms) + batchDelay (100ms) + margin
            });

            expect(sentMessages.length).toBeGreaterThan(0);

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

            await act(async () => {
                await vi.advanceTimersByTimeAsync(100); // Complete batch delay
            });

            // Should have sent only one batched message
            expect(sentMessages.length).toBe(1);
        });
    });
});
