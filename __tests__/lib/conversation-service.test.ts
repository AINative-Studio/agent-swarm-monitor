import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConversationService } from '@/lib/conversation-service';
import {
  ConversationError,
  NetworkError,
  type Conversation,
  type Message,
  type ConversationListResponse,
  type MessageListResponse,
  type SearchResults,
} from '@/lib/conversation-types';

describe('ConversationService', () => {
  let service: ConversationService;
  const mockApiUrl = 'http://localhost:8000/api/v1';
  const mockAuthToken = 'test-token-123';

  beforeEach(() => {
    service = new ConversationService(mockApiUrl, mockAuthToken);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API URL and auth token', () => {
      expect(service).toBeInstanceOf(ConversationService);
    });

    it('should handle trailing slash in API URL', () => {
      const serviceWithSlash = new ConversationService('http://localhost:8000/api/v1/', mockAuthToken);
      expect(serviceWithSlash).toBeInstanceOf(ConversationService);
    });
  });

  describe('listConversations', () => {
    it('should fetch conversations without filters', async () => {
      const mockResponse: ConversationListResponse = {
        conversations: [
          {
            id: 'conv-1',
            agentId: 'agent-1',
            channelId: 'channel-1',
            title: 'Test Conversation',
            status: 'active',
            messageCount: 10,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T12:00:00Z',
            lastMessageAt: '2024-01-01T12:00:00Z',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await service.listConversations({});

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/conversations',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should apply filters as query parameters', async () => {
      const mockResponse: ConversationListResponse = {
        conversations: [],
        total: 0,
        limit: 20,
        offset: 10,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      await service.listConversations({
        agentId: 'agent-1',
        status: 'active',
        limit: 20,
        offset: 10,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('?agent_id=agent-1'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=10'),
        expect.any(Object)
      );
    });

    it('should handle 404 error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'No conversations found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      try {
        await service.listConversations({});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConversationError);
        expect((error as ConversationError).statusCode).toBe(404);
        expect((error as ConversationError).detail).toBe('No conversations found');
      }
    });

    it('should handle 500 server error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(service.listConversations({})).rejects.toThrow(ConversationError);
    });

    it('should handle network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failed'));

      await expect(service.listConversations({})).rejects.toThrow(NetworkError);
    });
  });

  describe('getConversation', () => {
    it('should fetch a single conversation by ID', async () => {
      const mockConversation: Conversation = {
        id: 'conv-1',
        agentId: 'agent-1',
        channelId: 'channel-1',
        title: 'Test Conversation',
        status: 'active',
        messageCount: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockConversation), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await service.getConversation('conv-1');

      expect(result).toEqual(mockConversation);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/conversations/conv-1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should handle 404 for non-existent conversation', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Conversation not found' }), { status: 404 })
      );

      await expect(service.getConversation('non-existent')).rejects.toThrow(ConversationError);
      await expect(service.getConversation('non-existent')).rejects.toMatchObject({
        statusCode: 404,
        conversationId: 'non-existent',
      });
    });
  });

  describe('getMessages', () => {
    it('should fetch paginated messages for a conversation', async () => {
      const mockResponse: MessageListResponse = {
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            role: 'user',
            content: 'Hello',
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            id: 'msg-2',
            conversationId: 'conv-1',
            role: 'assistant',
            content: 'Hi there',
            timestamp: '2024-01-01T00:01:00Z',
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
        conversationId: 'conv-1',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await service.getMessages('conv-1', { limit: 10, offset: 0 });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/conversations/conv-1/messages'),
        expect.any(Object)
      );
    });

    it('should apply pagination parameters', async () => {
      const mockResponse: MessageListResponse = {
        messages: [],
        total: 100,
        limit: 50,
        offset: 50,
        conversationId: 'conv-1',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      await service.getMessages('conv-1', { limit: 50, offset: 50, order: 'desc' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=50'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('order=desc'),
        expect.any(Object)
      );
    });

    it('should use default pagination if not provided', async () => {
      const mockResponse: MessageListResponse = {
        messages: [],
        total: 0,
        limit: 10,
        offset: 0,
        conversationId: 'conv-1',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      await service.getMessages('conv-1', {});

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/conversations/conv-1/messages',
        expect.any(Object)
      );
    });

    it('should handle 404 for non-existent conversation', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Conversation not found' }), { status: 404 })
      );

      await expect(service.getMessages('non-existent', {})).rejects.toThrow(ConversationError);
    });
  });

  describe('searchConversation', () => {
    it('should perform semantic search on conversation', async () => {
      const mockResponse: SearchResults = {
        results: [
          {
            message: {
              id: 'msg-1',
              conversationId: 'conv-1',
              role: 'user',
              content: 'How do I deploy to production?',
              timestamp: '2024-01-01T00:00:00Z',
            },
            score: 0.95,
            highlights: ['deploy', 'production'],
          },
        ],
        total: 1,
        query: 'deployment',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await service.searchConversation('conv-1', 'deployment');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/conversations/conv-1/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-123',
          }),
          body: JSON.stringify({ query: 'deployment' }),
        })
      );
    });

    it('should accept optional search parameters', async () => {
      const mockResponse: SearchResults = {
        results: [],
        total: 0,
        query: 'test',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      await service.searchConversation('conv-1', 'test', { limit: 5, threshold: 0.8 });

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body).toEqual({ query: 'test', limit: 5, threshold: 0.8 });
    });

    it('should handle empty search results', async () => {
      const mockResponse: SearchResults = {
        results: [],
        total: 0,
        query: 'nonexistent',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await service.searchConversation('conv-1', 'nonexistent');

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle 404 for non-existent conversation', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Conversation not found' }), { status: 404 })
      );

      await expect(service.searchConversation('non-existent', 'query')).rejects.toThrow(ConversationError);
    });
  });

  describe('archiveConversation', () => {
    it('should archive a conversation', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 204 })
      );

      await expect(service.archiveConversation('conv-1')).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/conversations/conv-1/archive',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should handle 404 for non-existent conversation', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Conversation not found' }), { status: 404 })
      );

      await expect(service.archiveConversation('non-existent')).rejects.toThrow(ConversationError);
      await expect(service.archiveConversation('non-existent')).rejects.toMatchObject({
        statusCode: 404,
        conversationId: 'non-existent',
      });
    });

    it('should handle 409 conflict (already archived)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Already archived' }), { status: 409 })
      );

      await expect(service.archiveConversation('conv-1')).rejects.toThrow(ConversationError);
      await expect(service.archiveConversation('conv-1')).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 204 })
      );

      await expect(service.deleteConversation('conv-1')).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/conversations/conv-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should handle 404 for non-existent conversation', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Conversation not found' }), { status: 404 })
      );

      await expect(service.deleteConversation('non-existent')).rejects.toThrow(ConversationError);
      await expect(service.deleteConversation('non-existent')).rejects.toMatchObject({
        statusCode: 404,
        conversationId: 'non-existent',
      });
    });

    it('should handle 403 forbidden (insufficient permissions)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Forbidden' }), { status: 403 })
      );

      await expect(service.deleteConversation('conv-1')).rejects.toThrow(ConversationError);
      await expect(service.deleteConversation('conv-1')).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('error handling', () => {
    it('should wrap network errors in NetworkError', async () => {
      const networkError = new Error('Failed to fetch');
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(networkError);

      try {
        await service.listConversations({});
        expect.fail('Should have thrown NetworkError');
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        expect((error as NetworkError).originalError).toBe(networkError);
      }
    });

    it('should handle malformed JSON response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Invalid JSON', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(service.listConversations({})).rejects.toThrow();
    });

    it('should include conversationId in errors when available', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Not found' }), { status: 404 })
      );

      try {
        await service.getConversation('conv-123');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConversationError);
        expect((error as ConversationError).conversationId).toBe('conv-123');
      }
    });

    it('should handle 401 unauthorized error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Unauthorized' }), { status: 401 })
      );

      await expect(service.listConversations({})).rejects.toMatchObject({
        statusCode: 401,
        detail: 'Unauthorized',
      });
    });
  });

  describe('request headers', () => {
    it('should include authorization header in all requests', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await service.listConversations({});

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should include content-type header in all requests', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await service.listConversations({});

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('query parameter building', () => {
    it('should omit undefined filter values', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ conversations: [], total: 0, limit: 10, offset: 0 }), { status: 200 })
      );

      await service.listConversations({
        agentId: 'agent-1',
        channelId: undefined,
        status: undefined,
      });

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url).toContain('agent_id=agent-1');
      expect(url).not.toContain('channel_id');
      expect(url).not.toContain('status');
    });

    it('should handle empty filter object', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ conversations: [], total: 0, limit: 10, offset: 0 }), { status: 200 })
      );

      await service.listConversations({});

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url).toBe('http://localhost:8000/api/v1/conversations');
    });

    it('should properly encode special characters in query params', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ conversations: [], total: 0, limit: 10, offset: 0 }), { status: 200 })
      );

      await service.listConversations({
        agentId: 'agent with spaces',
      });

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url).toContain('agent_id=agent+with+spaces');
    });
  });
});
