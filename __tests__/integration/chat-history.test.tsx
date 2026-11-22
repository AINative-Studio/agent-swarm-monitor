/**
 * Integration tests for chat history functionality
 * Tests complete workflow: create conversation, send messages, view history, search, delete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import conversationService from '@/lib/conversation-service';
import {
  useConversations,
  useConversation,
  useMessages,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
  conversationKeys,
} from '@/hooks/useConversations';
import {
  mockConversations,
  mockMessagesConv1,
  mockConversationListResponse,
  mockMessageListResponse,
  mockNewConversation,
  mockSendMessageResponse,
  createMockMessage,
} from '../fixtures/conversation-mocks';

// Mock the conversation service
vi.mock('@/lib/conversation-service', () => ({
  default: {
    listConversations: vi.fn(),
    getConversation: vi.fn(),
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    searchMessages: vi.fn(),
  },
}));

// Helper to create QueryClient with proper config for testing
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for faster tests
        gcTime: 0, // Disable cache garbage collection
        refetchInterval: false, // Disable auto-refetching for tests
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

// Wrapper component for React Query
function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('Chat History Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Scenario 1: Create and Send Messages', () => {
    it('should create a new conversation successfully', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.createConversation.mockResolvedValue(mockNewConversation);

      const { result } = renderHook(() => useCreateConversation(), {
        wrapper: createWrapper(queryClient),
      });

      // Execute mutation
      result.current.mutate({
        agentId: 'agent-123',
        title: 'New Conversation',
      });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify the conversation was created
      expect(result.current.data).toEqual(mockNewConversation);
      expect(mockService.createConversation).toHaveBeenCalledWith({
        agentId: 'agent-123',
        title: 'New Conversation',
      });
    });

    it('should send a message successfully', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.sendMessage.mockResolvedValue(mockSendMessageResponse);

      const { result } = renderHook(() => useSendMessage(), {
        wrapper: createWrapper(queryClient),
      });

      // Send message
      result.current.mutate({
        conversationId: 'conv-1',
        data: {
          content: 'This is a new message',
          role: 'user',
        },
      });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify message was sent
      expect(result.current.data).toEqual(mockSendMessageResponse);
      expect(mockService.sendMessage).toHaveBeenCalledWith('conv-1', {
        content: 'This is a new message',
        role: 'user',
      });
    });

    it('should invalidate queries after creating conversation', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.createConversation.mockResolvedValue(mockNewConversation);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateConversation(), {
        wrapper: createWrapper(queryClient),
      });

      // Create conversation
      result.current.mutate({
        agentId: 'agent-123',
        title: 'New Conversation',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify invalidation was called
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: conversationKeys.list('agent-123'),
      });
    });

    it('should invalidate queries after sending message', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.sendMessage.mockResolvedValue(mockSendMessageResponse);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSendMessage(), {
        wrapper: createWrapper(queryClient),
      });

      // Send message
      result.current.mutate({
        conversationId: 'conv-1',
        data: {
          content: 'Test message',
          role: 'user',
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify invalidations
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: conversationKeys.messages('conv-1'),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: conversationKeys.detail('conv-1'),
      });
    });
  });

  describe('Scenario 2: Conversation Navigation', () => {
    it('should load conversations for an agent', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.listConversations.mockResolvedValue(mockConversationListResponse);

      const { result } = renderHook(() => useConversations('agent-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify conversations loaded
      expect(result.current.data?.conversations).toHaveLength(3);
      expect(result.current.data?.total).toBe(3);
      expect(mockService.listConversations).toHaveBeenCalled();
    });

    it('should load messages for a selected conversation', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.listMessages.mockResolvedValue(mockMessageListResponse);

      const { result } = renderHook(() => useMessages('conv-1'), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify messages loaded
      expect(result.current.data?.messages).toHaveLength(5);
      expect(result.current.data?.messages).toEqual(mockMessagesConv1);
      expect(mockService.listMessages).toHaveBeenCalledWith('conv-1', undefined);
    });

    it('should support pagination for conversations', async () => {
      const mockService = vi.mocked(conversationService);
      const page1 = {
        conversations: mockConversations.slice(0, 2),
        total: 3,
        limit: 2,
        offset: 0,
      };

      mockService.listConversations.mockResolvedValue(page1);

      const { result } = renderHook(
        () => useConversations('agent-123', { limit: 2, offset: 0 }),
        {
          wrapper: createWrapper(queryClient),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.conversations).toHaveLength(2);
    });

    it('should refetch conversations manually', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.listConversations.mockResolvedValue(mockConversationListResponse);

      const { result } = renderHook(() => useConversations('agent-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockService.listConversations).toHaveBeenCalledTimes(1);

      // Manual refetch
      result.current.refetch();

      await waitFor(() => expect(mockService.listConversations).toHaveBeenCalledTimes(2));
    });
  });

  describe('Scenario 3: Error Handling', () => {
    it('should handle API error when fetching conversations', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.listConversations.mockRejectedValue(
        new Error('Failed to fetch conversations: 500 Internal server error')
      );

      const { result } = renderHook(() => useConversations('agent-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for error state
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('500');
    });

    it('should handle error when creating conversation', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.createConversation.mockRejectedValue(
        new Error('Failed to create conversation: 400 Bad request')
      );

      const { result } = renderHook(() => useCreateConversation(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        agentId: 'agent-123',
        title: 'Test',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('400');
    });

    it('should handle error when sending message', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.sendMessage.mockRejectedValue(
        new Error('Failed to send message: 500 Internal server error')
      );

      const { result } = renderHook(() => useSendMessage(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        conversationId: 'conv-1',
        data: {
          content: 'Test message',
          role: 'user',
        },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle 404 when conversation not found', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.getConversation.mockRejectedValue(
        new Error('Failed to fetch conversation: 404 Conversation not found')
      );

      const { result } = renderHook(() => useConversation('invalid-id'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toContain('404');
    });

    it('should allow retry after error', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.listConversations
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockConversationListResponse);

      const { result } = renderHook(() => useConversations('agent-123'), {
        wrapper: createWrapper(queryClient),
      });

      // First attempt fails
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Retry
      result.current.refetch();

      // Second attempt succeeds
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.conversations).toHaveLength(3);
    });
  });

  describe('Scenario 4: Delete Conversation', () => {
    it('should delete a conversation successfully', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.deleteConversation.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteConversation(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        conversationId: 'conv-1',
        agentId: 'agent-123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockService.deleteConversation).toHaveBeenCalledWith('conv-1');
    });

    it('should invalidate queries after deleting conversation', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.deleteConversation.mockResolvedValue(undefined);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const removeSpy = vi.spyOn(queryClient, 'removeQueries');

      const { result } = renderHook(() => useDeleteConversation(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        conversationId: 'conv-1',
        agentId: 'agent-123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify invalidation and removal
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: conversationKeys.list('agent-123'),
      });
      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: conversationKeys.detail('conv-1'),
      });
      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: conversationKeys.messages('conv-1'),
      });
    });
  });

  describe('Query Key Management', () => {
    it('should generate correct query keys', () => {
      expect(conversationKeys.all).toEqual(['conversations']);
      expect(conversationKeys.lists()).toEqual(['conversations', 'list']);
      expect(conversationKeys.list('agent-123')).toEqual([
        'conversations',
        'list',
        'agent-123',
      ]);
      expect(conversationKeys.detail('conv-1')).toEqual([
        'conversations',
        'detail',
        'conv-1',
      ]);
      expect(conversationKeys.messages('conv-1')).toEqual([
        'conversations',
        'messages',
        'conv-1',
      ]);
      expect(conversationKeys.search('conv-1', 'test')).toEqual([
        'conversations',
        'search',
        'conv-1',
        'test',
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conversation list', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.listConversations.mockResolvedValue({
        conversations: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      const { result } = renderHook(() => useConversations('agent-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.conversations).toHaveLength(0);
      expect(result.current.data?.total).toBe(0);
    });

    it('should handle empty message list', async () => {
      const mockService = vi.mocked(conversationService);
      mockService.listMessages.mockResolvedValue({
        messages: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      const { result } = renderHook(() => useMessages('conv-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.messages).toHaveLength(0);
    });

    it('should not fetch when agentId is undefined', () => {
      const mockService = vi.mocked(conversationService);

      const { result } = renderHook(() => useConversations(undefined), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.status).toBe('pending');
      expect(mockService.listConversations).not.toHaveBeenCalled();
    });

    it('should not fetch when conversationId is null', () => {
      const mockService = vi.mocked(conversationService);

      const { result } = renderHook(() => useMessages(null), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.status).toBe('pending');
      expect(mockService.listMessages).not.toHaveBeenCalled();
    });

    it('should handle conversation with no messages', async () => {
      const mockService = vi.mocked(conversationService);
      const emptyConversation = {
        ...mockConversations[0],
        messageCount: 0,
      };
      mockService.getConversation.mockResolvedValue(emptyConversation);

      const { result } = renderHook(() => useConversation('conv-empty'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.messageCount).toBe(0);
    });
  });

  describe('Workflow Integration', () => {
    it('should complete full conversation workflow', async () => {
      const mockService = vi.mocked(conversationService);

      // Setup mocks
      mockService.createConversation.mockResolvedValue(mockNewConversation);
      mockService.sendMessage.mockResolvedValue(mockSendMessageResponse);
      mockService.listMessages.mockResolvedValue({
        messages: [mockSendMessageResponse],
        total: 1,
        limit: 50,
        offset: 0,
      });
      mockService.deleteConversation.mockResolvedValue(undefined);

      // Step 1: Create conversation
      const { result: createResult } = renderHook(() => useCreateConversation(), {
        wrapper: createWrapper(queryClient),
      });

      createResult.current.mutate({
        agentId: 'agent-123',
        title: 'Test Workflow',
      });

      await waitFor(() => expect(createResult.current.isSuccess).toBe(true));
      const newConvId = createResult.current.data?.id;
      expect(newConvId).toBeDefined();

      // Step 2: Send message
      const { result: sendResult } = renderHook(() => useSendMessage(), {
        wrapper: createWrapper(queryClient),
      });

      sendResult.current.mutate({
        conversationId: newConvId!,
        data: {
          content: 'Hello!',
          role: 'user',
        },
      });

      await waitFor(() => expect(sendResult.current.isSuccess).toBe(true));

      // Step 3: Load messages
      const { result: messagesResult } = renderHook(
        () => useMessages(newConvId!),
        {
          wrapper: createWrapper(queryClient),
        }
      );

      await waitFor(() => expect(messagesResult.current.isSuccess).toBe(true));
      expect(messagesResult.current.data?.messages.length).toBeGreaterThan(0);

      // Step 4: Delete conversation
      const { result: deleteResult } = renderHook(() => useDeleteConversation(), {
        wrapper: createWrapper(queryClient),
      });

      deleteResult.current.mutate({
        conversationId: newConvId!,
        agentId: 'agent-123',
      });

      await waitFor(() => expect(deleteResult.current.isSuccess).toBe(true));

      // Verify all steps completed
      expect(mockService.createConversation).toHaveBeenCalled();
      expect(mockService.sendMessage).toHaveBeenCalled();
      expect(mockService.listMessages).toHaveBeenCalled();
      expect(mockService.deleteConversation).toHaveBeenCalled();
    });
  });
});
