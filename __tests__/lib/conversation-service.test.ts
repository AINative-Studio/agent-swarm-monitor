/**
 * ConversationService Test Suite
 *
 * Test-Driven Development (TDD) tests for ConversationService.
 * These tests are written BEFORE implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import conversationService from '@/lib/conversation-service';
import type {
  Conversation,
  ConversationListResponse,
  Message,
  MessageListResponse,
  CreateConversationRequest,
  SendMessageRequest,
} from '@/types/conversation';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('listConversations', () => {
    it('should fetch conversations without filters', async () => {
      const mockResponse: ConversationListResponse = {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await conversationService.listConversations();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/conversations?limit=50&offset=0'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].id).toBe('conv-1');
    });

    it('should filter conversations by agentId', async () => {
      const mockResponse: ConversationListResponse = {
        conversations: [],
        total: 0,
        limit: 50,
        offset: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await conversationService.listConversations('agent-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('agent_id=agent-123'),
        expect.any(Object)
      );
    });

    it('should support pagination parameters', async () => {
      const mockResponse: ConversationListResponse = {
        conversations: [],
        total: 100,
        limit: 20,
        offset: 40,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await conversationService.listConversations(undefined, 20, 40);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=40'),
        expect.any(Object)
      );
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      });

      await expect(conversationService.listConversations()).rejects.toThrow();
    });
  });

  describe('getConversation', () => {
    it('should fetch a single conversation by ID', async () => {
      const mockConversation: Conversation = {
        id: 'conv-1',
        agentId: 'agent-1',
        title: 'Test Conversation',
        createdAt: '2024-03-08T10:00:00Z',
        updatedAt: '2024-03-08T10:30:00Z',
        messageCount: 10,
        lastMessageAt: '2024-03-08T10:30:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConversation,
      });

      const result = await conversationService.getConversation('conv-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/conversations/conv-1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result.id).toBe('conv-1');
      expect(result.title).toBe('Test Conversation');
    });

    it('should handle not found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Conversation not found' }),
      });

      await expect(conversationService.getConversation('nonexistent')).rejects.toThrow();
    });
  });

  describe('createConversation', () => {
    it('should create a new conversation with title', async () => {
      const requestData: CreateConversationRequest = {
        agentId: 'agent-1',
        title: 'New Conversation',
      };

      const mockResponse: Conversation = {
        id: 'conv-new',
        agentId: 'agent-1',
        title: 'New Conversation',
        createdAt: '2024-03-08T11:00:00Z',
        updatedAt: '2024-03-08T11:00:00Z',
        messageCount: 0,
        lastMessageAt: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await conversationService.createConversation(requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/conversations'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('agent_id'),
        })
      );
      expect(result.id).toBe('conv-new');
      expect(result.agentId).toBe('agent-1');
    });

    it('should create conversation without title (auto-generated)', async () => {
      const requestData: CreateConversationRequest = {
        agentId: 'agent-1',
      };

      const mockResponse: Conversation = {
        id: 'conv-auto',
        agentId: 'agent-1',
        title: 'Conversation on 2024-03-08',
        createdAt: '2024-03-08T11:00:00Z',
        updatedAt: '2024-03-08T11:00:00Z',
        messageCount: 0,
        lastMessageAt: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await conversationService.createConversation(requestData);

      expect(result.id).toBe('conv-auto');
      expect(result.title).toBeTruthy();
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await conversationService.deleteConversation('conv-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/conversations/conv-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle deletion errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      });

      await expect(conversationService.deleteConversation('conv-1')).rejects.toThrow();
    });
  });

  describe('listMessages', () => {
    it('should fetch messages for a conversation', async () => {
      const mockResponse: MessageListResponse = {
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            role: 'user',
            content: 'Hello',
            timestamp: '2024-03-08T10:00:00Z',
          },
          {
            id: 'msg-2',
            conversationId: 'conv-1',
            role: 'assistant',
            content: 'Hi there!',
            timestamp: '2024-03-08T10:00:30Z',
          },
        ],
        total: 2,
        limit: 50,
        offset: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await conversationService.listMessages('conv-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/conversations/conv-1/messages'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[1].role).toBe('assistant');
    });

    it('should support message pagination', async () => {
      const mockResponse: MessageListResponse = {
        messages: [],
        total: 100,
        limit: 25,
        offset: 50,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await conversationService.listMessages('conv-1', 25, 50);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=25'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=50'),
        expect.any(Object)
      );
    });
  });

  describe('sendMessage', () => {
    it('should send a user message to a conversation', async () => {
      const messageData: SendMessageRequest = {
        content: 'What is the weather today?',
        role: 'user',
      };

      const mockResponse: Message = {
        id: 'msg-new',
        conversationId: 'conv-1',
        role: 'user',
        content: 'What is the weather today?',
        timestamp: '2024-03-08T12:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await conversationService.sendMessage('conv-1', messageData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/conversations/conv-1/messages'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('What is the weather today?'),
        })
      );
      expect(result.id).toBe('msg-new');
      expect(result.content).toBe('What is the weather today?');
    });

    it('should send message with metadata', async () => {
      const messageData: SendMessageRequest = {
        content: 'Test message',
        role: 'user',
        metadata: {
          source: 'web',
          ipAddress: '127.0.0.1',
        },
      };

      const mockResponse: Message = {
        id: 'msg-meta',
        conversationId: 'conv-1',
        role: 'user',
        content: 'Test message',
        timestamp: '2024-03-08T12:00:00Z',
        metadata: {
          source: 'web',
          ipAddress: '127.0.0.1',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await conversationService.sendMessage('conv-1', messageData);

      expect(result.metadata).toEqual({
        source: 'web',
        ipAddress: '127.0.0.1',
      });
    });

    it('should handle message sending errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Message content required' }),
      });

      const messageData: SendMessageRequest = {
        content: '',
      };

      await expect(
        conversationService.sendMessage('conv-1', messageData)
      ).rejects.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    it('should export a singleton instance', () => {
      expect(conversationService).toBeDefined();
      expect(typeof conversationService.listConversations).toBe('function');
      expect(typeof conversationService.getConversation).toBe('function');
      expect(typeof conversationService.createConversation).toBe('function');
      expect(typeof conversationService.deleteConversation).toBe('function');
      expect(typeof conversationService.listMessages).toBe('function');
      expect(typeof conversationService.sendMessage).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(conversationService.listConversations()).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('Request timeout');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      await expect(conversationService.listConversations()).rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(conversationService.listConversations()).rejects.toThrow('Invalid JSON');
    });
  });
});
