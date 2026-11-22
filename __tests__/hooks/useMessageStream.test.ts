import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useMessageStream } from '@/hooks/useMessageStream';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  // Helper method to simulate error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Store reference to current mock WebSocket instance
let currentMockWs: MockWebSocket | null = null;

// Mock global WebSocket
const originalWebSocket = global.WebSocket;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useMessageStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockWs = null;

    // Replace global WebSocket with our mock
    global.WebSocket = vi.fn().mockImplementation((url: string) => {
      currentMockWs = new MockWebSocket(url);
      return currentMockWs;
    }) as any;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    currentMockWs = null;
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection on mount', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.connectionStatus).toBe('connecting');

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      }, { timeout: 100 });

      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://localhost:8001/api/v1/conversations/stream')
      );
    });

    it('should include query parameters in WebSocket URL', async () => {
      renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('conversation_id=conv-123')
        );
        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('agent_id=agent-456')
        );
      });
    });

    it('should cleanup connection on unmount', async () => {
      const { unmount } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(currentMockWs?.readyState).toBe(MockWebSocket.OPEN);
      });

      unmount();

      expect(currentMockWs?.readyState).toBe(MockWebSocket.CLOSED);
    });

    it('should handle connection errors', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(currentMockWs).not.toBeNull();
      });

      act(() => {
        currentMockWs?.simulateError();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('error');
      });
    });

    it('should handle connection close', async () => {
      // autoReconnect disabled so the 'disconnected' state from the close handler is the
      // final state rather than an unobservable tick before the hook moves on to
      // 'reconnecting' in the same synchronous handler (covered separately below).
      const { result } = renderHook(
        () => useMessageStream({
          conversationId: 'conv-123',
          agentId: 'agent-456',
          autoReconnect: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        currentMockWs?.close();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('disconnected');
      });
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt to reconnect on disconnect', async () => {
      const { result } = renderHook(
        () => useMessageStream({
          conversationId: 'conv-123',
          agentId: 'agent-456',
          autoReconnect: true
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      const firstCallCount = (global.WebSocket as any).mock.calls.length;

      act(() => {
        currentMockWs?.close();
      });

      // The hook transitions disconnected -> reconnecting synchronously within the same
      // close handler when autoReconnect is on, so 'reconnecting' (not the transient
      // 'disconnected' tick) is the first state reliably observable here.
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('reconnecting');
      });

      // Wait for reconnection attempt
      await waitFor(() => {
        expect((global.WebSocket as any).mock.calls.length).toBeGreaterThan(firstCallCount);
      }, { timeout: 3000 });
    });

    it('should track reconnect attempts', async () => {
      const { result } = renderHook(
        () => useMessageStream({
          conversationId: 'conv-123',
          agentId: 'agent-456',
          autoReconnect: true,
          reconnectDelay: 100
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      // Disconnect
      act(() => {
        currentMockWs?.close();
      });

      // With a 100ms reconnect delay, the hook can race past the transient
      // 'disconnected' state before this polls — assert on 'reconnecting' or
      // already-'connected' (if the reconnect completed first).
      await waitFor(() => {
        expect(['reconnecting', 'connected']).toContain(result.current.connectionStatus);
      });

      // Wait for reconnection
      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBeGreaterThan(0);
      }, { timeout: 1000 });
    });

    it('should respect max reconnect attempts', async () => {
      const { result } = renderHook(
        () => useMessageStream({
          conversationId: 'conv-123',
          agentId: 'agent-456',
          autoReconnect: true,
          maxReconnectAttempts: 0
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      const callCount = (global.WebSocket as any).mock.calls.length;

      act(() => {
        currentMockWs?.close();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('disconnected');
      });

      // Wait to ensure no reconnection occurs
      await new Promise(resolve => setTimeout(resolve, 500));

      expect((global.WebSocket as any).mock.calls.length).toBe(callCount);
    });
  });

  describe('Message Streaming', () => {
    it('should handle message chunks', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          conversationId: 'conv-123',
          messageId: 'msg-456',
          chunk: 'Hello, ',
          isComplete: false
        });
      });

      await waitFor(() => {
        expect(result.current.streamingMessage).toEqual({
          messageId: 'msg-456',
          content: 'Hello, ',
          isComplete: false
        });
      });
    });

    it('should accumulate message chunks', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          conversationId: 'conv-123',
          messageId: 'msg-456',
          chunk: 'Hello, ',
          isComplete: false
        });
      });

      await waitFor(() => {
        expect(result.current.streamingMessage?.content).toBe('Hello, ');
      });

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          conversationId: 'conv-123',
          messageId: 'msg-456',
          chunk: 'world!',
          isComplete: false
        });
      });

      await waitFor(() => {
        expect(result.current.streamingMessage?.content).toBe('Hello, world!');
      });
    });

    it('should mark message as complete', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          conversationId: 'conv-123',
          messageId: 'msg-456',
          chunk: 'Complete message',
          isComplete: true
        });
      });

      await waitFor(() => {
        expect(result.current.streamingMessage?.isComplete).toBe(true);
      });
    });

    it('should call onMessageChunk callback', async () => {
      const onMessageChunk = vi.fn();

      const { result } = renderHook(
        () => useMessageStream({
          conversationId: 'conv-123',
          agentId: 'agent-456',
          onMessageChunk
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          conversationId: 'conv-123',
          messageId: 'msg-456',
          chunk: 'Test',
          isComplete: false
        });
      });

      await waitFor(() => {
        expect(onMessageChunk).toHaveBeenCalledWith({
          messageId: 'msg-456',
          chunk: 'Test',
          isComplete: false
        });
      });
    });

    it('should call onMessageComplete callback', async () => {
      const onMessageComplete = vi.fn();

      const { result } = renderHook(
        () => useMessageStream({
          conversationId: 'conv-123',
          agentId: 'agent-456',
          onMessageComplete
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          conversationId: 'conv-123',
          messageId: 'msg-456',
          chunk: 'Complete',
          isComplete: true
        });
      });

      await waitFor(() => {
        expect(onMessageComplete).toHaveBeenCalledWith({
          messageId: 'msg-456',
          content: 'Complete'
        });
      });
    });

    it('should reset streaming state for new messages', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      // First message
      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          conversationId: 'conv-123',
          messageId: 'msg-1',
          chunk: 'First message',
          isComplete: true
        });
      });

      await waitFor(() => {
        expect(result.current.streamingMessage?.messageId).toBe('msg-1');
      });

      // Second message
      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          conversationId: 'conv-123',
          messageId: 'msg-2',
          chunk: 'Second message',
          isComplete: false
        });
      });

      await waitFor(() => {
        expect(result.current.streamingMessage?.messageId).toBe('msg-2');
        expect(result.current.streamingMessage?.content).toBe('Second message');
      });
    });
  });

  describe('Stop Generation', () => {
    it('exposes isStreaming as true while a message is incomplete', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          messageId: 'msg-1',
          chunk: 'Still typing...',
          isComplete: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });
    });

    it('marks the streaming message complete and sets isStreaming to false on stopGeneration()', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          messageId: 'msg-1',
          chunk: 'Partial response',
          isComplete: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      act(() => {
        result.current.stopGeneration();
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
        expect(result.current.streamingMessage?.isComplete).toBe(true);
        expect(result.current.streamingMessage?.content).toBe('Partial response');
      });
    });

    it('sends a stop_generation signal over the socket when open', async () => {
      const sendSpy = vi.fn();

      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      if (currentMockWs) {
        currentMockWs.send = sendSpy;
      }

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'message_chunk',
          messageId: 'msg-1',
          chunk: 'Partial',
          isComplete: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      act(() => {
        result.current.stopGeneration();
      });

      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"stop_generation"')
      );
    });

    it('does not throw when stopGeneration is called with no active stream', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(() => {
        act(() => {
          result.current.stopGeneration();
        });
      }).not.toThrow();

      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('Manual Connection Control', () => {
    it('should provide connect function', async () => {
      const { result } = renderHook(
        () => useMessageStream({
          conversationId: 'conv-123',
          agentId: 'agent-456',
          autoConnect: false
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.connectionStatus).toBe('disconnected');

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });
    });

    it('should provide disconnect function', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        result.current.disconnect();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('disconnected');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON messages', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        if (currentMockWs?.onmessage) {
          const event = new MessageEvent('message', {
            data: 'invalid json',
          });
          currentMockWs.onmessage(event);
        }
      });

      // Should not crash
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should handle unknown message types', async () => {
      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'unknown_type',
          data: 'some data'
        });
      });

      // Should not crash
      expect(result.current.connectionStatus).toBe('connected');
    });
  });

  describe('Heartbeat/Ping', () => {
    it('should respond to ping messages', async () => {
      const sendSpy = vi.fn();

      const { result } = renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      if (currentMockWs) {
        currentMockWs.send = sendSpy;
      }

      act(() => {
        currentMockWs?.simulateMessage({
          type: 'ping'
        });
      });

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"pong"')
        );
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should use API URL from environment', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'http://custom-host:9000/api/v1';

      renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('ws://custom-host:9000/api/v1/conversations/stream')
        );
      });

      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it('should handle wss protocol for https API URLs', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'https://secure-api.example.com/api/v1';

      renderHook(
        () => useMessageStream({ conversationId: 'conv-123', agentId: 'agent-456' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('wss://secure-api.example.com/api/v1/conversations/stream')
        );
      });

      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });
  });
});
