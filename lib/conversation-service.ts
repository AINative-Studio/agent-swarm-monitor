/**
 * Conversation Service
 *
 * API client for chat history integration with the OpenClaw backend.
 * Provides methods to list, fetch, search, archive, and delete conversations.
 */

import {
  ConversationError,
  NetworkError,
  type Conversation,
  type ConversationFilters,
  type ConversationListResponse,
  type MessageListResponse,
  type Pagination,
  type SearchResults,
} from './conversation-types';

export class ConversationService {
  private readonly apiUrl: string;
  private readonly authToken: string;

  constructor(apiUrl: string, authToken: string) {
    // Remove trailing slash if present
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    this.authToken = authToken;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = `${this.apiUrl}${path}`;

    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert object keys from camelCase to snake_case
   */
  private toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[this.camelToSnake(key)] = value;
    }
    return result;
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
    };
  }

  /**
   * Handle HTTP response
   */
  private async handleResponse<T>(response: Response, conversationId?: string): Promise<T> {
    // Handle 204 No Content before trying to read body
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse response body once
    let body: any;
    try {
      body = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new ConversationError(response.status, `HTTP ${response.status}`, conversationId);
      }
      throw error;
    }

    // Handle error responses
    if (!response.ok) {
      const detail = body?.detail || `HTTP ${response.status}`;
      throw new ConversationError(response.status, detail, conversationId);
    }

    return body;
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(
    url: string,
    options: RequestInit,
    conversationId?: string
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(response, conversationId);
    } catch (error) {
      if (error instanceof ConversationError) {
        throw error;
      }
      throw new NetworkError(
        'Network request failed',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * List conversations with optional filters
   */
  async listConversations(filters: ConversationFilters): Promise<ConversationListResponse> {
    const params = this.toSnakeCase(filters as Record<string, unknown>) as Record<string, string>;
    const url = this.buildUrl('/conversations', params);

    return this.request<ConversationListResponse>(url, {
      method: 'GET',
    });
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(id: string): Promise<Conversation> {
    const url = this.buildUrl(`/conversations/${id}`);

    return this.request<Conversation>(url, {
      method: 'GET',
    }, id);
  }

  /**
   * Get paginated messages for a conversation
   */
  async getMessages(
    conversationId: string,
    pagination: Pagination
  ): Promise<MessageListResponse> {
    const params = this.toSnakeCase(pagination as Record<string, unknown>) as Record<string, string>;
    const url = this.buildUrl(`/conversations/${conversationId}/messages`, params);

    return this.request<MessageListResponse>(url, {
      method: 'GET',
    }, conversationId);
  }

  /**
   * Perform semantic search on conversation messages
   */
  async searchConversation(
    conversationId: string,
    query: string,
    options?: { limit?: number; threshold?: number }
  ): Promise<SearchResults> {
    const url = this.buildUrl(`/conversations/${conversationId}/search`);

    const body = {
      query,
      ...(options?.limit !== undefined && { limit: options.limit }),
      ...(options?.threshold !== undefined && { threshold: options.threshold }),
    };

    return this.request<SearchResults>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      conversationId
    );
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(id: string): Promise<void> {
    const url = this.buildUrl(`/conversations/${id}/archive`);

    return this.request<void>(
      url,
      {
        method: 'PUT',
      },
      id
    );
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    const url = this.buildUrl(`/conversations/${id}`);

    return this.request<void>(
      url,
      {
        method: 'DELETE',
      },
      id
    );
  }
}
