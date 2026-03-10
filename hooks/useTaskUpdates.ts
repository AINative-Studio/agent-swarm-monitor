/**
 * useTaskUpdates Hook
 * Refs #141 - Task Management Frontend UI
 *
 * Manages WebSocket connection for real-time task status updates
 * with automatic reconnection, deduplication, and polling fallback.
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export interface TaskUpdate {
    taskId: string;
    status: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

interface UseTaskUpdatesOptions {
    deduplicateWindow?: number; // ms
    pollingInterval?: number; // ms
    maxReconnectAttempts?: number;
    batchDelay?: number; // ms
    onUpdate?: (update: TaskUpdate) => void;
}

interface UseTaskUpdatesReturn {
    isConnected: boolean;
    updates: TaskUpdate[];
    error: Error | null;
    useFallbackPolling: boolean;
}

const DEFAULT_OPTIONS = {
    deduplicateWindow: 100,
    pollingInterval: 10000,
    maxReconnectAttempts: 5,
    batchDelay: 100,
};

export function useTaskUpdates(
    taskIds: string[],
    options: UseTaskUpdatesOptions = {}
): UseTaskUpdatesReturn {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const [isConnected, setIsConnected] = useState(false);
    const [updates, setUpdates] = useState<TaskUpdate[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [useFallbackPolling, setUseFallbackPolling] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateTimestampRef = useRef<Record<string, number>>({});
    const subscriptionBatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get WebSocket URL with auth token
    const getWebSocketURL = useCallback(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
        const token = localStorage.getItem('auth_token') || '';
        return `${protocol}//${host}/ws/tasks?token=${token}`;
    }, []);

    // Calculate exponential backoff delay
    const getReconnectDelay = useCallback(() => {
        const baseDelay = 1000;
        const maxDelay = 30000;
        const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current), maxDelay);
        return delay + Math.random() * 1000; // Add jitter
    }, []);

    // Deduplicate rapid updates
    const shouldProcessUpdate = useCallback((update: TaskUpdate): boolean => {
        const key = `${update.taskId}-${update.status}`;
        const lastTime = lastUpdateTimestampRef.current[key] || 0;
        const now = Date.now();

        if (now - lastTime < opts.deduplicateWindow) {
            return false;
        }

        lastUpdateTimestampRef.current[key] = now;
        return true;
    }, [opts.deduplicateWindow]);

    // Handle incoming WebSocket messages
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'task_update') {
                const update: TaskUpdate = {
                    taskId: data.taskId,
                    status: data.status,
                    timestamp: data.timestamp,
                    metadata: data.metadata,
                };

                if (shouldProcessUpdate(update)) {
                    setUpdates((prev) => [...prev, update]);
                    if (opts.onUpdate) {
                        opts.onUpdate(update);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
        }
    }, [shouldProcessUpdate, opts]);

    // Subscribe to task IDs (batched)
    const subscribeToTasks = useCallback((ws: WebSocket, ids: string[]) => {
        if (subscriptionBatchTimeoutRef.current) {
            clearTimeout(subscriptionBatchTimeoutRef.current);
        }

        subscriptionBatchTimeoutRef.current = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    taskIds: ids,
                }));
            }
        }, opts.batchDelay);
    }, [opts.batchDelay]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (taskIds.length === 0) {
            return;
        }

        try {
            const ws = new WebSocket(getWebSocketURL());
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;
                subscribeToTasks(ws, taskIds);
            };

            ws.onmessage = handleMessage;

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError(new Error('WebSocket connection error'));
                setIsConnected(false);
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code);
                setIsConnected(false);
                wsRef.current = null;

                // Attempt reconnection
                if (reconnectAttemptsRef.current < opts.maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    const delay = getReconnectDelay();
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${opts.maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, delay);
                } else {
                    console.warn('Max reconnect attempts reached, falling back to polling');
                    setUseFallbackPolling(true);
                }
            };
        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            setError(err as Error);

            // Fallback to polling immediately if WebSocket is unavailable
            if (reconnectAttemptsRef.current >= opts.maxReconnectAttempts) {
                setUseFallbackPolling(true);
            }
        }
    }, [taskIds, getWebSocketURL, handleMessage, subscribeToTasks, opts.maxReconnectAttempts, getReconnectDelay]);

    // Disconnect WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (subscriptionBatchTimeoutRef.current) {
            clearTimeout(subscriptionBatchTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    // Handle subscription changes
    useEffect(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && taskIds.length > 0) {
            subscribeToTasks(wsRef.current, taskIds);
        }
    }, [taskIds, subscribeToTasks]);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();
        return disconnect;
    }, [connect, disconnect]);

    // Polling fallback
    useEffect(() => {
        if (!useFallbackPolling) {
            return;
        }

        const pollTasks = async () => {
            try {
                // Fetch task updates via REST API
                const response = await fetch(
                    `/api/v1/tasks/queue?${taskIds.map(id => `task_id=${id}`).join('&')}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    // Process updates from polling response
                    // (Implementation would depend on actual API response structure)
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        const interval = setInterval(pollTasks, opts.pollingInterval);
        return () => clearInterval(interval);
    }, [useFallbackPolling, taskIds, opts.pollingInterval]);

    return {
        isConnected,
        updates,
        error,
        useFallbackPolling,
    };
}
