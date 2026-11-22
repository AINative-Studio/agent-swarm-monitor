import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  MessageStreamConfig,
  ConnectionStatus,
  StreamingMessage,
  WebSocketMessage,
} from '@/types/openclaw';

const DEFAULT_API_URL = 'http://localhost:8001/api/v1';

// Read at call time (not cached at module scope) so tests can swap
// `process.env.NEXT_PUBLIC_API_URL` between runs and so a runtime env change
// in Next.js is picked up without a full module reload.
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

// Standard WebSocket readyState values (WHATWG spec: fixed across all implementations).
// Using these literals instead of `WebSocket.OPEN` / `WebSocket.CONNECTING` avoids a bug
// where a test (or any) mock that replaces the global `WebSocket` constructor without also
// defining its static OPEN/CONNECTING/CLOSING/CLOSED properties causes those lookups to
// resolve to `undefined` — which then spuriously matches `wsRef.current?.readyState`
// (also `undefined` before a socket exists), making the "already connecting" guard true
// unconditionally and preventing any connection from ever being established.
const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

interface UseMessageStreamReturn {
  connectionStatus: ConnectionStatus;
  streamingMessage: StreamingMessage | null;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
  /** Stop the in-progress assistant generation (signals the server and halts the local stream). */
  stopGeneration: () => void;
  isConnected: boolean;
  isStreaming: boolean;
}

/**
 * Custom hook for managing WebSocket connection for real-time message streaming
 *
 * Features:
 * - Auto-connect on mount (configurable)
 * - Auto-reconnect with exponential backoff
 * - Message chunk accumulation
 * - Connection status tracking
 * - Graceful cleanup
 *
 * @param config - Configuration options for message streaming
 * @returns Hook state and control functions
 */
