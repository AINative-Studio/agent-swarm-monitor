/**
 * React Query Hooks Test Suite
 *
 * Tests for conversation management hooks.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useConversations,
  useConversation,
  useMessages,
  useCreateConversation,
  useSendMessage,
  useDeleteConversation,
} from '@/hooks/useConversations';
import conversationService from '@/lib/conversation-service';
import type { ReactNode } from 'react';

// Mock the conversation service
vi.mock('@/lib/conversation-service', () => ({
  default: {
    listConversations: vi.fn(),
    getConversation: vi.fn(),
    listMessages: vi.fn(),
    createConversation: vi.fn(),
    sendMessage: vi.fn(),
    deleteConversation: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchInterval: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('Conversation Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useConversations', () => {
    it('should fetch conversations for an agent', async () => {
      const mockResponse = {
        conversations: [
          {
            id: 'conv-1',
            agentId: 'agent-1',
            title: 'Test Conversation',
            createdAt: '2024-03-08T10:00:00Z',
            updatedAt: '2024-03-08T10:30:00Z',
            messageCount: 5,
            lastMessageAt: '2024-03-08T10:30:00Z',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      };

      vi.mocked(conversationService.listConversations).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useConversations('agent-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.conversations).toHaveLength(1);
      expect(result.current.data?.conversations[0].id).toBe('conv-1');
    });

    it('should not fetch when agentId is undefined', () => {
      const { result } = renderHook(() => useConversations(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(conversationService.listConversations).not.toHaveBeenCalled();
    });
  });

  describe('useConversation', () => {
    it('should fetch a single conversation', async () => {
      const mockConversation = {
        id: 'conv-1',
        agentId: 'agent-1',
        title: 'Test Conversation',
        createdAt: '2024-03-08T10:00:00Z',
        updatedAt: '2024-03-08T10:30:00Z',
        messageCount: 10,
        lastMessageAt: '2024-03-08T10:30:00Z',
      };

      vi.mocked(conversationService.getConversation).mockResolvedValue(mockConversation);

      const { result } = renderHook(() => useConversation('conv-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.id).toBe('conv-1');
      expect(result.current.data?.title).toBe('Test Conversation');
    });

    it('should not fetch when conversationId is null', () => {
      const { result } = renderHook(() => useConversation(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(conversationService.getConversation).not.toHaveBeenCalled();
    });
  });

  describe('useMessages', () => {
    it('should fetch messages for a conversation', async () => {
      const mockResponse = {
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            role: 'user' as const,
            content: 'Hello',
            timestamp: '2024-03-08T10:00:00Z',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      };

      vi.mocked(conversationService.listMessages).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMessages('conv-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.messages).toHaveLength(1);
      expect(result.current.data?.messages[0].content).toBe('Hello');
    });
  });

  describe('useCreateConversation', () => {
    it('should create a new conversation', async () => {
      const mockConversation = {
        id: 'conv-new',
        agentId: 'agent-1',
        title: 'New Conversation',
        createdAt: '2024-03-08T11:00:00Z',
        updatedAt: '2024-03-08T11:00:00Z',
        messageCount: 0,
        lastMessageAt: null,
      };

      vi.mocked(conversationService.createConversation).mockResolvedValue(mockConversation);

      const { result } = renderHook(() => useCreateConversation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        agentId: 'agent-1',
        title: 'New Conversation',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.id).toBe('conv-new');
      expect(conversationService.createConversation).toHaveBeenCalledWith({
        agentId: 'agent-1',
        title: 'New Conversation',
      });
    });
  });

  describe('useSendMessage', () => {
    it('should send a message to a conversation', async () => {
      const mockMessage = {
        id: 'msg-new',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Test message',
        timestamp: '2024-03-08T12:00:00Z',
      };

      vi.mocked(conversationService.sendMessage).mockResolvedValue(mockMessage);

      const { result } = renderHook(() => useSendMessage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        conversationId: 'conv-1',
        data: {
          content: 'Test message',
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.content).toBe('Test message');
      expect(conversationService.sendMessage).toHaveBeenCalledWith('conv-1', {
        content: 'Test message',
      });
    });
  });

  describe('useDeleteConversation', () => {
    it('should delete a conversation', async () => {
      vi.mocked(conversationService.deleteConversation).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteConversation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        conversationId: 'conv-1',
        agentId: 'agent-1',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(conversationService.deleteConversation).toHaveBeenCalledWith('conv-1');
    });
  });
});
