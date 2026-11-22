/**
 * Type definitions for Conversation API
 *
 * Types matching the backend API schema for chat history integration
 */

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  agentId: string;
  channelId: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationFilters {
  agentId?: string;
  channelId?: string;
  status?: 'active' | 'archived' | 'deleted';
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export interface Pagination {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
  conversationId: string;
}

export interface SearchQuery {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface SearchResult {
  message: Message;
  score: number;
  highlights?: string[];
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  query: string;
}

export class ConversationError extends Error {
  constructor(
    public statusCode: number,
    public detail: string,
    public conversationId?: string
  ) {
    super(detail);
    this.name = 'ConversationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}