export function useMessageStream(
  config: MessageStreamConfig
): UseMessageStreamReturn {
  const {
    conversationId,
    agentId,
    autoConnect = true,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    maxReconnectDelay = 30000,
    onMessageChunk,
    onMessageComplete,
    onConnectionChange,
    onError,
  } = config;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyDisconnectedRef = useRef(false);
  const currentMessageIdRef = useRef<string | null>(null);

  // Store config in refs to avoid stale closures
  const configRef = useRef(config);
  configRef.current = config;

  /**
   * Convert HTTP(S) URL to WS(S) URL
   */
  const getWebSocketUrl = () => {
    const apiUrl = getApiUrl();
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = apiUrl.replace(/^https?:\/\//, '');
    const params = new URLSearchParams({
      conversation_id: conversationId,
      agent_id: agentId,
    });
    return `${wsProtocol}://${baseUrl}/conversations/stream?${params.toString()}`;
  };

  /**
   * Update connection status and notify listeners
   */
  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    if (onConnectionChange) {
      onConnectionChange(status);
    }
  }, [onConnectionChange]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'message_chunk':
          if (data.messageId && data.chunk !== undefined) {
            // New message - reset content
            if (currentMessageIdRef.current !== data.messageId) {
              currentMessageIdRef.current = data.messageId;
              setStreamingMessage({
                messageId: data.messageId,
                content: data.chunk,
                isComplete: data.isComplete || false,
                timestamp: data.timestamp,
                metadata: data.metadata,
              });
            } else {
              // Same message - accumulate chunks
              setStreamingMessage((prev) => {
                if (!prev) {
                  return {
                    messageId: data.messageId!,
                    content: data.chunk!,
                    isComplete: data.isComplete || false,
                    timestamp: data.timestamp,
                    metadata: data.metadata,
                  };
                }
                return {
                  ...prev,
                  content: prev.content + data.chunk!,
                  isComplete: data.isComplete || false,
                  metadata: data.metadata || prev.metadata,
                };
              });
            }

            // Call chunk callback
            if (onMessageChunk) {
              onMessageChunk({
                messageId: data.messageId,
                chunk: data.chunk,
                isComplete: data.isComplete || false,
              });
            }

            // Call complete callback if message is done
            if (data.isComplete && onMessageComplete) {
              setStreamingMessage((prev) => {
                if (prev) {
                  onMessageComplete({
                    messageId: prev.messageId,
                    content: prev.content,
                  });
                }
                return prev;
              });
            }
          }
          break;

        case 'message_complete':
          if (data.messageId && data.content !== undefined) {
            setStreamingMessage({
              messageId: data.messageId,
              content: data.content,
              isComplete: true,
              timestamp: data.timestamp,
              metadata: data.metadata,
            });

            if (onMessageComplete) {
              onMessageComplete({
                messageId: data.messageId,
                content: data.content,
              });
            }
          }
          break;

        case 'thinking':
          // Could be used to show "thinking" indicator
          break;

        case 'error':
          if (data.error && onError) {
            onError(new Error(data.error));
          }
          break;

        case 'ping':
          // Respond to ping with pong
          if (wsRef.current?.readyState === WS_READY_STATE.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'pong' }));
          }
          break;

        case 'pong':
          // Heartbeat acknowledgment
          break;

        default:
          // Unknown message type - ignore
          break;
      }
    } catch (error) {
      // Invalid JSON or parsing error - log but don't crash
      console.warn('Failed to parse WebSocket message:', error);
    }
  }, [onMessageChunk, onMessageComplete, onError]);

  /**
   * Attempt to reconnect with exponential backoff
   */
  const attemptReconnect = useCallback(() => {
    if (
      !autoReconnect ||
      isManuallyDisconnectedRef.current ||
      reconnectAttempts >= maxReconnectAttempts
    ) {
      return;
    }

    updateConnectionStatus('reconnecting');

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, ... capped at maxReconnectDelay
    const delay = Math.min(
      reconnectDelay * Math.pow(2, reconnectAttempts),
      maxReconnectDelay
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts((prev) => prev + 1);
      connect();
    }, delay);
  }, [autoReconnect, reconnectAttempts, maxReconnectAttempts, reconnectDelay, maxReconnectDelay, updateConnectionStatus]);

  /**
   * Handle WebSocket connection open
   */
  const handleOpen = useCallback(() => {
    updateConnectionStatus('connected');
    setReconnectAttempts(0);
  }, [updateConnectionStatus]);

  /**
   * Handle WebSocket connection close
   */
  const handleClose = useCallback(() => {
    updateConnectionStatus('disconnected');
    wsRef.current = null;

    // Attempt reconnect if not manually disconnected
    if (!isManuallyDisconnectedRef.current) {
      attemptReconnect();
    }
  }, [updateConnectionStatus, attemptReconnect]);

  /**
   * Handle WebSocket errors
   */
  const handleError = useCallback((event: Event) => {
    updateConnectionStatus('error');

    if (onError) {
      onError(new Error('WebSocket connection error'));
    }
  }, [updateConnectionStatus, onError]);

  /**
   * Connect to WebSocket server
   */
  const connect = () => {
    // Don't create multiple connections
    if (wsRef.current?.readyState === WS_READY_STATE.OPEN ||
        wsRef.current?.readyState === WS_READY_STATE.CONNECTING) {
      return;
    }

    try {
      updateConnectionStatus('connecting');
      isManuallyDisconnectedRef.current = false;

      const ws = new WebSocket(getWebSocketUrl());

      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onerror = handleError;
      ws.onclose = handleClose;

      wsRef.current = ws;
    } catch (error) {
      updateConnectionStatus('error');
      if (onError) {
        onError(error instanceof Error ? error : new Error('Failed to connect'));
      }
    }
  };

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = () => {
    isManuallyDisconnectedRef.current = true;

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    updateConnectionStatus('disconnected');
    setReconnectAttempts(0);
  };

  /**
   * Stop an in-progress assistant generation.
   *
   * Sends a `stop_generation` signal to the server (if the socket is open) so the
   * backend can halt token production, and immediately marks the current streaming
   * message as complete on the client so the UI stops showing a "typing" state —
   * even if the server never acknowledges the stop (e.g. socket already closing).
   */
  const stopGeneration = useCallback(() => {
    const messageId = currentMessageIdRef.current;

    if (wsRef.current?.readyState === WS_READY_STATE.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'stop_generation', messageId: messageId ?? undefined })
      );
    }

    setStreamingMessage((prev) => (prev ? { ...prev, isComplete: true } : prev));
  }, []);

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []); // Run once on mount

  return {
    connectionStatus,
    streamingMessage,
    reconnectAttempts,
    connect,
    disconnect,
    stopGeneration,
    isConnected: connectionStatus === 'connected',
    isStreaming: streamingMessage !== null && !streamingMessage.isComplete,
  };
}
