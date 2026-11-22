import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {}

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

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

describe('useMessageStream - Simple', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.WebSocket = vi.fn().mockImplementation((url: string) => {
      return new MockWebSocket(url);
    }) as any;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
  });

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(
      () => useMessageStream({
        conversationId: 'conv-123',
        agentId: 'agent-456',
        autoConnect: false
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('should have connect and disconnect functions', () => {
    const { result } = renderHook(
      () => useMessageStream({
        conversationId: 'conv-123',
        agentId: 'agent-456',
        autoConnect: false
      }),
      { wrapper: createWrapper() }
    );

    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
  });
});
