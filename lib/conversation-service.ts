/**
 * ConversationService
 *
 * Singleton service for managing conversations and messages.
 * Handles all conversation-related API calls with proper error handling.
 */

import type {
  Conversation,
  ConversationListResponse,
  Message,
  MessageListResponse,
  CreateConversationRequest,
  SendMessageRequest,
  SemanticSearchRequest,
  SemanticSearchResponse,
  SearchMessage,
  SearchFilters,
  SearchMessagesResponse,
  SearchMessagesOptions,
} from '@/types/conversation';
import apiClient from './api-client';

class ConversationService {
  private basePath = '/conversations';

  /**
   * List all conversations with optional filtering and pagination
   * @param agentId - Optional agent ID to filter conversations
   * @param limit - Maximum number of conversations to return
   * @param offset - Number of conversations to skip
   * @returns Paginated list of conversations
   */
  async listConversations(
    agentId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationListResponse> {
    const params: Record<string, string> = {
      limit: String(limit),
      offset: String(offset),
    };
    if (agentId) params.agent_id = agentId;

    return apiClient.get<ConversationListResponse>(this.basePath, params);
  }

  /**
   * Get a single conversation by ID
   * @param conversationId - The conversation ID
   * @returns The conversation details
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    return apiClient.get<Conversation>(`${this.basePath}/${conversationId}`);
  }

  /**
   * Create a new conversation
   * @param data - Conversation creation request with agentId and optional title
   * @returns The created conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    return apiClient.post<Conversation>(this.basePath, data);
  }

  /**
   * Delete a conversation by ID
   * @param conversationId - The conversation ID to delete
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${conversationId}`);
  }

  /**
   * List all messages in a conversation with pagination
   * @param conversationId - The conversation ID
   * @param limit - Maximum number of messages to return
   * @param offset - Number of messages to skip
   * @returns Paginated list of messages
   */
  async listMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessageListResponse> {
    const params: Record<string, string> = {
      limit: String(limit),
      offset: String(offset),
    };

    return apiClient.get<MessageListResponse>(
      `${this.basePath}/${conversationId}/messages`,
      params
    );
  }

  /**
   * Send a message to a conversation
   * @param conversationId - The conversation ID
   * @param data - Message content and optional metadata
   * @returns The created message
   */
  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<Message> {
    return apiClient.post<Message>(`${this.basePath}/${conversationId}/messages`, data);
  }

  /**
   * Search messages using semantic search (original method)
   * @param request - Search parameters including query and filters
   * @returns Search results with relevance scores
   */
  async searchMessagesOld(request: SemanticSearchRequest): Promise<SemanticSearchResponse> {
    return apiClient.post<SemanticSearchResponse>(`${this.basePath}/search`, request);
  }

  /**
   * Search messages across all conversations with filters.
   *
   * Shaped to match the eventual backend endpoint `GET /conversations/search?q=&semantic=`
   * (see issue #35). `options.semantic` toggles between semantic (natural-language /
   * embedding-based) search and plain keyword search — surfaced in the UI as the
   * "Semantic Search" switch in SemanticSearchUI.
   *
   * @param query - Search query string
   * @param filters - Optional filters (agent, date range, etc.)
   * @param options - Search mode options (semantic vs keyword)
   * @returns Search results with highlighted content and relevance scores
   */
  async searchMessages(
    query: string,
    filters?: SearchFilters,
    options?: SearchMessagesOptions
  ): Promise<SearchMessagesResponse> {
    const semantic = options?.semantic ?? true;
    const limit = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    // TODO: Replace with real API call when backend endpoint is ready
    // const params = new URLSearchParams();
    // params.append('q', query);
    // params.append('semantic', String(semantic));
    // params.append('limit', String(limit));
    // params.append('offset', String(offset));
    // if (filters?.agentId) params.append('agentId', filters.agentId);
    // if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    // if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    // if (filters?.role) params.append('role', filters.role);
    // if (filters?.conversationId) params.append('conversationId', filters.conversationId);
    //
    // return apiClient.get<SearchMessagesResponse>(`${this.basePath}/search`, Object.fromEntries(params));

    // Mock implementation for testing. Keyword mode additionally requires an exact
    // (case-insensitive) substring match, approximating the real difference between
    // semantic (similarity-based) and keyword (literal) search — semantic mode returns
    // the same curated mock matches regardless of exact phrasing.
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockResults: SearchMessage[] = [];
    const lowerQuery = query.toLowerCase();

    // Simulate search results based on query
    if (lowerQuery.includes('error')) {
      mockResults.push({
        id: 'msg-1',
        conversationId: 'conv-1',
        conversationTitle: 'Debug Session',
        content: 'This is about error handling in the API',
        role: 'user',
        agentName: 'Dev-Bot',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        relevanceScore: 0.95,
        highlightedContent: `This is about <mark>error</mark> handling in the API`,
      });
      mockResults.push({
        id: 'msg-2',
        conversationId: 'conv-1',
        conversationTitle: 'Debug Session',
        content: 'Let me help with error handling',
        role: 'assistant',
        agentName: 'Dev-Bot',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        relevanceScore: 0.88,
        highlightedContent: `Let me help with <mark>error</mark> handling`,
      });
    }

    if (lowerQuery.includes('api')) {
      mockResults.push({
        id: 'msg-3',
        conversationId: 'conv-2',
        conversationTitle: 'API Integration',
        content: 'Working on REST API integration with authentication',
        role: 'user',
        agentName: 'Backend-Bot',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        relevanceScore: 0.92,
        highlightedContent: `Working on REST <mark>API</mark> integration with authentication`,
      });
    }

    if (lowerQuery.includes('deployment')) {
      mockResults.push({
        id: 'msg-4',
        conversationId: 'conv-3',
        conversationTitle: 'DevOps Setup',
        content: 'Deployment pipeline configuration for production',
        role: 'user',
        agentName: 'DevOps-Bot',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        relevanceScore: 0.85,
        highlightedContent: `<mark>Deployment</mark> pipeline configuration for production`,
      });
    }

    // Apply filters
    let filteredResults = mockResults;

    if (!semantic) {
      // Keyword mode: require a literal (case-insensitive) substring match of the full
      // query against message content, rather than the broader topic-based matching
      // used above to simulate semantic/similarity search.
      filteredResults = filteredResults.filter((r) =>
        r.content.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters?.agentId) {
      filteredResults = filteredResults.filter((r) => r.agentName === filters.agentId);
    }

    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredResults = filteredResults.filter(
        (r) => new Date(r.timestamp) >= fromDate
      );
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredResults = filteredResults.filter((r) => new Date(r.timestamp) <= toDate);
    }

    if (filters?.role) {
      filteredResults = filteredResults.filter((r) => r.role === filters.role);
    }

    if (filters?.conversationId) {
      filteredResults = filteredResults.filter(
        (r) => r.conversationId === filters.conversationId
      );
    }

    // Sort by relevance score, highest first, before paginating.
    const sortedResults = [...filteredResults].sort(
      (a, b) => b.relevanceScore - a.relevanceScore
    );

    const total = sortedResults.length;
    const page = sortedResults.slice(offset, offset + limit);

    return {
      results: page,
      total,
      limit,
      offset,
    };
  }
}

// Singleton instance
const conversationService = new ConversationService();

export default conversationService;

// Re-export types for convenience
export type {
  CreateConversationRequest,
  SendMessageRequest,
  SemanticSearchRequest,
  SearchFilters,
};
